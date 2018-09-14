import React from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './registerServiceWorker'
import {BrowserRouter, Route, Switch, Redirect} from 'react-router-dom'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider'
import {theme} from './view/Style'
import Core from './logic/Core'
import UserView from './view/User'
import DepotView from './view/Depot'
import AddrView from './view/Addr'
import AddAddrView from './view/AddAddr'
import TscView from './view/Tsc'
import RgstrView from './view/Rgstr'
import LoginView from './view/Login'
import DevSyncView from './view/DevSync'
import __ from './util'

const cx = {}
cx.core = new Core(cx)

const login = props => {
  props.cx = cx
  return cx.core.init()
    ? (<Redirect to='/depot' />)
    : (<LoginView {...props} />)
}

const register = props => {
  props.cx = cx
  return (<RgstrView {...props} />)
}

const AuthRoute = ({component: Component, ...args}) => (
  <Route {...args} render={props => {
    props.cx = cx
    return cx.core.init()
      ? (<Component {...props} />)
      : (<Redirect to='/login' />)
  }} />
)

const Routes = () => (
  <MuiThemeProvider theme={theme} >
    <BrowserRouter>
      <Switch>
        <Route path='/login' exact render={login} />
        <Route path='/rgstr' exact render={register} />
        <AuthRoute path='/user/edit' exact component={UserView} />
        <AuthRoute path='/depot' exact component={DepotView} />
        <AuthRoute path='/wallet/add' exact component={AddAddrView} />
        <AuthRoute path='/wallet/:addrId' exact component={AddrView} />
        <AuthRoute path='/tsc/:addrId/:tscId' exact component={TscView} />
        {__.cfg('isDev') &&
          <AuthRoute path='/devSync' exact component={DevSyncView} />}
        <Redirect to='/depot' />
      </Switch>
    </BrowserRouter>
  </MuiThemeProvider>
)

ReactDOM.render(<Routes />, document.getElementById('root'))
registerServiceWorker()

// if (module.hot) {
//   module.hot.accept()
// }
