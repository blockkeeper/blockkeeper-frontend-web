import {createMuiTheme} from 'material-ui/styles'
import {common} from 'material-ui/colors'
import { fade } from 'material-ui/styles/colorManipulator'

const styleGuide = {
  backgroundLight: '#F4F2F5',
  // backgroundDark: 'linear-gradient(to bottom right,#210045, #9A40FF)',
  backgroundDark: '#1e003c',
  text: '#210045',
  textSecondary: '#907FA2',
  spacertop: '100px',
  fontWeightBold: '700'
}

const theme = createMuiTheme({
  palette: {
    primary: {
      50: '#f3e8ff',
      100: '#e1c6ff',
      200: '#cda0ff',
      300: '#b879ff',
      400: '#a95dff',
      500: '#9a40ff',
      600: '#923aff',
      700: '#8832ff',
      800: '#7e2aff',
      900: '#6c1cff',
      A100: '#ffffff',
      A200: '#ffffff',
      A400: '#ddcdff',
      A700: '#ccb3ff',
      contrastDefaultColor: 'light'
    },
    secondary: {
      50: '#e2f5f2',
      100: '#b6e6e0',
      200: '#86d6cb',
      300: '#56c5b6',
      400: '#31b8a6',
      500: '#0dac96',
      600: '#0ba58e',
      700: '#099b83',
      800: '#079279',
      900: '#038268',
      A100: '#afffec',
      A200: '#7cffdf',
      A400: '#49ffd3',
      A700: '#30ffcd',
      contrastDefaultColor: 'light'
    },
    error: {
      50: '#fae0ee',
      100: '#f2b3d5',
      200: '#ea80b9',
      300: '#e24d9d',
      400: '#db2688',
      500: '#d50073',
      600: '#d0006b',
      700: '#ca0060',
      800: '#c40056',
      900: '#ba0043',
      A100: '#ffe3eb',
      A200: '#ffb0c7',
      A400: '#ff7da2',
      A700: '#ff6390',
      contrastDefaultColor: 'light'
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
    fontWeightLight: 200,
    fontWeightRegular: 400,
    fontWeightMedium: 400,
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
  MuiButton: {
    raisedContrast: {
      background: styleGuide.textSecondary,
      '&:hover': {
        backgroundColor: fade(styleGuide.textSecondary, 0.5),
        '@media (hover: none)': {
          background: styleGuide.textSecondary
        }
      },
      '&$disabled': {
        backgroundColor: fade(styleGuide.textSecondary, 0.5),
        '@media (hover: none)': {
          background: styleGuide.textSecondary
        }
      }
    }
  },
  MuiSnackbar: {
    anchorTopCenter: {
      [theme.breakpoints.up('md')]: {
        top: '50px'
      }
    }
  }
}

const themeBgStyle = {
  background: theme.palette.background.default
}

const loginStyle = {
  paddingTop: styleGuide.spacertop,
  textAlign: 'center',
  color: common.white
}

const jumboStyle = {
  minHeight: '25vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: common.white,
  overflow: 'hidden'
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

const dividerStyle = {
  marginTop: theme.spacing.unit * 2,
  marginBottom: theme.spacing.unit * 4
}

const qrReaderStyle = {
  height: '100%',
  width: '100%',
  maxHeight: '400px',
  marginTop: theme.spacing.unit * 2,
  background: theme.palette.background.light
}

const noTxtDeco = {
  textDecoration: 'none'
}

const qrCodeWrap = {
  paddingTop: theme.spacing.unit * 4,
  paddingBottom: theme.spacing.unit * 4
}

const fullWidth = {
  width: '100%'
}

const fullHeightRoot = {
  ...themeBgStyle,
  height: '100vh'
}

const gridWrap = {
  maxWidth: '1232px',
  margin: '0 auto'
}

const gridWrapPaper = {
  ...gridWrap,
  background: theme.palette.background.light,
  paddingTop: theme.spacing.unit * 2
}

const gridItem = {
  marginBottom: theme.spacing.unit,
  marginLeft: theme.spacing.unit * 3,
  marginRight: theme.spacing.unit * 3,
  padding: theme.spacing.unit * 3,
  display: 'flex',
  justifyContent: 'space-between',
  [theme.breakpoints.down('sm')]: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2
  }
}

const gridSpacer = {
  paddingTop: theme.spacing.unit
}

const gridGutter = {
  margin: theme.spacing.unit * 3,
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing.unit * 2
  }
}

const gridGutterFluid = {
  margin: theme.spacing.unit * 3,
  [theme.breakpoints.down('sm')]: {
    margin: 0
  }
}

const tscitem = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing.unit * 3,
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing.unit * 2
  }
}

const addr = {
  flexGrow: 1,
  minWidth: 0,
  paddingLeft: theme.spacing.unit * 2,
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing.unit
  }
}

const amnt = {
  textAlign: 'right',
  whiteSpace: 'nowrap'
}

const tscIcon = {
  paddingRight: theme.spacing.unit * 2,
  paddingTop: theme.spacing.unit * 3,
  [theme.breakpoints.down('sm')]: {
    paddingRight: theme.spacing.unit,
    paddingTop: theme.spacing.unit * 2
  }
}

const tscAmnt = {
  textAlign: 'right',
  whiteSpace: 'nowrap',
  paddingTop: theme.spacing.unit * 3,
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing.unit * 2
  }
}

const display1 = {
  [theme.breakpoints.down('sm')]: {
    fontSize: '18px'
  }
}

const body2 = {
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px'
  }
}

const display3 = {
  fontWeight: '200',
  [theme.breakpoints.down('sm')]: {
    fontSize: '40px'
  }
}

const tab = {
  fontWeight: styleGuide.fontWeightBold
}

const actnBtnClr = {
  color: 'white',
  backgroundColor: theme.palette.error[500],
  '&:hover': {
    backgroundColor: fade(theme.palette.error[500], 0.5),
    '@media (hover: none)': {
      backgroundColor: theme.palette.error[500]
    }
  },
  '&:disabled': {
    backgroundColor: fade(styleGuide.textSecondary, 0.5)
  }
}

const topBtnClass = {
  height: '30px',
  width: '30px'
}

export {
  theme,
  themeBgStyle,
  loginStyle,
  jumboStyle,
  floatBtnStyle,
  CryptoColors,
  paperStyle,
  dividerStyle,
  qrReaderStyle,
  noTxtDeco,
  qrCodeWrap,
  fullWidth,
  fullHeightRoot,
  gridWrap,
  gridWrapPaper,
  gridItem,
  gridSpacer,
  gridGutter,
  gridGutterFluid,
  tscitem,
  addr,
  amnt,
  tscIcon,
  tscAmnt,
  display1,
  body2,
  display3,
  tab,
  actnBtnClr,
  topBtnClass
}
