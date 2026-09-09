import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import CloseIcon from '@mui/icons-material/Close'
import { Lightbox } from './Lightbox'
import { PersonFields } from './PersonFields'
import { LinkPartnerDialog } from './LinkPartnerDialog'
import { t, RELATION_LABELS } from '../lib/i18n'
import { useTree } from '../tree/TreeContext'
import { navigate } from '../lib/hashRoute'
import { usePersonPhotos } from '../data/usePersonPhotos'
import { unlinkPartners } from '../data/treeLinks'
import { compressImageToDataUrl } from '../lib/imageCompress'
import {
  childrenOf,
  fullName,
  lifespan,
  stripAudit,
  validateDraft,
  type Person,
  type PersonDraft,
} from '../model/person'

interface Props {
  person: Person
  people: Person[]
  canEdit: boolean
  onClose: () => void
  onSelect: (id: string) => void
  onSave: (id: string, draft: PersonDraft) => Promise<void>
  onAddChild: (parent: Person) => void
  onDelete: (p: Person) => void
  /** Set by a tree-card's quick-link to jump straight into edit mode when the panel opens. */
  autoEdit?: boolean
  onAutoEditHandled?: () => void
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Box>
  )
}

function PhotoStrip({ personId, canEdit }: { personId: string; canEdit: boolean }) {
  const { treeId } = useTree()
  const { photos, addPhoto, deletePhoto } = usePersonPhotos(treeId, personId)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      await addPhoto(dataUrl)
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  if (photos.length === 0 && !canEdit) return null

  const lightboxItems = photos.map((p) => ({ src: p.dataUrl }))

  return (
    <Stack spacing={0.5}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
        {t('photos')}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
        {photos.map((photo, i) => (
          <Box key={photo.id} sx={{ position: 'relative', flexShrink: 0 }}>
            <Box
              component="img"
              src={photo.dataUrl}
              loading="lazy"
              onClick={() => setLightboxIndex(i)}
              sx={{
                width: 64,
                height: 64,
                objectFit: 'cover',
                borderRadius: 1.5,
                border: 1,
                borderColor: 'divider',
                cursor: 'pointer',
              }}
            />
            {canEdit && (
              <IconButton
                aria-label={t('removePhoto')}
                size="small"
                onClick={() => deletePhoto(photo.id)}
                sx={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' },
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            )}
          </Box>
        ))}
        {canEdit && (
          <Tooltip title={t('addPhoto')}>
            <Box
              component="button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{
                width: 64,
                height: 64,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                border: 1,
                borderStyle: 'dashed',
                borderColor: 'divider',
                bgcolor: 'transparent',
                color: 'text.secondary',
                cursor: 'pointer',
              }}
            >
              {uploading ? <CircularProgress size={20} /> : <AddAPhotoIcon fontSize="small" />}
            </Box>
          </Tooltip>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile}
        />
      </Stack>
      {uploadError && (
        <Typography variant="caption" color="error">
          {uploadError}
        </Typography>
      )}
      <Lightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </Stack>
  )
}

export function PersonPanel({
  person,
  people,
  canEdit,
  onClose,
  onSelect,
  onSave,
  onAddChild,
  onDelete,
  autoEdit,
  onAutoEditHandled,
}: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { treeId } = useTree()

  const [editDraft, setEditDraftState] = useState<PersonDraft | null>(null)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showLink, setShowLink] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  const partnerLink = person.partnerLink ?? null

  async function removePartnerLink() {
    if (!partnerLink || !window.confirm(t('linkRemoveConfirm'))) return
    setUnlinking(true)
    try {
      await unlinkPartners(
        { treeId, personId: person.id },
        { treeId: partnerLink.treeId, personId: partnerLink.personId },
      )
    } catch (e) {
      window.alert((e as Error).message)
    } finally {
      setUnlinking(false)
    }
  }

  // Keyed on person.id (not the `person` object) so a live Firestore update
  // to the same person mid-edit doesn't blow away in-progress changes — but
  // switching to look at a DIFFERENT person always resets local edit state,
  // instead of leaving the previous person's stale draft showing under the
  // new person's name/photos (e.g. clicking between merged spouses' cards,
  // which goes through onSelect directly rather than the autoEdit path).
  useEffect(() => {
    if (autoEdit) {
      setEditDraftState(stripAudit(person))
      onAutoEditHandled?.()
    } else {
      setEditDraftState(null)
    }
    setTouched(false)
    setSaveError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.id])

  // Editing an existing person never *requires* picking a parent (unlike
  // adding one to an otherwise non-empty tree) — matches the old modal's
  // `mode === 'edit'` behavior.
  const { ok, errors } = useMemo(
    () => (editDraft ? validateDraft(editDraft, { requireParent: false }) : { ok: true, errors: {} }),
    [editDraft],
  )

  function setEditField<K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) {
    setEditDraftState((d) => (d ? { ...d, [key]: value } : d))
  }

  function startEdit() {
    setEditDraftState(stripAudit(person))
    setTouched(false)
    setSaveError(null)
  }

  function cancelEdit() {
    setEditDraftState(null)
    setTouched(false)
    setSaveError(null)
  }

  function handleClose() {
    const dirty = editDraft && JSON.stringify(editDraft) !== JSON.stringify(stripAudit(person))
    if (dirty && !window.confirm(t('discardEditConfirm'))) return
    onClose()
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!ok || !editDraft) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(person.id, editDraft)
      setEditDraftState(null)
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const showErr = (k: keyof PersonDraft) => (touched ? errors[k] : undefined)

  const parent = person.parentId
    ? people.find((p) => p.id === person.parentId) ?? null
    : null
  const kids = childrenOf(people, person.id)
  const years = lifespan(person)

  return (
    <Drawer
      variant="persistent"
      open
      hideBackdrop
      anchor={isMobile ? 'bottom' : 'right'}
      sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      slotProps={{
        paper: {
          sx: {
            position: 'absolute',
            pointerEvents: 'auto',
            zIndex: 4,
            ...(isMobile
              ? {
                  left: 12,
                  right: 12,
                  bottom: 12,
                  width: 'auto',
                  maxHeight: '65vh',
                  borderRadius: 3,
                  boxShadow: 6,
                }
              : {
                  top: 12,
                  right: 12,
                  bottom: 12,
                  height: 'auto',
                  width: editDraft
                    ? 'min(600px, calc(100% - 24px))'
                    : 'min(380px, calc(100% - 24px))',
                  borderRadius: 3,
                  boxShadow: 6,
                }),
          },
        },
      }}
    >
      <Stack spacing={2} sx={{ p: 2.5, overflow: 'auto', height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h5">{fullName(person)}</Typography>
          <IconButton aria-label={t('close')} onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {editDraft ? (
          <Stack component="form" id="ft-panel-edit-form" spacing={2} onSubmit={saveEdit}>
            <PersonFields draft={editDraft} set={setEditField} people={people} selfId={person.id} showErr={showErr} />
            {saveError && <Alert severity="error">{saveError}</Alert>}
          </Stack>
        ) : (
          <>
            {person.verified === false && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={t('unverified')}
                sx={{ alignSelf: 'flex-start' }}
              />
            )}

            <Stack spacing={1.25}>
              {years && (
                <Fact label={`${t('born')} / ${t('died')}`}>{years}</Fact>
              )}
              {person.birthPlace && <Fact label={t('birthPlace')}>{person.birthPlace}</Fact>}
              {person.address && <Fact label={t('address')}>{person.address}</Fact>}
              {person.email && (
                <Fact label={t('email')}>
                  <Box component="a" href={`mailto:${person.email}`} sx={{ color: 'primary.main' }}>
                    {person.email}
                  </Box>
                </Fact>
              )}
              {person.spouse && <Fact label={t('spouse')}>{person.spouse}</Fact>}
              {partnerLink && (
                <Fact label={t('linkFactLabel')}>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ p: 0, minWidth: 0, textAlign: 'left' }}
                    onClick={() => navigate(`/t/${partnerLink.treeId}/p/${partnerLink.personId}`)}
                  >
                    {partnerLink.personName || t('noName')}
                    {' · '}
                    {partnerLink.treeName || partnerLink.treeId} →
                  </Button>
                </Fact>
              )}
              {parent && (
                <Fact label={t('parent')}>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ p: 0, minWidth: 0 }}
                    onClick={() => onSelect(parent.id)}
                  >
                    {fullName(parent)}
                  </Button>
                </Fact>
              )}
              {person.motherName && <Fact label={t('mother')}>{person.motherName}</Fact>}
              {person.fatherName && <Fact label={t('father')}>{person.fatherName}</Fact>}
              {person.relation && (
                <Fact label={t('relation')}>
                  {(person.relation.type === 'other' && person.relation.customLabel) ||
                    RELATION_LABELS[person.relation.type]}{' '}
                  {t('relationConnector')} {person.relation.toName}
                </Fact>
              )}
              {person.note && (
                <Fact label={t('note')}>
                  <Box component="span" sx={{ whiteSpace: 'pre-wrap' }}>
                    {person.note}
                  </Box>
                </Fact>
              )}
            </Stack>

            {kids.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('children')} · {kids.length}
                </Typography>
                <Stack spacing={0.25} sx={{ alignItems: 'flex-start' }}>
                  {kids.map((k) => (
                    <Button
                      key={k.id}
                      variant="text"
                      size="small"
                      sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start', textAlign: 'left' }}
                      onClick={() => onSelect(k.id)}
                    >
                      {fullName(k)}
                      {lifespan(k) ? ` · ${lifespan(k)}` : ''}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}

            {canEdit && (
              <>
                <Divider sx={{ mt: 'auto' }} />
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button variant="outlined" size="small" onClick={startEdit}>
                    {t('edit')}
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => onAddChild(person)}>
                    {t('addChild')}
                  </Button>
                  {partnerLink ? (
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={unlinking}
                      onClick={removePartnerLink}
                    >
                      {t('linkRemove')}
                    </Button>
                  ) : (
                    <Button variant="outlined" size="small" onClick={() => setShowLink(true)}>
                      {t('linkAction')}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => onDelete(person)}
                  >
                    {t('deletePerson')}
                  </Button>
                </Stack>
              </>
            )}

            {person.updatedByEmail && (
              <Typography variant="caption" color="text.secondary">
                {t('edit')}: {person.updatedByEmail}
              </Typography>
            )}
          </>
        )}

        <PhotoStrip key={person.id} personId={person.id} canEdit={canEdit} />

        {editDraft && (
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button variant="outlined" onClick={cancelEdit} disabled={saving}>
              {t('cancel')}
            </Button>
            <Button type="submit" form="ft-panel-edit-form" variant="contained" disabled={saving}>
              {saving ? t('saving') : t('save')}
            </Button>
          </Stack>
        )}
      </Stack>

      {showLink && (
        <LinkPartnerDialog
          person={person}
          onClose={() => setShowLink(false)}
          onDone={() => setShowLink(false)}
        />
      )}
    </Drawer>
  )
}
