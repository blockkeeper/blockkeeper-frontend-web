import React from 'react'
import Hidden from '@material-ui/core/Hidden'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import AppBar from '@material-ui/core/AppBar'
import Typography from '@material-ui/core/Typography'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import {withStyles} from '@material-ui/core/styles'
import Divider from '@material-ui/core/Divider'
import {theme, gridWrap,
        gridGutter, tscitem, topBarSpacer, areaWrap} from './Style'
import {ArrowBack} from '@material-ui/icons'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, Snack, Modal,
        CoinIcon, AreaTooltip} from './Lib'
import __ from '../util'

class HistoryView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.coin = props.match.params.coin
    this.state = {
      holdAmnt: 0,
      change1h: 0,
      change1d: 0,
      change1w: 0,
      change1m: 0,
      change1y: 0,
      holdRate: 0,
      price: 0
    }
    this.load = this.load.bind(this)
    this.goBack = props.history.goBack
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'history'))
    await this.load()
  }

  componentWillUnmount () {
    unsetBxpTrigger(this)
  }

  async load () {
    let addrs, user, history
    try {
      [addrs, user, history] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.user.load(),
        this.cx.history.getHistory()
      ])
    } catch (e) {
      if (__.cfg('isDev')) throw e
      let emsg = e.message
      if ((e.sts || 0) >= 900) {
        __.clearSto()
        emsg = `A fatal error occured: ${emsg}. ` +
               'Environment cleared: Please login again'
      }
      this.setState({err: emsg})
      throw e
    }

    this.user = user
    this.history = history
    this.addrs = addrs

    setBxpTrigger(this)

    const pCoin = this.coin === user.coins[0] ? user.coins[1] : user.coins[0]
    const pair = `${this.coin}_${pCoin}`
    let holdAmnt = 0
    let holdRate = 0
    let price = 0

    for (let addr of addrs) {
      if (addr.coin === this.coin) {
        holdAmnt = holdAmnt + addr.amnt
        holdRate = holdRate + (addr.amnt * addr.rates[pCoin])
        price = addr.rates[pCoin]
      }
    }

    this.setState({
      tabIx: 3,
      pCoin,
      pair,
      holdAmnt,
      holdRate,
      price,
      change1h: ((history.hourly[pair][history.hourly[pair].length - 1][1] - history.hourly[pair][history.hourly[pair].length - 2][1]) / history.hourly[pair][history.hourly[pair].length - 2][1]) * 100,
      change1d: ((history.weekly[pair][history.weekly[pair].length - 1][1] - history.weekly[pair][history.weekly[pair].length - 2][1]) / history.weekly[pair][history.weekly[pair].length - 2][1]) * 100,
      change1w: ((history.weekly[pair][history.weekly[pair].length - 1][1] - history.weekly[pair][0][1]) / history.weekly[pair][0][1]) * 100,
      change1m: ((history.monthly[pair][history.monthly[pair].length - 1][1] - history.monthly[pair][0][1]) / history.monthly[pair][0][1]) * 100,
      change1y: ((history.yearly[pair][history.yearly[pair].length - 1][1] - history.yearly[pair][0][1]) / history.yearly[pair][0][1]) * 100,
      bxpSts: this.cx.depot.getBxpSts()
    })
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack}>
          {this.state.err}
        </Modal>
      )
    } else if (this.user && this.history) {
      return (
        <div className={this.props.classes.topBarSpacer}>
          {this.state.snack &&
          <Snack
            msg={this.state.snack}
            onClose={() => this.setState({snack: null})}
          />}
          <div className={this.props.classes.themeBgStyle}>
            <TopBar
              midTitle={__.cfg('coins').cryp[this.coin].name}
              iconLeft={<ArrowBack />}
              onClickLeft={this.goBack}
              noUser
            />
          </div>
          <div className={this.props.classes.areaWrap}>
            {this.state.tabIx === 0 &&
            <AreaTooltip
              data={this.history['hourly'][this.state.pair].slice(24, 49)}
              pCoin={this.state.pCoin}
              hour
            />}
            {this.state.tabIx === 1 &&
            <AreaTooltip
              data={this.history['hourly'][this.state.pair].slice(0, 25)}
              pCoin={this.state.pCoin}
              hour
            />}
            {this.state.tabIx === 2 &&
            <AreaTooltip
              data={this.history['weekly'][this.state.pair]}
              pCoin={this.state.pCoin}
            />}
            {this.state.tabIx === 3 &&
            <AreaTooltip
              data={this.history['monthly'][this.state.pair]}
              pCoin={this.state.pCoin}
            />}
            {this.state.tabIx === 4 &&
            <AreaTooltip
              data={this.history['quaterly'][this.state.pair]}
              pCoin={this.state.pCoin}
            />}
            {this.state.tabIx === 5 &&
            <AreaTooltip
              data={this.history['halfyearly'][this.state.pair]}
              pCoin={this.state.pCoin}
            />}
            {this.state.tabIx === 6 &&
            <AreaTooltip
              data={this.history['yearly'][this.state.pair]}
              pCoin={this.state.pCoin}
            />}
            {this.state.tabIx === 7 &&
            <AreaTooltip
              data={this.history['all'][this.state.pair]}
              pCoin={this.state.pCoin}
            />}
          </div>
          <Paper square elevation={0}>
            <Paper elevation={4}>
              <div
                style={{
                  flexGrow: 1,
                  width: '100%',
                  background: 'white'
                }}
                className={this.props.classes.gridWrap}
              >
                <AppBar position='static' color='inherit' elevation={0}>
                  <Tabs
                    value={this.state.tabIx}
                    onChange={(e, v) => {
                      this.setState({ tabIx: v })
                    }}
                    indicatorColor='primary'
                    textColor='primary'
                    scrollable
                    scrollButtons='on'
                  >
                    <Tab label='Today' />
                    <Tab label='Yesterday' />
                    <Tab label='1W' />
                    <Tab label='1M' />
                    <Tab label='3M' />
                    <Tab label='6M' />
                    <Tab label='1Y' />
                    <Tab label='All' />
                  </Tabs>
                </AppBar>
              </div>
            </Paper>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      My Holdings
                    </Typography>
                  </div>
                  <div>
                    <Typography variant='h5'>
                      {__.formatNumber(this.state.holdRate, this.state.pCoin, this.user.locale)}&nbsp;
                      <Hidden xsDown>
                        <CoinIcon
                          coin={this.state.pCoin}
                          color={theme.palette.text.primary}
                          alt
                        />
                      </Hidden>
                      <Hidden smUp>
                        <CoinIcon
                          coin={this.state.pCoin}
                          color={theme.palette.text.primary}
                          size={12}
                          alt
                        />
                      </Hidden>
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      Amount
                    </Typography>
                  </div>
                  <div>
                    <Typography variant='h5'>
                      {__.formatNumber(this.state.holdAmnt, this.coin, this.user.locale)}
                      <Hidden xsDown>
                        <CoinIcon
                          coin={this.coin}
                          color={theme.palette.text.primary}
                          alt
                        />
                      </Hidden>
                      <Hidden smUp>
                        <CoinIcon
                          coin={this.coin}
                          color={theme.palette.text.primary}
                          size={12}
                          alt
                        />
                      </Hidden>
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      Price
                    </Typography>
                  </div>
                  <div>
                    <Typography variant='h5'>
                      {__.formatNumber(this.state.price, this.state.pCoin, this.user.locale)}&nbsp;
                      <Hidden xsDown>
                        <CoinIcon
                          coin={this.state.pCoin}
                          color={theme.palette.text.primary}
                          alt
                        />
                      </Hidden>
                      <Hidden smUp>
                        <CoinIcon
                          coin={this.state.pCoin}
                          color={theme.palette.text.primary}
                          size={12}
                          alt
                        />
                      </Hidden>
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      Change 1 hour
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      variant='h5'
                      style={{
                        color: this.state.change1h > 0 ? theme.palette.secondary['500'] : theme.palette.error['500']
                      }}
                    >
                      {this.state.change1h.toFixed(2)}&nbsp;%
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      Change 1 day
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      variant='h5'
                      style={{
                        color: this.state.change1d > 0 ? theme.palette.secondary['500'] : theme.palette.error['500']
                      }}
                    >
                      {this.state.change1d.toFixed(2)}&nbsp;%
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      Change 1 week
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      variant='h5'
                      style={{
                        color: this.state.change1w > 0 ? theme.palette.secondary['500'] : theme.palette.error['500']
                      }}
                    >
                      {this.state.change1w.toFixed(2)}&nbsp;%
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      Change 1 month
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      variant='h5'
                      style={{
                        color: this.state.change1m > 0 ? theme.palette.secondary['500'] : theme.palette.error['500']
                      }}
                    >
                      {this.state.change1m.toFixed(2)}&nbsp;%
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <div className={this.props.classes.tscitem}>
                  <div style={{flexGrow: 1, minWidth: 0}}>
                    <Typography variant='h5' noWrap>
                      Change 1 year
                    </Typography>
                  </div>
                  <div>
                    <Typography
                      variant='h5'
                      style={{
                        color: this.state.change1y > 0 ? theme.palette.secondary['500'] : theme.palette.error['500']
                      }}
                    >
                      {this.state.change1y.toFixed(2)}&nbsp;%
                    </Typography>
                  </div>
                </div>
                <Hidden mdDown>
                  <Divider />
                </Hidden>
              </div>
            </div>
            <Hidden lgUp>
              <Divider />
            </Hidden>
          </Paper>
          <BxpFloatBtn
            onClick={() => this.cx.depot.hstry([])}
            bxpSts={this.state.bxpSts}
          />
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default withStyles({
  topBarSpacer,
  areaWrap,
  gridWrap,
  gridGutter,
  tscitem
})(HistoryView)
