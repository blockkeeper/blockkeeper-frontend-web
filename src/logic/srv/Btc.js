import * as mo from 'moment'
import {SrvBase} from '../Lib'
import __ from '../../util'

export default class Btc extends SrvBase {
  constructor (pa, whiteSrvs) {
    super('btc', pa)
    this.whiteSrvs = whiteSrvs
    this.srvs = ['bckex']
    this.bckexAddr = this.bckexAddr.bind(this)
    this.bckexTscs = this.bckexTscs.bind(this)
    this.info('Created')
  }

  async bckexAddr (addr) {
    const req = {url: `https://blockexplorer.com/api/addr/${addr.hsh}`}
    const pld = await __.rqst(req, 'bckex-addr')
    return {amnt: pld.balanceSat + pld.unconfirmedBalanceSat}
  }

  async bckexTscs (addr) {
    const req = {url: `https://blockexplorer.com/api/txs?address=${addr.hsh}`}
    const pld = await __.rqst(req, 'bckex-tscs')
    const tscs = []
    for (let tsc of pld.txs) {
      let inAddrs = new Set()
      let hshInVin = false
      for (let vin of tsc.vin) {
        inAddrs.add(vin.addr)
        if (vin.addr === addr.hsh) hshInVin = true
      }
      let outAddrs = new Set()
      let amnt = 0
      for (let vout of tsc.vout) {
        for (let outAddr of ((vout.scriptPubKey || {}).addresses || [])) {
          if (!hshInVin || (outAddr !== addr.hsh)) {
            outAddrs.add(outAddr)
            amnt += __.vld.toFloat(String(vout.value || 0))
          }
        }
      }
      tscs.push({
        _id: tsc.txid,
        _t: mo.unix(tsc.time).format(),
        fee: __.vld.toFloat(String(tsc.fees || 0)),
        cnfs: __.vld.toInt(String(tsc.confirmations || 0)),
        amnt,
        inAddrs: __.struc(Array.from(inAddrs), {toBeg: addr.hsh}),
        outAddrs: __.struc(Array.from(outAddrs), {toBeg: addr.hsh})
      })
    }
    return tscs
  }
}
