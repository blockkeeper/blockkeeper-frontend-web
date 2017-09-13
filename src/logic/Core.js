import {Base} from './Lib'
import User from './User'
import Depot from './Depot'
import Rate from './Rate'
import __ from '../util'

export default class Core extends Base {
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
    this.info('Created')
  }

  toUserHsh (username) {
    return username
  }

  toSecret (username, pw) {
    return username + ':' + pw
  }

  encrypt (pld, secret) {
    secret = secret || this.getSto().secret
    return JSON.stringify(pld)
  }

  decrypt (pld, secret) {
    secret = secret || this.getSto().secret
    return JSON.parse(pld)
  }

  init (userHsh, secret, userId, depotId) {
    if (userHsh) this.setSto({userHsh, secret, userId, depotId})
    const core = this.getSto()
    if (!core) return false
    if (!this.cx.user) {
      Object.assign(this.cx, {
        tmp: {},
        user: new User(this.cx, core.userId),
        rate: new Rate(this.cx)
      })
      Object.assign(this.cx, {
        depot: new Depot(this.cx, core.depotId)  // cx.user is parent
      })
    }
    return true
  }

  async login (username, pw) {
    this.clear()
    const userHsh = this.toUserHsh(username)
    let pld
    try {
      // pld = await __.rqst({url: `${__.cfg('apiUrl')}/user/login/${userHsh}`})
      // same mock as in this.register and User.js
      pld = await __.toMoPro({
        data: this.encrypt({
          _id: '2a6c50ca-b8b2-4c52-838a-071f98a01fae',
          _t: __.getTme(),
          locale: 'en',
          coins: ['EUR', 'BTC'],
          depotId: 'd9ac209e-2813-4d98-bfd6-1ab02ab32dba'
        }, this.toSecret(userHsh, pw))
      }, 750)
    } catch (e) {
      if (e.sts === 404) throw this.err('User not found', {e, sts: e.sts})
      throw this.err('Getting user failed', {e, sts: e.sts})
    }
    const secret = this.toSecret(userHsh, pw)
    const user = this.decrypt(pld.data, secret)
    if (!user) throw this.err('Invalid user/password', {sts: 400})
    this.init(userHsh, secret, user._id, user.depotId)
  }

  async register (username, pw) {
    const userHsh = this.toUserHsh(username)
    const secret = this.toSecret(userHsh, pw)
    // same mock as in this.login and User.js
    const userId = '2a6c50ca-b8b2-4c52-838a-071f98a01fae'   // __.uuid()
    const depotId = 'd9ac209e-2813-4d98-bfd6-1ab02ab32dba'  // __.uuid()
    //
    const pld = {
      userHash: userHsh,
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
      // await __.rqst({url: `${__.cfg('apiUrl')}/user/${userId}`, data: pld})
      await __.toMoPro({}, 750, pld)
    } catch (e) {
      if (e.sts === 409) throw this.err('User already exists', {e, sts: e.sts})
      throw this.err('Registering user failed', {e, sts: e.sts})
    }
    this.init(userHsh, secret, userId, depotId)
  }
}
