import * as sdk from '@kiltprotocol/sdk-js'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import SchemaEditor from '../../components/SchemaEditor/SchemaEditor'
import * as common from 'schema-based-json-editor'
import { QuoteInputModel } from '../../utils/QuoteUtils/QuoteInputSchema'

type Props = {}

type State = {
  isValid: boolean
  quote: object
}

class QuoteView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isValid: false,
      quote: {},
    }
  }

  public componentDidMount() {}

  public render() {
    const { quote } = this.state

    return (
      <section>
        <h1>Quote</h1>
        <SchemaEditor
          schema={QuoteInputModel as common.Schema}
          initialValue={quote}
          updateValue={this.updateQuote}
        />
      </section>
    )
  }

  private updateQuote(contents: any, isValid: boolean) {
    const { quote } = this.state
    this.setState({
      isValid,
      quote: { ...quote, contents },
    })
  }
}

export default withRouter(QuoteView)
