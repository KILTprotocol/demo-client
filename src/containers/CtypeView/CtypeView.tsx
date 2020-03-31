import React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import CTypeDetailView from '../../components/CtypeDetailView/CtypeDetailView'
import CTypeListView from '../../components/CtypeListView/CtypeListView'
import SelectContactsModal from '../../components/Modal/SelectContactsModal'
import attestationWorkflow from '../../services/AttestationWorkflow'
import { IContact } from '../../types/Contact'
import { ICTypeWithMetadata } from '../../types/Ctype'

import './CtypeView.scss'

type Props = RouteComponentProps<{ cTypeHash: string }>

class CtypeView extends React.Component<Props> {
  private selectAttestersModal: SelectContactsModal | null
  private cTypeToLegitimate: ICTypeWithMetadata

  constructor(props: Props) {
    super(props)
    this.requestLegitimation = this.requestLegitimation.bind(this)
    this.cancelSelectAttesters = this.cancelSelectAttesters.bind(this)
    this.finishSelectAttesters = this.finishSelectAttesters.bind(this)
  }

  private requestLegitimation(cType: ICTypeWithMetadata): void {
    if (cType && this.selectAttestersModal) {
      this.cTypeToLegitimate = cType
      this.selectAttestersModal.show()
    }
  }

  private cancelSelectAttesters(): void {
    delete this.cTypeToLegitimate
    if (this.selectAttestersModal) {
      this.selectAttestersModal.hide()
    }
  }

  private finishSelectAttesters(selectedAttesters: IContact[]): void {
    if (this.cTypeToLegitimate.cType.hash) {
      attestationWorkflow.requestLegitimations(
        [{ cTypeHash: this.cTypeToLegitimate.cType.hash }],
        selectedAttesters.map(
          (contact: IContact) => contact.publicIdentity.address
        )
      )
    }
  }

  public render(): JSX.Element {
    const { match } = this.props
    const { cTypeHash } = match.params

    return (
      <section className="CtypeView">
        <h1>CTYPEs</h1>
        {cTypeHash && <CTypeDetailView cTypeHash={cTypeHash} />}
        {!cTypeHash && (
          <CTypeListView onRequestLegitimation={this.requestLegitimation} />
        )}
        <SelectContactsModal
          ref={el => {
            this.selectAttestersModal = el
          }}
          placeholder="Select attester#{multi}…"
          onCancel={this.cancelSelectAttesters}
          onConfirm={this.finishSelectAttesters}
        />
      </section>
    )
  }
}

export default withRouter(CtypeView)
