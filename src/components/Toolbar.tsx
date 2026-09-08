import { useMemo, useState } from 'react'
import {
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  Fab,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar as MuiToolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import DataObjectIcon from '@mui/icons-material/DataObject'
import ImageIcon from '@mui/icons-material/Image'
import LightModeIcon from '@mui/icons-material/LightMode'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import { t } from '../lib/i18n'
import { fullName, lifespan, type Person } from '../model/person'
import { useAuth } from '../auth/AuthContext'
import { useColorMode } from '../theme/ColorModeContext'
import type { ChartLayout } from './FamilyChart'

interface Props {
  people: Person[]
  layout: ChartLayout
  onLayoutChange: (l: ChartLayout) => void
  onFocusPerson: (id: string) => void
  onFit: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onExportPng: () => void
  onExportJson: () => void
  onImport: () => void
  onAddRoot: () => void
}

export function Toolbar(props: Props) {
  const { user, isEditor, isViewerOnly, signIn, signOutUser } = useAuth()
  const { mode, toggle } = useColorMode()
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('lg'))
  const [query, setQuery] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('bg')
    if (!q) return []
    return props.people
      .filter((p) => fullName(p).toLocaleLowerCase('bg').includes(q))
      .slice(0, 8)
  }, [query, props.people])

  const addLabel = props.people.length === 0 ? t('addRoot') : t('addChild')
  const closeMenu = () => setMenuAnchor(null)

  const moreActions = (
    <>
      <MenuItem onClick={() => { props.onZoomOut(); closeMenu() }}>
        <ListItemIcon><ZoomOutIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('zoomOut')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { props.onZoomIn(); closeMenu() }}>
        <ListItemIcon><ZoomInIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('zoomIn')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { props.onFit(); closeMenu() }}>
        <ListItemIcon><CenterFocusStrongIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('fit')}</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => { props.onExpandAll(); closeMenu() }}>
        <ListItemIcon><UnfoldMoreIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('expandAll')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { props.onCollapseAll(); closeMenu() }}>
        <ListItemIcon><UnfoldLessIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('collapseAll')}</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => {
          props.onLayoutChange(props.layout === 'top' ? 'bottom' : 'top')
          closeMenu()
        }}
      >
        <ListItemIcon><SwapVertIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{props.layout === 'top' ? 'Разгъване надолу' : 'Разгъване нагоре'}</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => { props.onExportPng(); closeMenu() }}>
        <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('exportPng')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { props.onExportJson(); closeMenu() }}>
        <ListItemIcon><DataObjectIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('exportJson')}</ListItemText>
      </MenuItem>
      {isEditor && (
        <MenuItem onClick={() => { props.onImport(); closeMenu() }}>
          <ListItemIcon><UploadFileIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('importJson')}</ListItemText>
        </MenuItem>
      )}
    </>
  )

  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <MuiToolbar sx={{ gap: { xs: 1, sm: 2 }, py: 1, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
        <Box sx={{ lineHeight: 1.2, flexShrink: 0 }}>
          <Typography variant="h6" component="strong" sx={{ display: 'block', fontSize: { xs: '1rem', sm: '1.15rem' } }}>
            {t('appTitle')}
          </Typography>
          {!isCompact && (
            <Typography variant="caption" color="text.secondary">
              {t('appSubtitle')}
            </Typography>
          )}
        </Box>

        <Autocomplete
          size="small"
          options={results}
          filterOptions={(x) => x}
          inputValue={query}
          onInputChange={(_, value) => setQuery(value)}
          onChange={(_, value) => {
            if (!value) return
            props.onFocusPerson(value.id)
            setQuery('')
          }}
          getOptionLabel={(p) => fullName(p)}
          renderOption={(optionProps, p) => {
            const { key, ...rest } = optionProps
            const years = lifespan(p)
            return (
              <Box component="li" key={key} {...rest}>
                {fullName(p)}
                {years && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    · {years}
                  </Typography>
                )}
              </Box>
            )
          }}
          noOptionsText={t('search')}
          sx={{ flex: '1 1 200px', maxWidth: 320, order: { xs: 3, lg: 0 } }}
          renderInput={(params) => <TextField {...params} placeholder={t('search')} />}
        />

        <Box sx={{ flex: 1, display: { xs: 'none', lg: 'block' } }} />

        {!isCompact && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <ButtonGroup variant="outlined" size="small">
              <Tooltip title={t('zoomOut')}>
                <IconButton onClick={props.onZoomOut}><ZoomOutIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title={t('zoomIn')}>
                <IconButton onClick={props.onZoomIn}><ZoomInIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title={t('fit')}>
                <IconButton onClick={props.onFit}><CenterFocusStrongIcon fontSize="small" /></IconButton>
              </Tooltip>
            </ButtonGroup>
            <Button size="small" startIcon={<UnfoldMoreIcon />} onClick={props.onExpandAll}>
              {t('expandAll')}
            </Button>
            <Button size="small" startIcon={<UnfoldLessIcon />} onClick={props.onCollapseAll}>
              {t('collapseAll')}
            </Button>
            <Button
              size="small"
              startIcon={<SwapVertIcon />}
              onClick={() => props.onLayoutChange(props.layout === 'top' ? 'bottom' : 'top')}
            >
              {props.layout === 'top' ? '⬇ надолу' : '⬆ нагоре'}
            </Button>
            <Button size="small" startIcon={<ImageIcon />} onClick={props.onExportPng}>
              {t('exportPng')}
            </Button>
            <Button size="small" startIcon={<DataObjectIcon />} onClick={props.onExportJson}>
              {t('exportJson')}
            </Button>
            {isEditor && (
              <Button size="small" startIcon={<UploadFileIcon />} onClick={props.onImport}>
                {t('importJson')}
              </Button>
            )}
            {isEditor && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={props.onAddRoot}>
                {addLabel}
              </Button>
            )}
          </Stack>
        )}

        {isCompact && (
          <>
            <Tooltip title="Меню">
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
              {moreActions}
            </Menu>
          </>
        )}

        <Tooltip title={mode === 'light' ? 'Тъмна тема' : 'Светла тема'}>
          <IconButton onClick={toggle}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pl: 1, borderLeft: 1, borderColor: 'divider' }}>
          {user ? (
            <>
              <Avatar
                src={user.photoURL ?? undefined}
                alt=""
                sx={{ width: 30, height: 30 }}
                slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
              />
              {!isCompact && (
                <Stack sx={{ lineHeight: 1.2, maxWidth: 160 }}>
                  <Typography variant="caption" noWrap>
                    {user.displayName || user.email}
                  </Typography>
                  <Chip
                    size="small"
                    label={isEditor ? t('editorBadge') : t('viewerBadge')}
                    color={isEditor ? 'success' : 'default'}
                    sx={{ height: 18, fontSize: 10, alignSelf: 'flex-start' }}
                  />
                </Stack>
              )}
              <Tooltip title={t('signOut')}>
                <IconButton onClick={signOutUser} size="small">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button variant="contained" size="small" startIcon={<LoginIcon />} onClick={signIn}>
              {t('signIn')}
            </Button>
          )}
        </Stack>

        {isViewerOnly && (
          <Typography variant="caption" color="error" sx={{ flexBasis: '100%' }}>
            {t('notEditorHint')}
          </Typography>
        )}
      </MuiToolbar>

      {isCompact && isEditor && (
        <Fab
          color="primary"
          onClick={props.onAddRoot}
          sx={{ position: 'fixed', right: 20, bottom: 20, zIndex: (th) => th.zIndex.speedDial }}
        >
          <AddIcon />
        </Fab>
      )}
    </AppBar>
  )
}
