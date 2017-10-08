import React from 'react'
import compose from 'recompose/compose'
import {LinearProgress} from 'material-ui/Progress'
import {ArrowBack, Launch} from 'material-ui-icons'
import Paper from 'material-ui/Paper'
import {Link} from 'react-router-dom'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import withWidth from 'material-ui/utils/withWidth'
import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import {theme, themeBgStyle, noTxtDeco, gridWrap, gridGutter, actnBtnClr} from './Style'
import {setBxpTrigger, unsetBxpTrigger, TopBar, Snack,
        Modal, CoinIcon, ExtLink, formatNumber, Done,
        Edit, BxpFloatBtn} from './Lib'
import Addr from '../logic/Addr'
import __ from '../util'

const styles = {
  themeBgStyle,
  noTxtDeco,
  gridWrap,
  gridGutter,
  actnBtnClr,
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
    paddingRight: theme.spacing.unit * 4,
    textAlign: 'right',
    [theme.breakpoints.down('sm')]: {
      width: theme.spacing.unit * 14
    }
  },
  valueStyle: {
    flexGrow: 1,
    minWidth: 0
  },
  extBtn: {
    width: '50%',
    margin: theme.spacing.unit * 3
  },
  body2: {
    color: theme.palette.text.secondary
  }
}

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
    this.edit = this.edit.bind(this)
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
    let addr, coin0, coin1, tsc
    try {
      ;[
        addr,
        {coin0, coin1}
      ] = await Promise.all([
        this.addrObj.load(),
        this.cx.user.getCoins(this.state.coin)
      ])
      this.addr = addr
      tsc = await this.addrObj.getTsc(this.tscId, this.addr)
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
    }
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

  edit () {
    this.setState({edit: !this.state.edit})
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')}),
        tagsEmsg: __.vldAlphNum(this.state.tagsJoin, {max: __.cfg('maxHigh')})
      }
      if (!d.nameEmsg && !d.descEmsg && !d.tagsEmsg) d.upd = true
      this.setState(d)
    })
  }

  getTags () {
    if (this.state.tsc.tags) {
      return this.state.tsc.tags.trim().split(' ').map(
        tag => '#' + tag).join(' ')
    }
  }

  async save () {
    if (this.state.upd === false) {
      this.setState({edit: false})
      return
    }
    this.setState({busy: true})
    const tsc = this.state.tsc
    try {
      const updTsc = {
        hsh: tsc.hsh,
        name: this.state.name,
        desc: this.state.desc,
        tags: this.state.tagsJoin.trim().split(' ')
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
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message, busy: false})
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
      const tscUrl = __.cfg('toBxpUrl')(
        'tsc', this.state.addr.coin)(this.state.tsc.hsh)
      return (
        <div className={this.props.classes.themeBgStyle}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          {this.state.edit &&
            <TopBar
              midTitle='Transaction'
              icon={<Done />}
              onClick={this.save}
              className={this.props.classes.gridWrap}
              noUser
            />}
          {!this.state.edit &&
            <TopBar
              midTitle='Transaction'
              iconLeft={<ArrowBack />}
              onClickLeft={this.goBack}
              icon={<Edit />}
              onClick={this.edit}
              className={this.props.classes.gridWrap}
              noUser
            />}
          {this.state.busy &&
          <LinearProgress />}
          <Paper square className={this.props.classes.spacer}>
            <Typography
              type='headline'
              align='center'
              style={{color: modeColor}}
            >
              {modeSign} {formatNumber(this.state.tsc.amnt, this.state.addr.coin)}&nbsp;
              <CoinIcon coin={this.state.addr.coin} alt color={modeColor} />
            </Typography>
            {!this.state.toggleCoins &&
            <Typography
              type='body2'
              align='center'
              className={this.props.classes.body2}
              onClick={this.toggleCoins}
              gutterBottom
            >
              {modeSign} {formatNumber(this.state.blc1, this.state.coin0)}&nbsp;
              <CoinIcon
                coin={this.state.coin0}
                color={theme.palette.text.secondary}
                size={12}
                alt
              />
            </Typography>}
            {this.state.toggleCoins &&
            <Typography
              type='body2'
              align='center'
              className={this.props.classes.body2}
              onClick={this.toggleCoins}
              gutterBottom
            >
              {modeSign} {formatNumber(this.state.blc2, this.state.coin1)}
              <CoinIcon
                coin={this.state.coin1}
                color={theme.palette.text.secondary}
                size={12}
                alt
              />
            </Typography>}
          </Paper>
          <Paper square className={this.props.classes.spacer} elevation={5}>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
                      Address
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Link
                      to={`/addr/${this.state.addr._id}`}
                      className={this.props.classes.noTxtDeco}
                    >
                      <Typography type='body1' noWrap>
                        <CoinIcon coin={this.state.addr.coin} size={13} />&nbsp;
                        <b>{this.state.addr.name}</b>
                      </Typography>
                    </Link>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
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
                      <Typography type='body1' noWrap>
                        {this.state.tsc.name}
                      </Typography>}
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
                      Amount Exact
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' noWrap>
                      {this.state.tsc.amntDesc[0][this.state.tsc.mode]} {this.state.addr.coin}
                    </Typography>
                  </div>
                </div>
                {this.state.tsc.amntDesc.length > 1 &&
                  <div className={this.props.classes.flexStyle}>
                    <div className={this.props.classes.labelStyle}>
                      <Typography type='body1' noWrap color='inherit'>
                        Amount Details
                      </Typography>
                    </div>
                    <div className={this.props.classes.valueStyle}>
                      <Typography type='body1' noWrap>
                        {this.state.tsc.amntDesc[1]['snd']}
                        <CoinIcon
                          coin={this.state.addr.coin}
                          size={12}
                          color='primary'
                          alt
                        />&nbsp;
                        send
                        <br />
                        {this.state.tsc.amntDesc[1]['rcv']}
                        <CoinIcon
                          coin={this.state.addr.coin}
                          size={12}
                          color='primary'
                          alt
                        />&nbsp;
                        received
                      </Typography>
                    </div>
                  </div>}
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
                      Fees
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' noWrap>
                      0.2345 {this.state.addr.coin} {/* TODO */}
                    </Typography>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
                      Confirmations
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' noWrap>
                      {this.state.tsc.cfmCnt > 100
                        ? 'More than 100'
                        : this.state.tsc.cfmCnt}
                    </Typography>
                  </div>
                </div>
                {this.state.tsc.feeDesc &&
                  <div className={this.props.classes.flexStyle}>
                    <div className={this.props.classes.labelStyle}>
                      <Typography type='body1' noWrap color='inherit'>
                        Additional costs (fee)
                      </Typography>
                    </div>
                    <div className={this.props.classes.valueStyle}>
                      <Typography type='body1' noWrap>
                        {this.state.tsc.feeDesc}
                      </Typography>
                    </div>
                  </div>}
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
                      Time
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' noWrap>
                      2017-10-01 12:22:27 {/* TODO */}
                    </Typography>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
                      Block
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' noWrap>
                        487806 {/* TODO */}
                    </Typography>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
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
                    <Typography type='body1' noWrap>
                      {this.state.tagsJoin}
                    </Typography>}
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' noWrap color='inherit'>
                      Description
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
                      <Typography type='body1' noWrap>
                        {this.state.tsc.desc}
                      </Typography>}
                  </div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <ExtLink
                    to={tscUrl}
                    className={this.props.classes.noTxtDeco}
                    txt={
                      <Button
                        raised
                        color={'contrast'}
                        className={this.props.classes.extBtn}
                      >
                        Detailed transaction
                        <Launch />
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          </Paper>
          <BxpFloatBtn
            onClick={() => this.cx.depot.bxp([])}
            bxpSts={this.state.bxpSts}
            actnBtnClrClassName={this.props.classes.actnBtnClr}
            first
          />
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default compose(withStyles(styles), withWidth())(TscView)
