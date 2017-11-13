
const d = {
  isDev: process.env.NODE_ENV === 'development',
  bip44IxGap: 20
}

Object.assign(d, {
  apiUrl: 'https://api.blockkeeper.io/v1',
  homeUrl: 'https://blockkeeper.io',
  lstMax: 50,
  maxName: 35,   // related to newXNotice
  maxLow: 25,
  maxHigh: 100,
  minAddr: 26,
  maxAddr: 250,
  minPw: 6,
  maxPw: 35,
  minUser: d.isDev ? 1 : 1, // TODO remove ?
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
  // add some spare to d.bip44IxGap because we expect to find some used
  // addresses at beginning and want to run as few as possible fetch requests
  //   fetching stops when:
  //     d.bip44IxGap <= #not-used-serial-addresses
  //   small number of fetch requests is achieved by:
  //     d.hdIxGap > #used-addresses + #not-used-serial-addresses
  // don't set d.hdIxGap to high:
  //   handle small number ("limit" parameter) of tscs returned by api:
  //     => derived HD addrs should have a small number of tscs
  //     => requesting only d.hdIxGap addrs should return all related tscs
  hdIxGap: d.bip44IxGap + 10,  // MUST be >= d.bip44IxGap
  // order matters: first has precedence
  xtcHdAddrTypes: ['lgcy', 'sgwt'],
  // order matters: first has precedence
  hdBasePaths: [ // account = acc, change = chg, index = ix
    '0/0',    // chg/ix
    '0',      // ix
    '0/0/0'   // acc/chg/ix
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
      DASH: {dec: 3}
    },
    dflt: {dec: 4, minAddrSize: 1, maxAddrSize: 150}
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
      maxTscCnt: (5 * d.maxTscCnt) > 2000
          ? 2000
          : (5 * d.maxTscCnt)
    },
    bckinfo: {  // https://blockchain.info/api/blockchain_api
      sleepSec: 1,
      // -------------------- multi-address endpoint --------------------
      url: 'https://blockchain.info/de/multiaddr',
      maxAddrCnt: d.isDev ? 50 : 200,
      maxTscCnt: d.isDev ? 10 : 100  // returned tscs for _all_ requested addrs
      // ----------------------------------------------------------------
    }
  }
})

Object.assign(d, {
  locales: [
    {lbl: 'en-US', key: 'en-US', ilk: 'locale'},
    {lbl: 'en-AU', key: 'en-AU', ilk: 'locale'},
    {lbl: 'en-CA', key: 'en-CA', ilk: 'locale'},
    {lbl: 'es-ES', key: 'es-ES', ilk: 'locale'},
    {lbl: 'fr-FR', key: 'fr-FR', ilk: 'locale'},
    {lbl: 'it-IT', key: 'it-IT', ilk: 'locale'},
    {lbl: 'de-DE', key: 'de-DE', ilk: 'locale'},
    {lbl: 'at-AT', key: 'at-AT', ilk: 'locale'},
    {lbl: 'en-GB', key: 'en-GB', ilk: 'locale'}
  ],
  dfltLocale: 'en-US'
})

const cfg = (key) => key == null ? d : d[key]
export default cfg
