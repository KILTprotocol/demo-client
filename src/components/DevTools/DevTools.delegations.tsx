import {
  BlockchainUtils,
  DelegationNode,
  DelegationRootNode,
  IInformCreateDelegation,
  IRequestAcceptDelegation,
  ISubmitAcceptDelegation,
  MessageBodyType,
  Permission,
} from '@kiltprotocol/sdk-js'
import { UUID } from '@kiltprotocol/utils'

import ContactRepository from '../../services/ContactRepository'

import DelegationsService from '../../services/DelegationsService'
import MessageRepository from '../../services/MessageRepository'
import * as Delegations from '../../state/ducks/Delegations'
import { DelegationType, IMyDelegation } from '../../state/ducks/Delegations'
import { persistentStoreInstance } from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'
import { ICTypeWithMetadata } from '../../types/Ctype'
import { BsCType, BsCTypesPool } from './DevTools.ctypes'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'

import delegationsPool from './data/delegations.json'
import pcrPool from './data/pcr.json'

type UpdateCallback = (bsDelegationKey: keyof BsDelegationsPool) => void

type Permissions = 'ATTEST' | 'DELEGATE'

type RootData = {
  ownerIdentity: IMyIdentity
  rootDelegation: DelegationRootNode
}

type ParentData = {
  ownerIdentity: IMyIdentity
  delegation: DelegationNode | DelegationRootNode
  metaData?: IMyDelegation['metaData']
}

type DelegationDataForMessages = {
  delegation: DelegationNode
  isPCR: boolean
  ownerIdentity: IMyIdentity
  signature: string
}

type BsDelegationsPoolElement = {
  alias: string
  ownerKey: keyof BsIdentitiesPool

  children?: BsDelegationsPool
  cTypeKey?: keyof BsCTypesPool
  permissions?: Permissions[]
}

export type BsDelegationsPool = {
  [delegationKey: string]: BsDelegationsPoolElement
}

class BsDelegation {
  public static delegationsPool: BsDelegationsPool = delegationsPool as BsDelegationsPool
  public static pcrPool: BsDelegationsPool = pcrPool as BsDelegationsPool

  public static async createDelegation(
    BsDelegationData: BsDelegationsPoolElement,
    bsDelegationKey: keyof BsDelegationsPool,
    rootData: RootData,
    parentData: ParentData,
    isPCR: boolean,
    withMessages: boolean,
    updateCallback?: UpdateCallback
  ): Promise<void> {
    const { alias, children, ownerKey, permissions } = BsDelegationData

    if (!alias || !parentData) {
      throw new Error(`Invalid delegation data`)
    }

    const ownerIdentity = await BsIdentity.getByKey(ownerKey)
    BsIdentity.selectIdentity(parentData.ownerIdentity)

    if (updateCallback) {
      updateCallback(bsDelegationKey)
    }

    // creation
    let newPermissions: Permission[]
    if (isPCR) {
      newPermissions = [Permission.ATTEST]
    } else {
      newPermissions = (permissions || []).map(
        permission => Permission[permission]
      )
    }
    const delegation = new DelegationNode(
      UUID.generate(),
      rootData.rootDelegation.id,
      ownerIdentity.identity.address,
      newPermissions,
      parentData.delegation.id
    )

    const signature = ownerIdentity.identity.signStr(delegation.generateHash())
    const metaData = { alias }
    const tx = await DelegationsService.storeOnChain(delegation, signature)
    await BlockchainUtils.submitSignedTx(tx, {
      resolveOn: BlockchainUtils.IS_IN_BLOCK,
    })
    DelegationsService.store({
      cTypeHash: rootData.rootDelegation.cTypeHash,
      ...delegation,
      isPCR,
      metaData,
      type: DelegationType.Node,
    })

    if (withMessages) {
      BsDelegation.sendMessages(parentData, {
        delegation,
        isPCR,
        ownerIdentity,
        signature,
      })
    }

    if (!isPCR && children) {
      await BsDelegation.createChildren(
        children,
        rootData,
        {
          delegation,
          metaData,
          ownerIdentity,
        },
        isPCR,
        withMessages,
        updateCallback
      )
    }
  }

  public static async createChildren(
    children: BsDelegationsPool,
    rootData: RootData,
    parentData: ParentData,
    isPCR: boolean,
    withMessages: boolean,
    updateCallback?: UpdateCallback
  ): Promise<void> {
    const requests = Object.keys(children).reduce(
      (promiseChain, BsDelegationKey) => {
        return promiseChain.then(() => {
          return BsDelegation.createDelegation(
            children[BsDelegationKey],
            BsDelegationKey,
            rootData,
            parentData,
            isPCR,
            withMessages,
            updateCallback
          )
        })
      },
      Promise.resolve()
    )
    return requests
  }

  public static async createRootDelegation(
    bsDelegationData: BsDelegationsPoolElement,
    bsDelegationKey: keyof BsDelegationsPool,
    isPCR: boolean,
    withMessages: boolean,
    updateCallback?: UpdateCallback
  ): Promise<void> {
    const { alias, children, cTypeKey, ownerKey } = bsDelegationData
    if (!alias || !cTypeKey) {
      throw new Error(
        `Invalid delegation data'${
          bsDelegationKey ? ` for ${bsDelegationKey}` : ''
        }'`
      )
    }
    const ownerIdentity: IMyIdentity = await BsIdentity.getByKey(ownerKey)
    BsIdentity.selectIdentity(ownerIdentity)
    const cType: ICTypeWithMetadata = await BsCType.getByKey(cTypeKey)

    if (updateCallback) {
      updateCallback(bsDelegationKey)
    }

    // await creation
    const rootDelegation = new DelegationRootNode(
      UUID.generate(),
      cType.cType.hash,
      ownerIdentity.identity.address
    )
    await DelegationsService.storeRoot(rootDelegation, alias, isPCR)

    if (children) {
      await BsDelegation.createChildren(
        children,
        {
          ownerIdentity,
          rootDelegation,
        },
        {
          delegation: rootDelegation,
          metaData: { alias },
          ownerIdentity,
        },
        isPCR,
        withMessages,
        updateCallback
      )
    }
  }

  public static async create(
    isPCR: boolean,
    withMessages: boolean,
    updateCallback?: UpdateCallback
  ): Promise<void> {
    const pool = isPCR ? BsDelegation.pcrPool : BsDelegation.delegationsPool
    const bsDelegationKeys = Object.keys(pool)
    const requests = bsDelegationKeys.reduce(
      (promiseChain, bsDelegationKey) => {
        return promiseChain.then(() => {
          return BsDelegation.createRootDelegation(
            pool[bsDelegationKey],
            bsDelegationKey,
            isPCR,
            withMessages,
            updateCallback
          )
        })
      },
      Promise.resolve()
    )
    return requests
  }

  public static async getDelegationByKey(
    bsDelegationKey: keyof BsDelegationsPool
  ): Promise<IMyDelegation> {
    let match: BsDelegationsPoolElement | undefined
    match = await BsDelegation.getDelegationByKeyFromPool(
      bsDelegationKey,
      BsDelegation.delegationsPool
    )
    if (!match) {
      match = await BsDelegation.getDelegationByKeyFromPool(
        bsDelegationKey,
        BsDelegation.pcrPool
      )
    }

    if (match) {
      BsIdentity.selectIdentity(await BsIdentity.getByKey(match.ownerKey))
      const allDelegations: IMyDelegation[] = Delegations.getAllDelegations(
        persistentStoreInstance.store.getState()
      )

      const myDelegation = allDelegations.find(
        (_myDelegation: IMyDelegation) => {
          return match && _myDelegation.metaData.alias === match.alias
        }
      )

      if (myDelegation) {
        return myDelegation
      }
      throw new Error(
        `No delegation or PCR for delegationKey '${bsDelegationKey}' found.`
      )
    }
    throw new Error(
      `No delegation or PCR for delegationKey '${bsDelegationKey}' found.`
    )
  }

  public static async getDelegationByKeyFromPool(
    bsDelegationKey: keyof BsDelegationsPool,
    pool: BsDelegationsPool
  ): Promise<BsDelegationsPoolElement | undefined> {
    const bsDelegation = pool[bsDelegationKey]
    if (bsDelegation) {
      // the current pool contains the requested delegation
      Delegations.getAllDelegations(persistentStoreInstance.store.getState())
      return pool[bsDelegationKey]
    }
    // dive deeper
    return Promise.all(
      Object.keys(pool).map(async bsDelegationPoolKey => {
        const { children } = pool[bsDelegationPoolKey]
        if (children) {
          return BsDelegation.getDelegationByKeyFromPool(
            bsDelegationKey,
            children
          )
        }
        return undefined
      })
    ).then((results: Array<BsDelegationsPoolElement | undefined>) => {
      // remove undefined values und return first match
      return results.filter(result => result)[0]
    })
  }

  /**
   * sends all the messages of regular delegation process
   *
   * @param parentData
   * @param delegationDataForMessages
   */
  private static async sendMessages(
    parentData: ParentData,
    delegationDataForMessages: DelegationDataForMessages
  ): Promise<void> {
    const {
      delegation,
      isPCR,
      ownerIdentity,
      signature,
    } = delegationDataForMessages

    const delegationData: IRequestAcceptDelegation['content']['delegationData'] = {
      account: parentData.ownerIdentity.identity.address,
      id: delegation.id,
      isPCR,
      parentId: parentData.delegation.id,
      permissions: delegation.permissions,
    }

    // send invitation from inviter(parentIdentity) to invitee (ownerIdentity)
    const requestAcceptDelegation: IRequestAcceptDelegation = {
      content: {
        delegationData,
        metaData: parentData.metaData,
        signatures: {
          inviter: parentData.ownerIdentity.identity.signStr(
            JSON.stringify(delegationData)
          ),
        },
      },
      type: MessageBodyType.REQUEST_ACCEPT_DELEGATION,
    }
    await MessageRepository.singleSend(
      requestAcceptDelegation,
      parentData.ownerIdentity,
      ContactRepository.getContactFromIdentity(ownerIdentity)
    )

    // send invitation acceptance back
    const submitAcceptDelegation: ISubmitAcceptDelegation = {
      content: {
        delegationData,
        signatures: {
          invitee: signature,
          inviter: requestAcceptDelegation.content.signatures.inviter,
        },
      },
      type: MessageBodyType.SUBMIT_ACCEPT_DELEGATION,
    }
    await MessageRepository.singleSend(
      submitAcceptDelegation,
      ownerIdentity,
      ContactRepository.getContactFromIdentity(parentData.ownerIdentity)
    )

    // inform about delegation creation
    const informCreateDelegation: IInformCreateDelegation = {
      content: {
        delegationId: delegation.id,
        isPCR,
      },
      type: MessageBodyType.INFORM_CREATE_DELEGATION,
    }
    await MessageRepository.singleSend(
      informCreateDelegation,
      parentData.ownerIdentity,
      ContactRepository.getContactFromIdentity(ownerIdentity)
    )
  }
}

export { BsDelegation }
