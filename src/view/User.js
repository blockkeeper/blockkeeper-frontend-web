import React from 'react'
import LinearProgress from '@material-ui/core/LinearProgress'
import {withStyles} from '@material-ui/core/styles'
import {TopBar, Modal, DropDown, UserList, Done, Edit, Snack} from './Lib'
import {ArrowBack} from '@material-ui/icons'
import {themeBgStyle, gridWrap, gridSpacer, gridGutter,
        gridGutterFluid, topBarSpacer} from './Style'
import Paper from '@material-ui/core/Paper'
import __ from '../util'

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
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    this.askLogout = () => this.setState({logout: !this.state.logout})
    this.askDelete = () => this.setState({delAcc: !this.state.delAcc})
    this.edit = () => this.setState({edit: !this.state.edit})
    this.setAction = d => this.setState({[d.ilk]: d.key, upd: true})
    this.logout = () => {
      this.cx.core.clear()
      this.props.history.push('/login')
    }
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'user'))
    await this.load()
  }

  async load () {
    let user, rateCoins, coins
    try {
      [user, rateCoins] = await Promise.all([
        this.cx.user.load(),
        this.cx.rate.getCoins()
      ])
      coins = {coin0: [], coin1: []}
      for (let coin of rateCoins) {
        coins.coin1.push({lbl: coin, key: coin, ilk: 'coin1'})
        if (__.cfg('allowedPrimaryCoins').indexOf(coin) !== -1) {
          coins.coin0.push({lbl: coin, key: coin, ilk: 'coin0'})
        }
      }
    } catch (e) {
      return this.errGo(`Loading user failed: ${e.message}`, e, '/depot')
    }
    this.setState({
      snack: this.getSnack(),
      userId: user._id,
      depotId: user.depotId,
      coin0: user.coins[0],
      coin1: user.coins[1],
      locale: user.locale,
      coins
    })
  }

  async save () {
    if (this.state.upd === false) return this.setState({edit: false})
    this.setState({edit: false, busy: true})
    try {
      await this.cx.user.save({
        _id: this.state.userId,
        _t: __.getTme(),
        coins: [this.state.coin0, this.state.coin1],
        locale: this.state.locale,
        depotId: this.state.depotId
      })
    } catch (e) {
      this.err(`Updating user failed: ${e.message}`, e)
    } finally {
      this.setState({busy: false, upd: false, edit: false})
    }
  }

  async delete () {
    try {
      await this.cx.user.delete()
      this.logout()
    } catch (e) {
      return this.err(`Deleting user failed: ${e.message}`, e, {delAcc: false})
    }
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
          onClose={() => this.setState({logout: false})}
          lbl='Logout'
          actions={[{
            lbl: 'Clear and logout?',
            onClick: () => this.logout()
          }]}
        >
          Logout and clear browser’s local app storage?
          Please note: After logout you need your identifier and crypto-key
          to login again.
        </Modal>
      )
    } else if (this.state.delAcc) {
      return (
        <Modal
          withBusy
          onClose={() => this.setState({delAcc: false})}
          lbl='Delete account'
          actions={[{
            lbl: 'Delete',
            onClick: async () => await this.delete()
          }]}
        >
          Delete account and all related data?
        </Modal>
      )
    } else if (this.state.userId) {
      return (
        <div className={this.props.classes.topBarSpacer}>
          <div className={this.props.classes.themeBgStyle}>
            {this.state.snack &&
              <Snack
                msg={this.state.snack}
                onClose={() => this.setState({snack: null})}
              />
            }
            {this.state.edit &&
              <TopBar
                midTitle='User'
                action={<Done />}
                onClick={async () => { if (this.state.upd) await this.save() }}
                onClickLeft={() => this.setState({edit: false})}
                isActionAllowed={this.state.upd}
                modeCancel
                noUser
              />
            }
            {!this.state.edit &&
              <TopBar
                midTitle='User'
                action={<Edit />}
                onClick={this.edit}
                iconLeft={<ArrowBack />}
                onClickLeft={this.goBack}
                noUser
              />}
          </div>
          {this.state.busy &&
            <LinearProgress />}
          <Paper
            square
            className={this.props.classes.gridSpacer}
          >
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                <DropDown
                  _id='coin0DropDown'
                  title={'Primary coin'}
                  data={this.state.coins.coin0}
                  slctd={this.state.coin0}
                  action={this.setAction}
                  disabled={!this.state.edit}
                />
                <DropDown
                  _id='coin1DropDown'
                  title={'Secondary coin'}
                  data={this.state.coins.coin1}
                  slctd={this.state.coin1}
                  action={this.setAction}
                  disabled={!this.state.edit}
                />
                <DropDown
                  _id='localeDropDown'
                  renderValue={val => {
                    return `${val} (${__.formatNumber(10000.99, 'USD', val)})`
                  }}
                  title={'Locale'}
                  data={__.cfg('locales')}
                  slctd={this.state.locale}
                  action={this.setAction}
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

export default withStyles({
  themeBgStyle,
  gridWrap,
  gridSpacer,
  gridGutter,
  gridGutterFluid,
  topBarSpacer
})(UserView)
