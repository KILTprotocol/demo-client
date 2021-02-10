import React from 'react'
import {
  AttestedClaim,
  PublicIdentity,
  Quote,
  IPartialClaim,
} from '@kiltprotocol/sdk-js'
import {
  IQuoteAttesterSigned,
  IAttestedClaim,
  IDelegationNode,
} from '@kiltprotocol/types'
import { connect } from 'react-redux'
import QuoteServices from '../../../services/QuoteServices'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import { ViewType } from '../../../components/DelegationNode/DelegationNode'

import MyClaimCreateView from '../../../components/MyClaimCreateView/MyClaimCreateView'
import MyClaimDetailView from '../../../components/MyClaimDetailView/MyClaimDetailView'
import SelectClaims from '../../../components/SelectClaims/SelectClaims'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import * as Claims from '../../../state/ducks/Claims'
import * as Quotes from '../../../state/ducks/Quotes'
import * as Wallet from '../../../state/ducks/Wallet'
import { persistentStoreInstance } from '../../../state/PersistentStore'

import './RequestAttestation.scss'
import Code from '../../../components/Code/Code'

type DispatchProps = {
  saveAttestersQuote: (
    attesterSignedQuote: IQuoteAttesterSigned,
    ownerAddress: string
  ) => void
}

export type RequestAttestationProps = {
  claim: IPartialClaim
  terms: IAttestedClaim[]
  quoteData?: IQuoteAttesterSigned
  receiverAddresses: Array<PublicIdentity['address']>
  delegationId: IDelegationNode['id'] | undefined
  onCancel?: () => void
  onFinished?: () => void
}

type Props = RequestAttestationProps & DispatchProps

type State = {
  savedClaimEntry?: Claims.Entry
  createNewClaim?: boolean
}

class RequestAttestation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
    this.handleCreateClaim = this.handleCreateClaim.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.onSelectClaims = this.onSelectClaims.bind(this)
  }

  public componentDidMount(): void {
    const { claim } = this.props
    // check if we already have the messages claim stored
    this.setState({
      savedClaimEntry: Claims.getClaim(
        persistentStoreInstance.store.getState(),
        claim
      ),
    })
  }

  private onSelectClaims(selectedClaims: Claims.Entry[]): void {
    this.setState({
      savedClaimEntry: selectedClaims[0],
    })
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private getCreateOrSelect(): JSX.Element {
    const { claim } = this.props
    const { createNewClaim } = this.state

    const button = {
      create: (
        <button type="button" onClick={this.setCreateNewClaim.bind(this, true)}>
          Create new claim
        </button>
      ),
      select: (
        <button
          type="button"
          onClick={this.setCreateNewClaim.bind(this, false)}
        >
          Select claim
        </button>
      ),
    }

    const myClaims = Claims.getClaimsByCTypeHash(
      persistentStoreInstance.store.getState(),
      claim.cTypeHash
    )

    const withPreFilledClaim = !!(
      claim &&
      claim.contents &&
      Object.keys(claim.contents).length
    )

    switch (true) {
      case !myClaims || !myClaims.length:
        return (
          <MyClaimCreateView
            partialClaim={claim}
            onCreate={this.handleCreateClaim}
          />
        )
      case createNewClaim:
      case createNewClaim == null && withPreFilledClaim:
        return (
          <>
            <MyClaimCreateView
              partialClaim={claim}
              onCreate={this.handleCreateClaim}
            />
            {myClaims && !!myClaims.length && (
              <div className="container-actions">…or{button.select}</div>
            )}
          </>
        )
      case createNewClaim === false:
        return (
          <section className="selectClaim">
            <h2>Select claim</h2>
            <SelectClaims
              cTypeHash={claim.cTypeHash}
              onChange={this.onSelectClaims}
              isMulti={false}
            />
            <div className="container-actions">…or{button.create}</div>
          </section>
        )
      default:
        return (
          <section className="chooseAction">
            <h2>Choose action</h2>
            <div>
              {button.select}
              or
              {button.create}
            </div>
          </section>
        )
    }
  }

  private setCreateNewClaim(createNewClaim: boolean): void {
    this.setState({ createNewClaim })
  }

  private handleCreateClaim(currentClaim: IPartialClaim): void {
    this.setState({
      savedClaimEntry: Claims.getClaim(
        persistentStoreInstance.store.getState(),
        currentClaim
      ),
    })
  }

  private handleSubmit(): void {
    const {
      receiverAddresses,
      terms,
      delegationId,
      onFinished,
      quoteData,
      saveAttestersQuote,
    } = this.props
    const { savedClaimEntry } = this.state

    const selectedIdentity = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )?.identity

    if (!selectedIdentity) {
      throw new Error('No selected Identity')
    }

    if (savedClaimEntry) {
      const quote = quoteData
        ? Quote.createAttesterSignature(quoteData, selectedIdentity)
        : undefined

      const termBreakdown = (terms || []).map((legitimation: IAttestedClaim) =>
        AttestedClaim.fromAttestedClaim(legitimation)
      )

      const quoteAgreement = QuoteServices.createAgreedQuote(
        savedClaimEntry.claim,
        selectedIdentity,
        termBreakdown,
        delegationId,
        quote
      )

      attestationWorkflow
        .requestAttestationForClaim(
          savedClaimEntry.claim,
          receiverAddresses,
          termBreakdown,
          delegationId,
          quoteAgreement || undefined
        )
        .then(() => {
          if (onFinished) {
            if (quote && selectedIdentity) {
              saveAttestersQuote(quote, selectedIdentity.address)
            }
            onFinished()
          }
        })
    }
  }

  public render(): JSX.Element {
    const { terms, delegationId, quoteData } = this.props
    const { savedClaimEntry } = this.state

    return (
      <section className="RequestAttestation">
        {savedClaimEntry ? (
          <MyClaimDetailView
            claimEntry={savedClaimEntry}
            hideAttestedClaims
            hideRequestForAttestation
          />
        ) : (
          this.getCreateOrSelect()
        )}

        {((!!terms && !!terms.length) || !!delegationId) && (
          <AttestedClaimsListView
            attestedClaims={terms}
            delegationId={delegationId}
            context="terms"
            currentDelegationViewType={ViewType.Present}
          />
        )}

        {quoteData ? (
          <div>
            <h2>Quotes</h2>
            <div>
              <Code>{quoteData}</Code>
            </div>
          </div>
        ) : (
          <div>
            <h2>Quotes</h2>
            <div>no Quote</div>
          </div>
        )}

        <div className="actions">
          <button type="button" onClick={this.onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="request-attestation"
            disabled={!savedClaimEntry}
            onClick={this.handleSubmit}
          >
            Request Attestation
          </button>
        </div>
      </section>
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  saveAttestersQuote: (
    attesterSignedQuote: IQuoteAttesterSigned,
    ownerAddress: string
  ) => Quotes.Store.saveAttestersQuote(attesterSignedQuote, ownerAddress),
}

export default connect(null, mapDispatchToProps)(RequestAttestation)
