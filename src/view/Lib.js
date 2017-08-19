import React from 'react'
import { Link } from 'react-router-dom'
import Tabs, { Tab } from 'material-ui/Tabs'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import MenuIcon from 'material-ui-icons/Menu'
import ErrorIcon from 'material-ui-icons/Error'
import Button from 'material-ui/Button'
import {jumboStyle, faultStyle} from './Style'
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from 'material-ui/Dialog'
import __ from '../util'

const MainBar = ({title}) =>
  <AppBar position='static'>
    <Toolbar>
      <IconButton color='contrast' aria-label='Menu'>
        <MenuIcon />
      </IconButton>
      <Typography type='headline' color='inherit'>
        {title || 'Blockkeeper'}
      </Typography>
    </Toolbar>
  </AppBar>

const SubBar = ({tabs, ix, err, onTab}) =>
  <AppBar position='static'>
    <Tabs index={ix} onChange={onTab} centered>
      {tabs.map(tab => <Tab key={__.uuid()} label={tab.lbl} />)}
    </Tabs>
    {err && <Fault /> }
  </AppBar>

const Jumbo = ({title, subTitle}) =>
  <div style={jumboStyle}>
    <Typography align='center' type='display3'>
      {title || ''}
    </Typography>
    <Typography align='center' type='display1'>
      {subTitle || ''}
    </Typography>
  </div>

const Listing = ({rows, crrnc1}) =>
  <Table>
    <TableBody>
      {rows.map(row => {
        return (
          <TableRow key={row._id}>
            <TableCell>
              {row.icon || `${row.coin}-Icon`}
            </TableCell>
            <TableCell>
              {row.name}
              <br />
              {row.hsh}
            </TableCell>
            <TableCell>
              {row.coin} {row.amnt}
              <br />
              {crrnc1} {row.amnt * row.rates.get(crrnc1)}
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>

const Fault = ({title, subTitle}) =>
  <div style={faultStyle}>
    <Typography align='center' type='title'>
      <ErrorIcon />
      <br />
      {title || 'Loading data failed'}
    </Typography>
    <Typography align='center' type='body1'>
      {subTitle || 'Please check your network connection'}
    </Typography>
  </div>

const FatalFault = (props) =>
  <div>
    Sorry, an error occured.
    <br />
    <Link to='/login'>Back to login</Link>
  </div>

const Modal = (props) => {
  const actions = props.actions
    ? props.actions
    : [<Button key={__.uuid()} onClick={props.onClose}>OK</Button>]
  return (
    <Dialog open={props.open} onRequestClose={props.onClose} >
      <DialogTitle>{props.title || 'Error'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.children}</DialogContentText>
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  )
}

export {
  MainBar,
  SubBar,
  Jumbo,
  Listing,
  Modal,
  FatalFault,
  Fault
}
