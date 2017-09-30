import React from 'react'
import {Link} from 'react-router-dom'
import { MenuItem } from 'material-ui/Menu'
import Tabs, { Tab } from 'material-ui/Tabs'
import AppBar from 'material-ui/AppBar'
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import ExitToAppIcon from 'material-ui-icons/ExitToApp'
import DeleteForeverIcon from 'material-ui-icons/DeleteForever'
import { FormControl } from 'material-ui/Form'
import Select from 'material-ui/Select'
import Input, { InputLabel } from 'material-ui/Input'
import TransitiveNumber from 'react-transitive-number'
import Toolbar from 'material-ui/Toolbar'
import Paper from 'material-ui/Paper'
import Hidden from 'material-ui/Hidden'
import Button from 'material-ui/Button'
import * as CryptoIcons from 'react-cryptocoins'
import getSymbolFromCurrency from 'currency-symbol-map'
import Snackbar from 'material-ui/Snackbar'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import {Add, Close, Autorenew, HourglassEmpty, Person, InfoOutline} from 'material-ui-icons'
import Dialog, {DialogActions, DialogContent, DialogContentText,
        DialogTitle } from 'material-ui/Dialog'
import {theme, jumboStyle, tabStyle, floatBtnStyle, CryptoColors,
       paperStyle, overflowStyle} from './Style'
import __ from '../util'

const setBxpTrigger = view => {
  view.cx.tmp.bxp = () => setTimeout(() => {
    view.info('View update triggered by bxp')
    view.setSnack('Synchronization complete')
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
      {title &&
        <Typography type='headline' color='inherit'>
          <Hidden xsDown>
            <span>Blockkeeper</span>
          </Hidden>
          <Hidden smUp>
            <span>BK</span>
          </Hidden>
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
        <TransitiveNumber>
          {title ? formatNumber(title, coin0) : formatNumber(0, coin0)}
        </TransitiveNumber>&nbsp;
        {coin0 &&
          <CoinIcon coin={coin0} size={35} color={'white'} alt />
        }
      </Typography>
      <Typography align='center' type='headline' color='inherit'>
        <TransitiveNumber>
          {subTitle ? formatNumber(subTitle, coin1) : formatNumber(0, coin1)}
        </TransitiveNumber>&nbsp;
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
      color='primary'
      style={floatBtnStyle}
      onClick={onClick}
      key={key || __.uuid()}
    >
      <Add />
    </Button>
  )
}

const BxpFloatBtn = ({onClick, bxpSts, style}) => {
  let icon, lbl, dsbld
  if (bxpSts === 'blocked') {
    lbl = 'Blocked'
    icon = <HourglassEmpty />
    dsbld = true
  } else if (bxpSts === 'run') {
    lbl = 'Updating'
    icon = <Autorenew style={{animation: 'spin 1s linear infinite'}} />
    dsbld = true
  } else {  // ready
    lbl = 'Update'
    icon = <Autorenew />
    dsbld = false
  }
  return (
    <Button
      fab
      aria-label={lbl}
      color='primary'
      style={{...floatBtnStyle, ...style}}
      onClick={onClick}
      key='bxpFloatBtn'
      disabled={dsbld}
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
    <div
      key={tsc._id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.background.light}`,
        marginBottom: theme.spacing.unit * 4,
        paddingBottom: theme.spacing.unit * 2
      }}>
      {addrIcon &&
        <div style={{paddingRight: theme.spacing.unit * 2, paddingTop: theme.spacing.unit * 3}}>
          <CoinIcon coin={addr.coin} size={40} />
        </div>
      }
      <div style={{flexGrow: 1, minWidth: 0}}>
        <Typography type='body2' style={{color: theme.palette.text.secondary}}>
          {__.ppTme(tsc._t)}
        </Typography>
        <Link
          to={`/tsc/${addr._id}/${tsc._id}`}
          style={{textDecoration: 'none'}}
        >
          <Typography type='headline' style={overflowStyle}>
            {tsc.name}
          </Typography>
        </Link>
        <Typography type='body2' style={{color: theme.palette.text.secondary, ...overflowStyle}}>
          {desc} {tags} asdf asdf #test
        </Typography>
      </div>
      <div
        style={{textAlign: 'right', whiteSpace: 'nowrap'}}
        >
        <Typography type='headline' style={{color: modeColor, paddingTop: theme.spacing.unit * 3}}>
          {modeSign} {formatNumber(tsc.amnt, addr.coin)}
          <CoinIcon coin={addr.coin} color={modeColor} alt />
        </Typography>
        <Typography
          type='body2'
          style={{color: theme.palette.text.secondary}}
          gutterBottom
        >
          {modeSign} {formatNumber(tsc.amnt * addr.rates[coin0], coin0)}
          <CoinIcon
            coin={coin0}
            color={theme.palette.text.secondary}
            size={12}
            alt
          />
        </Typography>
      </div>
    </div>
  )
}

const TscListAddr = ({addr, tscs, coin0, addrIcon}) => {
  return (
    <div>
      {tscs.map(tsc => {
        return tscRow(addr, tsc, coin0, addrIcon)
      })}
    </div>
  )
}

const TscListAddresses = ({addrTscs, coin0, addrIcon}) =>
  <Paper square style={{...paperStyle}}>
    <div>
      {addrTscs.map(addrTsc => {
        const addr = addrTsc[0]
        const tsc = addrTsc[1]
        return tscRow(addr, tsc, coin0, addrIcon)
      })}
    </div>
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

const formatNumber = (n, currency) => {
  if (typeof n !== 'number') {
    n = Number(n)
  }
  // TODO use user locale
  return n.toLocaleString('en-GB', { maximumFractionDigits: __.dec(currency) })
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
              padding: theme.spacing.unit * 3,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <div style={{paddingRight: theme.spacing.unit * 2}}>
              <CoinIcon coin={addr.coin} size={theme.spacing.unit * 5} />
            </div>
            <div style={{flexGrow: 1, minWidth: 0}}>
              {!addrUpdIds.has(addr._id) &&
              <Link
                to={`/addr/${addr._id}`}
                style={{textDecoration: 'none'}}
              >
                <Typography
                  type='display1'
                  style={{color: theme.palette.text.primary, ...overflowStyle}}
                >
                  {addr.name}
                </Typography>
              </Link>}
              {addrUpdIds.has(addr._id) &&
              <Typography type='body2'>
                {addr.name}
              </Typography>}
              <Typography
                type='body2'
                style={{color: theme.palette.text.secondary, ...overflowStyle}}
            >
                <Hidden smDown>
                  <span>
                    <b>Address</b>&nbsp;
                  </span>
                </Hidden>
                {addr.hsh}
              </Typography>
            </div>
            <div style={{textAlign: 'right', whiteSpace: 'nowrap'}}>
              <Typography
                type='display1'
                style={{color: theme.palette.primary['500']}}
              >
                {formatNumber(addr.amnt, addr.coin)}&nbsp;
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
                {formatNumber(addr.amnt * addr.rates[coin0], coin0)}&nbsp;
                <CoinIcon
                  coin={coin0}
                  size={14}
                  color={theme.palette.text.secondary}
                  alt
                />
              </Typography>
            </div>
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
  //     disabled={this.state.<disabled>}
  //   />
  constructor (props) {
    super(props)
    this._id = props._id
    this.data = props.data
    this.title = props.title
    this.action = props.action
    this.state = {slctd: props.slctd, disabled: props.disabled}
    this.handleChange = name => event => {
      this.setState({ [name]: event.target.value })
      this.action(this.data.find((i) => {
        return i.lbl === event.target.value
      }))
    }
  }
  componentWillReceiveProps (props) {
    this.setState({disabled: props.disabled})
  }

  render () {
    return (
      <FormControl fullWidth margin='normal'>
        <InputLabel htmlFor={this._id}>{this.title}</InputLabel>
        <Select
          value={this.state.slctd}
          onChange={this.handleChange('slctd')}
          input={<Input id={this._id} />}
          disabled={this.state.disabled}
          >
          {this.data.map(d =>
            <MenuItem key={d.key} value={d.lbl}>
              {d.lbl}
            </MenuItem>)}
        </Select>
      </FormControl>
    )
  }
}

const UserList = ({askLogout, askDelete}) =>
  <List>
    <a href='https://blockkeeper.io' target='_blank' style={{textDecoration: 'none'}} rel='noopener noreferrer'>
      <ListItem divider button>
        <ListItemIcon>
          <InfoOutline />
        </ListItemIcon>
        <ListItemText primary='About' />
      </ListItem>
    </a>
    <ListItem divider button onClick={askLogout}>
      <ListItemIcon>
        <ExitToAppIcon />
      </ListItemIcon>
      <ListItemText primary='Logout (and clear LocalStorage)' />
    </ListItem>
    <ListItem button onClick={askDelete}>
      <ListItemIcon>
        <DeleteForeverIcon />
      </ListItemIcon>
      <ListItemText primary='Delete account' />
    </ListItem>
  </List>

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
  formatNumber,
  ExtLink,
  UserList
}
