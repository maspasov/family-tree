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
  const parent = person.parentId
    ? people.find((p) => p.id === person.parentId) ?? null
    : null
  const kids = childrenOf(people, person.id)
  const years = lifespan(person)

  return (
    <aside className="ft-panel">
      <header className="ft-panel__head">
        <h2>{fullName(person)}</h2>
        <button
          type="button"
          className="ft-iconbtn"
          aria-label={t('close')}
          onClick={onClose}
        >
          ✕
        </button>
      </header>

      {person.verified === false && (
        <p className="ft-panel__warn">{t('unverified')}</p>
      )}

      <dl className="ft-panel__facts">
        {years && (
          <>
            <dt>{t('born')} / {t('died')}</dt>
            <dd>{years}</dd>
          </>
        )}
        {person.birthPlace && (
          <>
            <dt>{t('birthPlace')}</dt>
            <dd>{person.birthPlace}</dd>
          </>
        )}
        {person.spouse && (
          <>
            <dt>{t('spouse')}</dt>
            <dd>{person.spouse}</dd>
          </>
        )}
        {parent && (
          <>
            <dt>{t('parent')}</dt>
            <dd>
              <button
                type="button"
                className="ft-link"
                onClick={() => onSelect(parent.id)}
              >
                {fullName(parent)}
              </button>
            </dd>
          </>
        )}
        {person.note && (
          <>
            <dt>{t('note')}</dt>
            <dd className="ft-panel__note">{person.note}</dd>
          </>
        )}
      </dl>

      {kids.length > 0 && (
        <div className="ft-panel__kids">
          <h3>
            {t('children')} · {kids.length}
          </h3>
          <ul>
            {kids.map((k) => (
              <li key={k.id}>
                <button
                  type="button"
                  className="ft-link"
                  onClick={() => onSelect(k.id)}
                >
                  {fullName(k)}
                  {lifespan(k) ? <span className="ft-muted"> · {lifespan(k)}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canEdit && (
        <div className="ft-panel__actions">
          <button type="button" className="ft-btn" onClick={() => onEdit(person)}>
            {t('edit')}
          </button>
          <button
            type="button"
            className="ft-btn"
            onClick={() => onAddChild(person)}
          >
            {t('addChild')}
          </button>
          <button
            type="button"
            className="ft-btn ft-btn--danger"
            onClick={() => onDelete(person)}
          >
            {t('deletePerson')}
          </button>
        </div>
      )}

      {person.updatedByEmail && (
        <p className="ft-panel__audit">
          {t('edit')}: {person.updatedByEmail}
        </p>
      )}
    </aside>
  )
}
