import React from 'react'
import { LinearProgress } from 'material-ui/Progress'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import __ from '../util'

export default class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      user: '',
      pw: '',
      ivld: null,
      spnr: false
    }
    this.onLogin = this.onLogin.bind(this)
  }

  async onLogin (event) {
    this.setState({spnr: true})
    try {
      await this.props.initUser(__.toSecret(this.state.user, this.state.pw))
      this.props.history.push('/depot')  // redirect
    } catch (e) {
      if (e.sts !== 404) throw e
      this.setState({
        user: '',
        pw: '',
        ivld: 'Invalid user and/or password: Please try again',
        spnr: false
      })
    }
  }

  render () {
    return (
      <div>
        <TextField
          autoFocus
          label='Username'
          value={this.state.user}
          error={this.state.ivld ? true : false}  // eslint-disable-line
          helperText={this.state.ivld}
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
        <Button onClick={(event) => this.onLogin(event)}>Submit</Button>
        { this.state.spnr && <LinearProgress /> }
      </div>
    )
  }
}
