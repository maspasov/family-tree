import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import './App.css'
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material'
import { firebaseConfigured } from './lib/firebase'
import { messages, motto, t, useLocale } from './lib/i18n'
import { buildBirthdaysIcs, hasBirthdays } from './lib/ics'
import { sendAddedNotification, sendAdminNotification } from './lib/notifyEmail'
import { navigate, useHashRoute } from './lib/hashRoute'
import { TreeProvider, useTree } from './tree/TreeContext'
import { usePersons } from './data/usePersons'
import {
  EMPTY_DRAFT,
  descendantIds,
  fullName,
  stripAudit,
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
import { About } from './components/About'
import { Toolbar, type ViewMode } from './components/Toolbar'
import { PersonPanel } from './components/PersonPanel'
import { PersonForm } from './components/PersonForm'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ImportDialog } from './components/ImportDialog'
import { LoginGate } from './components/LoginGate'
import { TreePicker } from './components/TreePicker'

type Editing = { kind: 'add'; parentId: string | null } | null

function CenteredMessage({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <Box sx={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 420 }}>
        <Typography variant="h4">{title}</Typography>
        <Typography color="text.secondary">{body}</Typography>
        {action}
      </Stack>
    </Box>
  )
}

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

function TreeApp() {
  // Subscribing here forces this whole tree to re-render on a language
  // switch — most components below read the plain `t()`/`messages` imports
  // directly rather than this hook, so this cascade is what refreshes them.
  useLocale()
  const { treeId, tree, isEditor, canView, loading: treeLoading, notFound } = useTree()
  const { people, byId, loading, error, addPerson, updatePerson, deletePerson, importPeople } =
    usePersons(treeId, canView)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
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
  const [autoEditId, setAutoEditId] = useState<string | null>(null)
  const selected = selectedId ? byId.get(selectedId) ?? null : null

  const focusPerson = useCallback(
    (id: string) => {
      setSelectedId(id)
      // A merged wife/husband (see toChartData's isMergedSpouse) has no chart
      // node of their own — center/highlight their spouse's card instead,
      // where their name actually renders.
      const person = byId.get(id)
      const chartFocusId =
        (person?.relation?.type === 'wife' || person?.relation?.type === 'husband') &&
        byId.has(person.relation.toId)
          ? person.relation.toId
          : id
      if (viewMode === 'map') mapRef.current?.focus(id)
      else if (viewMode === 'calendar') calendarRef.current?.focus(id)
      else chartRef.current?.focus(chartFocusId)
    },
    [viewMode, byId],
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

  const handleQuickLink = useCallback(
    (type: QuickLinkType, personId: string) => {
      if (type === 'edit' || type === 'delete') {
        const person = byId.get(personId)
        if (!person) return
        if (type === 'edit') {
          setSelectedId(personId)
          setAutoEditId(personId)
        } else {
          setDeleteTarget(person)
        }
        return
      }
      setSelectedId(personId)
      pendingFocusIdRef.current = personId
      setViewMode(type)
    },
    [byId],
  )

  const deleteBlocked = useMemo(() => {
    if (!deleteTarget) return null
    const n = descendantIds(people, deleteTarget.id).size
    return n > 0 ? messages.deleteBlockedHasChildren(fullName(deleteTarget), n) : null
  }, [deleteTarget, people])

  async function submitForm(draft: PersonDraft) {
    setBusy(true)
    setActionError(null)
    try {
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
      if (draft.email) {
        sendAddedNotification({ ...draft, id })
          .then((sent) => {
            if (sent) setInfoMessage(messages.notifySent(draft.email!))
          })
          .catch(() => setInfoMessage(messages.notifyFailed(draft.email!)))
      }
      // Quiet background CC to the admin — every addition, not just ones with
      // an email on file; failures aren't worth interrupting the editor for.
      sendAdminNotification({ ...draft, id }).catch(() => {})
      setSelectedId(id)
      setEditing(null)
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSavePerson(id: string, draft: PersonDraft) {
    await updatePerson(id, draft)
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
      <CenteredMessage title={t('configMissingTitle')} body={t('configMissingBody')} />
    )
  }

  if (treeLoading) {
    return (
      <Box sx={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (notFound) {
    return (
      <CenteredMessage
        title={t('treeNotFound')}
        body={t('treeNotFoundBody')}
        action={<Button variant="contained" onClick={() => navigate('/')}>{t('backToTrees')}</Button>}
      />
    )
  }

  if (!canView) {
    return (
      <CenteredMessage
        title={t('treeNoAccess')}
        body={t('treeNoAccessBody')}
        action={<Button variant="outlined" onClick={() => navigate('/')}>{t('backToTrees')}</Button>}
      />
    )
  }

  const addAnchor = editing?.parentId ? byId.get(editing.parentId) : undefined
  const formInitial: PersonDraft = {
    ...EMPTY_DRAFT,
    parentId: editing?.parentId ?? null,
    relation: addAnchor
      ? { type: 'child', toId: addAnchor.id, toName: fullName(addAnchor) }
      : undefined,
  }

  return (
    <>
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
              canEdit={isEditor}
            />
          )}

          {selected && (
            <PersonPanel
              person={selected}
              people={people}
              canEdit={isEditor}
              onClose={() => setSelectedId(null)}
              onSelect={focusPerson}
              onSave={handleSavePerson}
              onAddChild={(p) => setEditing({ kind: 'add', parentId: p.id })}
              onDelete={(p) => setDeleteTarget(p)}
              autoEdit={autoEditId === selected.id}
              onAutoEditHandled={() => setAutoEditId(null)}
            />
          )}
        </Box>

        <Box
          component="footer"
          sx={{
            py: 1,
            px: 2,
            textAlign: 'center',
            fontSize: 13,
            color: 'text.secondary',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box component="span" sx={{ fontStyle: 'italic' }}>{tree?.motto || motto}</Box>
          {' · '}
          <Box
            component="button"
            type="button"
            onClick={() => setShowAbout(true)}
            sx={{ border: 0, background: 'none', p: 0, font: 'inherit', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {t('aboutLink')}
          </Box>
        </Box>

        {showAbout && <About onClose={() => setShowAbout(false)} />}

        {editing && (
          <PersonForm
            mode="add"
            initial={formInitial}
            people={people}
            busy={busy}
            onSubmit={submitForm}
            onCancel={() => setEditing(null)}
          />
        )}

        {deleteTarget && (
          <ConfirmDialog
            title={t('deleteTitle')}
            message={messages.deleteConfirm(fullName(deleteTarget))}
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
    </>
  )
}

/**
 * Route dispatch: `#/` is the tree picker, `#/t/<slug>` mounts one tree. The
 * login gate wraps both so nothing renders until the visitor is signed in.
 */
export default function App() {
  useLocale()
  const { segments } = useHashRoute()

  let body: ReactNode
  if (segments[0] === 't' && segments[1]) {
    // Key on the slug so switching trees fully remounts with fresh state.
    body = (
      <TreeProvider key={segments[1]} treeId={segments[1]}>
        <TreeApp />
      </TreeProvider>
    )
  } else {
    body = <TreePicker />
  }

  return <LoginGate>{body}</LoginGate>
}
