import * as sdk from '@kiltprotocol/sdk-js'
import { IMetadata } from '@kiltprotocol/sdk-js/build/types/CTypeMetadata'
import { makeTransfer } from '@kiltprotocol/sdk-js/build/balance/Balance.chain'
import { MessageBodyType } from '@kiltprotocol/sdk-js'
import ANTICOV_CONFIG from '../components/DevTools/data/anticov.json'
import CTypeRepository from '../services/CtypeRepository'
import { BalanceUtilities } from '../services/BalanceUtilities'
import { IMyIdentity } from '../types/Contact'
import MessageRepository from '../services/MessageRepository'
import { BasePostParams } from '../services/BaseRepository'

const root = sdk.Identity.buildFromMnemonic(ANTICOV_CONFIG.ROOT_SEED)

const ctype = sdk.CType.fromCType(ANTICOV_CONFIG.CTYPE as sdk.ICType)
ctype.owner = root.address
const metadata: IMetadata = {
  title: { default: 'AntiCov' },
  properties: { photo: { type: 'string' } },
}

const delegationRoot = new sdk.DelegationRootNode(
  ANTICOV_CONFIG.DELEGATION_ROOT_ID,
  ctype.hash,
  root.address
)

async function newDelegation(myIdentity: IMyIdentity) {
  const delNode = new sdk.DelegationNode(
    sdk.UUID.generate(),
    delegationRoot.id,
    myIdentity.identity.address,
    [sdk.Permission.ATTEST]
  )
  const signature = myIdentity.identity.signStr(delNode.generateHash())
  await delNode.store(root, signature)
  const messageBody: sdk.MessageBody = {
    type: MessageBodyType.INFORM_CREATE_DELEGATION,
    content: { delegationId: delNode.id, isPCR: false },
  }
  const message = new sdk.Message(
    messageBody,
    root,
    myIdentity.identity.getPublicIdentity()
  )
  await fetch(`${MessageRepository.URL}`, {
    ...BasePostParams,
    body: JSON.stringify(message.getEncryptedMessage()),
  }).then(response => {
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    console.log(response.json())
  })
}

async function setup() {
  if (!(await ctype.verifyStored())) {
    await ctype.store(root)
    CTypeRepository.register({
      cType: ctype,
      metaData: { metadata, ctypeHash: ctype.hash },
    })
  }

  if (!(await delegationRoot.verify())) {
    await delegationRoot.store(root)
  }
}

export async function setupAndDelegate(myIdentity: IMyIdentity) {
  await makeTransfer(
    myIdentity.identity,
    root.address,
    BalanceUtilities.asMicroKilt(10)
  )
  await setup()
  await newDelegation(myIdentity)
}

export default setupAndDelegate
