import * as mo from 'moment'
import {SrvBase} from '../Lib'
import __ from '../../util'

export default class Btc extends SrvBase {
  constructor (pa) {
    super('btc', pa)
    this.srvs = ['bckinfo']
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
        limit: 100
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
