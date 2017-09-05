import {Base} from './Lib'
import __ from '../util'

export default class Addr extends Base {
  constructor (cx, _id) {
    super('addr', cx, _id, cx.depot)
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this.getTsc = this.getTsc.bind(this)
    this.info('Created')
  }

  async _load (addr) {
    const coins = (await this.cx.user.load()).coins
    const rates = await this.cx.rate.load()
    addr.rates = new Map()
    for (let coin of coins) {
      addr.rates.set(coin, this.cx.rate.get(addr.coin, coin, rates))
    }
    for (let tsc of addr.tscs) {
      tsc.addrId = addr._id
      tsc.coin = addr.coin
      tsc.rates = addr.rates
      const tags = []
      for (let tag of tsc.tags) tags.push('#' + tag)
      tsc.tags = tags
    }
    return addr
  }

  async _apiGet (secret) {
    if (this._id === 'simulateError') {
      throw __.err('Address not found', {sts: 404})
    }
    return await __.toMoPro({
      _id: this._id,
      _t: __.getTme(),
      hsh: `hash_${this._id.slice(0, 5)}`,
      name: `name_${this._id.slice(0, 5)}`,
      desc: 'A short description',
      coin: 'ETH',
      amnt: 20,
      tscs: [
        {
          _id: `t1${this._id.slice(0, 5)}`,
          _t: __.getTme(),
          sndHsh: `sndhash_t1${this._id.slice(0, 5)}`,
          rcvHsh: `rcvhash_t1${this._id.slice(0, 5)}`,
          amnt: 10,
          feeAmnt: 0.1,
          name: `name_t1${this._id.slice(0, 5)}`,
          desc: 'A short description',
          tags: ['tag_1-1', 'tag_1-2', 'tag_1-3', 'tag_1-4', 'tag_1-5']
        },
        {
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
      ]
    })
  }

  getTsc (addr, tscId) {
    const tscs = addr.tscs.filter(tsc => tsc._id === tscId)
    if (tscs.length !== 1) {
      throw __.err('Transaction not found', {
        dmsg: `${tscId} not found in ${addr}`,
        sts: 404
      })
    }
    return tscs[0]
  }
}
