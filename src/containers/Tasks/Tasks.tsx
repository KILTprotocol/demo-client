import * as sdk from '@kiltprotocol/sdk-js'
import * as React from 'react'
import { ReactNode } from 'react'
import { connect } from 'react-redux'
import Modal, { ModalType } from '../../components/Modal/Modal'

import SelectContacts from '../../components/SelectContacts/SelectContacts'
import SelectCTypes from '../../components/SelectCTypes/SelectCTypes'
import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { Contact } from '../../types/Contact'
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
      objective: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES
      props: Partial<SubmitClaimsForCTypeProps>
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPES
      props: Partial<RequestClaimsForCTypeProps>
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION
      props: Partial<RequestAcceptDelegationProps>
    }

type Props = {
  // mapStateToProps
  currentTask: TaskProps
  // mapDispatchToProps
  finishCurrentTask: () => void
}

type State = {
  openMenus: number
  selectedReceivers: Contact[]
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

  public componentDidUpdate(prevProps: Props) {
    if (
      !!this.props.currentTask !== !!prevProps.currentTask ||
      this.props.currentTask.objective !== prevProps.currentTask.objective
    ) {
      this.setState(initialState)
    }
  }

  public render() {
    return <section className="Tasks">{this.getTask()}</section>
  }

  private getTask() {
    const { currentTask } = this.props

    if (!currentTask) {
      return ''
    }

    const { selectedCTypes, selectedReceivers } = this.state

    const selectedReceiverAddresses = selectedReceivers.map(
      (receiver: Contact) => receiver.publicIdentity.address
    )

    switch (currentTask.objective) {
      case sdk.MessageBodyType.REQUEST_TERMS: {
        const props = currentTask.props
        const cTypeHash =
          selectedCTypes && selectedCTypes[0]
            ? selectedCTypes[0].cType.hash
            : undefined
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
        const props = currentTask.props
        const cTypeHash = props.claim ? props.claim.cTypeHash : undefined
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
                enablePreFilledClaim={true}
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
        const props = currentTask.props
        return this.getModal(
          'Request attestation for claim',
          <>
            {!!selectedReceivers.length ? (
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
        const props = currentTask.props

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
      case sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES: {
        const props = currentTask.props

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
        const props = currentTask.props
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
      Contact['publicIdentity']['address']
    > = []
  ) {
    const { openMenus } = this.state

    return (
      <Modal
        catchBackdropClick={openMenus > 0}
        header={header}
        preventCloseOnCancel={true}
        preventCloseOnConfirm={true}
        type={ModalType.BLANK}
        showOnInit={true}
        onCancel={this.onCancel}
      >
        {this.getReceiverSelect(preselectedReceiverAddresses)}
        {content}
      </Modal>
    )
  }

  private getMessageElement(withCType?: boolean) {
    const mandatorySelects: string[] = ['receivers(s)']
    if (withCType) {
      mandatorySelects.push('cType(s)')
    }

    return (
      <div className="actions">
        <button onClick={this.onCancel}>Cancel</button>
        <button disabled={true}>
          Please select {mandatorySelects.join(', ')} first
        </button>
      </div>
    )
  }

  private onMenuOpen() {
    const { openMenus } = this.state
    this.setState({
      openMenus: openMenus + 1,
    })
  }

  private onMenuClose() {
    setTimeout(() => {
      const { openMenus } = this.state
      this.setState({
        openMenus: openMenus - 1,
      })
    }, 500)
  }

  private getReceiverSelect(
    preSelectedAddresses: Array<Contact['publicIdentity']['address']> = []
  ) {
    return (
      <section className="selectReceiver">
        <h2>Select receiver(s)</h2>
        <SelectContacts
          isMulti={true}
          preSelectedAddresses={preSelectedAddresses}
          onChange={this.onSelectReceivers}
          onMenuOpen={this.onMenuOpen}
          onMenuClose={this.onMenuClose}
        />
      </section>
    )
  }

  private onSelectReceivers(selectedReceivers: Contact[]) {
    this.setState({ selectedReceivers })
  }

  private getCTypeSelect(
    isMulti: boolean,
    preSelectedCTypeHashes?: Array<ICType['cType']['hash'] | undefined>
  ) {
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

  private onSelectCTypes(selectedCTypes: ICTypeWithMetadata[]) {
    this.setState({ selectedCTypes })
  }

  private onTaskFinished() {
    const { finishCurrentTask } = this.props
    finishCurrentTask()
    this.setState(initialState)
  }

  private onCancel() {
    this.onTaskFinished()
  }
}

const mapStateToProps = (state: ReduxState) => ({
  currentTask: UiState.getCurrentTask(state),
})

const mapDispatchToProps = (dispatch: (action: UiState.Action) => void) => {
  return {
    finishCurrentTask: () => {
      dispatch(
        UiState.Store.updateCurrentTaskAction({
          objective: undefined,
          props: undefined,
        })
      )
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks)
