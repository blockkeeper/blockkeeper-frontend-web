import React from 'react'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import ArrowBackIcon from 'material-ui-icons/ArrowBack'
import {TopBar, Modal, DropDown} from './Lib'
import __ from '../util'

export default class UserView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {}
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.setCoin = this.setCoin.bind(this)
    this.save = this.save.bind(this)
    this.logout = this.logout.bind(this)
    this.delete = this.delete.bind(this)
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

  async save () {
    this.setState({busy: true})
    try {
      await this.cx.user.save({coins: [this.state.coin0, this.state.coin1]})
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
    this.setState({busy: false, upd: false})
  }

  async delete () {
    try {
      await this.cx.user.delete()
      this.logout(true)
    } catch (e) {
      this.setState({err: e.message, show: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  logout (clear) {
    if (clear) {
      __.clearSto()
    } else {
      __.delSecSto()
    }
    this.props.history.push('/login')
  }

  setCoin (coinData) {
    this.info('Setting %s to %s', coinData.ilk, coinData.lbl)
    this.setState({[coinData.ilk]: coinData.key, upd: true})
  }

  render () {
    if (this.state.err) {
      return (
        <Modal onClose={this.goBack}>
          {this.state.err}
        </Modal>
      )
    } else if (this.state.logout) {
      return (
        <Modal
          onClose={() => this.setState({logout: null})}
          lbl='Logout'
          actions={[{
            lbl: 'Logout and clear?',
            onClick: () => this.logout(true)
          }]}
        >
          {"Clear browser's local app storage and logout?"}
        </Modal>
      )
    } else if (this.state.delAcc) {
      return (
        <Modal
          withBusy
          onClose={() => this.setState({delAcc: null})}
          lbl='Delete account'
          actions={[{
            lbl: 'Delete',
            onClick: () => this.delete()
          }]}
        >
          {'Delete account and related data?'}
        </Modal>
      )
    } else if (this.state.username) {
      return (
        <div>
          <TopBar
            title='Settings'
            icon={<ArrowBackIcon />}
            onClick={this.goBack}
            noUser
          />
          <p />
          {
          // <div>
          //   <Typography align='left' type='body1'>
          //     Username
          //   </Typography>
          //   <Typography align='left' type='body1'>
          //     {this.state.username}
          //   </Typography>
          // </div>
          // <p />
          }
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
          {this.state.busy &&
            <LinearProgress />}
          {!this.state.busy &&
            <div>
              <Button onClick={this.save} disabled={!this.state.upd}>
                Save
              </Button>
              <Button onClick={this.goBack}>
                Cancel
              </Button>
            </div>
          }
          <p />
          <Typography align='left' type='headline'>
            Danger zone
          </Typography>
          <Button onClick={() => this.logout(false)}>
            Logout
          </Button>
          <br />
          <Button onClick={() => this.setState({logout: true})}>
            Logout and clear LocalStorage
          </Button>
          <br />
          <Button onClick={() => this.setState({delAcc: true})}>
            Delete account
          </Button>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}
