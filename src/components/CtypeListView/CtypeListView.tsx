import * as React from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'

import { ICType } from '../../types/Ctype'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

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
                <th className="ctype-author">
                  CTYPE
                  <br />
                  Author
                </th>
                <th className="ctype">CTYPE</th>
                <th className="author">Author</th>
              </tr>
            </thead>
            <tbody>
              {cTypes.map(cType => (
                <tr key={cType.cType.hash}>
                  <td className="ctype-author">
                    <CTypePresentation
                      cTypeHash={cType.cType.hash}
                      interactive={true}
                      linked={true}
                      right={true}
                    />
                    <ContactPresentation
                      address={cType.metaData.author}
                      interactive={true}
                      right={true}
                    />
                  </td>
                  <td className="ctype">
                    <CTypePresentation
                      cTypeHash={cType.cType.hash}
                      interactive={true}
                      linked={true}
                    />
                  </td>
                  <td className="author">
                    <ContactPresentation
                      address={cType.metaData.author}
                      interactive={true}
                      right={true}
                    />
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
}

export default withRouter(CtypeListView)
