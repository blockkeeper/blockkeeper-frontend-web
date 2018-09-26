import __ from '../util'

class Base {
  constructor (name, pa) {
    Object.assign(this, __.init('logic', name, undefined, pa))
  }
}

class Bip44 extends Base {
  constructor (pa) {
    super('bip44', pa)
    this.coinObj = pa
    this.coin = this.coinObj.coin
    this.toAbsPath = this.toAbsPath.bind(this)
    this.toNextPath = this.toNextPath.bind(this)
    this.getNextPath = this.getNextPath.bind(this)
    this.getDrvAddrs = this.getDrvAddrs.bind(this)
  }

  toAbsPath (path, { rootNode, hsh } = {}) {
    if (path.startsWith('m')) return path
    path = path.split('/')
    let absPath = ['m']
    for (let cnt = 0; cnt < this.coinObj.getNodeDepth({ rootNode, hsh }); cnt++) {
      absPath.push('x')
    }
    return absPath.concat(path).join('/')
  }

  toNextPath (typ, path) {
    /*
    // typ = ...
    //   ixAcc = index-account
    //   ix    = index
    //   acc   = account
    //   chg   = change (internal, as opponent to ext (external))
    */
    const MAX = 0x80000000 // 32 bit, non hardened
    let [ix, ...rest] = path.split('/').reverse()
    if (typ === 'acc') {
      // ix = index, rest[0] = change, rest[1] = account
      if (rest[1] == null || rest[1] === 'm') return
      let acc = __.toInt(rest[1]) + 1
      if (acc >= MAX) return
      rest[1] = acc
      return [0].concat(rest).reverse().join('/')
    }
    if (typ === 'chg') {
      // ix = index, rest[0] = change
      if (rest[0] == null || rest[0] === 'm') return
      let chg = __.toInt(rest[0]) + 1
      if (chg >= MAX) return
      rest[0] = chg
      return [0].concat(rest).reverse().join('/')
    }
    ix = __.toInt(ix) + 1
    if (ix >= MAX) {
      if (typ === 'ixAcc') return this.toNextPath('acc', path)
      return // ix
    }
    return [ix].concat(rest).reverse().join('/')
  }

  getNextPath (path, fndAddrs, notFndAddrs) {
    if (Object.keys(fndAddrs).length > 0) {
      let paths = []
      for (let drvAddr of Object.values(fndAddrs)) paths.push(drvAddr.path)
      path = this.toNextPath('ix', paths.sort().pop())
      if (path) {
        // check bip44 gap: do we need an additional request?
        let ixs = { min: undefined, max: undefined, notFnd: {}, notFndCnt: 0 }
        for (let drvAddr of Object.values(fndAddrs)) {
          let ix = __.toInt(drvAddr.path.split('/').pop())
          if (ixs.min === undefined || ix < ixs.min) ixs.min = ix
          if (ixs.max === undefined || ix > ixs.max) ixs.max = ix
        }
        for (let drvAddr of Object.values(notFndAddrs)) {
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
    return path
  }

  getDrvAddrs (startPath, { hdAddr, addrType, gap } = {}) {
    const drvAddrs = {}
    const rootNode = this.coinObj.getNode({ hsh: hdAddr.hd.hsh || hdAddr.hsh })
    let path = startPath
    if (gap == null) gap = __.cfg('hdIxGap')
    let ixTries = 0
    while (path && ixTries < gap) { // e.g. path = 0/1 or 1/0
      let node
      try {
        node = this.coinObj.getNode({ rootNode, path })
      } catch (e) {
        throw this.err(`Deriving HD path '${path}' failed`, { e })
      }
      let drvAddr = {
        hsh: this.coinObj.getAddrHsh(node, addrType),
        node,
        startPath,
        path
      }
      if (hdAddr) drvAddr.hdAddr = hdAddr
      if (addrType) drvAddr.addrType = addrType
      drvAddrs[drvAddr.hsh] = drvAddr
      path = this.toNextPath('ix', path)
      ixTries += 1
    }
    return drvAddrs
  }
}

export {
  Bip44
}
