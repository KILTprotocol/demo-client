import {
  IPublicIdentity,
  IQuoteAgreement,
  IRequestForAttestation,
} from '@kiltprotocol/types'
import React from 'react'

import { connect } from 'react-redux'
import AttestedClaimsListView from '../../../components/AttestedClaimsListView/AttestedClaimsListView'
import ClaimDetailView from '../../../components/ClaimDetailView/ClaimDetailView'
import attestationWorkflow from '../../../services/AttestationWorkflow'
import * as Quotes from '../../../state/ducks/Quotes'
import * as Wallet from '../../../state/ducks/Wallet'
import { persistentStoreInstance } from '../../../state/PersistentStore'

import FeedbackService, { notifyError } from '../../../services/FeedbackService'
import { IContact } from '../../../types/Contact'
import { BlockUi } from '../../../types/UserFeedback'
import Code from '../../../components/Code/Code'

type DispatchProps = {
  saveAgreedQuote: (agreedQuote: IQuoteAgreement, ownerAddress: string) => void
}

type OwnProps = {
  claimerAddresses: Array<IContact['publicIdentity']['address']>
  requestForAttestation: IRequestForAttestation
  quoteData?: IQuoteAgreement
  claimer?: IPublicIdentity

  onCancel?: () => void
  onFinished?: () => void
}

type Props = OwnProps & DispatchProps

type State = {
  quoteData?: IQuoteAgreement
}

class AttestClaim extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}

    this.onCancel = this.onCancel.bind(this)
    this.attestClaim = this.attestClaim.bind(this)
  }

  componentDidMount(): void {
    const { quoteData } = this.props
    if (quoteData) {
      this.setState({ quoteData })
    }
  }

  private onCancel(): void {
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  private attestClaim(): void {
    const {
      requestForAttestation,
      onFinished,
      claimerAddresses,
      saveAgreedQuote,
      claimer,
    } = this.props
    const { quoteData } = this.state

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Writing attestation to chain',
    })

    const selectedIdentity = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )?.identity

    if (!selectedIdentity) {
      throw new Error('No identity selected')
    }

    attestationWorkflow
      .approveAndSubmitAttestationForClaim(
        requestForAttestation,
        claimerAddresses[0],
        claimer
      )
      .then(() => {
        blockUi.remove()
        if (onFinished) {
          if (quoteData && selectedIdentity) {
            saveAgreedQuote(quoteData, selectedIdentity.address)
          }
          onFinished()
        }
      })
      .catch((error) => {
        blockUi.remove()
        notifyError(error)
      })
  }

  public render(): JSX.Element {
    const { requestForAttestation } = this.props
    const { quoteData } = this.state
    return (
      <section className="AttestClaim">
        <ClaimDetailView claim={requestForAttestation.claim} />

        <AttestedClaimsListView
          attestedClaims={requestForAttestation.legitimations}
          delegationId={requestForAttestation.delegationId}
          context="terms"
        />
        {quoteData ? (
          <span>
            <h2>Quotes</h2>
            <div>
              <Code>{quoteData}</Code>
            </div>
          </span>
        ) : (
          <span>
            <h2>Quotes</h2>
            <div>no Quote</div>
          </span>
        )}

        <div className="actions">
          <button type="button" onClick={this.onCancel}>
            Cancel
          </button>
          <button type="button" onClick={this.attestClaim}>
            Attest Claim
          </button>
        </div>
      </section>
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  saveAgreedQuote: (agreedQuote: IQuoteAgreement, ownerAddress: string) =>
    Quotes.Store.saveAgreedQuote(agreedQuote, ownerAddress),
}

export default connect(null, mapDispatchToProps)(AttestClaim)
