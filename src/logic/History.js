import {ApiBase} from './Lib'
import * as mo from 'moment'
// import __ from '../util'

export default class History extends ApiBase {
  constructor (cx) {
    super('history', cx, 'e084581c-9126-4337-8443-2f1b46a1e369')
    this._store = 'history'
    this._apiGet = this._apiGet.bind(this)
    this.getHistory = this.getHistory.bind(this)
    this.clear = this.delSto
    this.clear()    // we want always fresh rates at startup
  }

  async _apiGet () {
    const coins = (await this.cx.user.load()).coins
    const res = await this.rqst({url: `history/${coins[0]}/${coins[1]}`})
    const startWeek = mo().utc().subtract(1, 'week')
    const startMonth = mo().utc().subtract(1, 'month')
    const startQuater = mo().utc().subtract(3, 'month')
    const startHalfyear = mo().utc().subtract(6, 'month')
    const startYear = mo().utc().subtract(1, 'year')
    const store = {
      weekly: {},
      monthly: {},
      quaterly: {},
      halfyearly: {},
      yearly: {}
    }

    for (let c in res.daily) {
      const weekly = []
      const monthly = []
      const quaterly = []
      const halfyearly = []
      const yearly = []

      for (let r of res.daily[c]) {
        const date = mo(r[0], 'X').utc()

        if (startWeek.isSameOrBefore(date, 'day')) {
          weekly.push(r)
        }
        if (startMonth.isSameOrBefore(date, 'day')) {
          monthly.push(r)
        }
        if (startQuater.isSameOrBefore(date, 'day')) {
          quaterly.push(r)
        }
        if (startHalfyear.isSameOrBefore(date, 'day')) {
          halfyearly.push(r)
        }
        if (startYear.isSameOrBefore(date, 'day')) {
          yearly.push(r)
        }
      }

      store.weekly[c] = weekly
      store.monthly[c] = monthly
      store.quaterly[c] = quaterly
      store.halfyearly[c] = halfyearly
      store.yearly[c] = yearly
    }

    return {
      hourly: res.hourly,
      weekly: store.weekly,
      monthly: store.monthly,
      quaterly: store.quaterly,
      halfyearly: store.halfyearly,
      yearly: store.yearly,
      all: res.daily
    }
  }

  async getHistory () {
    return await this.load()
  }

}
