import * as sdk from '@kiltprotocol/prototype-sdk'
import ContactRepository from '../../services/ContactRepository'

import DelegationsService from '../../services/DelegationsService'
import MessageRepository from '../../services/MessageRepository'
import * as Delegations from '../../state/ducks/Delegations'
import { DelegationType, MyDelegation } from '../../state/ducks/Delegations'
import PersistentStore from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
import delegationsPool from './data/delegations.json'

import pcrPool from './data/pcr.json'
import { BsCType, BsCTypesPool } from './DevTools.ctypes'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'

type Permission = 'ATTEST' | 'DELEGATE'

type RootData = {
  ownerIdentity: MyIdentity
  rootDelegation: sdk.DelegationRootNode
}

type ParentData = {
  ownerIdentity: MyIdentity
  delegation: sdk.DelegationNode | sdk.DelegationRootNode
  metaData?: MyDelegation['metaData']
}

type DelegationDataForMessages = {
  delegation: sdk.DelegationNode
  isPCR: boolean
  ownerIdentity: MyIdentity
  signature: string
}

type BsDelegationsPoolElement = {
  alias: string
  ownerKey: keyof BsIdentitiesPool

  children?: BsDelegationsPool
  cTypeKey?: keyof BsCTypesPool
  permissions?: Permission[]
}

type BsDelegationsPool = {
  [delegationKey: string]: BsDelegationsPoolElement
}

class BsDelegation {
  public static delegationsPool: BsDelegationsPool = delegationsPool as BsDelegationsPool
  public static pcrPool: BsDelegationsPool = pcrPool as BsDelegationsPool

  public static async createDelegation(
    BsDelegationData: BsDelegationsPoolElement,
    rootData: RootData,
    parentData: ParentData,
    isPCR: boolean,
    withMessages: boolean,
    updateCallback?: (delegationAlias: string) => void
  ): Promise<void> {
    const { alias, children, ownerKey, permissions } = BsDelegationData

    if (!alias || !parentData) {
      throw new Error(`Invalid delegation data`)
    }

    const ownerIdentity: MyIdentity = await BsIdentity.getByKey(ownerKey)
    await BsIdentity.selectIdentity(parentData.ownerIdentity)

    if (updateCallback) {
      updateCallback(alias)
    }

    // creation
    let _permissions: sdk.Permission[]
    if (isPCR) {
      _permissions = [sdk.Permission.ATTEST]
    } else {
      _permissions = (permissions || []).map(
        permission => sdk.Permission[permission]
      )
    }
    const delegation = new sdk.DelegationNode(
      sdk.UUID.generate(),
      rootData.rootDelegation.id,
      ownerIdentity.identity.address,
      _permissions,
      parentData.delegation.id
    )

    const signature = ownerIdentity.identity.signStr(delegation.generateHash())
    const metaData = { alias }
    await DelegationsService.storeOnChain(delegation, signature)
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
    updateCallback?: (delegationAlias: string) => void
  ) {
    const requests = Object.keys(children).reduce(
      (promiseChain, BsDelegationKey) => {
        return promiseChain.then(() => {
          return BsDelegation.createDelegation(
            children[BsDelegationKey],
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
    BsDelegationData: BsDelegationsPoolElement,
    BsDelegationKey: keyof BsDelegationsPool,
    isPCR: boolean,
    withMessages: boolean,
    updateCallback?: (delegationAlias: string) => void
  ): Promise<void> {
    const { alias, children, cTypeKey, ownerKey } = BsDelegationData
    if (!alias || !cTypeKey) {
      throw new Error(
        `Invalid delegation data'${
          BsDelegationKey ? ` for ${BsDelegationKey}` : ''
        }'`
      )
    }
    const ownerIdentity: MyIdentity = await BsIdentity.getByKey(ownerKey)
    await BsIdentity.selectIdentity(ownerIdentity)
    const cType: ICType = await BsCType.getByKey(cTypeKey)

    if (updateCallback) {
      updateCallback(alias)
    }

    // await creation
    const rootDelegation = new sdk.DelegationRootNode(
      sdk.UUID.generate(),
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
    updateCallback?: (delegationAlias: string) => void
  ): Promise<void | sdk.Claim> {
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
  ): Promise<MyDelegation> {
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
      const allDelegations: MyDelegation[] = Delegations.getAllDelegations(
        PersistentStore.store.getState()
      )

      const myDelegation = allDelegations.find(
        (_myDelegation: MyDelegation) => {
          return _myDelegation.metaData.alias === match!.alias
        }
      )

      if (myDelegation) {
        return Promise.resolve(myDelegation)
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
      Delegations.getAllDelegations(PersistentStore.store.getState())
      return Promise.resolve(pool[bsDelegationKey])
    } else {
      // dive deeper
      return Promise.all(
        Object.keys(pool).map(
          async (_bsDelegationKey: keyof BsDelegationsPool) => {
            const { children } = pool[_bsDelegationKey]
            if (children) {
              return BsDelegation.getDelegationByKeyFromPool(
                bsDelegationKey,
                children
              )
            }
            return Promise.resolve(undefined)
          }
        )
      ).then((results: Array<BsDelegationsPoolElement | undefined>) => {
        // remove undefined values und return first match
        return results.filter(result => result)[0]
      })
    }
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
  ) {
    const {
      delegation,
      isPCR,
      ownerIdentity,
      signature,
    } = delegationDataForMessages

    const delegationData: sdk.IRequestAcceptDelegation['content']['delegationData'] = {
      account: parentData.ownerIdentity.identity.address,
      id: delegation.id,
      isPCR,
      parentId: parentData.delegation.id,
      permissions: delegation.permissions,
    }

    /** send invitation from inviter(parentIdentity) to invitee (ownerIdentity) */
    const requestAcceptDelegation: sdk.IRequestAcceptDelegation = {
      content: {
        delegationData,
        metaData: parentData.metaData,
        signatures: {
          inviter: parentData.ownerIdentity.identity.signStr(
            JSON.stringify(delegationData)
          ),
        },
      },
      type: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
    }
    await MessageRepository.singleSend(
      requestAcceptDelegation,
      parentData.ownerIdentity,
      ContactRepository.getContactFromIdentity(ownerIdentity)
    )

    /** send invitation acceptance back */
    const submitAcceptDelegation: sdk.ISubmitAcceptDelegation = {
      content: {
        delegationData,
        signatures: {
          invitee: signature,
          inviter: requestAcceptDelegation.content.signatures.inviter,
        },
      },
      type: sdk.MessageBodyType.SUBMIT_ACCEPT_DELEGATION,
    }
    await MessageRepository.singleSend(
      submitAcceptDelegation,
      ownerIdentity,
      ContactRepository.getContactFromIdentity(parentData.ownerIdentity)
    )

    /** inform about delegation creation */
    const informCreateDelegation: sdk.IInformCreateDelegation = {
      content: {
        delegationId: delegation.id,
        isPCR,
      },
      type: sdk.MessageBodyType.INFORM_CREATE_DELEGATION,
    }
    await MessageRepository.singleSend(
      informCreateDelegation,
      parentData.ownerIdentity,
      ContactRepository.getContactFromIdentity(ownerIdentity)
    )
  }
}

export { BsDelegation, BsDelegationsPool }
