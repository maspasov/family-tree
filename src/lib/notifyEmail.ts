/**
 * Emails a newly-added person via EmailJS — a service built specifically for
 * sending mail straight from a static site's browser bundle, no backend
 * needed. The public key below is meant to be exposed client-side (that's
 * how EmailJS works); actual sending is rate-limited per EmailJS account,
 * not secured by keeping this value secret.
 *
 * The email's actual subject/body live in the EmailJS dashboard's template,
 * not here — this just supplies the template variables. See README.md for
 * the one-time EmailJS account/template setup and the exact variable names
 * the template should use.
 */
import emailjs from '@emailjs/browser'
import type { Person } from '../model/person'
import { fullName } from '../model/person'
import type { Tree } from '../model/tree'
import { t } from './i18n'

type TreeInfo = Pick<Tree, 'name' | 'subtitle' | 'slug'> | null

/** The tree's public URL, e.g. https://…/family-tree/#/t/brusarite */
function treeUrl(tree: TreeInfo): string {
  const base = window.location.origin + import.meta.env.BASE_URL
  return tree ? `${base.replace(/\/$/, '')}/#/t/${tree.slug}` : base
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const ADMIN_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID
const ADMIN_EMAIL = import.meta.env.VITE_EMAILJS_ADMIN_EMAIL

export const emailNotifyConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)
export const adminNotifyConfigured = Boolean(SERVICE_ID && ADMIN_TEMPLATE_ID && ADMIN_EMAIL && PUBLIC_KEY)

/** No-op (resolves to `false`) when EmailJS isn't configured — callers can skip showing feedback in that case. */
export async function sendAddedNotification(person: Person, tree: TreeInfo): Promise<boolean> {
  if (!emailNotifyConfigured || !person.email) return false

  await emailjs.send(
    SERVICE_ID!,
    TEMPLATE_ID!,
    {
      to_email: person.email,
      to_name: fullName(person) || person.email,
      tree_name: tree?.name || t('appTitle'),
      family_name: tree?.subtitle || tree?.name || t('appTitle'),
      site_url: treeUrl(tree),
    },
    { publicKey: PUBLIC_KEY! },
  )
  return true
}

/**
 * Separate template/recipient from `sendAddedNotification` above — that one
 * emails the newly-added person (only when they have an email on file); this
 * one emails the site admin every time anyone is added, regardless.
 */
export async function sendAdminNotification(person: Person, tree: TreeInfo): Promise<boolean> {
  if (!adminNotifyConfigured) return false

  await emailjs.send(
    SERVICE_ID!,
    ADMIN_TEMPLATE_ID!,
    {
      to_email: ADMIN_EMAIL!,
      person_name: fullName(person) || t('noName'),
      person_email: person.email || '',
      tree_name: tree?.name || t('appTitle'),
      family_name: tree?.subtitle || tree?.name || t('appTitle'),
      site_url: treeUrl(tree),
    },
    { publicKey: PUBLIC_KEY! },
  )
  return true
}
