import * as sdk from '@kiltprotocol/sdk-js'
import {
  IS_IN_BLOCK,
  submitSignedTx,
} from '@kiltprotocol/sdk-js/build/blockchain/Blockchain'
import { IMetadata } from '@kiltprotocol/sdk-js/build/types/CTypeMetadata'
import { ICTypeSchema } from '@kiltprotocol/sdk-js/build/types/CType'
import BN from 'bn.js'
import {
  ROOT_SEED,
  CTYPE,
  CTYPE_METADATA,
  DELEGATION_ROOT_ID,
} from './data/anticov.json'
import { IMyIdentity } from '../../types/Contact'
import CTypeRepository from '../../services/CtypeRepository'
import { BalanceUtilities } from '../../services/BalanceUtilities'
import MessageRepository from '../../services/MessageRepository'
import DelegationsService from '../../services/DelegationsService'
import FeedbackService, {
  notifySuccess,
  notifyFailure,
} from '../../services/FeedbackService'

const ctype = sdk.CType.fromSchema(CTYPE.schema as ICTypeSchema)
const metadata: IMetadata = CTYPE_METADATA

interface ISetup {
  root: sdk.Identity
  delegationRoot: sdk.DelegationRootNode
}

let cachedSetup: ISetup

async function setup(): Promise<ISetup> {
  if (!cachedSetup) {
    const root = await sdk.Identity.buildFromMnemonic(ROOT_SEED)

    const delegationRoot = new sdk.DelegationRootNode(
      DELEGATION_ROOT_ID,
      ctype.hash,
      root.address
    )

    cachedSetup = {
      root,
      delegationRoot,
    }
  }

  return { root: cachedSetup.root, delegationRoot: cachedSetup.delegationRoot }
}

async function newDelegation(delegate: IMyIdentity): Promise<void> {
  const { root, delegationRoot } = await setup()

  const delegationNode = new sdk.DelegationNode(
    sdk.UUID.generate(),
    delegationRoot.id,
    delegate.identity.address,
    [sdk.Permission.ATTEST]
  )
  const signature = delegate.identity.signStr(delegationNode.generateHash())
  const tx = await delegationNode.store(root, signature)
  await submitSignedTx(tx, { resolveOn: IS_IN_BLOCK })
  notifySuccess(`Delegation successfully created for ${delegate.metaData.name}`)
  await DelegationsService.importDelegation(
    delegationNode.id,
    'AntiCov Attester',
    false
  )
  notifySuccess(`Delegation imported. Switch to Delegation Tab to see it.`)
  const messageBody: sdk.MessageBody = {
    type: sdk.MessageBodyType.INFORM_CREATE_DELEGATION,
    content: { delegationId: delegationNode.id, isPCR: false },
  }
  await MessageRepository.sendToAddresses(
    [delegate.identity.address],
    messageBody
  )
}

async function verifyOrAddCtypeAndRoot(): Promise<void> {
  const { root, delegationRoot } = await setup()
  if (!(await ctype.verifyStored())) {
    const tx = await ctype.store(root)
    await submitSignedTx(tx, { resolveOn: IS_IN_BLOCK })
    CTypeRepository.register({
      cType: ctype,
      metaData: { metadata, ctypeHash: ctype.hash },
    })
    notifySuccess(`CTYPE ${metadata.title.default} successfully created.`)
  }
  // delegationRoot.verify() is unreliable when using the currently released mashnet-node & sdk
  // workaround is checking the ctype hash of the query result; it is 0x000... if it doesn't exist on chain
  const queriedRoot = await sdk.DelegationRootNode.query(delegationRoot.id)
  if (queriedRoot?.cTypeHash !== ctype.hash) {
    const tx = await delegationRoot.store(root)
    await submitSignedTx(tx, { resolveOn: IS_IN_BLOCK })
    const messageBody: sdk.MessageBody = {
      type: sdk.MessageBodyType.INFORM_CREATE_DELEGATION,
      content: { delegationId: delegationRoot.id, isPCR: false },
    }
    notifySuccess(`AntiCov Delegation Root successfully created.`)
    // sending root owner message for importing the root
    const message = new sdk.Message(messageBody, root, root.getPublicIdentity())
    await MessageRepository.dispatchMessage(message)
    notifySuccess(`Sent Delegation Root to AntiCov root authority.`)
  }
}

export async function setupAndDelegate(delegate: IMyIdentity): Promise<void> {
  const { root } = await setup()
  const blockUi = FeedbackService.addBlockUi({
    headline: 'Creating AntiCov Delegation',
  })
  try {
    blockUi.updateMessage('Transferring funds to AntiCov authority')
    await new Promise(resolve => {
      BalanceUtilities.makeTransfer(delegate, root.address, new BN(4), () =>
        resolve()
      )
    })
    blockUi.updateMessage('Setting up CType and Root Delegation')
    await verifyOrAddCtypeAndRoot()
    blockUi.updateMessage('Creating Delegation Node for current identity')
    await newDelegation(delegate)
  } catch (error) {
    notifyFailure(`Failed to set up Delegation Node: ${error}`)
  }
  blockUi.remove()
}

export default setupAndDelegate
