import * as React from 'react'
import { connect } from 'react-redux'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'

import CTypeRepository from '../../services/CtypeRepository'
import * as CTypes from '../../state/ducks/CTypes'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

import './CtypeListView.scss'

type Props = RouteComponentProps<{}> & {
  onRequestLegitimation: (cType: ICType) => void
  // mapStateToProps
  cTypes?: ICType[]
}

type State = {
  fetched: boolean
}

class CtypeListView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      fetched: false,
    }

    this.fetchAllCTypes = this.fetchAllCTypes.bind(this)
  }

  public render() {
    const { cTypes } = this.props
    const { fetched } = this.state
    return (
      <section className="CtypeListView">
        {!fetched && (!cTypes || !cTypes.length) && (
          <div>Please fetch CTYPEs manually.</div>
        )}
        {fetched && (!cTypes || !cTypes.length) && <div>No CTYPEs found.</div>}
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
          <button onClick={this.fetchAllCTypes}>
            {cTypes && !!cTypes.length ? 'Refetch' : 'Fetch'}
            <span> CTypes</span>
          </button>
          <Link to="/ctype/new">Create new CTYPE</Link>
        </div>
      </section>
    )
  }

  private fetchAllCTypes() {
    CTypeRepository.findAll()
  }
}

const mapStateToProps = (state: ReduxState) => ({
  cTypes: CTypes.getCTypes(state),
})

export default withRouter(connect(mapStateToProps)(CtypeListView))
