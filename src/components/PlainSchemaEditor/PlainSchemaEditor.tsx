import { CTypeInputModel } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import Ajv, { ErrorObject } from 'ajv'
import * as codemirror from 'codemirror'
import { UnControlled as CodeMirror } from 'react-codemirror2'
import { js as beautify } from 'js-beautify'

import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript.js'

// import './codemirror.css'

type Props = {
  schema: string

  onUpdateSchema: (schema: string) => void
}

type State = {
  errors: Array<ErrorObject | Error>
  valid: boolean
}

class PlainSchemaEditor extends React.Component<Props, State> {
  private ajv: any

  constructor(props: Props) {
    super(props)
    this.state = {
      errors: [],
      valid: true,
    }

    const schema = CTypeInputModel

    this.ajv = new Ajv({
      meta: false,
    })
    this.ajv.addMetaSchema(schema)
  }

  public render() {
    return (
      <section className="PlainSchemaEditor">
        <div>
          <CodeMirror
            value={this.props.schema}
            options={{
              indentUnit: 4,
              lineNumbers: true,
              mode: { name: 'javascript', json: true },
            }}
            onChange={this.onChange}
          />
        </div>
        <button onClick={this.autoformat}>Autoformat</button>
        <div className="errors">
          {this.state.errors.map(error => (
            <div>{error}</div>
          ))}
        </div>
      </section>
    )
  }

  private onChange = (
    editor: codemirror.Editor,
    data: codemirror.EditorChange,
    value: string
  ) => {
    const { errors } = this.state
    let validate = ''
    try {
      validate = this.ajv.validateSchema(JSON.parse(value))
    } catch (e) {
      this.setState({
        valid: false,
        errors: [...errors, new Error('Invalid JSON')],
      })
      return
    }
    if (!validate) {
      this.setState({
        errors: [...errors, ...this.ajv.errors],
        valid: false,
      })
    } else {
      this.setState({
        errors: [],
        valid: true,
      })
    }
  }

  private changeSchema = (
    editor: codemirror.Editor,
    data: codemirror.EditorChange,
    value: string
  ) => {
    this.props.onUpdateSchema(value)
  }

  private autoformat = () => {
    const formatted = beautify(this.props.schema)
    this.props.onUpdateSchema(formatted)
  }
}

export default PlainSchemaEditor
