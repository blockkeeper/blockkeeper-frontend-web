import React from 'react'
import compose from 'recompose/compose'
import LinearProgress from '@material-ui/core/LinearProgress'
import {ArrowBack} from '@material-ui/icons'
import Paper from '@material-ui/core/Paper'
import {Link} from 'react-router-dom'
import Typography from '@material-ui/core/Typography'
import withWidth from '@material-ui/core/withWidth'
import {withStyles} from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import {theme, themeBgStyle, noTxtDeco, gridWrap, gridGutter,
        actnBtnClr, topBarSpacer, extLink} from './Style'
import {setBxpTrigger, unsetBxpTrigger, TopBar, Snack,
        Modal, CoinIcon, ExtLink, Done, Edit, BxpFloatBtn} from './Lib'
import Addr from '../logic/Addr'
import __ from '../util'

class TscView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {edit: false, toggleCoins: false}
    this.addrId = props.match.params.addrId
    this.addrObj = new Addr(this.cx, this.addrId)
    this.tscId = props.match.params.tscId
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
    this.set = this.set.bind(this)
    this.toggleCoins = () => {
      this.setState({toggleCoins: !this.state.toggleCoins})
    }
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'tsc'))
    await this.load()
  }

  componentWillUnmount () {
    unsetBxpTrigger(this)
  }

  async load () {
    let addr, coin0, coin1, tsc, user
    try {
      ;[addr, user] = await Promise.all([
        this.addrObj.load(),
        this.cx.user.load()
      ])
      ;[tsc, {coin0, coin1}] = await Promise.all([
        this.addrObj.getTsc(this.tscId, addr),
        this.cx.user.getCoins(this.state.coin, user)
      ])
    } catch (e) {
      return this.errGo(`Loading transaction failed: ${e.message}`, e, '/depot')
    }
    this.addr = addr
    this.user = user
    setBxpTrigger(this)
    const blc = this.cx.depot.getTscBlc([tsc], this.addr)
    const tagsJoin = tsc.tags.join(' ')
    this.setState({
      upd: false,
      tsc,
      addr,
      coin0,
      coin1,
      name: tsc.name,
      desc: tsc.desc,
      tagsJoin,
      blc1: `${blc.get(coin0)}`,
      blc2: `${blc.get(coin1)}`,
      snack: this.getSnack(),
      bxpSts: this.cx.depot.getBxpSts()
    })
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name, {max: __.cfg('maxName')}),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')}),
        tagsEmsg: __.vldAlphNum(this.state.tagsJoin, {max: __.cfg('maxHigh')})
      }
      if (!d.nameEmsg && !d.descEmsg && !d.tagsEmsg) d.upd = true
      this.setState(d)
    })
  }

  async save () {
    if (this.state.upd === false) return this.setState({edit: false})
    this.setState({edit: false, busy: true})
    const tsc = this.state.tsc
    try {
      const updTsc = {
        hsh: tsc.hsh,
        name: this.state.name,
        desc: this.state.desc,
        tags: __.toTags(this.state.tagsJoin).split(' ')
      }
      this.addr = await this.addrObj.save({tscs: [updTsc]})
      this.setSnack('Transaction updated')
      this.setState({
        tsc: await this.addrObj.getTsc(this.tscId, this.addr),
        snack: this.getSnack(),
        edit: false,
        upd: false,
        busy: false
      })
    } catch (e) {
      this.err(`Updating transaction failed: ${e.message}`, e)
    } finally {
      this.setState({busy: false, upd: false, edit: false})
    }
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack}>
          {this.state.err}
        </Modal>
      )
    } else if (this.state.tsc) {
      let modeColor = this.state.tsc.mode === 'snd'
        ? theme.palette.error['500']
        : theme.palette.secondary['500']
      let modeSign = this.state.tsc.mode === 'snd' ? '-' : '+'
      const tscUrl = __.toBxpUrl(
        'tsc',
        this.state.addr.coin,
        this.state.tsc.hsh,
        this.state.addr.bxp
      )
      return (
        <div className={this.props.classes.topBarSpacer}>
          <div className={this.props.classes.themeBgStyle}>
            {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
            {this.state.edit &&
            <TopBar
              midTitle='Transaction'
              action={<Done />}
              onClick={async () => { if (this.state.upd) await this.save() }}
              onClickLeft={() => this.setState({edit: false})}
              modeCancel
              noUser
            />}
            {!this.state.edit &&
            <TopBar
              midTitle='Transaction'
              iconLeft={<ArrowBack />}
              onClickLeft={this.goBack}
              action={<Edit />}
              onClick={() => this.setState({edit: !this.state.edit})}
              noUser
            />}
          </div>
          {this.state.busy &&
          <LinearProgress />}
          <Paper square className={this.props.classes.spacer}>
            <Typography
              variant='headline'
              align='center'
              style={{color: modeColor}}>
              {modeSign}
              {__.formatNumber(this.state.tsc.amnt, this.state.addr.coin,
                             this.user.locale)}
              &nbsp;
              <CoinIcon coin={this.state.addr.coin} alt color={modeColor} />
            </Typography>
            {!this.state.toggleCoins &&
            <Typography
              variant='body2'
              align='center'
              className={this.props.classes.body2}
              onClick={this.toggleCoins}
              gutterBottom>
              {modeSign}
              {__.formatNumber(this.state.blc1, this.state.coin0,
                             this.user.locale)}
              &nbsp;
              <CoinIcon
                coin={this.state.coin0}
                color={theme.palette.text.secondary}
                size={12}
                alt />
            </Typography>}
            {this.state.toggleCoins &&
            <Typography
              variant='body2'
              align='center'
              className={this.props.classes.body2}
              onClick={this.toggleCoins}
              gutterBottom>
              {modeSign}
              {__.formatNumber(this.state.blc2, this.state.coin1,
                             this.user.locale)}
              <CoinIcon
                coin={this.state.coin1}
                color={theme.palette.text.secondary}
                size={12}
                alt />
            </Typography>}
          </Paper>
          <Paper square className={this.props.classes.spacer} elevation={5}>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                      Name
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    {this.state.edit &&
                    <TextField
                      fullWidth
                      placeholder='Name'
                      value={this.state.name}
                      error={Boolean(this.state.nameEmsg)}
                      helperText={this.state.nameEmsg}
                      onChange={evt => this.set('name', evt.target.value)}
                      />}
                    {!this.state.edit &&
                    <Typography variant='body1' noWrap>
                      {this.state.tsc.name}
                    </Typography>}
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                      Notes
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    {this.state.edit &&
                    <TextField
                      placeholder='Description'
                      fullWidth
                      value={this.state.desc}
                      error={Boolean(this.state.descEmsg)}
                      helperText={this.state.descEmsg}
                      onChange={evt => this.set('desc', evt.target.value)}
                    />}
                    {!this.state.edit &&
                    <Typography variant='body1' noWrap>
                      {this.state.tsc.desc}
                    </Typography>}
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                      Tags
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    {this.state.edit &&
                    <TextField
                      placeholder='Tags'
                      fullWidth
                      value={this.state.tagsJoin}
                      error={Boolean(this.state.tagsEmsg)}
                      helperText={this.state.tagsEmsg}
                      onChange={evt => {
                        this.set('tagsJoin', evt.target.value)
                      }}
                    />}
                    {!this.state.edit &&
                    <Typography variant='body1' noWrap>
                      {this.state.tagsJoin}
                    </Typography>}
                  </div>
                </div>
                {this.state.tsc.cfmCnt >= 0 &&
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                      Confirmations
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography variant='body1' noWrap>
                      {this.state.tsc.cfmCnt > 100
                        ? 'More than 100'
                        : this.state.tsc.cfmCnt}
                    </Typography>
                  </div>
                </div>}
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                      Time
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography variant='body1' noWrap>
                      {__.ppTme(this.state.tsc._t)}
                    </Typography>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                    Address
                  </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Link
                      to={`/wallet/${this.state.addr._id}`}
                      className={this.props.classes.noTxtDeco}>
                      <Typography variant='body1' noWrap>
                        <CoinIcon coin={this.state.addr.coin} size={13} />&nbsp;
                        <b>{this.state.addr.name}</b>
                      </Typography>
                    </Link>
                  </div>
                </div>
                {(
                  (this.state.tsc.hd || {}).addrHshs &&
                  this.state.tsc.hd.addrHshs.length > 0
                ) &&
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                      Involved addresses
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    {this.state.tsc.hd.addrHshs.map(hsh => {
                      let addr = this.state.addr
                      let to = __.toBxpUrl('addr', addr.coin, hsh, addr.bxp)
                      return (
                        <span key={__.uuid()}>
                          <ExtLink
                            className={this.props.classes.extLink}
                            to={to}
                            txt={
                              <Typography variant='body1' noWrap>
                                {hsh}
                              </Typography>
                              }
                            />
                        </span>)
                    })}
                  </div>
                </div>}
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography variant='body1' noWrap color='inherit'>
                    Hash
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <ExtLink
                      className={this.props.classes.extLink}
                      to={tscUrl}
                      txt={
                        <Typography variant='body1' noWrap>
                          {this.state.tsc.hsh}
                        </Typography>
                    } />
                  </div>
                </div>
              </div>
            </div>
          </Paper>
          <BxpFloatBtn
            onClick={() => this.cx.depot.bxp([])}
            bxpSts={this.state.bxpSts} />
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default compose(withStyles({
  themeBgStyle,
  noTxtDeco,
  gridWrap,
  gridGutter,
  actnBtnClr,
  topBarSpacer,
  extLink,
  spacer: {
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2
  },
  flexStyle: {
    display: 'flex',
    marginBottom: theme.spacing.unit * 2
  },
  labelStyle: {
    color: theme.palette.text.secondary,
    width: '40%',
    minWidth: theme.spacing.unit * 14,
    textAlign: 'right',
    [theme.breakpoints.down('sm')]: {
      width: theme.spacing.unit * 14
    }
  },
  valueStyle: {
    width: '60%',
    paddingLeft: theme.spacing.unit * 4,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing.unit * 2
    }
  },
  body2: {
    color: theme.palette.text.secondary
  }
}), withWidth())(TscView)
