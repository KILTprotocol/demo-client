import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { connect } from 'react-redux'
import MessageDetailView from '../../components/MessageDetailView/MessageDetailView'
import MessageListView from '../../components/MessageListView/MessageListView'
import Modal, { ModalType } from '../../components/Modal/Modal'
import attestationService from '../../services/AttestationService'
import ContactRepository from '../../services/ContactRepository'
import ErrorService from '../../services/ErrorService'
import FeedbackService, { notifySuccess } from '../../services/FeedbackService'
import MessageRepository from '../../services/MessageRepository'
import * as Claims from '../../state/ducks/Claims'
import * as Wallet from '../../state/ducks/Wallet'
import { Contact } from '../../types/Contact'
import {
  Message,
  MessageBodyType,
  RequestAttestationForClaim,
  ApproveAttestationForClaim,
} from '../../types/Message'
import { BlockUi } from '../../types/UserFeedback'
import './MessageView.scss'

interface Props {
  selectedIdentity?: Wallet.Entry
  addAttestationToClaim: (
    claimHash: string,
    attestation: sdk.IAttestation
  ) => void
}

interface State {
  messages: Message[]
  currentMessage?: Message
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
    this.attestCurrentClaim = this.attestCurrentClaim.bind(this)
    this.importAttestation = this.importAttestation.bind(this)
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
            type={ModalType.BLANK}
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
      </section>
    )
  }

  public componentDidMount() {
    this.fetchMessages()
  }

  public componentDidUpdate(prevProps: Props) {
    const { selectedIdentity: previousSelected } = prevProps
    const { selectedIdentity: currentSelected } = this.props
    if (currentSelected !== previousSelected) {
      this.fetchMessages()
    }
  }

  private onDeleteMessage(id: string) {
    const { currentMessage } = this.state
    MessageRepository.deleteByMessageId(id)
      .then(() => {
        this.fetchMessages()
        if (currentMessage) {
          this.onCloseMessage()
        }
      })
      .catch(error => {
        ErrorService.log({
          error,
          message: `Could not delete message ${id}`,
          origin: 'MessageView.onDeleteMessage()',
          type: 'ERROR.FETCH.DELETE',
        })
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
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Fetching messages',
      })
      MessageRepository.findByMyIdentity(selectedIdentity.identity)
        .then((messages: Message[]) => {
          this.setState({
            messages,
          })
          blockUi.remove()
        })
        .catch(error => {
          ErrorService.log({
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

  private async attestCurrentClaim() {
    const { currentMessage } = this.state

    if (currentMessage) {
      const blockUi: BlockUi = FeedbackService.addBlockUi({
        headline: 'Fetching Contacts',
      })

      ContactRepository.findByKey(currentMessage.senderKey)
        .then((claimer: Contact) => {
          const claim: sdk.IClaim = (currentMessage.body as RequestAttestationForClaim)
            .content
          attestationService
            .attestClaim(claim)
            .then(async (attestation) => {
              await this.sendClaimAttestedMessage(attestation, claimer, claim)
              if (currentMessage.id) {
                this.onDeleteMessage(currentMessage.id)
              }
              this.fetchMessages()
              this.onCloseMessage()
              blockUi.remove()
              notifySuccess('Attestation successfully sent.')
            })
            .catch(error => {
              blockUi.remove()
              ErrorService.log({
                error,
                message: `Could not send attestation for claim ${
                  claim.hash
                } to ${claimer.name}`,
                origin: 'MessageView.attestCurrentClaim()',
                type: 'ERROR.FETCH.POST',
              })
            })
        })
        .catch(error => {
          ErrorService.log({
            error,
            message: 'Could not retrieve claimer',
            origin: 'MessageView.attestCurrentClaim()',
            type: 'ERROR.FETCH.GET',
          })
        })
    }
  }

  private async sendClaimAttestedMessage(
    attestation: sdk.IAttestation,
    claimer: Contact,
    claim: sdk.IClaim
  ): Promise<Message> {
    const attestationMessageBody: ApproveAttestationForClaim = {
      content: {
        attestation,
        claim,
      },
      type: MessageBodyType.APPROVE_ATTESTATION_FOR_CLAIM,
    }
    return MessageRepository.send(claimer, attestationMessageBody)
  }

  private importAttestation() {
    const { addAttestationToClaim } = this.props
    const { currentMessage } = this.state

    if (currentMessage && currentMessage.body) {
      const {
        claim,
        attestation,
      } = (currentMessage.body as ApproveAttestationForClaim).content
      addAttestationToClaim(claim.hash, attestation)
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
      attestation: sdk.IAttestation
    ) => {
      dispatch(Claims.Store.addAttestation(claimHash, attestation))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MessageView)
