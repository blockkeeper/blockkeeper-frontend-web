import React from 'react'
import ReactJson from 'react-json-view'
import Button from '@material-ui/core/Button'
import {withStyles} from '@material-ui/core/styles'
import {ArrowBack} from '@material-ui/icons'
import Paper from '@material-ui/core/Paper'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import LinearProgress from '@material-ui/core/LinearProgress'
import {theme, themeBgStyle, dividerStyle, qrReaderStyle, gridWrap, gridGutter,
  gridSpacer, actnBtnClr, cnctBtn, topBarSpacer} from './Style'
import {TopBar, Modal, Snack, BxpFloatBtn} from './Lib'
import __ from '../util'

class DevSyncView extends React.Component {
  constructor (props) {
    super(props)
    this.cx = props.cx
    this.state = {}
    this.goBack = props.history.goBack
    this.handleButton = () => {
      console.log('hi button')
    }
  }

  async componentDidMount () {
    Object.assign(this, __.initView(this, 'devSync'))
    await this.load()
  }

  async load () {
    try {
      const [addrs] = await Promise.all([
        this.cx.depot.loadAddrs()
      ])
      this.addrs = addrs
      this.setState({coin: ''})
    } catch (e) {
      return this.errGo(`Error: ${e.message}`, e, '/depot')
    }
  }

  render () {
    if (this.state.err) {
      return (
        <Modal
          onClose={this.goBack}
          actions={[{onClick: this.goBack, lbl: 'OK'}]}
        >
          {this.state.err}
        </Modal>
      )
    } else if (this.addrs) {
      return (
        <div className={this.props.classes.topBarSpacer}>
          {this.state.snack &&
            <Snack
              msg={this.state.snack}
              onClose={() => this.setState({snack: null})}
            />
          }
          <div className={this.props.classes.themeBgStyle}>
            <TopBar
              midTitle='DevSync'
              iconLeft={<ArrowBack />}
              onClickLeft={this.goBack}
              noUser
            />
          </div>
          {this.state.busy &&
          <LinearProgress />}
          <Paper
            elevation={5}
            square
            className={this.props.classes.gridSpacer}
          >
            <div className={this.props.classes.gridWrap}>
              <div className={this.props.classes.gridGutter}>
                {this.addrs.map(addr => {
                  return (
                    <div key={addr._id}>
                      <Typography variant='title'>
                        Addr {addr.name}
                      </Typography>
                      <ReactJson
                        src={__.cloneDeep(addr, {incls:
                        ['__ALL__', '_id', 'amnt', 'hd',
                          'name', 'hsh', 'type', 'tscs']
                        })}
                        name={`addr_${addr.name}`}
                        indentWidth={2}
                        collapsed={10}
                        sortKeys
                      />
                      <Divider />
                    </div>
                  )
                })}

                <Typography variant='title'>
                  User's local storage
                </Typography>
                <ReactJson
                  src={this.cx.user.getSto()}
                  name={'user'}
                  collapsed={10}
                  indentWidth={2}
                  sortKeys
                />
                <Divider />
                <Button
                  variant='raised'
                  color='default'
                  onClick={this.handleButton}
                >
                  HandleButton
                </Button>
              </div>
            </div>
          </Paper>
          <BxpFloatBtn
            onClick={() => {
              if (__.cfg('isDev')) {
                this.props.history.push('/devSync')
              }
              this.cx.depot.bxp([])
            }}
            bxpSts={this.state.bxpSts}
            second={Boolean(this.state.tabIx === 0)}
          />
        </div>
      )
    } else {
      return <LinearProgress />
    }
  }
}

export default withStyles({
  themeBgStyle,
  gridWrap,
  gridGutter,
  gridSpacer,
  dividerStyle,
  qrReaderStyle,
  actnBtnClr,
  cnctBtn,
  topBarSpacer,
  radios: {
    paddingLeft: theme.spacing.unit
  },
  center: {
    textAlign: 'center'
  }
})(DevSyncView)
