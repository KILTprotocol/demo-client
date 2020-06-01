import * as sdk from '@kiltprotocol/sdk-js'
import { IMetadata } from '@kiltprotocol/sdk-js/build/types/CTypeMetadata'
import ANTICOV_CONFIG from '../components/DevTools/data/anticov.json'
import { IMyIdentity } from '../types/Contact'
import CTypeRepository from '../services/CtypeRepository'
import { BalanceUtilities } from '../services/BalanceUtilities'
import MessageRepository from '../services/MessageRepository'
import DelegationsService from '../services/DelegationsService'

const root = sdk.Identity.buildFromMnemonic(ANTICOV_CONFIG.ROOT_SEED)

const ctype = sdk.CType.fromCType(ANTICOV_CONFIG.CTYPE as sdk.ICType)
ctype.owner = root.address
const metadata: IMetadata = ANTICOV_CONFIG.CTYPE_METADATA

const delegationRoot = new sdk.DelegationRootNode(
  ANTICOV_CONFIG.DELEGATION_ROOT_ID,
  ctype.hash,
  root.address
)

async function newDelegation(delegee: IMyIdentity): Promise<void> {
  const delegationNode = new sdk.DelegationNode(
    sdk.UUID.generate(),
    delegationRoot.id,
    delegee.identity.address,
    [sdk.Permission.ATTEST]
  )
  const signature = delegee.identity.signStr(delegationNode.generateHash())
  await delegationNode.store(root, signature)
  await DelegationsService.importDelegation(
    delegationNode.id,
    'AntiCov Attester',
    false
  )
  const messageBody: sdk.MessageBody = {
    type: sdk.MessageBodyType.INFORM_CREATE_DELEGATION,
    content: { delegationId: delegationNode.id, isPCR: false },
  }
  await MessageRepository.sendToAddresses(
    [delegee.identity.address],
    messageBody
  )
}

async function setup(): Promise<void> {
  if (!(await ctype.verifyStored())) {
    await ctype.store(root)
    CTypeRepository.register({
      cType: ctype,
      metaData: { metadata, ctypeHash: ctype.hash },
    })
  }
  // .verify() is fucked currently (at least with the mashnet)
  const queriedRoot = await sdk.DelegationRootNode.query(delegationRoot.id)
  if (queriedRoot?.cTypeHash !== ctype.hash) {
    await delegationRoot.store(root)
    const messageBody: sdk.MessageBody = {
      type: sdk.MessageBodyType.INFORM_CREATE_DELEGATION,
      content: { delegationId: delegationRoot.id, isPCR: false },
    }
    // sending root owner message for importing the root
    await MessageRepository.sendToAddresses([root.address], messageBody)
  }
}

export async function setupAndDelegate(delegee: IMyIdentity): Promise<void> {
  await sdk.Balance.makeTransfer(
    delegee.identity,
    root.address,
    BalanceUtilities.asMicroKilt(4)
  )
  await setup()
  await newDelegation(delegee)
}

export default setupAndDelegate
