import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import Loading from '../../components/Loading/Loading'
import MessageDetailView from '../../components/MessageDetailView/MessageDetailView'
import MessageListView from '../../components/MessageListView/MessageListView'
import Modal from '../../components/Modal/Modal'
import attestationService from '../../services/AttestationService'
import ContactRepository from '../../services/ContactRepository'
import ErrorService from '../../services/ErrorService'
import MessageRepository from '../../services/MessageRepository'
import * as Claims from '../../state/ducks/Claims'
import * as Wallet from '../../state/ducks/Wallet'
import { Contact } from '../../types/Contact'
import {
  Message,
  MessageBodyType,
  RequestAttestationForClaim,
} from '../../types/Message'
import './MessageView.scss'

interface Props {
  selectedIdentity?: Wallet.Entry
  addAttestationToClaim: (
    claimHash: string,
    attestation: sdk.Attestation
  ) => void
}

interface State {
  messages: Message[]
  fetching: boolean
  currentMessage?: Message
}

class MessageView extends React.Component<Props, State> {
  private messageModal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      fetching: false,
      messages: [],
    }
    this.onDeleteMessage = this.onDeleteMessage.bind(this)
    this.onOpenMessage = this.onOpenMessage.bind(this)
    this.onCloseMessage = this.onCloseMessage.bind(this)
    this.attestCurrentClaim = this.attestCurrentClaim.bind(this)
    this.importAttestation = this.importAttestation.bind(this)
  }

  public render() {
    const { messages, currentMessage, fetching } = this.state
    return (
      <section className="MessageView">
        <h1>My Messages</h1>
        {!fetching && !!messages && !!messages.length && (
          <MessageListView
            messages={messages}
            onDelete={this.onDeleteMessage}
            onOpen={this.onOpenMessage}
          />
        )}
        {!fetching && !!currentMessage && (
          <Modal
            ref={el => {
              this.messageModal = el
            }}
            type="blank"
            header={`Message from ${currentMessage.sender}`}
            onCancel={this.onCloseMessage}
          >
            <MessageDetailView
              message={currentMessage}
              onDelete={this.onDeleteMessage}
              onCancel={this.onCloseMessage}
            >
              {this.getMessageActions()}
            </MessageDetailView>
          </Modal>
        )}
        {fetching && <Loading />}
      </section>
    )
  }

  public componentDidMount() {
    this.setState({ fetching: true })
    this.fetchMessages()
  }

  public componentDidUpdate(prevProps: Props) {
    const { selectedIdentity: previousSelected } = prevProps
    const { selectedIdentity: currentSelected } = this.props
    if (currentSelected !== previousSelected) {
      this.setState({ fetching: true })
      this.fetchMessages()
    }
  }

  private onDeleteMessage(id: string) {
    const { currentMessage } = this.state
    MessageRepository.deleteByMessageId(id).then(() => {
      this.fetchMessages()
      if (currentMessage) {
        this.onCloseMessage()
      }
    })
  }

  private getMessageActions() {
    const { currentMessage } = this.state
    const messageBodyType: MessageBodyType | undefined =
      currentMessage && currentMessage.body && currentMessage.body.type

    switch (messageBodyType) {
      case MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM:
        return <button onClick={this.attestCurrentClaim}>Attest Claim</button>
      case MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM:
        return (
          <button onClick={this.importAttestation}>Import Attestation</button>
        )
      default:
        return ''
    }
  }

  private onOpenMessage(message: Message) {
    this.setState(
      {
        currentMessage: message,
      },
      () => {
        if (this.messageModal) {
          this.messageModal.show()
        }
      }
    )
  }

  private onCloseMessage() {
    this.setState({
      currentMessage: undefined,
    })
    if (this.messageModal) {
      this.messageModal.hide()
    }
  }

  private fetchMessages() {
    const { selectedIdentity } = this.props
    if (selectedIdentity) {
      MessageRepository.findByMyIdentity(selectedIdentity.identity).then(
        (messages: Message[]) => {
          this.setState({
            fetching: false,
            messages,
          })
        }
      )
    } else {
      this.setState({
        fetching: false,
        messages: [],
      })
    }
  }

  private async attestCurrentClaim() {
    const { currentMessage } = this.state

    if (currentMessage) {
      try {
        const claimer: Contact = await ContactRepository.findByKey(
          currentMessage.senderKey
        )
        const claim: sdk.IClaim = (currentMessage.body as RequestAttestationForClaim)
          .content
        await attestationService.attestClaim(claim, claimer)
      } catch (error) {
        ErrorService.log({
          error,
          message: 'Error attesting claim',
          origin: 'MessageView.attestCurrentClaim()',
        })
      }
      this.fetchMessages()
    }
    this.onCloseMessage()
  }

  private importAttestation() {
    const { addAttestationToClaim } = this.props
    const { currentMessage } = this.state

    if (currentMessage && currentMessage.body) {
      const attestation = currentMessage.body.content as sdk.Attestation
      addAttestationToClaim(attestation.claimHash, attestation)
      this.onCloseMessage()
      if (currentMessage.id) {
        this.onDeleteMessage(currentMessage.id)
      }
    }
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

const mapDispatchToProps = (dispatch: (action: Claims.Action) => void) => {
  return {
    addAttestationToClaim: (
      claimHash: string,
      attestation: sdk.Attestation
    ) => {
      dispatch(Claims.Store.addAttestation(claimHash, attestation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MessageView)
