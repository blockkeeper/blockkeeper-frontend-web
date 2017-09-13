import React from 'react'
import {Link} from 'react-router-dom'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import ArrowDropDownIcon from 'material-ui-icons/ArrowDropDown'
import ArrowDropUpIcon from 'material-ui-icons/ArrowDropUp'
import AccountBalanceIcon from 'material-ui-icons/AccountBalance'
import {TopBar, Jumbo, Snack, Modal} from './Lib'
import Addr from '../logic/Addr'

import __ from '../util'

export default class AddrView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.addrId = props.match.params.addrId
    this.addrObj = new Addr(this.cx, this.addrId)
    this.state = {show: false}
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    this.show = this.show.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'addr'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      const [
        addr,
        {coin0, coin1}
      ] = await Promise.all([
        await this.addrObj.load(),
        this.cx.user.getCoins(this.state.coin)
      ])
      const blc = this.cx.depot.getBlc([addr])
      this.setState({
        err: null,
        addr: addr,
        tscs: addr.tscs,
        coin0,
        coin1,
        blc1: `${addr.coin} ${addr.amnt}`,
        blc2: `${coin0} ${blc.get(coin0)}`,
        blc3: `${coin1} ${blc.get(coin1)}`,
        snack: __.getSnack()
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async save (name, desc) {
    try {
      const addr = await this.addrObj.save({name, desc})
      __.addSnack('Address updated')
      this.setState({addr, snack: __.getSnack()})
    } catch (e) {
      this.setState({err: e.message, show: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async delete () {
    try {
      await this.addrObj.delete()
      __.addSnack('Address deleted')
    } catch (e) {
      this.setState({err: e.message, show: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
    this.props.history.push('/depot')
  }

  show () {
    this.info(this.state)
    this.setState({show: !this.state.show, edit: false})
    this.info(this.state)
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack} >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.addr && this.state.tscs) {
      return (
        <div>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
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
          {!this.state.show &&
            <IconButton onClick={this.show}>
              <ArrowDropDownIcon />
            </IconButton>}
          {this.state.show &&
            <div>
              <AddrList
                addr={this.state.addr}
                save={this.save}
                delete={this.delete}
              />
              <IconButton onClick={this.show}>
                <ArrowDropUpIcon />
              </IconButton>
            </div>}
          {this.state.tscs.length > 0 &&
            <TscList
              tscs={this.state.tscs}
              coin0={this.state.coin0}
            />}
          {this.state.tscs.length <= 0 &&
            <Typography align='left' type='body1'>
              {this.state.addr.hsh &&
                'No transactions'}
              {!this.state.addr.hsh &&
                'No transactions (manually added address)'}
            </Typography>}
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

const TscList = ({tscs, coin0}) =>
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
              {coin0} {tsc.amnt * tsc.rates.get(coin0)}
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>

class AddrList extends React.Component {
  constructor (props) {
    super(props)
    this.addrId = props.addr._id
    this.hshMode = Boolean(props.addr.hsh)
    this.state = {
      name: props.addr.name,
      desc: props.addr.desc
    }
    this.saveAddr = props.save
    this.deleteAddr = props.delete
    this.close = () => this.setState({ask: null})
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    this.set = this.set.bind(this)
  }

  async save () {
    this.setState({busy: true})
    await this.saveAddr(this.state.name, this.state.desc)
    this.setState({busy: false, edit: false})
  }

  async delete () {
    this.setState({busy: true})
    await this.deleteAddr(this.addrId)
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')})
      }
      if (this.hshMode) {
        if (!d.nameEmsg && !d.descEmsg) d.upd = true
      } else {
        if (this.state.name.trim() && !d.nameEmsg && !d.descEmsg) d.upd = true
      }
      this.setState(d)
    })
  }

  render () {
    if (this.state.ask) {
      return (
        <Modal
          withBusy
          onClose={this.close}
          lbl='Delete'
          actions={[{lbl: 'Delete', onClick: this.delete}]}
        >
          {`Delete address "${this.state.name}"?`}
        </Modal>
      )
    } else {
      return (
        <div>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  Name
                </TableCell>
                <TableCell>
                  {this.state.edit &&
                  <TextField
                    autoFocus
                    label={this.hshMode ? 'Name' : 'Name *'}
                    value={this.state.name}
                    error={Boolean(this.state.nameEmsg)}
                    helperText={this.state.nameEmsg}
                    onChange={evt => this.set('name', evt.target.value)}
                  />}
                  {!this.state.edit &&
                    this.state.name}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  Notes
                </TableCell>
                <TableCell>
                  {this.state.edit &&
                    <TextField
                      label='Notes'
                      value={this.state.desc}
                      error={Boolean(this.state.descEmsg)}
                      helperText={this.state.descEmsg}
                      onChange={evt => this.set('desc', evt.target.value)}
                    />}
                  {!this.state.edit &&
                    this.state.desc}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {!this.state.edit &&
            <div>
              <Button onClick={() => this.setState({edit: true})}>
                Edit
              </Button>
              <Button onClick={() => this.setState({ask: true})}>
                Delete
              </Button>
            </div>}
          {this.state.edit &&
            <div>
              {this.state.busy &&
                <LinearProgress />}
              {!this.state.busy &&
                <div>
                  <Button onClick={this.save} disabled={!this.state.upd}>
                    Save
                  </Button>
                  <Button onClick={() => this.setState({edit: false})}>
                    Cancel
                  </Button>
                </div>}
            </div>}
        </div>
      )
    }
  }
}
