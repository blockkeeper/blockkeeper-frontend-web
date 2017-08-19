import __ from '../util'

class Base {
  constructor (cx, _id, pa, pld) {
    this.cx = cx
    Object.assign(this, __.init('logic', this.constructor.name, _id, pa))
    this.stoGet = () => __.stoGetJson(this._store)
    this.stoSet = pld => __.stoSetJson(this._store, pld)
    this.stoDel = () => __.stoDel(this._store)
    if (pld) this.stoSet(pld)
    this.load = this.load.bind(this)
    this.apiGet = this.apiGet.bind(this)
    this.apiSet = this.apiSet.bind(this)
  }

  async load (pld, data) {
    try {
      pld = pld || this.stoGet() || await this.apiGet()
      if (this._load) {
        pld = await this._load(pld, data) || pld
      }
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
      pld = await this._apiGet(secret || __.stoGetSecret())
      this.stoSet(pld)
    } catch (e) {
      const err = this.err(e.message, {
        e: e,
        dmsg: `Api-Get ${this._type[1]} failed`
      })
      throw err
    }
    this.info('Api-Get %s finished', this._type[1])
    return pld
  }

  async apiSet (secret) {
    const pld = this.stoGet()
    try {
      await this._apiSet(secret || __.stoGetSecret(), pld)
    } catch (e) {
      const err = this.err(e.message, {
        e: e,
        dmsg: `Api-Set ${this._type[1]} failed`
      })
      throw err
    }
    this.info('Api-Set %s finished', this._type[1])
    return pld
  }
}

export {
  Base
}
