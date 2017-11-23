import React from 'react'
import * as browserLocale from 'browser-locale'
import * as fileDownload from 'js-file-download'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import Paper from 'material-ui/Paper'
import Grid from 'material-ui/Grid'
import IconButton from 'material-ui/IconButton'
import Input, {InputLabel, InputAdornment} from 'material-ui/Input'
import {FormControl} from 'material-ui/Form'
import ContentCopy from 'material-ui-icons/ContentCopy'
import {FormControlLabel, FormGroup} from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import {withStyles} from 'material-ui/styles'
import {PersonAdd} from 'material-ui-icons'
import {LinearProgress} from 'material-ui/Progress'
import {theme, paperStyle, loginStyle, fullWidth,
        actnBtnClr, styleGuide} from './Style'
import {Modal, BrowserGate, BrowserGateSafarimobile,
        NtAllwd, DropDown} from './Lib'
import CopyToClipboard from 'react-copy-to-clipboard'
import Rate from '../logic/Rate'
import __ from '../util'

class RgstrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.userId = __.uuid()
    this.cryptId = __.uuid()
    this.reset = {busy: false, writeDown: false, err: undefined}
    this.goBack = () => props.history.goBack()
    this.goUser = () => props.history.replace('/user/edit')
    this.save = this.save.bind(this)
    this.load = this.load.bind(this)
    this.reload = this.reload.bind(this)
    this.setAction = d => this.setState({[d.ilk]: d.key})
    this.logout = () => {
      this.cx.core.clear()
      this.setState({loggedIn: false})
    }
    this.state = {
      ...this.reset,
      coin0: 'USD',
      coin1: 'BTC',
      locale: browserLocale() || __.cfg('dfltLocale')
    }
    this.handleCopyClipboard = () => {}
  }

  async componentDidMount () {
    // set body bg
    document.body.style.backgroundColor = styleGuide.backgroundDark
    Object.assign(this, __.initView(this, 'rgstr'))
    if (this.cx.core.isActive()) this.setState({loggedIn: true})

    await this.load()
  }

  async load () {
    this.setState({busy: true})
    try {
      const rateCoins = await new Rate(this.cx).getCoins()
      const coins = {coin0: [], coin1: []}
      for (let coin of rateCoins) {
        coins.coin0.push({lbl: coin, key: coin, ilk: 'coin0'})
        coins.coin1.push({lbl: coin, key: coin, ilk: 'coin1'})
      }
      this.setState({coins, busy: false})
    } catch (e) {
      if (__.cfg('isDev')) throw e
      return this.setState({err: 'An error occurred: Please try again later'})
    }
  }

  async reload () {
    this.userId = __.uuid()
    this.cryptId = __.uuid()
    this.setState(this.reset)
    await this.load()
  }

  async save (e) {
    if (e) e.preventDefault()

    this.setState({busy: true})

    try {
      await this.cx.core.register(
        this.userId,
        this.cryptId,
        this.state.coin0,
        this.state.coin1,
        this.state.locale
      )
      this.props.history.replace(`/depot`)
    } catch (e) {
      if (__.cfg('isDev')) throw e
      return this.setState({err: e.message})
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
    } else if (this.state.loggedIn) {
      return (
        <Modal
          lbl='Note'
          noCncl
          onClose={this.goUser}
          actions={[{onClick: this.goUser, lbl: 'OK'}]}
        >
          Please logout before creating a new user
        </Modal>
      )
    } else if (this.state.busy) {
      return <LinearProgress />
    } else {
      const backupfile = 'Blockkeeper.io backup\r\nIdentifier: ' +
                         `${this.userId}\r\nCrypto-Key: ${this.cryptId}\r\n` +
                         'Please keep this credentials secret.\r\n'
      return (
        <div>
          <div className={this.props.classes.loginStyle}>
            <Grid container spacing={0} justify='center'>
              <Grid item xs={12} sm={8} md={7} lg={5} xl={4}>
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
                  Register your new account
                </Typography>
                <Paper
                  square
                  className={this.props.classes.paperStyle}
                  elevation={24}
                >
                  <form
                    autoComplete='on'
                    onSubmit={async (...args) => await this.save(...args)}
                  >
                    <FormControl
                      fullWidth
                      margin='normal'
                      disabled
                    >
                      <InputLabel htmlFor='identifier'>Identifier</InputLabel>
                      <Input
                        required
                        label='Identifier'
                        id='identifier'
                        autoComplete='on'
                        type='text'
                        value={this.userId}
                        endAdornment={
                          <InputAdornment position='end'>
                            <CopyToClipboard onCopy={this.handleCopyClipboard} text={this.userId}>
                              <IconButton>
                                <ContentCopy />
                              </IconButton>
                            </CopyToClipboard>
                          </InputAdornment>}
                        />
                    </FormControl>
                    <FormControl
                      fullWidth
                      margin='normal'
                      disabled
                    >
                      <InputLabel htmlFor='password'>Crypto-Key</InputLabel>
                      <Input
                        required
                        label='Crypto-Key'
                        id='password'
                        autoComplete='on'
                        type='password'
                        value={this.cryptId}
                        endAdornment={
                          <InputAdornment position='end'>
                            <CopyToClipboard onCopy={this.handleCopyClipboard} text={this.cryptId}>
                              <IconButton>
                                <ContentCopy />
                              </IconButton>
                            </CopyToClipboard>
                          </InputAdornment>}
                        />
                    </FormControl>
                    <Grid container spacing={16}>
                      <Grid item xs={6}>
                        {this.state.coins &&
                          <DropDown
                            _id='coin0DropDown'
                            title={'Primary coin'}
                            data={this.state.coins.coin0}
                            slctd={this.state.coin0}
                            action={this.setAction}
                           />
                        }
                      </Grid>
                      <Grid item xs={6}>
                        {this.state.coins &&
                          <DropDown
                            _id='coin1DropDown'
                            title={'Secondary coin'}
                            data={this.state.coins.coin1}
                            slctd={this.state.coin1}
                            action={this.setAction}
                          />
                        }
                      </Grid>
                    </Grid>
                    <Typography
                      type='body1'
                      gutterBottom
                      className={this.props.classes.body1}
                    >
                      Please make sure you store your <b>identifier and
                      crypto-key</b> safely. Due to data privacy and security
                      reasons, it is NOT possible to recover your identifier
                      or crypto-key. If you <b>forget this credentials</b>,
                      all your <b>data will be lost</b> and you need
                      to setup a new account from scratch.
                    </Typography>
                    <BrowserGateSafarimobile
                      safari={<Button
                        raised
                        color='accent'
                        className={this.props.classes.btnBackup}
                        classes={{
                          raisedAccent: this.props.classes.actnBtnClr
                        }}
                        onClick={() => {
                          window.alert(
                            backupfile +
                            '\n Please do a screenshot, copy+paste or pen+paper'
                          )
                        }}>
                        Show backup
                      </Button>}
                      rest={<Button
                        raised
                        color='accent'
                        className={this.props.classes.btnBackup}
                        classes={{
                          raisedAccent: this.props.classes.actnBtnClr
                        }}
                        onClick={() => {
                          fileDownload(backupfile, 'blockkeeper-backup.txt')
                        }}>
                        Download backup
                      </Button>}
                    />
                    <FormGroup>
                      <FormControlLabel
                        label={'I downloaded my backup or wrote down my ' +
                               'identifier and crypto-key.'}
                        control={
                          <Switch
                            classes={{
                              bar: this.props.classes.bar,
                              checked: this.props.classes.checked
                            }}
                            checked={this.state.writeDown}
                            onChange={evt => {
                              this.setState({writeDown: !this.state.writeDown})
                            }}
                          />
                        }
                      />
                    </FormGroup>
                    {!this.busy &&
                      <BrowserGate
                        allwd={
                          <div>
                            <Button
                              raised
                              type='submit'
                              color='accent'
                              className={this.props.classes.btnRg}
                              disabled={!this.state.writeDown}
                              classes={{
                                raisedAccent: this.props.classes.actnBtnClr
                              }}
                            >
                              <PersonAdd
                                className={this.props.classes.person}
                              />
                              Register
                            </Button>
                            <br />
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
                  </form>
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
  bar: {
  },
  checked: {
    color: theme.palette.error[500],
    '& + $bar': {
      backgroundColor: theme.palette.error[500]
    }
  },
  btnBackup: {
    ...fullWidth,
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2
  }
})(RgstrView)
