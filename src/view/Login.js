import React from 'react'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {LinearProgress} from 'material-ui/Progress'
import LockIcon from 'material-ui-icons/Lock'
import {Modal} from './Lib'
// import __ from '../util'

export default class LoginView extends React.Component {
  constructor (props) {
    super(props)
    this.reset = () => ({err: null, busy: null, user: '', pw: ''})
    this.reload = () => { this.setState(this.reset()) }
    this.onLogin = this.onLogin.bind(this)
    this.state = this.reset()
  }

  async onLogin () {
    this.setState({err: null, busy: true})
    try {
      await this.props.initUser(this.state.user, this.state.pw)
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
        <div>
          <Typography align='left' type='display2'>
            Blockkeeper
          </Typography>
          <Typography align='left' type='subheading'>
            Please enter your login credentials
          </Typography>
          <TextField
            autoFocus
            label='Username'
            value={this.state.user}
            error={this.state.emsg && true}
            helperText={this.state.emsg}
            onChange={evt => this.setState({user: evt.target.value})}
          />
          <br />
          <TextField
            label='Password'
            type='password'
            value={this.state.pw}
            onChange={evt => this.setState({pw: evt.target.value})}
          />
          <br />
          <Button
            onClick={(event) => this.onLogin(event)}
          >
            <LockIcon />
            Login
          </Button>
          {this.state.busy &&
            <LinearProgress />}
        </div>
      )
    }
  }
}
