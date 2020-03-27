import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import './Permissions.scss'

type Props = {
  permissions: sdk.Permission[]
}

class Permissions extends React.Component<Props> {
  private static getPermissionTitle(
    permission: string,
    allowed: boolean
  ): string {
    if (allowed) {
      return `can ${permission.toLowerCase()}`
    }
    return `can NOT ${permission.toLowerCase()}`
  }

  public render(): JSX.Element {
    const { permissions } = this.props

    return (
      <section className="Permissions">
        {Object.keys(sdk.Permission)
          .filter(
            (permission: string) =>
              typeof sdk.Permission[permission] === 'number'
          )
          .map((permission: string) => {
            const allowed = permissions.includes(sdk.Permission[permission])
            return (
              <span
                key={permission}
                title={Permissions.getPermissionTitle(permission, allowed)}
                className={`${permission} ${allowed ? 'allowed' : 'denied'}`}
              />
            )
          })}
      </section>
    )
  }
}

export default Permissions
