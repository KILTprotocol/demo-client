import * as React from 'react'
import * as Renderer from 'react-test-renderer'
import If from './If'

describe('If Component', () => {
  it('renders true condition', () => {
    const component = Renderer.create(<If condition={true} then={<div>Then</div>} else={<div>Else</div>} />)
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('renders false condition', () => {
    const component = Renderer.create(<If condition={false} then={<div>Then</div>} else={<div>Else</div>} />)
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('renders true condition without else', () => {
    const component = Renderer.create(<If condition={true} then={<div>Then</div>} />)
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('renders false condition without else', () => {
    const component = Renderer.create(<If condition={false} then={<div>Then</div>} />)
    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})
