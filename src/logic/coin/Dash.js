import {BckcyphBxpBase} from './Lib'

export default class EthCoin extends BckcyphBxpBase {
  constructor (pa) {
    super('dash', pa)
    this.conv = val => val / 1e8
    this.info('Created')
  }
}
