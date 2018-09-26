import {
  bip32 as bjsBip32,
  address as bjsAddr,
  payments as bjsPay
} from 'bitcoinjs-lib'
import { decode as bs58Decode, encode as bs58Encode } from 'bs58check'
// coininfo: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1089
import * as coininfo from 'coininfo'
import Web3Utils from 'web3-utils'
import { BckcyphBxp, BckinfoBxp } from './Bxp'
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
    // https://github.com/satoshilabs/slips/blob/master/slip-0132.md
    this.slip132 = {}
    this.conv = this.conv.bind(this)
    this.getHdAddrTypes = this.getHdAddrTypes.bind(this)
    this.isHdAddr = this.isHdAddr.bind(this)
    this.toAddrHsh = this.toAddrHsh.bind(this)
    this.toHdAddrHshs = this.toHdAddrHshs.bind(this)
    this.toTscHsh = this.toTscHsh.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
    this.bxp = { bckcyph: new BckcyphBxp(this) }
  }

  conv (val) {
    return val
  }

  getHdAddrTypes (hsh) {
    return ['lgcy']
  }

  isHdAddr (hsh) {
    return Boolean(this.slip132[hsh.slice(0, 4)])
  }

  toAddrHsh (hsh) {
    return hsh.trim()
  }

  toHdAddrHshs (hsh) {
    // https://github.com/blockkeeper/blockkeeper-frontend-web/
    //   issues/38#issue-338113133
    // https://github.com/bitcoinjs/bitcoinjs-lib/pull/927
    hsh = this.toAddrHsh(hsh) // e.g. hsh = 'ypub6YrkQpbFR2Mu9xG...'
    const typ = hsh.slice(0, 4)
    if (typ === this.slip132Base) return [hsh, hsh]
    const key = bs58Decode(hsh).slice(4)
    const verBytes = this.slip132[this.slip132Base]
    return [
      hsh,
      bs58Encode(Buffer.concat([Buffer.from(verBytes, 'hex'), key]))
    ]
  }

  toTscHsh (hsh) {
    return hsh.trim()
  }

  vldAddrHsh (hsh) {
    const cfg = __.cfg('coins').cryp[this.coin] || {}
    const min = cfg.minAddrSize || __.cfg('coins').dflt.minAddrSize
    const max = cfg.maxAddrSize || __.cfg('coins').dflt.maxAddrSize
    const emsg = __.vldAlphNum((hsh || '').trim(), { strict: true, min, max })
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
    return this.toAddrHsh(bjsPay.p2pkh({ pubkey: node.publicKey }).address)
  }

  getNode ({ rootNode, path, hsh }) {
    return rootNode && path
      ? rootNode.derivePath(path)
      : bjsBip32.fromBase58(hsh, this.net)
  }

  getNodeDepth ({ rootNode, hsh }) {
    return (rootNode || this.getNode({ hsh })).depth
  }

  vldAddrHsh (hsh) {
    const emsg = super.vldAddrHsh(hsh)
    if (emsg) return emsg
    hsh = hsh.trim()
    const typ = hsh.slice(0, 4) // e.g. for BTC: xpub or ypub
    if (this.slip132[typ]) {
      try {
        this.getNode({ hsh: this.toHdAddrHshs(hsh)[1] })
      } catch (e) {
        return 'Invalid HD address. ' +
               'Please note: Only public addresses are valid'
      }
    } else {
      try {
        bjsAddr.toOutputScript(this.toAddrHsh(hsh), this.net)
      } catch (e) {
        return 'Invalid address'
      }
    }
  }
}

class Btc extends XtcCoin {
  constructor (pa) {
    super('BTC', pa)
    // https://github.com/satoshilabs/slips/blob/master/slip-0132.md
    this.slip132 = { xpub: '0488b21e', ypub: '049d7cb2', zpub: '04b24746' }
    this.slip132Base = 'xpub'
    this.net = coininfo.bitcoin.main.toBitcoinJS()
    this.getAddrHsh = this.getAddrHsh.bind(this)
    this.getHdAddrTypes = this.getHdAddrTypes.bind(this)
  }

  getAddrHsh (node, typ) {
    return typ === 'sgwt'
      ? this.toAddrHsh(
        bjsPay.p2sh({
          redeem: bjsPay.p2wpkh({ pubkey: node.publicKey })
        }).address
      ) : super.getAddrHsh(node) // lgcy
  }

  getHdAddrTypes (hsh) {
    return (hsh.startsWith('ypub') || hsh.startsWith('zpub'))
      ? ['sgwt']
      : ['lgcy', 'sgwt'] // xpub
  }
}

class Ltc extends XtcCoin { // TODO: hd addresses
  constructor (pa) {
    super('LTC', pa)
    this.net = coininfo.litecoin.main.toBitcoinJS()
    this.getAddrHsh = this.getAddrHsh.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  getAddrHsh (node, typ) {
    return typ === 'sgwt'
      ? this.toAddrHsh(
        bjsPay.p2sh({ redeem: bjsPay.p2wpkh({ pubkey: node.publicKey }) }).address
      ) : super.getAddrHsh(node) // lgcy
  }

  vldAddrHsh (hsh) { // TODO: use XtcCoin.vldAddrHsh()
    const cfg = __.cfg('coins').cryp[this.coin] || {}
    const min = cfg.minAddrSize || __.cfg('coins').dflt.minAddrSize
    const max = cfg.maxAddrSize || __.cfg('coins').dflt.maxAddrSize
    const emsg = __.vldAlphNum((hsh || '').trim(), { strict: true, min, max })
    if (emsg) return 'Invalid address'
    hsh = hsh.trim()
    if (hsh.startsWith('xpub') || hsh.startsWith('ltub')) {
      return 'xpub/ltub addresses are not supported ' +
             '(but will be in the near future)'
    } else {
      try {
        bjsAddr.toOutputScript(this.toAddrHsh(hsh), this.net)
      } catch (e) {
        if (!hsh.startsWith('3')) return 'Invalid address'
        try {
          // fix me: workaround to prevent 'has no matching script' error:
          //   validate against bitcoin instead of litecoin network
          // https://github.com/litecoin-project/litecoin/issues/312
          bjsAddr.toOutputScript(this.toAddrHsh(hsh), this.net)
        } catch (e) {
          return 'Invalid address'
        }
      }
    }
  }
}

class Dash extends XtcCoin { // TODO: hd addresses
  constructor (pa) {
    super('DASH', pa)
    this.net = coininfo.dash.main.toBitcoinJS()
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  vldAddrHsh (hsh) { // TODO: use XtcCoin.vldAddrHsh()
    const cfg = __.cfg('coins').cryp[this.coin] || {}
    const min = cfg.minAddrSize || __.cfg('coins').dflt.minAddrSize
    const max = cfg.maxAddrSize || __.cfg('coins').dflt.maxAddrSize
    const emsg = __.vldAlphNum((hsh || '').trim(), { strict: true, min, max })
    if (emsg) return 'Invalid address'
    hsh = hsh.trim()
    if (hsh.startsWith('xpub') || hsh.startsWith('drkv')) {
      // https://gist.github.com/moocowmoo/4eb3763efb7d8aef5356
      // https://www.dash.org/forum/threads/dash-bip32-serialization-values-
      //   dev-discussion-wont-apply-to-most.8092/
      return 'xpub/drkv addresses are not supported ' +
             '(but will be in the near future)'
    } else {
      try {
        bjsAddr.toOutputScript(this.toAddrHsh(hsh), this.net)
      } catch (e) {
        if (!hsh.startsWith('3')) return 'Invalid address'
        try {
          // fix me: workaround to prevent 'has no matching script' error:
          //   validate against bitcoin instead of dash network
          bjsAddr.toOutputScript(this.toAddrHsh(hsh), this.net)
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
    this.toAddrHsh = this.toAddrHsh.bind(this)
    this.toTscHsh = this.toTscHsh.bind(this)
    this.vldAddrHsh = this.vldAddrHsh.bind(this)
  }

  conv (val) {
    return val / 1e18 // wei to eth
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
