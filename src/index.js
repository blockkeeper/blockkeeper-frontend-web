import React from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './registerServiceWorker'
import {BrowserRouter, Route, Switch, Redirect} from 'react-router-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import Syncr from './logic/Syncr'
import Rate from './logic/Rate'
import User from './logic/User'
import {theme, pageStyle} from './view/Style'
import UserView from './view/User'
import DepotView from './view/Depot'
import AddrView from './view/Addr'
import TscView from './view/Tsc'
import RgstrView from './view/Rgstr'
import LoginView from './view/Login'
import __ from './util'

const cx = {tmp: {}, _jobsRunning: false}
cx.syncr = new Syncr(cx)
cx.rate = new Rate(cx)
cx.user = new User(cx)

cx._initView = (cx => {
  return (cmp, name) => {
    // if (!cx._jobsRunning) {
    //   cx._jobsRunning = true
    //   cx.syncr.startJobs()
    // }
    // cmp = __.init('view', cmp._reactInternalInstance.getName())
    cmp = __.init('view', name)
    cmp.info('Created')
    return cmp
  }
})(cx)

const authenticate = props => {
  props.initUser = cx.user.init
  return (<LoginView {...props} />)
}

const AuthRoute = ({component: Component, ...args}) => (
  <Route {...args} render={props => {
    props.cx = cx
    return __.getSecSto()
      ? (<Component {...props} />)
      : (<Redirect to='/login' />)
  }} />
)

const Routes = () => (
  <div style={pageStyle}>
    <MuiThemeProvider theme={theme} >
      <BrowserRouter>
        <Switch>
          <Route path='/login' exact render={authenticate} />
          <Route path='/register' exact component={RgstrView} />
          <AuthRoute path='/user' exact component={UserView} />
          <AuthRoute path='/depot' exact component={DepotView} />
          <AuthRoute path='/addr/:addrId' exact component={AddrView} />
          <AuthRoute path='/tsc/:addrId/:tscId' exact component={TscView} />
          <Redirect to='/depot' />
        </Switch>
      </BrowserRouter>
    </MuiThemeProvider>
  </div>
)

ReactDOM.render(<Routes />, document.getElementById('root'))
registerServiceWorker()

// if (module.hot) {
//   module.hot.accept()
// }
