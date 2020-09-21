// @--flow strict
import React, { Component } from "react"
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"

import Help from "./ui/Help"
import LegalInfo from "./ui/LegalInfo"
import Contact from "./ui/Contact"
import News from "./ui/News"
import { CommonProps } from "./ui/CommonProps"

import StockForm from "./ui/StocksForm"

type AppProps = {}

type AppState = {
  title: string
}

class App extends Component<AppProps, AppState> implements CommonProps {
  state = {
    title: "Home"
  }

  setTitle = (str: string) => {
    this.setState({ title: str })
  }

  render() {
    return (
      <Router>
        <div className="demo-layout mdl-layout mdl-js-layout mdl-layout--fixed-drawer mdl-layout--fixed-header">
          <header className="demo-header mdl-layout__header mdl-color--blue-grey-800 mdl-color-text--blue-grey-400">
            <div className="mdl-layout__header-row">
              <span className="mdl-layout-title">Portfolio Risk Management&nbsp;/&nbsp;{this.state.title}</span>
              <div className="mdl-layout-spacer" />
            </div>
          </header>
          <div className="demo-drawer mdl-layout__drawer mdl-color--blue-grey-800 mdl-color-text--blue-grey-400">
            <header className="demo-drawer-header">
              <img src="images/user.jpg" className="demo-avatar" alt="user icon" />
              <div className="demo-avatar-dropdown">
                <span>hello@example.com</span>
                <div className="mdl-layout-spacer" />
                <button id="accbtn" className="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon">
                  <i className="material-icons" role="presentation">
                    arrow_drop_down
                  </i>
                  <span className="visuallyhidden">Accounts</span>
                </button>
                <ul className="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect" htmlFor="accbtn">
                  <li className="mdl-menu__item">hello@example.com</li>
                  <li className="mdl-menu__item">info@example.com</li>
                  <li className="mdl-menu__item">
                    <i className="material-icons">add</i>Add another account...
                  </li>
                </ul>
              </div>
            </header>
            <nav className="demo-navigation mdl-navigation mdl-color--blue-grey-800">
              <Link className="mdl-navigation__link" to="/">
                <i className="mdl-color-text--blue-grey-400 material-icons" role="presentation">
                  home
                </i>
                Home
              </Link>
              <Link className="mdl-navigation__link" to="/news">
                <i className="mdl-color-text--blue-grey-400 material-icons" role="presentation">
                  flag
                </i>
                News
              </Link>
              <Link className="mdl-navigation__link" to="/contact">
                <i className="mdl-color-text--blue-grey-400 material-icons" role="presentation">
                  inbox
                </i>
                Contact
              </Link>
              <Link className="mdl-navigation__link" to="/legal-info">
                <i className="mdl-color-text--blue-grey-400 material-icons" role="presentation">
                  forum
                </i>
                Legal Information
              </Link>
              <Link className="mdl-navigation__link" to="/help">
                <i className="mdl-color-text--blue-grey-400 material-icons" role="presentation">
                  help_outline
                </i>
                Help
              </Link>
            </nav>
          </div>
          <main className="mdl-layout__content mdl-color--grey-100">
            <div className="mdl-grid demo-content">
              <div className="demo-charts mdl-color--white mdl-shadow--2dp mdl-cell mdl-cell--12-col mdl-grid">
                <Switch>
                  <Route exact path="/" render={() => <AppContent {...this} />} />
                  <Route path="/help" render={() => <Help {...this} />} />
                  <Route path="/contact" render={() => <Contact {...this} />} />
                  {/* eslint-disable-next-line no-unused-vars*/}
                  <Route path="/legal-info" render={(props) => <LegalInfo {...this} />} />
                  <Route path="/news" render={() => <News {...this} />} />
                </Switch>
              </div>
            </div>
          </main>
        </div>
      </Router>
    )
  }
}

class AppContent extends Component<CommonProps> {
  constructor(props: CommonProps) {
    super(props)
    props.setTitle("Home")
  }

  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">
          <StockForm stock="IBM" />
        </div>
      </div>
    )
  }
}

export default App
