import React from 'react'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import TransitiveNumber from 'react-transitive-number'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import Grid from 'material-ui/Grid'
import Paper from 'material-ui/Paper'
import {withStyles} from 'material-ui/styles'
import Divider from 'material-ui/Divider'
import QRCode from 'qrcode-react'
import {theme, themeBgStyle, noTxtDeco, qrCodeWrap, gridWrap, gridSpacer,
        gridGutter, tscitem, addr, amnt, tscIcon, tscAmnt, display1, body2,
        actnBtnClr, topBtnClass} from './Style'
import {ArrowBack, Launch} from 'material-ui-icons'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, Snack, Modal,
        CoinIcon, TscListAddr, ExtLink, InfoUpdateFailed, ToTopBtn, Done,
        Edit} from './Lib'
import Addr from '../logic/Addr'
import __ from '../util'

const styles = {
  themeBgStyle,
  noTxtDeco,
  qrCodeWrap,
  gridWrap,
  gridSpacer,
  gridGutter,
  tscitem,
  addr,
  amnt,
  tscIcon,
  tscAmnt,
  display1,
  body2,
  actnBtnClr,
  topBtnClass,
  paperWrap: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 3,
    paddingBottom: theme.spacing.unit * 3
  },
  titleStyle: {
    paddingTop: theme.spacing.unit * 2,
    lineHeight: 1.5
  },
  display3: {
    fontWeight: '400',
    color: theme.palette.primary['500']
  },
  deleteIcon: {
    width: theme.spacing.unit * 2,
    height: theme.spacing.unit * 2
  },
  tableWrap: {
    overflowX: 'auto',
    marginBottom: theme.spacing.unit * 2
  },
  addrStyle: {
    fontSize: '13px',
    overflowX: 'auto'
  },
  unvlBtn: {
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit
  }
}

class AddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.addrId = props.match.params.addrId
    this.addrObj = new Addr(this.cx, this.addrId)
    this.state = {show: false, toggleCoins: false, edit: false, unveil: false}
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    this.set = this.set.bind(this)
    this.close = () => this.setState({ask: null})
    this.show = () => this.setState({show: !this.state.show, edit: false, unveil: false})
    this.unveil = () => this.setState({unveil: !this.state.unveil})
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
    let addr, user
    try {
      ;[addr, user] = await Promise.all([
        this.addrObj.load(),
        this.cx.user.load()
      ])
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
    }
    this.user = user
    const {coin0, coin1} = await this.cx.user.getCoins(this.state.coin, user)
    setBxpTrigger(this)
    const blc = this.cx.depot.getAddrBlc([addr])
    const tagsJoin = (addr.tags || []).join(' ')
    this.setState({
      upd: false,
      addr: addr,
      name: addr.name,
      desc: addr.desc,
      tagsJoin,
      tscs: addr.tscs,
      coin: addr.coin,
      hshMode: Boolean(addr.hsh),
      coin0,
      coin1,
      blc1: `${addr.amnt}`,
      blc2: `${blc.get(coin0)}`,
      blc3: `${blc.get(coin1)}`,
      snack: this.getSnack(),
      bxpSts: this.cx.depot.getBxpSts(),
      addrUpdErrIds: this.cx.depot.addrUpdErrIds
    })
  }

  async save () {
    if (this.state.upd === false) {
      this.setState({edit: false})
      return
    }
    this.setState({edit: false, busy: true})
    try {
      const addr = await this.addrObj.save({
        name: this.state.name,
        desc: this.state.desc,
        tags: __.toTags(this.state.tagsJoin).split(' ')
      })
      this.setSnack('Wallet updated')
      this.setState({addr, snack: this.getSnack(), busy: false, upd: false})
    } catch (e) {
      this.setState({err: e.message, busy: false})
      if (__.cfg('isDev')) throw e
    }
  }

  async delete () {
    try {
      await this.addrObj.delete()
      this.setSnack('Wallet disconnected')
    } catch (e) {
      this.setState({err: e.message, show: false, unveil: false})
      if (__.cfg('isDev')) throw e
    }
    this.props.history.push('/depot')
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')}),
        tagsEmsg: __.vldAlphNum(this.state.tagsJoin, {max: __.cfg('maxHigh')})
      }
      if (this.state.hshMode) {
        if (!d.nameEmsg && !d.descEmsg && !d.tagsEmsg) d.upd = true
      } else {
        if (this.state.name.trim() &&
            !d.nameEmsg && !d.descEmsg && !d.tagsEmsg) {
          d.upd = true
        }
      }
      this.setState(d)
    })
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack}>
          {this.state.err}
        </Modal>
      )
    } else if (this.state.ask) {
      return (
        <Modal
          withBusy
          onClose={this.close}
          lbl='Disconnect wallet'
          actions={[{lbl: 'Disconnect wallet', onClick: this.delete}]}
        >
          {`Are you sure you want to disconnect wallet "${this.state.name}"?`}
        </Modal>
      )
    } else if (this.state.addr && this.state.tscs) {
      // don't enable link for 'man' and 'hd' (for privacy reasons) addrs
      let addrUrl
      if (this.state.addr.type === 'std') {
        addrUrl = __.toBxpUrl(
          'addr',
          this.state.addr.coin,
          this.state.addr.hsh,
          this.state.addr.bxp
        )
      }
      return (
        <div className={this.props.classes.themeBgStyle}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          {this.state.edit &&
          <TopBar
            midTitle='Wallet'
            action={<Done />}
            onClick={this.save}
            onClickLeft={() => this.setState({edit: false})}
            className={this.props.classes.gridWrap}
            modeCancel
            noUser
          />}
          {!this.state.edit &&
          <TopBar
            midTitle='Wallet'
            iconLeft={<ArrowBack />}
            onClickLeft={this.goBack}
            action={<Edit />}
            onClick={this.edit}
            className={this.props.classes.gridWrap}
            noUser
          />}
          {this.state.busy &&
          <LinearProgress />}
          <Paper
            elevation={0}
            square
            className={this.props.classes.paperWrap}
          >
            <div className={this.props.classes.gridGutter}>
              <Grid container justify='center' spacing={0}>
                <Grid item xs={12} sm={10} md={8} lg={6}>
                  <CoinIcon coin={this.state.coin} size={100} />
                  {!addrUrl &&
                    <Typography
                      type='title'
                      color='default'
                      className={this.props.classes.titleStyle}
                      noWrap
                      gutterBottom
                    >
                      {this.state.addr.name}
                    </Typography>
                  }
                  {addrUrl &&
                    <ExtLink
                      to={addrUrl}
                      className={this.props.classes.noTxtDeco}
                      txt={
                        <Typography
                          type='title'
                          color='default'
                          className={this.props.classes.titleStyle}
                          noWrap
                          gutterBottom
                        >
                          {this.state.addr.name}
                          <Launch color='grey' />
                        </Typography>}
                    />
                  }
                  <Typography
                    type='display3'
                    className={this.props.classes.display3}
                  >
                    <TransitiveNumber>
                      {__.formatNumber(this.state.blc1, this.state.coin, this.user.locale)}
                    </TransitiveNumber>
                  &nbsp;
                    <CoinIcon
                      coin={this.state.coin}
                      size={35}
                      color={theme.palette.primary['500']}
                      alt
                  />
                    {this.state.addrUpdErrIds.has(this.state.addr._id) &&
                    <InfoUpdateFailed />}
                  </Typography>
                  {!this.state.toggleCoins &&
                  <Typography
                    type='headline'
                    color='primary'
                    onClick={this.toggleCoins}
                    gutterBottom
                  >
                    <TransitiveNumber>
                      {__.formatNumber(this.state.blc2, this.state.coin0, this.user.locale)}
                    </TransitiveNumber>
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
                    color='primary'
                    gutterBottom
                  >
                    <TransitiveNumber>
                      {__.formatNumber(this.state.blc3, this.state.coin1, this.user.locale)}
                    </TransitiveNumber>
                    <CoinIcon
                      coin={this.state.coin1}
                      color={theme.palette.primary['500']}
                      alt
                    />
                  </Typography>}
                  {!this.state.show &&
                    <Button
                      raised
                      onClick={this.show}
                      style={{marginTop: '50px'}}
                    >
                      Show infos
                    </Button>}
                  {this.state.show &&
                  <div>
                    <Divider light />
                    {(this.state.addr.type === 'std' || this.state.unveil) &&
                    <div className={this.props.classes.qrCodeWrap}>
                      <QRCode value={this.state.addr.hsh} />
                      <Typography className={this.props.classes.addrStyle}>
                        {this.state.addr.hsh}
                      </Typography>
                    </div>}
                    <Divider light />
                    <div className={this.props.classes.tableWrap}>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell width={'10%'} padding='none'>
                              Name
                            </TableCell>
                            <TableCell numeric padding='none'>
                              {this.state.edit &&
                              <TextField
                                fullWidth
                                value={this.state.name}
                                error={Boolean(this.state.nameEmsg)}
                                helperText={this.state.nameEmsg}
                                onChange={evt => {
                                  this.set('name', evt.target.value)
                                }}
                                inputProps={{
                                  style: {textAlign: 'right'}
                                }}
                              />}
                              {!this.state.edit &&
                                this.state.addr.name}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell width={'10%'} padding='none'>
                              Type
                            </TableCell>
                            <TableCell numeric padding='none'>
                              {this.state.addr.type === 'hd' &&
                                <span>HD wallet (xpub key)</span>
                              }
                              {this.state.addr.type === 'std' &&
                                <span>Simple wallet (public key)</span>
                              }
                              {this.state.addr.type === 'man' &&
                                <span>Manual wallet</span>
                              }
                            </TableCell>
                          </TableRow>
                          {(this.state.addr.hd || {}).baseAbsPath &&
                            <TableRow>
                              <TableCell width={'10%'} padding='none'>
                                HD base path
                              </TableCell>
                              <TableCell numeric padding='none'>
                                {this.state.addr.hd.baseAbsPath}
                                {/* this.state.addr.hd.isMstr &&
                                  ' (HD address is master)' */}
                              </TableCell>
                            </TableRow>}
                          <TableRow>
                            <TableCell width={'10%'} padding='none'>
                              Notes
                            </TableCell>
                            <TableCell numeric padding='none'>
                              {this.state.edit &&
                                <TextField
                                  fullWidth
                                  value={this.state.desc}
                                  error={Boolean(this.state.descEmsg)}
                                  helperText={this.state.descEmsg}
                                  onChange={evt => {
                                    this.set('desc', evt.target.value)
                                  }}
                                  inputProps={{
                                    style: {
                                      textAlign: 'right'
                                    }
                                  }}
                                />}
                              {!this.state.edit &&
                                this.state.addr.desc}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell width={'10%'} padding='none'>
                              Tags
                            </TableCell>
                            <TableCell numeric padding='none'>
                              {this.state.edit &&
                                <TextField
                                  fullWidth
                                  value={this.state.tagsJoin}
                                  error={Boolean(this.state.tagsEmsg)}
                                  helperText={this.state.tagsEmsg}
                                  onChange={evt => {
                                    this.set('tagsJoin', evt.target.value)
                                  }}
                                  inputProps={{
                                    style: {
                                      textAlign: 'right'
                                    }
                                  }}
                                />}
                              {!this.state.edit &&
                                this.state.tagsJoin}
                            </TableCell>
                          </TableRow>
                          {this.state.addr.hsh &&
                            <TableRow>
                              <TableCell width={'10%'} padding='none'>
                                No. Transactions
                              </TableCell>
                              <TableCell numeric padding='none'>
                                {this.state.addr.tscCnt}
                                {this.state.addr.tscCnt > __.cfg('maxTscCnt') &&
                                  ` (only the last ${__.cfg('maxTscCnt')} ` +
                                  'are listed)'}
                              </TableCell>
                            </TableRow>}
                          {(
                              this.state.addr.hsh &&
                              this.state.addr.rcvAmnt != null
                            ) &&
                            <TableRow>
                              <TableCell width={'10%'} padding='none'>
                                Total Received
                              </TableCell>
                              <TableCell numeric padding='none'>
                                {this.state.addr.rcvAmnt} {this.state.coin}
                              </TableCell>
                            </TableRow>}
                          {(
                              this.state.addr.hsh &&
                              this.state.addr.sndAmnt != null
                            ) &&
                            <TableRow>
                              <TableCell width={'10%'} padding='none'>
                                Total Send
                              </TableCell>
                              <TableCell numeric padding='none'>
                                {this.state.addr.sndAmnt} {this.state.coin}
                              </TableCell>
                            </TableRow>}
                          {/* (this.state.addr.hd || {}).nxAddrHsh &&
                            <TableRow>
                              <TableCell width={'10%'} padding='none'>
                                Next address (HD path)
                              </TableCell>
                              <TableCell numeric padding='none'>
                                {this.state.addr.hd.nxAddrHsh}
                                <br />
                                ({this.state.addr.hd.nxAbsPath})
                              </TableCell>
                            </TableRow> */}
                        </TableBody>
                      </Table>
                    </div>
                    {((this.state.addr.hd || {}).nxAddrHsh) && !this.state.unveil && !this.state.edit &&
                    <Button
                      raised
                      onClick={this.unveil}
                      className={this.props.classes.unvlBtn}
                    >
                      Unveil xpub key
                    </Button>}
                    {this.state.edit &&
                    <Button
                      onClick={() => this.setState({ask: true})}
                      className={this.props.classes.unvlBtn}
                      raised>
                          Disconnect wallet
                        </Button>}
                    <Button
                      raised
                      onClick={this.show}>
                      Hide infos
                    </Button>
                  </div>
                }
                </Grid>
              </Grid>
            </div>
          </Paper>
          {this.state.tscs.length > 0 &&
            <TscListAddr
              addr={this.state.addr}
              tscs={this.state.tscs}
              coin0={this.state.coin0}
              addrIcon={false}
              className={this.props.classes.gridSpacer}
              gridWrapClassName={this.props.classes.gridWrap}
              gridGutterClassName={this.props.classes.gridGutter}
              itemClassName={this.props.classes.tscitem}
              display1ClassName={this.props.classes.display1}
              body2ClassName={this.props.classes.body2}
              tscAmntClassName={this.props.classes.tscAmnt}
              locale={this.user.locale}
            />}
          {this.state.tscs.length <= 0 &&
            <Paper
              elevation={5}
              square
              className={this.props.classes.paperWrap}
            >
              <Typography align='center' type='body1'>
                {this.state.addr.hsh &&
                  'No transactions'}
                {!this.state.addr.hsh &&
                  'No transactions (manually added wallet)'}
              </Typography>
            </Paper>}

          <BxpFloatBtn
            onClick={() => this.cx.depot.bxp([this.addrId])}
            bxpSts={this.state.bxpSts}
          />
          <ToTopBtn
            className={this.props.classes.topBtnClass}
          />
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default withStyles(styles)(AddrView)
