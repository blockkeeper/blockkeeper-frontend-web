import React from 'react'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'
import {LinearProgress} from 'material-ui/Progress'
import {Lock, PersonAdd} from 'material-ui-icons'
import {Modal} from './Lib'
import __ from '../util'
import {themeBgStyle, paperStyle, loginStyle, actionBtnStyle} from './Style'
const rootStyle = {...themeBgStyle, height: '100vh'}

export default class LoginView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.goBack = props.history.goBack
    this.reset = () => ({err: null, busy: null, username: '', pw: ''})
    this.reload = () => this.setState(this.reset())
    this.login = this.login.bind(this)
    this.state = this.reset()
  }

  componentDidMount () {
    Object.assign(this, __.initView(this, 'login'))
  }

  async login () {
    this.setState({err: null, busy: true})
    try {
      await this.cx.core.login(this.state.username, this.state.pw)
      this.props.history.push('/depot')  // redirect
    } catch (e) {
      (e.sts === 404)
        ? this.setState({...this.reset(), emsg: e.message})
        : this.setState({...this.reset(), err: e.message})
    }
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          onClose={this.reload}
          actions={[{lbl: 'Back to login', onClick: this.reload}]}
        >
          {this.state.err}
        </Modal>
      )
    } else {
      return (
        <div style={rootStyle}>
          {this.state.busy &&
          <LinearProgress />}
          {!this.state.busy &&
          <div style={loginStyle}>
            <Typography align='center' type='display3'>
              Blockkeeper
            </Typography>
            <Typography align='center' type='display1' gutterBottom>
              Please enter your login credentials
            </Typography>
            <Paper square style={paperStyle} elevation={24}>
              <TextField
                autoFocus
                fullWidth
                label='Username'
                margin='normal'
                value={this.state.username}
                error={Boolean(this.state.emsg)}
                helperText={this.state.emsg}
                onChange={evt => this.setState({username: evt.target.value})}
                />
              <TextField
                fullWidth
                label='Password'
                type='password'
                margin='normal'
                autoComplete='current-password'
                value={this.state.pw}
                onChange={evt => this.setState({pw: evt.target.value})}
                />
              <Button
                raised
                style={actionBtnStyle}
                href='/rgstr'
                >
                <PersonAdd />
                  Register
                </Button>
              <Button
                raised
                style={actionBtnStyle}
                onClick={(event) => this.login(event)}
                >
                <Lock />
                  Login
                </Button>
            </Paper>
          </div>}
        </div>
      )
    }
  }
}
