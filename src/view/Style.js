import createMuiTheme from 'material-ui/styles/theme'
import createPalette from 'material-ui/styles/palette'
import createTypography from 'material-ui/styles/typography'
import {indigo, green, red} from 'material-ui/colors'

// https://material-ui-1dab0.firebaseapp.com/customization/themes
const theme = createMuiTheme()

// https://www.materialpalette.com/
theme.palette = createPalette({
  primary: indigo,
  type: 'light',
  accent: {
    ...green,
    A400: '#00e677'
  },
  error: red
})

theme.typography = createTypography(theme.palette, {
  fontFamily: 'Roboto,Arial,-apple-system,system-ui,BlinkMacSystemFont,' +
              '"Segoe UI",sans-serif'
  // fontSize: 20
})

theme.overrides = {
  MuiTypography: {
    display3: {
      color: '#FFF',
      padding: '15px 15px 0px 15px'
    },
    display1: {
      color: '#FFF',
      padding: '0px 15px 15px 15px'
    }
    // headline: {
    //   color: '#FFF',
    //   padding: '0px 0px 0px 0px'
    // }
  }
}

const pageStyle = {
  maxWidth: '500px',
  margin: 'auto'
}

const jumboStyle = {
  background: 'black'
}

export {
  theme,
  pageStyle,
  jumboStyle
}
