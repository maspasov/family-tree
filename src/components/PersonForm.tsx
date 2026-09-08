import { useMemo, useState, type FormEvent } from 'react'
import { Stack, Button } from '@mui/material'
import { Modal } from './Modal'
import { PersonFields } from './PersonFields'
import { t } from '../lib/i18n'
import { validateDraft, type Person, type PersonDraft } from '../model/person'

interface Props {
  mode: 'add' | 'edit'
  initial: PersonDraft
  people: Person[]
  /** id of the person being edited, so it can't be its own parent. */
  selfId?: string
  busy: boolean
  onSubmit: (draft: PersonDraft) => void
  onCancel: () => void
}

export function PersonForm({
  mode,
  initial,
  people,
  selfId,
  busy,
  onSubmit,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState<PersonDraft>(initial)
  const [touched, setTouched] = useState(false)

  // The very first person in an empty tree is allowed to have no parent, and
  // so is a wife/husband — joining the tree by marriage doesn't imply their
  // own parent is known (or even part of this tree) too.
  const isSpouseRelation = draft.relation?.type === 'wife' || draft.relation?.type === 'husband'
  const requireParent = mode === 'add' && people.length > 0 && !isSpouseRelation
  const { ok, errors } = useMemo(
    () => validateDraft(draft, { requireParent }),
    [draft, requireParent],
  )

  function set<K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!ok) return
    onSubmit(draft)
  }

  const showErr = (k: keyof PersonDraft) => (touched ? errors[k] : undefined)

  return (
    <Modal
      title={mode === 'add' ? t('formAddTitle') : t('formEditTitle')}
      onClose={onCancel}
      wide
      footer={
        <>
          <Button onClick={onCancel} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="ft-person-form" variant="contained" disabled={busy}>
            {busy ? t('saving') : t('save')}
          </Button>
        </>
      }
    >
      <Stack component="form" id="ft-person-form" onSubmit={submit}>
        <PersonFields draft={draft} set={set} people={people} selfId={selfId} showErr={showErr} />
      </Stack>
    </Modal>
  )
}
