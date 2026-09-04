import { useCallback, useMemo, useRef, useState } from 'react'
import './App.css'
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
    return n > 0
      ? `„${fullName(deleteTarget)}“ има ${n} потомък/ци в дървото. Първо преместете или изтрийте тях.`
      : null
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
      <div className="ft-fullmsg">
        <h1>{t('configMissingTitle')}</h1>
        <p>{t('configMissingBody')}</p>
      </div>
    )
  }

  const formInitial: PersonDraft =
    editing?.kind === 'edit'
      ? { ...EMPTY_DRAFT, ...stripAudit(editing.person) }
      : { ...EMPTY_DRAFT, parentId: editing?.kind === 'add' ? editing.parentId : null }

  return (
    <LoginGate>
      <div className="ft-app">
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
          <div className="ft-errorbar" role="alert">
            {t('errorPrefix')}: {actionError || error}
            <button type="button" onClick={() => setActionError(null)}>
              ✕
            </button>
          </div>
        )}

        <main className="ft-main">
          {loading ? (
            <div className="ft-fullmsg">
              <p>{t('loading')}</p>
            </div>
          ) : people.length === 0 ? (
            <div className="ft-fullmsg">
              <h1>{t('emptyTreeTitle')}</h1>
              <p>{t('emptyTreeBody')}</p>
              {isEditor && (
                <div className="ft-fullmsg__btns">
                  <button
                    type="button"
                    className="ft-btn ft-btn--primary"
                    onClick={() => setEditing({ kind: 'add', parentId: null })}
                  >
                    {t('addRoot')}
                  </button>
                  <button type="button" className="ft-btn" onClick={() => setShowImport(true)}>
                    {t('importJson')}
                  </button>
                </div>
              )}
            </div>
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
        </main>

        <footer className="ft-footer">{motto}</footer>

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
      </div>
    </LoginGate>
  )
}

/** Drop the fields the form doesn't own (id + audit), keep the editable rest. */
function stripAudit(p: Person): PersonDraft {
  const { id, createdAt, updatedAt, updatedByEmail, ...draft } = p
  return draft
}
