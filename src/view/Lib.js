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
import ScrollToTop from 'react-scroll-up'
import Tooltip from 'material-ui/Tooltip'
import Input, { InputLabel } from 'material-ui/Input'
import TransitiveNumber from 'react-transitive-number'
import Toolbar from 'material-ui/Toolbar'
import Paper from 'material-ui/Paper'
import Divider from 'material-ui/Divider'
import Hidden from 'material-ui/Hidden'
import Button from 'material-ui/Button'
import * as CryptoIcons from 'react-cryptocoins'
import getSymbolFromCurrency from 'currency-symbol-map'
import Snackbar from 'material-ui/Snackbar'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import {Add, Close, Autorenew, HourglassEmpty,
        AccountCircle, InfoOutline, Error, KeyboardArrowUp} from 'material-ui-icons'
import Dialog, {DialogActions, DialogContent, DialogContentText,
        DialogTitle } from 'material-ui/Dialog'
import {theme, jumboStyle, floatBtnStyle, CryptoColors} from './Style'
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

const addrLimitReached = (cmp, addrs) => {
  if (addrs.length >= __.cfg('mxAddrCnt')) {
    cmp.setSnack('Maximum number of addresses reached: ' +
                   'Please delete old addresses first')
    return true
  }
  return false
}

const TopBar = ({
  title,
  midTitle,
  icon,
  onClick,
  iconLeft,
  onClickLeft,
  color,
  noUser,
  className
}) =>
  <AppBar position='static' color={color || 'default'} elevation={0} className={className}>
    <Toolbar style={{minHeight: '50px'}}>
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
        <div style={{marginRight: 'auto'}}>
          {iconLeft &&
            <IconButton
              aria-label='Menu'
              onClick={onClickLeft}
              color='contrast'
              style={{
                right: theme.spacing.unit * 2,
                marginRight: 'auto'
              }}
            >
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
        </div>
      </div>
      <div>
        <Typography
          type='headline'
          color='inherit'
          align='center'
          style={{flex: 1}}
        >
          {midTitle || ''}
        </Typography>
      </div>
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
        <div style={{marginLeft: 'auto'}}>
          {icon &&
            <IconButton
              aria-label='Menu'
              color='contrast'
              onClick={onClick}
              style={{width: 'auto'}}
            >
              {icon}
            </IconButton>}
          {!noUser &&
          <Link to={'/user/edit'}>
            <IconButton
              aria-label='Menu'
              color='contrast'
              style={{left: theme.spacing.unit * 2}}
            >
              <AccountCircle />
            </IconButton>
          </Link>}
        </div>
      </div>
    </Toolbar>
  </AppBar>

const SubBar = ({tabs, ix, onClick, rootClassName}) =>
  <AppBar style={{position: 'relative', backgroundColor: 'white'}}>
    <Tabs
      centered
      value={ix}
      onChange={onClick}
      indicatorColor='primary'
      textColor='primary'
    >
      {tabs.map(lbl =>
        <Tab
          key={__.uuid()}
          label={lbl}
          classes={{
            root: rootClassName
          }}
        />
      )}
    </Tabs>
  </AppBar>

const Jumbo = ({title, subTitle, coin0, coin1, display3ClassName}) =>
  <div style={jumboStyle}>
    <div>
      <Typography
        align='center'
        type='display3'
        color='inherit'
        className={display3ClassName}
      >
        <TransitiveNumber>
          {title ? formatNumber(title, coin0) : formatNumber(0, coin0)}
        </TransitiveNumber>&nbsp;
        <Hidden xsDown>
          <CoinIcon coin={coin0} size={35} color={'white'} alt />
        </Hidden>
        <Hidden smUp>
          <CoinIcon coin={coin0} size={32} color={'white'} alt />
        </Hidden>
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

const ToTopBtn = ({second, actnBtnClrClassName}) =>
  <ScrollToTop showUnder={200} style={{right: theme.spacing.unit * 2, bottom: second ? theme.spacing.unit * 10 : theme.spacing.unit * 18}}>
    <Button
      fab
      aria-label='add'
      color='primary'
      classes={{
        raisedPrimary: actnBtnClrClassName
      }}
    >
      <KeyboardArrowUp />
    </Button>
  </ScrollToTop>

const FloatBtn = ({onClick, key, actnBtnClrClassName}) => {
  return (
    <Button
      fab
      aria-label='add'
      color='primary'
      style={floatBtnStyle}
      onClick={onClick}
      key={key || __.uuid()}
      classes={{
        raisedPrimary: actnBtnClrClassName
      }}
    >
      <Add />
    </Button>
  )
}

const BxpFloatBtn = ({onClick, bxpSts, style, first}) => {
  let icon, lbl, dsbld
  if (bxpSts === 'blocked') {
    lbl = 'Blocked'
    icon = <HourglassEmpty />
    dsbld = true
    /* return null */
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
      color='contrast'
      style={{...floatBtnStyle, bottom: first ? theme.spacing.unit * 2 : theme.spacing.unit * 10}}
      onClick={onClick}
      key='bxpFloatBtn'
      disabled={dsbld}
    >
      {icon}
    </Button>
  )
}

const tscRow = (
  addr,
  tsc,
  coin0,
  addrIcon,
  showAddrInfos,
  gridWrapClassName,
  gridGutterClassName,
  itemClassName,
  display1ClassName,
  body2ClassName,
  tscAmntClassName,
  tscIconClassname
) => {
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
    <div key={tsc._id} className={gridWrapClassName}>
      <div className={gridGutterClassName}>
        <div className={itemClassName}>
          {addrIcon &&
            <div className={tscIconClassname}>
              <Hidden xsDown>
                <CoinIcon coin={addr.coin} size={42} />
              </Hidden>
              <Hidden smUp>
                <CoinIcon coin={addr.coin} size={28} />
              </Hidden>
            </div>
          }
          <div style={{flexGrow: 1, minWidth: 0}}>
            <Typography
              type='body2'
              className={body2ClassName}
              style={{color: theme.palette.text.secondary}}
            >
              {__.ppTme(tsc._t)}
            </Typography>
            <Link
              to={`/tsc/${addr._id}/${tsc._id}`}
              style={{textDecoration: 'none'}}
            >
              <Typography
                type='display1'
                className={display1ClassName}
                style={{
                  color: theme.palette.text.primary
                }}
                noWrap
              >
                {showAddrInfos &&
                  addr.name}
                {!showAddrInfos &&
                  tsc.name}
              </Typography>
            </Link>
            <Typography
              type='body2'
              className={body2ClassName}
              style={{color: theme.palette.text.secondary}}
              noWrap
            >
              {showAddrInfos &&
                (tsc.name || tsc.desc)}
              {!showAddrInfos &&
                (tsc.desc || 'Empty description')}
            </Typography>
          </div>
          <div className={tscAmntClassName}>
            <Typography
              type='display1'
              style={{
                color: modeColor
              }}
              className={display1ClassName}
            >
              {modeSign} {formatNumber(tsc.amnt, addr.coin)}&nbsp;
              <Hidden xsDown>
                <CoinIcon
                  coin={addr.coin}
                  color={modeColor}
                  alt
                  />
              </Hidden>
              <Hidden smUp>
                <CoinIcon
                  coin={addr.coin}
                  color={modeColor}
                  size={12}
                  alt
                  />
              </Hidden>
            </Typography>
            <Typography
              type='body2'
              style={{color: theme.palette.text.secondary}}
              className={body2ClassName}
              gutterBottom
            >
              {modeSign} {formatNumber(tsc.amnt * addr.rates[coin0], coin0)}
              <Hidden xsDown>
                <CoinIcon
                  coin={coin0}
                  color={theme.palette.text.secondary}
                  size={12}
                  alt
                />
              </Hidden>
              <Hidden smUp>
                <CoinIcon
                  coin={coin0}
                  color={theme.palette.text.secondary}
                  size={10}
                  alt
                />
              </Hidden>
            </Typography>
          </div>
        </div>
        <Hidden mdDown>
          <Divider />
        </Hidden>
      </div>
      <Hidden lgUp>
        <Divider />
      </Hidden>
    </div>
  )
}

const TscListAddr = ({
  addr,
  tscs,
  coin0,
  addrIcon,
  className,
  gridGutterClassName,
  itemClassName,
  gridWrapClassName,
  display1ClassName,
  body2ClassName,
  tscAmntClassName
}) =>
  <Paper
    square
    className={className}
    elevation={5}
  >
    {tscs.map(tsc => {
      return tscRow(
        addr,
        tsc,
        coin0,
        addrIcon,
        false,
        gridWrapClassName,
        gridGutterClassName,
        itemClassName,
        display1ClassName,
        body2ClassName,
        tscAmntClassName
      )
    })}
  </Paper>

const TscListAddresses = ({
  addrTscs,
  coin0,
  addrIcon,
  className,
  gridGutterClassName,
  itemClassName,
  gridWrapClassName,
  display1ClassName,
  body2ClassName,
  tscAmntClassName,
  tscIconClassname
}) =>
  <Paper
    square
    className={className}
  >
    {addrTscs.map(addrTsc => {
      return tscRow(
        addrTsc[0],
        addrTsc[1],
        coin0,
        addrIcon,
        true,
        gridWrapClassName,
        gridGutterClassName,
        itemClassName,
        display1ClassName,
        body2ClassName,
        tscAmntClassName,
        tscIconClassname
      )
    })}
  </Paper>

const Snack = ({msg, onClose}) =>
  <Snackbar
    open
    autoHideDuration={3500}
    transitionDuration={500}
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

const ExtLink = ({to, txt, className, style}) =>
  <a
    href={to}
    target='_blank'
    className={className}
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
  // TODO use user locale
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: __.dec(currency)
  }).format(n)
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

const PaperGrid = ({addrs, coin0, addrUpdIds, addrUpdErrIds, className, itemClassName, addrClassName, amntClassName, display1ClassName, body2ClassName}) => {
  return (
    <Paper
      square
      elevation={0}
      className={className}
    >
      {addrs.map(addr => {
        return (
          <Link
            to={`/addr/${addr._id}`}
            style={{textDecoration: 'none'}}
            key={addr._id}
          >
            <Paper
              elevation={3}
              className={itemClassName}
            >
              <div>
                <Hidden xsDown>
                  <CoinIcon coin={addr.coin} size={42} />
                </Hidden>
                <Hidden smUp>
                  <CoinIcon coin={addr.coin} size={28} />
                </Hidden>
              </div>
              <div className={addrClassName}>
                <Typography
                  type='display1'
                  className={display1ClassName}
                  style={{
                    color: theme.palette.text.primary
                  }}
                  noWrap
                >
                  {addr.name}&nbsp;
                </Typography>
                <Typography
                  type='body2'
                  className={body2ClassName}
                  noWrap
                >
                  {addr.hsh &&
                  <Hidden smDown>
                    <span>
                      <b>Address</b>&nbsp;
                    </span>
                  </Hidden>}
                  {!addr.hsh && addr.desc &&
                  <Hidden smDown>
                    <span>
                      <b>Note</b>&nbsp;
                    </span>
                  </Hidden>}
                  {addr.hsh || addr.desc}
                </Typography>
              </div>
              <div className={amntClassName}>
                <Typography
                  type='display1'
                  color='primary'
                  className={display1ClassName}
                >
                  {formatNumber(addr.amnt, addr.coin)}&nbsp;
                  <Hidden xsDown>
                    <CoinIcon
                      coin={addr.coin}
                      color={theme.palette.primary['500']}
                      alt
                  />
                  </Hidden>
                  <Hidden smUp>
                    <CoinIcon
                      coin={addr.coin}
                      color={theme.palette.primary['500']}
                      size={12}
                      alt
                  />
                  </Hidden>
                </Typography>
                <Typography
                  type='body2'
                  className={body2ClassName}
                  style={{color: theme.palette.text.secondary}}
                >
                  {formatNumber(addr.amnt * addr.rates[coin0], coin0)}&nbsp;
                  <Hidden xsDown>
                    <CoinIcon
                      coin={coin0}
                      size={14}
                      color={theme.palette.text.secondary}
                      alt
                  />
                  </Hidden>
                  <Hidden smUp>
                    <CoinIcon
                      coin={coin0}
                      size={10}
                      color={theme.palette.text.secondary}
                      alt
                  />
                  </Hidden>
                </Typography>
              </div>
              {addrUpdErrIds.has(addr._id) &&
              <InfoUpdateFailed />}
            </Paper>
          </Link>
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

const InfoUpdateFailed = () =>
  <Tooltip id='tooltip-icon' title='Update failed' placement='top'>
    <IconButton aria-label='Error' style={{height: '100%', marginLeft: theme.spacing.unit * 2}}>
      <Error style={{color: theme.palette.error[500], height: theme.spacing.unit * 4, width: theme.spacing.unit * 4}} />
    </IconButton>
  </Tooltip>

const Edit = () =>
  <span>Edit</span>

const Done = () =>
  <span>Done</span>

const UserList = ({askLogout, askDelete}) =>
  <List>
    <a
      href='https://blockkeeper.io'
      target='_blank'
      style={{textDecoration: 'none'}}
      rel='noopener noreferrer'
    >
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
      <ListItemText primary='Logout' />
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
  addrLimitReached,
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
  ToTopBtn,
  FloatBtn,
  BxpFloatBtn,
  DropDown,
  formatNumber,
  ExtLink,
  InfoUpdateFailed,
  Done,
  Edit,
  UserList
}
