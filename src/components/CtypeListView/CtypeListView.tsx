import * as React from 'react'
import { Link } from 'react-router-dom'

import { CType } from 'src/types/Ctype'

type Props = {
  ctypes?: CType[]
}

const CtypeListView = (props: Props) => {
  return (
    <section className="CtypeListView">
      {props.ctypes && !!props.ctypes.length && (
        <table>
          <thead>
            <tr>
              <th>Author</th>
              <th>CTYPE name</th>
              <th />
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
