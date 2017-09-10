import {Base} from './Lib'
import {default as mo} from 'moment'
import {localization as deLoc} from 'moment/locale/de'
import Depot from './Depot'
import __ from '../util'

export default class User extends Base {
  constructor (cx) {
    super('user', cx, '0005b739-8462-4959-af94-271cd93f5195')
    this.isLoggedIn = () => Boolean(__.getSecSto())
    this._load = this._load.bind(this)
    this._save = this._save.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this._apiSet = this._apiSet.bind(this)
    this.init = this.init.bind(this)
    this.getCoins = this.getCoins.bind(this)
    this.info('Created')
  }

  async _load (user) {
    user.username = __.getSto('user')
    user.locale === 'de' ? mo.updateLocale(user.locale, deLoc) : mo.locale('en')
    // this.info('Locale: %s -> %s', loc, mo().format('LLLL'))
    // this.info('Coins: %s, Locale: %s', user.coins.join(', '), user.locale)
    if (!this.cx.depot) {
      this.cx.depot = new Depot(this.cx, user.depotId)
      await this.cx.depot.load()
    }
  }

  async _save (pld, upd) {
    Object.assign(upd, {
      _t: __.getTme(),
      locale: 'de',
      coins: ['EUR', 'BTC']
    })
    return upd
  }

  async _apiGet (secret) {
    let pld
    if (secret === 'foo:bar') {    // mock successful login
      pld = await __.toMoPro({
        _id: '0005b739-8462-4959-af94-271cd93f5195',
        _t: __.getTme(),
        locale: 'de',
        coins: ['EUR', 'BTC'],
        depotId: '0005b739-8462-4959-af94-271cd93f5195'
      }, 500)
    } else if (secret === 'bar:foo') {    // mock invalid user
      throw this.err('User not found', {sts: 404})
    } else {                              // mock error
      throw new Error('Getting user failed')
    }
    return pld
  }

  async _apiSet (user, secret) {
    user = await __.toMoPro({result: 'ok'}, 1500)
    return user
  }

  async _apiDel (user, secret) {
    const pld = await __.toMoPro({result: 'ok'}, 1500)
    return pld
  }

  async getCoins (curCoin, user) {
    const coins = (user || await this.load()).coins
    const coin0 = curCoin || coins[0]
    const coin1 = (coin0 === coins[1]) ? coins[0] : coins[1]
    return {coin0, coin1}
  }

  async init (user, pw) {
    const secret = __.toSecret(user, pw)
    await this.load(await this.apiGet(secret))
    __.setSecSto(user, secret)
    __.getSnack() // cleanup
  }
}
