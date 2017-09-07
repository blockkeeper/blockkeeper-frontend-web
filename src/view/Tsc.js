import React from 'react'
import {Link} from 'react-router-dom'
import Table, {TableBody, TableCell, TableRow} from 'material-ui/Table'
import Button from 'material-ui/Button'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import LinkIcon from 'material-ui-icons/Link'
import {TopBar, Jumbo, Modal} from './Lib'
import Addr from '../logic/Addr'
// import __ from '../util'

export default class TscView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {}
    this.addrId = props.match.params.addrId
    this.tscId = props.match.params.tscId
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this, 'tsc'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      const user = await this.cx.user.load() // initializes the depot
      const addrObj = new Addr(this.cx, this.addrId)
      const addr = await addrObj.load()
      const tsc = addrObj.getTsc(addr, this.tscId)
      const blc = this.cx.depot.getBlc([tsc])
      const {coin0, coin1} = await this.cx.user.getCoins(this.state.coin, user)
      this.setState({
        err: null,
        tsc: tsc,
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
    } else if (this.state.tsc) {
      return (
        <div>
          <TopBar
            title='Transaction'
            icon={<ArrowBackIcon />}
            onClick={this.goBack}
          />
          <Jumbo
            title={this.state.blc1}
            subTitle1={this.state.blc2}
          />
          <Listing
            tsc={this.state.tsc}
            coin0={this.state.coin0}
          />
          <Link to='#'>
            Detailed transaction
            <LinkIcon />
          </Link>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

const Listing = ({tsc, coin0}) =>
  <Table>
    <TableBody>
      <TableRow>
        <TableCell>
          Name
        </TableCell>
        <TableCell>
          {tsc.name}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Sender address
        </TableCell>
        <TableCell>
          {tsc.sndHsh}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Receipient address
        </TableCell>
        <TableCell>
          {tsc.rcvHsh}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Amount
        </TableCell>
        <TableCell>
          {tsc.amnt}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Fee
        </TableCell>
        <TableCell>
          {tsc.feeAmnt}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Tags
        </TableCell>
        <TableCell>
          {tsc.tags.join(' ')}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Comment
        </TableCell>
        <TableCell>
          {tsc.desc}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
