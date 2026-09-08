import { useRef, useState } from 'react'
import {
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
import { t, RELATION_LABELS } from '../lib/i18n'
import { usePersonPhotos } from '../data/usePersonPhotos'
import { compressImageToDataUrl } from '../lib/imageCompress'
import { childrenOf, fullName, lifespan, type Person } from '../model/person'

interface Props {
  person: Person
  people: Person[]
  canEdit: boolean
  onClose: () => void
  onSelect: (id: string) => void
  onEdit: (p: Person) => void
  onAddChild: (parent: Person) => void
  onDelete: (p: Person) => void
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
  const { photos, addPhoto, deletePhoto } = usePersonPhotos(personId)
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
  onEdit,
  onAddChild,
  onDelete,
}: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
                  width: 'min(340px, calc(100% - 24px))',
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
          <IconButton aria-label={t('close')} onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <PhotoStrip key={person.id} personId={person.id} canEdit={canEdit} />

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
          {person.spouse && <Fact label={t('spouse')}>{person.spouse}</Fact>}
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
              на {person.relation.toName}
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
              <Button variant="outlined" size="small" onClick={() => onEdit(person)}>
                {t('edit')}
              </Button>
              <Button variant="outlined" size="small" onClick={() => onAddChild(person)}>
                {t('addChild')}
              </Button>
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
      </Stack>
    </Drawer>
  )
}
