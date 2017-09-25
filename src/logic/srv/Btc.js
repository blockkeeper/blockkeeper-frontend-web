import * as mo from 'moment'
import {SrvBase} from '../Lib'
import __ from '../../util'

export default class Btc extends SrvBase {
  constructor (pa, whiteSrvs) {
    super('btc', pa)
    this.whiteSrvs = whiteSrvs
    this.srvs = ['bckinfo']   // ['bckinfo', 'bckex']
    this.bckinfoAddr = this.bckinfoAddr.bind(this)
    this.bckinfoTscs = this.bckinfoTscs.bind(this)
    this.bckexAddr = this.bckexAddr.bind(this)
    this.bckexTscs = this.bckexTscs.bind(this)
    this.info('Created')
  }

  // --------------------------------------------------------------------------
  // https://blockchain.info/api/blockchain_api
  // --------------------------------------------------------------------------

  async bckinfoAddr (addr) {
    const req = {
      // https://blockchain.info/rawaddr/... doesn't support cors
      url: 'https://blockchain.info/de/multiaddr',
      params: {cors: true, active: addr.hsh}
    }
    const pld = await __.rqst(req, 'bckinfo-addr-tscs')
    const tscs = []
    for (let tsc of pld.txs) {
      let mode
      let amnt = 0
      let inAddrs = new Set()
      for (let inp of tsc.inputs) {
        inAddrs.add(inp.prev_out.addr)
        if (inp.prev_out.addr === addr.hsh) {
          mode = 'snd'
          amnt = __.toFloat(inp.prev_out.value)
        }
      }
      let outAddrs = new Set()
      for (let outp of tsc.out) {
        outAddrs.add(outp.addr)
        if (outp.addr === addr.hsh) {
          if (mode === 'snd') {
            amnt -= __.toFloat(outp.value)  // change value
          } else {
            mode = 'rcv'
            amnt = __.toFloat(outp.value)
          }
        }
      }
      if (mode) {
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
      } else {
        this.warn('Getting tsc mode failed: Ignoring this tsc', tsc)
      }
    }
    return {
      amnt: __.toFloat(pld.addresses[0].final_balance) * 0.00000001,
      tscs
    }
  }

  async bckinfoTscs (addr) {
    // handled by bckinfoAddr()
  }

  // --------------------------------------------------------------------------
  // https://blockexplorer.com/api-ref
  // --------------------------------------------------------------------------

  /*
  async bckexAddr (addr) {
    const req = {url: `https://blockexplorer.com/api/addr/${addr.hsh}`}
    const pld = await __.rqst(req, 'bckex-addr')
    return {amnt: pld.balance + pld.unconfirmedBalance}
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
        for (let outAddr of vout.scriptPubKey.addresses) {
          if (!hshInVin || (outAddr !== addr.hsh)) {
            outAddrs.add(outAddr)
            amnt += __.toFloat(vout.value)
          }
        }
      }
      tscs.push({
        _id: tsc.txid,
        _t: mo.unix(tsc.time).format(),
        fee: __.toFloat(tsc.fees),
        amnt,
        inAddrs: __.struc(Array.from(inAddrs), {toBeg: addr.hsh}),
        outAddrs: __.struc(Array.from(outAddrs), {toBeg: addr.hsh})
        // cnfs: __.vld.toInt(String(tsc.confirmations))
      })
    }
    return tscs
  }
  */
}
