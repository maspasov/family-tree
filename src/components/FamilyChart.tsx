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

export type ChartLayout = 'top' | 'bottom'

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
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  )
}

function nodeHtml(node: OrgChartNode<ChartDatum>): string {
  const datum = node.data
  if (datum._synthetic || !datum.person) {
    return `<div class="ft-card ft-card--synthetic">Родословно дърво</div>`
  }
  const p = datum.person
  const name = escapeHtml(fullName(p) || 'Без име')
  const years = escapeHtml(lifespan(p))
  const spouse = p.spouse ? escapeHtml(p.spouse) : ''
  const place = p.birthPlace ? escapeHtml(p.birthPlace) : ''
  const genderClass =
    p.gender === 'm' ? 'ft-card--m' : p.gender === 'f' ? 'ft-card--f' : 'ft-card--u'
  const flag = p.verified === false
    ? `<span class="ft-card__flag" title="Непроверено">?</span>`
    : ''
  const kids = node.data._childCount ?? 0
  const kidsBadge = kids > 0 ? `<span class="ft-card__kids">${kids}</span>` : ''

  return `
    <div class="ft-card ${genderClass}">
      ${flag}
      <div class="ft-card__name">${name}</div>
      ${years ? `<div class="ft-card__meta">${years}</div>` : ''}
      ${spouse ? `<div class="ft-card__spouse">⚭ ${spouse}</div>` : ''}
      ${place ? `<div class="ft-card__place">${place}</div>` : ''}
      ${kidsBadge}
    </div>`
}

const NODE_W = 244
const NODE_H = 108

export const FamilyChart = forwardRef<FamilyChartHandle, Props>(
  function FamilyChart({ people, layout, onSelect }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const chartRef = useRef<OrgChart<ChartDatum> | null>(null)
    // Stable datum objects keyed by id so d3-org-chart keeps expand/collapse
    // state across Firestore snapshots instead of resetting on every edit.
    const cacheRef = useRef<Map<string, ChartDatum>>(new Map())
    const layoutRef = useRef<ChartLayout>(layout)

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
        .nodeContent((d: OrgChartNode<ChartDatum>) => nodeHtml(d))
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
    }, [people, layout])

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
      exportPng: () =>
        chartRef.current?.exportImg({ full: true, scale: 2, backgroundColor: '#faf8f3' }),
    }))

    return <div ref={containerRef} className="ft-chart" />
  },
)
