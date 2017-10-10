import React from 'react'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import { withStyles } from 'material-ui/styles'
import {homeStyle, fullHeightRoot} from './Style'

const styles = {
  fullHeightRoot,
  homeStyle
}

class HomeView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {}
  }

  // TODO add state
  //  (state to true after rates and logged in user data is finished)
  render () {
    return (
      <div className={this.props.classes.fullHeightRoot}>
        <div className={this.props.classes.homeStyle}>
          <Typography type='display3' color={'inherit'}>
            Block keeper
          </Typography>
          <Typography type='display1' color={'inherit'} gutterBottom>
            Your secure blockchain book keeping app
          </Typography>
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

export default withStyles(styles)(HomeView)
