import {ApiBase} from './Lib'
import __ from '../util'

export default class Addr extends ApiBase {
  constructor (cx, _id) {
    super('addr', cx, _id, cx.depot)
    this._save = this._save.bind(this)
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this._apiSet = this._apiSet.bind(this)
    this._apiDel = this._apiDel.bind(this)
    this.getTsc = this.getTsc.bind(this)
    this.toAddr = this.toAddr.bind(this)
    this.toTsc = this.toTsc.bind(this)
  }

  async _save (upd, addr) {
    return this.toAddr(upd, addr)
  }

  async _load (addr) {
    const coins = (await this.cx.user.load()).coins
    const rate = await this.cx.rate.load()
    addr.rates = {}
    for (let coin of coins) {
      addr.rates[coin] = await this.cx.rate.getRate(addr.coin, coin, rate)
    }
    return addr
  }

  async _apiGet () {
    const pld = await this.rqst({
      url: `address/${this._id}`
    })
    const addr = this.decrypt(pld.data)
    addr.tscs = []
    for (let tscPld of pld.tscs) addr.tscs.push(this.decrypt(tscPld))
    return addr
  }

  async _apiSet (addr) {
    const tscs = addr.tscs || []
    let encTscs = []
    for (let tsc of tscs) encTscs.push(this.encrypt(tsc))
    delete addr.tscs  // pld needs separated addr and tscs
    await this.rqst({
      url: `address/${addr._id}`,
      data: {
        _id: addr._id,
        data: this.encrypt(addr),
        type: addr.type,
        tscs: encTscs
      }
    })
    addr.tscs = tscs
  }

  async _apiDel (addr) {
    await this.rqst({
      method: 'delete',
      url: `address/${addr._id}`
    })
  }

  async getTsc (tscId, addr) {
    addr = addr || await this.load()
    const tscs = addr.tscs.filter(tsc => tsc._id === tscId)
    if (tscs.length !== 1) {
      throw __.err('Transaction not found', {
        dmsg: `Tsc ${tscId} not found in addr ${addr._id}`,
        sts: 404,
        addr
      })
    }
    return tscs[0]
  }

  toAddr (upd, cur) {
    cur = cur || {}
    upd = upd || {}
    const addr = {
      _id: this._id,
      _t: __.getTme(),
      type: upd.type || cur.type || 'std',
      desc: (upd.desc || cur.desc || '').trim(),
      amnt: __.getAmnt(upd.amnt, cur.amnt),
      tscCnt: upd.tscCnt || cur.tscCnt || 0,
      coin: upd.coin || cur.coin,
      rates: upd.rates || cur.rates || {},
      name: upd.name || cur.name,
      tags: upd.tags || cur.tags || []
    }
    const coinObj = this.coinObjs[addr.coin]
    const bxp = upd.bxp || cur.bxp
    if (bxp) addr.bxp = bxp
    const hsh = upd.hsh || cur.hsh
    addr.name = addr.name ||
                `${__.cfg('newAddrNotice')} ${__.shortn(hsh, 7).trim()}`
    if (hsh) {
      addr.hsh = coinObj.toAddrHsh(hsh)
      addr.type = coinObj.isHdAddr(addr.hsh) ? 'hd' : 'std'
    } else {
      addr.type = 'man'
    }
    if (addr.type === 'hd') {
      if (!cur.hd) cur.hd = {}
      if (!upd.hd) upd.hd = {}
      addr.hd = {
        isMstr: upd.hd.isMstr != null ? upd.hd.isMstr : cur.hd.isMstr,
        addrType: upd.hd.addrType || cur.hd.addrType,
        basePath: upd.hd.basePath || cur.hd.basePath,
        baseAbsPath: upd.hd.baseAbsPath || cur.hd.baseAbsPath
      }
    }
    upd.tscs = upd.tscs || []
    const updTscs = new Map(
      upd.tscs.map(upd => [coinObj.toTscHsh(upd.hsh), upd])
    )
    const tscs = new Map()
    for (let tsc of (cur.tscs || [])) {
      tsc = this.toTsc(addr.coin, updTscs.get(tsc.hsh), tsc)
      updTscs.delete(tsc.hsh)
      tscs.set(tsc.hsh, tsc)
    }
    for (let tsc of updTscs.values()) {
      tsc._id = __.uuid()
      tsc = this.toTsc(addr.coin, tsc)
      tscs.set(tsc.hsh, tsc)
    }
    addr.tscs = __.struc(tscs, {byTme: true, max: __.cfg('maxTscCnt')})
    return addr
  }

  toTsc (coin, upd, cur) {
    cur = cur || {}
    upd = upd || {}
    const hsh = upd.hsh || cur.hsh
    const tsc = {
      _id: upd._id || cur._id || __.uuid(),
      _t: upd._t || cur._t,
      hsh,
      amnt: __.getAmnt(upd.amnt, cur.amnt),
      cfmCnt: upd.cfmCnt || cur.cfmCnt || -1,
      mode: upd.mode || cur.mode,
      name: upd.name || cur.name ||
            `${__.cfg('newTscNotice')} ${__.shortn(hsh, 7).trim()}`,
      desc: upd.desc || cur.desc || '',
      tags: upd.tags || cur.tags || []
    }
    if (upd.hd || cur.hd) {
      cur.hd = cur.hd || {}
      upd.hd = upd.hd || {}
      tsc.hd = {addrHshs: upd.hd.addrHshs || cur.hd.addrHshs}
    }
    return tsc
  }
}
