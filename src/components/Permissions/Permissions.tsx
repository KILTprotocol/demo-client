import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import './Permissions.scss'

type Props = {
  permissions: sdk.Permission[]
}

class Permissions extends React.Component<Props> {
  public render() {
    const { permissions } = this.props

    return (
      <section className="Permissions">
        {Object.keys(sdk.Permission)
          .filter(
            (permission: string) =>
              typeof sdk.Permission[permission] === 'number'
          )
          .map((permission: string) => {
            const allowed =
              permissions.indexOf(sdk.Permission[permission]) !== -1
            return (
              <span
                key={permission}
                title={this.getPermissionTitle(permission, allowed)}
                className={`${permission} ${allowed ? 'allowed' : 'denied'}`}
              />
            )
          })}
      </section>
    )
  }

  private getPermissionTitle(permission: string, allowed: boolean): string {
    if (allowed) {
      return 'can ' + permission.toLowerCase()
    }
    return 'can NOT ' + permission.toLowerCase()
  }
}

export default Permissions
