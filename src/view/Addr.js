import React from 'react'
import {Link} from 'react-router-dom'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import ArrowDropDownIcon from 'material-ui-icons/ArrowDropDown'
import ArrowDropUpIcon from 'material-ui-icons/ArrowDropUp'
import AccountBalanceIcon from 'material-ui-icons/AccountBalance'
import {TopBar, Jumbo, Modal} from './Lib'
import Addr from '../logic/Addr'

import __ from '../util'

export default class AddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.addrId = props.match.params.addrId
    this.state = {showAddr: false}
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.onShowAddr = this.onShowAddr.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this, 'addr'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //  throw this.err('An error occurred')
      const user = await this.cx.user.load() // initializes the depot
      const addr = await (new Addr(this.cx, this.addrId)).load()
      const blc = this.cx.depot.getBlc([addr])
      const {coin1, coin2} = await this.cx.user.getCoins(this.state.coin, user)
      this.setState({
        err: null,
        addr: addr,
        tscs: addr.tscs,
        coin1,
        coin2,
        blc1: `${addr.coin} ${addr.amnt}`,
        blc2: `${coin1} ${blc.get(coin1)}`,
        blc3: `${coin2} ${blc.get(coin2)}`
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  onShowAddr () {
    this.info(this.state)
    this.setState({showAddr: !this.state.showAddr})
    this.info(this.state)
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          open
          onClose={this.goBack}
          actions={<Button onClick={this.goBack}>OK</Button>}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.addr && this.state.tscs) {
      return (
        <div>
          <TopBar
            title='Address'
            icon={<ArrowBackIcon />}
            onClick={this.goBack}
          />
          <Jumbo
            icon={<AccountBalanceIcon />}
            title={this.state.blc1}
            subTitle1={this.state.blc2}
            subTitle2={this.state.blc3}
          />
          {!this.state.showAddr &&
            <IconButton onClick={this.onShowAddr}>
              <ArrowDropDownIcon />
            </IconButton>}
          {this.state.showAddr &&
            <AddrList
              addr={this.state.addr}
            />}
          {this.state.showAddr &&
            <IconButton onClick={this.onShowAddr}>
              <ArrowDropUpIcon />
            </IconButton>}
          <TscList
            tscs={this.state.tscs}
            coin1={this.state.coin1}
          />
        </div>
      )
    } else {
      return (
        <LinearProgress />
      )
    }
  }
}

const AddrList = ({addr}) =>
  <Table>
    <TableBody>
      <TableRow>
        <TableCell>
          Address
        </TableCell>
        <TableCell>
          {addr.hsh}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Name
        </TableCell>
        <TableCell>
          {addr.name}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Comment
        </TableCell>
        <TableCell>
          {addr.desc}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

const TscList = ({tscs, coin1}) =>
  <Table>
    <TableBody>
      {tscs.map(tsc => {
        const mx = 40
        let tags = tsc.tags.join(' ')
        if (tags.length > mx) tags = tags.slice(0, mx) + '...'
        let desc = tsc.desc
        if (desc.length > mx) desc = desc.slice(0, mx) + '...'
        return (
          <TableRow key={tsc._id}>
            <TableCell>
              {__.ppTme(tsc._t)}
              <br />
              <Link to={`/tsc/${tsc.addrId}/${tsc._id}`}>{tsc.name}</Link>
              <br />
              {desc}
              <br />
              {tags}
            </TableCell>
            <TableCell>
              {tsc.coin} {tsc.amnt}
              <br />
              {coin1} {tsc.amnt * tsc.rates.get(coin1)}
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
