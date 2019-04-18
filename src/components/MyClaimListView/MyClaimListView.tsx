import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { RequestLegitimationsProps } from '../../containers/Tasks/RequestLegitimation/RequestLegitimation'

import * as Claims from '../../state/ducks/Claims'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import SelectCTypesModal from '../Modal/SelectCTypesModal'
import SelectAction from '../SelectAction/SelectAction'

import './MyClaimListView.scss'

type Props = {
  claimStore: Claims.Entry[]

  onCreateClaimFromCType: (selectedCTypes: ICType[]) => void
  onRemoveClaim: (claimId: Claims.Entry['id']) => void
  onRequestAttestation: (claimId: Claims.Entry['id']) => void
  onRequestLegitimation: (claimId: Claims.Entry['id']) => void
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
                      cTypeHash={claimEntry.claim.cType}
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
                      <SelectAction
                        actions={[
                          {
                            callback: () => {
                              PersistentStore.store.dispatch(
                                UiState.Store.updateCurrentTaskAction({
                                  objective:
                                    sdk.MessageBodyType.REQUEST_LEGITIMATIONS,
                                  props: {
                                    cTypeHash: claimEntry.claim.cType,
                                    preSelectedClaimEntries: [claimEntry],
                                  } as RequestLegitimationsProps,
                                })
                              )
                            },
                            label: 'Request legitimations',
                          },
                          {
                            callback: this.requestAttestation.bind(
                              this,
                              claimEntry.id
                            ),
                            label: 'Get Attestation',
                          },
                          {
                            callback: this.handleDelete.bind(
                              this,
                              claimEntry.id
                            ),
                            label: 'Delete',
                          },
                        ]}
                      />
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

  private handleDelete(claimId: Claims.Entry['id']) {
    const { onRemoveClaim } = this.props
    onRemoveClaim(claimId)
  }

  private requestAttestation(claimId: Claims.Entry['id']) {
    const { onRequestAttestation } = this.props
    onRequestAttestation(claimId)
  }

  private requestLegitimation(claimId: Claims.Entry['id']) {
    const { onRequestLegitimation } = this.props
    onRequestLegitimation(claimId)
  }

  private openCTypeModal() {
    if (this.selectCTypesModal) {
      this.selectCTypesModal.show()
    }
  }

  private createClaimFromCType(selectedCTypes: ICType[]) {
    const { onCreateClaimFromCType } = this.props
    onCreateClaimFromCType(selectedCTypes)
  }
}

export default MyClaimListView
