import * as React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import CtypeDetailView from '../../components/CtypeDetailView/CtypeDetailView'
import CtypeListView from '../../components/CtypeListView/CtypeListView'
import CtypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import { ICType } from '../../types/Ctype'

import './CtypeView.scss'

type Props = RouteComponentProps<{ ctypeKey: string }> & {}

type State = {
  ctypes: ICType[]
  currentCtype?: ICType | 'notFoundInList'
}

class CtypeView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      ctypes: [],
    }
  }

  public componentDidMount() {
    CtypeRepository.findAll()
      .then((ctypes: ICType[]) => {
        this.setState({ ctypes })
      })
      .catch(error => {
        errorService.log({
          error,
          message: `Could not fetch CTYPES`,
          origin: 'CtypeView.componentDidMount()',
          type: 'ERROR.FETCH.GET',
        })
      })
  }

  public componentDidUpdate() {
    const { match } = this.props
    const { ctypes, currentCtype } = this.state

    if (ctypes && ctypes.length && !currentCtype && match.params.ctypeKey) {
      this.getCurrentCtype(match.params.ctypeKey)
    }
  }

  public render() {
    const { ctypes, currentCtype } = this.state
    const validCurrentCtype =
      !!currentCtype && currentCtype !== 'notFoundInList'
    return (
      <section className="CtypeView">
        <h1>CTYPES</h1>
        {validCurrentCtype && (
          <CtypeDetailView ctype={currentCtype as ICType} />
        )}
        {!validCurrentCtype && <CtypeListView ctypes={ctypes} />}
      </section>
    )
  }

  private getCurrentCtype(ctypeKey: string) {
    const { ctypes } = this.state

    const currentCtype = ctypes.find((ctype: ICType) => ctype.key === ctypeKey)

    if (!currentCtype) {
      const message = `Could not get CTYPE with key '${ctypeKey}' from local list of CTYPEs`
      this.setState({ currentCtype: 'notFoundInList' }, () => {
        errorService.log({
          error: { name: 'setCurrentCtypeError', message },
          message,
          origin: 'CtypeView.getCurrentCtype()',
        })
      })
    } else {
      this.setState({ currentCtype })
    }
  }
}

export default withRouter(CtypeView)
