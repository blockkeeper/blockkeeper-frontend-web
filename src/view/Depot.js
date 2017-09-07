import React from 'react'
import {Link} from 'react-router-dom'
import Table, {TableBody, TableCell, TableRow} from 'material-ui/Table'
import Button from 'material-ui/Button'
import {LinearProgress} from 'material-ui/Progress'
import {TopBar, SubBar, Jumbo, Modal} from './Lib'
// import __ from '../util'

export default class DepotView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {tabIx: this.cx.tmp.depotTabIx || 0}
    this.load = this.load.bind(this)
    this.onTab = this.onTab.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this, 'depot'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      const user = await this.cx.user.load() // initializes the depot
      const {addrs, tscs} = await this.cx.depot.loadAddrs()
      const blc = this.cx.depot.getBlc(addrs)
      const {coin0, coin1} = await this.cx.user.getCoins(this.state.coin, user)
      this.setState({
        err: null,
        addrs: addrs,
        tscs: tscs,
        coin0,
        coin1,
        blc1: `${coin0} ${blc.get(coin0)}`,
        blc2: `${coin1} ${blc.get(coin1)}`
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async onTab (evt, tabIx) {
    await this.load()
    this.setState({tabIx})
    this.cx.tmp.depotTabIx = tabIx
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          open
          onClose={this.load}
          actions={<Button onClick={this.load}>Reload</Button>}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.addrs && this.state.tscs) {
      return (
        <div>
          <TopBar
            title='Blockkeeper'
          />
          <Jumbo
            title={this.state.blc1}
            subTitle1={this.state.blc2}
           />
          <SubBar
            tabs={['Addresses', 'Transactions']}
            ix={this.state.tabIx}
            onClick={this.onTab}
          />
          {this.state.tabIx === 0 &&
            <List
              ilk='addr'
              rows={this.state.addrs}
              coin0={this.state.coin0}
            />}
          {this.state.tabIx === 1 &&
            <List
              ilk='tsc'
              rows={this.state.tscs}
              coin0={this.state.coin0}
            />}
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

const List = ({ilk, rows, coin0}) =>
  // ilk = 'addr' or 'tsc'
  <Table>
    <TableBody>
      {rows.map(row => {
        const urlPath = ilk === 'addr' ? 'addr' : `tsc/${row.addrId}`
        return (
          <TableRow key={row._id}>
            <TableCell>
              {row.icon || `${row.coin}-Icon`}
            </TableCell>
            <TableCell>
              <Link to={`/${urlPath}/${row._id}`}>{row.name}</Link>
              <br />
              {row.hsh}
            </TableCell>
            <TableCell>
              {row.coin} {row.amnt}
              <br />
              {coin0} {row.amnt * row.rates.get(coin0)}
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
