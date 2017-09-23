import __ from '../util'

class Base {
  constructor (name, cx, _id, pa) {
    if (cx) this.cx = cx
    Object.assign(this, __.init('logic', name, _id, pa))
  }
}

class SrvBase extends Base {
  constructor (name, pa) {
    super(name, undefined, undefined, pa)
    this.get = this.get.bind(this)
    this.run = this.run.bind(this)
  }

  get (ilk) {
    const srvs = []
    for (let srv of this.srvs) {
      if (!this.whiteSrvs || this.whiteSrvs.includes(srv)) {
        // e.g. ilk = addr => this.bckexAddr, ilk = tscs => this.bckexTscs
        srvs.push(this[`${srv}${__.cap(ilk)}`])
      }
    }
    return srvs
  }

  async run (ilk, data, emsg) {
    const srvs = this.get(ilk)
    const errs = []
    try {
      let pld
      while (!pld && srvs.length > 0) {
        let srvFunc = __.rndPop(srvs)
        pld = await srvFunc(data)
        return pld
      }
    } catch (e) {
      errs.push(e)
    }
    throw __.err(
      emsg,
      {dmsg: `Running ${errs.length} srvs failed`, sts: 610, errs, data}
    )
  }
}

class StoBase extends Base {
  constructor (name, cx, _id, pa) {
    super(name, cx, _id, pa)
    this.getSto = () => __.getJsonSto(this._store)
    this.setSto = pld => __.setJsonSto(this._store, pld)
    this.delSto = () => __.delSto(this._store)
  }
}

class ApiBase extends StoBase {
  constructor (name, cx, _id, pa) {
    super(name, cx, _id, pa)
    this._save = this._save.bind(this)
    this.save = this.save.bind(this)
    this.load = this.load.bind(this)
    this.apiGet = this.apiGet.bind(this)
    this.apiSet = this.apiSet.bind(this)
    this.apiDel = this.apiDel.bind(this)
    this.encrypt = this.cx.core.encrypt
    this.decrypt = this.cx.core.decrypt
  }

  async _save (pld, upd, data) {
    Object.assign(pld, upd || {})
    return pld
  }

  async save (upd, data) {
    data = data || {}
    let pld
    try {
      pld = this.getSto() || {}
      pld = await this._save(pld, upd, data) || pld
      await this.apiSet(pld, data)
    } catch (e) {
      this.warn('Saving failed')
      throw e
    }
    this.info('Saved')
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
    this.info('Loaded')
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
    this.info('Deleted')
  }

  async apiGet (data) {
    data = data || {}
    let pld
    try {
      pld = await this._apiGet(data)
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

  async apiSet (pld, data) {
    data = data || {}
    pld = pld || this.getSto()
    try {
      pld = await this._apiSet(pld, data) || pld
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

  async apiDel (data) {
    data = data || {}
    const pld = this.getSto()
    try {
      await this._apiDel(pld, data)
      this.delSto(pld._id)
    } catch (e) {
      throw this.err(e.message, {
        e: e,
        dmsg: `Api-Delete ${this._type[1]} failed`
      })
    }
    this.info('Api-Delete %s finished', this._type[1])
    return pld
  }
}

export {
  Base,
  SrvBase,
  StoBase,
  ApiBase
}
