import Ajv from 'ajv'
import MetaSchema from 'ajv/lib/refs/json-schema-draft-07.json'

import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript.js'

import { js as beautify } from 'js-beautify'
import * as React from 'react'
import { Controlled as CodeMirror } from 'react-codemirror2'
import './codemirror.css'

type Props = {
  schema: string
  updateSchema: (schema: string) => void
}

class CtypeEditorComponent extends React.Component<Props, {}> {
  public state = {
    errors: [],
    valid: true,
  }

  private ajv: any

  constructor(props: Props) {
    super(props)
    const schema = MetaSchema as any
    schema.additionalProperties = false
    this.ajv = new Ajv({
      meta: false,
    })
    this.ajv.addMetaSchema(schema)
  }

  public render() {
    return (
      <div>
        <div style={{ textAlign: 'left', maxWidth: '700px', margin: '0 auto' }}>
          <CodeMirror
            value={this.props.schema}
            options={{
              indentUnit: 4,
              lineNumbers: true,
              mode: { name: 'javascript', json: true },
            }}
            onBeforeChange={this.changeSchema}
            onChange={this.validate}
          />
        </div>
        <button onClick={this.autoformat}>Autoformat</button>
        <div
          style={{
            backgroundColor: this.state.valid ? 'green' : 'red',
            height: '15px',
            margin: '0 auto',
            width: '170px',
          }}
        />
        {this.state.errors.map(error => (
          <div>{error}</div>
        ))}
      </div>
    )
  }

  private validate = (editor: any, data: any, value: string) => {
    let validate = ''
    try {
      validate = this.ajv.validateSchema(JSON.parse(value))
    } catch (e) {
      console.log(e)
      this.setState({ valid: false, errors: ['JSON invalid'] })
      return
    }
    if (!validate) {
      const errors = this.ajv.errors.map((error: any) => {
        return error.message
      })
      this.setState({
        errors,
        valid: false,
      })
      console.log(this.ajv.errors)
    } else {
      this.setState({ valid: true, errors: [] })
    }
  }

  private changeSchema = (editor: any, data: any, value: string) => {
    this.props.updateSchema(value)
  }

  private autoformat = () => {
    const formatted = beautify(this.props.schema)
    this.props.updateSchema(formatted)
  }
}

export default CtypeEditorComponent
