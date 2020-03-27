import React from 'react'
import './Spinner.scss'

type Props = {
  className?: string
  color?: string
  size?: number
  strength?: number
}

const Spinner: React.FC<Props> = ({ className, color, size, strength }) => {
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
    <div className={`Spinner ${className}`}>
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
