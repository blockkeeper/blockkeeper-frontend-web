import React from 'react'
import {LinearProgress} from 'material-ui/Progress'
import {withStyles} from 'material-ui/styles'
import withWidth from 'material-ui/utils/withWidth'
import compose from 'recompose/compose'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, SubBar, Jumbo,
        FloatBtn, Snack, Modal, TscListAddresses, PaperGrid,
        DepotEmpty, ToTopBtn, addrLimitReached} from './Lib'
import __ from '../util'
import {themeBgStyle, gridWrap, gridWrapPaper, gridItem, gridSpacer, gridGutter,
        tscitem, addr, amnt, tscIcon, tscAmnt, display1, body2, display3, tab,
        actnBtnClr} from './Style'

const styles = {
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
  actnBtnClr
}

class DepotView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {tabIx: this.cx.tmp.depotTabIx || 0}
    this.load = this.load.bind(this)
    this.tab = this.tab.bind(this)
    this.goAddAddr = this.goAddAddr.bind(this)
  }

  goAddAddr () {
    if (addrLimitReached(this, this.state.addrs)) {
      this.setState({snack: this.getSnack()})
    } else {
      this.props.history.push('/addr/add')
    }
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'depot'))
    await this.load()
  }

  componentWillUnmount () {
    unsetBxpTrigger(this)
  }

  async load () {
    let addrs, user
    try {
      ;[
        addrs,
        user
      ] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.user.load()
      ])
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
      return
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
      addrTscs: addrTscs.sort((x, y) => {
        return new Date(y[1]._t) - new Date(x[1]._t)
      }),
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
          actions={[{lbl: 'Reload', onClick: this.load}]}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.addrs) {
      return (
        <div>
          {this.state.snack &&
          <Snack
            msg={this.state.snack}
            onClose={() => this.setState({snack: null})}
            />}
          <div className={this.props.classes.themeBgStyle}>
            <TopBar
              title
              className={this.props.classes.gridWrap}
            />
            {this.state.blc1 !== 'undefined' &&
              <Jumbo
                title={this.state.blc1}
                subTitle={this.state.blc2}
                coin0={this.state.coin0}
                coin1={this.state.coin1}
                display3ClassName={this.props.classes.display3}
               />
            }
            {this.state.blc1 === 'undefined' &&
              <Jumbo
                coin0={this.state.coin0}
                coin1={this.state.coin1}
                display3ClassName={this.props.classes.display3}
               />
            }
          </div>
          <SubBar
            tabs={['Addresses', 'Transactions']}
            ix={this.state.tabIx}
            onClick={this.tab}
            rootClassName={this.props.classes.tab}
          />
          {this.state.addrs.length < 1 &&
            <DepotEmpty />
          }
          {this.state.tabIx === 0 &&
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
              addrIcon
            />}
          <ToTopBtn
            second={this.state.tabIx === 1 || this.state.addrTscs.length === 0}
            actnBtnClrClassName={this.props.classes.actnBtnClr}
          />
          {this.state.addrs.length > 0 &&
            <BxpFloatBtn
              onClick={() => this.cx.depot.bxp([])}
              bxpSts={this.state.bxpSts}
              first={this.state.tabIx === 1 || this.state.addrTscs.length === 0}
            />}
          {(this.state.tabIx === 0 || this.state.addrTscs.length === 0) &&
          <FloatBtn
            onClick={this.goAddAddr}
            actnBtnClrClassName={this.props.classes.actnBtnClr}
          />}
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default compose(withStyles(styles), withWidth())(DepotView)
