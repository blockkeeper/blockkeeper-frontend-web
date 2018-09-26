import { Btc, Ltc, Dash, Eth } from './Coin'
import __ from '../util'

class Base {
  constructor (name, cx, _id, pa) {
    if (cx) this.cx = cx
    Object.assign(this, __.init('logic', name, _id, pa))
  }
}

class StoBase extends Base {
  constructor (name, cx, _id, pa) {
    super(name, cx, _id, pa)
    this._store = this._type[1] + '_' + this._id
    this.getSto = () => __.getJsonSto(this._store)
    this.setSto = pld => __.setJsonSto(this._store, pld)
    this.delSto = () => __.delSto(this._store)
    this.rqst = this.rqst.bind(this)
  }

  async rqst (req, userId) {
    userId = userId || (this.cx.user || {})._id
    req.baseURL = __.cfg('apiUrl')
    req.headers = req.headers || {}
    // some operations need pseudo authentication
    if (userId) req.headers['X-User-Id'] = userId
    const pld = await __.rqst(req)
    return pld
  }
}

class ApiBase extends StoBase {
  constructor (name, cx, _id, pa) {
    super(name, cx, _id, pa)
    this.save = this.save.bind(this)
    this.load = this.load.bind(this)
    this.apiGet = this.apiGet.bind(this)
    this.apiSet = this.apiSet.bind(this)
    this.apiDel = this.apiDel.bind(this)
    this.encrypt = this.cx.core.encrypt
    this.decrypt = this.cx.core.decrypt
    this.coinObjs = {
      BTC: new Btc(this),
      LTC: new Ltc(this),
      ETH: new Eth(this),
      DASH: new Dash(this)
    }
  }

  async save (upd, data) {
    data = data || {}
    let pld = upd
    try {
      if (this._save) {
        pld = await this._save(upd, this.getSto() || {}, data) || upd
      }
      await this.apiSet(pld, data)
    } catch (e) {
      this.warn('Saving failed')
      throw e
    }
    // this.info('Saved')
    return pld
  }

  async load (pld, data) {
    data = data || {}
    try {
      pld = pld || this.getSto() || await this.apiGet(data)
      if (this._load) pld = await this._load(pld, data) || pld
    } catch (e) {
      this.warn('Loading failed')
      throw e
    }
    // this.info('Loaded')
    return pld
  }

  async delete (data) {
    data = data || {}
    try {
      const pld = this.getSto()
      if (this._delete) await this._delete(pld, data)
      await this.apiDel(pld, data)
    } catch (e) {
      this.warn('Deleting failed')
      throw e
    }
    // this.info('Deleted')
  }

  async apiGet (data) {
    data = data || {}
    let pld
    try {
      pld = await this._apiGet(data)
      this.setSto(pld)
    } catch (e) {
      throw this.err(e.message, { e, dmsg: `Api-Get ${this._type[1]} failed` })
    }
    // this.info('Api-Get %s finished', this._type[1])
    return pld
  }

  async apiSet (pld, data) {
    data = data || {}
    pld = pld || this.getSto()
    try {
      pld = await this._apiSet(pld, data) || pld
      this.setSto(pld)
    } catch (e) {
      throw this.err(e.message, { e, dmsg: `Api-Set ${this._type[1]} failed` })
    }
    // this.info('Api-Set %s finished', this._type[1])
    return pld
  }

  async apiDel (data) {
    data = data || {}
    const pld = this.getSto()
    try {
      await this._apiDel(pld, data)
      this.delSto(pld._id)
    } catch (e) {
      throw this.err(e.message, { e, dmsg: `Api-Delete ${this._type[1]} failed` })
    }
    // this.info('Api-Delete %s finished', this._type[1])
    return pld
  }
}

export {
  Base,
  StoBase,
  ApiBase
}
