import * as React from 'react'
import { Link } from 'react-router-dom'

import { ICType } from '../../types/Ctype'

import './CtypeListView.scss'

type Props = {
  ctypes?: ICType[]
  onRequestLegitimation: (ctype: ICType) => void
}

type State = {}

class CtypeListView extends React.Component<Props, State> {
  public render() {
    const { ctypes } = this.props
    return (
      <section className="CtypeListView">
        {ctypes && !!ctypes.length && (
          <table>
            <thead>
              <tr>
                <th className="author">Author</th>
                <th className="name">CTYPE name</th>
                <th className="actionsTd" />
              </tr>
            </thead>
            <tbody>
              {ctypes.map(ctype => (
                <tr key={ctype.key}>
                  <td className="author">{ctype.author}</td>
                  <td className="name" title={ctype.key}>
                    <Link to={`/ctype/${ctype.key}`}>{ctype.name}</Link>
                  </td>
                  <td className="actionsTd">
                    <div className="actions">
                      <Link to={`/claim/new/${ctype.key}`}>Create Claim</Link>
                      <button
                        className="requestLegitimation"
                        onClick={this.requestLegitimation.bind(this, ctype)}
                        title="Request legimation for attestation of this claim from attester"
                      >
                        Get Legitimation
                      </button>
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

  private requestLegitimation(ctype: ICType) {
    const { onRequestLegitimation } = this.props
    onRequestLegitimation(ctype)
  }
}

export default CtypeListView
