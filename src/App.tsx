import { useCallback, useMemo, useRef, useState } from 'react'
import './App.css'
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { firebaseConfigured } from './lib/firebase'
import { bg, motto, t } from './lib/i18n'
import { useAuth } from './auth/AuthContext'
import { usePersons } from './data/usePersons'
import {
  EMPTY_DRAFT,
  descendantIds,
  fullName,
  type Person,
  type PersonDraft,
} from './model/person'
import { FamilyChart, type ChartLayout, type FamilyChartHandle } from './components/FamilyChart'
import { Toolbar } from './components/Toolbar'
import { PersonPanel } from './components/PersonPanel'
import { PersonForm } from './components/PersonForm'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ImportDialog } from './components/ImportDialog'
import { LoginGate } from './components/LoginGate'

type Editing =
  | { kind: 'add'; parentId: string | null }
  | { kind: 'edit'; person: Person }
  | null

function downloadJson(people: Person[]) {
  // Keep `id` (so re-import matches rows); drop server-managed audit fields.
  const rows = people.map(({ createdAt, updatedAt, updatedByEmail, ...rest }) => rest)
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rodoslovno-durvo-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const { isEditor } = useAuth()
  const { people, byId, loading, error, addPerson, updatePerson, deletePerson, importPeople } =
    usePersons(isEditor)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [busy, setBusy] = useState(false)
  const [layout, setLayout] = useState<ChartLayout>('top')
  const [actionError, setActionError] = useState<string | null>(null)

  const chartRef = useRef<FamilyChartHandle>(null)
  const selected = selectedId ? byId.get(selectedId) ?? null : null

  const focusPerson = useCallback((id: string) => {
    setSelectedId(id)
    chartRef.current?.focus(id)
  }, [])

  const deleteBlocked = useMemo(() => {
    if (!deleteTarget) return null
    const n = descendantIds(people, deleteTarget.id).size
    return n > 0 ? bg.deleteBlockedHasChildren(fullName(deleteTarget), n) : null
  }, [deleteTarget, people])

  async function submitForm(draft: PersonDraft) {
    setBusy(true)
    setActionError(null)
    try {
      if (editing?.kind === 'edit') {
        await updatePerson(editing.person.id, draft)
        setSelectedId(editing.person.id)
      } else {
        const id = await addPerson(draft)
        setSelectedId(id)
      }
      setEditing(null)
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusy(true)
    setActionError(null)
    try {
      await deletePerson(deleteTarget.id)
      if (selectedId === deleteTarget.id) setSelectedId(null)
      setDeleteTarget(null)
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!firebaseConfigured) {
    return (
      <Box sx={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
        <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 420 }}>
          <Typography variant="h4">{t('configMissingTitle')}</Typography>
          <Typography color="text.secondary">{t('configMissingBody')}</Typography>
        </Stack>
      </Box>
    )
  }

  const formInitial: PersonDraft =
    editing?.kind === 'edit'
      ? { ...EMPTY_DRAFT, ...stripAudit(editing.person) }
      : { ...EMPTY_DRAFT, parentId: editing?.kind === 'add' ? editing.parentId : null }

  return (
    <LoginGate>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden' }}>
        <Toolbar
          people={people}
          layout={layout}
          onLayoutChange={setLayout}
          onFocusPerson={focusPerson}
          onFit={() => chartRef.current?.fit()}
          onExpandAll={() => chartRef.current?.expandAll()}
          onCollapseAll={() => chartRef.current?.collapseAll()}
          onZoomIn={() => chartRef.current?.zoomIn()}
          onZoomOut={() => chartRef.current?.zoomOut()}
          onExportPng={() => chartRef.current?.exportPng()}
          onExportJson={() => downloadJson(people)}
          onImport={() => setShowImport(true)}
          onAddRoot={() =>
            setEditing({
              kind: 'add',
              parentId: selected ? selected.id : null,
            })
          }
        />

        {(error || actionError) && (
          <Alert
            severity="error"
            onClose={() => setActionError(null)}
            sx={{ borderRadius: 0 }}
          >
            {t('errorPrefix')}: {actionError || error}
          </Alert>
        )}

        <Box component="main" className="ft-main">
          {loading ? (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary">{t('loading')}</Typography>
              </Stack>
            </Box>
          ) : people.length === 0 ? (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 420, textAlign: 'center' }}>
                <Typography variant="h4">{t('emptyTreeTitle')}</Typography>
                <Typography color="text.secondary">{t('emptyTreeBody')}</Typography>
                {isEditor && (
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={() => setEditing({ kind: 'add', parentId: null })}
                    >
                      {t('addRoot')}
                    </Button>
                    <Button variant="outlined" onClick={() => setShowImport(true)}>
                      {t('importJson')}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          ) : (
            <FamilyChart
              ref={chartRef}
              people={people}
              layout={layout}
              onSelect={setSelectedId}
            />
          )}

          {selected && (
            <PersonPanel
              person={selected}
              people={people}
              canEdit={isEditor}
              onClose={() => setSelectedId(null)}
              onSelect={focusPerson}
              onEdit={(p) => setEditing({ kind: 'edit', person: p })}
              onAddChild={(p) => setEditing({ kind: 'add', parentId: p.id })}
              onDelete={(p) => setDeleteTarget(p)}
            />
          )}
        </Box>

        <Box
          component="footer"
          sx={{
            py: 1,
            px: 2,
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'text.secondary',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {motto}
        </Box>

        {editing && (
          <PersonForm
            mode={editing.kind === 'edit' ? 'edit' : 'add'}
            initial={formInitial}
            people={people}
            selfId={editing.kind === 'edit' ? editing.person.id : undefined}
            busy={busy}
            onSubmit={submitForm}
            onCancel={() => setEditing(null)}
          />
        )}

        {deleteTarget && (
          <ConfirmDialog
            title={t('deleteTitle')}
            message={bg.deleteConfirm(fullName(deleteTarget))}
            confirmLabel={t('confirmYes')}
            danger
            busy={busy}
            blockedMessage={deleteBlocked}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {showImport && (
          <ImportDialog
            onImport={importPeople}
            onClose={() => setShowImport(false)}
          />
        )}
      </Box>
    </LoginGate>
  )
}

/** Drop the fields the form doesn't own (id + audit), keep the editable rest. */
function stripAudit(p: Person): PersonDraft {
  const { id, createdAt, updatedAt, updatedByEmail, ...draft } = p
  return draft
}
