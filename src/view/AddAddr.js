import React from 'react'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {FormControlLabel} from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import Radio from 'material-ui/Radio'
import { withStyles } from 'material-ui/styles'
import {Add, Clear} from 'material-ui-icons'
import Paper from 'material-ui/Paper'
import Divider from 'material-ui/Divider'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import QrReader from 'react-qr-reader'
import {theme, themeBgStyle, dividerStyle, qrReaderStyle,
        gridWrap, gridGutter, gridSpacer, actnBtnClr} from './Style'
import {addrLimitReached, TopBar, Modal, CoinIcon} from './Lib'
import Addr from '../logic/Addr'
import __ from '../util'

const styles = {
  themeBgStyle,
  gridWrap,
  gridGutter,
  gridSpacer,
  dividerStyle,
  qrReaderStyle,
  actnBtnClr,
  saveStyle: {
    width: '50%',
    margin: theme.spacing.unit * 4
  },
  radios: {
    paddingLeft: theme.spacing.unit
  },
  center: {
    textAlign: 'center'
  }
}

class AddAddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {
      delay: 250,
      facingMode: 'front',
      noHshMode: false,
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
    this.handleQRScan = this.handleQRScan.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'addAddr'))
    await this.load()
  }

  async load () {
    try {
      this.coins = (await this.cx.rate.getCoins()).filter((c) => {
        return !__.isFiat(c)
      })
      this.setState({coin: ''})
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
    }
  }

  async save () {
    try {
      const addrs = await this.cx.depot.loadAddrs()
      if (addrLimitReached(this, addrs)) {
        this.props.history.replace('/depot')
        return
      }
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
      return
    }
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
      this.setSnack('Address added')
      this.props.history.replace(`/addr/${addr._id}`)
      this.cx.depot.bxp([addr._id])
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message, busy: false})
    }
  }

  handleQRScan (data) {
    if (data !== null) {
      this.setState({
        hsh: data.trim().replace(/(\w*:)|((\?.*$))/g, ''), // remove URI format + remove ?strings
        qrMode: false
      })
    }
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')})
      }
      if (this.state.noHshMode) {
        d.amntEmsg = __.vldFloat(this.state.amnt)
        const name = this.state.name.trim()
        if (name && this.state.coin && !d.amntEmsg && !d.nameEmsg && !d.descEmsg) d.upd = true
      } else {
        let hsh = this.state.hsh.trim()
        if (hsh && this.state.coin) {
          d.hshEmsg = __.vldAlphNum(hsh, {strict: true, min: __.cfg('coins').cryp[this.state.coin].minAddrLength, max: __.cfg('coins').cryp[this.state.coin].maxAddrLength})
        }
        if (hsh && this.state.coin && !d.hshEmsg && !d.nameEmsg && !d.descEmsg) d.upd = true
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
        <div className={this.props.classes.themeBgStyle}>
          <TopBar
            midTitle='Address'
            action={<Clear />}
            onClick={this.goBack}
            className={this.props.classes.gridWrap}
            noUser
          />
          {this.state.busy &&
          <LinearProgress />}
          <Paper
            square
            className={this.props.classes.gridSpacer}
          >
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <Typography type='title'>
                  Details
                </Typography>
                {!this.state.noHshMode &&
                  <TextField
                    required
                    fullWidth
                    label={`${this.state.coin} Address (Public Key)`}
                    margin='normal'
                    value={this.state.hsh}
                    error={Boolean(this.state.hshEmsg)}
                    helperText={this.state.hshEmsg}
                    onChange={evt => this.set('hsh', evt.target.value)}
                  />}
                {this.state.noHshMode &&
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
                        this.set('qrMode', checked)
                        this.set('noHshMode', false)
                      }}
                    />}
                  label='Scan QR Code'
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.noHshMode}
                      onChange={(evt, checked) => {
                        this.set('noHshMode', checked)
                        this.set('qrMode', false)
                      }}
                    />}
                  label='Manage manually (no public key)'
                />
                {this.state.qrMode &&
                  <div onClick={() => this.setState({
                    facingMode: this.state.facingMode === 'front'
                          ? 'rear'
                          : 'front'
                  })}>
                    <QrReader
                      facingMode={this.state.facingMode}
                      delay={this.state.delay}
                      className={this.props.classes.qrReaderStyle}
                      style={{
                        height: '100%',
                        width: '100%',
                        maxHeight: '400px'
                      }}
                      onError={err => this.warn(err)}
                      onScan={this.handleQRScan}
                        />
                    <Typography type='caption' align='center'>
                      {__.cap(this.state.facingMode)} camera
                        </Typography>
                  </div>}
                <Divider className={this.props.classes.dividerStyle} light />
                <Typography type='title' gutterBottom>
                  Blockchain / Type
                </Typography>
                {this.coins.map(coin =>
                  <FormControlLabel
                    key={coin}
                    label={coin}
                    control={
                      <Radio
                        checked={this.state.coin === coin}
                        checkedIcon={<CoinIcon coin={coin} size={40} />}
                        icon={<CoinIcon coin={coin} size={40} style={{opacity: 0.3}} />}
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
                  required={this.state.noHshMode}
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
                    color={'accent'}
                    className={this.props.classes.saveStyle}
                    onClick={this.save}
                    disabled={!this.state.upd || this.state.busy}
                    classes={{
                      raisedAccent: this.props.classes.actnBtnClr
                    }}
                  >
                    <Add />
                        Add address
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

export default withStyles(styles)(AddAddrView)
