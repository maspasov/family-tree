import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '../auth/AuthContext'
import { useTrees } from '../data/useTrees'
import type { Tree } from '../model/tree'
import { navigate } from '../lib/hashRoute'
import { t, useLocale } from '../lib/i18n'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const norm = (e: string) => e.trim().toLowerCase()

/**
 * Admin-only screen at `#/admin` — one place to manage who can see / edit every
 * tree, without opening each one. Writes go through the same rules as the
 * per-tree roles dialog (admins may touch any tree; a tree's own editors still
 * manage theirs from inside it).
 */
export function AdminPanel() {
  useLocale()
  const { isAdmin, user } = useAuth()
  const { trees, loading, error, setTreeRoles } = useTrees()

  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: '100svh', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="h5">{t('treeNoAccess')}</Typography>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
            {t('backToTrees')}
          </Button>
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default', p: { xs: 2, sm: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 820, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('backToTrees')}>
            <IconButton onClick={() => navigate('/')}><ArrowBackIcon /></IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4">{t('adminAccessTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('adminAccessIntro')}</Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress /></Stack>
        ) : trees.length === 0 ? (
          <Typography color="text.secondary">{t('adminAccessNoTrees')}</Typography>
        ) : (
          trees.map((tree) => (
            <TreeRoles
              key={tree.id}
              tree={tree}
              selfEmail={user?.email?.toLowerCase() ?? null}
              onSave={(editors, viewers) => setTreeRoles(tree.slug, editors, viewers)}
            />
          ))
        )}
      </Stack>
    </Box>
  )
}

function TreeRoles({
  tree,
  selfEmail,
  onSave,
}: {
  tree: Tree
  selfEmail: string | null
  onSave: (editors: string[], viewers: string[]) => Promise<void>
}) {
  const editors = useMemo(() => tree.editors ?? [], [tree.editors])
  const viewers = useMemo(() => tree.viewers ?? [], [tree.viewers])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function commit(nextEditors: string[], nextViewers: string[]) {
    setBusy(true)
    setErr(null)
    try {
      await onSave(nextEditors, nextViewers)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function add() {
    const e = norm(email)
    if (!EMAIL_RE.test(e)) return setErr(t('rolesInvalidEmail'))
    if (editors.includes(e) || viewers.includes(e)) return setErr(t('rolesDuplicate'))
    setEmail('')
    if (role === 'editor') commit([...editors, e], viewers)
    else commit(editors, [...viewers, e])
  }

  function remove(kind: 'editor' | 'viewer', e: string) {
    if (kind === 'editor') {
      if (editors.length <= 1) return setErr(t('rolesLastEditorError'))
      if (e === selfEmail && !window.confirm(t('rolesSelfRemoveConfirm'))) return
      commit(editors.filter((x) => x !== e), viewers)
    } else {
      commit(editors, viewers.filter((x) => x !== e))
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">{tree.name || tree.slug}</Typography>
          <Typography variant="caption" color="text.secondary">/{tree.slug}</Typography>
        </Box>

        {err && <Alert severity="error" onClose={() => setErr(null)}>{err}</Alert>}

        <RoleChips
          label={t('rolesEditors')}
          emails={editors}
          selfEmail={selfEmail}
          disabled={busy}
          onRemove={(e) => remove('editor', e)}
        />
        <RoleChips
          label={t('rolesViewers')}
          emails={viewers}
          selfEmail={selfEmail}
          disabled={busy}
          onRemove={(e) => remove('viewer', e)}
        />

        <Divider />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('rolesAddPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            slotProps={{ htmlInput: { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false } }}
          />
          <TextField
            select
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="editor">{t('editorBadge')}</MenuItem>
            <MenuItem value="viewer">{t('viewerBadge')}</MenuItem>
          </TextField>
          <Button variant="contained" onClick={add} disabled={busy || !email.trim()}>
            {t('rolesAddButton')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function RoleChips({
  label,
  emails,
  selfEmail,
  disabled,
  onRemove,
}: {
  label: string
  emails: string[]
  selfEmail: string | null
  disabled: boolean
  onRemove: (email: string) => void
}) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      {emails.length === 0 ? (
        <Typography variant="body2" color="text.secondary">—</Typography>
      ) : (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {emails.map((e) => (
            <Chip
              key={e}
              label={e}
              color={e === selfEmail ? 'primary' : 'default'}
              variant={e === selfEmail ? 'filled' : 'outlined'}
              onDelete={disabled ? undefined : () => onRemove(e)}
              size="small"
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
