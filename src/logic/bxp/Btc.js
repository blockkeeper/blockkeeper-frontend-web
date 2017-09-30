import * as mo from 'moment'
import {BxpBase} from '../Lib'
import __ from '../../util'

export default class BtcBxp extends BxpBase {
  constructor (pa) {
    super('btc', pa)
    this.srv = 'bckinfo'     // active services
    this.srvs = {            // all services
      bckinfo: {
        chunkSize: 2,
        sleepSec: 2
      }
    }
    this.bckinfo = this.bckinfo.bind(this)
    this.bckinfoTscs = this.bckinfoTscs.bind(this)
    this.info('Created')
  }

  // --------------------------------------------------------------------------
  // https://blockchain.info/api/blockchain_api
  // --------------------------------------------------------------------------

  async bckinfo (addrs) {
    const updAddrs = new Map()
    for (let addr of addrs) updAddrs.set(addr.hsh, {_id: addr._id})
    const req = {
      url: 'https://blockchain.info/de/multiaddr',
      params: {
        cors: true,
        active: Array.from(updAddrs.keys()).join('|'),
        limit: __.cfg('mxTscCnt')    // bckinfo max is 100
      }
    }
    const pld = await __.rqst(req, 'bckinfo-addr-tscs')
    for (let addr of pld.addresses) {
      let addrHsh = addr.address
      let updAddr = updAddrs.get(addrHsh)
      if (!updAddr) continue  // should not happen, but to be sure...
      updAddr.amnt = __.toFloat(addr.final_balance) * 0.00000001
      updAddr.tscs = this.bckinfoTscs(pld.txs, addrHsh)
    }
    return Array.from(updAddrs.values())
  }

  bckinfoTscs (txs, addrHsh) {
    // private method used by bckinfo()
    let tscs = []
    for (let tsc of txs) {
      let mode
      let amnt = 0
      let inAddrs = new Set()
      for (let inp of tsc.inputs) {
        inAddrs.add(inp.prev_out.addr)
        if (inp.prev_out.addr === addrHsh) {
          mode = 'snd'
          amnt = __.toFloat(inp.prev_out.value)
        }
      }
      let outAddrs = new Set()
      for (let outp of tsc.out) {
        outAddrs.add(outp.addr)
        if (outp.addr === addrHsh) {
          if (mode === 'snd') {
            amnt -= __.toFloat(outp.value)  // change value
          } else {
            mode = 'rcv'
            amnt = __.toFloat(outp.value)
          }
        }
      }
      if (mode) {  // else: tsc doesn't belong to this addr
        tscs.push({
          _t: mo.unix(tsc.time).format(),
          hsh: tsc.hash,
          fee: __.toFloat(tsc.fee) * 0.00000001,
          amnt: amnt * 0.00000001,
          mode,
          inAddrCnt: inAddrs.size,
          outAddrCnt: outAddrs.size
          // inAddrs: __.struc(Array.from(inAddrs), {toBeg: addr.hsh}),
          // outAddrs: __.struc(Array.from(outAddrs), {toBeg: addr.hsh})
        })
      }
    }
    return tscs
  }
}
