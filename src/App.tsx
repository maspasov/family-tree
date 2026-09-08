import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material'
import { firebaseConfigured } from './lib/firebase'
import { bg, motto, t } from './lib/i18n'
import { buildBirthdaysIcs, hasBirthdays } from './lib/ics'
import { useAuth } from './auth/AuthContext'
import { usePersons } from './data/usePersons'
import {
  EMPTY_DRAFT,
  descendantIds,
  fullName,
  type Person,
  type PersonDraft,
} from './model/person'
import {
  FamilyChart,
  type ChartLayout,
  type FamilyChartHandle,
  type QuickLinkType,
} from './components/FamilyChart'
import { FamilyMap, type FamilyMapHandle } from './components/FamilyMap'
import { FamilyCalendar, type FamilyCalendarHandle } from './components/FamilyCalendar'
import { Archive } from './components/Archive'
import { Toolbar, type ViewMode } from './components/Toolbar'
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

function downloadIcs(people: Person[]) {
  const blob = new Blob([buildBirthdaysIcs(people)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rodoslovno-durvo-rojdeni-dni.ics'
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
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [actionError, setActionError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const chartRef = useRef<FamilyChartHandle>(null)
  const mapRef = useRef<FamilyMapHandle>(null)
  const calendarRef = useRef<FamilyCalendarHandle>(null)
  // Not reactive state on purpose — a quick-link only needs to *pass* a value
  // into the next effect run below, not trigger a render of its own.
  const pendingFocusIdRef = useRef<string | null>(null)
  const selected = selectedId ? byId.get(selectedId) ?? null : null

  const focusPerson = useCallback(
    (id: string) => {
      setSelectedId(id)
      if (viewMode === 'map') mapRef.current?.focus(id)
      else if (viewMode === 'calendar') calendarRef.current?.focus(id)
      else chartRef.current?.focus(id)
    },
    [viewMode],
  )

  // A card's quick-link switches view *and* focuses a person in one click.
  // The target view's ref doesn't exist until after it mounts on the next
  // render, so the actual focus() call has to wait for that — this effect
  // fires once `viewMode` has actually changed to match.
  useEffect(() => {
    const id = pendingFocusIdRef.current
    if (!id) return
    if (viewMode === 'map') mapRef.current?.focus(id)
    else if (viewMode === 'calendar') calendarRef.current?.focus(id)
    pendingFocusIdRef.current = null
  }, [viewMode])

  const handleQuickLink = useCallback((type: QuickLinkType, personId: string) => {
    setSelectedId(personId)
    pendingFocusIdRef.current = personId
    setViewMode(type)
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
        // "баща" is the one relation type that reshapes the tree: the new
        // person becomes the anchor's structural parent (parentId), matching
        // the convention that parentId already represents the father's line.
        if (draft.relation?.type === 'father') {
          const anchor = byId.get(draft.relation.toId)
          if (anchor) {
            await updatePerson(anchor.id, { ...stripAudit(anchor), parentId: id })
          }
        }
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

  function handleExportIcs() {
    if (!hasBirthdays(people)) {
      setInfoMessage(t('icsNoBirthdays'))
      return
    }
    downloadIcs(people)
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

  const addAnchor = editing?.kind === 'add' && editing.parentId ? byId.get(editing.parentId) : undefined
  const formInitial: PersonDraft =
    editing?.kind === 'edit'
      ? { ...EMPTY_DRAFT, ...stripAudit(editing.person) }
      : {
          ...EMPTY_DRAFT,
          parentId: editing?.kind === 'add' ? editing.parentId : null,
          relation: addAnchor
            ? { type: 'child', toId: addAnchor.id, toName: fullName(addAnchor) }
            : undefined,
        }

  return (
    <LoginGate>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden' }}>
        <Toolbar
          people={people}
          layout={layout}
          onLayoutChange={setLayout}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
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
          onExportIcs={handleExportIcs}
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
          {viewMode === 'archive' ? (
            <Archive />
          ) : loading ? (
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
          ) : viewMode === 'map' ? (
            <>
              <FamilyMap ref={mapRef} people={people} onSelect={setSelectedId} />
              {people.every((p) => !p.geo) && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, pointerEvents: 'none' }}>
                  <Stack spacing={1} sx={{ alignItems: 'center', maxWidth: 380, textAlign: 'center', bgcolor: 'background.paper', p: 3, borderRadius: 3, boxShadow: 3 }}>
                    <Typography variant="h6">{t('mapEmptyTitle')}</Typography>
                    <Typography color="text.secondary">{t('mapEmptyBody')}</Typography>
                  </Stack>
                </Box>
              )}
            </>
          ) : viewMode === 'calendar' ? (
            <>
              <FamilyCalendar ref={calendarRef} people={people} onSelect={setSelectedId} />
              {people.every((p) => !p.birthMonthDay) && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, pointerEvents: 'none' }}>
                  <Stack spacing={1} sx={{ alignItems: 'center', maxWidth: 380, textAlign: 'center', bgcolor: 'background.paper', p: 3, borderRadius: 3, boxShadow: 3 }}>
                    <Typography variant="h6">{t('calendarEmptyTitle')}</Typography>
                    <Typography color="text.secondary">{t('calendarEmptyBody')}</Typography>
                  </Stack>
                </Box>
              )}
            </>
          ) : (
            <FamilyChart
              ref={chartRef}
              people={people}
              layout={layout}
              onSelect={setSelectedId}
              onQuickLink={handleQuickLink}
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

        <Snackbar
          open={Boolean(infoMessage)}
          autoHideDuration={6000}
          onClose={() => setInfoMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="info" onClose={() => setInfoMessage(null)} sx={{ width: '100%' }}>
            {infoMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LoginGate>
  )
}

/** Drop the fields the form doesn't own (id + audit), keep the editable rest. */
function stripAudit(p: Person): PersonDraft {
  const { id, createdAt, updatedAt, updatedByEmail, ...draft } = p
  return draft
}
