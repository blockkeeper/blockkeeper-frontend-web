import * as mo from 'moment'
import {ApiBase} from './Lib'
import Addr from './Addr'
import __ from '../util'

export default class Depot extends ApiBase {
  constructor (cx, _id) {
    super('depot', cx, _id, cx.user)
    this.addrUpdErrIds = new Set()
    this.getBxpSto = () => __.getSto('bxp')
    this.setBxpSto = val => __.setSto('bxp', val)
    this.delBxpSto = () => __.delSto('bxp')
    this.getAddrBlc = this.getAddrBlc.bind(this)
    this.getTscBlc = this.getTscBlc.bind(this)
    this.loadAddrs = this.loadAddrs.bind(this)
    this.saveAddrs = this.saveAddrs.bind(this)
    this.apiGetAddrs = this.apiGetAddrs.bind(this)
    this.apiSetAddrs = this.apiSetAddrs.bind(this)
    this.getBxpSts = this.getBxpSts.bind(this)
    this.setBxpSts = this.setBxpSts.bind(this)
    this.watchBxp = this.watchBxp.bind(this)
    this.prepareBxp = this.prepareBxp.bind(this)
    this.bxp = this.bxp.bind(this)
    this.finishBxp = this.finishBxp.bind(this)
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

  getBxpSts () {
    let bxp = this.getBxpSto()
    if (!bxp) return 'ready'
    if (bxp === 'run') return 'run'
    return 'blocked'
  }

  setBxpSts (sts) {
    if (sts === 'clearRun') {
      if (this.getBxpSts() === 'run') this.delBxpSto()
      return
    }
    if (sts === 'blocked') {
      const tme = mo.utc().add(__.cfg('bxpBlockedSec'), 'seconds').format()
      this.setBxpSto(tme)
      this.info(`Bxp blocked until ${tme}`)
    } else if (sts === 'ready') {
      this.delBxpSto()
      this.info('Bxp ready')
    } else {  // run
      this.setBxpSto(sts)
    }
    try {  // function can be undefined (race condition)
      this.cx.tmp.bxpSts(sts)
    } catch (e) {}
  }

  watchBxp (sts) {
    if (sts) this.setBxpSts(sts)
    const bxp = this.getBxpSto()
    if (bxp && bxp !== 'run') {  // bxp is an iso date
      let lbl = `[watchBxp_${__.uuid().slice(0, 5)}]`
      let sec = mo.utc().diff(bxp, 'seconds')
      sec = (sec > 0) ? 0 : (sec * -1)
      setTimeout(() => {
        this.setBxpSts('ready')
        this.info(`${lbl}: Watcher stopped`)
      }, sec * 1000)
      this.info(`${lbl}: Bxp is blocked until ${bxp}: Watcher started`)
    } else {
      this.info('Bxp is ready: Skipping starting watcher')
    }
  }

  async prepareBxp (addrIds) {
    this.setBxpSts('run')
    this.info('Bxp started')
    let d = {addrsByType: undefined, curAddrs: {}}
    let addrs
    try {
      addrs = await this.loadAddrs(addrIds, {ignManType: true, skipStruc: true})
    } catch (e) {
      this.watchBxp('blocked')
      throw this.err('Bxp failed for all addrs: Loading addrs failed', {e})
    }
    if (addrs.length < 1) {
      this.watchBxp('blocked')
      return d
    }
    try {
      this.cx.rate.clear()
      await this.cx.rate.load()
    } catch (e) { /* messy but using cached values instead */ }
    this.addrUpdErrIds = new Set()
    d.addrsByType = {hd: {}, std: {}, man: {}}
    for (let addr of addrs) {
      let addrsByCoin = d.addrsByType[addr.type]
      if (!addrsByCoin[addr.coin]) addrsByCoin[addr.coin] = {}
      addrsByCoin[addr.coin][addr.hsh] = addr
      d.curAddrs[addr._id] = __.cloneDeep(addr)
    }
    return d
  }

  async bxp (addrIds) {  // bxp = query block explorer
    const {addrsByType, curAddrs} = await this.prepareBxp(addrIds)
    if (!addrsByType) return
    const addrs = []
    for (let addrType of Object.keys(addrsByType)) {
      let addrsByCoin = addrsByType[addrType]
      for (let coin of Object.keys(addrsByCoin)) {
        let updAddrs
        try {
          if (addrType === 'hd') {
            let bxp = this.coinObjs[coin].bxp.bckinfo
            let hdAddrs = await bxp.processHdAddrs(addrsByCoin[coin])
            updAddrs = hdAddrs.upd
          } else if (addrType === 'std') {
            let bxp = this.coinObjs[coin].bxp.bckcyph
            updAddrs = await bxp.apiGetAddrs(addrsByCoin[coin])
          } // else: "man" address: ignore
          for (let updAddr of Object.values(updAddrs)) {
            let addrObj = new Addr(this.cx, updAddr._id)
            addrs.push(addrObj.toAddr(updAddr, curAddrs[updAddr._id]))
          }
        } catch (e) {
          this.warn(`Bxp failed for ${addrType} addrs: ${e.message}`)
          for (let addr of Object.values(addrsByCoin[coin])) {
            this.addrUpdErrIds.add(addr._id)
          }
        }
      }
    }
    await this.finishBxp(addrs)
  }

  async finishBxp (addrs) {
    if (addrs.length > 0) {
      try {
        await this.saveAddrs(addrs)
      } catch (e) {
        this.warn(`Bxp failed for ${addrs.length} addrs: ${e.message}`)
        for (let addr of addrs) this.addrUpdErrIds.add(addr._id)
      }
    }
    this.info('Bxp finished')
    this.watchBxp('blocked')
    try {
      this.cx.tmp.bxp()
    } catch (e) { /* function can be undefined (race condition) */ }
  }

  async saveAddrs (addrs) {
    // addrs must be valid addrs created with Addr.toAddr()
    addrs = await this.apiSetAddrs(addrs)
    return addrs
  }

  async loadAddrs (addrIds, {ignManType, skipStruc} = {}) {
    let stoAddrIds = __.getStoIds('addr')
    try {
      stoAddrIds = (stoAddrIds.length > 0)
        ? stoAddrIds
        : await this.apiGetAddrs()
    } catch (e) {
      if (e.sts !== 404) throw e
      stoAddrIds = []
    }
    if (addrIds && addrIds.length > 0) {
      addrIds.filter(addrId => stoAddrIds.some(_id => addrId === _id))
    } else {
      addrIds = stoAddrIds
    }
    const addrs = []
    for (let addrId of addrIds) {
      try {
        let addr = await (new Addr(this.cx, addrId)).load()
        if (ignManType && addr.type === 'man') continue
        addrs.push(addr)
      } catch (e) {
        throw this.err(
          'Loading addresses failed',
          {dmsg: `Loading ${addrId} failed`, e, addrIds}
        )
      }
    }
    this.info('%s addrs loaded', addrs.length)
    return skipStruc ? addrs : __.struc(addrs, {byTme: true})
  }

  async apiGetAddrs () {
    let pld
    try {
      pld = await this.rqst({url: 'address'})
    } catch (e) {
      throw this.err(e.message, {e: e, dmsg: 'Api-Get addrs failed'})
    }
    const addrIds = []
    for (let item of pld.addresses) {
      let addr = await this.decrypt(item.data)
      addr.tscs = []
      for (let tsc of item.tscs) {
        addr.tscs.push(await this.decrypt(tsc))
      }
      (new Addr(this.cx, addr._id)).setSto(addr)
      addrIds.push(addr._id)
    }
    this.info('Api-Get addrs finished')
    return addrIds
  }

  async apiSetAddrs (addrs) {
    // addrs must be valid addrs created with toAddr()
    let pld = {addresses: []}
    for (let addr of addrs) {
      let tscs = addr.tscs || []
      let encTscs = []
      for (let tsc of tscs) encTscs.push(await this.encrypt(tsc))
      delete addr.tscs  // pld needs separated addr and tscs
      pld.addresses.push({
        _id: addr._id,
        data: await this.encrypt(addr),
        type: addr.type,
        tscs: encTscs
      })
      addr.tscs = tscs
    }
    try {
      await this.rqst({
        url: 'address',
        data: pld
      })
      for (let addr of addrs) (new Addr(this.cx, addr._id)).setSto(addr)
    } catch (e) {
      throw this.err(e.message, {e, dmsg: 'Api-Set addrs failed'})
    }
    this.info('Api-Set addrs finished', this._type[1])
    return addrs
  }
}
