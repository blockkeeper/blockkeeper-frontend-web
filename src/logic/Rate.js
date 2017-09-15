import {ApiBase} from './Lib'
import __ from '../util'

export default class Rate extends ApiBase {
  constructor (cx) {
    super('rate', cx, '00095c08-0c1a-4ed4-b4b0-e0452e86e48b')
    this.delSto()  // we want always fresh rates at startup
    this._apiGet = this._apiGet.bind(this)
    this.getRate = this.getRate.bind(this)
    this.getCoins = this.getCoins.bind(this)
    this.info('Created')
  }

  async _apiGet () {
    const rate = await __.rqst({url: `${__.cfg('apiUrl')}/rates`})
    const coins = new Set()
    for (let pair of Object.keys(rate.pairs)) {
      coins.add(pair.split('_')[0])  // baseCoin
      coins.add(pair.split('_')[1])  // quoteCoin
    }
    rate.coins = Array.from(coins).sort()
    return rate
  }

  async getRate (baseCoin, quoteCoin, rate) {
    rate = rate || await this.load()
    const coip = __.getCoinPair(baseCoin, quoteCoin)
    if (rate.pairs[coip] == null) {
      throw this.err(`No rate for ${coip} available`, {rates: rate.pairs})
    }
    return rate.pairs[coip]
  }

  async getCoins (rate) {
    rate = rate || await this.load()
    return rate.coins
  }
}
