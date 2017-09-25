import React from 'react'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {FormControlLabel} from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import Radio from 'material-ui/Radio'
import {LibraryAdd, Clear} from 'material-ui-icons'
import Paper from 'material-ui/Paper'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import {theme, themeBgStyle, actionBtnStyle, paperStyle} from './Style'
import {TopBar, Modal, CoinIcon} from './Lib'
import Grid from 'material-ui/Grid'
import QrReader from 'react-qr-reader'
import Addr from '../logic/Addr'
import __ from '../util'

export default class AddAddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {
      delay: 999,
      facingMode: 'front',
      noHshMode: false,
      coin: 'BTC',
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
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      this.coins = await this.cx.rate.getCoins()
      this.setState({
        err: null,
        coin: 'BTC'
      })
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
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
      __.addSnack('Address added')
      this.props.history.replace(`/addr/${addr._id}`)
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message, busy: false})
    }
  }

  handleQRScan (data) {
    if (data !== null) {
      this.setState({
        hsh: data
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
        if (name && !d.amntEmsg && !d.nameEmsg && !d.descEmsg) d.upd = true
      } else {
        let hsh = this.state.hsh.trim()
        d.hshEmsg = __.vldAlphNum(hsh, {strict: true, max: 250})
        if (hsh && !d.hshEmsg && !d.nameEmsg && !d.descEmsg) d.upd = true
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
    } else if (this.state.coin) {
      return (
        <div style={themeBgStyle}>
          {this.state.busy &&
          <LinearProgress />}
          <TopBar
            title='BK'
            midTitle='Address'
            icon={<Clear />}
            onClick={this.goBack}
            noUser
          />
          <Paper square style={paperStyle}>
            <Grid container spacing={16} justify='center' >
              <Grid item xs={12} sm={6}>
                <Typography type='title'>
                  QR Code
                </Typography>
                <div onClick={() => this.setState({ facingMode: this.state.facingMode === 'front' ? 'rear' : 'front' })}>
                  <QrReader
                    facingMode={this.state.facingMode}
                    delay={this.state.delay}
                    style={{height: '100%', width: '100%', maxHeight: '400px', marginTop: theme.spacing.unit * 2, background: theme.palette.background.light}}
                    onError={(err) => console.log(err)}
                    onScan={this.handleQRScan}
                  />
                  <Typography type='caption' align='center'>
                    {__.cap(this.state.facingMode)} camera
                  </Typography>
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography type='title'>
                  <CoinIcon coin={this.state.coin} />&nbsp;
                  {this.state.coin}&nbsp;
                  Details
                </Typography>

                {!this.state.noHshMode &&
                <div>
                  <TextField
                    autoFocus
                    required
                    fullWidth
                    label='Public key'
                    margin='normal'
                    value={this.state.hsh}
                    error={Boolean(this.state.hshEmsg)}
                    helperText={this.state.hshEmsg}
                    onChange={evt => this.set('hsh', evt.target.value)}
                  />
                </div>}

                {this.state.noHshMode &&
                <div>
                  <TextField
                    autoFocus
                    required
                    fullWidth
                    label='Amount'
                    margin='normal'
                    value={this.state.amnt}
                    error={Boolean(this.state.amntEmsg)}
                    helperText={this.state.amntEmsg}
                    onChange={evt => this.set('amnt', evt.target.value)}
                      />
                </div>}

                {this.coins.map(coin =>
                  <FormControlLabel
                    key={coin}
                    label={coin}
                    control={
                      <Radio
                        checked={this.state.coin === coin}
                        onChange={() => this.set('coin', coin)}
                        value={coin}
                        name={coin}
                        aria-label={coin}
                        />
                      }
                    />
                  )}

                <br />

                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.noHshMode}
                      onChange={(evt, checked) => this.set('noHshMode', checked)}
                      />
                    }
                  label='Manage manually (no public key)'
                  />

              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={this.state.noHshMode ? 'Name *' : 'Name'}
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
              </Grid>

              <Grid item xs={12}>
                {!this.state.busy &&
                <div style={{textAlign: 'center'}}>
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
                    <LibraryAdd />
                    Add address
                  </Button>
                </div>}
              </Grid>
            </Grid>
          </Paper>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}
