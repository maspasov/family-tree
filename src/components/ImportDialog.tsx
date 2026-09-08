import { useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { Modal } from './Modal'
import { bg, t } from '../lib/i18n'
import type { Person } from '../model/person'
import seedPeople from '../seed/seedData'

interface Props {
  onImport: (rows: Array<Partial<Person>>) => Promise<number>
  onClose: () => void
}

export function ImportDialog({ onImport, onClose }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setErr(null)
    setMsg(null)
    let rows: Array<Partial<Person>>
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('not array')
      rows = parsed
    } catch {
      setErr(t('importBadJson'))
      return
    }
    setBusy(true)
    try {
      const n = await onImport(rows)
      setMsg(bg.importDone(n))
    } catch (e) {
      setErr(`${t('errorPrefix')}: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={t('importTitle')}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={run}
            disabled={busy || !text.trim()}
          >
            {busy ? t('saving') : t('importRun')}
          </Button>
        </>
      }
    >
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          {t('importHint')}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          sx={{ alignSelf: 'flex-start' }}
          onClick={() => setText(JSON.stringify(seedPeople, null, 2))}
        >
          {t('importLoadSeed')}
        </Button>
        <TextField
          multiline
          minRows={16}
          maxRows={24}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{ "id": "...", "name": "Иван", "parentId": "tano" }]'
          slotProps={{ htmlInput: { style: { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12 } } }}
        />
        {msg && <Alert severity="success">{msg}</Alert>}
        {err && <Alert severity="error">{err}</Alert>}
      </Stack>
    </Modal>
  )
}
