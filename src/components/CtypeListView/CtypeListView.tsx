import * as React from 'react'
import { Link } from 'react-router-dom'

import { ICType } from '../../types/Ctype'

import './CtypeListView.scss'

type Props = {
  cTypes?: ICType[]
  onRequestLegitimation: (ctype: ICType) => void
}

type State = {}

class CtypeListView extends React.Component<Props, State> {
  public render() {
    const { cTypes } = this.props
    return (
      <section className="CtypeListView">
        {cTypes && !!cTypes.length && (
          <table>
            <thead>
              <tr>
                <th className="author">Author</th>
                <th className="name">CTYPE title</th>
                <th className="actionsTd" />
              </tr>
            </thead>
            <tbody>
              {cTypes.map(cType => (
                <tr key={cType.cType.hash}>
                  {/* TODO: resolve to Contact */}
                  <td className="author">{cType.metaData.author}</td>
                  <td
                    className="name"
                    title={cType.cType.metadata.title.default}
                  >
                    <Link to={`/ctype/${cType.cType.hash}`}>
                      {cType.cType.metadata.title.default}
                    </Link>
                  </td>
                  <td className="actionsTd">
                    <div className="actions">
                      <Link to={`/claim/new/${cType.cType.hash}`}>
                        Create Claim
                      </Link>
                      <button
                        className="requestLegitimation"
                        onClick={this.requestLegitimation.bind(this, cType)}
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
