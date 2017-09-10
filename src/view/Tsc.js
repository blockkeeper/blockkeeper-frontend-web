import React from 'react'
import {Link} from 'react-router-dom'
import Table, {TableBody, TableCell, TableRow} from 'material-ui/Table'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import LinkIcon from 'material-ui-icons/Link'
import {TopBar, Jumbo, Modal} from './Lib'
import Addr from '../logic/Addr'
import __ from '../util'

export default class TscView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {}
    this.addrId = props.match.params.addrId
    this.addrObj = new Addr(this.cx, this.addrId)
    this.tscId = props.match.params.tscId
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this, 'tsc'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      const user = await this.cx.user.load()
      this.addr = await this.addrObj.load()
      const tsc = await this.addrObj.getTsc(this.tscId, this.addr)
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

  async save (name, desc, tags) {
    try {
      const {addr, tsc} = await this.addrObj.saveTsc(
        this.state.tsc._id,
        {name, desc, tags: tags.trim().split(' ')},
        this.addr
      )
      __.addSnack('Transaction successfully updated')
      this.addr = addr
      this.setState({tsc, snack: __.getSnack()})
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack}>
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
          <TscList
            tsc={this.state.tsc}
            save={this.save}
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

class TscList extends React.Component {
  constructor (props) {
    super(props)
    this.tsc = props.tsc
    this.state = {
      name: props.tsc.name,
      desc: props.tsc.desc,
      tags: props.tsc.tags.join(' ')
    }
    this.saveAddr = props.save
    this.save = this.save.bind(this)
    this.set = this.set.bind(this)
    this.getTags = this.getTags.bind(this)
  }

  async save () {
    this.setState({busy: true})
    await this.saveAddr(this.state.name, this.state.desc, this.state.tags)
    this.setState({busy: false, edit: false})
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        nameEmsg: __.vldAlphNum(this.state.name),
        descEmsg: __.vldAlphNum(this.state.desc, {max: __.cfg('maxHigh')}),
        tagsEmsg: __.vldAlphNum(this.state.tags, {max: __.cfg('maxHigh')})
      }
      if (!d.nameEmsg && !d.descEmsg && !d.tagsEmsg) d.upd = true
      this.setState(d)
    })
  }

  getTags () {
    return this.state.tags.trim().split(' ').map(tag => '#' + tag).join(' ')
  }

  render () {
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
                  label='Name'
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
                Sender address
              </TableCell>
              <TableCell>
                {this.tsc.sndHsh}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Receipient address
              </TableCell>
              <TableCell>
                {this.tsc.rcvHsh}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Amount
              </TableCell>
              <TableCell>
                {this.tsc.amnt}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Fee
              </TableCell>
              <TableCell>
                {this.tsc.feeAmnt}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Tags
              </TableCell>
              <TableCell>
                {this.state.edit &&
                  <TextField
                    label='Tags'
                    value={this.state.tags}
                    error={Boolean(this.state.tagsEmsg)}
                    helperText={this.state.tagsEmsg}
                    onChange={evt => this.set('tags', evt.target.value)}
                  />}
                {!this.state.edit &&
                  this.getTags()}
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
          <Button onClick={() => this.setState({edit: true})}>
            Edit
          </Button>}
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
