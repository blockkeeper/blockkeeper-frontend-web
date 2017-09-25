import {ApiBase} from './Lib'
import __ from '../util'
import BtcSrv from './srv/Btc'

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
    this.update = this.update.bind(this)
    this.srvs = {btc: BtcSrv}
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
    addr.tscs = tscs  // remerge addr and tscs
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

  async update (addr) {
    // update addr (and tscs) by block-explorer service
    addr = addr || await this.load()
    if (!__.cfg('isDev') && !__.isOutdated(addr._t)) {
      this.info('Skipping update: Addr is current')
      return
    }
    const srv = new this.srvs[addr.coin.toLowerCase()](this)
    let [updAddr, updTscs] = await Promise.all([
      srv.run('addr', addr, 'Getting address failed'),
      srv.run('tscs', addr, 'Getting transactions failed')
    ])
    updTscs = updAddr.tscs || updTscs // srv-run-tscs could be a dummy
    addr = this.toAddr({amnt: updAddr.amnt, tscs: updTscs}, addr)
    await this.save(addr)
    this.info(`Update addr ${addr._id} and ${addr.tscs.length} tscs finished`)
  }

  toAddr (upd, cur) {
    cur = cur || {}
    upd = upd || {}
    const addr = {
      _id: this._id,
      _t: __.getTme(),
      desc: (upd.desc || cur.desc || '').trim(),
      amnt: __.toFloat(upd.amnt != null ? upd.amnt : (cur.amnt || 0)),
      coin: upd.coin || cur.coin,
      rates: upd.rates || cur.rates || {},
      name: upd.name || cur.name
    }
    const hsh = upd.hsh || cur.hsh
    if (hsh) {
      addr.hsh = hsh.trim()
      addr.name = (addr.name || __.shortn(hsh)).trim()
    } else {
      addr.name = (addr.name || __.shortn(addr._id)).trim()
    }
    const updTscs = new Map((upd.tscs || []).map((upd) => [upd.hsh, upd]))
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
    addr.tscs = __.struc(tscs, {byTme: true})
    return addr
  }

  toTsc (coin, upd, cur) {
    // private method, called by toAddr
    cur = cur || {}
    upd = upd || {}
    const hsh = upd.hsh || cur.hsh
    const tsc = {
      _id: upd._id || cur._id,
      _t: upd._t || cur._t,
      hsh,
      fee: __.toFloat(upd.fee != null ? upd.fee : cur.fee),
      amnt: __.toFloat(upd.amnt != null ? upd.amnt : cur.amnt),
      mode: upd.mode || cur.mode,
      inAddrCnt: upd.inAddrCnt || cur.inAddrCnt,
      outAddrCnt: upd.outAddrCnt || cur.outAddrCnt,
      name: upd.name || cur.name || __.shortn(hsh),
      desc: upd.desc || cur.desc || '',
      tags: upd.tags || cur.tags || []
    }
    let desc = `${tsc.amnt} ${coin}`
    if (tsc.mode === 'rcv') {
      tsc.amntDesc = `${desc} received from ${tsc.inAddrCnt} address(es)`
    } else if (tsc.mode === 'snd') {
      tsc.amntDesc = `${desc} sent to ${tsc.outAddrCnt} address(es)`
      tsc.feeDesc = `${tsc.fee} ${coin}`
      if (tsc.inAddrCnt > 1) {
        tsc.feeDesc += ` (spread across ${tsc.inAddrCnt} addresses)`
      }
    } else {
      tsc.amntDesc = 'Unknown (not yet fetched)'
    }
    return tsc
  }
}
