import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../auth/AuthContext'
import { useTrees } from '../data/useTrees'
import type { Tree } from '../model/tree'
import { navigate } from '../lib/hashRoute'
import { t, useLocale, motto, type Locale } from '../lib/i18n'
import { CreateTreeDialog } from './CreateTreeDialog'
import { DeleteTreeDialog } from './DeleteTreeDialog'

const LOCALE_CODES: Record<Locale, string> = { bg: 'БГ', en: 'EN', de: 'DE' }

/**
 * Landing screen at `#/` — lists the trees the signed-in account can open and,
 * for platform admins, offers a "new tree" button. One account can belong to
 * several families' trees at once.
 */
export function TreePicker() {
  const { locale, setLocale } = useLocale()
  const { user, isAdmin, signOutUser } = useAuth()
  const { trees, loading, error } = useTrees()
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Tree | null>(null)

  useEffect(() => {
    document.title = t('appTitle')
  }, [locale])

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'background.default',
        backgroundImage: (theme) =>
          `radial-gradient(circle at 1px 1px, ${theme.palette.mode === 'dark' ? 'rgba(111,168,118,0.12)' : 'rgba(47,82,51,0.1)'} 1px, transparent 0)`,
        backgroundSize: '22px 22px',
      }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        value={locale}
        onChange={(_, v: Locale | null) => v && setLocale(v)}
        sx={{ position: 'fixed', top: 16, right: 16, bgcolor: 'background.paper' }}
      >
        {(Object.keys(LOCALE_CODES) as Locale[]).map((l) => (
          <ToggleButton key={l} value={l}>{LOCALE_CODES[l]}</ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Paper elevation={3} sx={{ width: 'min(460px, 100%)', p: 4, borderRadius: 4 }}>
        <Stack spacing={0.5} sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4">{t('treesTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('treesPickBody')}</Typography>
        </Stack>

        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 3 }}><CircularProgress /></Stack>
        ) : error ? (
          <Typography color="error" variant="body2">{error}</Typography>
        ) : trees.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {isAdmin ? t('treesNoneAdmin') : t('treesNone')}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {trees.map((tr) => (
              <Stack key={tr.id} direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
                <Button
                  variant="outlined"
                  endIcon={<ChevronRightIcon />}
                  onClick={() => navigate(`/t/${tr.slug}`)}
                  sx={{ flex: 1, justifyContent: 'space-between', textTransform: 'none', py: 1.25 }}
                >
                  <Stack sx={{ alignItems: 'flex-start', lineHeight: 1.2 }}>
                    <Typography variant="subtitle2">{tr.name || tr.slug}</Typography>
                    {tr.subtitle && (
                      <Typography variant="caption" color="text.secondary">{tr.subtitle}</Typography>
                    )}
                  </Stack>
                </Button>
                {isAdmin && (
                  <Tooltip title={t('deleteTree')}>
                    <IconButton
                      aria-label={t('deleteTree')}
                      onClick={() => setDeleting(tr)}
                      sx={{ flexShrink: 0, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            ))}
          </Stack>
        )}

        {isAdmin && (
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setCreating(true)}
            sx={{ mt: 2 }}
          >
            {t('treesNew')}
          </Button>
        )}

        <Divider sx={{ my: 2.5 }} />
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 240 }}>
            {user?.email}
          </Typography>
          <Tooltip title={t('signOut')}>
            <IconButton size="small" onClick={signOutUser}><LogoutIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 2, fontStyle: 'italic', textAlign: 'center', color: 'text.secondary' }}
        >
          {motto}
        </Typography>
      </Paper>

      {creating && (
        <CreateTreeDialog
          onClose={() => setCreating(false)}
          onCreated={(slug) => {
            setCreating(false)
            navigate(`/t/${slug}`)
          }}
        />
      )}

      {deleting && (
        <DeleteTreeDialog
          tree={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => setDeleting(null)}
        />
      )}
    </Box>
  )
}
