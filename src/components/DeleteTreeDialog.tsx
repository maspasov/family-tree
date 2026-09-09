import { useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { Modal } from './Modal'
import { useTrees } from '../data/useTrees'
import type { Tree } from '../model/tree'
import { t, messages } from '../lib/i18n'

interface Props {
  tree: Tree
  onClose: () => void
  onDeleted: () => void
}

/** Admin-only, irreversible: types the slug to confirm before wiping a whole tree. */
export function DeleteTreeDialog({ tree, onClose, onDeleted }: Props) {
  const { deleteTree } = useTrees()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const armed = typed.trim() === tree.slug

  async function confirm() {
    if (!armed) return
    setBusy(true)
    setError(null)
    try {
      await deleteTree(tree.slug)
      onDeleted()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={t('deleteTreeTitle')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>{t('cancel')}</Button>
          <Button variant="contained" color="error" onClick={confirm} disabled={busy || !armed}>
            {busy ? t('saving') : t('deleteTreeCta')}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        <Typography>{messages.deleteTreeWarn(tree.name || tree.slug)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {messages.deleteTreeTypeSlug(tree.slug)}
        </Typography>
        <TextField
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={tree.slug}
          autoFocus
          fullWidth
          slotProps={{ htmlInput: { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false } }}
        />
      </Stack>
    </Modal>
  )
}
