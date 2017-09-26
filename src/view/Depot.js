import React from 'react'
import {Link} from 'react-router-dom'
import Typography from 'material-ui/Typography'
import Table, {TableBody, TableCell, TableRow} from 'material-ui/Table'
import {Autorenew, HourglassFull, Block} from 'material-ui-icons'
import Paper from 'material-ui/Paper'
import {LinearProgress} from 'material-ui/Progress'
import {theme, themeBgStyle} from './Style'
import {TopBar, SubBar, Jumbo, FloatBtn, Snack,
       Modal, TscListAddresses, CoinIcon} from './Lib'
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
              addrUpdIds={this.state.addrUpdIds}
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

const PaperGrid = ({addrs, addrUpdIds, coin0}) => {
  return (
    <Paper square style={{background: theme.palette.background.light, padding: theme.spacing.unit}} elevation={0}>
      {addrs.map(addr => {
        return (
          <Paper style={{margin: theme.spacing.unit * 2, padding: theme.spacing.unit * 2}} key={addr._id}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell compact width={'40px'} style={{maxWidth: 0}}>
                    <CoinIcon coin={addr.coin} size={40} />
                  </TableCell>
                  <TableCell style={{maxWidth: 0}}>
                    {!addrUpdIds.has(addr._id) &&
                      <Link to={`/addr/${addr._id}`} style={{textDecoration: 'none'}}>
                        <Typography type='headline'>
                          {addr.name}
                        </Typography>
                      </Link>}
                    {addrUpdIds.has(addr._id) &&
                      <Typography type='body2'>
                        {addr.name}
                      </Typography>}
                    <Typography type='body2' style={{color: theme.palette.text.secondary}}>
                      {addr.hsh}
                    </Typography>
                  </TableCell>
                  <TableCell compact numeric width={'30%'} style={{maxWidth: 0}}>
                    <Typography type='headline' style={{color: theme.palette.primary['500']}}>
                      {addr.amnt}&nbsp;<CoinIcon coin={addr.coin} color={theme.palette.primary['500']} alt />
                    </Typography>
                    <Typography type='body2' style={{color: theme.palette.text.secondary}}>
                      {addr.amnt * addr.rates[coin0]}&nbsp;<CoinIcon coin={coin0} size={14} color={theme.palette.text.secondary} alt />
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        )
      })}
    </Paper>
  )
}
