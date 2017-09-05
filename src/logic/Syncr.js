import {Base} from './Lib'
import __ from '../util'

export default class Syncr extends Base {
  constructor (cx) {
    super('syncr', cx, '00087bff-ce0b-4efe-92a9-bf150c64667d')
    this.startJobs = this.startJobs.bind(this)
    this.runJobs = this.runJobs.bind(this)
    this.info('Created')
  }

  startJobs () {
    // https://javascript.info/settimeout-setinterval
    const sleepMsec = 300 * 1000
    const syncr = this
    let tId = setTimeout(async function runJob () {  // eslint-disable-line
      await syncr.runJobs()
      tId = setTimeout(runJob, sleepMsec)
    }, sleepMsec)
    this.info('Jobs started')
  }

  async runJobs () {
    // do something useful: update address values etc.
    const rslt = await __.toMoPro({foo: 'bar'}, 1000)  // eslint-disable-line
    this.info('Job-run finished. Sleeping')
  }
}
