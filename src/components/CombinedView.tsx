import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import { FamilyChart, type FamilyChartHandle } from './FamilyChart'
import { fetchTreePeople } from '../data/treeLinks'
import { useTrees } from '../data/useTrees'
import { navigate } from '../lib/hashRoute'
import { t, useLocale } from '../lib/i18n'
import type { Person } from '../model/person'

const SEP = '::'
const nsId = (treeId: string, id: string) => `${treeId}${SEP}${id}`
const unNs = (id: string): [string, string] => {
  const i = id.indexOf(SEP)
  return [id.slice(0, i), id.slice(i + SEP.length)]
}

/**
 * Read-only overview of one tree plus every tree it's connected to through a
 * cross-tree marriage link (`Person.partnerLink`), rendered as a single chart.
 * Each tree hangs off a shared synthetic root and its cards carry a tree-name
 * label. Clicking a card jumps into that person's own (editable) tree; clicking
 * the ⚭ line scrolls to the partner here.
 */
export function CombinedView({ slug }: { slug: string }) {
  useLocale()
  const { trees } = useTrees()
  const chartRef = useRef<FamilyChartHandle>(null)
  const [peopleByTree, setPeopleByTree] = useState<Map<string, Person[]> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const treeName = useMemo(() => {
    const m = new Map<string, string>()
    for (const tr of trees) m.set(tr.id, tr.name || tr.slug)
    return m
  }, [trees])

  useEffect(() => {
    // Keyed on `slug` in App, so this only runs on a fresh mount (state is
    // already at its initial `null`/loading value here).
    let cancelled = false
    ;(async () => {
      try {
        // BFS over the tree graph — follow partnerLink.treeId outward.
        const seen = new Set([slug])
        const queue = [slug]
        const out = new Map<string, Person[]>()
        while (queue.length) {
          const s = queue.shift()!
          let ppl: Person[]
          try {
            ppl = await fetchTreePeople(s)
          } catch (e) {
            // A linked tree that's since been deleted (or we lost access to)
            // must not sink the whole combined view — skip it. The root tree
            // failing is a real error, so rethrow that one.
            if (s === slug) throw e
            continue
          }
          out.set(s, ppl)
          for (const p of ppl) {
            const other = p.partnerLink?.treeId
            if (other && !seen.has(other)) {
              seen.add(other)
              queue.push(other)
            }
          }
        }
        if (!cancelled) setPeopleByTree(out)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Flatten to one namespaced person list + a label lookup.
  const { combined, labelById } = useMemo(() => {
    const combined: Person[] = []
    const labelById = new Map<string, string>()
    if (!peopleByTree) return { combined, labelById }
    for (const [treeId, ppl] of peopleByTree) {
      const label = treeName.get(treeId) ?? treeId
      for (const p of ppl) {
        const id = nsId(treeId, p.id)
        labelById.set(id, label)
        combined.push({
          ...p,
          id,
          parentId: p.parentId ? nsId(treeId, p.parentId) : null,
          relation: p.relation
            ? { ...p.relation, toId: nsId(treeId, p.relation.toId) }
            : p.relation,
          // partnerLink keeps its own {treeId, personId} — resolved on click.
        })
      }
    }
    return { combined, labelById }
  }, [peopleByTree, treeName])

  const treeLabelOf = useMemo(
    () => (id: string) => labelById.get(id),
    [labelById],
  )

  const treeCount = peopleByTree?.size ?? 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tooltip title={t('backToTrees')}>
          <IconButton size="small" onClick={() => navigate(`/t/${slug}`)}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>
          {t('combinedTitle')}
          {treeCount > 1 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              · {treeCount}
            </Typography>
          )}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<CenterFocusStrongIcon />} onClick={() => chartRef.current?.fit()}>
          {t('fit')}
        </Button>
      </Stack>

      <Box className="ft-main" sx={{ flex: 1, minHeight: 0 }}>
        {error ? (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : !peopleByTree ? (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <FamilyChart
            ref={chartRef}
            people={combined}
            layout="top"
            canEdit={false}
            treeLabelOf={treeLabelOf}
            onSelect={(id) => {
              if (!id) return
              const [treeId, personId] = unNs(id)
              navigate(`/t/${treeId}/p/${personId}`)
            }}
            onCrossLink={({ treeId, personId }) => chartRef.current?.focus(nsId(treeId, personId))}
          />
        )}
      </Box>
    </Box>
  )
}
