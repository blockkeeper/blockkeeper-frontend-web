import React from 'react'
import Button from 'material-ui/Button'
import withWidth from 'material-ui/utils/withWidth'
import compose from 'recompose/compose'
import Typography from 'material-ui/Typography'
import Paper from 'material-ui/Paper'
import {LinearProgress} from 'material-ui/Progress'
import {withStyles} from 'material-ui/styles'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, SubBar, Jumbo,
        FloatBtn, Snack, Modal, TscListAddresses, PaperGrid,
        DepotEmpty, ToTopBtn, SoonMsg} from './Lib'
import {theme, styleGuide, themeBgStyle, gridWrap, gridWrapPaper, gridItem,
        tscitem, addr, amnt, tscIcon, tscAmnt, display1, body2, display3, tab,
        actnBtnClr, topBtnClass, depotEmpty, cnctBtn, gridSpacer,
        gridGutter, topBarSpacer} from './Style'
import __ from '../util'

class DepotView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {tabIx: this.cx.tmp.depotTabIx || 0}
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
    let addrs, user
    try {
      ;[addrs, user] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.user.load()
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
    const {coin0, coin1} = await this.cx.user.getCoins(this.state.coin, user)
    setBxpTrigger(this)
    const blc = this.cx.depot.getAddrBlc(addrs)
    const addrTscs = []
    for (let addr of addrs) {
      for (let tsc of addr.tscs) addrTscs.push([addr, tsc])
    }
    this.setState({
      addrs,
      coin0,
      coin1,
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
            {this.state.blc1 !== 'undefined' &&
              <Jumbo
                title={this.state.blc1}
                subTitle={this.state.blc2}
                coin0={this.state.coin0}
                coin1={this.state.coin1}
                display3ClassName={this.props.classes.display3}
                locale={this.user.locale}
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
                  raised
                  color={'accent'}
                  className={this.props.classes.cnctBtn}
                  onClick={() => this.props.history.push('/wallet/add')}
                  classes={{
                    raisedAccent: this.props.classes.actnBtnClr
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
              locale={this.user.locale}
              addrIcon
            />}
          {this.state.tabIx === 1 && this.state.addrTscs.length < 1 &&
            <Paper
              elevation={5}
              square
              className={this.props.classes.paperWrap}
            >
              <Typography align='center' type='body1'>
                No transactions
              </Typography>
            </Paper>
          }
          {this.state.tabIx === 2 &&
            <SoonMsg className={this.props.classes.depotEmpty} />
          }
          <ToTopBtn
            className={this.props.classes.topBtnClass}
          />
          {(
            (this.state.tabIx === 0 || this.state.tabIx === 1) &&
            this.state.addrTscs.length > 0
          ) &&
            <BxpFloatBtn
              onClick={() => this.cx.depot.bxp([])}
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
  display1,
  body2,
  display3,
  tab,
  actnBtnClr,
  topBtnClass,
  depotEmpty,
  cnctBtn,
  topBarSpacer,
  paperWrap: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 3,
    paddingBottom: theme.spacing.unit * 3
  }
}), withWidth())(DepotView)
