import { useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Modal } from './Modal'
import { useAuth } from '../auth/AuthContext'
import { useTree } from '../tree/TreeContext'
import { useTrees } from '../data/useTrees'
import { fetchTreePeople, linkPartners } from '../data/treeLinks'
import { fullName, type Person } from '../model/person'
import type { Tree } from '../model/tree'
import { t, messages } from '../lib/i18n'

interface Props {
  /** The person in the current tree being linked. */
  person: Person
  onClose: () => void
  onDone: () => void
}

/**
 * Marries a person in this tree to a person in a *different* tree the user can
 * also edit. Writes a mirrored `partnerLink` on both — the trees stay separate,
 * this is only a navigable bridge.
 */
export function LinkPartnerDialog({ person, onClose, onDone }: Props) {
  const { user, isAdmin } = useAuth()
  const { treeId, tree } = useTree()
  const { trees } = useTrees()

  const email = user?.email?.toLowerCase() ?? null
  const editableOtherTrees = useMemo(
    () =>
      trees.filter(
        (tr) => tr.id !== treeId && (isAdmin || (email && tr.editors.includes(email))),
      ),
    [trees, treeId, isAdmin, email],
  )

  const [target, setTarget] = useState<Tree | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [partner, setPartner] = useState<Person | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function selectTree(id: string) {
    const tr = editableOtherTrees.find((x) => x.id === id) ?? null
    setTarget(tr)
    setPartner(null)
    setPeople([])
    setError(null)
    if (!tr) return
    setLoadingPeople(true)
    try {
      setPeople(await fetchTreePeople(tr.id))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingPeople(false)
    }
  }

  async function confirm() {
    if (!target || !partner) return
    setBusy(true)
    setError(null)
    try {
      await linkPartners(
        { treeId, personId: person.id, personName: fullName(person), treeName: tree?.name },
        {
          treeId: target.id,
          personId: partner.id,
          personName: fullName(partner),
          treeName: target.name,
        },
      )
      onDone()
    } catch (e) {
      setError((e as Error).message || t('linkFailed'))
      setBusy(false)
    }
  }

  return (
    <Modal
      title={t('linkTitle')}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>{t('cancel')}</Button>
          <Button variant="contained" onClick={confirm} disabled={busy || !partner}>
            {busy ? t('saving') : t('linkConfirm')}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Typography color="text.secondary">
          {messages.linkIntro(fullName(person))}
        </Typography>

        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

        {editableOtherTrees.length === 0 ? (
          <Alert severity="info">{t('linkNoTrees')}</Alert>
        ) : (
          <>
            <TextField
              select
              label={t('linkPickTree')}
              value={target?.id ?? ''}
              onChange={(e) => selectTree(e.target.value)}
              fullWidth
            >
              {editableOtherTrees.map((tr) => (
                <MenuItem key={tr.id} value={tr.id}>
                  {tr.name || tr.slug}
                </MenuItem>
              ))}
            </TextField>

            {target &&
              (loadingPeople ? (
                <Stack sx={{ alignItems: 'center', py: 2 }}><CircularProgress size={24} /></Stack>
              ) : (
                <Autocomplete
                  options={[...people].sort((a, b) => fullName(a).localeCompare(fullName(b), 'bg'))}
                  value={partner}
                  onChange={(_, v) => setPartner(v)}
                  getOptionLabel={(p) => fullName(p)}
                  getOptionKey={(p) => p.id}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  openOnFocus
                  noOptionsText={t('linkNoPeople')}
                  renderInput={(params) => (
                    <TextField {...params} label={t('linkPickPerson')} autoFocus />
                  )}
                />
              ))}

            {partner && target && (
              <Typography sx={{ fontSize: '1.05rem' }}>
                {messages.linkPreview(fullName(person), fullName(partner), target.name || target.slug)}
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Modal>
  )
}
