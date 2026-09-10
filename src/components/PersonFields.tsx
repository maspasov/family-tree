import { useMemo, useState } from 'react'
import {
  Autocomplete,
  Checkbox,
  CircularProgress,
  Collapse,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Button,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { YearCalendar } from '@mui/x-date-pickers/YearCalendar'
import { bgBG, deDE, enUS } from '@mui/x-date-pickers/locales'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/bg'
import 'dayjs/locale/de'
import 'dayjs/locale/en'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import { getLocale, t, messages, RELATION_LABELS, type Locale } from '../lib/i18n'
import { geocodeAddress } from '../lib/geocode'
import {
  fullName,
  type Gender,
  type Person,
  type PersonDraft,
  type RelationType,
} from '../model/person'

const RELATION_TYPES = Object.keys(RELATION_LABELS) as RelationType[]

type LocateState = 'idle' | 'loading' | 'success' | 'not-found' | 'error'

// Arbitrary leap year so 29 Feb is selectable — only month/day of the value is ever used or stored.
const BIRTHDAY_REF_YEAR = 2024

function birthMonthDayToDate(v: string | undefined): Dayjs | null {
  if (!v || !/^\d{2}-\d{2}$/.test(v)) return null
  const d = dayjs(`${BIRTHDAY_REF_YEAR}-${v}`)
  return d.isValid() ? d : null
}

// Only used to drive the YearCalendar popover's selection — the field itself
// stays free text so "~1860"/"1901?" (see validateDraft) keep working; the
// picker is just a quick-fill for the common clean-4-digit case.
function yearToDate(v: string | undefined): Dayjs | null {
  const y = (v ?? '').trim()
  if (!/^\d{4}$/.test(y)) return null
  const d = dayjs(`${y}-01-01`)
  return d.isValid() ? d : null
}

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: 'm', label: t('gMale') },
  { value: 'f', label: t('gFemale') },
  { value: 'unknown', label: t('gUnknown') },
]

// Per-UI-language config for the date pickers: `dayjs` locale drives the month
// names shown in the field/calendar, the MUI X locale bundle drives the
// picker's own chrome (toolbar, action buttons, aria labels).
const PICKER_LOCALES: Record<Locale, { dayjs: string; muiX: typeof enUS }> = {
  bg: { dayjs: 'bg', muiX: bgBG },
  de: { dayjs: 'de', muiX: deDE },
  en: { dayjs: 'en', muiX: enUS },
}

interface Props {
  draft: PersonDraft
  set: <K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) => void
  people: Person[]
  /** id of the person being edited, so it can't be its own parent. */
  selfId?: string
  showErr: (k: keyof PersonDraft) => string | undefined
}

/**
 * The full set of person fields — name/relation/facts/contact — shared by
 * the "add person" modal (`PersonForm.tsx`) and `PersonPanel.tsx`'s inline
 * edit mode. Owns its own ephemeral UI-only state (relation-type picker,
 * address-locate status) since none of that belongs in the saved draft.
 */
export function PersonFields({ draft, set, people, selfId, showErr }: Props) {
  const [relationType, setRelationType] = useState<RelationType | ''>(draft.relation?.type ?? '')
  const [showEnNames, setShowEnNames] = useState(
    Boolean(draft.nameEn || draft.patronymicEn || draft.surnameEn),
  )
  const [locateState, setLocateState] = useState<LocateState>('idle')
  // The address that produced the current `draft.geo`, so we can tell the user
  // when they've edited the address text without re-locating the pin.
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(
    draft.geo ? draft.address ?? null : null,
  )
  const addressStale = Boolean(draft.geo) && (draft.address ?? '') !== geocodedAddress
  const [yearPicker, setYearPicker] = useState<{
    field: 'birthYear' | 'deathYear'
    anchor: HTMLElement
  } | null>(null)
  const [birthdayAnchor, setBirthdayAnchor] = useState<HTMLElement | null>(null)

  // Suggestions drawn from data already in the tree — no external API/billing.
  const birthPlaceOptions = useMemo(
    () =>
      Array.from(new Set(people.map((p) => p.birthPlace).filter((v): v is string => Boolean(v))))
        .sort((a, b) => a.localeCompare(b, 'bg')),
    [people],
  )
  const parentNameOptions = useMemo(() => {
    const names = new Set<string>()
    for (const p of people) {
      if (p.motherName) names.add(p.motherName)
      if (p.fatherName) names.add(p.fatherName)
      const full = fullName(p)
      if (full) names.add(full)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'bg'))
  }, [people])

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

  // For 'child', "Дете на" below is hidden and this picker drives `parentId`
  // directly instead — see relationToPerson's fallback to draft.parentId,
  // which keeps the two in sync when switching relation type back and forth.
  const relationToPerson = useMemo(() => {
    const id =
      relationType === 'child' ? draft.relation?.toId ?? draft.parentId ?? undefined : draft.relation?.toId
    return id ? people.find((p) => p.id === id) ?? null : null
  }, [relationType, draft.relation, draft.parentId, people])

  function handleRelationTypeChange(newType: RelationType | '') {
    setRelationType(newType)
    if (!newType) {
      set('relation', undefined)
      return
    }
    if (draft.relation) set('relation', { ...draft.relation, type: newType })
    if (newType === 'child' && relationToPerson) set('parentId', relationToPerson.id)
    // A wife/husband isn't a blood child of their spouse — attach her next to
    // him (same parent) instead of leaving parentId empty, which would make
    // her float as her own disconnected root in the strictly hierarchical chart.
    if ((newType === 'wife' || newType === 'husband') && relationToPerson) {
      set('parentId', relationToPerson.parentId ?? null)
    }
  }

  function handleRelationToChange(person: Person | null) {
    if (!relationType) return
    if (!person) {
      set('relation', undefined)
      if (relationType === 'child') set('parentId', null)
      return
    }
    // Firestore rejects `undefined` anywhere in a document, including
    // nested — `cleanDraft` only strips it at the top level, so the key
    // must be omitted entirely here rather than set to `undefined`.
    const customLabel = draft.relation?.customLabel
    set('relation', {
      type: relationType,
      toId: person.id,
      toName: fullName(person),
      ...(customLabel ? { customLabel } : {}),
    })
    if (relationType === 'child') set('parentId', person.id)
    if (relationType === 'wife' || relationType === 'husband') set('parentId', person.parentId ?? null)
  }

  async function locate() {
    const address = (draft.address ?? '').trim()
    if (!address) return
    setLocateState('loading')
    try {
      const result = await geocodeAddress(address)
      if (!result) {
        setLocateState('not-found')
        return
      }
      set('geo', result)
      setGeocodedAddress(address)
      setLocateState('success')
    } catch {
      setLocateState('error')
    }
  }

  function clearPin() {
    set('geo', null)
    setGeocodedAddress(null)
    setLocateState('idle')
  }

  const picker = PICKER_LOCALES[getLocale()] ?? PICKER_LOCALES.bg
  const birthday = birthMonthDayToDate(draft.birthMonthDay)
  const birthdayLabel = birthday ? birthday.locale(picker.dayjs).format('D MMMM') : ''

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={picker.dayjs}
      localeText={picker.muiX.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label={t('fName')}
            required
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            autoFocus
            error={Boolean(showErr('name'))}
            helperText={showErr('name')}
          />
          <TextField
            fullWidth
            label={t('fPatronymic')}
            value={draft.patronymic ?? ''}
            onChange={(e) => set('patronymic', e.target.value)}
          />
          <TextField
            fullWidth
            label={t('fSurname')}
            value={draft.surname ?? ''}
            onChange={(e) => set('surname', e.target.value)}
          />
        </Stack>

        <Stack spacing={1}>
          <Button
            size="small"
            color="inherit"
            onClick={() => setShowEnNames((v) => !v)}
            endIcon={showEnNames ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('fNameEnSection')}
          </Button>
          <Collapse in={showEnNames}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label={t('fNameEn')}
                value={draft.nameEn ?? ''}
                onChange={(e) => set('nameEn', e.target.value)}
              />
              <TextField
                fullWidth
                label={t('fPatronymicEn')}
                value={draft.patronymicEn ?? ''}
                onChange={(e) => set('patronymicEn', e.target.value)}
              />
              <TextField
                fullWidth
                label={t('fSurnameEn')}
                value={draft.surnameEn ?? ''}
                onChange={(e) => set('surnameEn', e.target.value)}
              />
            </Stack>
          </Collapse>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            fullWidth
            label={t('fRelationType')}
            value={relationType}
            onChange={(e) => handleRelationTypeChange(e.target.value as RelationType | '')}
          >
            <MenuItem value="">{t('noRelation')}</MenuItem>
            {RELATION_TYPES.map((rt) => (
              <MenuItem key={rt} value={rt}>
                {RELATION_LABELS[rt]}
              </MenuItem>
            ))}
          </TextField>
          {relationType && (
            <Autocomplete
              fullWidth
              options={parentOptions}
              getOptionLabel={(p) => fullName(p)}
              getOptionKey={(p) => p.id}
              value={relationToPerson}
              onChange={(_, value) => handleRelationToChange(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('fRelationTo')}
                  error={relationType === 'child' && Boolean(showErr('parentId'))}
                  helperText={
                    relationType === 'child'
                      ? showErr('parentId')
                      : relationType === 'father'
                        ? t('fRelationToHelpFather')
                        : relationType === 'wife' || relationType === 'husband'
                          ? t('fRelationToHelpSpouse')
                          : t('fRelationToHelpLabelOnly')
                  }
                />
              )}
            />
          )}
        </Stack>

        {relationType === 'father' && relationToPerson && (
          <Typography variant="caption" color="warning.main">
            {messages.fRelationFatherWarning(fullName(relationToPerson))}
          </Typography>
        )}

        {relationType === 'other' && (
          <TextField
            label={t('fRelationCustomLabel')}
            placeholder={t('fRelationCustomLabelPlaceholder')}
            value={draft.relation?.customLabel ?? ''}
            onChange={(e) => {
              if (!draft.relation) return
              const { customLabel: _drop, ...rest } = draft.relation
              set('relation', e.target.value ? { ...rest, customLabel: e.target.value } : rest)
            }}
          />
        )}

        {relationType !== 'child' && (
          <TextField
            select
            fullWidth
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
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Autocomplete
            fullWidth
            freeSolo
            options={parentNameOptions}
            inputValue={draft.motherName ?? ''}
            onInputChange={(_, value) => set('motherName', value)}
            renderInput={(params) => <TextField {...params} label={t('fMother')} />}
          />
          <Autocomplete
            fullWidth
            freeSolo
            options={parentNameOptions}
            inputValue={draft.fatherName ?? ''}
            onInputChange={(_, value) => set('fatherName', value)}
            renderInput={(params) => <TextField {...params} label={t('fFather')} />}
          />
        </Stack>

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
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={(e) => setYearPicker({ field: 'birthYear', anchor: e.currentTarget })}
                    >
                      <CalendarMonthIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label={t('fDeathYear')}
            value={draft.deathYear ?? ''}
            onChange={(e) => set('deathYear', e.target.value)}
            placeholder="1970"
            error={Boolean(showErr('deathYear'))}
            helperText={showErr('deathYear')}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={(e) => setYearPicker({ field: 'deathYear', anchor: e.currentTarget })}
                    >
                      <CalendarMonthIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Popover
            open={Boolean(yearPicker)}
            anchorEl={yearPicker?.anchor ?? null}
            onClose={() => setYearPicker(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            {yearPicker && (
              <YearCalendar
                value={yearToDate(draft[yearPicker.field])}
                onChange={(value) => {
                  set(yearPicker.field, value.format('YYYY'))
                  setYearPicker(null)
                }}
              />
            )}
          </Popover>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Autocomplete
            fullWidth
            freeSolo
            options={birthPlaceOptions}
            inputValue={draft.birthPlace ?? ''}
            onInputChange={(_, value) => set('birthPlace', value)}
            renderInput={(params) => <TextField {...params} label={t('fBirthPlace')} />}
          />
          <TextField
            fullWidth
            label={t('fBirthMonthDay')}
            value={birthdayLabel}
            onClick={(e) => setBirthdayAnchor(e.currentTarget)}
            error={Boolean(showErr('birthMonthDay'))}
            helperText={showErr('birthMonthDay')}
            sx={{ cursor: 'pointer' }}
            slotProps={{
              htmlInput: { readOnly: true, style: { cursor: 'pointer' } },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {/* Opens via the field-level onClick above (bubbles up). */}
                    <IconButton size="small" tabIndex={-1}>
                      <CalendarMonthIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Popover
            open={Boolean(birthdayAnchor)}
            anchorEl={birthdayAnchor}
            onClose={() => setBirthdayAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Stack sx={{ alignItems: 'flex-start', p: 1 }}>
              <DateCalendar
                views={['month', 'day']}
                openTo="month"
                value={birthday}
                onChange={(value: Dayjs | null, state?: string) => {
                  if (value?.isValid()) set('birthMonthDay', value.format('MM-DD'))
                  if (state === 'finish') setBirthdayAnchor(null)
                }}
                slotProps={{ calendarHeader: { format: 'MMMM' } }}
              />
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  set('birthMonthDay', '')
                  setBirthdayAnchor(null)
                }}
              >
                {t('clear')}
              </Button>
            </Stack>
          </Popover>
        </Stack>

        <Stack spacing={0.5}>
          <TextField
            label={t('fAddress')}
            value={draft.address ?? ''}
            onChange={(e) => {
              set('address', e.target.value)
              if (locateState !== 'idle') setLocateState('idle')
            }}
            placeholder="ул. Иван Вазов 12, София"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={t('locate')}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={locate}
                          disabled={locateState === 'loading' || !(draft.address ?? '').trim()}
                        >
                          {locateState === 'loading' ? (
                            <CircularProgress size={18} />
                          ) : (
                            <MyLocationIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
          {locateState === 'success' && (
            <Typography variant="caption" color="success.main">{t('locateFound')}</Typography>
          )}
          {locateState === 'not-found' && (
            <Typography variant="caption" color="error">{t('locateNotFound')}</Typography>
          )}
          {locateState === 'error' && (
            <Typography variant="caption" color="error">{t('locateError')}</Typography>
          )}
          {addressStale && locateState !== 'loading' && (
            <Typography variant="caption" color="warning.main">{t('addressChangedWarning')}</Typography>
          )}
          {draft.geo && (
            <Button size="small" color="inherit" sx={{ alignSelf: 'flex-start' }} onClick={clearPin}>
              {t('clearPin')}
            </Button>
          )}
        </Stack>

        <TextField
          label={t('fEmail')}
          // Deliberately not type="email": native constraint validation would
          // silently block the enclosing <form>'s submit (no noValidate) when
          // the browser dislikes the value, with no visible error. `validateDraft`
          // is the single source of truth for email validity instead.
          slotProps={{ htmlInput: { inputMode: 'email' } }}
          value={draft.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
          placeholder="ime@example.com"
          error={Boolean(showErr('email'))}
          helperText={showErr('email')}
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
    </LocalizationProvider>
  )
}
