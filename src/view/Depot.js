import React from 'react'
import {Autorenew, HourglassFull, Block} from 'material-ui-icons'
import {LinearProgress} from 'material-ui/Progress'
import {themeBgStyle} from './Style'
import {TopBar, SubBar, Jumbo, FloatBtn, Snack,
       Modal, TscListAddresses, PaperGrid, DepotEmpty} from './Lib'
import __ from '../util'

export default class DepotView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    if (!this.cx.tmp.addrUpdIds) this.cx.tmp.addrUpdIds = new Set()
    if (!this.cx.tmp.nxAddrUpdCnt) this.cx.tmp.nxAddrUpdCnt = 0
    this.state = {
      tabIx: this.cx.tmp.depotTabIx || 0,
      addrUpdIds: this.cx.tmp.addrUpdIds,
      upd: (this.cx.tmp.addrUpdIds.size > 0),
      nxUpdCnt: this.cx.tmp.nxAddrUpdCnt
    }
    this.load = this.load.bind(this)
    this.tab = this.tab.bind(this)
    this.updateAddrs = this.updateAddrs.bind(this)
    this.goAddAddr = () => this.props.history.push('/addr/add')
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'depot'))
    await this.load()
  }

  async load () {
    try {
      const [
        addrs,
        {coin0, coin1}
      ] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.user.getCoins(this.state.coin)
      ])
      const blc = this.cx.depot.getAddrBlc(addrs)
      const addrTscs = []
      for (let addr of addrs) {
        for (let tsc of addr.tscs) addrTscs.push([addr, tsc])
      }
      this.setState({
        err: null,
        addrs,
        addrTscs,
        coin0,
        coin1,
        blc1: `${blc.get(coin0)}`,
        blc2: `${blc.get(coin1)}`,
        snack: __.getSnack()
      })
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
    }
  }

  async tab (evt, tabIx) {
    await this.load()
    this.setState({tabIx})
    this.cx.tmp.depotTabIx = tabIx
  }

  async updateAddrs () {
    if (this.state.upd || this.state.nxUpdCnt !== 0) return
    this.info('Addr updates started')
    this.setState({upd: true})
    const {addrChunksByCoin, addrsById} = await this.cx.depot.getAddrChunks()
    for (let [coin, addrChunks] of addrChunksByCoin) {
      for (let addrChunk of addrChunks) {
        this.cx.tmp.addrUpdIds.clear()
        for (let addr of addrChunk) this.cx.tmp.addrUpdIds.add(addr._id)
        this.setState({addrUpdIds: this.cx.tmp.addrUpdIds})
        await this.cx.depot.updateAddrs(coin, addrChunk, addrsById)
      }
    }
    this.cx.tmp.addrUpdIds.clear()
    this.info('Addr updates finished')
    this.setState({
      addrUpdIds: this.cx.tmp.addrUpdIds,
      upd: false,
      nxUpdCnt: __.cfg('nxAddrUpdCnt')
    })
    this.cx.tmp.nxAddrUpdCnt = __.cfg('nxAddrUpdCnt')
    while (this.cx.tmp.nxAddrUpdCnt > 0) {
      await __.sleep(__.cfg('nxAddrUpdMsec'))
      this.cx.tmp.nxAddrUpdCnt -= 1
      this.setState({nxUpdCnt: this.cx.tmp.nxAddrUpdCnt})
    }
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
          {this.state.upd &&
            <TopBar
              midTitle='Blockkeeper'
              iconLeft={<HourglassFull />}  // TODO: use rotating icon
              onClickLeft={() => {}}        // TODO: disable button
            />}
          {(!this.state.upd && this.state.nxUpdCnt > 0) &&
            <TopBar
              midTitle={
                `${this.state.nxUpdCnt * __.cfg('nxAddrUpdMsec') / 1000}s ` +
                'until next update'
              }
              iconLeft={<Block />}      // TODO: use useful icon
              onClickLeft={() => {}}    // TODO: disable button
            />}
          {(!this.state.upd && this.state.nxUpdCnt <= 0) &&
            <TopBar
              midTitle='Blockkeeper'
              iconLeft={<Autorenew />}
              onClickLeft={() => this.updateAddrs()}
            />}
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
              addrUpdIds={this.state.addrUpdIds}
              coin0={this.state.coin0}
            />}
          {this.state.tabIx === 1 && this.state.addrTscs.length > 0 &&
            <TscListAddresses
              addrTscs={this.state.addrTscs}
              coin0={this.state.coin0}
              addrIcon
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
