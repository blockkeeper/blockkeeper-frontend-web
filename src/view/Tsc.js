import React from 'react'
import {LinearProgress} from 'material-ui/Progress'
import {ArrowBack, Clear, Launch} from 'material-ui-icons'
import Paper from 'material-ui/Paper'
import Grid from 'material-ui/Grid'
import {Link} from 'react-router-dom'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import {theme, themeBgStyle, paperStyle, overflowStyle, noTxtDeco} from './Style'
import {setBxpTrigger, unsetBxpTrigger, TopBar, Snack,
        Modal, CoinIcon, ExtLink, formatNumber, Save, Edit} from './Lib'
import Addr from '../logic/Addr'
import __ from '../util'

const styles = {
  themeBgStyle,
  paperStyle,
  overflowStyle,
  noTxtDeco,
  flexStyle: {
    display: 'flex',
    marginBottom: theme.spacing.unit * 2
  },
  labelStyle: {
    color: theme.palette.text.secondary,
    width: theme.spacing.unit * 14,
    minWidth: theme.spacing.unit * 14,
    paddingRight: theme.spacing.unit * 4,
    textAlign: 'right'
  },
  valueStyle: {
    flexGrow: 1,
    minWidth: 0
  },
  extBtn: {
    width: '100%',
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit
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
              iconLeft={<Clear />}
              onClickLeft={this.edit}
              icon={<Save />}
              onClick={this.save}
              noUser
            />}
          {!this.state.edit &&
            <TopBar
              midTitle='Transaction'
              iconLeft={<ArrowBack />}
              onClickLeft={this.goBack}
              icon={<Edit />}
              onClick={this.edit}
              noUser
            />}
          {this.state.busy &&
          <LinearProgress />}
          <Paper square className={this.props.classes.paperStyle}>
            <Typography
              type='headline'
              align='center'
              style={{color: modeColor}}
            >
              {modeSign} {formatNumber(this.state.tsc.amnt, this.state.addr.coin)}
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
              {modeSign} {formatNumber(this.state.blc1, this.state.coin0)}
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
          <Paper square className={this.props.classes.paperStyle} elevation={5}>
            <Grid container justify='center'>
              <Grid item xs={12} sm={10} md={8} lg={6}>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
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
                      <Typography type='body1' className={this.props.classes.overflowStyle}>
                        {this.state.tsc.name}
                      </Typography>}
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                      Amount Exact
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle}>
                      {this.state.tsc.amntDesc[0][this.state.tsc.mode]}
                      <CoinIcon
                        coin={this.state.addr.coin}
                        size={12}
                        color='primary'
                        alt
                      />
                    </Typography>
                  </div>
                </div>
                {this.state.tsc.amntDesc.length > 1 &&
                  <div className={this.props.classes.flexStyle}>
                    <div className={this.props.classes.labelStyle}>
                      <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                        Amount Details
                      </Typography>
                    </div>
                    <div className={this.props.classes.valueStyle}>
                      <Typography type='body1' className={this.props.classes.overflowStyle}>
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
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                      Fees
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle}>
                      0.2345
                      <CoinIcon
                        coin={this.state.addr.coin}
                        size={12}
                        color='primary'
                        alt
                      />
                      {/* TODO */}
                    </Typography>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                      Confirmations
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle}>
                      {this.state.tsc.cfmCnt > 100
                        ? 'More than 100'
                        : this.state.tsc.cfmCnt}
                    </Typography>
                  </div>
                </div>
                {this.state.tsc.feeDesc &&
                  <div className={this.props.classes.flexStyle}>
                    <div className={this.props.classes.labelStyle}>
                      <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                        Additional costs (fee)
                      </Typography>
                    </div>
                    <div className={this.props.classes.valueStyle}>
                      <Typography type='body1' className={this.props.classes.overflowStyle}>
                        {this.state.tsc.feeDesc}
                      </Typography>
                    </div>
                  </div>}
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                      Time
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle}>
                      2017-10-01 12:22:27 {/* TODO */}
                    </Typography>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                      Block
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle}>
                        487806 {/* TODO */}
                    </Typography>
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
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
                    <Typography type='body1' className={this.props.classes.overflowStyle}>
                      {this.state.tagsJoin}
                    </Typography>}
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                      Notes
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    {this.state.edit &&
                      <TextField
                        placeholder='Notes'
                        fullWidth
                        value={this.state.desc}
                        error={Boolean(this.state.descEmsg)}
                        helperText={this.state.descEmsg}
                        onChange={evt => this.set('desc', evt.target.value)}
                      />}
                    {!this.state.edit &&
                      <Typography type='body1' className={this.props.classes.overflowStyle}>
                        {this.state.tsc.desc}
                      </Typography>}
                  </div>
                </div>
                <div className={this.props.classes.flexStyle}>
                  <div className={this.props.classes.labelStyle}>
                    <Typography type='body1' className={this.props.classes.overflowStyle} color='inherit'>
                      Address
                    </Typography>
                  </div>
                  <div className={this.props.classes.valueStyle}>
                    <Link
                      to={`/addr/${this.state.addr._id}`}
                      className={this.props.classes.noTxtDeco}
                    >
                      <Typography type='body1' className={this.props.classes.overflowStyle}>
                        <CoinIcon coin={this.state.addr.coin} size={13} />&nbsp;
                        <b>{this.state.addr.name}</b>
                      </Typography>
                    </Link>
                  </div>
                </div>

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

export default withStyles(styles)(TscView)
