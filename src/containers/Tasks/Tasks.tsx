import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { ReactNode } from 'react'
import { connect } from 'react-redux'
import Modal, { ModalType } from '../../components/Modal/Modal'

import SelectContacts from '../../components/SelectContacts/SelectContacts'
import SelectCTypes from '../../components/SelectCTypes/SelectCTypes'
import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { Contact } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
import RequestAttestation, {
  RequestAttestationProps,
} from './RequestAttestation/RequestAttestation'
import RequestLegitimation, {
  RequestLegitimationsProps,
} from './RequestLegitimation/RequestLegitimation'
import SubmitClaimsForCType, {
  SubmitClaimsForCTypeProps,
} from './SubmitClaimsForCType/SubmitClaimsForCType'
import SubmitLegitimations, {
  SubmitLegitimationsProps,
} from './SubmitLegitimations/SubmitLegitimations'

import './Tasks.scss'

type BaseTaskProps = {
  receiverAddresses: Array<Contact['publicIdentity']['address']>
  onFinished?: () => void
}

// export type UndefinedTaskProps = {
//   objective: undefined
//   props: undefined
// }
//
// export type RequestLegitimationsTaskProps = {
//   objective: sdk.MessageBodyType.REQUEST_LEGITIMATIONS
//   props: Partial<RequestLegitimationsProps>
// }
// export type SubmitLegitimationsTaskProps = {
//   objective: sdk.MessageBodyType.SUBMIT_LEGITIMATIONS
//   props: Partial<SubmitLegitimationsProps>
// }
// export type RequestAttestationTaskProps = {
//   objective: sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
//   props: Partial<RequestAttestationProps>
// }
// export type SubmitClaimsForCTypeTaskProps = {
//   objective: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE
//   props: Partial<SubmitClaimsForCTypeProps>
// }

export type TaskProps =
  | {
      objective: undefined
      props: undefined
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_LEGITIMATIONS
      props: RequestLegitimationsProps
    }
  | {
      objective: sdk.MessageBodyType.SUBMIT_LEGITIMATIONS
      props: SubmitLegitimationsProps
    }
  | {
      objective: sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM
      props: RequestAttestationProps
    }
  | {
      objective: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE
      props: Partial<SubmitClaimsForCTypeProps>
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
  selectedCTypes: ICType[]
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
      case sdk.MessageBodyType.REQUEST_LEGITIMATIONS: {
        const props = currentTask.props as RequestLegitimationsProps
        const cTypeHash =
          selectedCTypes && selectedCTypes[0]
            ? selectedCTypes[0].cType.hash
            : undefined
        return this.getModal(
          'Request legitimations',
          <>
            {this.getCTypeSelect(false, [props.cTypeHash])}
            <RequestLegitimation
              {...props}
              cTypeHash={cTypeHash}
              receiverAddresses={selectedReceiverAddresses}
              onFinished={this.onTaskFinished}
            />
          </>,
          props.receiverAddresses
        )
      }
      case sdk.MessageBodyType.SUBMIT_LEGITIMATIONS: {
        const props = currentTask.props as SubmitLegitimationsProps
        return this.getModal(
          'Submit legitimations',
          <>
            <SubmitLegitimations
              {...props}
              receiverAddresses={selectedReceiverAddresses}
              onFinished={this.onTaskFinished}
            />
          </>
        )
      }
      case sdk.MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM: {
        const props = currentTask.props as RequestAttestationProps
        return this.getModal(
          'Request Attestation for claim',
          <>
            <RequestAttestation
              {...props}
              receiverAddresses={selectedReceiverAddresses}
              onFinished={this.onTaskFinished}
            />
          </>
        )
      }
      case sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE: {
        const props = currentTask.props as Partial<SubmitClaimsForCTypeProps>

        return this.getModal(
          'Submit claims for cType',
          <>
            {this.getCTypeSelect(false, [props.cTypeHash])}
            {!!selectedCTypes.length && !!selectedReceivers.length && (
              <section className="selectCType">
                <h2>…and now the claims</h2>
                <SubmitClaimsForCType
                  autoStart={true}
                  cTypeHash={selectedCTypes[0].cType.hash}
                  receiverAddresses={selectedReceiverAddresses}
                  onFinished={this.onTaskFinished}
                />
              </section>
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
        onCancel={this.onTaskFinished}
      >
        {this.getReceiverSelect(preselectedReceiverAddresses)}
        {content}
      </Modal>
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
        <h2>Select receivers …</h2>
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
    preSelectedCTypeHashes: Array<ICType['cType']['hash']> = []
  ) {
    return (
      <section className="selectCType">
        <h2>… cType{isMulti ? 's' : ''} …</h2>
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

  private onSelectCTypes(selectedCTypes: ICType[]) {
    this.setState({ selectedCTypes })
  }

  private onTaskFinished() {
    const { finishCurrentTask } = this.props
    finishCurrentTask()
    this.setState(initialState)
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
