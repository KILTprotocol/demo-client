import * as sdk from '@kiltprotocol/prototype-sdk'
import {
  IPartialClaim,
  ISubmitClaimsForCtype,
  ISubmitLegitimations,
} from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import '../../../components/SelectAttestedClaim/SelectAttestedClaim.scss'
import { ClaimSelectionData } from '../../../components/SelectAttestedClaims/SelectAttestedClaims'
import contactRepository from '../../../services/ContactRepository'
import errorService from '../../../services/ErrorService'
import { notifyFailure, notifySuccess } from '../../../services/FeedbackService'
import MessageRepository from '../../../services/MessageRepository'
import * as Claims from '../../../state/ducks/Claims'
import { Contact } from '../../../types/Contact'

type Props = {
  sentClaim?: IPartialClaim
  cTypeHash?: sdk.ICType['hash']
  onFinished?: () => void
  senderAddress: Contact['publicIdentity']['address']
  context?: 'default' | 'legitimation'
}

type State = {
  claimSelectionData: ClaimSelectionData
  workflowStarted: boolean
}

abstract class OnRequestClaimsBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      claimSelectionData: {},
      workflowStarted: false,
    }

    this.sendClaim = this.sendClaim.bind(this)
    this.startWorkflow = this.startWorkflow.bind(this)
    this.changeClaimSelectionData = this.changeClaimSelectionData.bind(this)
  }

  protected changeClaimSelectionData(claimSelectionData: ClaimSelectionData) {
    this.setState({ claimSelectionData })
  }

  protected startWorkflow() {
    this.setState({
      workflowStarted: true,
    })
  }

  protected getExcludedProperties(
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

  protected getAttestedClaims() {
    const { claimSelectionData } = this.state
    const selectedClaimEntryIds = Object.keys(claimSelectionData)
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
    return attestedClaims
  }

  protected abstract createRequest():
    | ISubmitClaimsForCtype
    | ISubmitLegitimations

  protected sendClaim() {
    const { onFinished, senderAddress } = this.props

    const request = this.createRequest()

    if (request) {
      contactRepository
        .findByAddress(senderAddress)
        .then((receiver: Contact) => {
          MessageRepository.send(receiver, request)
            .then(() => {
              notifySuccess('Attested claim(s) successfully sent.')
              if (onFinished) {
                onFinished()
              }
            })
            .catch(error => {
              errorService.log({
                error,
                message: 'Could not send attested claim(s).',
                origin: 'OnRequestClaimsForCType.sendClaim()',
                type: 'ERROR.FETCH.POST',
              })
            })
        })
        .catch(error => {
          errorService.log({
            error: new Error(),
            message: 'Could not retrieve receiver',
            origin: 'OnRequestClaimsForCType.sendClaim()',
          })
        })
    } else {
      notifyFailure('No claim(s) selected.', false)
    }
  }
}

export default OnRequestClaimsBase
