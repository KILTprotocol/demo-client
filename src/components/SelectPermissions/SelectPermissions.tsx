import { Permission } from '@kiltprotocol/types'
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
          {Object.values(Permission)
            .filter(
              (permission): permission is number =>
                typeof permission === 'number'
            )
            .map((permission: Permission) => (
              <label key={permission}>
                <input
                  type="checkbox"
                  onChange={this.change.bind(this, permission)}
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
