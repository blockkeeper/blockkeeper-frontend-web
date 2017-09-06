import {Base} from './Lib'
import {default as mo} from 'moment'
import {localization as deLoc} from 'moment/locale/de'
import Depot from './Depot'
import __ from '../util'

export default class User extends Base {
  constructor (cx) {
    super('user', cx, '0005b739-8462-4959-af94-271cd93f5195')
    this._load = this._load.bind(this)
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
      this.cx.depot.load()
    }
  }

  async _apiGet (secret) {
    let pld
    if (secret === 'foo:bar') {    // mock successful login
      pld = await __.toMoPro({
        // user object has (for all users) always the same uuid
        //   -> secret is sufficient to identify the desired user
        //   -> the user _id is only needed for framework compatibility
        _id: '0005b739-8462-4959-af94-271cd93f5195',
        created: __.getTme(),
        locale: 'de',
        coins: ['EUR', 'BTC'],   // first is default currency for views
        depotId: '0005b739-8462-4959-af94-271cd93f5195',
        addrIds: [
          'a2d7077a-a838-4463-8461-71f26e0873b1',
          'ace20977-b117-43d1-9b60-b527f013e491'
        ]
      }, 500)
    } else if (secret === 'bar:foo') {    // mock invalid user
      throw this.err('User not found', {sts: 404})
    } else {                              // mock error
      throw new Error('Getting user failed')
    }
    return pld
  }

  async _apiSet (pld, secret) {
    pld = await __.toMoPro({result: 'ok'}, 1500)
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
  }
}
