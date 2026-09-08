import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { OrgChart, type OrgChartNode } from 'd3-org-chart'
import {
  fullName,
  lifespan,
  toChartData,
  type ChartDatum,
  type Person,
} from '../model/person'
import { escapeHtml } from '../lib/html'
import { t, useLocale } from '../lib/i18n'

export type ChartLayout = 'top' | 'bottom'
export type QuickLinkType = 'map' | 'calendar' | 'edit' | 'delete'

// Real MUI icon glyphs (exact path data from @mui/icons-material), inlined
// as raw SVG — this card is injected as an HTML string by d3-org-chart
// outside React, so the React icon *components* aren't usable here.
const ICON_PATHS = {
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z',
  delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z',
  place:
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5',
  calendar:
    'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V10h14zM9 14H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zm-8 4H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2z',
} as const

function svgIcon(path: keyof typeof ICON_PATHS): string {
  return `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="${ICON_PATHS[path]}"/></svg>`
}

export interface FamilyChartHandle {
  fit: () => void
  expandAll: () => void
  collapseAll: () => void
  zoomIn: () => void
  zoomOut: () => void
  focus: (id: string) => void
  clearFocus: () => void
  exportPng: () => void
}

interface Props {
  people: Person[]
  layout: ChartLayout
  onSelect: (id: string | null) => void
  onQuickLink?: (type: QuickLinkType, personId: string) => void
  canEdit: boolean
}

function nodeHtml(
  node: OrgChartNode<ChartDatum>,
  canEdit: boolean,
  spouseByAnchorId: Map<string, Person>,
): string {
  const datum = node.data
  if (datum._synthetic || !datum.person) {
    return `<div class="ft-card ft-card--synthetic">${escapeHtml(t('synthRootLabel'))}</div>`
  }
  const p = datum.person
  const name = escapeHtml(fullName(p) || t('noName'))
  const years = escapeHtml(lifespan(p))
  // A wife/husband merges into this card instead of getting their own chart
  // node (see toChartData's isMergedSpouse) — clickable through to her own
  // panel. Falls back to the plain free-text `spouse` field when there's no
  // linked Person for this anchor.
  const linkedSpouse = spouseByAnchorId.get(p.id)
  const spouseGenderClass = linkedSpouse
    ? linkedSpouse.gender === 'm'
      ? 'ft-card__spouse--m'
      : linkedSpouse.gender === 'f'
        ? ''
        : 'ft-card__spouse--u'
    : ''
  const spouseHtml = linkedSpouse
    ? `<div class="ft-card__spouse ft-card__spouse--link ${spouseGenderClass}" data-select-person="${escapeHtml(linkedSpouse.id)}">⚭ ${escapeHtml(fullName(linkedSpouse) || t('noName'))}</div>`
    : p.spouse
      ? `<div class="ft-card__spouse">⚭ ${escapeHtml(p.spouse)}</div>`
      : ''
  const place = p.birthPlace ? escapeHtml(p.birthPlace) : ''
  const genderClass =
    p.gender === 'm' ? 'ft-card--m' : p.gender === 'f' ? 'ft-card--f' : 'ft-card--u'
  const flag = p.verified === false
    ? `<span class="ft-card__flag" title="${escapeHtml(t('unverifiedFlagTitle'))}">?</span>`
    : ''
  const kids = node.data._childCount ?? 0
  const kidsBadge = kids > 0 ? `<span class="ft-card__kids">${kids}</span>` : ''

  const quickLinks: string[] = []
  if (canEdit) {
    quickLinks.push(
      `<button type="button" class="ft-card__quicklink" title="${escapeHtml(t('quickLinkEditTitle'))}" data-quicklink="edit" data-person-id="${escapeHtml(p.id)}">${svgIcon('edit')}</button>`,
    )
  }
  if (p.geo) {
    quickLinks.push(
      `<button type="button" class="ft-card__quicklink" title="${escapeHtml(t('quickLinkMapTitle'))}" data-quicklink="map" data-person-id="${escapeHtml(p.id)}">${svgIcon('place')}</button>`,
    )
  }
  if (p.birthMonthDay) {
    quickLinks.push(
      `<button type="button" class="ft-card__quicklink" title="${escapeHtml(t('quickLinkCalendarTitle'))}" data-quicklink="calendar" data-person-id="${escapeHtml(p.id)}">${svgIcon('calendar')}</button>`,
    )
  }
  if (canEdit) {
    quickLinks.push(
      `<button type="button" class="ft-card__quicklink ft-card__quicklink--danger" title="${escapeHtml(t('quickLinkDeleteTitle'))}" data-quicklink="delete" data-person-id="${escapeHtml(p.id)}">${svgIcon('delete')}</button>`,
    )
  }
  const quickLinksHtml = quickLinks.length
    ? `<div class="ft-card__quicklinks">${quickLinks.join('')}</div>`
    : ''

  return `
    <div class="ft-card ${genderClass}">
      ${flag}
      <div class="ft-card__name">${name}</div>
      ${years ? `<div class="ft-card__meta">${years}</div>` : ''}
      ${spouseHtml}
      ${place ? `<div class="ft-card__place">${place}</div>` : ''}
      ${quickLinksHtml}
      ${kidsBadge}
    </div>`
}

const NODE_W = 244
const NODE_H = 108

export const FamilyChart = forwardRef<FamilyChartHandle, Props>(
  function FamilyChart({ people, layout, onSelect, onQuickLink, canEdit }, ref) {
    const { locale } = useLocale()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const chartRef = useRef<OrgChart<ChartDatum> | null>(null)
    // Stable datum objects keyed by id so d3-org-chart keeps expand/collapse
    // state across Firestore snapshots instead of resetting on every edit.
    const cacheRef = useRef<Map<string, ChartDatum>>(new Map())
    const layoutRef = useRef<ChartLayout>(layout)
    const onQuickLinkRef = useRef(onQuickLink)
    onQuickLinkRef.current = onQuickLink
    const onSelectRef = useRef(onSelect)
    onSelectRef.current = onSelect

    // Build the array d3-org-chart consumes, reusing cached object identities.
    function buildData(): ChartDatum[] {
      const fresh = toChartData(people)
      const cache = cacheRef.current
      const seen = new Set<string>()
      const childCount = new Map<string, number>()
      for (const d of fresh) {
        if (d.parentId) childCount.set(d.parentId, (childCount.get(d.parentId) ?? 0) + 1)
      }
      const out = fresh.map((d) => {
        seen.add(d.id)
        const existing = cache.get(d.id)
        const merged: ChartDatum = existing ?? { ...d }
        merged.id = d.id
        merged.parentId = d.parentId
        merged.person = d.person
        merged._synthetic = d._synthetic
        merged._childCount = childCount.get(d.id) ?? 0
        cache.set(d.id, merged)
        return merged
      })
      for (const key of [...cache.keys()]) if (!seen.has(key)) cache.delete(key)
      return out
    }

    // Create the chart once.
    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      chartRef.current = new OrgChart<ChartDatum>()
      return () => {
        chartRef.current = null
        el.innerHTML = ''
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // (Re)render on data or layout change.
    useEffect(() => {
      const chart = chartRef.current
      const el = containerRef.current
      if (!chart || !el) return
      const data = buildData()
      if (data.length === 0) {
        el.innerHTML = ''
        return
      }
      const spouseByAnchorId = new Map<string, Person>()
      for (const p of people) {
        if ((p.relation?.type === 'wife' || p.relation?.type === 'husband') && p.relation.toId) {
          spouseByAnchorId.set(p.relation.toId, p)
        }
      }
      chart
        .container(el)
        .data(data)
        .nodeId((d: ChartDatum) => d.id)
        .parentNodeId((d: ChartDatum) => d.parentId ?? undefined)
        .nodeWidth(() => NODE_W)
        .nodeHeight(() => NODE_H)
        .childrenMargin(() => 70)
        .siblingsMargin(() => 26)
        .compactMarginBetween(() => 24)
        .compactMarginPair(() => 90)
        .neighbourMargin(() => 40)
        .compact(true)
        .layout(layout)
        .initialExpandLevel(4)
        .scaleExtent([0.08, 2.5])
        .nodeContent((d: OrgChartNode<ChartDatum>) => nodeHtml(d, canEdit, spouseByAnchorId))
        .onNodeClick((node: OrgChartNode<ChartDatum>) => {
          const datum = node.data
          onSelect(datum && !datum._synthetic ? datum.id : null)
        })
        .render()

      if (layoutRef.current !== layout) {
        layoutRef.current = layout
        chart.fit()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [people, layout, canEdit, locale])

    // Delegated, capture-phase listener for the quick-link buttons inside
    // `nodeHtml`'s raw HTML string — bound once on the stable container div
    // (d3-org-chart only ever replaces its children, never this element), so
    // it keeps working across every re-render without needing to be rebound.
    // Capture phase + stopPropagation here is what stops the click from also
    // bubbling into d3-org-chart's own onNodeClick handler on the node group.
    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      function handleQuickLinkClick(e: MouseEvent) {
        const quicklinkTarget = (e.target as HTMLElement).closest<HTMLElement>('[data-quicklink]')
        if (quicklinkTarget) {
          e.stopPropagation()
          const type = quicklinkTarget.dataset.quicklink as QuickLinkType
          const personId = quicklinkTarget.dataset.personId
          if (personId) onQuickLinkRef.current?.(type, personId)
          return
        }
        // The linked-spouse name merged into a card (see nodeHtml) opens that
        // person's own panel directly, instead of the card's own.
        const selectTarget = (e.target as HTMLElement).closest<HTMLElement>('[data-select-person]')
        if (selectTarget) {
          e.stopPropagation()
          const personId = selectTarget.dataset.selectPerson
          if (personId) onSelectRef.current?.(personId)
        }
      }
      el.addEventListener('click', handleQuickLinkClick, { capture: true })
      return () => el.removeEventListener('click', handleQuickLinkClick, { capture: true })
    }, [])

    // Re-fit on container resize.
    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      let raf = 0
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => chartRef.current?.render())
      })
      ro.observe(el)
      return () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
      }
    }, [])

    useImperativeHandle(ref, (): FamilyChartHandle => ({
      fit: () => chartRef.current?.fit(),
      expandAll: () => chartRef.current?.expandAll().fit(),
      collapseAll: () => chartRef.current?.collapseAll().fit(),
      zoomIn: () => chartRef.current?.zoomIn(),
      zoomOut: () => chartRef.current?.zoomOut(),
      focus: (id: string) => {
        const chart = chartRef.current
        if (!chart) return
        chart.setUpToTheRootHighlighted(id).setCentered(id).render()
      },
      clearFocus: () => chartRef.current?.clearHighlighting(),
      exportPng: () => {
        const bg = getComputedStyle(document.documentElement)
          .getPropertyValue('--chart-bg')
          .trim()
        chartRef.current?.exportImg({ full: true, scale: 2, backgroundColor: bg || '#f6f4ee' })
      },
    }))

    return <div ref={containerRef} className="ft-chart" />
  },
)
