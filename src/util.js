/* global localStorage */
import uuidv4 from 'uuid/v4'
import * as mo from 'moment'
import validator from 'validator'
import axios from 'axios'
import cfg from './cfg'

class AppError extends Error {
  constructor (umsg, {e, lbl, dmsg, sts, ...more} = {}) {
    super(umsg)
    try {
      Error.captureStackTrace(this, this.constructor)
    } catch (err) {
      // firefox is bitchy
      // console.warn('Capturing error stacktrace failed')
    }
    sts = sts || 0
    const paSts = (e || {}).sts || 0
    const paErr = e
    this.name = this.constructor.name
    this.isAppErr = true
    this.lbl = lbl                              // label
    this.paErr = paErr                          // parent error
    this.message = umsg                         // user message
    this.dmsg = dmsg                            // developer message
    this.sts = sts || paSts                     // status code
    this.more = more                            // additional data
    const moreKeys = Object.keys(more)
    if (moreKeys.length > 0) {
      for (let key of moreKeys) this[`_${key}`] = more[key]
    }
    if (sts >= 900) {
      this.dmsg = this.dmsg ? `${this.dmsg}. ` : '' +
                  'Clearing environment cause of fatal error'
      this.message = `A fatal error occured: ${this.message}. ` +
                     'Environment cleared. Please login again'
      clearSto()
    } else {
      if (paSts >= 900) {
        this.dmsg = this.dmsg ? `${this.dmsg}. ` : '' +
                    'Parent error status is equal/greater 900 (fatal ' +
                    'error): Overwriting user message and status. ' +
                    `Original user message: "${this.message}". ` +
                    `Original status: "${this.sts}"`
        this.message = paErr.message
        this.sts = paSts
      }
    }
  }
}

const getErr = (...args) => {
  const e = new AppError(...args)
  let d = [
    e.name.toUpperCase() +
    (e.lbl ? ` [${e.lbl}]:  ` : ':  ') +
    e.message +
    (e.dmsg ? ` -> ${e.dmsg}` : '')
  ]
  if (e.sts) d[0] += ` -> ${e.sts}`
  if (e.paErr) d.push({paErr: e.paErr})
  if (e.more) d.push(e.more)
  console.warn(...d)
  return e
}

const getLogger = (ilk, lbl) => {
  const func = ilk === 'warn' ? console.warn : console.log
  ilk = ilk.toUpperCase()
  return (...args) => {
    if (ilk === 'DEBUG' && !cfg('isDev')) return
    let pfx = ilk + (lbl ? ` [${lbl}]:  ` : ':  ')
    is('String', args[0]) ? args[0] = `${pfx}${args[0]}` : args.unshift(pfx)
    if (ilk === 'DEBUG') {
      // prevent Chrome console.log's inconsistency with objects/arrays
      //   https://stackoverflow.com/a/24176305
      args = args.map(arg => cloneDeep(arg))
    }
    func.apply(console, args)
  }
}

const toLbl = (mainType, subType, _id, paLbl) => {
  let lbl = mainType + ':' + subType.slice(0, 15)
  if (_id) lbl += '_' + _id.slice(0, 5)
  if (paLbl) lbl += '.' + paLbl.replace(mainType + ':', '')
  return lbl
}

const init = (mainType, subType, _id, pa) => {
  const d = {
    _id: _id || uuidv4(),
    _type: [mainType.toLowerCase(), subType.toLowerCase()],
    _t: mo.utc().format()
  }
  if (pa != null) d._pa = pa
  d._lbl = toLbl(d._type[0], d._type[1], d._id, (pa || {})._lbl)
  d.debug = getLogger('debug', d._lbl)
  d.info = getLogger('info', d._lbl)
  d.warn = getLogger('warn', d._lbl)
  d.err = (umsg, kwargs = {}) => getErr(umsg, {...kwargs, lbl: d._lbl})
  return d
}

const initView = (cmp, name) => {
  Object.assign(cmp, init('view', name))
  cmp.getSnack = () => {
    let msg = cmp.cx.tmp.snack
    delete cmp.cx.tmp.snack
    return msg
  }
  cmp.setSnack = msg => { cmp.cx.tmp.snack = msg }
  return cmp
}

async function rqst (req) {
  if (!req.timeout) req.timeout = cfg('tmoMsec')
  if (!req.method) req.method = (req.data == null) ? 'get' : 'put'
  let err, dmsg, umsg
  let rsp = {}
  try {
    rsp = await axios(req)
    return rsp.data
  } catch (e) {
    err = e
    // if (e.request) req = e.request  // don't enable, it misses req.method
    if (e.message) dmsg = e.message
    if (e.response) {
      rsp = e.response
      if ((rsp.data || {}).errorMessage) dmsg += `: ${rsp.data.errorMessage}`
    } else {
      rsp = {}
    }
  }
  let sts = rsp.status || 600
  if (sts === 404) {
    umsg = 'Resource not found'
  } else {
    umsg = `${req.method.toUpperCase()} resource failed: ` +
      ((sts >= 400 && sts < 500) ? 'Invalid input' : 'API error')
  }
  throw getErr(umsg, {err, dmsg, sts, rsp, req})
}

const toUrl = req => {
  const params = []
  const qParams = req.params || {}
  for (let p of Object.keys(qParams)) params.push(`${p}=${qParams[p]}`)
  if (params.length < 1) return req.url
  return `${req.url}?${params.join('&')}`
}

const mergeMaps = mapObjs => {
  const newMapObj = new Map()
  for (let mapObj of mapObjs) {
    for (let [key, val] of mapObj) newMapObj.set(key, val)
  }
  return newMapObj
}

const rndPop = lst => {
  if (lst.length < 1) return
  const ix = Math.floor((Math.random() * lst.length) + 1) - 1
  return lst.splice(ix, 1)[0]
}

const shuffle = (lst) => {
  for (var i = lst.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    ;[lst[i], lst[j]] = [lst[j], lst[i]]
  }
  return lst
}

// mock promise (only for development/testing)
const toMoPro = (data, tmoMsec, ...args) => {
  // catch "...args" to satisfy IDE linter only
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(data), tmoMsec)
  })
}

async function sleep (tmoMsec, func, ...args) {
  await new Promise(resolve => setTimeout(resolve, tmoMsec))
  if (func) return func(...args)
}

const toChunks = (lst, size) => {
  size = size || cfg('chunkSize')
  lst = is('Array', lst) ? lst : Array.from(lst)
  const chunks = []
  let i, j
  for (i = 0, j = lst.length; i < j; i += size) {
    chunks.push(lst.slice(i, i + size))
  }
  return chunks
}

const struc = (lst, {toBeg, max, byTme, noSort}) => {
  lst = is('Array', lst) ? lst : Array.from(lst.values()) // lst = array or map
  if (byTme) {
    lst.sort((a, b) => (new Date(b._t)) - (new Date(a._t)))
  } else {
    if (!noSort) lst.sort()
  }
  if (toBeg) {
    const ix = lst.indexOf(toBeg)
    if (ix !== undefined) lst.unshift(lst.splice(ix, 1)[0])
  }
  lst = lst.slice(0, (max || cfg('lstMax')))
  return lst
}

const lstToObj = lst_ => {
  const lst = {}
  for (let item of lst_) lst[item] = true
  return lst
}

const cloneDeep = d => {
  if (d == null) return d
  if (is('Function', d)) throw Error(`Cannot clone function '${d}'`)
  return JSON.parse(JSON.stringify(d))
}

const clone = d => {
  // NOT a deep clone:
  //  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
  //    Global_Objects/Object/assign#Deep_Clone
  if (is('Object', d)) return Object.assign({}, d)
  if (is('Array', d)) return [...d]
  if (is('Map', d)) return new Map(d)
  if (is('Set', d)) return new Set(d)
  if (is('Function', d)) throw Error(`Cannot clone function '${d}'`)
  return d
}

// ilk = 'Array', 'Object', 'Map', 'Set', 'String', 'Boolean'
const is = (ilk, d) => Object.prototype.toString.call(d) === `[object ${ilk}]`

const cap = (val) => val.charAt(0).toUpperCase() + val.slice(1)

const dec = coin => {
  coin = coin.toUpperCase()
  let coins = cfg('coins')
  return (coins.fiat[coin] || coins.cryp[coin] || coins.dflt).dec
}

const ppTme = _t => {
  let tme = mo(_t)
  return tme.isBefore(mo().subtract(1, 'days').startOf('day'))
    ? tme.format('YYYY-MM-DD / HH:mm / Z')
    : tme.fromNow()
}

const formatNumber = (n, coin, locale = 'en-US') => {
  // TODO use user locale
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: dec(coin)
  }).format(n)
}

const vldAlphNum = (val, {strict, noSpace, min, max} = {}) => {
  let pat = 'a-zA-Z0-9'
  let msg = 'Allowed characters: '
  if (strict) {
    msg += pat
  } else {
    pat += ':,.\\-_'
    if (noSpace) {
      msg += pat.replace('\\', '')
    } else {
      pat += ' '
      msg += `Space and ${pat.replace('\\', '')}`
    }
  }
  if (!validator.matches(val, `^[${pat}]*$`)) return msg
  min = min || 0
  if (val.length < min) return `Min length: ${min} characters`
  max = max || cfg('maxLow')
  if (val.length > max) return `Max length: ${max} characters`
  return ''
}

const vldPw = (pw) => {
  let pat = 'a-zA-Z0-9:,.\\-_!%@#^$*%&'
  if (!validator.matches(pw, `^[${pat}]*$`)) {
    return `Allowed characters: ${pat.replace('\\', '')}`
  }
  if (pw.length < cfg('minPw')) return `Min length: ${cfg('minPw')} characters`
  if (pw.length > cfg('maxPw')) return `Max length: ${cfg('maxPw')} characters`
  return ''
}

const vldFloat = (val, max) => {
  return validator.isFloat(String(val), {min: 0, max: max || 9999999999})
    ? ''
    : 'Not a float (e.g. 1.23) or value to small/big'
}

const toFloat = val => {
  val = validator.toFloat(String(val))
  return Math.round(val * cfg('prec')) / cfg('prec')
}

const anyIsOutd = (plds, sec) => {
  if (cfg('isDev')) return true
  for (let pld of plds) {
    if (isOutd(pld._t, sec)) return true
  }
  return false
}

const isOutd = (tme, sec) => {
  return (mo.utc().diff(tme, 'seconds') > (sec || cfg('outdSec')))
}

const toBxpUrl = (ilk, coin, hsh, srv) => {
  const d = cfg('bxpUrls')[coin.toUpperCase()][ilk]
  const forceSrv = cfg('bxpUrls')[coin].force
  if (forceSrv) srv = forceSrv
  const dfltSrv = cfg('bxpUrls')[coin].dflt
  const func = d[srv || dfltSrv] || d[dfltSrv]
  return func(hsh)
}

const getStos = (term, convert) => {
  let stos = []
  for (let sto of Object.keys(localStorage)) {
    if (sto.startsWith(term)) stos.push(convert ? convert(sto) : sto)
  }
  return stos
}

const getJsonSto = key => {
  const warn = getLogger('warn', 'main')
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch (e) {
    warn('Getting "%s" from storage failed:', key, e)
  }
}

const setJsonSto = (key, pld) => {
  const warn = getLogger('warn', 'main')
  try {
    localStorage.setItem(key, JSON.stringify(pld))
    // localStorage.setItem(`last_${key}`, mo.utc().format())
  } catch (e) {
    warn('Saving "%s" to storage failed:', key, e)
  }
}

const getStoIds = term => {
  return Array.from(new Set(getStos(term, (sto) => sto.split('_')[1])))
}

const getSto = key => localStorage.getItem(key)
const setSto = (key, pld) => localStorage.setItem(key, pld)
const delSto = key => localStorage.removeItem(key)
const clearSto = () => localStorage.clear()

export default {
  isOutd,
  anyIsOutd,
  cap,
  struc,
  rqst,
  toUrl,
  rndPop,
  shuffle,
  ppTme,
  formatNumber,
  toBxpUrl,
  getLogger,
  toLbl,
  init,
  initView,
  toMoPro,
  mergeMaps,
  sleep,
  lstToObj,
  clone,
  cloneDeep,
  vldAlphNum,
  vldFloat,
  vldPw,
  toFloat,
  is,
  toChunks,
  cfg,
  dec,
  getStos,
  getStoIds,
  getSto,
  setSto,
  delSto,
  clearSto,
  getJsonSto,
  setJsonSto,
  delJsonSto: delSto,
  uuid: uuidv4,
  vld: validator,
  err: getErr,
  debug: getLogger('debug', 'main'),
  info: getLogger('info', 'main'),
  warn: getLogger('warn', 'main'),
  toInt: val => validator.toInt(String(val)),
  toTags: tags => tags.trim().split(' ').filter(item => item !== '').join(' '),
  getCoinPair: (baseCoin, quoteCoin) => `${baseCoin}_${quoteCoin}`,
  getTme: () => mo.utc().format(),
  getAmnt: (ua, ca) => toFloat(ua != null ? ua : (ca || 0)),
  clearObj: obj => { for (let prop of Object.keys(obj)) delete obj[prop] },
  shortn: (val, maxLow) => `${val.trim().slice(0, maxLow || cfg('maxLow'))}...`,
  isFiat: coin => Boolean(cfg('coins').fiat[coin.toUpperCase()])
}
