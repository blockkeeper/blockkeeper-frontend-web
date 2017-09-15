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

async function rqst (rqstObj, lbl) {
  lbl = lbl || 'resource'
  if (!rqstObj.timeout) rqstObj.timeout = cfg('tmo')
  if (!rqstObj.method) rqstObj.method = (rqstObj.data == null) ? 'get' : 'put'
  let e
  let errs = []
  let rsp = {}
  let dmsg
  try {
    rsp = await axios(rqstObj)
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
    umsg = lbl.charAt(0).toUpperCase() + lbl.slice(1) + ' not found'
  } else {
    umsg = `Requesting ${lbl} failed: ` +
      ((sts >= 400 && sts < 500) ? 'Invalid input' : 'API error')
  }
  throw getErr(umsg, {e, dmsg, sts, errs, rsp, rqst: rqstObj})
}

const getRndInt = size => {
  return Math.floor((Math.random() * size) + 1)
}

// mock promise (only for development/testing)
const toMoPro = (data, tmoMsec, ...args) => {
  // catch "...args" to satisfy IDE linter only
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(data), tmoMsec)
  })
}

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
  addSnack: (msg) => setSto('snack', msg),
  getTme: () => mo.utc().format(),
  getCoinPair: (baseCoin, quoteCoin) => `${baseCoin}_${quoteCoin}`,
  getSnack,
  rqst,
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
  getRndInt
}

/*
// doesn't work reliable :(
const addTabWatcher = () => {
  const info = getLogger('info', 'main')
  info('Registering browser tab watcher')

  const update = idle => {
    let title = document.title.replace(' [Idle]', '')
    if (idle) {
      localStorage.setItem('active', false)
      document.title = title + ' [Idle]'
    } else {
      localStorage.setItem('active', true)
      document.title = title
    }
  }

  // window.onfocus = () => {
  //   info('Browser tab is active')
  //   update(false)
  // }
  // window.onblur = function () {
  //   info('Browser tab is idle')
  //   update(true)
  // }

  let key, prop
  if (typeof document.hidden !== undefined) {
    key = 'visibilitychange'
    prop = 'hidden'
  } else if (typeof document.mozHidden !== 'undefined') {
    key = 'mozvisibilitychange'
    prop = 'mozHidden'
  } else if (typeof document.msHidden !== 'undefined') {
    key = 'msvisibilitychange'
    prop = 'msHidden'
  } else if (typeof document.webkitHidden !== 'undefined') {
    key = 'webkitvisibilitychange'
    prop = 'webkitHidden'
  }
  document.addEventListener(
    key,
    () => {
      if (document[prop]) {
        info('Browser tab is idle')
        update()
      } else {
        info('Browser tab is active')
        update(false)
      }
    }
  )
}
*/
