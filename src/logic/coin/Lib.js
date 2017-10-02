import * as mo from 'moment'
import __ from '../../util'

class Base {
  constructor (coin, pa) {
    Object.assign(this, __.init('logic', coin, pa))
  }
}

class CoinBase extends Base {
  constructor (coin, pa) {
    super(coin, undefined, undefined, pa)
    this.coin = coin
    this.toHsh = hsh => hsh
    this.conv = val => val
  }
}

class BxpBase extends CoinBase {
  constructor (coin, pa) {
    super(coin, pa)
    this.getChunkSize = () => this.srvs[this.srv].chunkSize
    this.run = this.run.bind(this)
  }

  async run (chunk, sleep) {
    if (sleep) {
      let sec = this.srvs[this.srv].sleepSec
      this.info(`Gentle polling: Sleeping ${sec}s before next bxp request`)
      await __.sleep(sec * 1000)
    }
    const pld = await this[this.srv](chunk)    // e.g. BtcBxp.bckcyph()
    this.info(`Bxp data for ${chunk.length} objects from ${this.srv} fetched`)
    return pld
  }
}

class BckcyphBxpBase extends BxpBase {
  constructor (coin, pa) {
    super(coin, pa)
    this.srv = 'bckcyph'       // active service
    this.srvs = {              // all services
      bckcyph: {
        // https://www.blockcypher.com/dev/bitcoin/#batching
        //   Each individual batch call counts as a request; for example, if you
        //   request 3 addresses in a batch, you're still using 3 API calls of
        //   resources. Since the default, non-registered rate limit per second
        //   is 3, larger batches require a paid API token.
        chunkSize: 3,
        sleepSec: 0.1
      }
    }
    this.baseUrl = `https://api.blockcypher.com/v1/${this.coin}/main`
    this.bckcyph = this.bckcyph.bind(this)
    this.bckcyphTscs = this.bckcyphTscs.bind(this)
    // choose tsc max limit greater than __.cfg('mxTscCnt') because
    // a tsc can have multiple items
    this.mxTscCnt = 4 * __.cfg('mxTscCnt')
    if (this.mxTscCnt > 2000) this.mxTscCnt = 2000  // bckcyph max is 2000
  }

  // --------------------------------------------------------------------------
  // https://www.blockcypher.com/dev/bitcoin/#address-endpoint
  // https://www.blockcypher.com/dev/bitcoin/#address
  // https://www.blockcypher.com/dev/bitcoin/#txref
  // --------------------------------------------------------------------------

  async bckcyph (addrs) {
    const updAddrs = {}
    for (let addr of addrs) updAddrs[addr.hsh] = {_id: addr._id}
    const req = {
      url: `${this.baseUrl}/addrs/${Object.keys(updAddrs).join(';')}`,
      params: {limit: this.mxTscCnt}
    }
    const pld = await __.rqst(req, 'bckcyph-addr-tscs')
    for (let addr of (__.isArray(pld) ? pld : [pld])) {
      let addrHsh = addr.address
      if (!addrHsh) continue
      let updAddr = updAddrs[addrHsh]
      if (!updAddr) continue
      Object.assign(updAddr, {
        // total blc (confirmed and unconfirmed tscs) of satoshis for this addr
        amnt: this.conv(addr.final_balance),
        // total amount of confirmed satoshis sent by this addr
        sndAmnt: this.conv(addr.total_sent),
        // total amount of confirmed satoshis received by this addr
        rcvAmnt: this.conv(addr.total_received),
        // final number of (confirmed and unconfirmed) tscs for this addr
        tscCnt: addr.final_n_tx,
        // tscs
        tscs: this.bckcyphTscs(addr.txrefs, addrHsh)
      })
    }
    return Object.keys(updAddrs).map(hsh => updAddrs[hsh])
  }

  bckcyphTscs (txs, addrHsh) {
    const txs_ = {}
    for (let tx of txs) {
      if (!txs_[tx.tx_hash]) txs_[tx.tx_hash] = []
      txs_[tx.tx_hash].push(tx)
    }
    const tscs = []
    for (let hsh of Object.keys(txs_)) {
      let cTme, rTme
      let d = {rcv: 0, snd: 0, cfmCnt: 0}
      for (let tx of txs_[hsh]) {
        let mode = (tx.tx_input_n < 0) ? 'rcv' : 'snd'
        // value transfered by this input/output in satoshis exchanged
        d[mode] += tx.value
        // number of subsequent blocks (including the block the tsc is in)
        // unconfirmed tscs have 0 confirmations
        if (tx.confirmations > d.cfmCnt) d.cfmCnt = tx.confirmations
        // time at which tsc was included in a block
        // (only present for confirmed tscs)
        if (tx.confirmed) {
          let tme = mo(tx.confirmed)
          if (!cTme) {
            cTme = tme
          } else {
            if (tme.isAfter(cTme)) cTme = tme
          }
        }
        // time this tsc was received by bckcyph servers
        // (only present for unconfirmed tscs)
        if (tx.received) {
          let tme = mo(tx.received)
          if (!rTme) {
            rTme = tme
          } else {
            if (tme.isAfter(rTme)) rTme = tme
          }
        }
      }
      if ((!d.snd && !d.rcv) || (!cTme && !rTme)) continue
      let mode, amnt
      if (d.snd > d.rcv) {
        mode = 'snd'
        amnt = d.snd - d.rcv
      } else {
        mode = 'rcv'
        amnt = d.rcv - d.snd
      }
      tscs.push({
        _t: (cTme || rTme).format(),
        hsh,
        mode,
        amnt: this.conv(amnt),
        sndAmnt: this.conv(d.snd),
        rcvAmnt: this.conv(d.rcv),
        cfmCnt: d.cfmCnt
      })
    }
    return tscs
  }
}

export {
  BckcyphBxpBase
}
