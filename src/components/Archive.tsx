import { useRef, useState } from 'react'
import { Box, CircularProgress, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import { Lightbox, type LightboxItem } from './Lightbox'
import { useArchivePhotos } from '../data/useArchivePhotos'
import { compressImageToDataUrl } from '../lib/imageCompress'
import { useTree } from '../tree/TreeContext'
import { t, useLocale, type StringKey } from '../lib/i18n'

// Prefilled onto the first three uploads, in order, purely as a convenience —
// editors can change or clear them; nothing enforces this order afterwards.
const SUGGESTED_CAPTIONS: StringKey[] = ['archiveCaption1', 'archiveCaption2', 'archiveCaption3']

export function Archive() {
  useLocale()
  const { treeId, isEditor } = useTree()
  const { photos, addPhoto, deletePhoto, updateCaption } = useArchivePhotos(treeId)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const items: LightboxItem[] = photos.map((p) => ({ src: p.dataUrl, caption: p.caption }))

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      const suggested = SUGGESTED_CAPTIONS[photos.length]
      await addPhoto(dataUrl, suggested ? t(suggested) : '')
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'auto', p: { xs: 2, sm: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Stack spacing={1}>
          <Typography variant="h5">{t('archiveTitle')}</Typography>
          <Typography color="text.secondary">{t('archiveIntro')}</Typography>
        </Stack>

        {photos.length === 0 && !isEditor ? (
          <Typography color="text.secondary">{t('archiveEmptyBody')}</Typography>
        ) : (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
            {photos.map((p, i) => (
              <Stack key={p.id} spacing={1} sx={{ width: { xs: '100%', sm: 260 } }}>
                <Box
                  component="img"
                  src={p.dataUrl}
                  alt={p.caption ?? ''}
                  loading="lazy"
                  onClick={() => setOpenIndex(i)}
                  sx={{
                    width: '100%',
                    height: 220,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    boxShadow: 2,
                    cursor: 'pointer',
                  }}
                />
                {isEditor && editingCaptionId === p.id ? (
                  <TextField
                    size="small"
                    autoFocus
                    defaultValue={p.caption ?? ''}
                    placeholder={t('archiveCaptionPlaceholder')}
                    onBlur={(e) => {
                      updateCaption(p.id, e.target.value)
                      setEditingCaptionId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    }}
                  />
                ) : (
                  <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {p.caption}
                    </Typography>
                    {isEditor && (
                      <Stack direction="row" sx={{ gap: 0.25, flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => setEditingCaptionId(p.id)}>
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => deletePhoto(p.id)}>
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>
                )}
              </Stack>
            ))}

            {isEditor && (
              <>
                <Tooltip title={t('addPhoto')}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    sx={{
                      width: { xs: '100%', sm: 260 },
                      height: 220,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      border: 1,
                      borderStyle: 'dashed',
                      borderColor: 'divider',
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      cursor: 'pointer',
                    }}
                  >
                    {uploading ? <CircularProgress size={22} /> : <AddAPhotoIcon />}
                  </Box>
                </Tooltip>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
              </>
            )}
          </Stack>
        )}
        {uploadError && (
          <Typography variant="caption" color="error">
            {uploadError}
          </Typography>
        )}
      </Stack>

      <Lightbox items={items} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </Box>
  )
}
