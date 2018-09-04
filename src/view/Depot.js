import React from 'react'
import Button from '@material-ui/core/Button'
import withWidth from '@material-ui/core/withWidth'
import compose from 'recompose/compose'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import LinearProgress from '@material-ui/core/LinearProgress'
import {withStyles} from '@material-ui/core/styles'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, SubBar, Jumbo,
        FloatBtn, Snack, Modal, TscListAddresses, PaperGrid,
        DepotEmpty, ToTopBtn, PortfolioTab} from './Lib'
import {theme, styleGuide, themeBgStyle, gridWrap, gridWrapPaper, gridItem,
        tscitem, addr, amnt, tscIcon, tscAmnt, coinIcon, prtfAmnt, display1, body2, display3, tab,
        actnBtnClr, topBtnClass, depotEmpty, cnctBtn, gridSpacer,
        gridGutter, topBarSpacer, depotHoldings, depotDoughnut, CryptoColors, noTxtDeco} from './Style'
import __ from '../util'

class DepotView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {
      tabIx: this.cx.tmp.depotTabIx || 0,
      activeStep: 0,
      doughnutData: {}
    }
    this.load = this.load.bind(this)
    this.tab = this.tab.bind(this)
    this.goAddAddr = () => this.props.history.push('/wallet/add')
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'depot'))
    try {
      await this.load()
      // style body bg for empty depot view (without connected addresses)
      if (this.state.addrs.length === 0) {
        document.body.style.backgroundColor = 'white'
      } else {
        document.body.style.backgroundColor = styleGuide.backgroundLight
      }
    } catch (e) { /* error already handled */ }
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

    const {coin0, coin1} = await this.cx.user.getCoins(this.state.coin, user)
    setBxpTrigger(this)
    const blc = this.cx.depot.getAddrBlc(addrs)
    const addrTscs = []
    const doughnutData = {}
    const portfolio = {}

    for (let addr of addrs) {
      for (let tsc of addr.tscs) addrTscs.push([addr, tsc])

      if (doughnutData[addr.coin]) {
        doughnutData[addr.coin].amntByCoinRate = doughnutData[addr.coin].amntByCoinRate + (addr.amnt * addr.rates[coin0])
      } else if (addr.amnt > 0) {
        doughnutData[addr.coin] = {
          amntByCoinRate: addr.amnt * addr.rates[coin0],
          label: __.cfg('coins').cryp[addr.coin].name,
          color: CryptoColors[addr.coin]
        }
      }

      // primary coin used for portfolio calculations, use secondary coin if equals
      const pCoin = addr.coin === coin0 ? coin1 : coin0

      if (portfolio[addr.coin]) {
        portfolio[addr.coin].amntCoin = portfolio[addr.coin].amntCoin + addr.amnt
        portfolio[addr.coin].amntByCoinRate = portfolio[addr.coin].amntByCoinRate + (addr.amnt * addr.rates[pCoin])
      } else if (addr.amnt > 0) {
        const pair = `${addr.coin}_${pCoin}`
        portfolio[addr.coin] = {
          amntCoin: addr.amnt,
          amntByCoinRate: addr.amnt * addr.rates[pCoin],
          rate: addr.rates[pCoin],
          pCoin: pCoin,
          label: __.cfg('coins').cryp[addr.coin].name,
          percentChange: ((this.history.hourly[pair][this.history.hourly[pair].length - 1][1] - this.history.hourly[pair][0][1]) / this.history.hourly[pair][0][1]) * 100
        }
        portfolio[addr.coin].color = portfolio[addr.coin].percentChange > 0 ? theme.palette.secondary['500'] : theme.palette.error['500']
      }
    }

    for (let coin in doughnutData) {
      doughnutData[coin].share = doughnutData[coin].amntByCoinRate / blc.get(coin0) * 100
      doughnutData[coin].label = `${doughnutData[coin].label} (${Math.round(doughnutData[coin].share)}%)`
    }

    this.setState({
      addrs,
      coin0,
      coin1,
      doughnutData,
      portfolio,
      addrTscs: addrTscs.sort((x, y) => new Date(y[1]._t) - new Date(x[1]._t)),
      blc1: `${blc.get(coin0)}`,
      blc2: `${blc.get(coin1)}`,
      snack: this.getSnack(),
      bxpSts: this.cx.depot.getBxpSts(),
      addrUpdErrIds: this.cx.depot.addrUpdErrIds
    })
  }

  async tab (evt, tabIx) {
    await this.load()
    this.setState({tabIx})
    this.cx.tmp.depotTabIx = tabIx
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          onClose={this.load}
          actions={[{
            lbl: 'Go to login',
            onClick: () => this.props.history.push('/login')}
          ]}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.addrs) {
      return (
        <div className={this.props.classes.topBarSpacer}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          <div className={this.props.classes.themeBgStyle}>
            <TopBar title />
            {this.state.addrs.length > 0 &&
              <Jumbo
                title={this.state.blc1}
                subTitle={this.state.blc2}
                coin0={this.state.coin0}
                coin1={this.state.coin1}
                display3ClassName={this.props.classes.display3}
                holdingsClassName={this.props.classes.depotHoldings}
                doughnutClassName={this.props.classes.depotDoughnut}
                locale={this.user.locale}
                activeStep={this.state.activeStep}
                handleStepChange={(activeStep) => {
                  this.setState({ activeStep })
                }}
                doughnutData={{
                  labels: Object.keys(this.state.doughnutData).map(key => this.state.doughnutData[key].label).reverse(),
                  datasets: [{
                    label: 'Dataset #1',
                    backgroundColor: Object.keys(this.state.doughnutData).map(key => this.state.doughnutData[key].color).reverse(),
                    borderColor: Object.keys(this.state.doughnutData).map(key => this.state.doughnutData[key].color).reverse(),
                    borderWidth: 0,
                    hoverBackgroundColor: Object.keys(this.state.doughnutData).map(key => this.state.doughnutData[key].color).reverse(),
                    data: Object.keys(this.state.doughnutData).map(key => this.state.doughnutData[key].amntByCoinRate).reverse()
                  }]}}
               />
            }
          </div>
          {this.state.addrs.length === 0 &&
            <div>
              <DepotEmpty className={this.props.classes.depotEmpty} />
              <div style={{
                position: 'absolute',
                bottom: '40px',
                width: '100%',
                textAlign: 'center'
              }}>
                <Button
                  variant='raised'
                  color='primary'
                  className={this.props.classes.cnctBtn}
                  onClick={() => this.props.history.push('/wallet/add')}
                  classes={{
                    raised: this.props.classes.actnBtnClr
                  }}
                  >
                    Connect wallet
                  </Button>
              </div>
            </div>
          }
          {this.state.addrs.length > 0 &&
            <SubBar
              tabs={['Wallets', 'Transactions', 'Portfolio']}
              ix={this.state.tabIx}
              onClick={this.tab}
              rootClassName={this.props.classes.tab}
            />
          }
          {this.state.tabIx === 0 && this.state.addrs.length > 0 &&
            <PaperGrid
              addrs={this.state.addrs}
              addrUpdIds={new Set()}    // TODO
              coin0={this.state.coin0}
              addrUpdErrIds={this.state.addrUpdErrIds}
              className={this.props.classes.gridWrapPaper}
              itemClassName={this.props.classes.gridItem}
              addrClassName={this.props.classes.addr}
              amntClassName={this.props.classes.amnt}
              display1ClassName={this.props.classes.display1}
              body2ClassName={this.props.classes.body2}
              noTxtDecoClassname={this.props.classes.noTxtDeco}
              locale={this.user.locale}
            />}
          {this.state.tabIx === 1 && this.state.addrTscs.length > 0 &&
            <TscListAddresses
              addrTscs={this.state.addrTscs}
              coin0={this.state.coin0}
              className={this.props.classes.gridSpacer}
              gridWrapClassName={this.props.classes.gridWrap}
              gridGutterClassName={this.props.classes.gridGutter}
              itemClassName={this.props.classes.tscitem}
              display1ClassName={this.props.classes.display1}
              body2ClassName={this.props.classes.body2}
              tscAmntClassName={this.props.classes.tscAmnt}
              tscIconClassname={this.props.classes.tscIcon}
              noTxtDecoClassname={this.props.classes.noTxtDeco}
              locale={this.user.locale}
              addrIcon
            />}
          {this.state.tabIx === 1 && this.state.addrTscs.length < 1 &&
            <Paper
              elevation={5}
              square
              className={this.props.classes.paperWrap}
            >
              <Typography align='center' variant='body1'>
                No transactions
              </Typography>
            </Paper>
          }
          {this.state.tabIx === 2 && this.state.portfolio &&
            <PortfolioTab
              portfolio={this.state.portfolio}
              className={this.props.classes.gridSpacer}
              gridWrapClassName={this.props.classes.gridWrap}
              gridGutterClassName={this.props.classes.gridGutter}
              itemClassName={this.props.classes.tscitem}
              display1ClassName={this.props.classes.display1}
              body2ClassName={this.props.classes.body2}
              prtfAmntClassName={this.props.classes.prtfAmnt}
              coinIconClassname={this.props.classes.coinIcon}
              noTxtDecoClassname={this.props.classes.noTxtDeco}
              locale={this.user.locale}
            />
            // <SoonMsg className={this.props.classes.depotEmpty} />
          }
          <ToTopBtn
            className={this.props.classes.topBtnClass}
          />
          {(
            (this.state.tabIx === 0 || this.state.tabIx === 1) &&
            this.state.addrs.length > 0
          ) &&
            <BxpFloatBtn
              onClick={() => {
                if (__.cfg('isDev')) {
                  this.props.history.push('/devSync')
                }
                this.cx.depot.bxp([])
              }}
              bxpSts={this.state.bxpSts}
              second={Boolean(this.state.tabIx === 0)}
            />
          }
          {this.state.tabIx === 0 && this.state.addrs.length > 0 &&
            <FloatBtn
              onClick={this.goAddAddr}
              actnBtnClrClassName={this.props.classes.actnBtnClr}
            />
          }
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default compose(withStyles({
  themeBgStyle,
  gridWrap,
  gridWrapPaper,
  gridItem,
  gridSpacer,
  gridGutter,
  tscitem,
  addr,
  amnt,
  tscIcon,
  tscAmnt,
  coinIcon,
  prtfAmnt,
  display1,
  body2,
  display3,
  depotHoldings,
  depotDoughnut,
  tab,
  actnBtnClr,
  topBtnClass,
  depotEmpty,
  cnctBtn,
  topBarSpacer,
  noTxtDeco,
  paperWrap: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 3,
    paddingBottom: theme.spacing.unit * 3
  }
}), withWidth())(DepotView)
