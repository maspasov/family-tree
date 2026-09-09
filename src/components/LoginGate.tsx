import type { ReactNode } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import { useAuth } from '../auth/AuthContext'
import { messages, motto, t, useLocale, type Locale } from '../lib/i18n'

/** Short codes rather than full names here — this switcher has to be readable before the visitor necessarily reads any of these three languages. */
const LOCALE_CODES: Record<Locale, string> = { bg: 'БГ', en: 'EN', de: 'DE' }

function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={locale}
      onChange={(_, v: Locale | null) => v && setLocale(v)}
      sx={{ position: 'fixed', top: 16, right: 16, bgcolor: 'background.paper' }}
    >
      {(Object.keys(LOCALE_CODES) as Locale[]).map((l) => (
        <ToggleButton key={l} value={l}>
          {LOCALE_CODES[l]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

function GateShell({ children }: { children: ReactNode }) {
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
      <LanguageSwitcher />
      <Paper elevation={3} sx={{ width: 'min(420px, 100%)', textAlign: 'center', p: 4, borderRadius: 4 }}>
        {children}
      </Paper>
    </Box>
  )
}

/**
 * Gates the whole app behind Google sign-in with a verified e-mail. Which
 * trees the account may actually open is decided per-tree in `TreeContext`
 * (and enforced server-side by `firestore.rules`); this gate is only the
 * "are you signed in at all" half.
 */
export function LoginGate({ children }: { children: ReactNode }) {
  const { loading, user, signedIn, error, signIn, signOutUser } = useAuth()

  if (loading) {
    return (
      <Box sx={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress />
          <Typography color="text.secondary">{t('loading')}</Typography>
        </Stack>
      </Box>
    )
  }

  if (!user) {
    return (
      <GateShell>
        <Typography variant="h4" gutterBottom>{t('appTitle')}</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('appSubtitle')}
        </Typography>
        <Typography sx={{ my: 2.5 }}>{t('gateBody')}</Typography>
        <Button fullWidth variant="contained" size="large" startIcon={<LoginIcon />} onClick={signIn}>
          {t('signIn')}
        </Button>
        {error && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{error}</Alert>}
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', fontStyle: 'italic' }}
        >
          {motto}
        </Typography>
      </GateShell>
    )
  }

  if (!signedIn) {
    // Signed in with Google but the e-mail isn't verified — rare, but rules
    // require a verified address so surface it rather than looping.
    return (
      <GateShell>
        <Typography variant="h4" gutterBottom>{t('restrictedTitle')}</Typography>
        <Typography sx={{ my: 2.5 }}>{messages.restrictedBody(user.email ?? '')}</Typography>
        <Button fullWidth variant="outlined" onClick={signOutUser}>
          {t('tryAnotherAccount')}
        </Button>
      </GateShell>
    )
  }

  return <>{children}</>
}
