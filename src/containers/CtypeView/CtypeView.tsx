import * as sdk from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import CTypeDetailView from '../../components/CtypeDetailView/CtypeDetailView'
import CTypeListView from '../../components/CtypeListView/CtypeListView'
import SelectAttestersModal from '../../components/Modal/SelectAttestersModal'
import attestationWorkflow from '../../services/AttestationWorkflow'
import CtypeRepository from '../../services/CtypeRepository'
import errorService from '../../services/ErrorService'
import { Contact } from '../../types/Contact'
import { ICType } from '../../types/Ctype'

import './CtypeView.scss'

type Props = RouteComponentProps<{ cTypeHash: string }> & {}

type State = {
  cTypes: ICType[]
  currentCType?: ICType | 'notFoundInList'
}

class CtypeView extends React.Component<Props, State> {
  private selectAttestersModal: SelectAttestersModal | null
  private cTypeToLegitimate: ICType

  constructor(props: Props) {
    super(props)
    this.state = {
      cTypes: [],
    }
    this.requestLegitimation = this.requestLegitimation.bind(this)

    this.cancelSelectAttesters = this.cancelSelectAttesters.bind(this)
    this.finishSelectAttesters = this.finishSelectAttesters.bind(this)
  }

  public componentDidMount() {
    CtypeRepository.findAll()
      .then((cTypes: ICType[]) => {
        this.setState({ cTypes })
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
    const { cTypes, currentCType } = this.state

    if (cTypes && cTypes.length && !currentCType && match.params.cTypeHash) {
      this.getCurrentCType(match.params.cTypeHash)
    }
  }

  public render() {
    const { cTypes, currentCType } = this.state
    const validCurrentCType =
      !!currentCType && currentCType !== 'notFoundInList'
    return (
      <section className="CtypeView">
        <h1>CTYPES</h1>
        {validCurrentCType && (
          <CTypeDetailView cType={currentCType as ICType} />
        )}
        {!validCurrentCType && (
          <CTypeListView
            cTypes={cTypes}
            onRequestLegitimation={this.requestLegitimation}
          />
        )}
        <SelectAttestersModal
          ref={el => {
            this.selectAttestersModal = el
          }}
          onCancel={this.cancelSelectAttesters}
          onConfirm={this.finishSelectAttesters}
        />
      </section>
    )
  }

  private getCurrentCType(cTypeHash: sdk.ICType['hash']) {
    const { cTypes } = this.state

    const currentCType = cTypes.find(
      (cType: ICType) => cType.cType.hash === cTypeHash
    )

    if (!currentCType) {
      const message = `Could not get CTYPE with hash '${cTypeHash}' from local list of CTYPEs`
      this.setState({ currentCType: 'notFoundInList' }, () => {
        errorService.log({
          error: { name: 'setCurrentCTypeError', message },
          message,
          origin: 'CtypeView.getCurrentCType()',
        })
      })
    } else {
      this.setState({ currentCType })
    }
  }

  private requestLegitimation(cType: ICType) {
    if (cType && this.selectAttestersModal) {
      this.cTypeToLegitimate = cType
      this.selectAttestersModal.show()
    }
  }

  private cancelSelectAttesters() {
    delete this.cTypeToLegitimate
    if (this.selectAttestersModal) {
      this.selectAttestersModal.hide()
    }
  }

  private finishSelectAttesters(selectedAttesters: Contact[]) {
    if (this.cTypeToLegitimate.cType.hash) {
      attestationWorkflow.requestLegitimations(
        { cType: this.cTypeToLegitimate.cType.hash },
        selectedAttesters
      )
    }
  }
}

export default withRouter(CtypeView)
