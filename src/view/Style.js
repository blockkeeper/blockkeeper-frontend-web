import { createMuiTheme } from 'material-ui/styles'
import {purple, teal, red} from 'material-ui/colors'

// https://material-ui-1dab0.firebaseapp.com/customization/themes
const theme = createMuiTheme({
  palette: {
    primary: {
      ...purple,
      '500': '#9A40FF'
    },
    secondary: {
      ...teal,
      '500': '#0DAC96'
    },
    error: {
      ...red,
      '500': '#D50073'
    },
    background: {
      default: 'linear-gradient(to bottom right,#210045, #9A40FF)',
      paper: '#F4F2F5',
      appBar: '#D50073',
      contentFrame: '#210045'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: '#F4F2F5'
    }
  },
  typography: {
    fontFamily: 'Lato, sans-serif'
  }

})

theme.overrides = {
  MuiPalette: {
    background: {
      default: 'linear-gradient(to bottom right,#210045, #9A40FF)',
      paper: '#F4F2F5',
      appBar: '#D50073',
      contentFrame: '#210045'
    }
  },
  MuiTypography: {
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
      fontSize: 26,
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
    }
  }
}

const pageStyle = {
//  maxWidth: '500px',
//  margin: 'auto',
}

const jumboStyle = {
  background: 'black'
}

export {
  theme,
  pageStyle,
  jumboStyle
}
