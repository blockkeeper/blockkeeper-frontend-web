import {
  bip32 as bjsBip32,
  address as bjsAddr,
  payments as bjsPay
} from 'bitcoinjs-lib'
// coininfo: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1089
import * as coininfo from 'coininfo'
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
    super(`coin_${coin}`, pa)
    this.coin = coin
    this.conv = this.conv.bind(this)
    this.isHdAddr = this.isHdAddr.bind(this)
    this.toAddrHsh = this.toAddrHsh.bind(this)
    this.toTscHsh = this.toTscHsh.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
    this.bxp = {bckcyph: new BckcyphBxp(this)}
  }

  conv (val) {
    return val
  }

  isHdAddr (hsh) {
    return false
  }

  toAddrHsh (hsh) {
    return hsh.trim()
  }

  toTscHsh (hsh) {
    return hsh.trim()
  }

  vldAddrHsh (hsh) {
    const cfg = __.cfg('coins').cryp[this.coin] || {}
    const min = cfg.minAddrSize || __.cfg('coins').dflt.minAddrSize
    const max = cfg.maxAddrSize || __.cfg('coins').dflt.maxAddrSize
    const emsg = __.vldAlphNum((hsh || '').trim(), {strict: true, min, max})
    return emsg ? 'Invalid address' : ''
  }
}

class XtcCoin extends Coin {
  constructor (coin, pa) {
    super(coin, pa)
    this.conv = this.conv.bind(this)
    this.getAddrHsh = this.getAddrHsh.bind(this)
    this.getNode = this.getNode.bind(this)
    this.getNodeDepth = this.getNodeDepth.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
    this.bxp.bckinfo = new BckinfoBxp(this)
  }

  conv (val) {
    return val / 1e8 // satoshi to btc/ltc/dash/...
  }

  getAddrHsh (node) { // lgcy
    return this.toAddrHsh(bjsPay.p2pkh({pubkey: node.publicKey}).address)
  }

  getNode ({rootNode, path, hsh}) {
    return rootNode && path
      ? rootNode.derivePath(path)
      : bjsBip32.fromBase58(hsh, this.net)
  }

  getNodeDepth ({rootNode, hsh}) {
    return (rootNode || this.getNode({hsh})).depth
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
        this.getNode({hsh})
      } catch (e) {
        return 'Invalid HD public (xpub) address'
      }
    } else {
      try {
        bjsAddr.toOutputScript(hsh, this.net)
      } catch (e) {
        return 'Invalid address'
      }
    }
  }
}

class Btc extends XtcCoin {
  constructor (pa) {
    super('BTC', pa)
    this.net = coininfo.bitcoin.main.toBitcoinJS()
    this.getAddrHsh = this.getAddrHsh.bind(this)
    this.isHdAddr = this.isHdAddr.bind(this)
  }

  getAddrHsh (node, typ) {
    return typ === 'sgwt'
      ? this.toAddrHsh(
        bjsPay.p2sh({redeem: bjsPay.p2wpkh({pubkey: node.publicKey})}).address
      ) : super.getAddrHsh(node) // lgcy
  }

  isHdAddr (hsh) {
    return hsh.startsWith('xpub')
  }
}

class Ltc extends XtcCoin {
  constructor (pa) {
    super('LTC', pa)
    this.net = coininfo.litecoin.main.toBitcoinJS()
    this.getAddrHsh = this.getAddrHsh.bind(this)
    this.isHdAddr = this.isHdAddr.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  getAddrHsh (node, typ) {
    return typ === 'sgwt'
      ? this.toAddrHsh(
        bjsPay.p2sh({redeem: bjsPay.p2wpkh({pubkey: node.publicKey})}).address
      ) : super.getAddrHsh(node) // lgcy
  }

  isHdAddr (hsh) {
    return false // TODO
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
        bjsAddr.toOutputScript(hsh, this.net)
      } catch (e) {
        if (!hsh.startsWith('3')) return 'Invalid address'
        try {
          // fix me: workaround to prevent 'has no matching script' error:
          //   validate against bitcoin instead of litecoin network
          // https://github.com/litecoin-project/litecoin/issues/312
          bjsAddr.toOutputScript(hsh, this.net)
        } catch (e) {
          return 'Invalid address'
        }
      }
    }
  }
}

class Dash extends XtcCoin {
  constructor (pa) {
    super('DASH', pa)
    this.net = coininfo.dash.main.toBitcoinJS()
    this.isHdAddr = this.isHdAddr.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  isHdAddr (hsh) {
    return false // TODO
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
        bjsAddr.toOutputScript(hsh, this.net)
      } catch (e) {
        if (!hsh.startsWith('3')) return 'Invalid address'
        try {
          // fix me: workaround to prevent 'has no matching script' error:
          //   validate against bitcoin instead of dash network
          bjsAddr.toOutputScript(hsh, this.net)
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
    this.conv = this.conv.bind(this)
    this.isHdAddr = this.isHdAddr.bind(this)
    this.toAddrHsh = this.toAddrHsh.bind(this)
    this.toTscHsh = this.toTscHsh.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  conv (val) {
    return val / 1e18 // wei to eth
  }

  isHdAddr (hsh) {
    return false // TODO
  }

  toAddrHsh (hsh) {
    hsh = hsh.toLowerCase().trim()
    return Web3Utils.toChecksumAddress(
      hsh.startsWith('0x') ? hsh : `0x${hsh}`
    )
  }

  toTscHsh (hsh) {
    hsh = hsh.toLowerCase().trim()
    return hsh.startsWith('0x') ? hsh : `0x${hsh}`
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

  /*
  // deprecated: Bxp.processStdAddrs() uses bckcyph
  async apiGetAddrs (updAddrs) {
    for (let chunk of __.toChunks(Object.keys(updAddrs), 20)) {
      this.debug(`Gentle polling: Sleeping 1s`)
      await __.sleep(1000)
      this.debug(`Requesting this std addrs: ${chunk.join(',')}`)
      let pld = await __.rqst({
        url: 'https://api.etherscan.io/api',
        params: {
          module: 'account',
          action: 'balancemulti',
          address: chunk.join(',')
        }
      })
      if (pld.message !== 'OK') continue
      for (let addr of (pld.result || [])) {
        let hsh = this.toAddrHsh(addr.account)
        if (updAddrs[hsh]) updAddrs[hsh].amnt = this.conv(addr.balance)
      }
    }
  }
  */
}

export {
  Btc,
  Ltc,
  Dash,
  Eth
}
