import { createMuiTheme } from 'material-ui/styles'
import {purple, teal, red, common} from 'material-ui/colors'

const styleGuide = {
  primary: '#9A40FF',
  secondary: '#0DAC96',
  error: '#D50073',
  backgroundLight: '#F4F2F5',
  backgroundDark: 'linear-gradient(to bottom right,#210045, #9A40FF)',
  text: '#210045',
  textSecondary: '#907FA2',
  spacertop: '100px'
}
// https://material-ui-1dab0.firebaseapp.com/customization/themes
const theme = createMuiTheme({
  // https://github.com/callemall/material-ui/blob/v1-beta/src/styles/createPalette.js
  palette: {
    primary: {
      ...purple,
      '500': styleGuide.primary
    },
    secondary: {
      ...teal,
      '500': styleGuide.secondary
    },
    error: {
      ...red,
      'A400': styleGuide.error,
      '500': styleGuide.error
    },
    background: {
      default: styleGuide.backgroundDark,
      paper: common.white,
      appBar: common.transparent,
      light: styleGuide.backgroundLight
    },
    text: {
      primary: styleGuide.text,
      // secondary: common.white
      secondary: styleGuide.textSecondary
    }
  },
  // https://github.com/callemall/material-ui/blob/v1-beta/src/styles/createTypography.js
  typography: {
    fontFamily: 'Lato, sans-serif',
    display3: {
      fontSize: 48,
      lineHeight: 1,
      fontWeight: 'bold'
    },
    display2: {
      fontSize: 32,
      lineHeight: 1.25
    },
    display1: {
      fontSize: 26,
      lineHeight: 1.5
    },
    headline: {
      fontSize: 24,
      lineHeight: 1.5
    },
    title: {
      fontSize: 24,
      lineHeight: 1
    },
    subheading: {
      fontSize: 16,
      lineHeight: '24px'
    },
    body2: {
      fontSize: 16,
      lineHeight: 1.5
    },
    body1: {
      fontSize: 16,
      lineHeight: 1.25
    },
    caption: {
      fontSize: 14,
      lineHeight: 1.5
    },
    button: {
      fontSize: 16
    }
  }
})

theme.overrides = {

}

const pageStyle = {
  // height: '100vh',
  // background: theme.palette.background.default
}

const themeBgStyle = {
  background: theme.palette.background.default
}

const homeStyle = {
  paddingTop: styleGuide.spacertop,
  textAlign: 'center',
  color: common.white
}

const loginStyle = homeStyle

const actionBtnStyle = {
  backgroundColor: styleGuide.error,
  color: common.white,
  width: '40%'
}

const jumboStyle = {
  minHeight: '25vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: common.white,
  overflow: 'hidden'
}

const tabStyle = {
  backgroundColor: 'white',
  color: styleGuide.text
}

const floatBtnStyle = {
  margin: 0,
  top: 'auto',
  right: 20,
  bottom: 20,
  left: 'auto',
  position: 'fixed',
  color: common.white,
  backgroundColor: styleGuide.error
}

const paperStyle = {
  // margin: theme.spacing.unit * 3,
  padding: theme.spacing.unit * 3
}

export {
  theme,
  pageStyle,
  themeBgStyle,
  loginStyle,
  actionBtnStyle,
  tabStyle,
  homeStyle,
  jumboStyle,
  floatBtnStyle,
  paperStyle
}
