import React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'

import CTypeRepository from '../../services/CtypeRepository'
import * as CTypes from '../../state/ducks/CTypes'
import { State as ReduxState } from '../../state/PersistentStore'
import { ICTypeWithMetadata } from '../../types/Ctype'
import ContactPresentation from '../ContactPresentation/ContactPresentation'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

import './CtypeListView.scss'

type StateProps = {
  cTypes?: ICTypeWithMetadata[]
}

type OwnProps = {
  onRequestLegitimation: (cType: ICTypeWithMetadata) => void
}

type Props = RouteComponentProps<{}> & StateProps & OwnProps

type State = {
  fetched: boolean
}

class CtypeListView extends React.Component<Props, State> {
  private static fetchAllCTypes(): void {
    CTypeRepository.findAll()
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      fetched: false,
    }
  }

  public render(): JSX.Element {
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
                      interactive
                      linked
                      right
                    />
                    {cType.cType.owner && (
                      <ContactPresentation
                        address={cType.cType.owner}
                        interactive
                        right
                      />
                    )}
                  </td>
                  <td className="ctype">
                    <CTypePresentation
                      cTypeHash={cType.cType.hash}
                      interactive
                      linked
                    />
                  </td>
                  <td className="author">
                    {cType.cType.owner && (
                      <ContactPresentation
                        address={cType.cType.owner}
                        interactive
                        right
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="actions">
          <button type="button" onClick={CtypeListView.fetchAllCTypes}>
            {cTypes && !!cTypes.length ? 'Refetch' : 'Fetch'}
            <span> CTypes</span>
          </button>
          <Link to="/ctype/new">Create new CTYPE</Link>
        </div>
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  ReduxState
> = state => ({
  cTypes: CTypes.getCTypes(state),
})

export default withRouter(connect(mapStateToProps)(CtypeListView))
