import React from 'react'
import {Link} from 'react-router-dom'
import Menu, { MenuItem } from 'material-ui/Menu'
import Tabs, { Tab } from 'material-ui/Tabs'
import AppBar from 'material-ui/AppBar'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import Toolbar from 'material-ui/Toolbar'
import Paper from 'material-ui/Paper'
import Button from 'material-ui/Button'
import * as CryptoIcons from 'react-cryptocoins'
import getSymbolFromCurrency from 'currency-symbol-map'
import Snackbar from 'material-ui/Snackbar'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import {Add, Close, Autorenew, HourglassFull, Block,
        Person} from 'material-ui-icons'
import Dialog, {DialogActions, DialogContent, DialogContentText,
        DialogTitle } from 'material-ui/Dialog'
import {theme, jumboStyle, tabStyle, floatBtnStyle,
       bxpBlockedStyle, bxpReadyStyle, bxpRunStyle, CryptoColors,
       paperStyle} from './Style'
import __ from '../util'

const setBxpTrigger = view => {
  view.cx.tmp.bxp = () => setTimeout(() => {
    view.info('View update triggered by bxp')
    __.addSnack('Data updated')
    view.load()
  }, 1000)
  view.cx.tmp.bxpSts = (sts) => {
    view.info(`View's bxp status set to "${sts}"`)
    view.setState({bxpSts: sts})
  }
}

const unsetBxpTrigger = view => {
  delete view.cx.tmp.bxp
  delete view.cx.tmp.bxpSts
}

const TopBar = ({
  title,
  midTitle,
  icon,
  iconLeft,
  onClickLeft,
  onClick,
  color,
  noUser
}) =>
  <AppBar position='static' color={color || 'default'} elevation={0}>
    <Toolbar style={{minHeight: '50px'}}>
      {iconLeft &&
      <IconButton aria-label='Menu' onClick={onClickLeft} color='contrast'>
        {iconLeft}
      </IconButton>}
      {!iconLeft &&
        <Typography type='headline' color='inherit'>
          {title || ''}
        </Typography>}
      <Typography
        type='headline'
        color='inherit'
        style={{flex: 1, textAlign: 'center'}}
      >
        {midTitle || ''}
      </Typography>
      {icon &&
        <IconButton aria-label='Menu' onClick={onClick} color='contrast'>
          {icon}
        </IconButton>}
      {!noUser &&
      <Link to={'/user/edit'}>
        <IconButton aria-label='Menu' color='contrast'>
          <Person />
        </IconButton>
      </Link>}
    </Toolbar>
  </AppBar>

const SubBar = ({tabs, ix, onClick}) =>
  <AppBar style={{position: 'relative'}}>
    <Tabs
      centered
      value={ix}
      onChange={onClick}
      indicatorColor='primary'
      style={tabStyle}
    >
      {tabs.map(lbl => <Tab key={__.uuid()} label={lbl} />)}
    </Tabs>
  </AppBar>

const Jumbo = ({title, subTitle, coin0, coin1}) =>
  <div style={jumboStyle}>
    <div>
      <Typography
        align='center'
        type='display3'
        color='inherit'
        style={{fontWeight: '100'}}
      >
        {title || '0.00'}&nbsp;
        {coin0 &&
          <CoinIcon coin={coin0} size={35} color={'white'} alt />
        }
      </Typography>
      <Typography align='center' type='headline' color='inherit'>
        {subTitle || '0.00'}&nbsp;
        {coin1 &&
          <CoinIcon coin={coin1} color={'white'} alt />
        }
      </Typography>
    </div>
  </div>

const FloatBtn = ({onClick, key}) => {
  return (
    <Button
      fab
      aria-label='add'
      style={floatBtnStyle}
      onClick={onClick}
      key={key || __.uuid()}
    >
      <Add />
    </Button>
  )
}

const BxpFloatBtn = ({onClick, bxpSts}) => {
  let icon, lbl, style
  if (bxpSts === 'blocked') {
    lbl = 'Blocked'
    icon = <Block />
    style = bxpBlockedStyle
  } else if (bxpSts === 'run') {
    lbl = 'Updating'
    icon = <HourglassFull />
    style = bxpRunStyle
  } else {  // ready
    lbl = 'Update'
    icon = <Autorenew />
    style = bxpReadyStyle
  }
  return (
    <Button
      fab
      aria-label={lbl}
      style={style}
      onClick={onClick}
      key='bxpFloatBtn'
    >
      {icon}
    </Button>
  )
}

const tscRow = (addr, tsc, coin0, addrIcon) => {
  const mx = 40
  let modeColor = tsc.mode === 'snd'
    ? theme.palette.error['500']
    : theme.palette.secondary['500']
  let modeSign = tsc.mode === 'snd' ? '-' : '+'
  let tags = tsc.tags.join(' ')
  if (tags.length > mx) tags = tags.slice(0, mx) + '...'
  let desc = tsc.desc
  if (desc.length > mx) desc = desc.slice(0, mx) + '...'
  return (
    <TableRow key={tsc._id}>
      {addrIcon &&
        <TableCell width={'10%'} style={{maxWidth: 0}}>
          <CoinIcon coin={addr.coin} size={40} />
        </TableCell>
      }
      <TableCell
        width={'70%'}
        style={{
          paddingTop: theme.spacing.unit,
          paddingBottom: theme.spacing.unit,
          maxWidth: 0
        }}
      >
        <Typography type='body2' style={{color: theme.palette.text.secondary}}>
          {__.ppTme(tsc._t)}
        </Typography>
        <Link
          to={`/tsc/${addr._id}/${tsc._id}`}
          style={{textDecoration: 'none'}}
        >
          <Typography type='headline'>
            {tsc.name}
          </Typography>
        </Link>
        <Typography type='body2' style={{color: theme.palette.text.secondary}}>
          {desc} {tags}
        </Typography>
      </TableCell>
      <TableCell
        numeric
        style={{
          paddingTop: theme.spacing.unit,
          paddingBottom: theme.spacing.unit,
          maxWidth: 0}}
        >
        <Typography type='headline' style={{color: modeColor}}>
          {modeSign} {tsc.amnt}
          <CoinIcon coin={addr.coin} color={modeColor} alt />
        </Typography>
        <Typography
          type='body2'
          style={{color: theme.palette.text.secondary}}
          gutterBottom
        >
          {modeSign} {tsc.amnt * addr.rates[coin0]}
          <CoinIcon
            coin={coin0}
            color={theme.palette.text.secondary}
            size={12}
            alt
          />
        </Typography>
      </TableCell>
    </TableRow>
  )
}

const TscListAddr = ({addr, tscs, coin0, addrIcon}) => {
  return (
    <Table>
      <TableBody>
        {tscs.map(tsc => {
          return tscRow(addr, tsc, coin0, addrIcon)
        })}
      </TableBody>
    </Table>
  )
}

const TscListAddresses = ({addrTscs, coin0, addrIcon}) =>
  <Paper square style={{...paperStyle}}>
    <Table>
      <TableBody>
        {addrTscs.map(addrTsc => {
          const addr = addrTsc[0]
          const tsc = addrTsc[1]
          return tscRow(addr, tsc, coin0, addrIcon)
        })}
      </TableBody>
    </Table>
  </Paper>

const Snack = ({msg, onClose}) =>
  <Snackbar
    open
    autoHideDuration={3500}
    enterTransitionDuration={500}
    anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
    onRequestClose={onClose}
    SnackbarContentProps={{'aria-describedby': 'message-id'}}
    message={<span id='message-id'>{msg}</span>}
    action={[
      <IconButton
        key='close'
        aria-label='Close'
        color='inherit'
        style={{width: theme.spacing.unit * 4, height: theme.spacing.unit * 4}}
        onClick={onClose}
      >
        <Close color={'grey'} />
      </IconButton>
    ]}
  />

const ExtLink = ({to, txt, style}) =>
  <a
    href={to}
    target='_blank'
    style={style}
  >
    {txt}
  </a>

class Modal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
    this.children = props.children
    this.open = (props.open == null) ? true : props.open
    this.onClose = props.onClose
    this.lbl = props.lbl || 'Error'
    let acs = props.actions || [{lbl: 'OK', onClick: this.onClose}]
    if (!props.noCncl && this.lbl.toLowerCase() !== 'error') {
      acs.push({lbl: 'Cancel', onClick: this.onClose})
    }
    this.btns = []
    for (let ac of acs) {
      this.btns.push(
        <Button
          key={ac.key || __.uuid()}
          onClick={
            props.withBusy
              ? async (...args) => {
                this.setState({busy: true})
                const d = await ac.onClick(...args)
                return d
              }
              : ac.onClick
          }
        >
          {ac.lbl}
        </Button>
      )
    }
  }
  render () {
    return (
      <Dialog
        open={this.open}
        onRequestClose={this.onClose}
        style={{background: theme.palette.background.default}}
      >
        <DialogTitle>{this.lbl}</DialogTitle>
        <DialogContent>
          <DialogContentText>{this.children}</DialogContentText>
        </DialogContent>
        {!this.state.busy &&
          this.btns &&
            <DialogActions>{this.btns}</DialogActions>}
        {this.state.busy &&
          <LinearProgress />}
      </Dialog>
    )
  }
}

const CoinIcon = ({coin, alt, color, size}) => {
  color = theme.palette.text[color] || color || CryptoColors[coin.toUpperCase()]
  coin = __.cap(coin.toLowerCase())
  if (CryptoIcons[coin]) {
    if (alt) {
      coin = coin + 'Alt'
    }
    const IconType = CryptoIcons[coin]
    return <IconType color={color} size={size || '18'} />
  }
  return <span>{getSymbolFromCurrency(coin.toUpperCase())}</span>
}

const DepotEmpty = () =>
  <Paper
    square
    elevation={0}
    style={{
      background: theme.palette.background.light,
      padding: theme.spacing.unit,
      textAlign: 'center',
      paddingTop: '50px'
    }}
  >
    <Link to={`/addr/add`} style={{textDecoration: 'none'}}>
      <Typography type='headline' gutterBottom>
        No addresses found, start by adding your first address
      </Typography>
    </Link>
    <Link to={`/user/edit`} style={{textDecoration: 'none'}}>
      <Typography
        type='subheading'
        style={{color: theme.palette.text.secondary}}
        gutterBottom
      >
        or edit your user settings
      </Typography>
    </Link>
  </Paper>

const PaperGrid = ({addrs, addrUpdIds, coin0}) => {
  return (
    <Paper
      square
      elevation={0}
      style={{
        background: theme.palette.background.light,
        padding: theme.spacing.unit
      }}
    >
      {addrs.map(addr => {
        return (
          <Paper
            key={addr._id}
            style={{
              margin: theme.spacing.unit * 2,
              padding: theme.spacing.unit * 2
            }}
          >
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell compact width={'40px'} style={{maxWidth: 0}}>
                    <CoinIcon coin={addr.coin} size={40} />
                  </TableCell>
                  <TableCell style={{maxWidth: 0}}>
                    {!addrUpdIds.has(addr._id) &&
                      <Link
                        to={`/addr/${addr._id}`}
                        style={{textDecoration: 'none'}}
                      >
                        <Typography type='headline'>
                          {addr.name}
                        </Typography>
                      </Link>}
                    {addrUpdIds.has(addr._id) &&
                      <Typography type='body2'>
                        {addr.name}
                      </Typography>}
                    <Typography
                      type='body2'
                      style={{color: theme.palette.text.secondary}}
                    >
                      {addr.hsh}
                    </Typography>
                  </TableCell>
                  <TableCell
                    compact numeric width={'30%'}
                    style={{maxWidth: 0}}
                  >
                    <Typography
                      type='headline'
                      style={{color: theme.palette.primary['500']}}
                    >
                      {addr.amnt}&nbsp;
                      <CoinIcon
                        coin={addr.coin}
                        color={theme.palette.primary['500']}
                        alt
                      />
                    </Typography>
                    <Typography
                      type='body2'
                      style={{color: theme.palette.text.secondary}}
                    >
                      {addr.amnt * addr.rates[coin0]}&nbsp;
                      <CoinIcon
                        coin={coin0}
                        size={14}
                        color={theme.palette.text.secondary}
                        alt
                      />
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

class DropDown extends React.Component {
  // usage:
  //   <DropDown
  //     _id=<unique_id>
  //     data={this.state.<array_with_objs>}
  //     slctd={this.state.<label_of_selected_item}
  //     action={this.<action_function>}
  //   />
  constructor (props) {
    super(props)
    this._id = props._id
    this.data = props.data
    this.action = props.action
    this.state = {open: false, slctd: props.slctd}
    this.onOpen = evt => {
      this.setState({open: true, anchorEl: evt.currentTarget})
    }
    this.onClose = () => {
      this.setState({open: false})
    }
    this.onActionClose = (slctd) => {
      this.setState({open: false, slctd: slctd})
    }
  }

  render () {
    return (
      <div>
        <Button
          aria-owns={this.open ? this._id : null}
          aria-haspopup
          onClick={this.onOpen}
        >
          {this.state.slctd}
        </Button>
        <Menu
          id={this._id}
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onRequestClose={this.onClose}
        >
          {this.data.map(d =>
            <MenuItem key={d.key} onClick={() => {
              this.onActionClose(d.lbl)
              this.action(d)
            }
            }>
              {d.lbl}
            </MenuItem>)}
        </Menu>
      </div>
    )
  }
}

export {
  setBxpTrigger,
  unsetBxpTrigger,
  TopBar,
  TscListAddr,
  TscListAddresses,
  DepotEmpty,
  PaperGrid,
  SubBar,
  Jumbo,
  CoinIcon,
  Snack,
  Modal,
  FloatBtn,
  BxpFloatBtn,
  DropDown,
  ExtLink
}
