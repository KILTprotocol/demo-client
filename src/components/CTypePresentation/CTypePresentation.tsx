import * as sdk from '@kiltprotocol/prototype-sdk'
import Identicon from '@polkadot/ui-identicon'
import _ from 'lodash'
import * as React from 'react'
import { ReactNode } from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import { RequestAcceptDelegationProps } from '../../containers/Tasks/RequestAcceptDelegation/RequestAcceptDelegation'
import { RequestClaimsForCTypeProps } from '../../containers/Tasks/RequestClaimsForCType/RequestClaimsForCType'
import { RequestLegitimationsProps } from '../../containers/Tasks/RequestLegitimation/RequestLegitimation'
import { SubmitClaimsForCTypeProps } from '../../containers/Tasks/SubmitClaimsForCType/SubmitClaimsForCType'
import { SubmitLegitimationsProps } from '../../containers/Tasks/SubmitLegitimations/SubmitLegitimations'

import CTypeRepository from '../../services/CtypeRepository'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'
import { ICType } from '../../types/Ctype'

import './CTypePresentation.scss'
import SelectAction from '../SelectAction/SelectAction'
import { Action } from '../SelectAction/SelectAction'

type Props = RouteComponentProps<{}> & {
  cTypeHash: ICType['cType']['hash']

  inline?: true
  size?: number
  linked?: true
  interactive?: boolean
  fullSizeActions?: true
  right?: true
}

type State = {
  cType?: ICType
}

const DEFAULT_SIZE = 24

class CTypePresentation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public componentDidMount() {
    this.setCType()
  }

  public componentDidUpdate(prevProps: Props) {
    if (!_.isEqual(this.props, prevProps)) {
      this.setCType()
    }
  }

  public render() {
    const { inline, interactive, fullSizeActions, right, size } = this.props
    const { cType } = this.state

    let actions: Action[] = []

    if (interactive) {
      actions = this.getActions()
    }

    const classes = [
      'CTypePresentation',
      inline ? 'inline' : '',
      actions.length ? 'withActions' : '',
      fullSizeActions ? 'fullSizeActions' : 'minimal',
      right ? 'alignRight' : '',
    ]

    return (
      <div className={classes.join(' ')}>
        {cType &&
          cType.cType &&
          this.wrapInLink(
            <>
              <Identicon
                value={cType.cType.hash}
                size={size || DEFAULT_SIZE}
                theme="polkadot"
              />
              <span className="label">
                {cType.cType.metadata.title.default}
              </span>
            </>
          )}
        {!!actions.length && (
          <SelectAction
            className={fullSizeActions ? 'fullSize' : 'minimal'}
            actions={actions}
          />
        )}
      </div>
    )
  }

  private wrapInLink(content: ReactNode) {
    const { linked } = this.props
    const { cType } = this.state
    if (!linked || !cType) {
      return <span>{content}</span>
    }
    return <Link to={`/ctype/${cType.cType.hash}`}>{content}</Link>
  }

  private async setCType() {
    const { cTypeHash } = this.props

    CTypeRepository.findByHash(cTypeHash).then((_cType: ICType) => {
      this.setState({ cType: _cType })
    })
  }

  private getActions(): Action[] {
    const { cTypeHash } = this.props
    const actions: Action[] = [
      {
        callback: () => {
          this.props.history.push(`/claim/new/${cTypeHash}`)
        },
        label: 'Create claim',
      },
      {
        callback: () => {
          this.props.history.push(`/delegations/new/${cTypeHash}`)
        },
        label: 'Create delegation',
      },
      {
        callback: () => {
          this.props.history.push(`/pcrs/new/${cTypeHash}`)
        },
        label: 'Create PCR',
      },
      {
        callback: () => {
          PersistentStore.store.dispatch(
            UiState.Store.updateCurrentTaskAction({
              objective: sdk.MessageBodyType.REQUEST_CLAIMS_FOR_CTYPE,
              props: { cTypeHash } as RequestClaimsForCTypeProps,
            })
          )
        },
        label: 'Request claims',
      },
      {
        callback: () => {
          PersistentStore.store.dispatch(
            UiState.Store.updateCurrentTaskAction({
              objective: sdk.MessageBodyType.REQUEST_LEGITIMATIONS,
              props: {
                cTypeHash,
              } as RequestLegitimationsProps,
            })
          )
        },
        label: 'Request legitimations',
      },
      {
        callback: () => {
          PersistentStore.store.dispatch(
            UiState.Store.updateCurrentTaskAction({
              objective: sdk.MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPE,
              props: { cTypeHash } as SubmitClaimsForCTypeProps,
            })
          )
        },
        label: 'Submit claims',
      },
      {
        callback: () => {
          PersistentStore.store.dispatch(
            UiState.Store.updateCurrentTaskAction({
              objective: sdk.MessageBodyType.SUBMIT_LEGITIMATIONS,
              props: {
                claim: { cType: cTypeHash },
              } as SubmitLegitimationsProps,
            })
          )
        },
        label: 'Submit legitimations',
      },
      {
        callback: () => {
          PersistentStore.store.dispatch(
            UiState.Store.updateCurrentTaskAction({
              objective: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
              props: {
                cTypeHash,
                isPCR: false,
              } as RequestAcceptDelegationProps,
            })
          )
        },
        label: 'Invite to delegation(s)',
      },
      {
        callback: () => {
          PersistentStore.store.dispatch(
            UiState.Store.updateCurrentTaskAction({
              objective: sdk.MessageBodyType.REQUEST_ACCEPT_DELEGATION,
              props: {
                cTypeHash,
                isPCR: true,
              } as RequestAcceptDelegationProps,
            })
          )
        },
        label: 'Invite to PCR(s)',
      },
    ]
    return actions
  }
}

export default withRouter(CTypePresentation)
