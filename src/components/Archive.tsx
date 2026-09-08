import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { Lightbox, type LightboxItem } from './Lightbox'
import ocherk1987 from '../assets/archive/ocherk-1987.jpg'
import rodovoDurvoTano from '../assets/archive/rodovo-durvo-tano-str2.jpg'
import rodovoDurvoTsano from '../assets/archive/rodovo-durvo-tsano-str3.jpg'

const ITEMS: LightboxItem[] = [
  {
    src: ocherk1987,
    caption: '„Кратък очерк“ — написан от Димитър, внук на дядо Цано, 9.XII.1987 г.',
  },
  {
    src: rodovoDurvoTano,
    caption: 'Родословно дърво на рода „Брусарите“ — клон Тано Раде Брусарски (стр. 2)',
  },
  {
    src: rodovoDurvoTsano,
    caption: 'Родословно дърво на рода „Брусарите“ — клон дядо Цано Радев Брусарски (стр. 3)',
  },
]

export function Archive() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'auto', p: { xs: 2, sm: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Stack spacing={1}>
          <Typography variant="h5">Архив на рода</Typography>
          <Typography color="text.secondary">
            Оригиналните страници от 1987 г., по които е изградено това родословно дърво.
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {ITEMS.map((item, i) => (
            <Stack key={item.src} spacing={1} sx={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpenIndex(i)}>
              <Box
                component="img"
                src={item.src}
                alt={item.caption}
                loading="lazy"
                sx={{
                  width: '100%',
                  height: 220,
                  objectFit: 'cover',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  boxShadow: 2,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.caption}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Lightbox items={ITEMS} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </Box>
  )
}
