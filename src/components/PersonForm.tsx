import { useMemo, useState, type FormEvent } from 'react'
import {
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Button,
} from '@mui/material'
import { Modal } from './Modal'
import { t } from '../lib/i18n'
import {
  fullName,
  validateDraft,
  type Gender,
  type Person,
  type PersonDraft,
} from '../model/person'

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

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: 'm', label: t('gMale') },
  { value: 'f', label: t('gFemale') },
  { value: 'unknown', label: t('gUnknown') },
]

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

  // The very first person in an empty tree is allowed to have no parent.
  const requireParent = mode === 'add' && people.length > 0
  const { ok, errors } = useMemo(
    () => validateDraft(draft, { requireParent }),
    [draft, requireParent],
  )

  // Exclude self + descendants from the parent options to avoid cycles.
  const parentOptions = useMemo(() => {
    const blocked = new Set<string>()
    if (selfId) {
      blocked.add(selfId)
      let added = true
      while (added) {
        added = false
        for (const p of people) {
          if (p.parentId && blocked.has(p.parentId) && !blocked.has(p.id)) {
            blocked.add(p.id)
            added = true
          }
        }
      }
    }
    return people
      .filter((p) => !blocked.has(p.id))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'bg'))
  }, [people, selfId])

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
      <Stack component="form" id="ft-person-form" spacing={2} onSubmit={submit}>
        <TextField
          label={t('fName')}
          required
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          autoFocus
          error={Boolean(showErr('name'))}
          helperText={showErr('name')}
        />

        <TextField
          label={t('fSurname')}
          value={draft.surname ?? ''}
          onChange={(e) => set('surname', e.target.value)}
        />

        <TextField
          select
          label={t('fParent')}
          value={draft.parentId ?? ''}
          onChange={(e) => set('parentId', e.target.value || null)}
          error={Boolean(showErr('parentId'))}
          helperText={showErr('parentId')}
        >
          <MenuItem value="">{t('noParent')}</MenuItem>
          {parentOptions.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {fullName(p)}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            fullWidth
            label={t('fGender')}
            value={draft.gender}
            onChange={(e) => set('gender', e.target.value as Gender)}
          >
            {GENDERS.map((g) => (
              <MenuItem key={g.value} value={g.value}>
                {g.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="number"
            inputMode="numeric"
            label={t('fChildOrder')}
            value={draft.childOrder ?? ''}
            onChange={(e) =>
              set(
                'childOrder',
                e.target.value === '' ? undefined : Number(e.target.value),
              )
            }
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label={t('fBirthYear')}
            value={draft.birthYear ?? ''}
            onChange={(e) => set('birthYear', e.target.value)}
            placeholder="1901"
            error={Boolean(showErr('birthYear'))}
            helperText={showErr('birthYear')}
          />
          <TextField
            fullWidth
            label={t('fDeathYear')}
            value={draft.deathYear ?? ''}
            onChange={(e) => set('deathYear', e.target.value)}
            placeholder="1970"
            error={Boolean(showErr('deathYear'))}
            helperText={showErr('deathYear')}
          />
        </Stack>

        <TextField
          label={t('fBirthPlace')}
          value={draft.birthPlace ?? ''}
          onChange={(e) => set('birthPlace', e.target.value)}
          placeholder="с. Враняк, Врачанско"
        />

        <TextField
          label={t('fSpouse')}
          value={draft.spouse ?? ''}
          onChange={(e) => set('spouse', e.target.value)}
        />

        <TextField
          label={t('fNote')}
          multiline
          minRows={3}
          value={draft.note ?? ''}
          onChange={(e) => set('note', e.target.value)}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={draft.verified !== false}
              onChange={(e) => set('verified', e.target.checked)}
            />
          }
          label={t('fVerified')}
        />
      </Stack>
    </Modal>
  )
}
