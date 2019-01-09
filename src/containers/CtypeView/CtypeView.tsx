import * as React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import CtypeDetailView from '../../components/CtypeDetailView/CtypeDetailView'
import CtypeListView from '../../components/CtypeListView/CtypeListView'
import CtypeRepository from '../../services/CtypeRepository'
import { CType } from '../../types/Ctype'

type Props = RouteComponentProps<{ ctypeKey: string }> & {}

type State = {
  ctypes: CType[]
  currentCtype?: CType
}

class CtypeView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      ctypes: [],
    }
  }

  public componentDidMount() {
    void this.init()

    if (this.props.match.params.ctypeKey) {
      this.getCurrentCtype()
    }
  }

  public componentDidUpdate() {
    const { match } = this.props
    const { currentCtype } = this.state

    if (!currentCtype && match.params.ctypeKey) {
      this.getCurrentCtype()
    }
  }

  public render() {
    const { ctypeKey } = this.props.match.params
    return (
      <section className="CtypeView">
        <h1>CTYPES</h1>
        {!!ctypeKey && <CtypeDetailView ctype={this.state.currentCtype} />}
        {!ctypeKey && <CtypeListView ctypes={this.state.ctypes} />}
      </section>
    )
  }

  private async init() {
    const ctypes = await CtypeRepository.findAll()
    this.setState({ ctypes })
  }

  private getCurrentCtype() {
    const currentCtype = this.state.ctypes.find(
      (ctype: CType) => ctype.key === this.props.match.params.ctypeKey
    )
    if (currentCtype) {
      this.setState({ currentCtype })
    }
  }
}

export default withRouter(CtypeView)
