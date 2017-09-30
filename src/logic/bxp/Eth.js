import * as mo from 'moment'
import {BxpBase} from '../Lib'
import __ from '../../util'

export default class BtcBxp extends BxpBase {
  constructor (pa) {
    super('eth', pa)
    this.srv = 'ethscan'     // active services
    this.srvs = {            // all services
      ethscan: {
        chunkSize: 20,
        sleepSec: 2
      }
    }
    this.factor = 0.000000000000000001
    this.ethscan = this.ethscan.bind(this)
    this.ethscanTsc = this.ethscanTsc.bind(this)
    this.info('Created')
  }

  // --------------------------------------------------------------------------
  // https://etherscan.io/apis#accounts
  // --------------------------------------------------------------------------

  async ethscan (addrs) {
    const updAddrs = new Map()
    for (let addr of addrs) updAddrs.set(addr.hsh, {_id: addr._id})
    const req = {
      url: 'https://api.etherscan.io/api',
      params: {
        module: 'account',
        action: 'balancemulti',
        tag: 'latest',
        address: Array.from(updAddrs.keys()).join(',')
      }
    }
    const pld = await __.rqst(req, 'ethscan-addrs')
    if (pld.message !== 'OK') throw __.err('Ethscan addr bxp failed')
    for (let item of pld.result) {
      let addrHsh = item.account
      let updAddr = updAddrs.get(addrHsh)
      if (!updAddr) continue  // should not happen, but to be sure...
      updAddr.amnt = __.toFloat(item.balance * this.factor)
    }
    for (let [addrHsh, updAddr] of updAddrs) {
      await __.sleep(750)  // gentle polling
      updAddr.tscs = await this.ethscanTsc(addrHsh)
    }
    this.debug(Array.from(updAddrs.values()))
    return Array.from(updAddrs.values())
  }

  async ethscanTsc (addrHsh, updAddr) {
    // private method used by ethscan()
    const req = {
      url: 'https://api.etherscan.io/api',
      params: {
        module: 'account',
        action: 'txlist',
        startblock: '0',
        endblock: '99999999',
        sort: 'desc',
        address: addrHsh
      }
    }
    const pld = await __.rqst(req, 'ethscan-tsc')
    if (pld.message !== 'OK') throw __.err('Ethscan addr bxp failed')
    const tscs = []
    for (let tsc of pld.result) {
      let mode
      if (tsc.from === addrHsh) mode = 'snd'
      if (tsc.to === addrHsh) mode = 'rcv'
      if (mode) {
        tscs.push({
          _t: mo.unix(tsc.timeStamp).format(),
          hsh: tsc.hash,
          fee: __.toFloat(tsc.gasUsed) * __.toFloat(tsc.gasPrice) * this.factor,
          amnt: __.toInt(tsc.value) * this.factor,
          inAddrCnt: 1,
          outAddrCnt: 1,
          mode
        })
        if (tscs.length >= __.cfg('mxTscCnt')) break
      }
    }
    return tscs
  }
}
