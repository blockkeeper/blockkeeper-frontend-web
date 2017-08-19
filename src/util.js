/* global localStorage */
import uuidv4 from 'uuid/v4'
import * as mo from 'moment'

class AppError extends Error {
  constructor (umsg, {e, lbl, dmsg, sts} = {}) {
    super(umsg)
    try {
      Error.captureStackTrace(this, this.constructor)
    } catch (err) {
      // firefox is bitchy
      // console.warn('Capturing error stacktrace failed')
    }
    this.name = this.constructor.name
    this.isAppErr = true
    this.lbl = lbl                                // label
    this.paErr = e                                // parent error
    this.message = umsg                           // user message
    this.dmsg = dmsg                              // developer message
    this.sts = sts || (e || {}).sts || 0          // status code
  }
}

const getErr = (...args) => {
  const e = new AppError(...args)
  console.warn(
      e.name.toUpperCase() +
      (e.lbl ? ` [${e.lbl}]:  ` : ':  ') +
      e.message +
      (e.dmsg ? ` -> ${e.dmsg}` : '')
      // + (e.sts ? ` -> ${e.sts}` : '')
    )
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
  let lbl = mainType + ':' + subType.slice(0, 6)
  if (_id) lbl += '_' + _id.slice(0, 6)
  if (paLbl) lbl += '.' + paLbl.replace(mainType + ':', '')
  return lbl
}

const init = (mainType, subType, _id, pa) => {
  const d = {
    _id: _id || uuidv4(),
    _type: [mainType.toLowerCase(), subType.toLowerCase()],
    _tme: mo.utc().format()
  }
  d._store = d._type[1] + '_' + d._id
  if (pa != null) d._pa = pa
  d._lbl = toLbl(d._type[0], d._type[1], d._id, (pa || {})._lbl)
  d.info = getLogger('info', d._lbl)
  d.warn = getLogger('warn', d._lbl)
  d.err = (umsg, kwargs = {}) => getErr(umsg, {...kwargs, lbl: d._lbl})
  return d
}

// mock promise
const toMoPro = (data, tmoMsec, ...args) => {
  // catch "...args" to satisfy IDE linter only
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(data), tmoMsec)
  })
}

// TODO: generate real secrets
const toSecret = (user, pw) => user + ':' + pw

const stoGet = key => localStorage.getItem(key)

const stoSet = (key, pld) => {
  localStorage.setItem(key, pld)
  // localStorage.setItem(`last_${key}`, mo.utc().format())
}

const stoDel = key => {
  localStorage.removeItem(key)
  // localStorage.removeItem(`last_${key}`)
}

const stoGetJson = key => {
  const warn = getLogger('warn', 'main')
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch (e) {
    warn('Getting "%s" from storage failed:', key, e)
  }
}

const stoSetJson = (key, pld) => {
  const warn = getLogger('warn', 'main')
  try {
    localStorage.setItem(key, JSON.stringify(pld))
    // localStorage.setItem(`last_${key}`, mo.utc().format())
  } catch (e) {
    warn('Saving "%s" to storage failed:', key, e)
  }
}

export default {
  stoGet,
  stoSet,
  stoDel,
  stoGetJson,
  stoSetJson,
  stoDelJson: stoDel,
  stoGetSecret: () => stoGet('secret'),
  stoSetSecret: (secret) => stoSet('secret', secret),
  stoDelSecret: () => stoDel('secret'),
  getCoinPair: (baseCoin, quoteCoin) => `${baseCoin}_${quoteCoin}`,
  getTme: () => mo.utc().format(),
  toSecret,
  getLogger,
  toLbl,
  init,
  toMoPro,
  err: getErr,
  info: getLogger('info', 'main'),
  warn: getLogger('warn', 'main'),
  uuid: uuidv4
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
