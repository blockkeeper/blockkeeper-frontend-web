import {ApiBase} from './Lib'
import Addr from './Addr'
import __ from '../util'

export default class Depot extends ApiBase {
  constructor (cx, _id) {
    super('depot', cx, _id, cx.user)
    this.getAddrBlc = this.getAddrBlc.bind(this)
    this.getTscBlc = this.getTscBlc.bind(this)
    this.loadAddrs = this.loadAddrs.bind(this)
    this.apiGetAddrs = this.apiGetAddrs.bind(this)
    this.info('Created')
  }

  getAddrBlc (addrs) {
    const blcs = new Map()
    for (let addr of addrs) {
      for (let coin of Object.keys(addr.rates)) {
        let rate = addr.rates[coin]
        blcs.set(coin, (blcs.get(coin) || 0) + (addr.amnt * rate))
      }
    }
    return blcs
  }

  getTscBlc (tscs, addr) {
    const blcs = new Map()
    for (let tsc of tscs) {
      for (let coin of Object.keys(addr.rates)) {
        let rate = addr.rates[coin]
        blcs.set(coin, (blcs.get(coin) || 0) + (tsc.amnt * rate))
      }
    }
    return blcs
  }

  async loadAddrs (addrIds) {
    let stoAddrIds = __.getStoIds('addr')
    try {
      stoAddrIds = (stoAddrIds.length > 0)
        ? stoAddrIds
        : await this.apiGetAddrs()
    } catch (e) {
      if (e.sts !== 404) throw e
      stoAddrIds = []
    }
    if (addrIds) {
      addrIds.filter(addrId => stoAddrIds.some(_id => addrId === _id))
    } else {
      addrIds = stoAddrIds
    }
    const addrs = []
    for (let addrId of addrIds) {
      try {
        let addr = await (new Addr(this.cx, addrId)).load()
        addrs.push(addr)
      } catch (e) {
        throw this.err(
          'Loading addresses failed',
          {dmsg: `Loading ${addrId} failed`, e, addrIds}
        )
      }
    }
    this.info('%s addrs loaded', addrs.length)
    return __.struc(addrs, {byTme: true})
  }

  async apiGetAddrs () {
    let pld
    try {
      pld = await __.rqst({
        url: `${__.cfg('apiUrl')}/address/${this.cx.user._id}`
      })
    } catch (e) {
      throw this.err(e.message, {e: e, dmsg: 'Api-Get addrs failed'})
    }
    const addrIds = []
    for (let item of pld.addresses) {
      let addr = this.decrypt(item.data)
      addr.tscs = []
      for (let tsc of item.tscs) {
        addr.tscs.push(this.decrypt(tsc))
      }
      (new Addr(this.cx, addr._id)).setSto(addr)
      addrIds.push(addr._id)
    }
    this.info('Api-Get addrs finished')
    return addrIds
  }
}
