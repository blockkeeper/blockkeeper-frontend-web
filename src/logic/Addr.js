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
    this.info('Created')
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
    const pld = await __.rqst({
      url: `${__.cfg('apiUrl')}/address/${this.cx.user._id}/${this._id}`
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
    await __.rqst({
      url: `${__.cfg('apiUrl')}/address/${this.cx.user._id}/${addr._id}`,
      data: {_id: addr._id, data: this.encrypt(addr), tscs: encTscs}
    })
    addr.tscs = tscs
  }

  async _apiDel (addr) {
    await __.rqst({
      method: 'delete',
      url: `${__.cfg('apiUrl')}/address/${this.cx.user._id}/${addr._id}`
    })
  }

  async getTsc (tscId, addr) {
    // get tsc by ID
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
    const getAmnt = (ua, ca) => __.toFloat(ua != null ? ua : (ca || 0))
    cur = cur || {}
    upd = upd || {}
    const addr = {
      _id: this._id,
      _t: __.getTme(),
      desc: (upd.desc || cur.desc || '').trim(),
      amnt: getAmnt(upd.amnt, cur.amnt),
      rcvAmnt: getAmnt(upd.rcvAmnt, cur.rcvAmnt),
      sndAmnt: getAmnt(upd.sndAmnt, cur.sndAmnt),
      tscCnt: upd.tscCnt || cur.tscCnt || 0,
      coin: upd.coin || cur.coin,
      rates: upd.rates || cur.rates || {},
      name: upd.name || cur.name,
      tags: upd.tags || cur.tags || []
    }
    const toHsh = hsh => this.coins[addr.coin].toHsh(hsh.trim())
    const hsh = upd.hsh || cur.hsh
    if (hsh) {
      addr.hsh = toHsh(hsh)
      addr.name = (addr.name || __.shortn(addr.hsh)).trim()
    } else {
      addr.name = (addr.name || __.shortn(addr._id)).trim()
    }
    upd.tscs = upd.tscs || []
    const updTscs = new Map(upd.tscs.map((upd) => [toHsh(upd.hsh), upd]))
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
    addr.tscs = __.struc(tscs, {byTme: true, max: __.cfg('mxTscCnt')})
    return addr
  }

  toTsc (coin, upd, cur) {
    const getAmnt = (ua, ca) => __.toFloat(ua != null ? ua : (ca || 0))
    const toDesc = (action, tsc) => {
      let desc = [{
        [action]: tsc.amnt
      }]
      if (tsc.sndAmnt && tsc.rcvAmnt) {
        desc.push({
          snd: tsc.sndAmnt,
          rcv: tsc.rcvAmnt
        })
      }
      return desc
    }
    cur = cur || {}
    upd = upd || {}
    const hsh = upd.hsh || cur.hsh
    const tsc = {
      _id: upd._id || cur._id,
      _t: upd._t || cur._t,
      hsh,
      amnt: getAmnt(upd.amnt, cur.amnt),
      rcvAmnt: getAmnt(upd.rcvAmnt, cur.rcvAmnt),
      sndAmnt: getAmnt(upd.sndAmnt, cur.sndAmnt),
      cfmCnt: upd.cfmCnt || cur.cfmCnt || 0,
      mode: upd.mode || cur.mode,
      name: upd.name || cur.name || __.shortn(hsh),
      desc: upd.desc || cur.desc || '',
      tags: upd.tags || cur.tags || []
    }
    if (tsc.mode === 'rcv') {
      tsc.amntDesc = toDesc(tsc.mode, tsc, coin)
    } else if (tsc.mode === 'snd') {
      tsc.amntDesc = toDesc(tsc.mode, tsc, coin)
    } else {
      tsc.amntDesc = ['Unknown (not yet fetched)']
    }
    return tsc
  }
}
