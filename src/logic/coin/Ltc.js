import {BckcyphBxpBase} from './Lib'

export default class LtcCoin extends BckcyphBxpBase {
  constructor (pa) {
    super('ltc', pa)
    this.conv = val => val / 1e8   // satoshi to ltc
    this.info('Created')
  }
}
