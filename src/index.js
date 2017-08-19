import React from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './registerServiceWorker'
import {BrowserRouter, Route, Switch, Redirect} from 'react-router-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import Syncr from './logic/Syncr'
import Rate from './logic/Rate'
import User from './logic/User'
import {theme, pageStyle} from './view/Style'
import {default as DepotView} from './view/Depot'
import {default as RgstrView} from './view/Rgstr'
import {default as LoginView} from './view/Login'
import __ from './util'

const cx = {_jobsRunning: false}
cx.syncr = new Syncr(cx)
cx.rate = new Rate(cx)
cx.user = new User(cx)

cx._initView = (cx => {
  return (cmp) => {
    if (!cx._jobsRunning) {
      cx._jobsRunning = true
      cx.syncr.startJobs()
    }
    const d = __.init('view', cmp._reactInternalInstance.getName())
    d.info('Created')
    return d
  }
})(cx)

const authenticate = props => {
  props.initUser = cx.user.init
  return (<LoginView {...props} />)
}

const AuthRoute = ({component: Component, ...args}) => (
  <Route {...args} render={props => {
    props.cx = cx
    return __.stoGetSecret()
      ? (<Component {...props} />)
      : (<Redirect to='/login' />)
  }} />
)

const Routes = () => (
  <div style={pageStyle}>
    <MuiThemeProvider theme={theme} >
      <BrowserRouter>
        <Switch>
          <Route path='/login' exact render={authenticate} />} />
          <Route path='/register' exact component={RgstrView} />} />
          <AuthRoute path='/depot' exact component={DepotView} />
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
