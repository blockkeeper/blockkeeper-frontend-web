import {StoBase} from './Lib'
import User from './User'
import Depot from './Depot'
import Rate from './Rate'
import __ from '../util'

export default class Core extends StoBase {
  constructor (cx) {
    super('core', cx, '000a1e26-ab63-445a-97ec-7ff61d942ef8')
    this._store = 'core'
    this.clear = () => __.clearSto()
    this.isActive = () => Boolean(this.getSto())
    this.toUserHsh = this.toUserHsh.bind(this)
    this.toSecret = this.toSecret.bind(this)
    this.encrypt = this.encrypt.bind(this)
    this.decrypt = this.decrypt.bind(this)
    this.init = this.init.bind(this)
    this.get = this.get.bind(this)
    this.info('Created')
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

  toUserHsh (username) {
    // TODO: add crypto
    return username
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

  init (userHsh, secret, userId, depotId) {
    if (userHsh) this.setSto({userHsh, secret, userId, depotId})
    const core = this.getSto()
    if (!core) return false
    if (!this.cx.user) {
      // order matters, e.g. depot has cx.user as parent
      Object.assign(this.cx, {
        tmp: {},
        user: new User(this.cx, core.userId),
        rate: new Rate(this.cx)
      })
      Object.assign(this.cx, {
        depot: new Depot(this.cx, core.depotId)
      })
    }
    return true
  }

  async login (username, pw) {
    this.clear()
    const userHsh = this.toUserHsh(username)
    let pld
    try {
      pld = await __.rqst({url: `${__.cfg('apiUrl')}/login/${userHsh}`})
      /* pld = await __.toMoPro({
        data: this.encrypt({
          _id: '2a6c50ca-b8b2-4c52-838a-071f98a01fae',
          _t: __.getTme(),
          locale: 'en',
          coins: ['EUR', 'BTC'],
          depotId: 'd9ac209e-2813-4d98-bfd6-1ab02ab32dba'
        }, this.toSecret(userHsh, pw))
      }, 750) */
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
    this.init(userHsh, secret, user._id, user.depotId)
  }

  async register (username, pw) {
    const userHsh = this.toUserHsh(username)
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
        locale: 'en',
        coins: ['EUR', 'BTC'],
        depotId
      }, secret)
    }
    try {
      await __.rqst({url: `${__.cfg('apiUrl')}/user/${userId}`, data: pld})
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
