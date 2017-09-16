import React from 'react'
import {Link} from 'react-router-dom'
import Menu, { MenuItem } from 'material-ui/Menu'
import Tabs, { Tab } from 'material-ui/Tabs'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import {Lock} from 'material-ui-icons'
import Snackbar from 'material-ui/Snackbar'
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import {LinearProgress} from 'material-ui/Progress'
import PersonIcon from 'material-ui-icons/Person'
import AddIcon from 'material-ui-icons/Add'
import {jumboStyle, tabStyle, floatBtnStyle} from './Style'
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from 'material-ui/Dialog'
import __ from '../util'

const TopBar = ({title, midTitle, icon, iconLeft, color, onClick, onClickLeft, noUser}) =>
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
      <Typography type='headline' color='inherit' style={{flex: 1, textAlign: 'center'}}>
        {midTitle || ''}
      </Typography>
      {icon &&
        <IconButton aria-label='Menu' onClick={onClick} color='contrast'>
          {icon}
        </IconButton>}
      {!noUser &&
      <Link to={'/user/edit'}>
        <IconButton aria-label='Menu' color='contrast'>
          <PersonIcon />
        </IconButton>
      </Link>}
    </Toolbar>
  </AppBar>

const SubBar = ({tabs, ix, onClick}) =>
  <AppBar position='static'>
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

const Jumbo = ({title, subTitle1, subTitle2, icon}) =>
  <div style={jumboStyle}>
    {icon &&
      <Typography align='center' type='display1'>
        {icon}
      </Typography>}
    <div>
      <Typography align='center' type='display3' style={{fontWeight: '100'}}>
        {title || 'Loading'}
      </Typography>
      <Typography align='center' type='subheading' color='inherit'>
        {subTitle1 || 'data...'}
      </Typography>
    </div>
    {subTitle2 &&
      <Typography align='center' type='display1'>
        {subTitle2 || ''}
      </Typography>}
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
      <AddIcon />
    </Button>
  )
}

const Snack = ({msg, onClose}) =>
  <Snackbar
    open
    autoHideDuration={2500}
    enterTransitionDuration={500}
    anchorOrigin={{vertical: 'top', horizontal: 'center'}}
    onRequestClose={onClose}
    SnackbarContentProps={{'aria-describedby': 'message-id'}}
    message={<span id='message-id'>{msg}</span>}
  />

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
      <Dialog open={this.open} onRequestClose={this.onClose} >
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
  TopBar,
  SubBar,
  Jumbo,
  Snack,
  Modal,
  FloatBtn,
  DropDown
}
