import {Base} from './Lib'
import __ from '../util'

export default class Depot extends Base {
  constructor (cx, _id) {
    super(cx, _id, cx.user)
    this._load = this._load.bind(this)
    this._apiGet = this._apiGet.bind(this)
    this._apiSet = this._apiSet.bind(this)
    this.stoAddrGet = addrId => __.stoGetJson(`addr_${addrId}`)
    this.stoAddrSet = addrPld => __.stoSetJson(`addr_${addrPld._id}`, addrPld)
    this.stoAddrIdsGet = () => __.stoGetJson(`${this._store}_addrIds`)
    this.stoAddrIdsSet = ids => __.stoSetJson(`${this._store}_addrIds`, ids)
    this.apiGetAddrs = this.apiGetAddrs.bind(this)
    this.info('Created')
  }

  async _load (pld) {
    let addrPlds = []
    const tscs = []
    const blcs = new Map()
    const addrIds = this.stoAddrIdsGet()
    // load addrs
    if (addrIds == null) {
      addrPlds = await this.apiGetAddrs()
    } else {
      const addrIds_ = []
      for (let addrId of addrIds) {
        const addrPld = this.stoAddrGet(addrId)
        if (addrPld) {  // ignore deleted addrs
          addrPlds.push(addrPld)
          addrIds_.push(addrId)
        }
      }
      this.stoAddrIdsSet(addrIds_) // ensure consistency
    }
    const crrncs = (await this.cx.user.load()).crrncs
    const ratePld = await this.cx.rate.load()
    for (let addrPld of addrPlds) {
      // rates are permanently updated by syncr
      addrPld.rates = new Map()
      for (let crrnc of crrncs) {
        let rate = await this.cx.rate.get(addrPld.coin, crrnc, ratePld)
        addrPld.rates.set(crrnc, rate)
      }
      // add tscs
      for (let tsc of addrPld.tscs) {
        tsc.coin = addrPld.coin
        tsc.rates = addrPld.rates
        tscs.push(tsc)
      }
      // calculate blc
      for (let [crrnc, rate] of addrPld.rates) {
        blcs.set(crrnc, (blcs.get(crrnc) || 0) + (addrPld.amnt * rate))
      }
    }
    return {...pld, ...{addrs: addrPlds, tscs, blcs}}
  }

  async _apiGet (secret) {
    // request parameters:
    //   secret               -> related user
    //   type of data = depot -> desired resource type
    //   _id                  -> desired depot
    //
    // response:
    return await __.toMoPro({
      _id: this._id,
      _tme: __.getTme()
    }, 1000, secret)
  }

  async _apiSet (secret, pld) {
    // request parameters:
    //   see _apiGet()
    //   pld (payload)
    //
    // response:
    return await __.toMoPro({result: 'ok'}, 1000, secret, pld)
  }

  async apiGetAddrs () {
    const secret = __.stoGetSecret()
    let addrPlds
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
      addrPlds = await __.toMoPro([
        {
          _id: _id0,
          _tme: __.getTme(),
          hsh: `hash_${_id0.slice(0, 5)}`,
          name: `name_${_id0.slice(0, 5)}`,
          desc: 'A short description',
          coin: 'ETH',
          amnt: 20,
          tscs: [
            {
              _id: tId1,
              hsh: `hash_${tId1.slice(0, 5)}`,
              name: `name_${tId1.slice(0, 5)}`,
              desc: 'A short description',
              amnt: 10
            },
            {
              _id: tId2,
              hsh: `hash_${tId2.slice(0, 5)}`,
              name: `name_${tId2.slice(0, 5)}`,
              desc: 'A short description',
              amnt: 10
            }
          ]
        },
        {
          _id: _id1,
          _tme: __.getTme(),
          hsh: `hash_${_id1.slice(0, 5)}`,
          name: `name_${_id1.slice(0, 5)}`,
          desc: 'A short description',
          coin: 'ETH',
          amnt: 20,
          tscs: [
            {
              _id: tId3,
              hsh: `hash_${tId3.slice(0, 5)}`,
              name: `name_${tId3.slice(0, 5)}`,
              desc: 'A short description',
              amnt: 20
            }
          ]
        }
      ], 1000, secret)
    } catch (e) {
      throw this.err(e.message, {e: e, dmsg: 'Api-Get addrs failed'})
    }
    const addrIds = []
    for (let addrPld of addrPlds) {
      this.stoAddrSet(addrPld)
      addrIds.push(addrPld._id)
    }
    this.stoAddrIdsSet(addrIds)
    this.info('Api-Get addrs finished')
    return addrPlds
  }
}
