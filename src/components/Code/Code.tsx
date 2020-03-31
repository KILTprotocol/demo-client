import React, { ReactNode } from 'react'
import ReactJsonView, { ReactJsonViewProps } from 'react-json-view'

import './Code.scss'

type Props = {
  children?: ReactNode
  collapsed?: boolean | number

  onAdd?: ReactJsonViewProps['onAdd']
  onEdit?: ReactJsonViewProps['onEdit']
}

const Code: React.FC<Props> = ({ children, collapsed, onAdd, onEdit }) => {
  if (children && typeof children === 'object') {
    return (
      <ReactJsonView
        src={children as object}
        name={false}
        theme="monokai"
        collapsed={collapsed != null ? collapsed : 1}
        collapseStringsAfterLength={30}
        enableClipboard
        displayDataTypes={false}
        onEdit={onEdit}
        onAdd={onAdd}
      />
    )
  }
  return <pre className="Code">{String(children)}</pre>
}

export default Code
