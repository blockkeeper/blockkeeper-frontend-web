import React from 'react'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import Paper from 'material-ui/Paper'
import Typography from 'material-ui/Typography'
import ModeEdit from 'material-ui-icons/ModeEdit'
import {TopBar, Snack, Modal, CoinIcon, TscTable} from './Lib'
import {theme, themeBgStyle, paperStyle} from './Style'
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
        blc1: `${blc.get(coin0)}`,
        blc2: `${blc.get(coin1)}`
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
      let modeColor = this.state.mode === 'snd' ? theme.palette.error['500'] : theme.palette.secondary['500']
      let modeSign = this.state.mode === 'snd' ? '-' : '+'
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
          <Paper square style={{...paperStyle, textAlign: 'center'}}>
            <Typography type='headline' style={{color: modeColor}}>
              {modeSign} {this.state.blc1} <CoinIcon coin={this.state.coin0} alt color={modeColor} />
            </Typography>
            <Typography type='body2' style={{color: theme.palette.text.secondary}} gutterBottom>
              {modeSign} {this.state.blc2} <CoinIcon coin={this.state.coin1} color={theme.palette.text.secondary} size={12} alt />
            </Typography>
          </Paper>

          <Paper square style={{...paperStyle}} elevation={10}>
            <TscTable
              addr={this.addr}
              tsc={this.state.tsc}
              save={this.save}
            />
          </Paper>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}
