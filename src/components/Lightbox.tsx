import { Box, Dialog, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

export interface LightboxItem {
  src: string
  caption?: string
}

interface Props {
  items: LightboxItem[]
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ items, index, onClose, onNavigate }: Props) {
  if (index === null) return null
  const item = items[index]

  return (
    <Dialog open onClose={onClose} maxWidth="lg">
      <Box sx={{ position: 'relative', bgcolor: 'black', display: 'flex', flexDirection: 'column' }}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.4)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {items.length > 1 && (
          <>
            <IconButton
              onClick={() => onNavigate((index - 1 + items.length) % items.length)}
              sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.4)' }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => onNavigate((index + 1) % items.length)}
              sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.4)' }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}

        <Box
          component="img"
          src={item.src}
          alt={item.caption ?? ''}
          sx={{ display: 'block', maxWidth: '90vw', maxHeight: '80vh', mx: 'auto', objectFit: 'contain' }}
        />
        {item.caption && (
          <Typography sx={{ color: '#fff', p: 2, textAlign: 'center' }} variant="body2">
            {item.caption}
          </Typography>
        )}
      </Box>
    </Dialog>
  )
}
