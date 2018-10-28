import {createMuiTheme} from '@material-ui/core/styles'
import common from '@material-ui/core/colors/common'
import { fade } from '@material-ui/core/styles/colorManipulator'

const styleGuide = {
  backgroundLight: '#F4F2F5',
  backgroundDark: '#1e003c',
  text: '#210045',
  textSecondary: '#907FA2',
  spacertop: '80px',
  fontWeightBold: '700',
  depotStepperHeight: '22vh'
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
      light: styleGuide.backgroundLight
    },
    text: {
      primary: styleGuide.text,
      secondary: styleGuide.textSecondary
    }
  },
  typography: {
    useNextVariants: true,
    fontFamily: 'Lato, sans-serif',
    fontWeightLight: 200,
    fontWeightRegular: 400,
    fontWeightMedium: 400,
    h2: {
      fontSize: 48,
      lineHeight: 1,
      fontWeight: 'bold'
    },
    h3: {
      fontSize: 32,
      lineHeight: 1.25
    },
    h4: {
      fontSize: 26,
      lineHeight: 1.5
    },
    h5: {
      fontSize: 24,
      lineHeight: 1.5
    },
    title: {
      fontSize: 24,
      lineHeight: 1
    },
    subtitle1: {
      fontSize: 16,
      lineHeight: '24px'
    },
    body1: {
      fontSize: 16,
      lineHeight: 1.5
    },
    body2: {
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
    contained: {
      color: common.white,
      backgroundColor: styleGuide.textSecondary,
      '&:hover': {
        backgroundColor: fade(styleGuide.textSecondary, 0.5),
        '@media (hover: none)': {
          background: styleGuide.textSecondary
        }
      },
      '&$disabled': {
        color: common.white,
        backgroundColor: fade(styleGuide.textSecondary, 0.5),
        '@media (hover: none)': {
          background: styleGuide.textSecondary
        }
      }
    }
  },
  MuiSnackbarContent: {
    root: {
      backgroundColor: styleGuide.textSecondary,
      color: common.white
    }
  },
  MuiSnackbar: {
    anchorOriginTopCenter: {
      [theme.breakpoints.up('md')]: {
        top: '50px'
      }
    }
  },
  MuiAppBar: {
    colorDefault: {
      backgroundColor: styleGuide.backgroundDark,
      color: common.white
    }
  },
  MuiMobileStepper: {
    root: {
      justifyContent: 'center',
      padding: theme.spacing.unit * 2
    },
    dot: {
      // backgroundColor: styleGuide.textSecondary
      backgroundColor: theme.palette.primary[500]
    },
    dotActive: {
      backgroundColor: common.white
    }
  },
  MuiTab: {
    root: {
      fontWeight: 'bold',
      [theme.breakpoints.only('xs')]: {
        fontSize: '14px'
      }
    }
  },
  MuiTabScrollButton: {
    root: {
      color: styleGuide.textSecondary
    }
  }
}

const themeBgStyle = {
  background: theme.palette.background.default
}

const loginStyle = {
  paddingTop: styleGuide.spacertop,
  paddingBottom: theme.spacing.unit * 2,
  color: common.white
}

const depotHoldings = {
  minHeight: styleGuide.depotStepperHeight,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: common.white,
  overflow: 'hidden'
}

const depotDoughnut = {
  position: 'relative',
  margin: 'auto',
  width: '100%',
  height: styleGuide.depotStepperHeight,
  overflow: 'hidden',
  [theme.breakpoints.only('sm')]: {
    width: '50%'
  },
  [theme.breakpoints.only('md')]: {
    width: '40%'
  },
  [theme.breakpoints.only('lg')]: {
    width: '30%'
  },
  [theme.breakpoints.only('xl')]: {
    width: '20%'
  }
}

const floatBtnStyle = {
  margin: 0,
  top: 'auto',
  right: theme.spacing.unit * 2,
  bottom: theme.spacing.unit * 2,
  left: 'auto',
  position: 'fixed'
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
  marginTop: theme.spacing.unit * 2,
  width: '100%',
  maxWidth: '750px',
  margin: '0 auto'
}

const noTxtDeco = {
  textDecoration: 'none'
}

const extLink = {
  color: styleGuide.text
}

const qrCodeWrap = {
  paddingTop: theme.spacing.unit * 4,
  paddingBottom: theme.spacing.unit * 4
}

const fullWidth = {
  width: '100%'
}

const gridWrap = {
  maxWidth: '1232px',
  margin: '0 auto'
}

const gridWrapPaper = {
  ...gridWrap,
  paddingTop: theme.spacing.unit * 2,
  paddingBottom: theme.spacing.unit * 2,
  backgroundColor: theme.palette.background.light
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
  paddingTop: theme.spacing.unit,
  paddingBottom: theme.spacing.unit
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

const coinIcon = {
  paddingRight: theme.spacing.unit * 2,
  [theme.breakpoints.down('sm')]: {
    paddingRight: theme.spacing.unit
  }
}

const prtfAmnt = {
  textAlign: 'right',
  whiteSpace: 'nowrap'
}

const h4 = {
  [theme.breakpoints.down('sm')]: {
    fontSize: '18px'
  }
}

const body1 = {
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px'
  }
}

const h2 = {
  fontWeight: '200',
  [theme.breakpoints.down('sm')]: {
    fontSize: '40px'
  }
}

const actnBtnClr = {
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
  height: '36px',
  width: '36px',
  color: common.white,
  background: styleGuide.textSecondary
}

const depotEmpty = {
  textAlign: 'center'
}

const cnctBtn = {
  width: '40%',
  margin: theme.spacing.unit * 4,
  [theme.breakpoints.down('sm')]: {
    width: '80%'
  }
}

const topBarSpacer = {
  paddingTop: '50px'
}

const areaWrap = {
  height: 350,
  [theme.breakpoints.only('xs')]: {
    overflowX: 'hidden' // fix small screens
  }
}

export {
  styleGuide,
  theme,
  themeBgStyle,
  loginStyle,
  depotHoldings,
  depotDoughnut,
  floatBtnStyle,
  CryptoColors,
  paperStyle,
  dividerStyle,
  qrReaderStyle,
  noTxtDeco,
  extLink,
  qrCodeWrap,
  fullWidth,
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
  coinIcon,
  prtfAmnt,
  h4,
  body1,
  h2,
  actnBtnClr,
  topBtnClass,
  depotEmpty,
  cnctBtn,
  topBarSpacer,
  areaWrap
}
