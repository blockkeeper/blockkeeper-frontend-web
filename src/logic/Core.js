/* global TextEncoder */
import {StoBase} from './Lib'
import User from './User'
import Depot from './Depot'
import Rate from './Rate'
import __ from '../util'

export default class Core extends StoBase {
  constructor (cx) {
    super('core', cx, '000a1e26-ab63-445a-97ec-7ff61d942ef8')
    this._store = 'core'
    this.isActive = () => Boolean(this.getSto())
    this.clear = this.clear.bind(this)
    this.toSecret = this.toSecret.bind(this)
    this.encrypt = this.encrypt.bind(this)
    this.decrypt = this.decrypt.bind(this)
    this.init = this.init.bind(this)
    this.get = this.get.bind(this)
  }

  clear () {
    const cx = this.cx
    __.clearObj(cx)
    cx.core = new Core(cx)
    __.clearSto()
  }

  get (key) {
    const core = this.getSto() || {}
    const val = core[key]
    if (val === undefined) {
      this.clear()
      throw __.err(`Getting core data "${key}" failed`, {sts: 900})
    }
    return val
  }

  toSecret (userId, pw) {
    // TODO: add crypto
    return userId + ':' + pw
  }

  encrypt (pld, secret, noFatal) {
    // TODO: add crypto
    try {
      secret = secret || this.getSto().secret
      return JSON.stringify(pld)
    } catch (e) {
      if (noFatal) throw __.err('Encrypting data failed', {e, sts: 801})
      throw __.err('Encrypting data failed', {e, sts: 901})
    }
  }

  decrypt (pld, secret, noFatal) {
    // TODO: add crypto
    try {
      secret = secret || this.getSto().secret
      return JSON.parse(pld)
    } catch (e) {
      if (noFatal) throw __.err('Decrypting data failed', {e, sts: 802})
      throw __.err('Decrypting data failed', {e, sts: 902})
    }
  }

  init (userId, secret, depotId, user) {
    if (userId) this.setSto({userId, secret, depotId})
    const core = this.getSto()
    if (!core) return false
    if (!this.cx.user) {
      // order matters, e.g. depot has cx.user as parent
      Object.assign(this.cx, {
        tmp: {},
        user: new User(this.cx, core.userId, user),
        rate: new Rate(this.cx)
      })
      Object.assign(this.cx, {
        depot: new Depot(this.cx, core.depotId)
      })
      this.cx.depot.setBxpSts('clearRun')
      this.cx.depot.watchBxp()
    }
    return true
  }

  async login (userId, pw) {
    this.clear()
    let pld
    try {
      pld = await this.rqst({url: 'user'}, userId)
    } catch (e) {
      let emsg, sts
      if (e.sts === 404) {
        emsg = 'Invalid identifier/password'
        sts = 404
      } else if (e.sts >= 400 && e.sts < 500) {
        emsg = 'Invalid identifier/password'
        sts = 400
      } else {
        emsg = 'API Error: Login failed. Please try again later'
        sts = e.sts
      }
      throw this.err(emsg, {e, sts})
    }
    const secret = this.toSecret(userId, pw)
    let user
    try {
      user = this.decrypt(pld.data, secret, true)
    } catch (e) {
      throw this.err('Invalid identifier/password', {e, sts: 400})
    }
    this.init(user._id, secret, user.depotId, user)
  }

  async register (userId, pw, coin0, coin1, locale) {
    const secret = this.toSecret(userId, pw)
    const depotId = __.uuid()
    const pld = {
      _id: userId,
      data: this.encrypt({
        _id: userId,
        _t: __.getTme(),
        coins: [coin0, coin1],
        locale,
        depotId
      }, secret)
    }
    try {
      await this.rqst({url: 'user', data: pld}, userId)
    } catch (e) {
      let emsg
      let sts
      if (e.sts === 409) {  // userId already exists: should never happen
        emsg = 'Registering failed: Please reload page and try again'
        sts = e.sts
      } else if (e.sts >= 400 && e.sts < 500) {
        emsg = 'Invalid password: Please change the password'
        sts = 400
      } else {
        emsg = 'API Error: Registering failed. Please try again later'
        sts = e.sts
      }
      throw this.err(emsg, {e, sts})
    }
    this.init(userId, secret, depotId)
  }
}
