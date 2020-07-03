import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import PersistentStore from '../../state/PersistentStore'
import AttestationStatus from '../AttestationStatus/AttestationStatus'
import AttestedClaimVerificationView from '../AttestedClaimVerificationView/AttestedClaimVerificationView'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import DelegationDetailView from '../DelegationDetailView/DelegationDetailView'
import { ViewType } from '../DelegationNode/DelegationNode'
import * as UiState from '../../state/ducks/UiState'

import './AttestedClaimsListView.scss'

interface IPossibleLabels {
  emptyList: string
  h2Multi: string
  h2Single: string
}

interface ILabels {
  default: IPossibleLabels
  terms: IPossibleLabels
}

const LABELS: ILabels = {
  default: {
    emptyList: 'No attestations found.',
    h2Multi: 'Attested claims',
    h2Single: 'Attested claim',
  },
  terms: {
    emptyList: 'No terms found.',
    h2Multi: 'terms',
    h2Single: 'term',
  },
}

type Props = {
  attestedClaims: sdk.IAttestedClaim[]
  context?: 'terms'
  delegationId: sdk.IDelegationNode['id'] | null
  currentDelegationViewType?: ViewType

  onToggleChildOpen?: (closeCallback?: () => void | undefined) => void
}

type State = {
  labels: IPossibleLabels

  closeOpenedChild?: () => void
  openedAttestedClaim?: sdk.IAttestedClaim
}

class AttestedClaimsListView extends React.Component<Props, State> {
  private static verifyAttestations(): void {
    PersistentStore.store.dispatch(
      UiState.Store.refreshAttestationStatusAction()
    )
  }

  static defaultProps: { delegationId: null }

  constructor(props: Props) {
    super(props)

    const context =
      props.context && LABELS[props.context] ? props.context : 'default'

    this.state = {
      labels: LABELS[context],
    }

    this.toggleChildOpen = this.toggleChildOpen.bind(this)
    this.closeOpenedChild = this.closeOpenedChild.bind(this)
  }

  private getAttestedClaims(
    attestedClaims: Props['attestedClaims'],
    delegationId: Props['delegationId']
  ): JSX.Element {
    const { labels } = this.state
    if (!delegationId && !attestedClaims.length) {
      return <div>{labels.emptyList}</div>
    }
    return (
      <>
        {this.getAttestations(attestedClaims)}
        {this.getDelegation(delegationId)}
      </>
    )
  }

  private getAttestations(attestations: sdk.IAttestedClaim[]): JSX.Element {
    const { openedAttestedClaim } = this.state
    return (
      <section className="attestations">
        {openedAttestedClaim ? (
          <h2 onClick={this.toggleOpen.bind(this, openedAttestedClaim)}>
            {LABELS.default.h2Single}
          </h2>
        ) : (
          <h2>{LABELS.default.h2Multi}</h2>
        )}
        <div className="container-actions">
          {!!attestations && !!attestations.length && (
            <button
              type="button"
              className="refresh"
              onClick={AttestedClaimsListView.verifyAttestations}
            />
          )}
          {openedAttestedClaim && (
            <button
              type="button"
              className="close"
              onClick={this.toggleOpen.bind(this, openedAttestedClaim)}
            />
          )}
        </div>

        {!!attestations && !!attestations.length ? (
          <table className={openedAttestedClaim ? 'opened' : ''}>
            <thead>
              <tr>
                <th className="attester">Attester</th>
                <th className="cType">CType</th>
                <th className="status">Attested</th>
                <th className="actionsTd" />
              </tr>
            </thead>

            {attestations.map((attestedClaim: sdk.IAttestedClaim) => {
              const opened = attestedClaim === openedAttestedClaim

              return (
                <tbody
                  key={attestedClaim.attestation.claimHash}
                  className={opened ? 'opened' : ''}
                >
                  <tr>
                    <td className="attester">
                      <ContactPresentation
                        address={attestedClaim.attestation.owner}
                        interactive
                      />
                    </td>
                    <td className="cType">
                      <CTypePresentation
                        cTypeHash={attestedClaim.attestation.cTypeHash}
                        interactive
                        linked
                      />
                    </td>
                    <td>
                      <AttestationStatus attestation={attestedClaim} />
                    </td>
                    <td className="actionsTd">
                      <div>
                        <button
                          type="button"
                          className="open"
                          onClick={this.toggleOpen.bind(this, attestedClaim)}
                        />
                      </div>
                    </td>
                  </tr>

                  {opened && (
                    <tr>
                      <td className="listDetailContainer" colSpan={3}>
                        <AttestedClaimsListView
                          attestedClaims={attestedClaim.request.legitimations}
                          delegationId={attestedClaim.request.delegationId}
                          context="terms"
                          onToggleChildOpen={this.toggleChildOpen}
                        />

                        <div className="back" onClick={this.closeOpenedChild} />

                        <AttestedClaimVerificationView
                          context=""
                          attestedClaim={attestedClaim}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </table>
        ) : (
          <div>{LABELS.default.emptyList}</div>
        )}
      </section>
    )
  }

  private getDelegation(delegationId: Props['delegationId']): JSX.Element {
    const { currentDelegationViewType } = this.props
    return (
      <div className="delegation">
        <h2>Delegation</h2>
        {delegationId ? (
          <DelegationDetailView
            id={delegationId}
            viewType={currentDelegationViewType}
          />
        ) : (
          <div>No delegation found.</div>
        )}
      </div>
    )
  }

  private toggleOpen(attestedClaim: sdk.IAttestedClaim | undefined): void {
    const { onToggleChildOpen } = this.props
    const { openedAttestedClaim } = this.state

    this.setState({
      openedAttestedClaim:
        attestedClaim === openedAttestedClaim ? undefined : attestedClaim,
    })

    if (onToggleChildOpen) {
      onToggleChildOpen(
        attestedClaim === openedAttestedClaim
          ? undefined
          : () => {
              this.toggleOpen(openedAttestedClaim)
            }
      )
    }
  }

  private toggleChildOpen(closeCallback?: () => void | undefined): void {
    this.setState({ closeOpenedChild: closeCallback })
  }

  private closeOpenedChild(): void {
    const { closeOpenedChild } = this.state
    if (closeOpenedChild) {
      closeOpenedChild()
    }
  }

  public render(): JSX.Element {
    const { attestedClaims, context, delegationId } = this.props
    const { labels, openedAttestedClaim } = this.state

    const classes = [
      'AttestedClaimsListView',
      openedAttestedClaim ? 'opened' : '',
    ]

    return attestedClaims ? (
      <section className={classes.join(' ')}>
        <div className={context}>
          <h2>{labels.h2Multi}</h2>
          {this.getAttestedClaims(attestedClaims, delegationId)}
        </div>
      </section>
    ) : (
      <section className="ClaimDetailView">Claim not found</section>
    )
  }
}

export default AttestedClaimsListView
