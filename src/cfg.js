
const d = {
  isDev: process.env.NODE_ENV === 'development'
}

Object.assign(d, {
  apiUrl: 'https://api.blockkeeper.io/v1',
  homeUrl: 'https://blockkeeper.io',
  lstMax: 50,
  maxLow: 30,
  maxHigh: 500,
  minAddr: 26,
  maxAddr: 250,
  minPw: d.isDev ? 1 : 1, // TODO
  maxPw: 30,
  minUser: d.isDev ? 1 : 1, // TODO
  maxUser: 20,
  tmoMsec: 15000,
  outdSec: 60,
  prec: 1e10,
  chunkSize: 3,
  bxpBlockedSec: 15,
  maxTscCnt: 50,
  maxAddrCnt: 5,
  newAddrNotice: 'New wallet',
  newTscNotice: 'New transaction',
  bip44IxGap: d.isDev ? 5 : 20, // BIP44 gap is 20, sync with bckinfo's tscs
  xtcHdAddrTypes: ['lgcy', 'sgwt'],  // order matters: first has precedence
  hdBasePaths: [                     // order matters: first has precedence
    '0/0',    // change, index
    '0/0/0',  // account, change, index
    '0'       // index
  ]
})

Object.assign(d, {
  coins: {
    fiat: {
      AUD: {dec: 2},
      EUR: {dec: 2},
      USD: {dec: 2},
      CAD: {dec: 2},
      GBP: {dec: 2},
      NZD: {dec: 2},
      MYR: {dec: 2}
    },
    cryp: {
      BTC: {dec: 5},
      LTC: {dec: 3},
      ETH: {dec: 3},
      DASH: {dec: 3, minAddrSize: 26, maxAddrSize: 35}
    },
    dflt: {dec: 4, minAddrSize: 1, maxAddrSize: 100}
  }
})

Object.assign(d, {
  bxpUrls: {
    BTC: {
      dflt: 'bckcyph',
      // force: 'bckinfo',
      addr: {
        bckcyph: hsh => `https://live.blockcypher.com/btc/address/${hsh}`,
        bckinfo: hsh => `https://blockchain.info/address/${hsh}`
      },
      tsc: {
        bckcyph: hsh => `https://live.blockcypher.com/btc/tx/${hsh}`,
        bckinfo: hsh => `https://blockchain.info/tx/${hsh}`
      }
    },
    LTC: {
      dflt: 'bckcyph',
      addr: {
        bckcyph: hsh => `https://live.blockcypher.com/ltc/address/${hsh}`
      },
      tsc: {
        bckcyph: hsh => `https://live.blockcypher.com/ltc/tx/${hsh}`
      }
    },
    ETH: {
      dflt: 'ethscan',
      addr: {
        ethscan: hsh => `https://etherscan.io/address/${hsh}`
      },
      tsc: {
        ethscan: hsh => `https://etherscan.io/tx/${hsh}`
      }
    },
    DASH: {
      dflt: 'dashbck',
      addr: {
        dashbck: hsh => `https://explorer.dash.org/address/${hsh}`
      },
      tsc: {
        dashbck: hsh => `https://explorer.dash.org/tx/${hsh}`
      }
    }
  }
})

Object.assign(d, {
  bxp: {
    bckcyph: {  // https://www.blockcypher.com/dev/bitcoin
      getUrl: coin => {
        return `https://api.blockcypher.com/v1/${coin.toLowerCase()}/main`
      },
      sleepSec: 1,
      // https://www.blockcypher.com/dev/bitcoin/#batching
      //   Each individual batch call counts as a request; for example, if you
      //   request 3 addresses in a batch, you're still using 3 API calls of
      //   resources. Since the default, non-registered rate limit per second
      //   is 3, larger batches require a paid API token.
      maxAddrCnt: 3,
      // number of returned tscs per address: max is 2000
      //   => use a multiplier (x) because bckcyph splits _one_ tsc in
      //      _multiple_ "txrefs" items:
      //   => x * d['maxTscCnt']
      maxTscCnt: (5 * d['maxTscCnt']) > 2000
          ? 2000
          : (5 * d['maxTscCnt'])
    },
    bckinfo: {  // https://blockchain.info/api/blockchain_api
      sleepSec: 1,
      // -------------------- multi-address endpoint --------------------
      url: 'https://blockchain.info/de/multiaddr',
      // handle small number ("limit" parameter) of tscs returned by api:
      //   => derived HD addrs should have a small number of tscs
      //   => requesting only d['bip44IxGap'] addrs should return all
      //      related tscs
      maxAddrCnt: d['bip44IxGap'],   // max = 200
      // number of returned tscs for _all_ requested addresses
      maxTscCnt: 100                 // max = 100
      // ----------------------------------------------------------------
    }
  }
})

const cfg = (key) => key == null ? d : d[key]
export default cfg
