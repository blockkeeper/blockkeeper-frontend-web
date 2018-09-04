import React from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import LinearProgress from '@material-ui/core/LinearProgress'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import {withStyles} from '@material-ui/core/styles'
import Divider from '@material-ui/core/Divider'
import {theme, themeBgStyle, noTxtDeco, qrCodeWrap, gridWrap, gridSpacer,
        gridGutter, tscitem, addr, amnt, tscIcon, tscAmnt, display1, body2,
        actnBtnClr, topBtnClass, topBarSpacer} from './Style'
import {ArrowBack, Launch} from '@material-ui/icons'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, Snack, Modal,
        CoinIcon, TscListAddr, ExtLink, InfoUpdateFailed, ToTopBtn, Done,
        Edit} from './Lib'
// import History from '../logic/history'
import __ from '../util'

class HistoryView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.coin = props.match.params.coin
    // this.historyObj = new History(this.cx)
    this.state = {}
    this.load = this.load.bind(this)
    this.goBack = props.history.goBack
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'history'))
    await this.load()
  }

  async load () {
    let addrs, user, history
    try {
      [addrs, user, history] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.user.load(),
        this.cx.history.getHistory()
      ])
    } catch (e) {
      if (__.cfg('isDev')) throw e
      let emsg = e.message
      if ((e.sts || 0) >= 900) {
        __.clearSto()
        emsg = `A fatal error occured: ${emsg}. ` +
               'Environment cleared: Please login again'
      }
      this.setState({err: emsg})
      throw e
    }

    this.user = user
    this.history = history

    this.setState({})
  }

  render () {
    console.log('this.history', this.history)
    console.log('this.user', this.user)
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack}>
          {this.state.err}
        </Modal>
      )
    } else if (true) { // TODO
      return (
        <div className={this.props.classes.topBarSpacer}>
          {this.state.snack &&
          <Snack
            msg={this.state.snack}
            onClose={() => this.setState({snack: null})}
          />}
          <div className={this.props.classes.themeBgStyle}>
            <TopBar
              midTitle={__.cfg('coins').cryp[this.coin].name}
              iconLeft={<ArrowBack />}
              onClickLeft={this.goBack}
              noUser
            />
          </div>
          <div>
            asdfasdf asdf asdf
          </div>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default withStyles({
})(HistoryView)
