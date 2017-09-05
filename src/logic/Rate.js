import {Base} from './Lib'
import __ from '../util'

export default class Rate extends Base {
  constructor (cx) {
    super('rate', cx, '00095c08-0c1a-4ed4-b4b0-e0452e86e48b')
    this.delSto()  // we want always fresh rates
    this._apiGet = this._apiGet.bind(this)
    this.getRate = this.getRate.bind(this)
    this.getCoins = this.getCoins.bind(this)
    this.info('Created')
  }

  async _apiGet (secret) {
    // request parameters:
    //   secret               -> does user exists? (we don't want to be a
    //                           proxy for other services)
    //   type of data = rates -> desired resource type
    //
    // response:
    const rate = await __.toMoPro({
      _t: __.getTme(),
      pairs: {
        BTC_EUR: 3008.71,
        ETH_EUR: 255.33,
        BTC_USD: 3538.20,
        ETH_USD: 300.26,
        ETH_BTC: 0.071,
        BTC_ETH: 14.28
      }
    }, 1000, secret)
    // add 1-to-1 rates and coin list
    const coins = new Set()
    for (let pair of Object.keys(rate.pairs)) {
      const baseCoin = pair.split('_')[0]
      const quoteCoin = pair.split('_')[1]
      rate.pairs[`${baseCoin}_${baseCoin}`] = 1
      rate.pairs[`${quoteCoin}_${quoteCoin}`] = 1
      coins.add(baseCoin)
      coins.add(quoteCoin)
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
