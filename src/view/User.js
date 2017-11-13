import React from 'react'
import {LinearProgress} from 'material-ui/Progress'
import {withStyles} from 'material-ui/styles'
import {TopBar, Modal, DropDown, UserList, Done, Edit} from './Lib'
import {ArrowBack} from 'material-ui-icons'
import {themeBgStyle, gridWrap, gridSpacer, gridGutter,
        gridGutterFluid} from './Style'
import Paper from 'material-ui/Paper'
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
    try {
      const [user, rateCoins] = await Promise.all([
        this.cx.user.load(),
        this.cx.rate.getCoins()
      ])
      const coins = {coin0: [], coin1: []}
      for (let coin of rateCoins) {
        coins.coin0.push({lbl: coin, key: coin, ilk: 'coin0'})
        coins.coin1.push({lbl: coin, key: coin, ilk: 'coin1'})
      }
      this.setState({
        userId: user._id,
        depotId: user.depotId,
        coin0: user.coins[0],
        coin1: user.coins[1],
        locale: user.locale,
        coins
      })
    } catch (e) {
      this.setState({err: e.message})
      if (__.cfg('isDev')) throw e
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
        _id: this.state.userId,
        _t: __.getTme(),
        coins: [this.state.coin0, this.state.coin1],
        locale: this.state.locale,
        depotId: this.state.depotId
      })
    } catch (e) {
      this.setState({err: e.message})
      if (__.cfg('isDev')) throw e
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
      if (__.cfg('isDev')) throw e
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
          onClose={() => this.setState({logout: null})}
          lbl='Logout'
          actions={[{
            lbl: 'Clear and logout?',
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
          {'Delete account and all related data?'}
        </Modal>
      )
    } else if (this.state.userId) {
      return (
        <div className={this.props.classes.themeBgStyle}>
          {this.state.edit &&
            <TopBar
              midTitle='User'
              action={<Done />}
              onClick={this.save}
              onClickLeft={() => this.setState({edit: false})}
              className={this.props.classes.gridWrap}
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
              className={this.props.classes.gridWrap}
              noUser
            />
          }
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
  gridGutterFluid
})(UserView)
