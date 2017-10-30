import {
  HDNode as bjsHDNode,
  script as bjsScript,
  crypto as bjsCrypto,
  address as bjsAddress,
  networks as bjsNetworks
} from 'bitcoinjs-lib'
import Web3Utils from 'web3-utils'
import {BckcyphBxp, BckinfoBxp} from './Bxp'
import __ from '../util'

class Base {
  constructor (name, pa) {
    Object.assign(this, __.init('logic', name, undefined, pa))
  }
}

class Coin extends Base {
  constructor (coin, pa) {
    super(coin, pa)
    this.coin = coin
    this.toAddrHsh = hsh => hsh.trim()
    this.toTscHsh = hsh => hsh.trim()
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
    this.isHdAddr = hsh => false
    this.conv = val => val
    this.bxp = {
      bckcyph: new BckcyphBxp(this)
    }
  }

  vldAddrHsh (hsh) {
    const cfg = __.cfg('coins').cryp[this.coin] || {}
    const min = cfg.minAddrSize || __.cfg('coins').dflt.minAddrSize
    const max = cfg.maxAddrSize || __.cfg('coins').dflt.maxAddrSize
    const emsg = __.vldAlphNum(hsh.trim(), {strict: true, min, max})
    return emsg ? 'Invalid address' : ''
  }
}

class XtcCoin extends Coin {
  constructor (coin, pa) {
    super(coin, pa)
    this.conv = val => val / 1e8   // satoshi to btc/ltc/...
    this.isHdAddr = hsh => hsh.startsWith('xpub')
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
    this.toSegWitAddr = this.toSegWitAddr.bind(this)
    this.walkHdPath = this.walkHdPath.bind(this)
    this.toAbsHdPath = this.toAbsHdPath.bind(this)
    this.getHdDrvAddrs = this.getHdDrvAddrs.bind(this)
    Object.assign(this.bxp, {
      bckinfo: new BckinfoBxp(this)
    })
  }

  vldAddrHsh (hsh) {
    const emsg = super.vldAddrHsh(hsh)
    if (emsg) return emsg
    hsh = hsh.trim()
    let hshLo = hsh.toLowerCase()
    if (hshLo.startsWith('xpriv')) {
      return 'xpriv is not supported: Please enter xpub address'
    } else if (hshLo.startsWith('xpub')) {
      try {
        bjsHDNode.fromBase58(hsh, this.net)
      } catch (e) {
        return 'Invalid HD public (xpub) address'
      }
    } else {
      try {
        bjsAddress.toOutputScript(hsh, this.net)
      } catch (e) {
        return 'Invalid address'
      }
    }
  }

  toSegWitAddr (node) {
    // https://github.com/bitcoinjs/bitcoinjs-lib/pull/840/files
    const keyHsh = bjsCrypto.hash160(node.getPublicKeyBuffer())
    const scriptSig = bjsScript.witnessPubKeyHash.output.encode(keyHsh)
    const addrBytes = bjsCrypto.hash160(scriptSig)
    const outScript = bjsScript.scriptHash.output.encode(addrBytes)
    const addr = bjsAddress.fromOutputScript(outScript)
    return addr
  }

  walkHdPath (ilk, path) {
    // ilk = 'ixAcc' or 'ix' or 'acc'
    const MAX = 0x80000000  // 32 bit, non hardened
    let [ix, ...rest] = path.split('/').reverse()
    if (ilk === 'acc') {
      // ix = index, rest[0] = change, rest[1] = account
      if (rest[1] == null || rest[1] === 'm') return
      let acc = __.toInt(rest[1]) + 1
      if (acc >= MAX) return
      rest[1] = acc
      return [0].concat(rest).reverse().join('/')
    }
    ix = __.toInt(ix) + 1
    if (ix >= MAX) {
      if (ilk === 'ixAcc') return this.walkHdPath('acc', path)
      return   // ix
    }
    return [ix].concat(rest).reverse().join('/')
  }

  toAbsHdPath (node, path) {
    if (path.startsWith('m')) return path
    path = path.split('/')
    let absPath = ['m']
    for (let cnt = 0; cnt <= (node.depth - path.length); cnt++) {
      absPath.push('x')
    }
    return absPath.concat(path).join('/')
  }

  getHdDrvAddrs (hdAddr, startPath, {addrType, gap} = {}) {
    addrType = addrType || hdAddr.hd.addrType
    let drvAddrs = {}
    let rootNode = bjsHDNode.fromBase58(hdAddr.hsh, this.net)
    let path = startPath
    if (gap == null) gap = __.cfg('bip44IxGap')
    let ixTries = 0
    while (path && ixTries < gap) {
      let node
      try {
        node = rootNode.derivePath(path)
      } catch (e) {
        throw this.err(`Deriving HD path '${path}' failed`, {e})
      }
      let drvAddr = {
        hdAddr,
        hsh: addrType === 'sgwt'
          ? this.toAddrHsh(this.toSegWitAddr(node))
          : this.toAddrHsh(node.getAddress()),
        isMstr: !rootNode.parentFingerprint,
        addrType,
        startAbsPath: this.toAbsHdPath(rootNode, startPath),
        startPath,
        absPath: this.toAbsHdPath(rootNode, path),
        path
      }
      drvAddrs[drvAddr.hsh] = drvAddr
      path = this.walkHdPath('ix', path)
      ixTries += 1
    }
    return drvAddrs
  }
}

class Btc extends XtcCoin {
  constructor (pa) {
    super('BTC', pa)
    this.net = bjsNetworks.bitcoin
  }
}

class Ltc extends Coin {
  constructor (pa) {
    super('LTC', pa)
    this.net = bjsNetworks.litecoin
    this.conv = val => val / 1e8   // satoshi to ltc
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  vldAddrHsh (hsh) {
    const emsg = super.vldAddrHsh(hsh)
    if (emsg) return emsg
    hsh = hsh.trim()
    let hshLo = hsh.toLowerCase()
    if (hshLo.startsWith('xpriv') || hshLo.startsWith('ltpv')) {
      return 'xpriv / ltpv addresses are not supported ' +
             '(but xpub will be in the near future)'
    } else if (hshLo.startsWith('ltub')) {
      return 'ltub addresses are not supported ' +
             '(but xpub will be in the near future)'
    } else if (hshLo.startsWith('xpub')) {
      return 'xpub addresses are not yet supported ' +
             '(but will be in the near future)'
    } else {
      try {
        bjsAddress.toOutputScript(hsh, this.net)
      } catch (e) {
        if (!hsh.startsWith('3')) return 'Invalid address'
        try {
          // fix me: workaround to prevent 'has no matching script' error:
          //   validate against bitcoin instead of litecoin network
          // https://github.com/litecoin-project/litecoin/issues/312
          bjsAddress.toOutputScript(hsh, bjsNetworks.bitcoin)
        } catch (e) {
          return 'Invalid address'
        }
      }
    }
  }
}

class Dash extends Coin {
  constructor (pa) {
    super('DASH', pa)
    this.conv = val => val / 1e8
    // https://github.com/UdjinM6/bitcoinjs-lib-dash/blob/master/src/networks.js
    // https://github.com/bitcoinjs/bitcoinjs-lib/pull/518
    this.net = {
      messagePrefix: '\x19DarkCoin Signed Message:\n',
      bip32: {
        public: 0x02fe52f8,
        private: 0x02fe52cc
      },
      pubKeyHash: 0x4c,
      scriptHash: 0x10,
      wif: 0xcc,
      dustThreshold: 5460
    }
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  vldAddrHsh (hsh) {
    const emsg = super.vldAddrHsh(hsh)
    if (emsg) return emsg
    hsh = hsh.trim()
    let hshLo = hsh.toLowerCase()
    if (hshLo.startsWith('xpriv') || hshLo.startsWith('drkp')) {
      return 'xpriv / drkp addresses are not supported'
    } else if (hshLo.startsWith('xpub') || hshLo.startsWith('drkv')) {
      // https://gist.github.com/moocowmoo/4eb3763efb7d8aef5356
      // https://www.dash.org/forum/threads/dash-bip32-serialization-values-
      //   dev-discussion-wont-apply-to-most.8092/
      return 'xpub / drkv addresses are not yet supported'
    } else {
      try {
        bjsAddress.toOutputScript(hsh, this.net)
      } catch (e) {
        if (!hsh.startsWith('3')) return 'Invalid address'
        try {
          // fix me: workaround to prevent 'has no matching script' error:
          //   validate against bitcoin instead of dash network
          bjsAddress.toOutputScript(hsh, bjsNetworks.bitcoin)
        } catch (e) {
          return 'Invalid address'
        }
      }
    }
  }
}

class Eth extends Coin {
  constructor (pa) {
    super('ETH', pa)
    this.conv = val => val / 1e18   // wei to eth
    this.toAddrHsh = hsh => {
      hsh = hsh.toLowerCase().trim()
      return Web3Utils.toChecksumAddress(
        hsh.startsWith('0x') ? hsh : `0x${hsh}`
      )
    }
    this.toTscHsh = hsh => {
      hsh = hsh.toLowerCase().trim()
      return hsh.startsWith('0x') ? hsh : `0x${hsh}`
    }
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  vldAddrHsh (hsh) {
    const emsg = super.vldAddrHsh(hsh)
    if (emsg) return emsg
    hsh = hsh.toLowerCase().trim()
    if (!hsh.startsWith('0x')) {
      return 'Invalid address: Must start with "0x"'
    }
    try {
      this.toAddrHsh(hsh)
    } catch (e) {
      return 'Invalid address'
    }
    return ''
  }
}

export {
  Btc,
  Ltc,
  Dash,
  Eth
}
