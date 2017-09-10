import React from 'react'
import {Link} from 'react-router-dom'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import LockIcon from 'material-ui-icons/Lock'
import {TopBar, Modal} from './Lib'
import __ from '../util'

export default class LoginView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.reset = () => ({err: null, busy: null, user: '', pw: ''})
    this.reload = () => { this.setState(this.reset()) }
    this.login = this.login.bind(this)
    this.state = this.reset()
  }

  componentWillMount () {
    if (__.getSecSto()) this.props.history.replace('/depot')
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this, 'login'))
  }

  async login () {
    this.setState({err: null, busy: true})
    try {
      await this.cx.user.init(this.state.user, this.state.pw)
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
          <TopBar
            title='Login'
            icon={<ArrowBackIcon />}
            onClick={this.goBack}
            noUser
          />
          <p />
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
            onClick={(event) => this.login(event)}
          >
            <LockIcon />
            Login
          </Button>
          <Link to='/rgstr'>Sign up</Link>
          {this.state.busy &&
            <LinearProgress />}
        </div>
      )
    }
  }
}
