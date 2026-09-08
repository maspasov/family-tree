import type { PaletteMode } from '@mui/material'

/** Forest & Stone — chosen theme direction: a green that means the actual tree. */
export function designTokens(mode: PaletteMode) {
  const light = {
    primary: { main: '#2F5233', contrastText: '#FFFFFF' },
    secondary: { main: '#C1602A', contrastText: '#2A1206' },
    background: { default: '#F6F4EE', paper: '#FFFFFF' },
    text: { primary: '#212A20', secondary: '#6F7A6C' },
    divider: '#DCE2D6',
    error: { main: '#A13A2F' },
    success: { main: '#3F7D4F' },
  } as const

  const dark = {
    primary: { main: '#6FA876', contrastText: '#0E140E' },
    secondary: { main: '#E08A52', contrastText: '#2A1206' },
    background: { default: '#131A13', paper: '#1B241A' },
    text: { primary: '#E7EDE3', secondary: '#9FAF9A' },
    divider: '#33402F',
    error: { main: '#E5766B' },
    success: { main: '#7CC98A' },
  } as const

  return { mode, ...(mode === 'light' ? light : dark) }
}
