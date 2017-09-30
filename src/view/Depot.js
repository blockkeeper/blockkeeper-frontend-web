import React from 'react'
import {LinearProgress} from 'material-ui/Progress'
import {theme, themeBgStyle} from './Style'
import {setBxpTrigger, unsetBxpTrigger, BxpFloatBtn, TopBar, SubBar, Jumbo,
        FloatBtn, Snack, Modal, TscListAddresses, PaperGrid,
        DepotEmpty} from './Lib'
import __ from '../util'

export default class DepotView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {tabIx: this.cx.tmp.depotTabIx || 0}
    this.load = this.load.bind(this)
    this.tab = this.tab.bind(this)
    this.goAddAddr = () => this.props.history.push('/addr/add')
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'depot'))
    await this.load()
  }

  componentWillUnmount () {
    unsetBxpTrigger(this)
  }

  async load () {
    let addrs, coin0, coin1
    try {
      ;[
        addrs,
        {coin0, coin1}
      ] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.user.getCoins(this.state.coin)
      ])
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
      return
    }
    setBxpTrigger(this)
    const blc = this.cx.depot.getAddrBlc(addrs)
    const addrTscs = []
    for (let addr of addrs) {
      for (let tsc of addr.tscs) addrTscs.push([addr, tsc])
    }
    this.setState({
      addrs,
      addrTscs,
      coin0,
      coin1,
      blc1: `${blc.get(coin0)}`,
      blc2: `${blc.get(coin1)}`,
      snack: this.getSnack(),
      bxpSts: this.cx.depot.getBxpSts()
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
        <div style={themeBgStyle}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          <TopBar
            title='BK'
          />
          {this.state.blc1 !== 'undefined' &&
            <Jumbo
              title={this.state.blc1}
              subTitle={this.state.blc2}
              coin0={this.state.coin0}
              coin1={this.state.coin1}
             />
          }
          {this.state.blc1 === 'undefined' &&
            <Jumbo
              coin0={this.state.coin0}
              coin1={this.state.coin1}
             />
          }

          <SubBar
            tabs={['Addresses', 'Transactions']}
            ix={this.state.tabIx}
            onClick={this.tab}
          />
          {this.state.addrs.length < 1 &&
            <DepotEmpty />
          }
          {this.state.tabIx === 0 &&
            <PaperGrid
              addrs={this.state.addrs}
              addrUpdIds={new Set()}    // TODO
              coin0={this.state.coin0}
            />}
          {this.state.tabIx === 1 && this.state.addrTscs.length > 0 &&
            <TscListAddresses
              addrTscs={this.state.addrTscs}
              coin0={this.state.coin0}
              addrIcon
            />}
          {this.state.addrs.length > 0 &&
            <BxpFloatBtn
              onClick={() => this.cx.depot.bxp([])}
              bxpSts={this.state.bxpSts}
              style={{bottom: (this.state.tabIx === 0 || this.state.addrTscs.length === 0) ? theme.spacing.unit * 10 : theme.spacing.unit * 2}}
            />}
          {(this.state.tabIx === 0 || this.state.addrTscs.length === 0) &&
          <FloatBtn onClick={this.goAddAddr} />}
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}
