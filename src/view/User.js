import React from 'react'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import LoopIcon from 'material-ui-icons/Loop'
import {TopBar, Modal, DropDown} from './Lib'
// import __ from '../util'

export default class UserView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {}
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.setCoin = this.setCoin.bind(this)
    this.saveUser = this.saveUser.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this, 'user'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      const [user, rate] = await Promise.all(
        [this.cx.user.load(), this.cx.rate.load()]
      )
      const coins = {coin0: [], coin1: []}
      for (let coin of await this.cx.rate.getCoins(rate)) {
        coins.coin0.push({lbl: coin, key: coin, ilk: 'coin0'})
        coins.coin1.push({lbl: coin, key: coin, ilk: 'coin1'})
      }
      this.setState({
        err: null,
        username: user.username,
        coin0: user.coins[0],
        coin1: user.coins[1],
        coins
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  setCoin (coinData) {
    this.info('Setting %s to %s', coinData.ilk, coinData.lbl)
    this.setState({[coinData.ilk]: coinData.key, updated: true})
  }

  async saveUser () {
    this.setState({busy: true})
    try {
      await this.cx.user.save({coins: [this.state.coin0, this.state.coin1]})
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
    this.setState({busy: false, updated: false})
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
    } else if (this.state.username) {
      return (
        <div>
          <TopBar
            title='User'
            icon={<ArrowBackIcon />}
            onClick={this.goBack}
            noUser
          />
          <p />
          <div>
            <Typography align='left' type='body1'>
              Username
            </Typography>
            <Typography align='left' type='body1'>
              {this.state.username}
            </Typography>
          </div>
          <p />
          <div>
            <Typography align='left' type='body1'>
            Primary coin
          </Typography>
            <DropDown
              _id='coin0DropDown'
              data={this.state.coins.coin0}
              slctd={this.state.coin0}
              action={this.setCoin}
             />
            <Typography align='left' type='body1'>
              Secondary coin
            </Typography>
            <DropDown
              _id='coin1DropDown'
              data={this.state.coins.coin1}
              slctd={this.state.coin1}
              action={this.setCoin}
             />
          </div>
          <p />
          {(!this.state.updated && !this.state.busy) &&
            <Button disabled>Save</Button>}
          {(this.state.updated && !this.state.busy) &&
            <Button onClick={this.saveUser}>Save</Button>}
          {this.state.busy &&
            <Button disabled>Saving... <LoopIcon /></Button>}
        </div>
      )
    } else {
      return (
        <LinearProgress />
      )
    }
  }
}