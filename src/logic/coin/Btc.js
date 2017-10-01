import {BckcyphBxpBase} from './Lib'

export default class BtcBxp extends BckcyphBxpBase {
  constructor (pa) {
    super('btc', pa)
    this.conv = val => val / 1e8   // satoshi to btc
    this.info('Created')
  }
}
