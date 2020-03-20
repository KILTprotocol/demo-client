import React from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import '../Header/Header.scss'

type NavLink = {
  url: string
  label: string
}
const links: NavLink[] = [
  { url: 'dashboard', label: 'Dashboard' },
  { url: 'ctype', label: 'CTYPEs' },
  { url: 'claim', label: 'Claims' },
  { url: 'attestations', label: 'Attestations' },
  { url: 'delegations', label: 'Delegations' },
  { url: 'pcrs', label: 'PCRs' },
  { url: 'contacts', label: 'Contacts' },
  { url: 'messages', label: 'Messages' },
  { url: 'utilities', label: 'Utilities' },
]

type Props = RouteComponentProps<{}> & {
  selectRoute?: () => void
}

class Navigation extends React.Component<Props> {
  private selectRoute = (e: React.MouseEvent<HTMLElement>): void => {
    e.stopPropagation()
    const { selectRoute } = this.props
    if (selectRoute) {
      selectRoute()
    }
  }

  public render(): JSX.Element {
    const { history } = this.props
    return (
      <section className="Navigation">
        <ul>
          {links.map((link: NavLink) => {
            const classes = [
              link.url,
              history.location.pathname.indexOf(link.url) === 1
                ? 'current'
                : '',
            ]
            return (
              <li className={classes.join(' ')} key={link.url}>
                <Link to={`/${link.url}`} onClick={this.selectRoute}>
                  <span>{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }
}

export default withRouter(Navigation)
