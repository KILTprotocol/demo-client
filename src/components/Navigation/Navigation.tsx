import * as React from 'react'
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

type State = {}

class Navigation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      openNavigation: false,
    }
  }

  public render() {
    return (
      <section className="Navigation">
        <ul>
          {links.map((link: NavLink) => {
            const classes = [
              link.url,
              this.props.location.pathname.indexOf(link.url) === 1
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

  private selectRoute = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    const { selectRoute } = this.props
    if (selectRoute) {
      selectRoute()
    }
  }
}

export default withRouter(Navigation)
