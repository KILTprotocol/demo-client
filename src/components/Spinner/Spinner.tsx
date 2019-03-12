import * as React from 'react'
import './Spinner.scss'

type Props = {
  size?: number
  strength?: number
  color?: string
}

const Spinner = (props: Props) => {
  const { size, color, strength } = props
  const ldsRingStyles = {
    height: `${size}px`,
    width: `${size}px`,
  }
  const ldsRingPartialStyles = {
    borderTopColor: color,
    borderWidth: `${strength}px`,
    margin: `${strength}px`,
  }

  return (
    <div className="Spinner">
      <div className="lds-ring" style={ldsRingStyles}>
        <div style={ldsRingPartialStyles} />
        <div style={ldsRingPartialStyles} />
        <div style={ldsRingPartialStyles} />
        <div style={ldsRingPartialStyles} />
      </div>
    </div>
  )
}

export default Spinner
