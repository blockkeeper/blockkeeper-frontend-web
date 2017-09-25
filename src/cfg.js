
let data = {
  isDev: process.env.NODE_ENV === 'development',
  apiUrl: 'https://api.blockkeeper.io/v1',
  homeUrl: 'https://blockkeeper.io',
  lstMax: 50,
  maxLow: 30,
  maxHigh: 500,
  minPw: (process.env.NODE_ENV === 'development') ? 0 : 3,  // TODO
  maxPw: 30,
  tmoMsec: 15000,
  outdSec: 60,
  prec: 1000000
}

const cfg = (key) => key == null ? data : data[key]

export default cfg
