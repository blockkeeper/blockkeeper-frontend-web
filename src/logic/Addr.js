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
    this._toTsc = this._toTsc.bind(this)
    this.getTsc = this.getTsc.bind(this)
    this.toAddr = this.toAddr.bind(this)
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
    const pld = await this.rqst({url: `address/${this._id}`})
    const addr = await this.decrypt(pld.data)
    addr.tscs = []
    for (let tscPld of pld.tscs) addr.tscs.push(await this.decrypt(tscPld))
    return addr
  }

  async _apiSet (addr) {
    const tscs = addr.tscs || []
    let encTscs = []
    for (let tsc of tscs) encTscs.push(await this.encrypt(tsc))
    delete addr.tscs // pld needs separated addr and tscs
    const data = await this.encrypt(addr)
    await this.rqst({
      url: `address/${addr._id}`,
      data: {
        _id: addr._id,
        type: addr.type,
        tscs: encTscs,
        data
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

  _toTsc (upd, cur) {
    cur = cur || {}
    upd = upd || {}
    const hsh = upd.hsh || cur.hsh
    const tsc = {
      _id: upd._id || cur._id || __.uuid(),
      _t: upd._t || cur._t,
      hsh,
      amnt: __.getAmnt(upd.amnt, cur.amnt),
      mode: upd.mode || cur.mode,
      cfmCnt: upd.cfmCnt || cur.cfmCnt || -1,
      tags: upd.tags || cur.tags || [],
      name: upd.name || cur.name ||
            `${__.cfg('newTscNotice')} ${__.shortn(hsh, 5).trim()}`,
      desc: (
        upd.desc != null ? upd.desc : (cur.desc != null ? cur.desc : '')
      ).trim()
    }
    if (upd.hd || cur.hd) {
      tsc.hd = upd.hd || cur.hd
      tsc.hd.addrHshs = {
        ext: [...tsc.hd.snd.addrHshs.ext, ...tsc.hd.rcv.addrHshs.ext],
        chg: [...tsc.hd.snd.addrHshs.chg, ...tsc.hd.rcv.addrHshs.chg]
      }
    }
    if (upd.std || cur.std) tsc.std = upd.std || cur.std
    return tsc
  }

  toAddr (upd, cur) {
    upd = upd || {}
    cur = cur || {}
    const addr = {
      _id: this._id,
      _t: __.getTme(),
      amnt: __.getAmnt(upd.amnt, cur.amnt),
      tscCnt: upd.tscCnt || cur.tscCnt || 0,
      coin: upd.coin || cur.coin,
      rates: upd.rates || cur.rates || {},
      tags: upd.tags || cur.tags || [],
      name: upd.name || cur.name,
      desc: (
        upd.desc != null ? upd.desc : (cur.desc != null ? cur.desc : '')
      ).trim()
    }
    if (upd.hd || cur.hd) addr.hd = upd.hd || cur.hd
    if (upd.std || cur.std) addr.std = upd.std || cur.std
    const coinObj = this.coinObjs[addr.coin]
    const bxp = upd.bxp || cur.bxp
    if (bxp) addr.bxp = bxp
    const hsh = upd.hsh || cur.hsh
    if (hsh) {
      addr.hsh = coinObj.toAddrHsh(hsh)
      addr.type = coinObj.isHdAddr(addr.hsh) ? 'hd' : 'std'
      addr.name = addr.name ||
                  `${__.cfg('newAddrNotice')} ${__.shortn(hsh, 5).trim()}`
    } else {
      addr.type = 'man'
    }
    if (addr.type === 'hd') {
      if (!cur.hd) cur.hd = {}
      if (!upd.hd) upd.hd = {}
      addr.hd = {
        basePath: upd.hd.basePath || cur.hd.basePath,
        baseAbsPath: upd.hd.baseAbsPath || cur.hd.baseAbsPath
      }
    }
    upd.tscs = upd.tscs || {}
    const tscs = new Map()
    for (let tsc of (cur.tscs || [])) {
      tsc = this._toTsc(upd.tscs[tsc.hsh], tsc)
      delete upd.tscs[tsc.hsh]
      tscs.set(tsc.hsh, tsc)
    }
    for (let tsc of Object.values(upd.tscs)) {
      tsc._id = __.uuid()
      tsc = this._toTsc(tsc)
      tscs.set(tsc.hsh, tsc)
    }
    addr.tscs = __.struc(tscs, {byTme: true, max: __.cfg('maxTscCnt')})
    return addr
  }

  async getTsc (tscId, addr) {
    addr = addr || await this.load()
    const tscs = addr.tscs.filter(tsc => tsc._id === tscId)
    if (tscs.length !== 1) {
      throw this.err('Transaction not found', {
        dmsg: `Tsc ${tscId} not found in addr ${addr._id}`,
        sts: 404,
        addr
      })
    }
    return tscs[0]
  }
}
