import * as React from 'react'
import Select from 'react-select'

import './SelectAction.scss'

type SelectActionOption = {
  label: string
  value: string
}

export type Action = {
  label: string
  callback: () => void
}

type Props = {
  actions: Action[]

  className?: string
}

class SelectAction extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectActionOptions: [],
    }
  }

  public render() {
    const { actions, className } = this.props
    const selectActionOptions = actions.map((action: Action) => ({
      label: action.label,
      value: action.label,
    }))

    return (
      <section className={`SelectAction ${className}`}>
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
