import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import { ChangeEvent } from 'react'

type Props = {
  permissions: sdk.Permission[]
  onChange: (permissions: sdk.Permission[]) => void
}

class SelectPermissions extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    return (
      <div className="permissions">
        <h2>Select permissions</h2>
        <div>
          {Object.keys(sdk.Permission)
            .filter(
              (permission: string) =>
                typeof sdk.Permission[permission] === 'number'
            )
            .map((permission: string) => (
              <label key={permission}>
                <input
                  type="checkbox"
                  onChange={this.change.bind(this, sdk.Permission[permission])}
                />
                <span>{permission}</span>
              </label>
            ))}
        </div>
      </div>
    )
  }

  private change(
    permission: sdk.Permission,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const { permissions, onChange } = this.props
    const { checked } = event.target

    const newPermissions = permissions.filter(
      (_permission: sdk.Permission) => _permission !== permission
    )

    if (checked) {
      newPermissions.push(permission)
    }

    onChange(newPermissions)
  }
}

export default SelectPermissions
