import * as mo from 'moment'
import __ from '../util'

class Base {
  constructor (name, pa) {
    Object.assign(this, __.init('logic', name, undefined, pa))
  }
}

class Bxp extends Base {
  constructor (name, pa) {
    super(name + 'Bxp', pa)
    this.coinObj = pa
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
    this.toTscs = this.toTscs.bind(this)
    this.apiGetAddrs = this.apiGetAddrs.bind(this)
  }

  toTscs (txs) {
    const txs_ = {}
    // merge related txref-items to single tscs
    for (let tx of txs) {
      if (!txs_[tx.tx_hash]) txs_[tx.tx_hash] = []
      txs_[tx.tx_hash].push(tx)
    }
    // process each tsc: don't limit to 'maxTscCnt': sort order is unknown
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
        hsh: this.coinObj.toTscHsh(hsh),
        mode,
        amnt: this.coinObj.conv(amnt),
        cfmCnt: d.cfmCnt
        // sndAmnt: this.coinObj.conv(d.snd),
        // rcvAmnt: this.coinObj.conv(d.rcv)
      })
    }
    return tscs
  }

  async apiGetAddrs (addrs, sleepSec) {
    // https://www.blockcypher.com/dev/bitcoin/#address-endpoint
    // https://www.blockcypher.com/dev/bitcoin/#address
    // https://www.blockcypher.com/dev/bitcoin/#txref
    const cfg = __.cfg('bxp').bckcyph
    const updStdAddrs = {}

    for (let chunk of __.toChunks(Object.values(addrs), cfg.maxAddrCnt)) {
      await this.sleep(sleepSec)
      sleepSec = cfg.sleepSec
      let updAddrs = {}
      for (let addr of chunk) updAddrs[addr.hsh] = {_id: addr._id}
      let addrHshs = Object.keys(updAddrs)
      this.debug(`Requesting this std-addrs: ${addrHshs.join(', ')}`)
      let pld = await this.rqst({
        url: `${cfg.getUrl(this.coin)}/addrs/` + addrHshs.join(';'),
        params: {limit: cfg.maxTscCnt}
      })
      for (let addr of (__.is('Array', pld) ? pld : [pld])) {
        let addrHsh = addr.address
        if (!addrHsh) continue
        let updAddr = updAddrs[this.coinObj.toAddrHsh(addrHsh)]
        if (!updAddr) continue
        Object.assign(updAddr, {
          bxp: 'bckcyph',
          // total blc (confirmed/unconfirmed tscs) of satoshis for this addr
          amnt: this.coinObj.conv(addr.final_balance),
          // total amount of confirmed satoshis sent by this addr
          sndAmnt: this.coinObj.conv(addr.total_sent),
          // total amount of confirmed satoshis received by this addr
          rcvAmnt: this.coinObj.conv(addr.total_received),
          // final number of (confirmed and unconfirmed) tscs for this addr
          tscCnt: addr.final_n_tx,
          // tscs
          tscs: this.toTscs(addr.txrefs)
        })
      }
      Object.assign(updStdAddrs, updAddrs)
    }
    this.debug('Fetching std-addrs finished:', updStdAddrs)
    // ---------- workaround: remove me --------------------------------------
    // ETH-api delivers wrong balance values (2017-11-14)
    if (this.coinObj.apiGetAddrs) {
      await this.coinObj.apiGetAddrs(updStdAddrs)
    }
    // -----------------------------------------------------------------------
    return updStdAddrs
  }
}

class BckinfoBxp extends Bxp {
  constructor (pa) {
    super('bckinfo', pa)
    this.processHdAddrs = this.processHdAddrs.bind(this)
    this.fetchHdExtAddr = this.fetchHdExtAddr.bind(this)
    this.fetchHdChgAddr = this.fetchHdChgAddr.bind(this)
    this.addHdRcvTsc = this.addHdRcvTsc.bind(this)
    this.addHdSndTsc = this.addHdSndTsc.bind(this)
    this.getHdTsc = this.getHdTsc.bind(this)
    this.getHdPath = this.getHdPath.bind(this)
    this.apiGetHdAddr = this.apiGetHdAddr.bind(this)
    this.apiScanHdAddr = this.apiScanHdAddr.bind(this)
  }

  async processHdAddrs (hdAddrs_) {
    const hdAddrs = {upd: {}, noUpd: {}}
    for (let hdAddr of Object.values(hdAddrs_)) {
      this.debug(`===> Processing hd ${hdAddr.hsh}`)
      hdAddr.bxp = 'bckinfo'
      if (!hdAddr.hd.basePath) await this.apiScanHdAddr(hdAddr)
      if (!hdAddr.hd.basePath) {
        hdAddrs.noUpd[hdAddr.hsh] = hdAddr
      } else {
        const {
          extTscs, extDrvAddrs, chgAccPaths
        } = await this.fetchHdExtAddr(hdAddr)
        const {
          chgTscs, chgDrvAddrs
        } = await this.fetchHdChgAddr(hdAddr, chgAccPaths)
        hdAddr.amnt = this.coinObj.conv(hdAddr.amnt)
        Object.assign(extTscs, chgTscs)
        const tscs = []
        for (let hsh of Object.keys(extTscs)) {
          this.addHdRcvTsc(hsh, tscs, extTscs[hsh], extDrvAddrs, chgDrvAddrs)
          this.addHdSndTsc(hsh, tscs, extTscs[hsh], extDrvAddrs, chgDrvAddrs)
        }
        hdAddr.tscCnt = tscs.length
        hdAddr.tscs = __.struc(tscs, {byTme: true, max: __.cfg('maxTscCnt')})
        hdAddrs[hdAddr.tscs.length > 0 ? 'upd' : 'noUpd'][hdAddr.hsh] = hdAddr
      }
      this.debug(`===> Processing hd ${hdAddr.hsh} finished:`, hdAddr)
    }
    return hdAddrs
  }

  async fetchHdExtAddr (hdAddr) {
    this.debug(`Fetching hd-ext:`, hdAddr)
    hdAddr.amnt = 0
    const extTscs = {}
    const extDrvAddrs = {}
    const chgAccPaths = []
    let extAccPath = hdAddr.hd.basePath
    while (extAccPath) {
      let chgAccPath = this.coinObj.walkHdPath('chg', extAccPath)
      if (chgAccPath) chgAccPaths.push(chgAccPath)
      let {amnt, tscs, drvAddrs} = await this.apiGetHdAddr(hdAddr, extAccPath)
      if (Object.keys(drvAddrs).length < 1) break
      Object.assign(extDrvAddrs, drvAddrs)
      Object.assign(extTscs, tscs)
      hdAddr.amnt += amnt
      extAccPath = this.coinObj.walkHdPath('acc', extAccPath)
    }
    return {extTscs, extDrvAddrs, chgAccPaths}
  }

  async fetchHdChgAddr (hdAddr, chgAccPaths) {
    this.debug(`Fetching hd-chg:`, hdAddr)
    const chgTscs = {}
    const chgDrvAddrs = {}
    const doneChgAccPaths = {}
    while (true) {
      let chgAccPath = chgAccPaths.sort().shift()
      if (!chgAccPath) break
      if (doneChgAccPaths[chgAccPath]) continue
      doneChgAccPaths[chgAccPath] = true
      let {amnt, tscs, drvAddrs} = await this.apiGetHdAddr(hdAddr, chgAccPath)
      if (Object.keys(drvAddrs).length < 1) continue
      Object.assign(chgDrvAddrs, drvAddrs)
      Object.assign(chgTscs, tscs)
      hdAddr.amnt += amnt
      chgAccPath = this.coinObj.walkHdPath('acc', chgAccPath)
      if (chgAccPath) chgAccPaths.push(chgAccPath)
    }
    return {chgTscs, chgDrvAddrs}
  }

  addHdRcvTsc (tscHsh, tscs, extTsc, extDrvAddrs, chgDrvAddrs) {
    let amnt = 0
    let inptAmnt = 0
    let addrHshs = new Set()
    for (let inpt of extTsc.inpt) {
      if (!extDrvAddrs[inpt.addrHsh] && !chgDrvAddrs[inpt.addrHsh]) {
        inptAmnt += inpt.amnt
      }
      if (extDrvAddrs[inpt.addrHsh] || chgDrvAddrs[inpt.addrHsh]) {
        addrHshs.add(inpt.addrHsh)
      }
    }
    if (inptAmnt > 0) {
      for (let oupt of extTsc.oupt) {
        if (extDrvAddrs[oupt.addrHsh]) amnt += oupt.amnt
        if (extDrvAddrs[oupt.addrHsh] || chgDrvAddrs[oupt.addrHsh]) {
          addrHshs.add(oupt.addrHsh)
        }
      }
    }
    if (amnt > 0) {
      this.debug(`Tsc found: ${this.coinObj.conv(amnt)} received`)
      tscs.push(this.getHdTsc(tscHsh, extTsc.tme, 'rcv', amnt, addrHshs))
    }
  }

  addHdSndTsc (tscHsh, tscs, extTsc, extDrvAddrs, chgDrvAddrs) {
    let amnt = 0
    let inptAmnt = 0
    let addrHshs = new Set()
    for (let inpt of extTsc.inpt) {
      if (extDrvAddrs[inpt.addrHsh] || chgDrvAddrs[inpt.addrHsh]) {
        inptAmnt += inpt.amnt
      }
      if (extDrvAddrs[inpt.addrHsh] || chgDrvAddrs[inpt.addrHsh]) {
        addrHshs.add(inpt.addrHsh)
      }
    }
    if (inptAmnt > 0) {  // we need to consider the tsc fee
      amnt = inptAmnt
      let ouptAmnt = 0
      for (let oupt of extTsc.oupt) {
        if (!extDrvAddrs[oupt.addrHsh]) ouptAmnt += oupt.amnt
        if (extDrvAddrs[oupt.addrHsh] || chgDrvAddrs[oupt.addrHsh]) {
          amnt -= oupt.amnt
        }
        if (extDrvAddrs[oupt.addrHsh] || chgDrvAddrs[oupt.addrHsh]) {
          addrHshs.add(oupt.addrHsh)
        }
      }
      if (ouptAmnt <= 0) amnt = 0
    }
    if (amnt > 0) {
      this.debug(`Tsc found: ${this.coinObj.conv(amnt)} sent ` +
                 `from ${Array.from(addrHshs).join(',')}`)
      tscs.push(this.getHdTsc(tscHsh, extTsc.tme, 'snd', amnt, addrHshs))
    }
  }

  getHdTsc (hsh, tme, mode, amnt, addrHshs) {
    return {
      hsh: this.coinObj.toTscHsh(hsh),
      _t: mo.unix(tme).format(),
      mode,
      amnt: this.coinObj.conv(amnt),
      hd: {
        addrHshs: Array.from(addrHshs).sort().slice(0, __.cfg('lstMax'))
                       .map(addr => this.coinObj.toAddrHsh(addr))
      }
    }
  }

  getHdPath (path, fnds, notFnds) {
    if (Object.keys(fnds).length > 0) {
      let paths = []
      for (let drvAddr of Object.values(fnds)) paths.push(drvAddr.path)
      path = this.coinObj.walkHdPath('ix', paths.sort().pop())
      if (path) {
        // check bip44 gap: do we need an additional request?
        let ixs = {min: undefined, max: undefined, notFnd: {}, notFndCnt: 0}
        for (let drvAddr of Object.values(fnds)) {
          let ix = __.toInt(drvAddr.path.split('/').pop())
          if (ixs.min === undefined || ix < ixs.min) ixs.min = ix
          if (ixs.max === undefined || ix > ixs.max) ixs.max = ix
        }
        for (let drvAddr of Object.values(notFnds)) {
          let ix = __.toInt(drvAddr.path.split('/').pop())
          if (ixs.min === undefined || ix < ixs.min) ixs.min = ix
          if (ixs.max === undefined || ix > ixs.max) ixs.max = ix
          ixs.notFnd[ix] = true
        }
        for (let ix = ixs.max; ix >= ixs.min; ix -= 1) {
          if (!ixs.notFnd[ix]) break
          ixs.notFndCnt += 1
        }
        if (ixs.notFndCnt >= __.cfg('bip44IxGap')) path = undefined
      }
    } else {
      path = undefined
    }
    if (__.cfg('isDev')) {
      for (let drvAddr of Object.values(fnds)) {
        this.debug(`Found: ${drvAddr.path} (${drvAddr.hsh})`)
      }
      for (let drvAddr of Object.values(notFnds)) {
        this.debug(`Not found: ${drvAddr.path} (${drvAddr.hsh})`)
      }
    }
    return path
  }

  async apiGetHdAddr (hdAddr, startPath) {
    const cfg = __.cfg('bxp').bckinfo
    const allFndDrvAddrs = {}
    const tscs = {}
    let sleepSec
    let amnt = 0
    let path = startPath
    while (path) {
      let drvAddrs = this.coinObj.getHdDrvAddrs(hdAddr, path)
      let fndDrvAddrs = {}
      for (let chunk of __.toChunks(Object.keys(drvAddrs), cfg.maxAddrCnt)) {
        sleepSec = await this.sleep(sleepSec, cfg.sleepSec)
        this.debug(`Requesting this hd-ext-drv-addrs: ${chunk.join(', ')}`)
        let pld = await this.rqst({
          url: cfg.url,
          params: {cors: true, active: chunk.join('|'), limit: cfg.maxTscCnt}
        })
        for (let tx of (pld.txs || [])) {
          let tscHsh = this.coinObj.toTscHsh(tx.hash)
          if (tscs[tscHsh]) continue
          let tsc = {tme: tx.time, inpt: [], oupt: []}
          for (let inpt of tx.inputs) {
            tsc.inpt.push({
              addrHsh: inpt.prev_out.addr,
              amnt: inpt.prev_out.value
            })
          }
          for (let oupt of tx.out) {
            tsc.oupt.push({addrHsh: oupt.addr, amnt: oupt.value})
          }
          tscs[tscHsh] = tsc
        }
        for (let addrPld of pld.addresses) {
          if (addrPld.n_tx > 0 && drvAddrs[addrPld.address]) {
            const addrPldHsh = this.coinObj.toAddrHsh(addrPld.address)
            let drvAddr = drvAddrs[addrPldHsh]
            delete drvAddrs[drvAddr.hsh]
            fndDrvAddrs[drvAddr.hsh] = drvAddr
            allFndDrvAddrs[drvAddr.hsh] = drvAddr
            amnt += addrPld.final_balance
          }
        }
      }
      path = this.getHdPath(path, fndDrvAddrs, drvAddrs)
    }
    return {amnt, tscs, drvAddrs: allFndDrvAddrs}
  }

  async apiScanHdAddr (hdAddr) {
    const cfg = __.cfg('bxp').bckinfo
    let sleepSec
    this.debug('Scanning:', hdAddr)
    for (let basePath of __.cfg('hdBasePaths')) {
      for (let addrType of __.cfg('xtcHdAddrTypes')) {
        this.debug(`Checking ${basePath} -> ${addrType}`)
        let drvAddrs = this.coinObj.getHdDrvAddrs(hdAddr, basePath, {addrType})
        let chunks = __.toChunks(Object.keys(drvAddrs), cfg.maxAddrCnt)
        for (let chunk of chunks) {
          sleepSec = await this.sleep(sleepSec, cfg.sleepSec)
          this.debug(`Requesting this hd-drv-addrs: ${chunk.join(', ')}`)
          let pld = await this.rqst({
            url: cfg.url,
            params: {cors: true, active: chunk.join('|'), limit: 0}
          })
          for (let addrPld of pld.addresses) {
            if (addrPld.n_tx > 0 && drvAddrs[addrPld.address]) {
              let drvAddr = drvAddrs[addrPld.address]
              let hsh = drvAddr.hdAddr.hsh
              Object.assign(hdAddr.hd, {
                addrType,
                basePath,
                baseAbsPath: this.coinObj.toAbsHdPathByHsh(hsh, basePath),
                isMstr: drvAddr.isMstr
              })
              this.debug(`Scanning finished: ${basePath} found`)
              return
            }
          }
        }
      }
    }
    this.debug('Scanning finished: No path found')
  }
}

export {
  BckcyphBxp,
  BckinfoBxp
}
