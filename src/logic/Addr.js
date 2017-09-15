import {ApiBase} from './Lib'
import __ from '../util'

export default class Addr extends ApiBase {
  constructor (cx, _id) {
    super('addr', cx, _id, cx.depot)
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this._apiSet = this._apiSet.bind(this)
    this._apiDel = this._apiDel.bind(this)
    this.getTsc = this.getTsc.bind(this)
    this.saveTsc = this.saveTsc.bind(this)
    this.info('Created')
  }

  async _load (addr) {
    const coins = (await this.cx.user.load()).coins
    const rate = await this.cx.rate.load()
    addr.rates = new Map()
    for (let coin of coins) {
      addr.rates.set(coin, await this.cx.rate.getRate(addr.coin, coin, rate))
    }
    for (let tsc of addr.tscs) {
      tsc.addrId = addr._id
      tsc.coin = addr.coin
      tsc.rates = addr.rates
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
      data: {_id: addr._id, data: this.encrypt(addr), tscs: tscs}
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

  async saveTsc (tscId, upd, addr) {
    addr = addr || await this.load()
    let newTsc
    const tscs = []
    for (let tsc of addr.tscs) {
      if (tsc._id === tscId) {
        Object.assign(tsc, upd)
        newTsc = tsc
      }
      tscs.push(tsc)
    }
    if (!newTsc) {
      throw __.err('Transaction not found', {
        dmsg: `Tsc ${tscId} not found in addr ${addr._id}`,
        sts: 404,
        addr
      })
    }
    addr.tscs = tscs
    await this.save(addr)
    return {addr, tsc: newTsc}
  }
}
