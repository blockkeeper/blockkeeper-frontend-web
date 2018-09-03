import {ApiBase} from './Lib'
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
    return await this.rqst({url: `history/${coins[0]}/${coins[1]}`})
  }

  async getHistory () {
    return await this.load()
  }

}
