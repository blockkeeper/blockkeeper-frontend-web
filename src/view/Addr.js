import React from 'react'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import TransitiveNumber from 'react-transitive-number'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import Grid from 'material-ui/Grid'
import Paper from 'material-ui/Paper'
import QRCode from 'qrcode-react'
import {theme, themeBgStyle, paperStyle, overflowStyle} from './Style'
import {ArrowBack, ArrowDropDown, ArrowDropUp,
       Launch, ModeEdit, Delete, Clear, Save} from 'material-ui-icons'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, Snack, Modal,
        CoinIcon, TscListAddr, ExtLink} from './Lib'
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
    this.set = this.set.bind(this)
    this.close = () => this.setState({ask: null})
    this.show = () => this.setState({show: !this.state.show, edit: false})
    this.edit = edit => this.setState({edit: !this.state.edit, show: true})
    this.toggleCoins = () => {
      this.setState({toggleCoins: !this.state.toggleCoins})
    }
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'addr'))
    await this.load()
  }

  componentWillUnmount () {
    unsetBxpTrigger(this)
  }

  async load () {
    let addr, coin0, coin1
    try {
      ;[
        addr,
        {coin0, coin1}
      ] = await Promise.all([
        this.addrObj.load(),
        this.cx.user.getCoins(this.state.coin)
      ])
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
    }
    setBxpTrigger(this)
    const blc = this.cx.depot.getAddrBlc([addr])
    this.setState({
      upd: false,
      addr: addr,
      name: addr.name,
      desc: addr.desc,
      tscs: addr.tscs,
      coin: addr.coin,
      hshMode: Boolean(addr.hsh),
      coin0,
      coin1,
      blc1: `${addr.amnt}`,
      blc2: `${blc.get(coin0)}`,
      blc3: `${blc.get(coin1)}`,
      snack: this.getSnack(),
      bxpSts: this.cx.depot.getBxpSts()
    })
  }

  async save () {
    if (this.state.upd === false) {
      return
    }
    this.setState({edit: false, busy: true})
    try {
      const addr = await this.addrObj.save({
        name: this.state.name,
        desc: this.state.desc
      })
      this.setSnack('Address updated')
      this.setState({addr, snack: this.getSnack(), busy: false, upd: false})
    } catch (e) {
      this.setState({err: e.message, busy: false})
      if (__.cfg('isDev')) throw e
    }
  }

  async delete () {
    try {
      await this.addrObj.delete()
      this.setSnack('Address deleted')
    } catch (e) {
      this.setState({err: e.message, show: false})
      if (__.cfg('isDev')) throw e
    }
    this.props.history.push('/depot')
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')})
      }
      if (this.state.hshMode) {
        if (!d.nameEmsg && !d.descEmsg) d.upd = true
      } else {
        if (this.state.name.trim() && !d.nameEmsg && !d.descEmsg) d.upd = true
      }
      this.setState(d)
    })
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack} >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.ask) {
      return (
        <Modal
          withBusy
          onClose={this.close}
          lbl='Delete address'
          actions={[{lbl: 'Delete', onClick: this.delete}]}
        >
          {`Are you sure you want to delete address "${this.state.name}"?`}
        </Modal>
      )
    } else if (this.state.addr && this.state.tscs) {
      const addrUrl = this.state.addr.hsh ? __.cfg('toBxpUrl')('addr',
                      this.state.addr.coin)(this.state.addr.hsh) : undefined
      return (
        <div style={themeBgStyle}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          {this.state.edit &&
          <TopBar
            midTitle='Address'
            iconLeft={<Clear />}
            onClickLeft={() => this.setState({edit: false})}
            icon={<Save />}
            onClick={this.save}
            noUser
          />}
          {!this.state.edit &&
          <TopBar
            midTitle='Address'
            iconLeft={<ArrowBack />}
            onClickLeft={this.goBack}
            icon={<ModeEdit />}
            onClick={this.edit}
            noUser
          />}
          {this.state.busy &&
          <LinearProgress />}
          <Paper
            elevation={0}
            square
            style={{...paperStyle, textAlign: 'center', paddingBottom: 0}}
          >
            <Grid container justify='center'>
              <Grid item xs={12} sm={10} md={8} lg={6}>
                <CoinIcon coin={this.state.coin} size={100} />
                {this.state.edit &&
                <TextField
                  fullWidth
                  value={this.state.name}
                  error={Boolean(this.state.nameEmsg)}
                  helperText={this.state.nameEmsg}
                  onChange={evt => this.set('name', evt.target.value)}
                  inputProps={{
                    style: {
                      textAlign: 'center',
                      fontSize: theme.typography.title.fontSize
                    }
                  }}
                />}
                {!this.state.edit && !addrUrl &&
                  <Typography
                    type='title'
                    color='default'
                    style={{
                      paddingTop: theme.spacing.unit * 2,
                      ...overflowStyle
                    }}
                  >
                    {this.state.addr.name}
                  </Typography>
                }
                {!this.state.edit && addrUrl &&
                  <ExtLink
                    to={addrUrl}
                    style={{textDecoration: 'none'}}
                    txt={
                      <Typography
                        type='title'
                        color='default'
                        style={{
                          paddingTop: theme.spacing.unit * 2,
                          ...overflowStyle
                        }}
                      >
                        {this.state.addr.name}
                        <Launch color='grey' />
                      </Typography>}
                  />
                }
                <Typography
                  type='display3'
                  style={{
                    fontWeight: '400',
                    color: theme.palette.primary['500'],
                    paddingTop: theme.spacing.unit * 2
                  }}
                >
                  <TransitiveNumber>
                    {this.state.blc1}
                  </TransitiveNumber>&nbsp;
                  <CoinIcon
                    coin={this.state.coin}
                    size={35}
                    color={theme.palette.primary['500']}
                    alt
                  />
                </Typography>
                {!this.state.toggleCoins &&
                  <Typography
                    type='headline'
                    onClick={this.toggleCoins}
                    style={{color: theme.palette.primary['500']}}
                    gutterBottom
                  >
                    <TransitiveNumber>
                      {this.state.blc2}
                    </TransitiveNumber>&nbsp;
                    <CoinIcon
                      coin={this.state.coin0}
                      color={theme.palette.primary['500']}
                      alt
                    />
                  </Typography>}
                {this.state.toggleCoins &&
                  <Typography
                    type='headline'
                    onClick={this.toggleCoins}
                    style={{color: theme.palette.primary['500']}}
                    gutterBottom
                  >
                    <TransitiveNumber>
                      {this.state.blc3}
                    </TransitiveNumber>&nbsp;
                    <CoinIcon
                      coin={this.state.coin1}
                      color={theme.palette.primary['500']}
                      alt
                    />
                  </Typography>}
                {!this.state.show &&
                  <IconButton onClick={this.show}>
                    <ArrowDropDown style={{height: '50px', width: '50px'}} />
                  </IconButton>}
                {this.state.show &&
                  <div>
                    {this.state.addr.hsh &&
                    <div style={{padding: theme.spacing.unit * 2}}>
                      <QRCode value={this.state.addr.hsh} />
                      <Typography style={{fontSize: '13px'}}>
                        {this.state.addr.hsh}
                      </Typography>
                    </div>
                    }
                    {this.state.edit &&
                      <Button onClick={() => this.setState({ask: true})}>
                        <Delete
                          style={{
                            width: theme.spacing.unit * 2,
                            height: theme.spacing.unit * 2
                          }}
                        />
                        Delete Address
                      </Button>}
                    <Table>
                      <TableBody>
                        {this.state.addr.hsh &&
                          <TableRow>
                            <TableCell width={'10%'}>
                              No. Transactions
                            </TableCell>
                            <TableCell numeric>
                              {this.state.addr.tscCnt}
                              {this.state.addr.tscCnt > __.cfg('mxTscCnt') &&
                                ` (only the last ${__.cfg('mxTscCnt')} ` +
                                'are listed)'}
                            </TableCell>
                          </TableRow>}
                        {this.state.addr.hsh &&
                          <TableRow>
                            <TableCell width={'10%'}>
                              Total Received
                            </TableCell>
                            <TableCell numeric>
                              {this.state.addr.rcvAmnt}
                              <CoinIcon
                                coin={this.state.coin}
                                size={12}
                                color='primary'
                                alt
                              />
                            </TableCell>
                          </TableRow>}
                        {this.state.addr.hsh &&
                          <TableRow>
                            <TableCell width={'10%'}>
                              Total Send
                            </TableCell>
                            <TableCell numeric>
                              {this.state.addr.sndAmnt}
                              <CoinIcon
                                coin={this.state.coin}
                                size={12}
                                color='primary'
                                alt
                              />
                            </TableCell>
                          </TableRow>}
                        <TableRow>
                          <TableCell width={'10%'}>
                            Notes
                          </TableCell>
                          <TableCell numeric>
                            {this.state.edit &&
                              <TextField
                                fullWidth
                                value={this.state.desc}
                                error={Boolean(this.state.descEmsg)}
                                helperText={this.state.descEmsg}
                                onChange={evt => {
                                  this.set('desc', evt.target.value)
                                }}
                              />}
                            {!this.state.edit &&
                              this.state.addr.desc}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell width={'10%'}>
                            Tags
                          </TableCell>
                          <TableCell numeric />
                        </TableRow>
                      </TableBody>
                    </Table>
                    <IconButton onClick={this.show}>
                      <ArrowDropUp style={{height: '50px', width: '50px'}} />
                    </IconButton>
                  </div>
                }
              </Grid>
            </Grid>
          </Paper>
          <Paper square style={{...paperStyle}} elevation={5}>
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
          <BxpFloatBtn
            onClick={() => this.cx.depot.bxp([this.addrId])}
            bxpSts={this.state.bxpSts}
          />
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}
