import {createMuiTheme} from 'material-ui/styles'
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

const theme = createMuiTheme({
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
      secondary: styleGuide.textSecondary
    }
  },

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

const themeBgStyle = {
  background: theme.palette.background.default
}

const homeStyle = {
  paddingTop: styleGuide.spacertop,
  textAlign: 'center',
  color: common.white
}

const loginStyle = homeStyle

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
  right: theme.spacing.unit * 2,
  bottom: theme.spacing.unit * 2,
  left: 'auto',
  position: 'fixed',
  color: common.white
}

const CryptoColors = {
  'BTC': '#FF9900',
  'LTC': '#b8b8b8',
  'ETH': '#3C3C3D',
  'DASH': '#1c75bc'
}

const paperStyle = {
  padding: theme.spacing.unit * 3
}

const overflowStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}

export {
  theme,
  themeBgStyle,
  loginStyle,
  tabStyle,
  homeStyle,
  overflowStyle,
  jumboStyle,
  floatBtnStyle,
  paperStyle,
  CryptoColors
}
