import {ApiBase} from './Lib'
import __ from '../util'
import BtcSrv from './srv/Btc'

export default class Addr extends ApiBase {
  constructor (cx, _id) {
    super('addr', cx, _id, cx.depot)
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this._apiSet = this._apiSet.bind(this)
    this._apiDel = this._apiDel.bind(this)
    this.getTsc = this.getTsc.bind(this)
    this.initSrv = this.initSrv.bind(this)
    this.updateBySrv = this.updateBySrv.bind(this)
    this.updateTscs = this.updateTscs.bind(this)
    this.apiGetAddrBySrv = this.apiGetAddrBySrv.bind(this)
    this.apiGetTscsBySrv = this.apiGetTscsBySrv.bind(this)
    this.info('Created')
  }

  async _load (addr) {
    const coins = (await this.cx.user.load()).coins
    const rate = await this.cx.rate.load()
    addr.rates = new Map()
    for (let coin of coins) {
      addr.rates.set(coin, await this.cx.rate.getRate(addr.coin, coin, rate))
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

  async updateTscs (updTscs, addr) {
    addr = addr || await this.load()
    updTscs = new Map(updTscs.map((it) => [it._id, it])) // convert to Map
    const tscs = []
    for (let tsc of addr.tscs) {
      let updTsc = updTscs.get(tsc._id)
      if (updTsc) {
        updTscs.delete(tsc._id)
        Object.assign(tsc, updTsc)
      }
      tscs.push(tsc)
    }
    for (let tsc of updTscs.values()) {
      if (!tsc.name) tsc.name = `${tsc._id.slice(0, __.cfg('maxLow') - 3)}...`
      if (!tsc.desc) tsc.desc = ''
      if (!tsc.tags) tsc.tags = []
      tscs.push(tsc)
    }
    addr.tscs = __.struc(tscs, {byTme: true})
    return addr
  }

  async initSrv (addr) {
    if (!this.srv) {
      const srv = (addr || await this.load()).coin.toLowerCase()
      const srvs = {
        btc: BtcSrv
      }
      this.srv = new srvs[srv](this)
    }
  }

  async updateBySrv (addr) {
    addr = addr || await this.load()
    if (!__.isOutdated(addr._t)) return
    let tscs
    ;[addr, tscs] = await Promise.all([
      this.apiGetAddrBySrv(addr),
      this.apiGetTscsBySrv(addr)
    ])
    addr = await this.updateTscs(tscs, addr)
    addr._t = __.getTme()
    await this.save(addr)
    this.info(`${addr._id} and ${tscs.length} tscs updated by service`)
  }

  async apiGetAddrBySrv (addr) {
    addr = addr || await this.load()
    await this.initSrv(addr)
    const pld = await this.srv.run('addr', addr, 'Getting address failed')
    addr.amnt = pld.amnt
    return addr
  }

  async apiGetTscsBySrv (addr) {
    addr = addr || await this.load()
    await this.initSrv(addr)
    const pld = await this.srv.run('tscs', addr, 'Getting transactions failed')
    return pld
  }
}
