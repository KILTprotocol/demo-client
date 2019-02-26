import * as React from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'

import { ICType } from '../../types/Ctype'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'
import SelectAction from '../SelectAction/SelectAction'

import './CtypeListView.scss'

type Props = RouteComponentProps<{}> & {
  cTypes?: ICType[]
  onRequestLegitimation: (cType: ICType) => void
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
                <th className="name">CTYPE</th>
                <th className="author">Author</th>
                <th className="actionsTd" />
              </tr>
            </thead>
            <tbody>
              {cTypes.map(cType => (
                <tr key={cType.cType.hash}>
                  <td
                    className="name"
                    title={cType.cType.metadata.title.default}
                  >
                    <Link to={`/ctype/${cType.cType.hash}`}>
                      <CTypePresentation cType={cType} />
                    </Link>
                  </td>
                  <td className="author">
                    <ContactPresentation address={cType.metaData.author} />
                  </td>
                  <td className="actionsTd">
                    <div className="actions">
                      <SelectAction
                        actions={[
                          {
                            callback: this.createClaim.bind(this, cType),
                            label: 'Create Claim',
                          },
                          {
                            callback: this.requestLegitimation.bind(
                              this,
                              cType
                            ),
                            label: 'Get Legitimation',
                          },
                        ]}
                      />
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

  private createClaim(cType: ICType) {
    this.props.history.push(`/claim/new/${cType.cType.hash}`)
  }

  private requestLegitimation(cType: ICType) {
    const { onRequestLegitimation } = this.props
    onRequestLegitimation(cType)
  }
}

export default withRouter(CtypeListView)
