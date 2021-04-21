import Kilt, {
  DelegationRootNode,
  Identity,
  DelegationNode,
  BlockchainUtils,
} from '@kiltprotocol/sdk-js'
import {
  MessageBody,
  MessageBodyType,
  Permission,
  IMetadata,
  ICTypeSchema,
} from '@kiltprotocol/types'
import { UUID } from '@kiltprotocol/utils'
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

const { IS_IN_BLOCK } = BlockchainUtils

const ctype = Kilt.CType.fromSchema(CTYPE.schema as ICTypeSchema)
const metadata: IMetadata = CTYPE_METADATA

interface ISetup {
  root: Identity
  delegationRoot: DelegationRootNode
}

let cachedSetup: ISetup

function setup(): ISetup {
  if (!cachedSetup) {
    const root = Identity.buildFromMnemonic(ROOT_SEED, {
      signingKeyPairType: 'ed25519',
    })

    const delegationRoot = new DelegationRootNode(
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
  const { root, delegationRoot } = setup()

  const delegationNode = new DelegationNode(
    UUID.generate(),
    delegationRoot.id,
    delegate.identity.address,
    [Permission.ATTEST]
  )
  const signature = delegate.identity.signStr(delegationNode.generateHash())
  const tx = await delegationNode.store(signature)
  await BlockchainUtils.signAndSubmitTx(tx, root, { resolveOn: IS_IN_BLOCK })
  notifySuccess(`Delegation successfully created for ${delegate.metaData.name}`)
  await DelegationsService.importDelegation(
    delegationNode.id,
    'AntiCov Attester',
    false
  )
  notifySuccess(`Delegation imported. Switch to Delegation Tab to see it.`)
  const messageBody: MessageBody = {
    type: MessageBodyType.INFORM_CREATE_DELEGATION,
    content: { delegationId: delegationNode.id, isPCR: false },
  }
  await MessageRepository.sendToAddresses(
    [delegate.identity.address],
    messageBody
  )
}

async function verifyOrAddCtypeAndRoot(): Promise<void> {
  const { root, delegationRoot } = setup()
  if (!(await ctype.verifyStored())) {
    const tx = await ctype.store()
    await BlockchainUtils.signAndSubmitTx(tx, root, {
      resolveOn: IS_IN_BLOCK,
    })
    CTypeRepository.register({
      cType: ctype,
      metaData: { metadata, ctypeHash: ctype.hash },
    })
    notifySuccess(`CTYPE ${metadata.title.default} successfully created.`)
  }
  // delegationRoot.verify() is unreliable when using the currently released mashnet-node &   // workaround is checking the ctype hash of the query result; it is 0x000... if it doesn't exist on chain
  const queriedRoot = await DelegationRootNode.query(delegationRoot.id)
  if (queriedRoot?.cTypeHash !== ctype.hash) {
    const tx = await delegationRoot.store()
    await BlockchainUtils.signAndSubmitTx(tx, root, {
      resolveOn: IS_IN_BLOCK,
    })
    const messageBody: MessageBody = {
      type: MessageBodyType.INFORM_CREATE_DELEGATION,
      content: { delegationId: delegationRoot.id, isPCR: false },
    }
    notifySuccess(`AntiCov Delegation Root successfully created.`)
    // sending root owner message for importing the root
    const message = new Kilt.Message(
      messageBody,
      root,
      root.getPublicIdentity()
    )
    await MessageRepository.dispatchMessage(message)
    notifySuccess(`Sent Delegation Root to AntiCov root authority.`)
  }
}

export async function setupAndDelegate(delegate: IMyIdentity): Promise<void> {
  const { root } = setup()
  const blockUi = FeedbackService.addBlockUi({
    headline: 'Creating AntiCov Delegation',
  })
  try {
    blockUi.updateMessage('Transferring funds to AntiCov authority')
    await new Promise<void>(resolve => {
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
