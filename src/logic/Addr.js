import {ApiBase} from './Lib'
import __ from '../util'

export default class Addr extends ApiBase {
  constructor (cx, _id) {
    super('addr', cx, _id, cx.depot)
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
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

  async _apiGet (secret) {
    // mock
    const addr = {
      _id: this._id,
      _t: __.getTme(),
      hsh: `hash_${this._id.slice(0, 5)}`,
      name: `name_${this._id.slice(0, 5)}`,
      desc: 'A short description',
      coin: 'ETH',
      amnt: 20
    }
    const tsc0 = {
      _id: `t1${this._id.slice(0, 5)}`,
      _t: __.getTme(),
      sndHsh: `sndhash_t1${this._id.slice(0, 5)}`,
      rcvHsh: `rcvhash_t1${this._id.slice(0, 5)}`,
      amnt: 10,
      feeAmnt: 0.1,
      name: `name_t1${this._id.slice(0, 5)}`,
      desc: 'A short description',
      tags: ['tag_1-1', 'tag_1-2', 'tag_1-3', 'tag_1-4', 'tag_1-5']
    }
    const tsc1 = {
      _id: `t2${this._id.slice(0, 5)}`,
      _t: __.getTme(),
      sndHsh: `sndhash_t2${this._id.slice(0, 5)}`,
      rcvHsh: `rcvhash_t2${this._id.slice(0, 5)}`,
      amnt: 10,
      feeAmnt: 0.1,
      name: `name_t2${this._id.slice(0, 5)}`,
      desc: 'A short description',
      tags: ['tag_2-1', 'tag_2-2']
    }
    let pld = {
      data: this.encrypt(addr),
      tscs: [this.encrypt(tsc0), this.encrypt(tsc1)]
    }
    //
    pld = await __.toMoPro(pld, 750)
    return __.decrypt(pld)
  }

  async _apiSet (addr) {
    await __.toMoPro({}, 750)
  }

  async _apiDel (addr) {
    await __.toMoPro({}, 750)
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
