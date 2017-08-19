import {Base} from './Lib'
import {default as mo} from 'moment'
import {localization as deLoc} from 'moment/locale/de'
import Depot from './Depot'
import __ from '../util'

export default class User extends Base {
  constructor (cx) {
    super(cx, '0005b739-8462-4959-af94-271cd93f5195')
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this.init = this.init.bind(this)
    this.info('Created')
  }

  async _load (pld) {
    pld.locale === 'de' ? mo.updateLocale(pld.locale, deLoc) : mo.locale('en')
    // this.info('Locale: %s -> %s', loc, mo().format('LLLL'))
    // this.info('Currencies: %s, Locale: %s', pld.crrncs.join(', '), pld.locale)
    if (!this.cx.depot) this.cx.depot = new Depot(this.cx, pld.depots[0])
  }

  async _apiGet (secret) {
    // request parameters:
    //   secret              -> related user
    //   type of data = user -> desired resource type
    // response:
    if (secret === 'foo:bar') {    // mock successful login
      return await __.toMoPro({
        // user object has (for all users) always the same uuid
        //   -> secret is sufficient to identify the desired user
        //   -> the user _id is only needed for framework compatibility
        _id: '0005b739-8462-4959-af94-271cd93f5195',
        created: __.getTme(),
        locale: 'de',
        crrncs: ['EUR', 'BTC'],   // first is default currency for views
        depots: ['dc51021a-ea47-4f14-a53c-7969675655b7']
      }, 500)
    } else {                       // mock error / invalid user
      throw new Error('Getting user failed')
    }
  }

  async init (secret) {
    let pld
    try {
      pld = await this.apiGet(secret, true)
    } catch (e) {
      // TODO:  distinction between user-not-found and api-unreachable
      throw this.err('User not found', {sts: 404})
    }
    await this.load(pld)
    __.stoSetSecret(secret)
  }
}
