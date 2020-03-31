import React from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div')
    const component = <App />
    ReactDOM.render(component, div)
    ReactDOM.unmountComponentAtNode(div)
  })
})
