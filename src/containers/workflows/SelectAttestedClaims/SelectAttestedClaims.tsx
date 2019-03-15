import * as sdk from '@kiltprotocol/prototype-sdk'
import {
  IPartialClaim,
  ISubmitClaimsForCtype,
  ISubmitLegitimations,
  MessageBodyType,
} from '@kiltprotocol/prototype-sdk'
import { groupBy } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import CTypePresentation from '../../../components/CTypePresentation/CTypePresentation'

import SelectAttestedClaim, {
  State as SelectAttestedClaimState,
} from '../../../components/SelectAttestedClaim/SelectAttestedClaim'
import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import contactRepository from '../../../services/ContactRepository'
import CTypeRepository from '../../../services/CtypeRepository'
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

import './SelectAttestedClaims.scss'

export type SelectAttestedClaimsLabels = {
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
  default: SelectAttestedClaimsLabels
  legitimation: SelectAttestedClaimsLabels
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
      noClaimsForCTypeFound: `No claims for CTYPE '#{ctype}' found.`,
      noClaimsFound: `No claims found.`,
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
      noClaimsForCTypeFound: `No legitimations for CTYPE '#{ctype}' found.`,
      noClaimsFound: `No legitimations found.`,
      selectClaim: 'Select legitimation ...',
      selectClaimHeadline: 'Select legitimation(s)',
    },
  },
}

type GroupedClaimEntries = {
  [cTypeHash: string]: Claims.Entry[]
}

type Props = {
  sentClaim?: IPartialClaim
  claimEntries: Claims.Entry[]
  cTypeHash?: sdk.ICType['hash']
  onFinished?: () => void
  senderAddress: Contact['publicIdentity']['address']
  context?: 'default' | 'legitimation'
}

type State = {
  cType?: CType
  claimSelectionData: {
    [key: string]: {
      claimEntry: Claims.Entry
      state: SelectAttestedClaimState
    }
  }
  relevantClaimEntries: GroupedClaimEntries
  workflowStarted: boolean
}

class SelectAttestedClaims extends React.Component<Props, State> {
  private labels: SelectAttestedClaimsLabels

  constructor(props: Props) {
    super(props)
    this.state = {
      claimSelectionData: {},
      relevantClaimEntries: this.getRelevantClaimEntries(),
      workflowStarted: false,
    }

    this.labels = LABELS[props.context || 'default']

    this.changeSelection = this.changeSelection.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
    this.startWorkflow = this.startWorkflow.bind(this)
  }

  public componentDidMount() {
    const { cTypeHash } = this.props

    if (cTypeHash) {
      CTypeRepository.findByHash(cTypeHash).then((cType: ICType) => {
        this.setState({ cType: CType.fromObject(cType) })
      })
    }
  }

  public render() {
    const { cTypeHash } = this.props
    const {
      claimSelectionData,
      relevantClaimEntries,
      workflowStarted,
    } = this.state
    const selectedClaimEntryIds = Object.keys(claimSelectionData)

    const relevantCTypes = Object.keys(relevantClaimEntries)

    return (
      <section className="SelectAttestedClaims">
        {!!relevantCTypes && !!relevantCTypes.length ? (
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

                {relevantCTypes.map(
                  (_cTypeHash: Claims.Entry['claim']['cType']) =>
                    this.getCTypeContainer(_cTypeHash)
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
        ) : cTypeHash ? (
          this.getNoClaimsForCtypeFound()
        ) : (
          this.getNoClaimsFound()
        )}
      </section>
    )
  }

  private getNoClaimsFound() {
    return (
      <div className="no-claim">
        <span>{this.labels.text.noClaimsFound}</span>
        <Link to={`/ctype`}>{this.labels.buttons.createClaim}</Link>
      </div>
    )
  }

  private getNoClaimsForCtypeFound() {
    const { cTypeHash } = this.props
    const { cType } = this.state
    return (
      <div className="no-claim">
        <span>
          {this.labels.text.noClaimsFound.replace(
            '#{ctype}',
            cType ? cType.cType.metadata.title.default : cTypeHash || ''
          )}
        </span>
        <Link to={`/claim/new/${cTypeHash}`}>
          {this.labels.buttons.createClaim}
        </Link>
      </div>
    )
  }

  private getCTypeContainer(cTypeHash: Claims.Entry['claim']['cType']) {
    const { relevantClaimEntries } = this.state
    return (
      <div className="cType-container" key={cTypeHash}>
        <h4>
          CType <CTypePresentation cTypeHash={cTypeHash} inline={true} />
        </h4>
        {relevantClaimEntries[cTypeHash].map((claimEntry: Claims.Entry) =>
          this.getSelectAttestedClaim(claimEntry)
        )}
      </div>
    )
  }

  private getSelectAttestedClaim(claimEntry: Claims.Entry) {
    const { cTypeHash } = this.props

    return (
      <SelectAttestedClaim
        key={claimEntry.id}
        labels={this.labels}
        onChangeSelections={this.changeSelection}
        claimEntry={claimEntry}
        cTypeHash={cTypeHash}
      />
    )
  }

  private getRelevantClaimEntries(): GroupedClaimEntries {
    const { claimEntries, cTypeHash } = this.props

    const relevantClaimEntries = cTypeHash
      ? claimEntries.filter(
          (claimEntry: Claims.Entry) => claimEntry.claim.cType === cTypeHash
        )
      : claimEntries

    return groupBy(
      relevantClaimEntries,
      (claimEntry: Claims.Entry) => claimEntry.claim.cType
    )
  }

  private changeSelection(
    claimEntry: Claims.Entry,
    state: SelectAttestedClaimState
  ) {
    const { claimSelectionData } = this.state

    if (state.isSelected && state.selectedAttestedClaims.length) {
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

    contactRepository
      .findByAddress(senderAddress)
      .then((receiver: Contact) => {
        MessageRepository.send(receiver, request)
          .then(() => {
            notifySuccess(this.labels.message.sent.success)
            if (onFinished) {
              onFinished()
            }
          })
          .catch(error => {
            errorService.log({
              error,
              message: this.labels.message.sent.failure,
              origin: 'SelectAttestedClaim.sendClaim()',
              type: 'ERROR.FETCH.POST',
            })
          })
      })
      .catch(error => {
        errorService.log({
          error: new Error(),
          message: 'Could not retrieve receiver',
          origin: 'SelectAttestedClaim.sendClaim()',
        })
      })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  claimEntries: Claims.getClaims(state),
})

export default connect(mapStateToProps)(SelectAttestedClaims)
