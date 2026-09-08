import type { ReactNode } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import { useAuth } from '../auth/AuthContext'
import { bg, motto, t } from '../lib/i18n'

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
      <Paper elevation={3} sx={{ width: 'min(420px, 100%)', textAlign: 'center', p: 4, borderRadius: 4 }}>
        {children}
      </Paper>
    </Box>
  )
}

/**
 * Gates the whole app behind Google sign-in AND the Firestore `config/app.editors`
 * allow-list — nothing (not even a read-only view) renders for anyone else.
 * Firestore rules enforce the same check server-side; this is just the UI half.
 */
export function LoginGate({ children }: { children: ReactNode }) {
  const { loading, user, isEditor, error, signIn, signOutUser } = useAuth()

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

  if (!isEditor) {
    return (
      <GateShell>
        <Typography variant="h4" gutterBottom>{t('restrictedTitle')}</Typography>
        <Typography sx={{ my: 2.5 }}>{bg.restrictedBody(user.email ?? '')}</Typography>
        <Button fullWidth variant="outlined" onClick={signOutUser}>
          {t('tryAnotherAccount')}
        </Button>
      </GateShell>
    )
  }

  return <>{children}</>
}
