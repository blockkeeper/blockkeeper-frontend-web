import React from 'react'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import { CircularProgress } from 'material-ui/Progress'
import {homeStyle, themeBgStyle} from './Style'
const rootStyle = {...themeBgStyle, height: '100vh'}

export default class HomeView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {}
  }

  // TODO add state (state to true after rates and logged in user data is finished)
  render () {
    return (
      <div style={rootStyle}>
        <div style={homeStyle}>
          <Typography type='display3'>
            Blockkeeper
          </Typography>
          <Typography type='display1' gutterBottom>
            Your secure blockchain book keeping app
          </Typography>

          <CircularProgress size={25} color='accent' />
          <Button
            raised
            color='accent'
            href='/login'
          >
            Login
          </Button>
        </div>
      </div>
    )
  }
}
