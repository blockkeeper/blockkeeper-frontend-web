import React from 'react'
import {Link} from 'react-router-dom'
import {MenuItem} from 'material-ui/Menu'
import Tabs, {Tab} from 'material-ui/Tabs'
import AppBar from 'material-ui/AppBar'
import List, {ListItem, ListItemIcon, ListItemText} from 'material-ui/List'
import ExitToAppIcon from 'material-ui-icons/ExitToApp'
import DeleteForeverIcon from 'material-ui-icons/DeleteForever'
import {FormControl} from 'material-ui/Form'
import Select from 'material-ui/Select'
import ScrollToTop from 'react-scroll-up'
import Tooltip from 'material-ui/Tooltip'
import Input, { InputLabel } from 'material-ui/Input'
import Grid from 'material-ui/Grid'
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
import {UserAgentProvider, UserAgent} from '@quentin-sommer/react-useragent'
import {LinearProgress} from 'material-ui/Progress'
import {Add, Close, Autorenew, AccountCircle, InfoOutline,
       Error, KeyboardArrowUp, Feedback, BugReport} from 'material-ui-icons'
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

const TopBar = ({
  title,
  midTitle,
  action,
  onClick,
  iconLeft,
  onClickLeft,
  color,
  noUser,
  modeCancel,
  className
}) =>
  <AppBar position='static' color={color || 'default'} elevation={0} className={className}>
    <Toolbar style={{minHeight: '50px'}}>
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
        <div style={{marginRight: 'auto'}}>
          {modeCancel &&
            <Typography
              type='headline'
              color='inherit'
              onClick={onClickLeft}
              style={{
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </Typography>}
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
                <span>Block Keeper</span>
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
          style={{
            flex: 1,
            fontSize: '16px',
            fontWeight: '700'
          }}
        >
          {midTitle || ''}
        </Typography>
      </div>
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
        <div style={{marginLeft: 'auto'}}>
          {action &&
            <Typography
              type='headline'
              color='inherit'
              onClick={onClick}
              style={{
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              {action}
            </Typography>}
          {!noUser &&
          <Link to={'/user/edit'}>
            <IconButton
              aria-label='Menu'
              color='contrast'
              style={{
                left: theme.spacing.unit * 2
              }}
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
          {title ? __.formatNumber(title, coin0) : __.formatNumber(0, coin0)}
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
          {subTitle
            ? __.formatNumber(subTitle, coin1)
            : __.formatNumber(0, coin1)}
        </TransitiveNumber>&nbsp;
        {coin1 &&
          <CoinIcon coin={coin1} color={'white'} alt />
        }
      </Typography>
    </div>
  </div>

const ToTopBtn = ({className}) =>
  <ScrollToTop showUnder={200} style={{right: '50%', bottom: theme.spacing.unit * 2}}>
    <Button
      fab
      aria-label='top'
      color='contrast'
      classes={{
        raisedContrast: className
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
    /* lbl = 'Blocked'
    icon = <HourglassEmpty />
    dsbld = true */
    return null
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
      <Link
        to={`/tsc/${addr._id}/${tsc._id}`}
        style={{textDecoration: 'none'}}
      >
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
                {modeSign} {__.formatNumber(tsc.amnt, addr.coin)}&nbsp;
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
                {modeSign}
                {__.formatNumber(tsc.amnt * addr.rates[coin0], coin0)}
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
      </Link>
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
    anchorOrigin={{vertical: 'top', horizontal: 'center'}}
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
  <a href={to} target='_blank' className={className} style={style}>
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

class BrowserGate extends React.Component {
  /* TODO pass parser to props
  ? <div>
    test
    {console.log(parser.getBrowser())}
  </div>
  //: <div>
  //  test
  // {console.log(parser.getBrowser())}
  // </div>} */

  render () {
    return (
      <UserAgentProvider ua={window.navigator.userAgent}>
        <UserAgent returnfullParser>
          {parser => (
            <div>
              {(
                (parser.getBrowser().name === 'Chrome' && Number(parser.getBrowser().major) >= 60) ||
                (parser.getBrowser().name === 'Edge' && Number(parser.getBrowser().major) >= 16) ||
                (parser.getBrowser().name === 'Safari' && Number(parser.getBrowser().major) >= 11) ||
                (parser.getBrowser().name === 'Mobile Safari' && Number(parser.getBrowser().major) >= 9) ||
                (parser.getBrowser().name === 'Opera' && Number(parser.getBrowser().major) >= 48) ||
                (parser.getBrowser().name === 'Firefox' && Number(parser.getBrowser().major) >= 55)
               )
              ? this.props.allwd
              : this.props.ntAll}
            </div>
          )}
        </UserAgent>
      </UserAgentProvider>
    )
  }
}

const NtAllwd = () => {
  return <div>
    <Typography type='title' align='center' gutterBottom style={{marginTop: '40px', marginBottom: '40px'}}>
      Your Browser is not supported!
      <br />
      <b>Please upgrade your browser to access <nobr>Block Keeper</nobr></b>.
    </Typography>
    <Typography type='body1' align='center' gutterBottom>
      Required: Chrome > 60, Edge > 16, Safari > 11, Opera > 48, Firefox > 55
    </Typography>
  </div>
}

const CoinIcon = ({coin, alt, color, size, style}) => {
  color = theme.palette.text[color] || color || CryptoColors[coin.toUpperCase()]
  coin = __.cap(coin.toLowerCase())
  if (CryptoIcons[coin]) {
    if (alt) {
      coin = coin + 'Alt'
    }
    const IconType = CryptoIcons[coin]
    return <IconType color={color} size={size || '18'} style={style} />
  }
  return <span>{getSymbolFromCurrency(coin.toUpperCase())}</span>
}

const DepotEmpty = ({className}) =>
  <div>
    <Grid container spacing={0} justify='center'>
      <Grid item xs={6} className={className}>
        <Typography
          type='display2'
          gutterBottom
          style={{
            color: theme.palette.text.primary,
            marginTop: '130px'
          }}
        >
          Welcome to Block Keeper
        </Typography>
        <Typography type='subheading' gutterBottom>
          In order to start using our app, please go ahead and connect your first wallet.
        </Typography>
      </Grid>
    </Grid>
  </div>

const PaperGrid = ({
  addrs,
  coin0,
  addrUpdIds,
  addrUpdErrIds,
  className,
  itemClassName,
  addrClassName,
  amntClassName,
  display1ClassName,
  body2ClassName
}) => {
  return (
    <Paper
      square
      elevation={0}
      className={className}
    >
      {addrs.map(addr => {
        return (
          <Link
            to={`/wallet/${addr._id}`}
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
                  {addrUpdErrIds.has(addr._id) &&
                  <InfoUpdateFailed />}
                </Typography>
                <Typography
                  type='body2'
                  className={body2ClassName}
                  noWrap
                >
                  {addr.hsh &&
                  <Hidden smDown>
                    <span>
                      <b>Wallet</b>&nbsp;
                    </span>
                  </Hidden>}
                  {!addr.hsh && addr.desc &&
                  <Hidden smDown>
                    <span>
                      <b>Note</b>&nbsp;
                    </span>
                  </Hidden>}
                  {!addr.hsh && !addr.desc &&
                  <Hidden smDown>
                    <span>
                      <b>Wallet</b>&nbsp;
                    </span>
                  </Hidden>}
                  {addr.hsh || addr.desc || 'manual'}
                </Typography>
              </div>
              <div className={amntClassName}>
                <Typography
                  type='display1'
                  color='primary'
                  className={display1ClassName}
                >
                  {__.formatNumber(addr.amnt, addr.coin)}&nbsp;
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
                  {__.formatNumber(addr.amnt * addr.rates[coin0], coin0)}&nbsp;
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
  <div style={{display: 'inline'}}>
    <Hidden xsDown>
      <Tooltip id='tooltip-icon' title='Update failed' placement='top'>
        <IconButton aria-label='Error' style={{height: 'auto'}}>
          <Error
            style={{
              color: theme.palette.error[500],
              height: theme.spacing.unit * 3,
              width: theme.spacing.unit * 3
            }}
          />
        </IconButton>
      </Tooltip>
    </Hidden>
    <Hidden smUp>
      <Error
        style={{
          color: theme.palette.error[500],
          height: theme.spacing.unit * 2,
          width: theme.spacing.unit * 2
        }}
      />
    </Hidden>
  </div>

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
    <a
      href='https://wantoo.io/blockkeeper-feedback/'
      target='_blank'
      style={{textDecoration: 'none'}}
      rel='noopener noreferrer'
    >
      <ListItem divider button>
        <ListItemIcon>
          <Feedback />
        </ListItemIcon>
        <ListItemText primary='Feedback' />
      </ListItem>
    </a>
    <a
      href='https://github.com/blockkeeper/blockkeeper-frontend-web/issues'
      target='_blank'
      style={{textDecoration: 'none'}}
      rel='noopener noreferrer'
    >
      <ListItem divider button>
        <ListItemIcon>
          <BugReport />
        </ListItemIcon>
        <ListItemText primary='Report errors + bugs' />
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
  TopBar,
  TscListAddr,
  TscListAddresses,
  DepotEmpty,
  PaperGrid,
  SubBar,
  Jumbo,
  BrowserGate,
  NtAllwd,
  CoinIcon,
  Snack,
  Modal,
  ToTopBtn,
  FloatBtn,
  BxpFloatBtn,
  DropDown,
  ExtLink,
  InfoUpdateFailed,
  Done,
  Edit,
  UserList
}
