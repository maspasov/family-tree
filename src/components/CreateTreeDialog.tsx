import { useState } from 'react'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { Modal } from './Modal'
import { useAuth } from '../auth/AuthContext'
import { useTrees } from '../data/useTrees'
import { SLUG_RE, normalizeEmail, slugify } from '../model/tree'
import { t } from '../lib/i18n'

interface Props {
  onClose: () => void
  onCreated: (slug: string) => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CreateTreeDialog({ onClose, onCreated }: Props) {
  const { user } = useAuth()
  const { slugExists, createTree } = useTrees()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [subtitle, setSubtitle] = useState('')
  const [motto, setMotto] = useState('')
  const [firstEditor, setFirstEditor] = useState(user?.email ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveSlug = (slugTouched ? slug : slugify(name)).trim()

  async function submit() {
    setError(null)
    if (!name.trim()) return setError(t('ctNameRequired'))
    if (!SLUG_RE.test(effectiveSlug)) return setError(t('ctSlugInvalid'))
    const editor = normalizeEmail(firstEditor)
    if (!EMAIL_RE.test(editor)) return setError(t('ctEditorInvalid'))
    setBusy(true)
    try {
      if (await slugExists(effectiveSlug)) {
        setError(t('ctSlugTaken'))
        return
      }
      const created = await createTree({
        slug: effectiveSlug,
        name,
        subtitle,
        motto,
        firstEditorEmail: editor,
      })
      onCreated(created)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={t('createTreeTitle')}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>{t('cancel')}</Button>
          <Button variant="contained" onClick={submit} disabled={busy}>
            {busy ? t('saving') : t('create')}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        <TextField
          label={t('ctName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          fullWidth
        />
        <TextField
          label={t('ctSlug')}
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          helperText={t('ctSlugHelp')}
          fullWidth
        />
        <TextField
          label={t('ctSubtitle')}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          fullWidth
        />
        <TextField
          label={t('ctMotto')}
          value={motto}
          onChange={(e) => setMotto(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label={t('ctFirstEditor')}
          value={firstEditor}
          onChange={(e) => setFirstEditor(e.target.value)}
          helperText={t('ctFirstEditorHelp')}
          fullWidth
        />
      </Stack>
    </Modal>
  )
}
