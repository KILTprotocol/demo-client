import { IMessage } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'

import MessageDetailView from '../../components/MessageDetailView/MessageDetailView'
import MessageListView from '../../components/MessageListView/MessageListView'
import MessageSubject from '../../components/MessageSubject/MessageSubject'
import Modal, { ModalType } from '../../components/Modal/Modal'
import errorService from '../../services/ErrorService'
import FeedbackService, { safeDelete } from '../../services/FeedbackService'
import MessageRepository, {
  MessageOutput,
} from '../../services/MessageRepository'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { BlockingNotification, BlockUi } from '../../types/UserFeedback'

import './MessageView.scss'

interface Props {
  selectedIdentity?: Wallet.Entry
}

interface State {
  messages: MessageOutput[]
  currentMessage?: MessageOutput
}

class MessageView extends React.Component<Props, State> {
  private messageModal: Modal | null

  constructor(props: Props) {
    super(props)
    this.state = {
      messages: [],
    }
    this.onDeleteMessage = this.onDeleteMessage.bind(this)
    this.onOpenMessage = this.onOpenMessage.bind(this)
    this.onCloseMessage = this.onCloseMessage.bind(this)
  }

  public componentDidMount() {
    // TODO: without this setTimeout ew run into an infinite loop
    // this is somehow connected to the balance redux solution in app.tsx
    // the mapStateToProps methods retrigger each other as it seems
    // see also CTypeCreate.tsx
    setTimeout(() => {
      this.fetchMessages()
    })
  }

  public componentDidUpdate(prevProps: Props) {
    const { selectedIdentity: previousSelected } = prevProps
    const { selectedIdentity: currentSelected } = this.props
    if (currentSelected !== previousSelected) {
      this.fetchMessages()
    }
  }

  public render() {
    const { messages, currentMessage } = this.state
    return (
      <section className="MessageView">
        <h1>My Messages</h1>
        {!!messages && !!messages.length && (
          <MessageListView
            messages={messages}
            onDelete={this.onDeleteMessage}
            onOpen={this.onOpenMessage}
          />
        )}
        {!!currentMessage && (
          <Modal
            ref={el => {
              this.messageModal = el
            }}
            showOnInit={true}
            type={ModalType.BLANK}
            header={
              <div className="header-ContactPresentation">
                Message from{' '}
                <ContactPresentation address={currentMessage.senderAddress} />
              </div>
            }
            onCancel={this.onCloseMessage}
          >
            <MessageDetailView
              message={currentMessage}
              onDelete={this.onDeleteMessage}
              onCancel={this.onCloseMessage}
            />
          </Modal>
        )}
      </section>
    )
  }

  private fetchMessages() {
    const { selectedIdentity } = this.props

    if (selectedIdentity) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Fetching messages',
      })
      MessageRepository.findByMyIdentity(selectedIdentity.identity)
        .then((messages: MessageOutput[]) => {
          this.setState({
            messages,
          })
          blockUi.remove()
        })
        .catch(error => {
          errorService.log({
            error,
            message: `Could not retrieve messages for identity ${
              selectedIdentity.identity.address
            }`,
            origin: 'MessageView.fetchMessages()',
          })
          blockUi.remove()
        })
    } else {
      this.setState({
        messages: [],
      })
    }
  }

  private onDeleteMessage(message: MessageOutput) {
    const { currentMessage } = this.state

    if (!message.messageId) {
      return
    }

    if (currentMessage) {
      this.onCloseMessage()
      this.fetchMessages()
    }

    safeDelete(
      <span>
        the message '<MessageSubject message={message} />' from{' '}
        <ContactPresentation address={message.senderAddress} />
      </span>,
      (notification: BlockingNotification) => {
        MessageRepository.deleteByMessageId(message.messageId as string)
          .then(() => {
            this.fetchMessages()
            notification.remove()
          })
          .catch(error => {
            errorService.log({
              error,
              message: `Could not delete message ${message.messageId}`,
              origin: 'MessageView.onDeleteMessage()',
              type: 'ERROR.FETCH.DELETE',
            })
          })
      },
      false
    )
  }

  private onOpenMessage(message: MessageOutput) {
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
    this.setState({ currentMessage: undefined })
  }
}

const mapStateToProps = (state: ReduxState) => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect(mapStateToProps)(MessageView)
