import React from 'react'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import Paper from 'material-ui/Paper'
import Divider from 'material-ui/Divider'
import QRCode from 'qrcode-react'
import {TopBar, Snack, Modal, CoinIcon, TscListAddr} from './Lib'
import {theme, themeBgStyle, paperStyle, actionBtnStyle} from './Style'
import {ArrowBack, ArrowDropDown, ArrowDropUp,
       Launch, ModeEdit, Delete, Cancel, Save} from 'material-ui-icons'
import Addr from '../logic/Addr'
import __ from '../util'

export default class AddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.addrId = props.match.params.addrId
    this.addrObj = new Addr(this.cx, this.addrId)
    this.state = {show: false, toggleCoins: false, edit: false}
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    this.toggleCoins = this.toggleCoins.bind(this)
    this.show = this.show.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'addr'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      const [
        addr,
        {coin0, coin1}
      ] = await Promise.all([
        await this.addrObj.load(),
        this.cx.user.getCoins(this.state.coin)
      ])
      const blc = this.cx.depot.getAddrBlc([addr])
      this.setState({
        err: null,
        addr: addr,
        tscs: addr.tscs,
        coin: addr.coin,
        coin0,
        coin1,
        blc1: `${addr.amnt}`,
        blc2: `${blc.get(coin0)}`,
        blc3: `${blc.get(coin1)}`,
        snack: __.getSnack()
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async save (name, desc) {
    try {
      const addr = await this.addrObj.save({name, desc})
      __.addSnack('Address updated')
      this.setState({addr, snack: __.getSnack()})
    } catch (e) {
      this.setState({err: e.message, show: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async delete () {
    try {
      await this.addrObj.delete()
      __.addSnack('Address deleted')
    } catch (e) {
      this.setState({err: e.message, show: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
    this.props.history.push('/depot')
  }

  show () {
    this.setState({show: !this.state.show, edit: false})
  }

  edit (edit) {
    this.setState({edit: !edit})
  }

  toggleCoins () {
    this.setState({toggleCoins: !this.state.toggleCoins})
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack} >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.addr && this.state.tscs) {
      return (
        <div style={themeBgStyle}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          <TopBar
            midTitle='Address'
            iconLeft={<ArrowBack />}
            onClickLeft={this.goBack}
          />
          <Paper square style={{...paperStyle, textAlign: 'center', paddingBottom: 0}} elevation={0}>
            <CoinIcon coin={this.state.coin} size={100} />
            <Typography type='title' color='default' style={{paddingTop: theme.spacing.unit * 2}}>
              {this.state.addr.name}
              <Launch color='grey' />
            </Typography>
            <Typography type='display3' style={{fontWeight: '400', color: theme.palette.primary['500'], paddingTop: theme.spacing.unit * 2}}>
              {this.state.blc1}&nbsp;
              <CoinIcon coin={this.state.coin} size={35} color={theme.palette.primary['500']} alt />
            </Typography>
            {!this.state.toggleCoins &&
              <Typography type='headline' onClick={this.toggleCoins} style={{color: theme.palette.primary['500']}} gutterBottom>
                {this.state.blc2}&nbsp;
                <CoinIcon coin={this.state.coin0} color={theme.palette.primary['500']} alt />
              </Typography>}
            {this.state.toggleCoins &&
              <Typography type='headline' onClick={this.toggleCoins} style={{color: theme.palette.primary['500']}} gutterBottom>
                {this.state.blc3}&nbsp;
                <CoinIcon coin={this.state.coin1} color={theme.palette.primary['500']} alt />
              </Typography>}
            {!this.state.show &&
              <IconButton onClick={this.show}>
                <ArrowDropDown style={{height: '50px', width: '50px'}} />
              </IconButton>}
            {this.state.show &&
              <div>
                <AddrList
                  addr={this.state.addr}
                  save={this.save}
                  delete={this.delete}
                />
                <IconButton onClick={this.show}>
                  <ArrowDropUp style={{height: '50px', width: '50px'}} />
                </IconButton>
              </div>
            }
          </Paper>
          <Paper square style={{...paperStyle}} elevation={10}>
            {this.state.tscs.length > 0 &&
              <TscListAddr
                addr={this.state.addr}
                tscs={this.state.tscs}
                coin0={this.state.coin0}
                addrIcon={false}
              />}
            {this.state.tscs.length <= 0 &&
              <Typography align='center' type='body1'>
                {this.state.addr.hsh &&
                  'No transactions'}
                {!this.state.addr.hsh &&
                  'No transactions (manually added address)'}
              </Typography>}
          </Paper>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

class AddrList extends React.Component {
  constructor (props) {
    super(props)
    this.addrId = props.addr._id
    this.addrHsh = props.addr.hsh
    this.hshMode = Boolean(props.addr.hsh)
    this.state = {
      name: props.addr.name,
      desc: props.addr.desc,
      coin: props.addr.coin,
      tscsCount: props.addr.tscs.length
    }
    this.saveAddr = props.save
    this.deleteAddr = props.delete
    this.close = () => this.setState({ask: null})
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    this.set = this.set.bind(this)
  }

  async save () {
    this.setState({busy: true})
    await this.saveAddr(this.state.name, this.state.desc)
    this.setState({busy: false, edit: false})
  }

  async delete () {
    this.setState({busy: true})
    await this.deleteAddr(this.addrId)
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')})
      }
      if (this.hshMode) {
        if (!d.nameEmsg && !d.descEmsg) d.upd = true
      } else {
        if (this.state.name.trim() && !d.nameEmsg && !d.descEmsg) d.upd = true
      }
      this.setState(d)
    })
  }

  render () {
    if (this.state.ask) {
      return (
        <Modal
          withBusy
          onClose={this.close}
          lbl='Delete'
          actions={[{lbl: 'Delete', onClick: this.delete}]}
        >
          {`Delete address "${this.state.name}"?`}
        </Modal>
      )
    } else {
      return (
        <div>
          {this.addrHsh &&
          <div style={{padding: theme.spacing.unit * 2}}>
            <Divider light style={{marginBottom: theme.spacing.unit * 2}} />
            <QRCode value={this.addrHsh} />
            <Typography style={{fontSize: '13px'}}>
              {this.addrHsh}
            </Typography>
          </div>
          }
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  No. Transactions
                </TableCell>
                <TableCell numeric>
                  {this.state.tscsCount}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  Total Received
                </TableCell>
                <TableCell numeric>
                  653.4563 <CoinIcon coin={this.state.coin} size={12} color='primary' alt />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  Total Send
                </TableCell>
                <TableCell numeric>
                  3.6746 <CoinIcon coin={this.state.coin} size={12} color='primary' alt />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  Name
                </TableCell>
                <TableCell numeric>
                  {this.state.edit &&
                  <TextField
                    autoFocus
                    fullWidth
                    value={this.state.name}
                    error={Boolean(this.state.nameEmsg)}
                    helperText={this.state.nameEmsg}
                    onChange={evt => this.set('name', evt.target.value)}
                  />}
                  {!this.state.edit &&
                    this.state.name}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  Notes
                </TableCell>
                <TableCell numeric>
                  {this.state.edit &&
                    <TextField
                      fullWidth
                      value={this.state.desc}
                      error={Boolean(this.state.descEmsg)}
                      helperText={this.state.descEmsg}
                      onChange={evt => this.set('desc', evt.target.value)}
                    />}
                  {!this.state.edit &&
                    this.state.desc}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {!this.state.edit &&
            <div>
              <Button
                raised
                style={actionBtnStyle}
                onClick={() => this.setState({edit: true})}
              >
                <ModeEdit />
                Edit
              </Button>
              <Button
                raised
                style={actionBtnStyle}
                onClick={() => this.setState({ask: true})}
              >
                <Delete />
                Delete
              </Button>
            </div>}
          {this.state.edit &&
            <div>
              <Button
                raised
                style={actionBtnStyle}
                onClick={this.save} disabled={!this.state.upd}
              >
                <Save />
                Save
              </Button>
              <Button
                raised
                style={actionBtnStyle}
                onClick={() => this.setState({edit: false})}
              >
                <Cancel />
                Cancel
              </Button>
            </div>}
        </div>
      )
    }
  }
}
