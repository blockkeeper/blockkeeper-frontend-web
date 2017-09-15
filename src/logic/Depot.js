import {ApiBase} from './Lib'
import Addr from './Addr'
import __ from '../util'

export default class Depot extends ApiBase {
  constructor (cx, _id) {
    super('depot', cx, _id, cx.user)
    this.getBlc = this.getBlc.bind(this)
    this.loadAddrs = this.loadAddrs.bind(this)
    this.loadAddrIds = this.loadAddrIds.bind(this)
    this.apiGetAddrs = this.apiGetAddrs.bind(this)
    this.info('Created')
  }

  getBlc (items) {
    // items can be addrs or tscs
    const blcs = new Map()
    for (let item of items) {
      for (let [coin, rate] of item.rates) {
        blcs.set(coin, (blcs.get(coin) || 0) + (item.amnt * rate))
      }
    }
    return blcs
  }

  async saveNewAddr (hshMode, pld) {
    const addrObj = new Addr(this.cx)
    const addr = {
      _id: addrObj._id,
      _t: __.getTme(),
      hsh: null,
      name: (pld.name || '').trim(),
      desc: (pld.desc || '').trim(),
      amnt: __.vld.toFloat(String(pld.amnt || '0')),
      coin: pld.coin,
      tscs: []
    }
    if (hshMode) {
      addr.hsh = pld.hsh.trim()
      addr.name = addr.name || addr.hsh.slice(0, __.cfg('maxLow'))
    }
    await addrObj.save(addr)
    return addr
  }

  async loadAddrs (addrIds) {
    const stoAddrIds = await this.loadAddrIds()
    if (addrIds) {
      addrIds.filter(addrId => stoAddrIds.some(_id => addrId === _id))
    } else {
      addrIds = stoAddrIds
    }
    const addrs = []
    let tscs = []
    for (let addrId of addrIds) {
      try {
        let addr = await (new Addr(this.cx, addrId)).load()
        addrs.push(addr)
        tscs = tscs.concat(addr.tscs)
      } catch (e) {
        throw this.err(
          'Loading addresses failed',
          {dmsg: `Loading ${addrId} failed`, e, addrIds}
        )
      }
    }
    this.info('%s addrs with %s tscs loaded', addrs.length, tscs.length)
    return {addrs, tscs}
  }

  async loadAddrIds () {
    let addrIds = __.getStoIds('addr')
    try {
      addrIds = (addrIds.length > 0) ? addrIds : await this.apiGetAddrs()
    } catch (e) {
      if (e.sts !== 404) throw e
      addrIds = []
    }
    return addrIds
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
