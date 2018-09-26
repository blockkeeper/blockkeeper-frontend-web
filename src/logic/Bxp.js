import * as mo from 'moment'
import { Bip44 } from './Bip'
import __ from '../util'

class Base {
  constructor (name, pa) {
    Object.assign(this, __.init('logic', name, undefined, pa))
  }
}

class Bxp extends Base {
  constructor (name, pa) {
    super(`bxp_${name}`, pa)
    this.coinObj = pa
    this.bip44 = new Bip44(this.coinObj)
    this.coin = this.coinObj.coin
    this.rqst = this.rqst.bind(this)
    this.sleep = this.sleep.bind(this)
  }

  async rqst (req) {
    const pld = await __.rqst(req)
    return pld
  }

  async sleep (sec, nxSec) {
    if (sec) {
      this.debug(`Gentle polling: Sleeping ${sec}s`)
      await __.sleep(sec * 1000)
    }
    return nxSec
  }
}

class BckcyphBxp extends Bxp {
  constructor (pa) {
    super('bckcyph', pa)
    this._toTscs = this._toTscs.bind(this)
    this._toTxs = this._toTxs.bind(this)
    this.processStdAddrs = this.processStdAddrs.bind(this)
  }

  _toTscs (txs = []) {
    txs = this._toTxs(txs)
    const tscs = []
    // process each tsc: don't limit to 'maxTscCnt': sort order is unknown
    for (let hsh of Object.keys(txs)) {
      let d = { rcv: 0, snd: 0, cfmCnt: 0, cTme: null, rTme: null }
      for (let tx of txs[hsh]) {
        // https://www.blockcypher.com/dev/bitcoin/#tx
        //   tx_input_n: negative number for an output
        //   tx_output_n: negative number for an input
        let mode = (tx.tx_input_n < 0) ? 'rcv' : 'snd'
        // value transfered by this input/output in satoshis exchanged
        d[mode] += tx.value
        // number of subsequent blocks (including the block the tsc is in)
        // unconfirmed tscs have 0 confirmations
        if (tx.confirmations > d.cfmCnt) d.cfmCnt = tx.confirmations
        // time at which tsc was included in a block
        //   (only present for confirmed tscs)
        if (tx.confirmed) {
          let tme = mo(tx.confirmed)
          if (!d.cTme) {
            d.cTme = tme
          } else {
            if (tme.isBefore(d.cTme)) d.cTme = tme
          }
        }
        // time this tsc was received by bckcyph servers
        //   (only present for unconfirmed tscs)
        if (tx.received) {
          let tme = mo(tx.received)
          if (!d.rTme) {
            d.rTme = tme
          } else {
            if (tme.isBefore(d.rTme)) d.rTme = tme
          }
        }
      }
      if ((!d.snd && !d.rcv) || (!d.cTme && !d.rTme)) continue
      let mode, amnt
      if (d.rcv > d.snd) {
        mode = 'rcv'
        amnt = d.rcv - d.snd
      } else {
        mode = 'snd'
        amnt = d.snd - d.rcv
      }
      let tme = (d.cTme && d.rTme)
        ? (d.cTme.isBefore(d.rTme) ? d.cTme : d.rTme)
        : d.cTme || d.rTme
      tscs.push({
        _t: tme.format(),
        hsh: this.coinObj.toTscHsh(hsh),
        mode,
        amnt: this.coinObj.conv(amnt),
        cfmCnt: d.cfmCnt,
        std: { snd: { amnt: d.snd }, rcv: { amnt: d.rcv } }
      })
    }
    return tscs
  }

  _toTxs (txs_) {
    const txs = {}
    const txChckSums = {}
    // merge related txref-items into single tscs, filter duplicates
    for (let tx of txs_) {
      let chckSum = [
        tx.tx_hash,
        tx.block_height,
        tx.confirmed,
        tx.tx_input_n,
        tx.tx_output_n,
        tx.value
      ].join('_')
      if (!txChckSums[tx.tx_hash]) txChckSums[tx.tx_hash] = {}
      if (txChckSums[tx.tx_hash][chckSum]) continue
      txChckSums[tx.tx_hash][chckSum] = tx
      if (!txs[tx.tx_hash]) txs[tx.tx_hash] = []
      txs[tx.tx_hash].push(tx)
    }
    return txs
  }

  async processStdAddrs (addrs, sleepSec) {
    // https://www.blockcypher.com/dev/bitcoin/#address-endpoint
    // https://www.blockcypher.com/dev/bitcoin/#address
    // https://www.blockcypher.com/dev/bitcoin/#txref
    const cfg = __.cfg('bxp').bckcyph
    const updStdAddrs = {}
    for (let chunk of __.toChunks(Object.values(addrs), cfg.maxAddrCnt)) {
      await this.sleep(sleepSec)
      sleepSec = cfg.sleepSec
      let updAddrs = {}
      for (let addr of chunk) updAddrs[addr.hsh] = { _id: addr._id }
      let addrHshs = Object.keys(updAddrs)
      this.debug(`Requesting this std addrs: ${addrHshs.join(', ')}`)
      let pld = await this.rqst({
        url: `${cfg.getUrl(this.coin)}/addrs/` + addrHshs.join(';'),
        params: { limit: cfg.maxTscCnt }
      })
      this.debug('Request returned this payload:', pld)
      for (let addr of (__.is('Array', pld) ? pld : [pld])) {
        let addrHsh = addr.address
        if (!addrHsh) continue
        let updAddr = updAddrs[this.coinObj.toAddrHsh(addrHsh)]
        if (!updAddr) continue
        Object.assign(updAddr, {
          bxp: 'bckcyph',
          // total satoshi blc (confirmed/unconfirmed tscs) for this addr
          amnt: this.coinObj.conv(addr.final_balance),
          // final number of (confirmed and unconfirmed) tscs for this addr
          tscCnt: addr.final_n_tx,
          // tscs
          tscs: this._toTscs(addr.txrefs),
          std: {
            // total amount of confirmed satoshis sent by this addr
            snd: { amnt: this.coinObj.conv(addr.total_sent) },
            // total amount of confirmed satoshis received by this addr
            rcv: { amnt: this.coinObj.conv(addr.total_received) }
          }
        })
      }
      Object.assign(updStdAddrs, updAddrs)
    }
    this.debug('Fetching std addrs finished:', updStdAddrs)
    // if (this.coinObj.apiGetAddrs) {
    // // possible workaround to overwrite results
    //   await this.coinObj.apiGetAddrs(updStdAddrs)
    // }
    return Object.values(updStdAddrs)
  }
}

class BckinfoBxp extends Bxp {
  constructor (pa) {
    super('bckinfo', pa)
    this._addHdTsc = this._addHdTsc.bind(this)
    this._toHdAddr = this._toHdAddr.bind(this)
    this._walkHdAddr = this._walkHdAddr.bind(this)
    this._xptToHdTsc = this._xptToHdTsc.bind(this)
    this.processHdAddrs = this.processHdAddrs.bind(this)
  }

  _addHdTsc (drvAddrHshs, tscs, tx, typ) {
    const tscHsh = this.coinObj.toTscHsh(tx.hash)
    if (!tscs[tscHsh]) {
      tscs[tscHsh] = {
        hsh: tscHsh,
        _t: mo.unix(tx.time).format(),
        hd: {
          snd: {
            _chckSum: [],
            amnts: { ext: 0, chg: 0 },
            addrHshs: { ext: [], chg: [] }
          },
          rcv: {
            _chckSum: [],
            amnts: { ext: 0, chg: 0 },
            addrHshs: { ext: [], chg: [] }
          }
        }
      }
    }
    const tsc = tscs[tscHsh]
    for (let inpt of tx.inputs) {
      this._xptToHdTsc(tsc, drvAddrHshs, 'snd', inpt.prev_out, typ)
    }
    for (let oupt of tx.out) {
      this._xptToHdTsc(tsc, drvAddrHshs, 'rcv', oupt, typ)
    }
  }

  _toHdAddr (hdAddr) {
    for (let tsc of Object.values(hdAddr.tscs)) {
      let snd = tsc.hd.snd
      let rcv = tsc.hd.rcv
      delete snd._chckSum
      delete rcv._chckSum
      snd.amnts.sum = snd.amnts.ext
      if (rcv.amnts.chg) snd.amnts.sum -= rcv.amnts.chg
      rcv.amnts.sum = rcv.amnts.ext
      if (snd.amnts.chg) rcv.amnts.sum -= snd.amnts.chg
      if (snd.amnts.sum && rcv.amnts.sum) {
        tsc.amnt = this.coinObj.conv(snd.amnts.sum - rcv.amnts.sum)
        tsc.mode = 'snd'
      } else if (snd.amnts.sum) {
        tsc.amnt = this.coinObj.conv(snd.amnts.sum)
        tsc.mode = 'snd'
      } else { // rcv.amnts.sum
        tsc.amnt = this.coinObj.conv(rcv.amnts.sum)
        tsc.mode = 'rcv'
      }
      this.debug(`Tsc ${tsc.hsh}: ${tsc.mode} ${tsc.amnt} -> ` +
        [...snd.addrHshs.ext, ...rcv.addrHshs.ext,
          ...snd.addrHshs.chg, ...rcv.addrHshs.chg].join(', '))
    }
    hdAddr.tscCnt = Object.keys(hdAddr.tscs).length
    hdAddr.amnt = this.coinObj.conv(hdAddr.amnt)
  }

  async _walkHdAddr (hdAddr, startPath, typ, init) {
    let sleepSec
    const cfg = __.cfg('bxp').bckinfo
    let fnd = false
    for (let addrType of this.coinObj.getHdAddrTypes(hdAddr.hsh)) {
      let path = startPath
      while (path) {
        let drvAddrs = this.bip44.getDrvAddrs(path, { hdAddr, addrType })
        let fndDrvAddrs = {}
        let drvAddrsByPath = { fnd: [], notFnd: [] }
        for (let chunk of __.toChunks(Object.keys(drvAddrs), cfg.maxAddrCnt)) {
          let drvAddrHshs = {}
          for (let hsh of chunk) drvAddrHshs[hsh] = drvAddrs[hsh]
          sleepSec = await this.sleep(sleepSec, cfg.sleepSec)
          this.debug(`Requesting this ${addrType} hd-drv ` +
                     `addrs: ${chunk.join(', ')}`)
          let pld = await this.rqst({
            url: cfg.url,
            params: { cors: true, active: chunk.join('|'), limit: cfg.maxTscCnt }
          })
          this.debug('Request returned this payload:', pld)
          for (let addrPld of pld.addresses) {
            const addrPldHsh = this.coinObj.toAddrHsh(addrPld.address)
            let drvAddr = drvAddrs[addrPldHsh]
            if (!drvAddr) continue
            if (addrPld.n_tx > 0) {
              if (init) { // init-mode: only detect basePath
                Object.assign(hdAddr.hd, {
                  basePath: path,
                  baseAbsPath: this.bip44.toAbsPath(
                    path, { hsh: hdAddr.hd.hsh || hdAddr.hsh }
                  )
                })
                return Boolean(drvAddr)
              }
              fnd = true
              delete drvAddrs[drvAddr.hsh]
              fndDrvAddrs[drvAddr.hsh] = drvAddr
              hdAddr.amnt += addrPld.final_balance
              drvAddrsByPath.fnd.push(`${drvAddr.path}->${drvAddr.hsh}`)
            } else {
              drvAddrsByPath.notFnd.push(`${drvAddr.path}->${drvAddr.hsh}`)
            }
          }
          for (let tx of (pld.txs || [])) {
            this._addHdTsc(drvAddrHshs, hdAddr.tscs, tx, typ)
          }
        }
        path = this.bip44.getNextPath(path, fndDrvAddrs, drvAddrs)
        if (__.cfg('isDev')) {
          this.debug('Found: ' + (drvAddrsByPath.fnd.length > 0
            ? drvAddrsByPath.fnd.sort().join(', ') : '-')
          )
          this.debug('Not found: ' + (drvAddrsByPath.notFnd.length > 0
            ? drvAddrsByPath.notFnd.sort().join(', ') : '-')
          )
        }
      }
    }
    return fnd
  }

  _xptToHdTsc (tsc, drvAddrHshs, mode, xpt, typ) {
    const chckSum = [xpt.n, xpt.tx_index, xpt.addr, xpt.value].join('_')
    if (tsc.hd[mode]._chckSum.includes(chckSum)) return
    const addrHsh = this.coinObj.toAddrHsh(xpt.addr)
    if (!drvAddrHshs[addrHsh]) return
    tsc.hd[mode]._chckSum.push(chckSum)
    tsc.hd[mode].amnts[typ] += xpt.value
    if (!tsc.hd[mode].addrHshs[typ].includes(addrHsh)) {
      tsc.hd[mode].addrHshs[typ].push(addrHsh)
    }
  }

  async processHdAddrs (hdAddrs) {
    const updHdAddrs = []
    for (let hdAddr of Object.values(hdAddrs)) {
      this.debug(`===> Processing hd ${hdAddr.hsh}`)
      hdAddr.bxp = 'bckinfo'
      if (!hdAddr.hd.basePath) {
        this.debug('Initializing hd: Detecting base path')
        for (let basePath of __.cfg('hdBasePaths')) {
          if (await this._walkHdAddr(hdAddr, basePath, null, true)) break
        }
      }
      if (hdAddr.hd.basePath) {
        this.debug(`Hd base path is ${hdAddr.hd.baseAbsPath}`)
        hdAddr.amnt = 0
        hdAddr.tscs = {}
        this.debug('Fetching hd-ext addr:', hdAddr) // ext = external
        const chgAccPaths = []
        let extAccPath = hdAddr.hd.basePath
        while (extAccPath) {
          let chgAccPath = this.bip44.toNextPath('chg', extAccPath)
          if (chgAccPath) chgAccPaths.push(chgAccPath)
          if (!await this._walkHdAddr(hdAddr, extAccPath, 'ext')) break
          extAccPath = this.bip44.toNextPath('acc', extAccPath)
        }
        this.debug(`Fetching hd-chg addr:`, hdAddr) // chg = change (internal)
        const doneChgAccPaths = {}
        while (true) {
          let chgAccPath = chgAccPaths.sort().shift()
          if (!chgAccPath) break
          if (doneChgAccPaths[chgAccPath]) continue
          doneChgAccPaths[chgAccPath] = true
          if (!await this._walkHdAddr(hdAddr, chgAccPath, 'chg')) continue
          chgAccPath = this.bip44.toNextPath('acc', chgAccPath)
          if (chgAccPath) chgAccPaths.push(chgAccPath)
        }
        this._toHdAddr(hdAddr)
        if (hdAddr.tscCnt > 0) updHdAddrs.push(hdAddr)
      }
      this.debug(`===> Processing hd ${hdAddr.hsh} finished:`, hdAddr)
    }
    return updHdAddrs
  }
}

export {
  BckcyphBxp,
  BckinfoBxp
}
