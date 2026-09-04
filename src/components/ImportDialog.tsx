import { useState } from 'react'
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
          <button type="button" className="ft-btn" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="ft-btn ft-btn--primary"
            onClick={run}
            disabled={busy || !text.trim()}
          >
            {busy ? t('saving') : t('importRun')}
          </button>
        </>
      }
    >
      <p className="ft-hint">{t('importHint')}</p>
      <button
        type="button"
        className="ft-btn"
        onClick={() => setText(JSON.stringify(seedPeople, null, 2))}
      >
        {t('importLoadSeed')}
      </button>
      <textarea
        className="ft-import__area"
        rows={16}
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='[{ "id": "...", "name": "Иван", "parentId": "tano" }]'
      />
      {msg && <p className="ft-ok">{msg}</p>}
      {err && <p className="ft-err">{err}</p>}
    </Modal>
  )
}
