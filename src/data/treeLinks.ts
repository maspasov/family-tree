import {
  collection,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db, treePaths } from '../lib/firebase'
import { fromDoc } from './usePersons'
import type { Person } from '../model/person'

/** One end of a cross-tree marriage bridge. */
export interface PartnerEnd {
  treeId: string
  personId: string
  personName: string
  treeName?: string
}

/**
 * Load one tree's people once (not a live subscription) — used by the
 * "link to another tree" picker to choose the partner. Requires the caller to
 * be a viewer/editor of `treeId` (Firestore rules enforce it).
 */
export async function fetchTreePeople(treeId: string): Promise<Person[]> {
  const snap = await getDocs(collection(db, treePaths(treeId).persons))
  return snap.docs.map((d) => fromDoc(d.id, d.data()))
}

/**
 * Write a mirrored `partnerLink` on both people, atomically. The batch touches
 * two different trees' `persons` docs, so it needs editor rights on *both*
 * trees; if either write is denied the whole thing fails (no half-link).
 */
export async function linkPartners(a: PartnerEnd, b: PartnerEnd): Promise<void> {
  const batch = writeBatch(db)
  const audit = { updatedAt: serverTimestamp() }
  batch.update(doc(db, treePaths(a.treeId).persons, a.personId), {
    partnerLink: {
      treeId: b.treeId,
      personId: b.personId,
      personName: b.personName,
      ...(b.treeName ? { treeName: b.treeName } : {}),
    },
    ...audit,
  })
  batch.update(doc(db, treePaths(b.treeId).persons, b.personId), {
    partnerLink: {
      treeId: a.treeId,
      personId: a.personId,
      personName: a.personName,
      ...(a.treeName ? { treeName: a.treeName } : {}),
    },
    ...audit,
  })
  await batch.commit()
}

/** Clear the bridge from both ends. */
export async function unlinkPartners(
  a: Pick<PartnerEnd, 'treeId' | 'personId'>,
  b: Pick<PartnerEnd, 'treeId' | 'personId'>,
): Promise<void> {
  const batch = writeBatch(db)
  const audit = { updatedAt: serverTimestamp(), partnerLink: deleteField() }
  batch.update(doc(db, treePaths(a.treeId).persons, a.personId), audit)
  batch.update(doc(db, treePaths(b.treeId).persons, b.personId), audit)
  await batch.commit()
}
