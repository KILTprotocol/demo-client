import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import { Link } from 'react-router-dom'

import * as Claims from '../../state/ducks/Claims'
import { CTypeMetadata } from '../../types/Ctype'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import SelectCTypesModal from '../Modal/SelectCTypesModal'
import SelectAction from '../SelectAction/SelectAction'

import './MyClaimListView.scss'

type Props = {
  claimStore: Claims.Entry[]

  onCreateClaimFromCType: (selectedCTypes: CTypeMetadata[]) => void
  onRemoveClaim: (claimEntry: Claims.Entry) => void
  onRequestAttestation: (claimEntry: Claims.Entry) => void
  onRequestLegitimation: (claimEntry: Claims.Entry) => void
}

type State = {}

class MyClaimListView extends React.Component<Props, State> {
  private selectCTypesModal: SelectCTypesModal | null

  constructor(props: Props) {
    super(props)

    this.openCTypeModal = this.openCTypeModal.bind(this)
    this.createClaimFromCType = this.createClaimFromCType.bind(this)
  }

  public render() {
    const { claimStore } = this.props
    return (
      <section className="MyClaimListView">
        <h1>My Claims</h1>
        {claimStore && !!claimStore.length && (
          <table>
            <thead>
              <tr>
                <th className="alias">Alias</th>
                <th className="cType">CType</th>
                <th className="status">Attested?</th>
                <th className="actionsTd" />
              </tr>
            </thead>
            <tbody>
              {claimStore.map(claimEntry => (
                <tr key={claimEntry.id}>
                  <td className="alias">
                    <Link to={`/claim/${claimEntry.id}`}>
                      {claimEntry.meta.alias}
                    </Link>
                  </td>
                  <td className="cType">
                    <CTypePresentation
                      cTypeHash={claimEntry.claim.cTypeHash}
                      interactive={true}
                      linked={true}
                    />
                  </td>
                  <td
                    className={
                      'status ' +
                      (claimEntry.attestations.find(
                        (attestedClaim: sdk.IAttestedClaim) =>
                          !attestedClaim.attestation.revoked
                      )
                        ? 'attested'
                        : 'revoked')
                    }
                  />
                  <td className="actionsTd">
                    <div>
                      <SelectAction actions={this.getActions(claimEntry)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="actions">
          <button onClick={this.openCTypeModal}>Create Claim</button>
        </div>

        <SelectCTypesModal
          ref={el => {
            this.selectCTypesModal = el
          }}
          onConfirm={this.createClaimFromCType}
        />
      </section>
    )
  }

  private getActions(claimEntry: Claims.Entry) {
    return [
      {
        callback: this.requestLegitimation.bind(this, claimEntry),
        label: 'Request legitimations',
      },
      {
        callback: this.requestAttestation.bind(this, claimEntry),
        label: 'Request attestation',
      },
      {
        callback: this.handleDelete.bind(this, claimEntry),
        label: 'Delete',
      },
    ]
  }

  private handleDelete(claimEntry: Claims.Entry) {
    const { onRemoveClaim } = this.props
    onRemoveClaim(claimEntry)
  }

  private requestAttestation(claimEntry: Claims.Entry) {
    const { onRequestAttestation } = this.props
    onRequestAttestation(claimEntry)
  }

  private requestLegitimation(claimEntry: Claims.Entry) {
    const { onRequestLegitimation } = this.props
    onRequestLegitimation(claimEntry)
  }

  private openCTypeModal() {
    if (this.selectCTypesModal) {
      this.selectCTypesModal.show()
    }
  }

  private createClaimFromCType(selectedCTypes: CTypeMetadata[]) {
    const { onCreateClaimFromCType } = this.props
    onCreateClaimFromCType(selectedCTypes)
  }
}

export default MyClaimListView
