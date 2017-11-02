import React from 'react'
import * as browserLocale from 'browser-locale'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'
import Grid from 'material-ui/Grid'
import { withStyles } from 'material-ui/styles'
import {PersonAdd} from 'material-ui-icons'
import {LinearProgress} from 'material-ui/Progress'
import {theme, paperStyle, loginStyle, fullWidth, fullHeightRoot, actnBtnClr} from './Style'
import {Modal, BrowserGate, NtAllwd, DropDown} from './Lib'
import Rate from '../logic/Rate'
import __ from '../util'
import { FormControlLabel, FormGroup } from 'material-ui/Form'
import Switch from 'material-ui/Switch'

const styles = {
  fullHeightRoot,
  loginStyle,
  paperStyle,
  fullWidth,
  actnBtnClr,
  body1: {
    textAlign: 'left',
    marginTop: theme.spacing.unit * 2
  },
  btnRg: {
    width: '100%',
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit
  },
  person: {
    width: theme.spacing.unit * 2,
    height: theme.spacing.unit * 2
  },
  switch: {
    color: theme.palette.error[500]
  },
  bar: {
  },
  checked: {
    '& + $bar': {
      backgroundColor: theme.palette.error[500]
    }
  }
}

class RgstrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.browserLocale = browserLocale() || 'en-US'
    this.state = {username: 'Username', pw: '', rpw: '', coin0: 'USD', coin1: 'BTC', locale: this.browserLocale, writeDown: false}
    this.goBack = () => props.history.goBack()
    this.goUser = () => props.history.replace('/user/edit')
    this.save = this.save.bind(this)
    this.load = this.load.bind(this)
    this.logout = this.logout.bind(this)
    this.set = this.set.bind(this)
    this.setAction = this.setAction.bind(this)
    this.identifier = new Uint32Array(3)
    window.crypto.getRandomValues(this.identifier)
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'rgstr'))
    if (this.cx.core.isActive()) this.setState({loggedIn: true})
    await this.load()
  }

  async load () {
    try {
      const [rateCoins] = await Promise.all([
        new Rate(this.cx).getCoins()
      ])
      const coins = {coin0: [], coin1: []}
      for (let coin of rateCoins) {
        coins.coin0.push({lbl: coin, key: coin, ilk: 'coin0'})
        coins.coin1.push({lbl: coin, key: coin, ilk: 'coin1'})
      }
      this.setState({
        coins: coins
      })
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
    }
  }

  setAction (coinData) {
    this.setState({[coinData.ilk]: coinData.key})
  }

  logout () {
    this.cx.core.clear()
    this.setState({loggedIn: null})
  }

  async save () {
    this.setState({busy: true})
    try {
      await this.cx.core.register(
        this.identifier.join(''),
        this.state.username,
        this.state.pw,
        this.state.coin0,
        this.state.coin1,
        this.state.locale
      )
      this.props.history.replace(`/depot`)
    } catch (e) {
      this.setState({err: e.message, busy: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        usernameEmsg: __.vldAlphNum(this.state.username, {
          min: __.cfg('minUser'),
          max: __.cfg('maxUser')
        })
      }
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
        !d.usernameEmsg && !d.pwEmsg && !d.rpwEmsg && this.state.writeDown) {
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
        <div className={this.props.classes.fullHeightRoot}>
          {this.state.busy &&
          <LinearProgress />}
          <div className={this.props.classes.loginStyle}>
            <Grid container spacing={0} justify='center'>
              <Grid item xs={12} sm={8} md={6} lg={4} xl={4}>
                <Typography type='display3' color='inherit' align='center'>
                  Block Keeper
                </Typography>
                <Typography type='display1' color='inherit' align='center' gutterBottom>
                  Please choose your account details
                </Typography>
                <Paper square className={this.props.classes.paperStyle} elevation={24}>
                  <TextField
                    autoFocus
                    fullWidth
                    label='Identifier'
                    margin='normal'
                    value={this.identifier.join('')}
                    helperText='your account login identifier'
                    disabled={this.state.writeDown}
                  />
                  {false && <TextField
                    autoFocus
                    fullWidth
                    required
                    label='Username'
                    margin='normal'
                    value={this.state.username}
                    error={Boolean(this.state.usernameEmsg)}
                    helperText={this.state.usernameEmsg}
                    onChange={evt => this.set('username', evt.target.value)}
                  />}
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
                    disabled={this.state.writeDown}
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
                    disabled={this.state.writeDown}
                  />
                  <Grid container spacing={16}>
                    <Grid item xs={6}>
                      {this.state.coins &&
                        <DropDown
                          _id='coin0DropDown'
                          title={'Primary coin'}
                          data={this.state.coins.coin0}
                          slctd={this.state.coin0}
                          action={this.setAction}
                          disabled={this.state.writeDown}
                         />}
                    </Grid>
                    <Grid item xs={6}>
                      {this.state.coins &&
                      <DropDown
                        _id='coin1DropDown'
                        title={'Secondary coin'}
                        data={this.state.coins.coin0}
                        slctd={this.state.coin1}
                        action={this.setAction}
                        disabled={this.state.writeDown}
                      />}
                    </Grid>
                  </Grid>
                  <Typography type='body1' gutterBottom className={this.props.classes.body1}>
                    Please make sure you store your identifier and password safely.
                    Due to data privacy and security reasons, it is NOT possible
                    to recover your identifier or password. If you <b>forget your
                    login</b> credentials, all your <b>data will be lost</b> and you need
                    to setup a new account from the scratch.
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checkedClassName={this.props.classes.switch}
                          classes={{
                            bar: this.props.classes.bar,
                            checked: this.props.classes.checked
                          }}
                          checked={this.state.writeDown}
                          disabled={this.state.pw === '' || Boolean(this.state.rpwEmsg)}
                          onChange={evt => this.set('writeDown', !this.state.writeDown)} />}
                      label='I wrote down my identifier and password' />
                  </FormGroup>
                  {!this.busy &&
                    <BrowserGate
                      allwd={
                        <div>
                          <Button
                            raised
                            color={'accent'}
                            className={this.props.classes.btnRg}
                            onClick={this.save}
                            disabled={!this.state.upd}
                            classes={{
                              raisedAccent: this.props.classes.actnBtnClr
                            }}
                          >
                            <PersonAdd
                              className={this.props.classes.person}
                            />
                            Register
                          </Button>
                          <Button
                            className={this.props.classes.fullWidth}
                            onClick={this.goBack}
                          >
                            Cancel
                          </Button>
                        </div>
                      }
                      ntAll={<NtAllwd />}
                    />
                  }
                </Paper>
              </Grid>
            </Grid>
          </div>
        </div>
      )
    }
  }
}

export default withStyles(styles)(RgstrView)
