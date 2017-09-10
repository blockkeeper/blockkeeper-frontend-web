import React from 'react'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {FormControlLabel} from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import Radio from 'material-ui/Radio'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import {TopBar, Modal} from './Lib'
import __ from '../util'

export default class AddAddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {
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
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this, 'addAddr'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      await this.cx.user.load() // initializes the depot
      this.coins = await this.cx.rate.getCoins()
      this.setState({
        err: null,
        coin: 'BTC'
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async save () {
    this.setState({busy: true})
    try {
      const addr = await this.cx.depot.saveNewAddr(
        !this.state.noHshMode,
        this.state
      )
      __.addSnack('Address added')
      this.props.history.replace(`/addr/${addr._id}`)
    } catch (e) {
      this.setState({err: e.message, busy: false})
      if (process.env.NODE_ENV === 'development') throw e
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
        <div>
          <TopBar
            title='Add address'
            icon={<ArrowBackIcon />}
            onClick={this.goBack}
            noUser
          />
          <p />
          <Typography align='left' type='body1'>
            Address
          </Typography>
          {!this.state.noHshMode &&
            <div>
              <TextField
                autoFocus
                label='Public key *'
                value={this.state.hsh}
                error={Boolean(this.state.hshEmsg)}
                helperText={this.state.hshEmsg}
                onChange={evt => this.set('hsh', evt.target.value)}
              />
              {this.state.coin}
            </div>}
          {this.state.noHshMode &&
            <div>
              <TextField
                label='Amount *'
                value={this.state.amnt}
                error={Boolean(this.state.amntEmsg)}
                helperText={this.state.amntEmsg}
                onChange={evt => this.set('amnt', evt.target.value)}
              />
              {this.state.coin}
            </div>}
          <FormControlLabel
            control={
              <Switch
                checked={this.state.noHshMode}
                onChange={(evt, checked) => this.set('noHshMode', checked)}
              />
            }
            label='Manage manually (no public key)'
          />
          <p />
          <div>
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
          </div>
          <p />
          <Typography align='left' type='body1'>
            Additional details
          </Typography>
          <div>
            <TextField
              label={this.state.noHshMode ? 'Name *' : 'Name'}
              value={this.state.name}
              error={Boolean(this.state.nameEmsg)}
              helperText={this.state.nameEmsg}
              onChange={evt => this.set('name', evt.target.value)}
              />
            <br />
            <TextField
              label='Notes'
              value={this.state.desc}
              error={Boolean(this.state.descEmsg)}
              helperText={this.state.descEmsg}
              onChange={evt => this.set('desc', evt.target.value)}
              />
          </div>
          <p />
          {!this.state.busy &&
            <div>
              <Button onClick={this.save} disabled={!this.state.upd}>
                Save
              </Button>
              <Button onClick={this.goBack}>
                Cancel
              </Button>
            </div>}
          {this.state.busy &&
            <LinearProgress />}
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}
