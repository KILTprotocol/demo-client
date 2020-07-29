import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'

import MessageDetailView from '../../components/MessageDetailView/MessageDetailView'
import MessageListView from '../../components/MessageListView/MessageListView'
import MessageSubject from '../../components/MessageSubject/MessageSubject'
import Modal, { ModalType } from '../../components/Modal/Modal'
import errorService from '../../services/ErrorService'
import FeedbackService, { safeDelete } from '../../services/FeedbackService'
import MessageRepository, {
  IMessageOutput,
} from '../../services/MessageRepository'
import * as Wallet from '../../state/ducks/Wallet'
import { State as ReduxState } from '../../state/PersistentStore'
import { IBlockingNotification, BlockUi } from '../../types/UserFeedback'

import './MessageView.scss'

type StateProps = {
  selectedIdentity?: Wallet.Entry
}
type Props = StateProps

type State = {
  messages: IMessageOutput[]
  currentMessage?: IMessageOutput
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

  public componentDidMount(): void {
    this.fetchMessages()
  }

  public componentDidUpdate(prevProps: Props): void {
    const { selectedIdentity: previousSelected } = prevProps
    const { selectedIdentity: currentSelected } = this.props
    if (currentSelected !== previousSelected) {
      this.fetchMessages()
    }
  }

  private onDeleteMessage(message: IMessageOutput): void {
    const { currentMessage } = this.state

    if (!message.messageId) {
      return
    }

    if (currentMessage) {
      this.onCloseMessage()
      setTimeout(() => {
        this.fetchMessages()
      })
    }

    safeDelete(
      <span>
        the message &apos;
        <MessageSubject message={message} />
        &apos; from{' '}
        <ContactPresentation address={message.senderAddress} inline />
      </span>,
      (notification: IBlockingNotification) => {
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

  private onOpenMessage(message: IMessageOutput): void {
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

  private onCloseMessage(): void {
    this.setState({ currentMessage: undefined })
  }

  private fetchMessages(): void {
    const { selectedIdentity } = this.props

    if (selectedIdentity) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Fetching messages',
      })
      MessageRepository.findByMyIdentity(selectedIdentity.identity)
        .then((messages: IMessageOutput[]) => {
          this.setState({
            messages,
          })
          blockUi.remove()
        })
        .catch(error => {
          errorService.log({
            error,
            message: `Could not retrieve messages for identity ${selectedIdentity.identity.address}`,
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

  public render(): JSX.Element {
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
            showOnInit
            type={ModalType.BLANK}
            header={
              <div className="header-ContactPresentation">
                Message from{' '}
                <ContactPresentation
                  address={currentMessage.senderAddress}
                  interactive
                  inline
                />
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
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

export default connect<StateProps>(mapStateToProps)(MessageView)
