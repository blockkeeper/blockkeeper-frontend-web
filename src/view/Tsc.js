import React from 'react'
import Table, {TableBody, TableCell, TableRow} from 'material-ui/Table'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import ModeEdit from 'material-ui-icons/ModeEdit'
import {TopBar, Jumbo, Snack, ExtLink, Modal} from './Lib'
import {themeBgStyle} from './Style'
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
    Object.assign(this, __.initView(this, 'tsc'))
    await this.load()
  }

  async load () {
    try {
      const [
        addr,
        {coin0, coin1}
      ] = await Promise.all([
        await this.addrObj.load(),
        this.cx.user.getCoins(this.state.coin)
      ])
      this.addr = addr
      const tsc = await this.addrObj.getTsc(this.tscId, this.addr)
      const blc = this.cx.depot.getTscBlc([tsc], this.addr)
      this.setState({
        err: null,
        tsc,
        coin0,
        coin1,
        blc1: `${coin0} ${blc.get(coin0)}`,
        blc2: `${coin1} ${blc.get(coin1)}`
      })
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
    }
  }

  async save (name, desc, tags) {
    const tsc = this.state.tsc
    try {
      const updTsc = {hsh: tsc.hsh, name, desc, tags: tags.trim().split(' ')}
      this.addr = await this.addrObj.save({tscs: [updTsc]})
      __.addSnack('Transaction updated')
      this.setState({
        tsc: await this.addrObj.getTsc(this.tscId, this.addr),
        snack: __.getSnack()
      })
    } catch (e) {
      if (__.cfg('isDev')) throw e
      this.setState({err: e.message})
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
        <div style={themeBgStyle}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          <TopBar
            midTitle='Transaction'
            iconLeft={<ArrowBackIcon />}
            icon={<ModeEdit />}
            onClickLeft={this.goBack}
            onClick={() => this.setState({edit: true})}
            noUser
          />
          <Jumbo
            title={this.state.blc1}
            subTitle={this.state.blc2}
          />
          <TscList
            addr={this.addr}
            tsc={this.state.tsc}
            save={this.save}
          />
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
    this.addr = props.addr
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
    if (this.state.tags) {
      return this.state.tags.trim().split(' ').map(tag => '#' + tag).join(' ')
    }
  }

  render () {
    const tscUrl = __.toSrvUrl('tsc', this.addr.coin)(this.tsc.hsh)
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
                Amount
              </TableCell>
              <TableCell>
                {this.tsc.amntDesc}
                <ExtLink to={tscUrl} />
              </TableCell>
            </TableRow>
            {this.tsc.feeDesc &&
              <TableRow>
                <TableCell>
                  Additional costs (fee)
                </TableCell>
                <TableCell>
                  {this.tsc.feeDesc}
                  <ExtLink to={tscUrl} />
                </TableCell>
              </TableRow>}
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
            <TableRow>
              <TableCell>
                Transaction ID
              </TableCell>
              <TableCell>
                {this.tsc._id}
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
