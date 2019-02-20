import * as React from 'react'
import Select from 'react-select'

type SelectActionOption = {
  label: string
  value: string
}

type Action = {
  label: string
  callback: () => void
}

type Props = {
  actions: Action[]
}

type State = {
  selectActionOptions: SelectActionOption[]
}

class SelectAction extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectActionOptions: [],
    }
  }

  public componentDidMount() {
    const { actions } = this.props
    this.setState({
      selectActionOptions: actions.map((action: Action) => ({
        label: action.label,
        value: action.label,
      })),
    })
  }

  public render() {
    const { selectActionOptions } = this.state

    return (
      <section className="SelectAction">
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable={false}
          isSearchable={false}
          isMulti={false}
          name="selectAction"
          options={selectActionOptions}
          value={{
            label: 'Select action…',
            value: '',
          }}
          onChange={this.executeAction}
        />
      </section>
    )
  }

  private executeAction = (selectedActionOption: SelectActionOption) => {
    const { actions } = this.props
    const action = actions.find(
      (_action: Action) => _action.label === selectedActionOption.value
    )

    if (action) {
      action.callback()
    }
  }
}

export default SelectAction
