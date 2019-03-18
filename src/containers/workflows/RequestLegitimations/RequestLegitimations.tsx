import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import SelectDelegations from '../../../components/SelectDelegations/SelectDelegations'
import { MessageOutput } from '../../../services/MessageRepository'
import SelectAttestedClaims from '../OnRequestClaimsForCType/OnRequestClaimsForCType'

type Props = {
  message: MessageOutput
  onFinished: () => void
}

type State = {}

class RequestLegitimations extends React.Component<Props, State> {
  public render() {
    const { message } = this.props
    return (
      <>
        <SelectAttestedClaims
          senderAddress={message.senderAddress}
          sentClaim={(message.body as sdk.IRequestLegitimations).content}
          onFinished={this.onFinished}
          context="legitimation"
        />
        <h4>Select delegation</h4>
        <SelectDelegations isMulti={false} />
      </>
    )
  }

  private onFinished() {
    const { onFinished } = this.props
    if (onFinished) {
      onFinished()
    }
  }
}

export default RequestLegitimations
