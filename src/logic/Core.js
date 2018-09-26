/* global crypto */
import * as LZUTF8 from 'lzutf8'
import { StoBase } from './Lib'
import User from './User'
import Depot from './Depot'
import Rate from './Rate'
import History from './History'
import __ from '../util'

export default class Core extends StoBase {
  constructor (cx) {
    super('core', cx, '000a1e26-ab63-445a-97ec-7ff61d942ef8')
    this._store = 'core'
    this.isActive = () => Boolean(this.getSto())
    this.clear = this.clear.bind(this)
    this.toSecrets = this.toSecrets.bind(this)
    this.loadSecrets = this.loadSecrets.bind(this)
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
      throw this.err(`Getting core data "${key}" failed`, { sts: 900 })
    }
    return val
  }

  async toSecrets (userId, cryptId) {
    // create a CryptoKey object (baseKey) from cryptId
    // - the cryptId is a random value with enough entropy, so it is not
    //   necessary to stretch it
    // - but we need a CryptoKey object and have only importKey() to create
    //   it from cryptId
    // - WebCrypto API's HKDF is not (yet) supported by browsers (2017-11),
    //   so we use PBKDF2
    const baseKeyObj = await crypto.subtle.importKey(
      'raw',
      __.strToArrBuf(cryptId),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )
    // derive cryptKey from baseKey
    // - same situation: stretching is not needed, but it's not possible to
    //   use exportKey() without deriveKey()
    // - if we need PBKDF2 anyway: lets do iterations and salting :)
    // - but salt is also not very helpful: we don't store the cryptKey
    //   on the server
    const cryptKeyObj = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        // the "pldKey" naming doesn't make sense, but cannot be changed for
        // compatibility reasons (it's a relict from the past)
        salt: __.strToArrBuf('pldKey:' + userId),
        // only modern devices are supported, they should have enough
        // power to handle a high number of PBKDF2 iterations
        iterations: 125000
      },
      baseKeyObj,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    // user friendly operations are very important
    // - user should not always have to enter his secrets
    // - secrets should be remembered across browser sessions
    // => export the cryptKey for keeping in localStorage
    const cryptKeyJwk = await crypto.subtle.exportKey('jwk', cryptKeyObj)
    return { userId, cryptKeyObj, cryptKeyJson: JSON.stringify(cryptKeyJwk) }
  }

  async loadSecrets (usage, secrets = {}) {
    const sto = this.getSto() || {}
    const userId = secrets.userId || sto.userId
    let cryptKeyObj = secrets.cryptKeyObj
    if (!cryptKeyObj) {
      cryptKeyObj = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(sto.pldKey),
        { name: 'AES-GCM', length: 256 },
        false,
        usage
      )
    }
    if (!userId || !cryptKeyObj) {
      throw this.err('Getting user-id and/or crypto-key failed', { sts: 900 })
    }
    return Object.assign(secrets, { userId, cryptKeyObj })
  }

  async encrypt (pld, secrets) {
    try {
      let rawPld
      try {
        rawPld = LZUTF8.compress(JSON.stringify(pld))
      } catch (e) {
        throw this.err('Packing process failed', { e })
      }
      try {
        secrets = await this.loadSecrets(['encrypt'], secrets)
        const tagSize = 128 // 128 bits
        const iv = new Uint8Array(12) // 12 bytes
        crypto.getRandomValues(iv)
        let cypher = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv,
            tagLength: tagSize,
            additionalData: __.strToArrBuf(secrets.userId)
          },
          secrets.cryptKeyObj,
          rawPld
        )
        cypher = Array.from(new Uint8Array(cypher))
        return { iv: Array.from(iv), cypher, tagSize, addData: secrets.userId }
      } catch (e) {
        throw this.err('Encryption process failed', { e })
      }
    } catch (e) {
      throw this.err('Encrypting payload failed', { e, sts: 900 })
    }
  }

  async decrypt (data, secrets) {
    const isLogin = Boolean(secrets)
    try {
      secrets = await this.loadSecrets(['decrypt'], secrets)
      let rawPld
      try {
        rawPld = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            tagLength: 128, // 128 bits
            iv: new Uint8Array(data.iv), // 12 bytes
            additionalData: __.strToArrBuf(secrets.userId)
          },
          secrets.cryptKeyObj,
          new Uint8Array(data.cypher)
        )
      } catch (e) {
        throw this.err('Decryption process failed. Most likely reason: ' +
                       'Wrong crypto-key. Other (very unlikely) reasons: ' +
                       'tagLength or iv or additionalData are not ' +
                       'congruent with related encryption values', { e })
      }
      try {
        return JSON.parse(LZUTF8.decompress(new Uint8Array(rawPld)))
      } catch (e) {
        throw this.err('Unpacking process failed', { e })
      }
    } catch (e) {
      if (isLogin) throw this.err('Decrypting data failed', { e })
      throw this.err('Decrypting data failed', { e, sts: 900 })
    }
  }

  init (secrets, depotId, user) {
    if (secrets) {
      this.setSto({
        depotId,
        userId: secrets.userId,
        // the "pldKey" naming doesn't make sense, but cannot be changed for
        // compatibility reasons (it's a relict from the past)
        pldKey: secrets.cryptKeyJson
      })
    }
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
        history: new History(this.cx),
        depot: new Depot(this.cx, core.depotId)
      })
      this.cx.depot.setBxpSts('clearRun')
      this.cx.depot.watchBxp()
    }
    return true
  }

  async login (userId, cryptId) {
    this.clear()
    let pld
    try {
      pld = await this.rqst({ url: 'user' }, userId)
    } catch (e) {
      let emsg, sts
      if (e.sts === 404) {
        emsg = 'Invalid identifier/crypto-key combination'
        sts = 404
      } else if (e.sts >= 400 && e.sts < 500) {
        emsg = 'Invalid identifier/crypto-key combination'
        sts = 400
      } else {
        emsg = 'Login failed temporary: Please try again later'
        sts = e.sts
      }
      throw this.err(emsg, { e, sts })
    }
    let user, secrets
    try {
      secrets = await this.toSecrets(userId, cryptId)
    } catch (e) {
      throw this.err('Login failed. Please try again later', { e, sts: 900 })
    }
    try {
      user = await this.decrypt(pld.data, secrets)
    } catch (e) {
      throw this.err('Invalid identifier/crypto-key combination', { e, sts: 400 })
    }
    this.init(secrets, user.depotId, user)
  }

  async register (userId, cryptId, coin0, coin1, locale) {
    let secrets
    try {
      secrets = await this.toSecrets(userId, cryptId)
    } catch (e) {
      let emsg = 'Registering failed: Please reload page and try again'
      throw this.err(emsg, { e })
    }
    const depotId = __.uuid()
    const pld = {
      _id: userId,
      data: await this.encrypt({
        _id: userId,
        _t: __.getTme(),
        coins: [coin0, coin1],
        locale,
        depotId
      }, secrets)
    }
    try {
      await this.rqst({ url: 'user', data: pld }, userId)
    } catch (e) {
      const emsg = 'Registering failed temporary: Please press OK and try ' +
                   'again with the new assigned identifier and crypto-key. ' +
                   'Please note: This error is almost always caused by a ' +
                   'missing network connection - If you have currently a ' +
                   'mobile connection: Please repeat the registration ' +
                   'process at home while beeing connected to your WLAN ' +
                   'network. Thank you.'
      const sts = (e.sts >= 400 && e.sts < 500) ? 400 : e.sts
      throw this.err(emsg, { e, sts })
    }
    this.init(secrets, depotId)
  }
}
