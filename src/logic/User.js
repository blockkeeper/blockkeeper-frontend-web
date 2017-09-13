import {ApiBase} from './Lib'
import {default as mo} from 'moment'
import {localization as deLoc} from 'moment/locale/de'
import __ from '../util'

export default class User extends ApiBase {
  constructor (cx, _id, depotId) {
    super('user', cx, _id || '0005b739-8462-4959-af94-271cd93f5195')
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this._apiSet = this._apiSet.bind(this)
    this._apiDel = this._apiDel.bind(this)
    this.getCoins = this.getCoins.bind(this)
    this.info('Created')
  }

  async _load (user) {
    user.locale === 'de' ? mo.updateLocale(user.locale, deLoc) : mo.locale('en')
    // this.info('Locale: %s -> %s', loc, mo().format('LLLL'))
    // this.info('Coins: %s, Locale: %s', user.coins.join(', '), user.locale)
  }

  async _apiGet () {
    let pld = await __.toMoPro({
      data: this.encrypt({
        _id: '2a6c50ca-b8b2-4c52-838a-071f98a01fae',
        _t: __.getTme(),
        username: 'foo',
        locale: 'de',
        coins: ['EUR', 'BTC'],
        depotId: 'd9ac209e-2813-4d98-bfd6-1ab02ab32dba'
      })
    }, 750)
    return this.decrypt(pld.data)
  }

  async _apiSet (user) {
    await __.toMoPro({}, 750)
    return user
  }

  async _apiDel (user) {
    await __.toMoPro({}, 750)
  }

  async getCoins (curCoin, user) {
    const coins = (user || await this.load()).coins
    const coin0 = curCoin || coins[0]
    const coin1 = (coin0 === coins[1]) ? coins[0] : coins[1]
    return {coin0, coin1}
  }
}
