import * as sdk from '@kiltprotocol/prototype-sdk'

import DelegationsService from '../../services/DelegationsService'
import { DelegationType } from '../../state/ducks/Delegations'
import { MyIdentity } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
import delegationsPool from './data/delegations.json'
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
}

type BsDelegationsPoolElement = {
  alias: string
  ownerKey: keyof BsIdentitiesPool

  children?: BsDelegationsPoolElement[]
  cTypeKey?: keyof BsCTypesPool
  isPCR?: boolean
  permissions?: Permission[]
}

type BsDelegationsPool = {
  [delegationKey: string]: BsDelegationsPoolElement
}

class BsDelegation {
  public static pool: BsDelegationsPool = delegationsPool as BsDelegationsPool

  public static async createDelegation(
    BsDelegationData: BsDelegationsPoolElement,
    rootData: RootData,
    parentData: ParentData,
    isPCR: boolean,
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
    const _permissions = (permissions || []).map(
      permission => sdk.Permission[permission]
    )
    const delegation = new sdk.DelegationNode(
      sdk.UUID.generate(),
      rootData.rootDelegation.id,
      ownerIdentity.identity.address,
      _permissions,
      parentData.delegation.id
    )
    const signature = ownerIdentity.identity.signStr(delegation.generateHash())
    await DelegationsService.storeOnChain(delegation, signature)
    DelegationsService.store({
      ...delegation,
      isPCR,
      metaData: {
        alias,
      },
      type: DelegationType.Node,
    })

    if (!isPCR && children && children.length) {
      await BsDelegation.createChildren(
        children,
        rootData,
        {
          delegation,
          ownerIdentity,
        },
        isPCR,
        updateCallback
      )
    }
  }

  public static async createChildren(
    children: BsDelegationsPoolElement[],
    rootData: RootData,
    parentData: ParentData,
    isPCR: boolean,
    updateCallback?: (delegationAlias: string) => void
  ) {
    const requests = children.reduce((promiseChain, BsDelegationData) => {
      return promiseChain.then(() => {
        return BsDelegation.createDelegation(
          BsDelegationData,
          rootData,
          parentData,
          isPCR,
          updateCallback
        )
      })
    }, Promise.resolve())
    return requests
  }

  public static async createRootDelegation(
    BsDelegationData: BsDelegationsPoolElement,
    BsDelegationKey: keyof BsDelegationsPool,
    updateCallback?: (delegationAlias: string) => void
  ): Promise<void> {
    const { alias, children, cTypeKey, isPCR, ownerKey } = BsDelegationData
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
    await DelegationsService.storeRoot(rootDelegation, alias, !!isPCR)

    if (children && children.length) {
      await BsDelegation.createChildren(
        children,
        {
          ownerIdentity,
          rootDelegation,
        },
        {
          delegation: rootDelegation,
          ownerIdentity,
        },
        !!isPCR,
        updateCallback
      )
    }
  }

  public static async create(
    updateCallback?: (delegationAlias: string) => void
  ): Promise<void | sdk.Claim> {
    const bsDelegationKeys = Object.keys(BsDelegation.pool)
    const requests = bsDelegationKeys.reduce(
      (promiseChain, bsDelegationKey) => {
        return promiseChain.then(() => {
          return BsDelegation.createRootDelegation(
            BsDelegation.pool[bsDelegationKey],
            bsDelegationKey,
            updateCallback
          )
        })
      },
      Promise.resolve()
    )
    return requests
  }
}

export { BsDelegation, BsDelegationsPool }
