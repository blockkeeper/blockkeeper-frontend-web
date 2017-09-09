import {Base} from './Lib'
import Addr from './Addr'
import __ from '../util'

export default class Depot extends Base {
  constructor (cx, _id) {
    super('depot', cx, _id, cx.user)
    this._apiGet = this._apiGet.bind(this)
    this.getBlc = this.getBlc.bind(this)
    this.loadAddrs = this.loadAddrs.bind(this)
    this.loadAddrIds = this.loadAddrIds.bind(this)
    this.apiGetAddrs = this.apiGetAddrs.bind(this)
    this.info('Created')
  }

  async _apiGet () {
    // dummy because this.load() calls _apiGet(),
    // but perhaps a real api request in a future version
    const pld = await {_id: this._id}
    return pld
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
      addr.name = addr.name || addr.hsh.slice(0, __.cfg('maxChar'))
    }
    await addrObj.save(addr)
    return addr
  }

  async loadAddrs (addrIds) {
    const stoAddrIds = await this.cx.depot.loadAddrIds()
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
          'Loading one or more addresses failed',
          {dmsg: `Loading ${addrId} failed`, e, addrIds}
        )
      }
    }
    this.info('%s addrs with %s tscs loaded', addrs.length, tscs.length)
    return {addrs, tscs}
  }

  async loadAddrIds () {
    let addrIds = __.getStoIds('addr')
    addrIds = (addrIds.length > 0) ? addrIds : await this.apiGetAddrs()
    return addrIds
  }

  async apiGetAddrs () {
    const secret = __.getSecSto()
    let addrs
    try {
      // request parameters:
      //   secret               -> related user
      //   type of data = addrs -> desired resource type
      //   _id                  -> desired depot: return all addrs of this depot
      //
      // proposal: the api stores each addr as independent resource:
      //   -> addr-resources are not stored as part of the depot-resource
      //   -> instead the api collects all depot addresses and returns these
      //      addr-resources as list (batch job)
      //   -> the number of independent addr-resources is the basis
      //      for settlement
      //
      // response:
      const _id0 = 'ace20977-b117-43d1-9b60-b527f013e491'
      const _id1 = 'a2d7077a-a838-4463-8461-71f26e0873b1'
      const tId1 = '19716f78-3a0a-474f-b3ea-7425c0123def'
      const tId2 = '139271e8-90a9-4b03-b64a-9c3a643d39c7'
      const tId3 = '1635375b-85cc-4522-b3b6-e41a4d74d06e'
      addrs = await __.toMoPro([
        {
          _id: _id0,
          _t: __.getTme(),
          hsh: `hash_${_id0.slice(0, 5)}`,
          name: `name_${_id0.slice(0, 5)}`,
          desc: 'A short description',
          coin: 'ETH',
          amnt: 20,
          tscs: [
            {
              _id: tId1,
              _t: __.getTme(),
              sndHsh: `sndhash_${tId1.slice(0, 5)}`,
              rcvHsh: `rcvhash_${tId1.slice(0, 5)}`,
              amnt: 10,
              feeAmnt: 0.1,
              name: `name_${tId1.slice(0, 5)}`,
              desc: 'A short description',
              tags: ['tag_1-1', 'tag_1-2', 'tag_1-3', 'tag_1-4', 'tag_1-5']
            },
            {
              _id: tId2,
              _t: __.getTme(),
              sndHsh: `sndhash_${tId2.slice(0, 5)}`,
              rcvHsh: `rcvhash_${tId2.slice(0, 5)}`,
              amnt: 10,
              feeAmnt: 0.1,
              name: `name_${tId2.slice(0, 5)}`,
              desc: 'A short description',
              tags: ['tag_2-1', 'tag_2-2']
            }
          ]
        },
        {
          _id: _id1,
          _t: __.getTme(),
          hsh: `hash_${_id1.slice(0, 5)}`,
          name: `name_${_id1.slice(0, 5)}`,
          desc: 'A short description',
          coin: 'ETH',
          amnt: 20,
          tscs: [
            {
              _id: tId3,
              _t: __.getTme(),
              sndHsh: `sndhash_${tId3.slice(0, 5)}`,
              rcvHsh: `rcvhash_${tId3.slice(0, 5)}`,
              amnt: 20,
              feeAmnt: 0.1,
              name: `name_${tId3.slice(0, 5)}`,
              desc: 'A short description',
              tags: ['tag_3-1', 'tag_3-2']
            }
          ]
        }
      ], 1000, secret)
    } catch (e) {
      throw this.err(e.message, {e: e, dmsg: 'Api-Get addrs failed'})
    }
    const addrIds = []
    for (let addr of addrs) {
      (new Addr(this.cx, addr._id)).setSto(addr)
      addrIds.push(addr._id)
    }
    this.info('Api-Get addrs finished')
    return addrIds
  }
}
