import { createTheme, type PaletteMode } from '@mui/material'
import { designTokens } from './palette'

const sans = '"PT Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const serif = '"PT Serif", Georgia, "Times New Roman", serif'

export function getTheme(mode: PaletteMode) {
  return createTheme({
    palette: designTokens(mode),
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: sans,
      h1: { fontFamily: serif, fontWeight: 700 },
      h2: { fontFamily: serif, fontWeight: 700 },
      h3: { fontFamily: serif, fontWeight: 700 },
      h4: { fontFamily: serif, fontWeight: 700 },
      h5: { fontFamily: serif, fontWeight: 700 },
      h6: { fontFamily: serif, fontWeight: 700 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiAppBar: {
        defaultProps: { color: 'default', elevation: 0 },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 18 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
    },
  })
}
