import * as React from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import '../Header/Header.scss'

type NavLink = {
  url: string
  label: string
}
const links: NavLink[] = [
  { url: '', label: 'Home' },
  { url: 'wallet', label: 'Wallet' },
  { url: 'ctype', label: 'CTYPEs' },
  { url: 'claim', label: 'Claims' },
  { url: 'attestations', label: 'Manage Attestations' },
  { url: 'chain-stats', label: 'Chain stats' },
  { url: 'contacts', label: 'Contacts' },
  { url: 'messages', label: 'Messages' },
  { url: 'testUserFeedback', label: 'Test User Feedback' },
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
