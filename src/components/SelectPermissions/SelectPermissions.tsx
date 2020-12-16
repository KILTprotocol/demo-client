import { Permission } from '@kiltprotocol/sdk-js'
import React, { ChangeEvent } from 'react'

type Props = {
  permissions: Permission[]
  onChange: (permissions: Permission[]) => void
}

class SelectPermissions extends React.Component<Props> {
  private change(
    permission: Permission,
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const { permissions, onChange } = this.props
    const { checked } = event.target

    const newPermissions = permissions.filter(
      (_permission: Permission) => _permission !== permission
    )

    if (checked) {
      newPermissions.push(permission)
    }

    onChange(newPermissions)
  }

  public render(): JSX.Element {
    return (
      <div className="permissions">
        <h2>Select permissions</h2>
        <div>
          {Object.keys(Permission)
            .filter(
              (permission: string) => typeof Permission[permission] === 'number'
            )
            .map((permission: string) => (
              <label key={permission}>
                <input
                  type="checkbox"
                  onChange={this.change.bind(this, Permission[permission])}
                />
                <span>{permission}</span>
              </label>
            ))}
        </div>
      </div>
    )
  }
}

export default SelectPermissions
