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
import { t } from './i18n'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const emailNotifyConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

/** No-op (resolves to `false`) when EmailJS isn't configured — callers can skip showing feedback in that case. */
export async function sendAddedNotification(person: Person): Promise<boolean> {
  if (!emailNotifyConfigured || !person.email) return false

  await emailjs.send(
    SERVICE_ID!,
    TEMPLATE_ID!,
    {
      to_email: person.email,
      to_name: fullName(person) || person.email,
      tree_name: t('appTitle'),
      family_name: t('appSubtitle'),
      site_url: window.location.origin + import.meta.env.BASE_URL,
    },
    { publicKey: PUBLIC_KEY! },
  )
  return true
}
