import React from 'react'
import Tabs, { Tab } from 'material-ui/Tabs'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import Button from 'material-ui/Button'
import {jumboStyle} from './Style'
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from 'material-ui/Dialog'
import __ from '../util'

const TopBar = ({title, icon, onClick}) =>
  <AppBar position='static'>
    <Toolbar>
      {icon &&
        <IconButton color='contrast' aria-label='Menu' onClick={onClick}>
          {icon}
        </IconButton>}
      <Typography type='headline' color='inherit'>
        {title || ''}
      </Typography>
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

export {
  TopBar,
  SubBar,
  Jumbo,
  Modal
}
