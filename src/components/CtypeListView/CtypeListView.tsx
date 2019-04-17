import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'

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
                <th className="ctype-author">
                  CTYPE
                  <br />
                  Author
                </th>
                <th className="ctype">CTYPE</th>
                <th className="author">Author</th>
                <th className="actionsTd" />
              </tr>
            </thead>
            <tbody>
              {cTypes.map(cType => (
                <tr key={cType.cType.hash}>
                  <td className="ctype-author">
                    <CTypePresentation
                      cTypeHash={cType.cType.hash}
                      interactive={true}
                    />
                    <ContactPresentation
                      address={cType.metaData.author}
                      interactive={true}
                    />
                  </td>
                  <td className="ctype">
                    <CTypePresentation
                      cTypeHash={cType.cType.hash}
                      interactive={true}
                    />
                  </td>
                  <td className="author">
                    <ContactPresentation
                      address={cType.metaData.author}
                      interactive={true}
                    />
                  </td>
                  <td className="actionsTd">
                    <div>
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
                          {
                            callback: this.createDelegation.bind(this, cType),
                            label: 'Create Delegation',
                          },
                          {
                            callback: () => {
                              PersistentStore.store.dispatch(
                                UiState.Store.updateCurrentTaskAction({
                                  objective:
                                    sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE,
                                  props: {
                                    cTypeHash: cType.cType.hash,
                                  },
                                })
                              )
                            },
                            label: 'Submit Claims',
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

  private createDelegation(cType: ICType) {
    this.props.history.push(`/delegations/new/${cType.cType.hash}`)
  }
}

export default withRouter(CtypeListView)
