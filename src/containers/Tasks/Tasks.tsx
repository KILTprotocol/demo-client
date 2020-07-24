import * as sdk from '@kiltprotocol/sdk-js'
import React, { ReactNode } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import Modal, { ModalType } from '../../components/Modal/Modal'

import SelectContacts from '../../components/SelectContacts/SelectContacts'
import SelectCTypes from '../../components/SelectCTypes/SelectCTypes'
import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { IContact } from '../../types/Contact'
import { ICType, ICTypeWithMetadata } from '../../types/Ctype'
import RequestAcceptDelegation, {
  RequestAcceptDelegationProps,
} from './RequestAcceptDelegation/RequestAcceptDelegation'
import RequestAttestation, {
  RequestAttestationProps,
} from './RequestAttestation/RequestAttestation'
import RequestClaimsForCType, {
  RequestClaimsForCTypeProps,
} from './RequestClaimsForCType/RequestClaimsForCType'
import RequestTerm, { RequestTermsProps } from './RequestTerms/RequestTerms'
import SubmitClaimsForCType, {
  SubmitClaimsForCTypeProps,
} from './SubmitClaimsForCType/SubmitClaimsForCType'
import SubmitTerms, { SubmitTermsProps } from './SubmitTerms/SubmitTerms'

import './Tasks.scss'

export type TaskProps =
  | {
      objective: undefined
      props: undefined
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_TERMS
      props: RequestTermsProps
    }
  | {
      objective: sdk.MessageBodyType.SUBMIT_TERMS
      props: SubmitTermsProps
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
      props: RequestAttestationProps
    }
  | {
      objective: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES_CLASSIC
      props: Partial<SubmitClaimsForCTypeProps> &
        Pick<SubmitClaimsForCTypeProps, 'cTypeHashes'>
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES
      props: Partial<RequestClaimsForCTypeProps> &
        Pick<RequestClaimsForCTypeProps, 'cTypeHashes'>
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION
      props: Partial<RequestAcceptDelegationProps> &
        Pick<RequestAcceptDelegationProps, 'cTypeHash'>
    }

type StateProps = {
  currentTask: TaskProps
}

type DispatchProps = {
  finishCurrentTask: () => void
}

type Props = StateProps & DispatchProps

type State = {
  openMenus: number
  selectedReceivers: IContact[]
  selectedCTypes: ICTypeWithMetadata[]
}

const initialState: State = {
  openMenus: 0,
  selectedCTypes: [],
  selectedReceivers: [],
}

class Tasks extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = initialState
    this.onSelectCTypes = this.onSelectCTypes.bind(this)
    this.onSelectReceivers = this.onSelectReceivers.bind(this)

    this.onMenuOpen = this.onMenuOpen.bind(this)
    this.onMenuClose = this.onMenuClose.bind(this)
    this.onTaskFinished = this.onTaskFinished.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  public componentDidUpdate(prevProps: Props): void {
    const { currentTask } = this.props
    if (
      !!currentTask !== !!prevProps.currentTask ||
      currentTask.objective !== prevProps.currentTask.objective
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(initialState)
    }
  }

  private onMenuOpen(): void {
    const { openMenus } = this.state
    this.setState({
      openMenus: openMenus + 1,
    })
  }

  private onMenuClose(): void {
    setTimeout(() => {
      const { openMenus } = this.state
      this.setState({
        openMenus: openMenus - 1,
      })
    }, 500)
  }

  private onSelectReceivers(selectedReceivers: IContact[]): void {
    this.setState({ selectedReceivers })
  }

  private onSelectCTypes(selectedCTypes: ICTypeWithMetadata[]): void {
    this.setState({ selectedCTypes })
  }

  private onTaskFinished(): void {
    const { finishCurrentTask } = this.props
    finishCurrentTask()
    this.setState(initialState)
  }

  private onCancel(): void {
    this.onTaskFinished()
  }

  private getTask(): ReactNode {
    const { currentTask } = this.props

    if (!currentTask) {
      return ''
    }

    const { selectedCTypes, selectedReceivers } = this.state

    const selectedReceiverAddresses = selectedReceivers.map(
      (receiver: IContact) => receiver.publicIdentity.address
    )

    switch (currentTask.objective) {
      case sdk.MessageBodyType.REQUEST_TERMS: {
        const { props } = currentTask
        const cTypeHash =
          selectedCTypes && selectedCTypes[0]
            ? selectedCTypes[0].cType.hash
            : null
        return this.getModal(
          'Request Terms',
          <>
            {this.getCTypeSelect(false, [props.cTypeHash])}
            {!!selectedCTypes.length && !!selectedReceivers.length ? (
              <RequestTerm
                {...props}
                cTypeHash={cTypeHash}
                receiverAddresses={selectedReceiverAddresses}
                onFinished={this.onTaskFinished}
                onCancel={this.onCancel}
              />
            ) : (
              this.getMessageElement(true)
            )}
          </>,
          props.receiverAddresses
        )
      }
      case sdk.MessageBodyType.SUBMIT_TERMS: {
        const { props } = currentTask
        const cTypeHash = props.claim ? props.claim.cTypeHash : null
        return this.getModal(
          'Submit Terms',
          <>
            {this.getCTypeSelect(false, [cTypeHash])}
            {!!selectedCTypes.length &&
            selectedCTypes[0].cType.hash &&
            !!selectedReceivers.length ? (
              <SubmitTerms
                {...props}
                claim={{ cTypeHash: selectedCTypes[0].cType.hash }}
                receiverAddresses={selectedReceiverAddresses}
                enablePreFilledClaim
                onFinished={this.onTaskFinished}
                onCancel={this.onCancel}
              />
            ) : (
              this.getMessageElement(true)
            )}
          </>,
          props.receiverAddresses
        )
      }
      case sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM: {
        const { props } = currentTask
        return this.getModal(
          'Request attestation for claim',
          <>
            {selectedReceivers.length ? (
              <RequestAttestation
                {...props}
                receiverAddresses={selectedReceiverAddresses}
                onFinished={this.onTaskFinished}
                onCancel={this.onCancel}
              />
            ) : (
              this.getMessageElement()
            )}
          </>
        )
      }
      case sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES: {
        const { props } = currentTask

        return this.getModal(
          'Request claims for cType',
          <>
            {this.getCTypeSelect(true, props.cTypeHashes)}
            {!!selectedCTypes.length && !!selectedReceivers.length ? (
              <RequestClaimsForCType
                cTypeHashes={selectedCTypes.map(
                  (cType: ICTypeWithMetadata) => cType.cType.hash
                )}
                receiverAddresses={selectedReceiverAddresses}
                onFinished={this.onTaskFinished}
                onCancel={this.onCancel}
              />
            ) : (
              this.getMessageElement(true)
            )}
          </>,
          props.receiverAddresses
        )
      }
      case sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES_CLASSIC: {
        const { props } = currentTask

        return this.getModal(
          'Submit claims for cTypes',
          <>
            {this.getCTypeSelect(true, props.cTypeHashes)}
            {!!selectedCTypes.length && !!selectedReceivers.length ? (
              <SubmitClaimsForCType
                cTypeHashes={selectedCTypes.map(
                  (cType: ICTypeWithMetadata) => cType.cType.hash
                )}
                receiverAddresses={selectedReceiverAddresses}
                onFinished={this.onTaskFinished}
                onCancel={this.onCancel}
              />
            ) : (
              this.getMessageElement(true)
            )}
          </>,
          props.receiverAddresses
        )
      }
      case sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION: {
        const { props } = currentTask
        return this.getModal(
          `Invite to ${props.isPCR ? 'PCR(s)' : 'delegation(s)'}`,
          <>
            {this.getCTypeSelect(false, [props.cTypeHash])}
            {!!selectedCTypes.length && !!selectedReceivers.length ? (
              <RequestAcceptDelegation
                isPCR={!!props.isPCR}
                cTypeHash={selectedCTypes[0].cType.hash}
                receiverAddresses={selectedReceiverAddresses}
                selectedDelegations={props.selectedDelegations}
                onFinished={this.onTaskFinished}
                onCancel={this.onCancel}
                onMenuOpen={this.onMenuOpen}
                onMenuClose={this.onMenuClose}
              />
            ) : (
              this.getMessageElement(true)
            )}
          </>,
          props.receiverAddresses
        )
      }
      default:
        return ''
    }
  }

  private getModal(
    header: Modal['props']['header'],
    content: ReactNode,
    preselectedReceiverAddresses: Array<
      IContact['publicIdentity']['address']
    > = []
  ): JSX.Element {
    const { openMenus } = this.state

    return (
      <Modal
        catchBackdropClick={openMenus > 0}
        header={header}
        preventCloseOnCancel
        preventCloseOnConfirm
        type={ModalType.BLANK}
        showOnInit
        onCancel={this.onCancel}
      >
        {this.getReceiverSelect(preselectedReceiverAddresses)}
        {content}
      </Modal>
    )
  }

  private getMessageElement(withCType?: boolean): JSX.Element {
    const mandatorySelects: string[] = ['receivers(s)']
    if (withCType) {
      mandatorySelects.push('cType(s)')
    }

    return (
      <div className="actions">
        <button type="button" onClick={this.onCancel}>
          Cancel
        </button>
        <button type="button" disabled>
          Please select {mandatorySelects.join(', ')} first
        </button>
      </div>
    )
  }

  private getReceiverSelect(
    preSelectedAddresses: Array<IContact['publicIdentity']['address']> = []
  ): JSX.Element {
    return (
      <section className="selectReceiver">
        <h2>Select receiver(s)</h2>
        <SelectContacts
          isMulti
          preSelectedAddresses={preSelectedAddresses}
          onChange={this.onSelectReceivers}
          onMenuOpen={this.onMenuOpen}
          onMenuClose={this.onMenuClose}
        />
      </section>
    )
  }

  private getCTypeSelect(
    isMulti: boolean,
    preSelectedCTypeHashes: Array<ICType['cType']['hash'] | null>
  ): JSX.Element {
    return (
      <section className="selectCType">
        <h2>Select cType{isMulti ? '(s)' : ''}</h2>
        <SelectCTypes
          preSelectedCTypeHashes={preSelectedCTypeHashes}
          isMulti={isMulti}
          onChange={this.onSelectCTypes}
          onMenuOpen={this.onMenuOpen}
          onMenuClose={this.onMenuClose}
        />
      </section>
    )
  }

  public render(): JSX.Element {
    return <section className="Tasks">{this.getTask()}</section>
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  currentTask: UiState.getCurrentTask(state),
})

const mapDispatchToProps: DispatchProps = {
  finishCurrentTask: () =>
    UiState.Store.updateCurrentTaskAction({
      objective: undefined,
      props: undefined,
    }),
}

export default connect(mapStateToProps, mapDispatchToProps)(Tasks)
