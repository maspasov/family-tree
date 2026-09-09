import { useState } from 'react'
import { Alert, Box, Button, IconButton, Stack, TextField, Typography, MenuItem } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { Modal } from './Modal'
import { useAuth } from '../auth/AuthContext'
import { useTree } from '../tree/TreeContext'
import { t } from '../lib/i18n'

type Role = 'editor' | 'viewer'

interface Props {
  onClose: () => void
}

function normalize(email: string): string {
  return email.trim().toLowerCase()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RolesDialog({ onClose }: Props) {
  const { user } = useAuth()
  const { editors, viewers, setRoles } = useTree()
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<Role>('viewer')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function writeLists(nextEditors: string[], nextViewers: string[]) {
    setSaving(true)
    setError(null)
    try {
      await setRoles(nextEditors, nextViewers)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function handleAdd() {
    const email = normalize(newEmail)
    if (!EMAIL_RE.test(email)) {
      setError(t('rolesInvalidEmail'))
      return
    }
    if (editors.includes(email) || viewers.includes(email)) {
      setError(t('rolesDuplicate'))
      return
    }
    const nextEditors = newRole === 'editor' ? [...editors, email] : editors
    const nextViewers = newRole === 'viewer' ? [...viewers, email] : viewers
    setNewEmail('')
    writeLists(nextEditors, nextViewers)
  }

  function handleRemove(role: Role, email: string) {
    if (role === 'editor') {
      if (editors.length <= 1) {
        setError(t('rolesLastEditorError'))
        return
      }
      if (email === user?.email?.toLowerCase() && !window.confirm(t('rolesSelfRemoveConfirm'))) {
        return
      }
      writeLists(
        editors.filter((e) => e !== email),
        viewers,
      )
    } else {
      writeLists(
        editors,
        viewers.filter((e) => e !== email),
      )
    }
  }

  function EmailRow({ email, role }: { email: string; role: Role }) {
    return (
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}
      >
        <Typography variant="body2">{email}</Typography>
        <IconButton
          aria-label={t('rolesRemove')}
          size="small"
          disabled={saving}
          onClick={() => handleRemove(role, email)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    )
  }

  return (
    <Modal title={t('rolesTitle')} onClose={onClose} wide>
      <Stack spacing={2.5}>
        <Typography color="text.secondary">{t('rolesIntro')}</Typography>

        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('rolesAddPlaceholder')}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          <TextField
            select
            size="small"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="editor">{t('editorBadge')}</MenuItem>
            <MenuItem value="viewer">{t('viewerBadge')}</MenuItem>
          </TextField>
          <Button
            variant="contained"
            disabled={saving || !newEmail.trim()}
            onClick={handleAdd}
          >
            {t('rolesAddButton')}
          </Button>
        </Stack>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('rolesEditors')}
          </Typography>
          {editors.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('rolesEmptyEditors')}
            </Typography>
          ) : (
            editors.map((email) => <EmailRow key={email} email={email} role="editor" />)
          )}
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('rolesViewers')}
          </Typography>
          {viewers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('rolesEmptyViewers')}
            </Typography>
          ) : (
            viewers.map((email) => <EmailRow key={email} email={email} role="viewer" />)
          )}
        </Box>
      </Stack>
    </Modal>
  )
}
