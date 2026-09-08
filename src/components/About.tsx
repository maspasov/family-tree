import { Box, Stack, Typography } from '@mui/material'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import { Modal } from './Modal'
import { t } from '../lib/i18n'

interface Props {
  onClose: () => void
}

export function About({ onClose }: Props) {
  return (
    <Modal title={t('aboutTitle')} onClose={onClose}>
      <Stack spacing={2}>
        <Typography>{t('aboutBody')}</Typography>
        <Typography variant="h6">Martin Spasov</Typography>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <LinkedInIcon fontSize="small" color="primary" />
            <Box
              component="a"
              href="https://www.linkedin.com/in/martin-spasov-5a8a699b/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main' }}
            >
              linkedin.com/in/martin-spasov-5a8a699b
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PhoneIcon fontSize="small" color="primary" />
            <Box component="a" href="tel:+359883382374" sx={{ color: 'primary.main' }}>
              0883 382 374
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <EmailIcon fontSize="small" color="primary" />
            <Box component="a" href="mailto:martospasov@gmail.com" sx={{ color: 'primary.main' }}>
              martospasov@gmail.com
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  )
}
