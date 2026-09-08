import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { t } from '../lib/i18n'
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
