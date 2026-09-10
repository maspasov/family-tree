import { useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Modal } from './Modal'
import { t, messages } from '../lib/i18n'
import {
  EMPTY_DRAFT,
  fullName,
  type Gender,
  type Person,
  type PersonDraft,
  type RelationType,
} from '../model/person'

type RelKind = 'child' | 'spouse' | 'parent'

interface Props {
  people: Person[]
  /** Person the "add" was launched from (a card, "add child"), pre-selected as the relative. */
  anchorId?: string | null
  busy: boolean
  onSubmit: (draft: PersonDraft) => void
  onCancel: () => void
}

/**
 * Deliberately tiny, one-question-at-a-time flow for adding a person — meant to
 * be usable by the oldest relative in the family, not just whoever set the app
 * up. The full field set stays available afterwards via the panel's edit mode.
 */
export function AddPersonWizard({ people, anchorId, busy, onSubmit, onCancel }: Props) {
  const isFirst = people.length === 0

  const [anchor, setAnchor] = useState<Person | null>(
    () => people.find((p) => p.id === anchorId) ?? null,
  )
  const [rel, setRel] = useState<RelKind>('child')
  const [name, setName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [surname, setSurname] = useState('')
  const [gender, setGender] = useState<Gender>('unknown')
  const [alive, setAlive] = useState(true)
  const [birthYear, setBirthYear] = useState('')
  const [deathYear, setDeathYear] = useState('')
  const [birthPlace, setBirthPlace] = useState('')

  const steps = isFirst
    ? (['name', 'details', 'review'] as const)
    : (['rel', 'name', 'details', 'review'] as const)
  const [i, setI] = useState(0)
  const step = steps[i]

  const sortedPeople = useMemo(
    () => [...people].sort((a, b) => fullName(a).localeCompare(fullName(b), 'bg')),
    [people],
  )

  const anchorName = anchor ? fullName(anchor) : ''
  const relPhrase =
    isFirst || !anchor
      ? messages.wizPhraseFirst
      : rel === 'child'
        ? messages.wizPhraseChildOf(anchorName)
        : rel === 'spouse'
          ? messages.wizPhraseSpouseOf(anchorName)
          : messages.wizPhraseParentOf(anchorName)

  const fullNewName = [name.trim(), patronymic.trim(), surname.trim()].filter(Boolean).join(' ')

  const canNext =
    step === 'rel' ? Boolean(anchor) : step === 'name' ? name.trim().length > 0 : true

  function buildDraft(): PersonDraft {
    const draft: PersonDraft = {
      ...EMPTY_DRAFT,
      name: name.trim(),
      patronymic: patronymic.trim(),
      surname: surname.trim(),
      gender,
      birthYear: birthYear.trim(),
      deathYear: alive ? '' : deathYear.trim(),
      birthPlace: birthPlace.trim(),
      parentId: null,
      relation: undefined,
    }
    if (isFirst || !anchor) return draft

    if (rel === 'child') {
      draft.parentId = anchor.id
      draft.relation = { type: 'child', toId: anchor.id, toName: anchorName }
    } else if (rel === 'spouse') {
      draft.parentId = anchor.parentId ?? null
      draft.relation = {
        type: (gender === 'm' ? 'husband' : 'wife') as RelationType,
        toId: anchor.id,
        toName: anchorName,
      }
    } else {
      // "parent of": father reparents the anchor (see App's submit flow); mother
      // is label-only. Matches the existing model semantics.
      draft.relation = {
        type: (gender === 'f' ? 'mother' : 'father') as RelationType,
        toId: anchor.id,
        toName: anchorName,
      }
    }
    return draft
  }

  const back = () => (i > 0 ? setI(i - 1) : onCancel())
  const next = () => (i < steps.length - 1 ? setI(i + 1) : onSubmit(buildDraft()))

  return (
    <Modal
      title={t('formAddTitle')}
      onClose={onCancel}
      wide
      footer={
        <>
          <Button onClick={back} disabled={busy} size="large">
            {i === 0 ? t('cancel') : t('back')}
          </Button>
          <Button onClick={next} variant="contained" size="large" disabled={busy || !canNext}>
            {step === 'review' ? (busy ? t('saving') : t('save')) : t('next')}
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {messages.wizStepOf(i + 1, steps.length)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={((i + 1) / steps.length) * 100}
            sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
          />
        </Box>

        {step === 'rel' && (
          <Stack spacing={2.5}>
            <Typography variant="h6">{t('wizRelTitle')}</Typography>
            <Autocomplete
              options={sortedPeople}
              value={anchor}
              onChange={(_, v) => setAnchor(v)}
              getOptionLabel={(p) => fullName(p)}
              getOptionKey={(p) => p.id}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField {...params} label={t('wizRelPickAnchor')} autoFocus />
              )}
            />
            {anchor && (
              <ToggleButtonGroup
                orientation="vertical"
                exclusive
                fullWidth
                value={rel}
                onChange={(_, v: RelKind | null) => v && setRel(v)}
              >
                <ToggleButton value="child" sx={{ justifyContent: 'flex-start', py: 1.5, textTransform: 'none', fontSize: '1rem' }}>
                  {messages.wizRelChild(anchorName)}
                </ToggleButton>
                <ToggleButton value="spouse" sx={{ justifyContent: 'flex-start', py: 1.5, textTransform: 'none', fontSize: '1rem' }}>
                  {messages.wizRelSpouse(anchorName)}
                </ToggleButton>
                <ToggleButton value="parent" sx={{ justifyContent: 'flex-start', py: 1.5, textTransform: 'none', fontSize: '1rem' }}>
                  {messages.wizRelParent(anchorName)}
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Stack>
        )}

        {step === 'name' && (
          <Stack spacing={2.5}>
            <Typography variant="h6">{t('wizNameTitle')}</Typography>
            <TextField
              label={t('fName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              fullWidth
              slotProps={{ htmlInput: { style: { fontSize: '1.2rem' } } }}
            />
            <TextField
              label={t('fPatronymic')}
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
              helperText={t('optional')}
              fullWidth
            />
            <TextField
              label={t('fSurname')}
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              helperText={t('optional')}
              fullWidth
            />
          </Stack>
        )}

        {step === 'details' && (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6">{t('wizDetailsTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('wizDetailsHint')}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>{t('fGender')}</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={gender}
                onChange={(_, v: Gender | null) => v && setGender(v)}
              >
                <ToggleButton value="m">{t('gMale')}</ToggleButton>
                <ToggleButton value="f">{t('gFemale')}</ToggleButton>
                <ToggleButton value="unknown">{t('gUnknown')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              label={t('fBirthYear')}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="1950"
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>{t('wizAlive')}</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={alive ? 'yes' : 'no'}
                onChange={(_, v: string | null) => v && setAlive(v === 'yes')}
              >
                <ToggleButton value="yes">{t('yes')}</ToggleButton>
                <ToggleButton value="no">{t('no')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {!alive && (
              <TextField
                label={t('fDeathYear')}
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                placeholder="2000"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            )}

            <TextField
              label={t('fBirthPlace')}
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              helperText={t('optional')}
              fullWidth
            />
          </Stack>
        )}

        {step === 'review' && (
          <Stack spacing={2}>
            <Typography variant="h6">{t('wizReviewTitle')}</Typography>
            <Typography sx={{ fontSize: '1.15rem' }}>
              {messages.wizReviewLine(fullNewName || t('noName'), relPhrase)}
            </Typography>
            <Stack spacing={0.5} sx={{ color: 'text.secondary' }}>
              {gender !== 'unknown' && (
                <Typography variant="body2">
                  {t('fGender')}: {gender === 'm' ? t('gMale') : t('gFemale')}
                </Typography>
              )}
              {birthYear.trim() && (
                <Typography variant="body2">{t('fBirthYear')}: {birthYear.trim()}</Typography>
              )}
              {!alive && deathYear.trim() && (
                <Typography variant="body2">{t('fDeathYear')}: {deathYear.trim()}</Typography>
              )}
              {birthPlace.trim() && (
                <Typography variant="body2">{t('fBirthPlace')}: {birthPlace.trim()}</Typography>
              )}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}
