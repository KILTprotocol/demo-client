import * as React from 'react'
import { Link } from 'react-router-dom'

import { CType } from 'src/types/Ctype'

type Props = {
  ctypes?: CType[]
}

const CtypeListView = (props: Props) => {
  return (
    <section className="CtypeListView">
      <Link to="/ctype/new">Create new CTYPE</Link>
      {props.ctypes && !!props.ctypes.length && (
        <table>
          <thead>
            <tr>
              <th>Author</th>
              <th>CTYPE name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.ctypes.map(ctype => (
              <tr key={ctype.key}>
                <td>{ctype.author}</td>
                <td>
                  <Link to={`/ctype/${ctype.key}`}>{ctype.name}</Link>
                </td>
                <td>
                  <Link to={`/claim/new/${ctype.key}`}>Create Claim</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default CtypeListView
