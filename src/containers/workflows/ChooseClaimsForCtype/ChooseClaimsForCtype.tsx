import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import ChooseClaimForCtype, {
  State as ChooseClaimForCtypeState,
} from '../../../components/ChooseClaimForCType/ChooseClaimForCType'
import '../../../components/ChooseClaimForCType/ChooseClaimForCType.scss'
import contactRepository from '../../../services/ContactRepository'
import CtypeRepository from '../../../services/CtypeRepository'
import errorService from '../../../services/ErrorService'
import FeedbackService, {
  notifySuccess,
} from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Claims from '../../../state/ducks/Claims'
import { State as ReduxState } from '../../../state/PersistentStore'
import { Contact } from '../../../types/Contact'
import { CType, ICType } from '../../../types/Ctype'
import { BlockUi } from '../../../types/UserFeedback'
import {
  IPartialClaim,
  ISubmitClaimsForCtype,
  ISubmitLegitimations,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'

export type ChooseClaimsForCTypeLabels = {
  buttons: {
    [key: string]: string
  }
  text: {
    [key: string]: string
  }
  message: {
    [key: string]: string | { [key: string]: string }
    sent: {
      [key: string]: string
    }
  }
}

type AllLabels = {
  default: ChooseClaimsForCTypeLabels
  legitimation: ChooseClaimsForCTypeLabels
}

const LABELS: AllLabels = {
  default: {
    buttons: {
      add: 'Add attested claim',
      createClaim: 'Create claim',
      init: 'Select attested claim(s)',
      requestAttestation: 'Request attestation(s)',
      sendAttestedClaims: 'Send attested claim(s)',
    },
    message: {
      sending: 'Sending attested claim(s) (2/2)',
      sent: {
        failure: 'Could not send attested claim(s).',
        success: 'Attested claim(s) successfully sent.',
      },
    },
    text: {
      attestationsHeadline: 'Select attestation(s)',
      claimHeadline: 'Claim',
      includePropertiesHeadline: 'Select property(s) to include in Claim',
      noAttestationFound: 'No attestation found.',
      noClaimsFound: `No claim for CTYPE '#{ctype}' found.`,
      selectClaim: 'Select claim ...',
      selectClaimHeadline: 'Select claim(s)',
    },
  },
  legitimation: {
    buttons: {
      add: 'Add legitimation',
      createClaim: 'Create legitimation',
      init: 'Select legitimation(s)',
      requestAttestation: 'Request attestation(s)',
      sendAttestedClaims: 'Send legitimation(s)',
    },
    message: {
      sending: 'Sending legitimation(s) (2/2)',
      sent: {
        failure: 'Could not send legitimation(s).',
        success: 'Legitimation(s) successfully sent.',
      },
    },
    text: {
      attestationsHeadline: 'Select attestation(s)',
      claimHeadline: 'Legitimation',
      includePropertiesHeadline:
        'Select property(s) to include in Legitimation',
      noAttestationFound: 'No attestation found.',
      noClaimsFound: `No legitimation for CTYPE '#{ctype}' found.`,
      selectClaim: 'Select legitimation ...',
      selectClaimHeadline: 'Select legitimation(s)',
    },
  },
}

type Props = {
  sentClaim?: IPartialClaim
  claimEntries: Claims.Entry[]
  cTypeHash: sdk.ICType['hash']
  onFinished?: () => void
  senderAddress: Contact['publicIdentity']['address']
  context?: 'default' | 'legitimation'
}

type State = {
  cType?: CType
  claimSelectionData: {
    [key: string]: {
      claimEntry: Claims.Entry
      state: ChooseClaimForCtypeState
    }
  }
  workflowStarted: boolean
}

class ChooseClaimsForCType extends React.Component<Props, State> {
  private labels: ChooseClaimsForCTypeLabels

  constructor(props: Props) {
    super(props)
    this.state = {
      claimSelectionData: {},
      workflowStarted: false,
    }

    this.changeSelection = this.changeSelection.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
    this.startWorkflow = this.startWorkflow.bind(this)
  }

  public componentDidMount() {
    const { context, cTypeHash } = this.props

    this.labels = LABELS[context || 'default']

    CtypeRepository.findByHash(cTypeHash).then((cType: ICType) => {
      this.setState({ cType: CType.fromObject(cType) })
    })
  }

  public render() {
    const { claimEntries } = this.props
    const { claimSelectionData, cType, workflowStarted } = this.state
    const selectedClaimEntryIds = Object.keys(claimSelectionData)

    if (!cType) {
      return ''
    }

    const claims: Claims.Entry[] = claimEntries.filter(
      (claimEntry: Claims.Entry) => claimEntry.claim.cType === cType.cType.hash
    )

    return (
      <section className="ChooseClaimsForCType">
        {!!claims && !!claims.length ? (
          <React.Fragment>
            {!workflowStarted && (
              <div className="actions">
                <button onClick={this.startWorkflow}>
                  {this.labels.buttons.init}
                </button>
              </div>
            )}

            {workflowStarted && (
              <React.Fragment>
                <h4>{this.labels.text.selectClaimHeadline}</h4>

                {claims.map((claimEntry: Claims.Entry) =>
                  this.getChooseClaim(claimEntry)
                )}

                <div className="actions">
                  <button
                    disabled={!selectedClaimEntryIds.length}
                    onClick={this.sendClaim}
                  >
                    {this.labels.buttons.sendAttestedClaims}
                  </button>
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        ) : (
          <div className="no-claim">
            <span>
              {this.labels.text.noClaimsFound.replace(
                '#{ctype}',
                cType.cType.metadata.title.default
              )}
            </span>
            <Link to={`/claim/new/${cType.cType.hash}`}>
              {this.labels.buttons.createClaim}
            </Link>
          </div>
        )}
      </section>
    )
  }

  private getChooseClaim(claimEntry: Claims.Entry) {
    const { cType } = this.state

    if (!cType) {
      return ''
    }

    return (
      <ChooseClaimForCtype
        key={claimEntry.id}
        labels={this.labels}
        onChangeSelections={this.changeSelection}
        claimEntry={claimEntry}
        cType={cType}
      />
    )
  }

  private changeSelection(
    claimEntry: Claims.Entry,
    state: ChooseClaimForCtypeState
  ) {
    const { claimSelectionData } = this.state

    if (
      state.isSelected &&
      state.selectedAttestedClaims.length &&
      state.selectedClaimProperties.length
    ) {
      claimSelectionData[claimEntry.id] = { claimEntry, state }
    } else {
      delete claimSelectionData[claimEntry.id]
    }

    this.setState({
      claimSelectionData,
    })
  }

  private startWorkflow() {
    this.setState({
      workflowStarted: true,
    })
  }

  private getExcludedProperties(
    claimEntry: Claims.Entry,
    selectedClaimProperties: string[]
  ): string[] {
    const propertyNames: string[] = Object.keys(claimEntry.claim.contents)
    const excludedProperties = propertyNames.filter(
      (propertyName: string) =>
        selectedClaimProperties.indexOf(propertyName) === -1
    )
    return excludedProperties
  }

  private sendClaim() {
    const { context, onFinished, senderAddress, sentClaim } = this.props
    const { claimSelectionData } = this.state
    const selectedClaimEntryIds = Object.keys(claimSelectionData)

    if (!selectedClaimEntryIds) {
      return
    }

    const blockUi: BlockUi = FeedbackService.addBlockUi({
      headline: 'Resolving receiver (1/2)',
    })

    const attestedClaims: sdk.IAttestedClaim[] = []
    selectedClaimEntryIds.forEach(
      (selectedClaimEntryId: Claims.Entry['id']) => {
        const { claimEntry, state } = claimSelectionData[selectedClaimEntryId]
        state.selectedAttestedClaims.forEach(
          (selectedAttestedClaim: sdk.IAttestedClaim) => {
            attestedClaims.push(
              sdk.AttestedClaim.fromObject(
                selectedAttestedClaim
              ).createPresentation(
                this.getExcludedProperties(
                  claimEntry,
                  state.selectedClaimProperties
                )
              )
            )
          }
        )
      }
    )

    let request: ISubmitLegitimations | ISubmitClaimsForCtype

    if (context === 'legitimation') {
      request = {
        content: {
          claim: sentClaim,
          legitimations: attestedClaims,
        },
        type: MessageBodyType.SUBMIT_LEGITIMATIONS,
      } as ISubmitLegitimations
    } else {
      request = {
        content: attestedClaims,
        type: MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE,
      } as ISubmitClaimsForCtype
    }

    contactRepository.findAll().then(() => {
      const receiver: Contact | undefined = contactRepository.findByAddress(
        senderAddress
      )
      if (receiver) {
        blockUi.updateMessage(this.labels.message.sending as string)
        MessageRepository.send(receiver, request)
          .then(() => {
            blockUi.remove()
            notifySuccess(this.labels.message.sent.success)
            if (onFinished) {
              onFinished()
            }
          })
          .catch(error => {
            blockUi.remove()
            errorService.log({
              error,
              message: this.labels.message.sent.failure,
              origin: 'ChooseClaimForCType.sendClaim()',
              type: 'ERROR.FETCH.POST',
            })
          })
      } else {
        blockUi.remove()
        errorService.log({
          error: new Error(),
          message: 'Could not retrieve receiver',
          origin: 'ChooseClaimForCType.sendClaim()',
        })
      }
    })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
})

export default connect(mapStateToProps)(ChooseClaimsForCType)
