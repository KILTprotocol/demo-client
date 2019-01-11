import * as React from 'react'
import { connect } from 'react-redux'
import Loading from '../../components/Loading/Loading'

import MessageDetailView from '../../components/MessageDetailView/MessageDetailView'
import MessageListView from '../../components/MessageListView/MessageListView'
import Modal from '../../components/Modal/Modal'
import ContactRepository from '../../services/ContactRepository'
import ErrorService from '../../services/ErrorService'
import MessageRepository from '../../services/MessageRepository'
import * as Wallet from '../../state/ducks/Wallet'
import { Contact } from '../../types/Contact'
import {
  ApproveAttestationForClaim,
  Message,
  MessageBodyType,
} from '../../types/Message'

interface Props {
  selectedIdentity?: Wallet.Entry
}

interface State {
  messages: Message[]
  fetching: boolean
  currentMessage?: Message
}

class MessageList extends React.Component<Props, State> {
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
  }

  public render() {
    const { messages, currentMessage, fetching } = this.state
    return (
      <section className="MessageList">
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
    this.getMessages()
  }

  public componentWillReceiveProps(props: Props) {
    this.setState({ fetching: true })
    this.getMessages()
  }

  private onDeleteMessage(id: string) {
    const { currentMessage } = this.state
    MessageRepository.deleteByMessageId(id).then(() => {
      this.getMessages()
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
      case 'request-attestation-for-claim':
        return <button onClick={this.attestCurrentClaim}>Attest Claim</button>
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
  }

  private getMessages() {
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

  private attestCurrentClaim() {
    const { currentMessage } = this.state

    if (currentMessage) {
      ContactRepository.findAll().then(
        (contacts: Contact[]) => {
          const receiver: Contact | undefined = contacts.find(
            (contact: Contact) => contact.key === currentMessage.senderKey
          )
          const messageBody: ApproveAttestationForClaim = currentMessage.body as ApproveAttestationForClaim
          if (receiver && messageBody) {
            MessageRepository.send(receiver, {
              content: messageBody.content,
              type: 'approve-attestation-for-claim',
            }).then(
              ()=>{
                this.onCloseMessage()
                this.getMessages()
              }
            )
          } else {
            ErrorService.log('fetch.GET', {
              message: `Could not resolve contact ${
                currentMessage.senderKey
              } from list of all contacts`,
              name: 'resolve contact error',
            })
          }
        },
        error => {
          ErrorService.log(
            'fetch.GET',
            error,
            'Could not retrieve all contacts from registry'
          )
        }
      )
    }
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    selectedIdentity: state.wallet.get('selected'),
  }
}

export default connect(mapStateToProps)(MessageList)
