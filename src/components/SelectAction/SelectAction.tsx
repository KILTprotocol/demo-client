import React from 'react'
import Select from 'react-select'
import type { ValueType } from 'react-select/lib/types'

import './SelectAction.scss'

type SelectActionOption = {
  label: string
  value: string
}

export type Action = {
  label: string
  callback: Function
}

type Props = {
  actions: Action[]
  className?: string
}

class SelectAction extends React.Component<Props> {
  // the select is a single select, so we expect a single value
  private executeAction = (
    selectedActionOption: ValueType<SelectActionOption>
  ): void => {
    if (!selectedActionOption) return
    const { actions } = this.props
    const action = actions.find(
      (_action: Action) =>
        _action.label === (selectedActionOption as SelectActionOption).value
    )

    if (action) {
      action.callback()
    }
  }

  public render(): JSX.Element {
    const { actions, className } = this.props
    const classes = ['SelectAction', className]
    const selectActionOptions: SelectActionOption[] = actions.map(
      (action: Action, index: number) => {
        if (
          index &&
          action.label.substr(0, action.label.indexOf(' ')) !==
            actions[index - 1].label.substr(
              0,
              actions[index - 1].label.indexOf(' ')
            )
        ) {
          classes.push(`groupAt-${index}`)
        }
        return {
          label: action.label,
          value: action.label,
        }
      }
    )

    return (
      <section className={classes.join(' ')}>
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
}

export default SelectAction
