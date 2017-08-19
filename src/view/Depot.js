import React from 'react'
import {MainBar, SubBar, Jumbo, Listing} from './Lib'
import { LinearProgress } from 'material-ui/Progress'
// import __ from '../util'

export default class Depot extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {
      ix: 0,
      err: false,
      spnr: false,
      blc1: 'Loading',
      blc2: 'data...',
      addrs: [],
      tscs: []
    }
    this.load = this.load.bind(this)
    this.onTab = this.onTab.bind(this)
  }

  async componentDidMount () {
    Object.assign(this, this.cx._initView(this))
    await this.load()
  }

  async load () {
    this.setState({spnr: true})
    try {
      let [userPld] = await Promise.all([
        this.cx.user.load(),
        this.cx.rate.load()
      ])
      const depotPld = await this.cx.depot.load()
      const crrnc1 = this.state.crrnc || userPld.crrncs[0]
      const crrnc2 = (crrnc1 === userPld.crrncs[1])
        ? userPld.crrncs[0]
        : userPld.crrncs[1]
      // throw this.err('An error occurred')  // uncomment to show error view
      this.setState({
        err: false,
        spnr: false,
        addrs: depotPld.addrs,
        tscs: depotPld.tscs,
        crrnc1,
        crrnc2,
        blc1: `${crrnc1} ${depotPld.blcs.get(crrnc1)}`,
        blc2: `${crrnc2} ${depotPld.blcs.get(crrnc2)}`
      })
    } catch (e) {
      this.setState({err: true, spnr: false})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async onTab (evt, ix) {
    await this.load()
    this.setState({ix})
  }

  render () {
    return (
      <div>
        <MainBar />
        <Jumbo title={this.state.blc1} subTitle={this.state.blc2} />
        { this.state.spnr && <LinearProgress /> }
        <SubBar
          tabs={[{lbl: 'Addresses'}, {lbl: 'Transactions'}]}
          ix={this.state.ix}
          err={this.state.err}
          onTab={this.onTab}
        />
        {!this.state.err && this.state.ix === 0 &&
          <Listing rows={this.state.addrs} crrnc1={this.state.crrnc1} />}
        {!this.state.err && this.state.ix === 1 &&
          <Listing rows={this.state.tscs} crrnc1={this.state.crrnc1} />}
      </div>
    )
  }
}
