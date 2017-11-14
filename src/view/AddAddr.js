import React from 'react'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {FormControlLabel} from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import Radio from 'material-ui/Radio'
import {withStyles} from 'material-ui/styles'
import {Add, Clear} from 'material-ui-icons'
import Paper from 'material-ui/Paper'
import Divider from 'material-ui/Divider'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import QrReader from 'react-qr-reader'
import {theme, themeBgStyle, dividerStyle, qrReaderStyle,
        gridWrap, gridGutter, gridSpacer, actnBtnClr, cnctBtn} from './Style'
import {TopBar, Modal, CoinIcon, Snack} from './Lib'
import Addr from '../logic/Addr'
import __ from '../util'

class AddAddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {
      delay: 250,
      facingMode: 'user',
      manAddrMode: false,
      qrMode: false,
      coin: '',
      amnt: '0.00',
      hsh: '',
      name: '',
      desc: ''
    }
    this.coins = []
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
    this.set = this.set.bind(this)
    this.disableQrMode = (evt, checked) => {
      this.set('manAddrMode', checked)
      this.set('qrMode', false)
    }
    this.handleQrScan = data => {
      if (data !== null) {
        // remove URI format + remove ?strings
        this.set('hsh', data.trim().replace(/(\w*:)|((\?.*$))/g, ''))
        this.set('qrMode', false)
      }
    }
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'addAddr'))
    await this.load()
  }

  async load () {
    try {
      const [addrs, coins] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.rate.getCoins()
      ])
      if (addrs.length >= __.cfg('maxAddrCnt')) {
        this.setSnack('Maximum number of wallets reached: ' +
                      'Please disconnect a wallet first')
        this.props.history.replace('/depot')
        return
      }
      this.addrs = addrs
      this.coins = coins.filter(c => !__.isFiat(c))
      this.setState({coin: ''})
    } catch (e) {
      return this.errGo(`Cannot connect new wallet: ${e.message}`, e, '/depot')
    }
  }

  async save () {
    this.setState({busy: true})
    const addrObj = new Addr(this.cx)
    try {
      const addr = await addrObj.save({
        hsh: this.state.hsh,
        amnt: this.state.amnt,
        coin: this.state.coin,
        desc: this.state.desc,
        name: this.state.name
      })
      if (this.state.manAddrMode) {
        this.setSnack('Wallet connected')
      } else {
        this.setSnack('Wallet connected, synchronizing...')
        this.cx.depot.bxp([addr._id])
      }
      this.props.history.replace(`/wallet/${addr._id}`)
    } catch (e) {
      return this.errGo(`Connecting wallet failed: ${e.message}`, e)
    }
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')})
      }
      if (this.state.manAddrMode) {
        d.hsh = undefined
        d.amntEmsg = __.vldFloat(this.state.amnt)
        const name = this.state.name.trim()
        if (name && this.state.coin &&
            !d.amntEmsg && !d.nameEmsg && !d.descEmsg) {
          d.upd = true
        }
      } else {
        let hsh = (this.state.hsh || '').trim()
        let coinObj = this.cx.depot.coinObjs[this.state.coin]
        if (hsh && coinObj) {
          d.hshEmsg = coinObj.vldAddrHsh(hsh)
          if (!d.hshEmsg) {
            hsh = coinObj.toAddrHsh(hsh)
            for (let addr of this.addrs) {
              if (addr.hsh === hsh && addr.coin === this.state.coin) {
                d.hshEmsg = 'Address already exists'
                break
              }
            }
          }
        }
        if (hsh && coinObj && !d.hshEmsg && !d.nameEmsg && !d.descEmsg) {
          d.upd = true
        }
      }
      this.setState(d)
    })
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          onClose={this.goBack}
          actions={[{onClick: this.goBack, lbl: 'OK'}]}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.coin !== undefined) {
      return (
        <div>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />
          }
          <div className={this.props.classes.themeBgStyle}>
            <TopBar
              midTitle='Wallet'
              action={<Clear />}
              onClick={this.goBack}
              className={this.props.classes.gridWrap}
              noUser
            />
          </div>
          {this.state.busy &&
          <LinearProgress />}
          <Paper
            elevation={5}
            square
            className={this.props.classes.gridSpacer}
          >
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <Typography type='title'>
                  Details
                </Typography>
                {!this.state.manAddrMode &&
                  <TextField
                    required
                    fullWidth
                    label={`${this.state.coin} Wallet (Public Key)`}
                    margin='normal'
                    value={this.state.hsh || ''}
                    error={Boolean(this.state.hshEmsg)}
                    helperText={this.state.hshEmsg}
                    onChange={evt => this.set('hsh', evt.target.value)}
                    disabled={this.state.qrMode}
                  />}
                {this.state.manAddrMode &&
                  <TextField
                    required
                    fullWidth
                    label='Amount'
                    margin='normal'
                    value={this.state.amnt}
                    error={Boolean(this.state.amntEmsg)}
                    helperText={this.state.amntEmsg}
                    onChange={evt => this.set('amnt', evt.target.value)}
                  />}
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.qrMode}
                      onChange={(evt, checked) => {
                        this.set('hsh', '')
                        this.set('qrMode', checked)
                        this.set('manAddrMode', false)
                      }}
                    />}
                  label='Scan QR code'
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.manAddrMode}
                      onChange={this.disableQrMode}
                    />}
                  label='Manage manually (no public key)'
                />
                {this.state.qrMode &&
                  <div onClick={() => this.setState({
                    facingMode: this.state.facingMode === 'user'
                      ? 'environment'
                      : 'user'
                  })}>
                    <QrReader
                      facingMode={this.state.facingMode}
                      delay={this.state.delay}
                      resolution={250}
                      className={this.props.classes.qrReaderStyle}
                      onError={err => {
                        this.warn(`Accessing camera failed/denied: ${err}`)
                        this.setSnack('Accessing camera failed/denied: ' +
                                      'Please check your browser settings')
                        this.setState({snack: this.getSnack()})
                        this.disableQrMode(undefined, this.state.manAddrMode)
                      }}
                      onScan={this.handleQrScan}
                    />
                    <Typography type='caption' align='center'>
                      {__.cap(this.state.facingMode)} camera
                    </Typography>
                  </div>}
                <Divider className={this.props.classes.dividerStyle} light />
                <Typography type='title' gutterBottom>
                  Blockchain / Type
                </Typography>
                {this.coins.filter(coin => coin !== 'ETH').map(coin =>
                  <FormControlLabel
                    key={coin}
                    label={coin}
                    control={
                      <Radio
                        checked={this.state.coin === coin}
                        checkedIcon={<CoinIcon coin={coin} size={40} />}
                        icon={<CoinIcon
                          coin={coin}
                          size={40}
                          style={{opacity: 0.5}}
                        />}
                        onChange={() => this.set('coin', coin)}
                        value={coin}
                        name={coin}
                        className={this.props.classes.radios}
                        aria-label={coin}
                      />}
                  />)}
                <Divider className={this.props.classes.dividerStyle} light />
                <Typography type='title'>
                  Personal details
                </Typography>
                <TextField
                  fullWidth
                  label={'Name'}
                  required={this.state.manAddrMode}
                  margin='normal'
                  value={this.state.name}
                  error={Boolean(this.state.nameEmsg)}
                  helperText={this.state.nameEmsg}
                  onChange={evt => this.set('name', evt.target.value)}
                />
                <TextField
                  fullWidth
                  label='Notes'
                  margin='normal'
                  value={this.state.desc}
                  error={Boolean(this.state.descEmsg)}
                  helperText={this.state.descEmsg}
                  onChange={evt => this.set('desc', evt.target.value)}
                />
                <div className={this.props.classes.center}>
                  <Button
                    raised
                    color='accent'
                    className={this.props.classes.cnctBtn}
                    onClick={async () => await this.save()}
                    disabled={!this.state.upd || this.state.busy}
                    classes={{
                      raisedAccent: this.props.classes.actnBtnClr
                    }}
                  >
                    <Add />
                    Connect wallet
                  </Button>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default withStyles({
  themeBgStyle,
  gridWrap,
  gridGutter,
  gridSpacer,
  dividerStyle,
  qrReaderStyle,
  actnBtnClr,
  cnctBtn,
  radios: {
    paddingLeft: theme.spacing.unit
  },
  center: {
    textAlign: 'center'
  }
})(AddAddrView)
