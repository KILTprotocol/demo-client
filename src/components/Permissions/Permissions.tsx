import { Permission } from '@kiltprotocol/types'
import React from 'react'

import './Permissions.scss'

type Props = {
  permissions: Permission[]
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
        {Object.values(Permission)
          .filter(
            (permission): permission is number => typeof permission === 'number'
          )
          .map((permission: Permission) => {
            const allowed = permissions.includes(permission)
            return (
              <span
                key={permission}
                title={Permissions.getPermissionTitle(
                  Permission[permission],
                  allowed
                )}
                className={`${Permission[permission]} ${allowed ? 'allowed' : 'denied'}`}
              />
            )
          })}
      </section>
    )
  }
}

export default Permissions
