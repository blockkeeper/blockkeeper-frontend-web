import React from 'react'
import {Link} from 'react-router-dom'
import Menu, { MenuItem } from 'material-ui/Menu'
import Tabs, { Tab } from 'material-ui/Tabs'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton'
import Typography from 'material-ui/Typography'
import PersonIcon from 'material-ui-icons/Person'
import LoopIcon from 'material-ui-icons/Loop'
import {jumboStyle} from './Style'
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from 'material-ui/Dialog'
import __ from '../util'

const TopBar = ({title, icon, onClick, noUser}) =>
  <AppBar position='static'>
    <Toolbar>
      {icon &&
        <IconButton color='contrast' aria-label='Menu' onClick={onClick}>
          {icon}
        </IconButton>}
      <Typography type='headline' color='inherit'>
        {title || ''}
      </Typography>
      {!noUser &&
      <Link to={'/user/edit'}><PersonIcon /></Link>}
    </Toolbar>
  </AppBar>

const SubBar = ({tabs, ix, onClick}) =>
  <AppBar position='static'>
    <Tabs index={ix} onChange={onClick} centered>
      {tabs.map(lbl => <Tab key={__.uuid()} label={lbl} />)}
    </Tabs>
  </AppBar>

const Jumbo = ({title, subTitle1, subTitle2, icon}) =>
  <div style={jumboStyle}>
    {icon &&
      <Typography align='center' type='display1'>
        {icon}
      </Typography>}
    <Typography align='center' type='display3'>
      {title || 'Loading'}
    </Typography>
    <Typography align='center' type='display1'>
      {subTitle1 || 'data...'}
    </Typography>
    {subTitle2 &&
      <Typography align='center' type='display1'>
        {subTitle2 || ''}
      </Typography>}
  </div>

const Modal = ({open, onClose, children, title, actions}) => {
  actions = actions || [<Button key={__.uuid()} onClick={onClose}>OK</Button>]
  return (
    <Dialog open={open} onRequestClose={onClose} >
      <DialogTitle>{title || 'Error'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{children}</DialogContentText>
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  )
}

const SaveBtn = ({actv, busy, save}) => {
  if (busy) return <Button disabled>Saving... <LoopIcon /></Button>
  if (actv) return <Button onClick={save}>Save</Button>
  return <Button disabled>Save</Button>
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
  Modal,
  SaveBtn,
  DropDown
}
