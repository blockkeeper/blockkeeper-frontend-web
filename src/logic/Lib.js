import __ from '../util'

class Base {
  constructor (name, cx, _id, pa, pld) {
    this.cx = cx
    Object.assign(this, __.init('logic', name, _id, pa))
    this.getSto = () => __.getJsonSto(this._store)
    this.setSto = pld => __.setJsonSto(this._store, pld)
    this.delSto = () => __.delSto(this._store)
    if (pld) this.setSto(pld)
    this._save = this._save.bind(this)
    this.save = this.save.bind(this)
    this.load = this.load.bind(this)
    this.apiGet = this.apiGet.bind(this)
    this.apiSet = this.apiSet.bind(this)
  }

  async _save (pld, upd) {
    Object.assign(pld, upd || {})
    return pld
  }

  async save (upd) {
    let pld
    try {
      pld = this.getSto()
      pld = await this._save(pld, upd) || pld
      await this.apiSet(pld)
    } catch (e) {
      this.warn('Saving failed')
      throw e
    }
    this.info('Saved')
    return pld
  }

  async load (pld) {
    try {
      pld = pld || this.getSto() || await this.apiGet()
      if (this._load) pld = await this._load(pld) || pld
    } catch (e) {
      this.warn('Loading failed')
      throw e
    }
    this.info('Loaded')
    return pld
  }

  async apiGet (secret) {
    let pld
    try {
      pld = await this._apiGet(secret || __.getSecSto())
      this.setSto(pld)
    } catch (e) {
      throw this.err(e.message, {
        e: e,
        dmsg: `Api-Get ${this._type[1]} failed`
      })
    }
    this.info('Api-Get %s finished', this._type[1])
    return pld
  }

  async apiSet (pld, secret) {
    pld = pld || this.getSto()
    try {
      await this._apiSet(pld, secret || __.getSecSto())
      this.setSto(pld)
    } catch (e) {
      throw this.err(e.message, {
        e: e,
        dmsg: `Api-Set ${this._type[1]} failed`
      })
    }
    this.info('Api-Set %s finished', this._type[1])
    return pld
  }
}

export {
  Base
}
