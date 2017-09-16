import React from 'react'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'
import {Lock, Clear} from 'material-ui-icons'
import {LinearProgress} from 'material-ui/Progress'
import {Modal} from './Lib'
import __ from '../util'
import {themeBgStyle, paperStyle, loginStyle, actionBtnStyle} from './Style'
const rootStyle = {...themeBgStyle, height: '100vh'}

export default class RgstrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {username: '', pw: '', rpw: ''}
    this.goBack = () => props.history.goBack()
    this.goUser = () => props.history.replace('/user/edit')
    this.save = this.save.bind(this)
    this.logout = this.logout.bind(this)
    this.set = this.set.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'rgstr'))
    if (this.cx.core.isActive()) this.setState({loggedIn: true})
  }

  logout () {
    this.cx.core.clear()
    this.setState({loggedIn: null})
  }

  async save () {
    this.setState({busy: true})
    try {
      await this.cx.core.register(this.state.username, this.state.pw)
      this.props.history.replace(`/depot`)
    } catch (e) {
      this.setState({err: e.message, busy: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {upd: false, usernameEmsg: __.vldAlphNum(this.state.username)}
      if (this.state.pw) {
        this.setState({pw_: true})
        d.pwEmsg = __.vldPw(this.state.pw)
      } else {
        if (this.state.pw_) d.pwEmsg = __.vldPw(this.state.pw)
      }
      if (this.state.pw && this.state.rpw) {
        (this.state.pw === this.state.rpw)
          ? d.rpwEmsg = ''
          : d.rpwEmsg = 'Password does not match'
      }
      if (this.state.username && this.state.pw && this.state.rpw &&
          !d.usernameEmsg && !d.pwEmsg && !d.rpwEmsg) {
        d.upd = true
      }
      this.setState(d)
    })
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          onClose={() => this.setState({err: null})}
          actions={[{onClick: () => this.setState({err: null}), lbl: 'OK'}]}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.loggedIn) {
      return (
        <Modal
          lbl='Note'
          onClose={this.goUser}
          actions={[{
            onClick: this.logout,
            lbl: 'Logout and clear local app storage?'
          }]}
        >
          Please logout before creating a new user
        </Modal>
      )
    } else {
      return (
        <div style={rootStyle}>
          {this.state.busy &&
          <LinearProgress />}
          <div style={loginStyle}>
            <Typography align='center' type='display3'>
              Blockkeeper
            </Typography>
            <Typography align='center' type='display1' gutterBottom>
              Please choose your account details
            </Typography>
            <Paper square style={paperStyle} elevation={24}>
              <TextField
                autoFocus
                fullWidth
                required
                label='Username'
                margin='normal'
                value={this.state.username}
                error={Boolean(this.state.usernameEmsg)}
                helperText={this.state.usernameEmsg}
                onChange={evt => this.set('username', evt.target.value)}
              />
              <TextField
                fullWidth
                required
                label='Password'
                type='password'
                margin='normal'
                value={this.state.pw}
                error={Boolean(this.state.pwEmsg)}
                helperText={this.state.pwEmsg}
                onChange={evt => this.set('pw', evt.target.value)}
              />
              <TextField
                fullWidth
                required
                label='Retype password'
                type='password'
                margin='normal'
                value={this.state.rpw}
                error={Boolean(this.state.rpwEmsg)}
                helperText={this.state.rpwEmsg}
                onChange={evt => this.set('rpw', evt.target.value)}
              />
              {!this.state.busy &&
                <div>
                  <Button
                    raised
                    style={actionBtnStyle}
                    onClick={this.goBack}
                  >
                    <Clear />
                    Cancel
                  </Button>
                  <Button
                    raised
                    style={actionBtnStyle}
                    onClick={this.save}
                    disabled={!this.state.upd}
                  >
                    <Lock />
                    Sign up
                  </Button>
                </div>}
            </Paper>
          </div>
        </div>
      )
    }
  }
}
