import React from 'react'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'
import Grid from 'material-ui/Grid'
import { withStyles } from 'material-ui/styles'
import {LinearProgress} from 'material-ui/Progress'
import {Lock} from 'material-ui-icons'
import {theme, paperStyle, loginStyle, fullWidth,
        actnBtnClr, styleGuide} from './Style'
import {Modal, BrowserGate, NtAllwd} from './Lib'
import __ from '../util'

class LoginView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this._pw = false
    this.reset = {
      loginBusy: false,
      upd: false,
      userId: '',
      pw: '',
      err: undefined
    }
    this.state = {...this.reset}
    this.goBack = props.history.goBack
    this.login = this.login.bind(this)
    this.set = this.set.bind(this)
    this.reload = () => this.setState(this.reset)
  }

  componentDidMount () {
    // set body bg
    document.body.style.backgroundColor = styleGuide.backgroundDark
    Object.assign(this, __.initView(this, 'login'))
  }

  set (ilk, val) {
    const vldUserId = userId => {
      return __.vld.isUUID(userId, 4) ? '' : 'Invalid identifier'
    }
    this.setState({[ilk]: val, emsg: undefined}, () => {
      let d = {upd: false}
      if (this.state.userId && this._pw) {
        d.userIdEmsg = vldUserId(this.state.userId)
      }
      if (this.state.pw) {
        this._pw = true
        d.userIdEmsg = vldUserId(this.state.userId)
        d.pwEmsg = __.vldPw(this.state.pw, true)
      }
      if (this.state.userId && this.state.pw && !d.userIdEmsg && !d.pwEmsg) {
        d.upd = true
      }
      this.setState(d)
    })
  }

  async login () {
    this.setState({err: undefined, loginBusy: true})
    try {
      await this.cx.core.login(this.state.userId, this.state.pw)
      this.props.history.push('/depot')
    } catch (e) {
      if (e.sts >= 400 && e.sts < 500) {
        this.setState({
          ...this.reset,
          userId: this.state.userId,
          emsg: e.message
        })
      } else {
        if (__.cfg('isDev')) throw e
        return this.setState({err: e.message})
      }
    }
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          onClose={async () => await this.reload()}
          actions={[{lbl: 'OK', onClick: async () => await this.reload()}]}
        >
          {this.state.err}
        </Modal>
      )
    } else {
      return (
        <div>
          <div className={this.props.classes.loginStyle}>
            <Grid container spacing={0} justify='center'>
              <Grid item xs={12} sm={8} md={6} lg={4} xl={4}>
                <Typography type='display3' color='inherit' align='center'>
                  BlockKeeper
                  <span style={{fontSize: '14px'}}>[BETA]</span>
                </Typography>
                <Typography
                  type='display1'
                  color='inherit'
                  align='center'
                  gutterBottom
                >
                  Please enter your login credentials
                </Typography>
                {this.state.loginBusy &&
                  <LinearProgress />
                }
                <Paper
                  square
                  className={this.props.classes.paperStyle}
                  elevation={24}
                >
                  <TextField
                    autoFocus
                    fullWidth
                    label='Identifier'
                    margin='normal'
                    value={this.state.userId}
                    error={
                      Boolean(this.state.emsg) ||
                      Boolean(this.state.userIdEmsg)
                    }
                    helperText={this.state.emsg || this.state.userIdEmsg}
                    onChange={evt => this.set('userId', evt.target.value)}
                    />
                  <TextField
                    fullWidth
                    label='Password'
                    type='password'
                    margin='normal'
                    autoComplete='current-password'
                    value={this.state.pw}
                    error={
                      Boolean(this.state.emsg) ||
                      Boolean(this.state.pwEmsg)
                    }
                    helperText={this.state.emsg || this.state.pwEmsg}
                    onChange={evt => this.set('pw', evt.target.value)}
                    />
                  <BrowserGate
                    allwd={
                      <div>
                        <Button
                          raised
                          color='accent'
                          className={this.props.classes.loginButton}
                          onClick={async (event) => this.login(event)}
                          disabled={!this.state.upd || this.state.loginBusy}
                          classes={{
                            raisedAccent: this.props.classes.actnBtnClr
                          }}
                          >
                          <Lock className={this.props.classes.lockIcon} />
                          Login
                        </Button>
                        <br />
                        <Button
                          href='/rgstr'
                          disabled={this.state.loginBusy}
                          className={this.props.classes.fullWidth}
                        >
                          Register
                        </Button>
                      </div>
                    }
                    ntAll={<NtAllwd />}
                  />
                </Paper>
              </Grid>
            </Grid>
          </div>
        </div>
      )
    }
  }
}

export default withStyles({
  loginStyle,
  paperStyle,
  fullWidth,
  actnBtnClr,
  loginButton: {
    width: '100%',
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit
  },
  lockIcon: {
    width: theme.spacing.unit * 2,
    height: theme.spacing.unit * 2
  }
})(LoginView)
