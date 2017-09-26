
const isDev = process.env.NODE_ENV === 'development'

let data = {
  isDev,
  apiUrl: 'https://api.blockkeeper.io/v1',
  homeUrl: 'https://blockkeeper.io',
  lstMax: 50,
  maxLow: 30,
  maxHigh: 500,
  minPw: isDev ? 0 : 3,  // TODO
  maxPw: 30,
  tmoMsec: 15000,
  outdSec: 60,
  prec: 1000000,
  chunkSize: isDev ? 2 : 3  // TODO
}

const cfg = (key) => key == null ? data : data[key]

export default cfg
