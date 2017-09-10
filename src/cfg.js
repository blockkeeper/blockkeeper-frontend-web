
let data = {
  apiUrl: 'https://api.blockkeeper.io/v1',
  homeUrl: 'https://blockkeeper.io',
  maxLow: 30,
  maxHigh: 500,
  minPw: (process.env.NODE_ENV === 'development') ? 0 : 3,  // TODO
  maxPw: 30
}

const cfg = (key) => key == null ? data : data[key]

export default cfg
