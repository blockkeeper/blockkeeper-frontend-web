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
    if (typeof args[0] === 'string') {
      args[0] = ilk + (lbl ? ` [${lbl}]:  ` : ':  ') + args[0]
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
  d._store = d._type[1] + '_' + d._id
  if (pa != null) d._pa = pa
  d._lbl = toLbl(d._type[0], d._type[1], d._id, (pa || {})._lbl)
  d.info = getLogger('info', d._lbl)
  d.warn = getLogger('warn', d._lbl)
  d.err = (umsg, kwargs = {}) => getErr(umsg, {...kwargs, lbl: d._lbl})
  return d
}

const initView = (cmp, name) => {
  cmp = init('view', name)
  cmp.info('Created')
  return cmp
}

async function rqst (req, lbl) {
  lbl = lbl || 'resource'
  if (!req.timeout) req.timeout = cfg('tmoMsec')
  if (!req.method) req.method = (req.data == null) ? 'get' : 'put'
  let e
  let errs = []
  let rsp = {}
  let dmsg
  try {
    rsp = await axios(req)
    return rsp.data
  } catch (e) {
    if (e.message) {
      errs.push(e.message)
      dmsg = e.message
    }
    if (e.response) {
      rsp = e.response
      errs.push(rsp)
      if ((rsp.data || {}).errorMessage) dmsg += `: ${rsp.data.errorMessage}`
    } else {
      rsp = {}
    }
    if (e.request) errs.push(e.request)
  }
  let umsg
  let sts = rsp.status || 600
  if (sts === 404) {
    umsg = cap(lbl) + ' not found'
  } else {
    umsg = `Requesting ${lbl} failed: ` +
      ((sts >= 400 && sts < 500) ? 'Invalid input' : 'API error')
  }
  throw getErr(umsg, {e, dmsg, sts, errs, rsp, req})
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

const struc = (lst, {toBeg, max, byTme}) => {
  if (byTme) {
    lst.sort((a, b) => (new Date(a._t)) - (new Date(b._t)))
  } else {
    lst.sort()
  }
  if (toBeg) {
    const ix = lst.indexOf(toBeg)
    if (ix !== undefined) lst.unshift(lst.splice(ix, 1)[0])
  }
  lst = lst.slice(0, (max || cfg('lstMax')))
  return lst
}

const cap = (val) => val.charAt(0).toUpperCase() + val.slice(1)

const ppTme = _t => {
  let tme = mo(_t)
  return tme.fromNow()
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
  let pat = 'a-zA-Z0-9:,.\\-_'
  if (!validator.matches(pw, `^[${pat}]*$`)) {
    return `Allowed characters: ${pat.replace('\\', '')}`
  }
  if (pw.length < cfg('minPw')) return `Min length: ${cfg('minPw')} characters`
  if (pw.length > cfg('maxPw')) return `Max length: ${cfg('maxPw')} characters`
  return ''
}

const vldFloat = (val, max) => {
  return validator.isFloat(val, {min: 0, max: max || 9999999999})
    ? ''
    : 'Not a float (e.g. 1.23) or value to small/big'
}

const getSnack = () => {
  let msg = getSto('snack')
  delSto('snack')
  return msg
}

const isOutdated = (tme, sec) => {
  return (mo.utc().diff(tme, 'seconds') > (sec || cfg('outdSec')))
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
  cfg,
  getStos,
  getStoIds,
  getSto,
  setSto,
  delSto,
  getJsonSto,
  setJsonSto,
  delJsonSto: delSto,
  clearSto,
  addSnack: msg => setSto('snack', msg),
  getCoinPair: (baseCoin, quoteCoin) => `${baseCoin}_${quoteCoin}`,
  getTme: () => mo.utc().format(),
  isOutdated,
  getSnack,
  cap,
  struc,
  rqst,
  rndPop,
  shuffle,
  ppTme,
  getLogger,
  toLbl,
  init,
  initView,
  toMoPro,
  err: getErr,
  info: getLogger('info', 'main'),
  warn: getLogger('warn', 'main'),
  uuid: uuidv4,
  vld: validator,
  vldAlphNum,
  vldFloat,
  vldPw,
  isArray: val => Object.prototype.toString.call(val) === '[object Array]'
}
