import { useMemo, useState, type FormEvent } from 'react'
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
          <button type="button" className="ft-btn" onClick={onCancel} disabled={busy}>
            {t('cancel')}
          </button>
          <button
            type="submit"
            form="ft-person-form"
            className="ft-btn ft-btn--primary"
            disabled={busy}
          >
            {busy ? t('saving') : t('save')}
          </button>
        </>
      }
    >
      <form id="ft-person-form" className="ft-form" onSubmit={submit}>
        <label className="ft-field">
          <span>{t('fName')} *</span>
          <input
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            autoFocus
            required
          />
          {showErr('name') && <em className="ft-err">{showErr('name')}</em>}
        </label>

        <label className="ft-field">
          <span>{t('fSurname')}</span>
          <input
            value={draft.surname ?? ''}
            onChange={(e) => set('surname', e.target.value)}
          />
        </label>

        <label className="ft-field">
          <span>{t('fParent')}</span>
          <select
            value={draft.parentId ?? ''}
            onChange={(e) => set('parentId', e.target.value || null)}
          >
            <option value="">{t('noParent')}</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)}
              </option>
            ))}
          </select>
          {showErr('parentId') && <em className="ft-err">{showErr('parentId')}</em>}
        </label>

        <div className="ft-field ft-field--row">
          <label>
            <span>{t('fGender')}</span>
            <select
              value={draft.gender}
              onChange={(e) => set('gender', e.target.value as Gender)}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('fChildOrder')}</span>
            <input
              type="number"
              inputMode="numeric"
              value={draft.childOrder ?? ''}
              onChange={(e) =>
                set(
                  'childOrder',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
            />
          </label>
        </div>

        <div className="ft-field ft-field--row">
          <label>
            <span>{t('fBirthYear')}</span>
            <input
              value={draft.birthYear ?? ''}
              onChange={(e) => set('birthYear', e.target.value)}
              placeholder="1901"
            />
            {showErr('birthYear') && <em className="ft-err">{showErr('birthYear')}</em>}
          </label>
          <label>
            <span>{t('fDeathYear')}</span>
            <input
              value={draft.deathYear ?? ''}
              onChange={(e) => set('deathYear', e.target.value)}
              placeholder="1970"
            />
            {showErr('deathYear') && <em className="ft-err">{showErr('deathYear')}</em>}
          </label>
        </div>

        <label className="ft-field">
          <span>{t('fBirthPlace')}</span>
          <input
            value={draft.birthPlace ?? ''}
            onChange={(e) => set('birthPlace', e.target.value)}
            placeholder="с. Враняк, Врачанско"
          />
        </label>

        <label className="ft-field">
          <span>{t('fSpouse')}</span>
          <input
            value={draft.spouse ?? ''}
            onChange={(e) => set('spouse', e.target.value)}
          />
        </label>

        <label className="ft-field">
          <span>{t('fNote')}</span>
          <textarea
            rows={3}
            value={draft.note ?? ''}
            onChange={(e) => set('note', e.target.value)}
          />
        </label>

        <label className="ft-field ft-field--check">
          <input
            type="checkbox"
            checked={draft.verified !== false}
            onChange={(e) => set('verified', e.target.checked)}
          />
          <span>{t('fVerified')}</span>
        </label>
      </form>
    </Modal>
  )
}
