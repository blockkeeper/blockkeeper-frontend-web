
const isDev = process.env.NODE_ENV === 'development'

let data = {
  isDev,
  apiUrl: 'https://api.blockkeeper.io/v1',
  homeUrl: 'https://blockkeeper.io',
  lstMax: 50,
  maxLow: 30,
  maxHigh: 500,
  minAddr: 26,
  maxAddr: 250,
  minPw: isDev ? 1 : 1, // TODO
  maxPw: 30,
  minUser: isDev ? 1 : 1, // TODO
  maxUser: 20,
  tmoMsec: 15000,
  outdSec: 60,
  prec: 1000000,
  chunkSize: 3,
  bxpBlockedSec: 15,
  mxTscCnt: 100,
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
      BTC: {dec: 4, minAddrLength: 26, maxAddrLength: 35},
      ETH: {dec: 3, minAddrLength: 40, maxAddrLength: 40},
      LTC: {dec: 3, minAddrLength: 26, maxAddrLength: 35},
      DASH: {dec: 3, minAddrLength: 26, maxAddrLength: 35}
    },
    dflt: {dec: 8}
  },
  toBxpUrl: (ilk, coin) => {
    return {
      addrBTC: hsh => `https://blockchain.info/address/${hsh}`,
      tscBTC: hsh => `https://blockchain.info/tx/${hsh}`,
      addrETH: hsh => `https://etherscan.io/address/${hsh}`,
      tscETH: hsh => `https://etherscan.io/tx/${hsh}`
    }[`${ilk}${coin.toUpperCase()}`]
  }
}

const cfg = (key) => key == null ? data : data[key]

export default cfg
