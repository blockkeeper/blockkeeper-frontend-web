import React from 'react'
import {Link} from 'react-router-dom'
import Typography from 'material-ui/Typography'
import Table, {TableHead, TableBody, TableCell, TableRow} from 'material-ui/Table'
import {LinearProgress} from 'material-ui/Progress'
import Paper from 'material-ui/Paper'
import {theme, themeBgStyle} from './Style'
import {TopBar, SubBar, Jumbo, FloatBtn, Snack, Modal, CoinIcon} from './Lib'
import __ from '../util'

export default class DepotView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {tabIx: this.cx.tmp.depotTabIx || 0}
    this.load = this.load.bind(this)
    this.tab = this.tab.bind(this)
    this.goAddAddr = () => this.props.history.push('/addr/add')
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'depot'))
    await this.load()
  }

  async load () {
    try {
      // uncomment to test error view:
      //   throw this.err('An error occurred')
      const [
        {addrs, tscs},
        {coin0, coin1}
      ] = await Promise.all([
        this.cx.depot.loadAddrs(),
        this.cx.user.getCoins(this.state.coin)
      ])
      const blc = this.cx.depot.getAddrBlc(addrs)
      this.setState({
        err: null,
        addrs,
        tscs,
        coin0,
        coin1,
        blc1: `${blc.get(coin0)}`,
        blc2: `${blc.get(coin1)}`,
        snack: __.getSnack()
      })
    } catch (e) {
      this.setState({err: e.message})
      if (process.env.NODE_ENV === 'development') throw e
    }
  }

  async tab (evt, tabIx) {
    await this.load()
    this.setState({tabIx})
    this.cx.tmp.depotTabIx = tabIx
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          onClose={this.load}
          actions={[{lbl: 'Reload', onClick: this.load}]}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.state.addrs && this.state.addrs.length < 1) {
      return (
        <Modal
          onClose={this.load}
          lbl='Welcome'
          noCncl
          actions={[]}
        >
          <Link to={`/user/edit`}>Edit your settings</Link>
          <br />
          <Link to={`/addr/add`}>Add your first address</Link>
        </Modal>
      )
    } else if (this.state.addrs && this.state.tscs) {
      return (
        <div style={themeBgStyle}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />}
          <TopBar
            title='BK'
          />
          <Jumbo
            title={this.state.blc1}
            subTitle={this.state.blc2}
            coin0={this.state.coin0}
            coin1={this.state.coin1}
           />
          <SubBar
            tabs={['Addresses', 'Transactions']}
            ix={this.state.tabIx}
            onClick={this.tab}
          />

          {this.state.tabIx === 0 &&
          <PaperGrid
            ilk='addr'
            rows={this.state.addrs}
            coin0={this.state.coin0}

              />}
          {this.state.tabIx === 1 &&
          <List
            ilk='tsc'
            rows={this.state.tscs}
            coin0={this.state.coin0}
              />}
          {this.state.tabIx === 0 &&
          <FloatBtn onClick={this.goAddAddr} />}

        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

const PaperGrid = ({ilk, rows, coin0}) => {
  return (
    <Paper square style={{background: theme.palette.background.light, padding: theme.spacing.unit}} elevation={0}>
      {rows.map(row => {
        const urlPath = ilk === 'addr' ? 'addr' : `tsc/${row.addrId}`
        return (
          <Paper style={{margin: theme.spacing.unit * 2, padding: theme.spacing.unit * 2}} key={row._id}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell compact width={'40px'} style={{maxWidth: 0}}>
                    <CoinIcon coin={row.coin} size={40} />
                  </TableCell>
                  <TableCell style={{maxWidth: 0}}>
                    <Link to={`/${urlPath}/${row._id}`} style={{textDecoration: 'none'}}>
                      <Typography type='headline'>
                        {row.name}
                      </Typography>
                    </Link>
                    <Typography type='body2' style={{color: theme.palette.text.secondary}}>
                      {row.hsh}
                    </Typography>
                  </TableCell>
                  <TableCell compact numeric width={'30%'} style={{maxWidth: 0}}>
                    <Typography type='headline' style={{color: theme.palette.primary['500']}}>
                      {row.amnt}&nbsp;<CoinIcon coin={row.coin} color={theme.palette.primary['500']} alt />
                    </Typography>
                    <Typography type='body2' style={{color: theme.palette.text.secondary}}>
                      {row.amnt * row.rates.get(coin0)}&nbsp;<CoinIcon coin={coin0} size={14} color={theme.palette.text.secondary} alt />
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        )
      })}
    </Paper>
  )
}

const List = ({ilk, rows, coin0}) =>
  <Paper square style={{overflow: 'auto'}}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell compact>Type</TableCell>
          <TableCell compact>Name</TableCell>
          <TableCell compact numeric>Holdings</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => {
          const urlPath = ilk === 'addr' ? 'addr' : `tsc/${row.addrId}`
          return (
            <TableRow key={row._id}>
              <TableCell compact>
                <CoinIcon coin={row.coin} />
              </TableCell>
              <TableCell compact>
                <Link to={`/${urlPath}/${row._id}`}>{row.name}</Link>
                <br />
                {row.hsh}
              </TableCell>
              <TableCell compact numeric>
                <Typography type='headline' color='primary'>
                  {row.amnt}&nbsp;<CoinIcon coin={row.coin} color='primary' alt />
                </Typography>
                <Typography type='body2'>
                  {row.amnt * row.rates.get(coin0)}&nbsp;<CoinIcon coin={coin0} size={14} color='primary' alt />
                </Typography>

              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </Paper>
