import * as React from 'react'
import { Link } from 'react-router-dom'

import { ICType } from 'src/types/Ctype'

import './CtypeListView.scss'

type Props = {
  ctypes?: ICType[]
}

const CtypeListView = (props: Props) => {
  return (
    <section className="CtypeListView">
      {props.ctypes && !!props.ctypes.length && (
        <table>
          <thead>
            <tr>
              <th className="author">Author</th>
              <th className="name">CTYPE name</th>
              <th className="actionsTd" />
            </tr>
          </thead>
          <tbody>
            {props.ctypes.map(ctype => (
              <tr key={ctype.key}>
                <td className="author">{ctype.author}</td>
                <td className="name" title={ctype.key}>
                  <Link to={`/ctype/${ctype.key}`}>{ctype.name}</Link>
                </td>
                <td className="actionsTd">
                  <div className="actions">
                    <Link to={`/claim/new/${ctype.key}`}>Create Claim</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="actions">
        <Link to="/ctype/new">Create new CTYPE</Link>
      </div>
    </section>
  )
}

export default CtypeListView
