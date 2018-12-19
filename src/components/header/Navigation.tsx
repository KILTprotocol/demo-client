import * as React from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import './Header.scss'

type NavLink = {
  url: string
  label: string
}
const links: NavLink[] = [
  { url: 'wallet', label: 'Wallet' },
  { url: 'ctype', label: 'CTYPE manager' },
  { url: 'chain-stats', label: 'Chain stats' },
  { url: 'contacts', label: 'Contacts' },
  { url: 'messages', label: 'Messages' },
]

type Props = RouteComponentProps<{}> & {
  selectRoute: () => void
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
      <ul className="navigation">
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
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    )
  }

  private selectRoute = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    const { selectRoute } = this.props
    selectRoute()
  }
}

export default withRouter(Navigation)
