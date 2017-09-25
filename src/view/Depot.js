import React from 'react'
import {Link} from 'react-router-dom'
import {Autorenew} from 'material-ui-icons'
import {LinearProgress} from 'material-ui/Progress'
import {themeBgStyle} from './Style'
import {TopBar, SubBar, Jumbo, FloatBtn, Snack, Modal, TscListAddresses, PaperGrid} from './Lib'
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

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
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
    } else if (this.state.addrs && this.state.addrs.length < 1) {
      return (
        <Modal
          onClose={this.load}
          lbl='Welcome'
          noCncl
          actions={[]}
        >
          <Link to={`/user/edit`}>Edit your settings</Link>
          <br />
          <Link to={`/addr/add`}>Add your first address</Link>
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
            midTitle='Blockkeeper'
            iconLeft={<Autorenew />}
            onClickLeft={() => this.cx.depot.updateAddrs()}
          />
          <Jumbo
            title={this.state.blc1}
            subTitle={this.state.blc2}
            coin0={this.state.coin0}
            coin1={this.state.coin1}
           />
          <SubBar
            tabs={['Addresses', 'Transactions']}
            ix={this.state.tabIx}
            onClick={this.tab}
          />
          {this.state.tabIx === 0 &&
            <PaperGrid
              addrs={this.state.addrs}
              coin0={this.state.coin0}
            />}
          {this.state.tabIx === 1 &&
            <TscListAddresses
              addrTscs={this.state.addrTscs}
              coin0={this.state.coin0}
              addrIcon
            />}
          {this.state.tabIx === 0 &&
          <FloatBtn onClick={this.goAddAddr} />}

        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}
