import {BckcyphBxpBase} from './Lib'

export default class EthCoin extends BckcyphBxpBase {
  constructor (pa) {
    super('eth', pa)
    this.conv = val => val / 1e18   // wei to eth
    this.toHsh = hsh => hsh.replace(/^0x/, '')
    this.info('Created')
  }
}
