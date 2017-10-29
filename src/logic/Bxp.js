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
    this.sleep = this.sleep.bind(this)
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

  async apiGetAddrs (addrs) {
    // https://www.blockcypher.com/dev/bitcoin/#address-endpoint
    // https://www.blockcypher.com/dev/bitcoin/#address
    // https://www.blockcypher.com/dev/bitcoin/#txref
    const cfg = __.cfg('bxp').bckcyph
    const updStdAddrs = {}
    let sleepSec
    for (let chunk of __.toChunks(Object.values(addrs), cfg.maxAddrCnt)) {
      await this.sleep(sleepSec)
      sleepSec = cfg.sleepSec
      let updAddrs = {}
      for (let addr of chunk) updAddrs[addr.hsh] = {_id: addr._id}
      let addrHshs = Object.keys(updAddrs)
      let req = {
        url: `${cfg.getUrl(this.coin)}/addrs/` + addrHshs.join(';'),
        params: {limit: cfg.maxTscCnt}
      }
      this.debug(`Requesting this std-addrs: ${addrHshs.join(', ')}`)
      let pld = await __.rqst(req, 'bckcyph-addr-tscs')
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
    return updStdAddrs
  }
}

class BckinfoBxp extends Bxp {
  constructor (pa) {
    super('bckinfo', pa)
    this.addTxs = this.addTxs.bind(this)
    this.prepareHdAddrs = this.prepareHdAddrs.bind(this)
    this.updateHdAddrs = this.updateHdAddrs.bind(this)
    this.finishHdAddrs = this.finishHdAddrs.bind(this)
    this.apiGetHdAddrs = this.apiGetHdAddrs.bind(this)
    this.apiScanHdAddr = this.apiScanHdAddr.bind(this)
  }

  addTxs (drvAddrs, txs) {
    let addTx = (drvAddr, tx, mode) => {
      if (!drvAddr) return
      tx._mode = mode
      tx._amnt = this.coinObj.conv(tx.result)
      if (tx._amnt < 0) tx._amnt = tx._amnt * -1
      if (!drvAddr._txs) drvAddr._txs = {}
      drvAddr._txs[tx.hash] = tx
    }
    for (let tx of (txs || [])) {
      // order matters: 'rcv' beats 'snd'
      for (let inpt of tx.inputs) {
        let drvAddr = drvAddrs[inpt.prev_out.addr]
        addTx(drvAddr, tx, 'snd')
      }
      for (let oupt of tx.out) {
        let drvAddr = drvAddrs[oupt.addr]
        addTx(drvAddr, tx, 'rcv')
      }
    }
  }

  async prepareHdAddrs (hdAddrs_) {
    let hdAddrs = {upd: {}, noUpd: {}, cur: {}}
    // scan hd-addrs if necessary (set base path etc.)
    for (let hdAddr of Object.values(hdAddrs_)) {
      if (!hdAddr.hd.basePath) await this.apiScanHdAddr(hdAddr)
      if (hdAddr.hd.basePath) {
        Object.assign(hdAddr, {
          amnt: 0,
          _txs: {},
          _txAddrs: {},
          _path: hdAddr.hd.basePath
        })
        hdAddrs.cur[hdAddr.hsh] = hdAddr
      } else {
        hdAddrs.noUpd[hdAddr.hsh] = hdAddr
      }
    }
    return hdAddrs
  }

  updateHdAddrs (hdAddrs, drvAddrs) {
    for (let addr of Object.values(hdAddrs.cur)) {
      let hsh = addr.hsh
      if (addr._paths.length > 0) {
        hdAddrs.upd[hsh] = addr
        addr._fndIx = true
        let path = addr._paths.sort().pop()
        addr._path = this.coinObj.walkHdPath('ixAcc', path)
        addr._nxPath = addr._path
        if (!addr._path) delete hdAddrs.cur[hsh]
      } else {
        let end = true
        if (addr._fndIx) {
          delete addr._fndIx
          addr._path = this.coinObj.walkHdPath('acc', addr._path)
          if (addr._path) end = false
        }
        if (end) {
          let nxAddrs = this.coinObj.getHdDrvAddrs(addr, addr._nxPath, {gap: 1})
          let nxAddr = Object.values(nxAddrs)[0]
          Object.assign(addr.hd, {
            nxAddrHsh: nxAddr.hsh,
            nxAbsPath: nxAddr.startAbsPath,
            nxPath: nxAddr.startPath
          })
          if (!hdAddrs.upd[hsh]) hdAddrs.noUpd[hsh] = addr
          delete hdAddrs.cur[hsh]
        }
      }
    }
    if (__.cfg('isDev')) {
      for (let drvAddr of Object.values(drvAddrs)) {
        this.debug(`Not found: ${drvAddr.path} (${drvAddr.hsh})`)
      }
    }
    return hdAddrs
  }

  finishHdAddrs (hdAddrs) {
    let addrs = Object.values(hdAddrs.upd).concat(Object.values(hdAddrs.noUpd))
    for (let addr of addrs) {
      addr.bxp = 'bckinfo'
      if (addr._txs) {
        let tscs = []
        for (let tx of Object.values(addr._txs)) {
          addr.tscCnt += 1
          // addr[`${tx._mode}Amnt`] += tx._amnt // untested
          tscs.push({
            _t: mo.unix(tx.time).format(),
            hsh: this.coinObj.toTscHsh(tx.hash),
            mode: tx._mode,
            amnt: tx._amnt,
            hd: {
              addrHshs: Array.from(addr._txAddrs[tx.hash])
                        .sort()
                        .slice(0, __.cfg('lstMax'))
                        .map(addr => this.coinObj.toAddrHsh(addr))
            }
          })
        }
        addr.tscs = __.struc(tscs, {byTme: true, max: __.cfg('maxTscCnt')})
      }
      delete addr._txs
      delete addr._txAddrs
      delete addr._path
      delete addr._paths
      delete addr._fndIx
      delete addr._nxPath
    }
    delete hdAddrs.cur
    return hdAddrs
  }

  async apiGetHdAddrs (hdAddrs) {
    // scan hd-addrs if necessary (set base path etc.)
    hdAddrs = await this.prepareHdAddrs(hdAddrs)
    // fetch hd-addr data
    const cfg = __.cfg('bxp').bckinfo
    let sleepSec
    while (Object.keys(hdAddrs.cur).length > 0) {
      this.debug('--- Fetching: Loop iteration started:', hdAddrs)
      let drvAddrs = {}
      for (let addr of Object.values(hdAddrs.cur)) {
        addr._paths = []
        Object.assign(drvAddrs, this.coinObj.getHdDrvAddrs(addr, addr._path))
      }
      let chunks = __.toChunks(Object.keys(drvAddrs), cfg.maxAddrCnt)
      for (let chunk of chunks) {
        sleepSec = await this.sleep(sleepSec, cfg.sleepSec)
        let req = {
          url: cfg.url,
          params: {cors: true, active: chunk.join('|'), limit: cfg.maxTscCnt}
        }
        this.debug(`Requesting this hd-drv-addrs: ${chunk.join(', ')}`)
        let pld = await __.rqst(req, 'bckinfo-hd-addrs-tscs')
        this.addTxs(drvAddrs, pld.txs)
        for (let addrPld of pld.addresses) {
          if (addrPld.n_tx > 0 && drvAddrs[addrPld.address]) {
            const addrPldHsh = this.coinObj.toAddrHsh(addrPld.address)
            let drvAddr = drvAddrs[addrPldHsh]
            delete drvAddrs[addrPldHsh]
            let hsh = drvAddr.hdAddr.hsh
            let hdAddr = hdAddrs.cur[hsh]
            hdAddr.amnt += this.coinObj.conv(addrPld.final_balance)
            for (let tx of Object.values(drvAddr._txs)) {
              if (!hdAddr._txAddrs[tx.hash]) {
                hdAddr._txAddrs[tx.hash] = new Set()
              }
              hdAddr._txAddrs[tx.hash].add(drvAddr.hsh)
            }
            Object.assign(hdAddr._txs, drvAddr._txs || {})
            hdAddr._paths.push(drvAddr.path)
            this.debug(`Found: ${drvAddr.path} (${drvAddr.hsh})`)
          }
        }
      }
      hdAddrs = this.updateHdAddrs(hdAddrs, drvAddrs)
      this.debug('--- Fetching: Loop iteration finished:', hdAddrs)
    }
    hdAddrs = this.finishHdAddrs(hdAddrs)
    this.debug('Fetching hd-addrs finished:', hdAddrs)
    return hdAddrs
  }

  async apiScanHdAddr (hdAddr) {
    const cfg = __.cfg('bxp').bckinfo
    let sleepSec
    this.debug('--- Scanning:', hdAddr)
    for (let basePath of __.cfg('hdBasePaths')) {
      for (let addrType of __.cfg('xtcHdAddrTypes')) {
        this.debug(`Checking ${basePath} -> ${addrType}`)
        let drvAddrs = this.coinObj.getHdDrvAddrs(hdAddr, basePath, {addrType})
        let chunks = __.toChunks(Object.keys(drvAddrs), cfg.maxAddrCnt)
        for (let chunk of chunks) {
          sleepSec = await this.sleep(sleepSec, cfg.sleepSec)
          let req = {
            url: cfg.url,
            params: {cors: true, active: chunk.join('|'), limit: 0}
          }
          this.debug(`Requesting this hd-drv-addrs: ${chunk.join(', ')}`)
          let pld = await __.rqst(req, 'bckinfo-scan-hd-addrs')
          for (let addrPld of pld.addresses) {
            if (addrPld.n_tx > 0 && drvAddrs[addrPld.address]) {
              let drvAddr = drvAddrs[addrPld.address]
              Object.assign(hdAddr.hd, {
                basePath,
                baseAbsPath: drvAddr.startAbsPath,
                isMstr: drvAddr.isMstr
              })
              this.debug(`--- Scanning finished: ${hdAddr.hd.basePath} found`)
              return
            }
          }
        }
      }
    }
    this.debug('--- Scanning finished: No path found')
  }
}

export {
  BckcyphBxp,
  BckinfoBxp
}
