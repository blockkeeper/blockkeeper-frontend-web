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
    this.toUserHsh = this.toUserHsh.bind(this)
    this.toSecret = this.toSecret.bind(this)
    this.encrypt = this.encrypt.bind(this)
    this.decrypt = this.decrypt.bind(this)
    this.init = this.init.bind(this)
    this.get = this.get.bind(this)
    this.rqst = this.rqst.bind(this)
  }

  async rqst (req) {
    req.baseURL = __.cfg('apiUrl')
    const pld = await __.rqst(req)
    return pld
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

  async toUserHsh (identifier) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder('utf-8').encode(identifier))
    return Array.from(new Uint8Array(hashBuffer)).map(b => ('00' + b.toString(16)).slice(-2)).join('')
  }

  toSecret (username, pw) {
    // TODO: add crypto
    return username + ':' + pw
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

  init (userHsh, secret, userId, depotId, user) {
    if (userHsh) this.setSto({userHsh, secret, userId, depotId})
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

  async login (identifier, pw) {
    this.clear()
    const userHsh = await this.toUserHsh(identifier)
    let pld
    try {
      pld = await this.rqst({url: `login/${userHsh}`})
    } catch (e) {
      let emsg
      let sts
      if (e.sts === 404) {
        emsg = 'Invalid user/password'
        sts = 404
      } else if (e.sts >= 400 && e.sts < 500) {
        emsg = 'Invalid input: Please check username/password'
        sts = 400
      } else {
        emsg = 'API error: Getting user failed. Please try again later'
        sts = e.sts
      }
      throw this.err(emsg, {e, sts})
    }
    const secret = this.toSecret(userHsh, pw)
    let user
    try {
      user = this.decrypt(pld.data, secret, true)
    } catch (e) {
      throw this.err('Invalid user/password', {e, sts: 404})
    }
    this.init(userHsh, secret, user._id, user.depotId, user)
  }

  async register (identifier, username, pw, coin0, coin1, locale) {
    const userHsh = await this.toUserHsh(identifier)
    const secret = this.toSecret(userHsh, pw)
    const userId = __.uuid()
    const depotId = __.uuid()
    const pld = {
      _id: userId,
      userhash: userHsh,
      data: this.encrypt({
        _id: userId,
        _t: __.getTme(),
        username: username,
        locale: locale,
        coins: [coin0, coin1],
        depotId
      }, secret)
    }
    try {
      await this.rqst({
        url: 'user',
        headers: {'X-User-Id': userId},
        data: pld
      })
    } catch (e) {
      let emsg
      let sts
      if (e.sts === 409) {
        emsg = 'Username already exists'
        sts = 409
      } else if (e.sts >= 400 && e.sts < 500) {
        emsg = 'Invalid input: Please check username/password'
        sts = 400
      } else {
        emsg = 'API error: Registering failed. Please try again later'
        sts = e.sts
      }
      throw this.err(emsg, {e, sts})
    }
    this.init(userHsh, secret, userId, depotId)
  }
}
