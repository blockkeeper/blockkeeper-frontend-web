import React from 'react'
import {LinearProgress} from 'material-ui/Progress'
import TextField from 'material-ui/TextField'
import { withStyles } from 'material-ui/styles'
import {TopBar, Modal, DropDown, UserList, Done, Edit} from './Lib'
import {ArrowBack} from 'material-ui-icons'
import {themeBgStyle, gridWrap, gridSpacer, gridGutter, gridGutterFluid} from './Style'
import Paper from 'material-ui/Paper'
import __ from '../util'

const styles = {
  themeBgStyle,
  gridWrap,
  gridSpacer,
  gridGutter,
  gridGutterFluid
}

class UserView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {
      edit: false,
      upd: false,
      askLogout: false,
      askDelete: false
    }
    this.goBack = props.history.goBack
    this.load = this.load.bind(this)
    this.setCoin = this.setCoin.bind(this)
    this.save = this.save.bind(this)
    this.edit = this.edit.bind(this)
    this.set = this.set.bind(this)
    this.logout = this.logout.bind(this)
    this.delete = this.delete.bind(this)
    this.askLogout = this.askLogout.bind(this)
    this.askDelete = this.askDelete.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'user'))
    await this.load()
  }

  async load () {
    try {
      const [
        user,
        rateCoins
      ] = await Promise.all([
        this.cx.user.load(),
        this.cx.rate.getCoins()
      ])
      const coins = {coin0: [], coin1: []}
      for (let coin of rateCoins) {
        coins.coin0.push({lbl: coin, key: coin, ilk: 'coin0'})
        coins.coin1.push({lbl: coin, key: coin, ilk: 'coin1'})
      }
      this.setState({
        username: user.username,
        coin0: user.coins[0],
        coin1: user.coins[1],
        _id: user._id,
        locale: user.locale,
        depotId: user.depotId,
        coins
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async save () {
    if (this.state.upd === false) {
      this.setState({edit: false})
      return
    }
    this.setState({busy: true})
    try {
      await this.cx.user.save({
        coins: [this.state.coin0, this.state.coin1],
        _id: this.state._id,
        username: this.state.username,
        locale: this.state.locale,
        depotId: this.state.depotId,
        _t: new Date().toISOString()
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    } finally {
      this.setState({busy: false, upd: false, edit: false})
    }
  }

  async delete () {
    try {
      await this.cx.user.delete()
      this.logout()
    } catch (e) {
      this.setState({err: e.message, show: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  logout () {
    this.cx.core.clear()
    this.props.history.push('/login')
  }

  askLogout () {
    this.setState({logout: !this.state.logout})
  }

  askDelete () {
    this.setState({delAcc: !this.state.delAcc})
  }

  edit () {
    this.setState({edit: !this.state.edit})
  }

  set (ilk, val) {
    this.setState({[ilk]: val}, () => {
      let d = {
        upd: false,
        usernameEmsg: __.vldAlphNum(this.state.username, {
          min: __.cfg('minUser'),
          max: __.cfg('maxUser')
        })
      }
      if (this.state.username && !d.usernameEmsg) {
        d.upd = true
      }
      this.setState(d)
    })
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
            onClick: () => this.logout()
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
    } else if (this.state.username !== undefined) {
      return (
        <div className={this.props.classes.themeBgStyle}>
          {this.state.edit &&
          <TopBar
            midTitle='User'
            icon={<Done />}
            onClick={this.save}
            className={this.props.classes.gridWrap}
            noUser
          />}
          {!this.state.edit &&
          <TopBar
            midTitle='User'
            icon={<Edit />}
            onClick={this.edit}
            iconLeft={<ArrowBack />}
            onClickLeft={this.goBack}
            className={this.props.classes.gridWrap}
            noUser
          />}
          {this.state.busy &&
            <LinearProgress />}
          <Paper
            square
            className={this.props.classes.gridSpacer}
          >
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <TextField
                  fullWidth
                  label='Username'
                  margin='normal'
                  value={this.state.username}
                  error={
                    Boolean(this.state.emsg) ||
                    Boolean(this.state.usernameEmsg)
                  }
                  helperText={this.state.emsg || this.state.usernameEmsg}
                  onChange={evt => this.set('username', evt.target.value)}
                  // disabled={!this.state.edit}
                  disabled
                  />
                <DropDown
                  _id='coin0DropDown'
                  title={'Primary coin'}
                  data={this.state.coins.coin0}
                  slctd={this.state.coin0}
                  action={this.setCoin}
                  disabled={!this.state.edit}
                 />
                <DropDown
                  _id='coin1DropDown'
                  title={'Secondary coin'}
                  data={this.state.coins.coin1}
                  slctd={this.state.coin1}
                  action={this.setCoin}
                  disabled={!this.state.edit}
                 />
              </div>
              <div className={this.props.classes.gridGutterFluid}>
                <UserList
                  askLogout={this.askLogout}
                  askDelete={this.askDelete}
                 />
              </div>
            </div>
          </Paper>
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default withStyles(styles)(UserView)
