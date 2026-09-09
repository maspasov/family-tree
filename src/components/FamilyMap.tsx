import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fullName, lifespan, type Person } from '../model/person'
import { escapeHtml } from '../lib/html'
import { t, messages, useLocale } from '../lib/i18n'

export interface FamilyMapHandle {
  fit: () => void
  focus: (id: string) => void
}

interface Props {
  people: Person[]
  onSelect: (id: string | null) => void
}

/** Bulgaria-ish default view for when nobody has a pin yet. */
const DEFAULT_CENTER: L.LatLngTuple = [42.6977, 23.3219]
const DEFAULT_ZOOM = 7

/** Crosshair glyph for the "my location" control (inline so no icon font/asset). */
const LOCATE_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3A9 9 0 0013 3.06V1h-2v2.06A9 9 0 003.06 11H1v2h2.06A9 9 0 0011 20.94V23h2v-2.06A9 9 0 0020.94 13H23v-2h-2.06zM12 19a7 7 0 110-14 7 7 0 010 14z"/>' +
  '</svg>'

function genderClass(p: Person): string {
  return p.gender === 'm' ? 'ft-pin--m' : p.gender === 'f' ? 'ft-pin--f' : 'ft-pin--u'
}

/** People sharing the exact same geocoded point (e.g. one household) render as one marker. */
function groupByLocation(people: Person[]): Map<string, Person[]> {
  const groups = new Map<string, Person[]>()
  for (const p of people) {
    if (!p.geo) continue
    const key = `${p.geo.lat.toFixed(5)},${p.geo.lng.toFixed(5)}`
    const group = groups.get(key)
    if (group) group.push(p)
    else groups.set(key, [p])
  }
  return groups
}

/** Hover tooltip content — name, lifespan, address (single) or a name list (grouped). */
function tooltipHtml(group: Person[]): string {
  if (group.length === 1) {
    const p = group[0]
    const years = lifespan(p)
    return `<div class="ft-pin-tip">
      <strong>${escapeHtml(fullName(p) || t('noName'))}</strong>
      ${years ? `<span>${escapeHtml(years)}</span>` : ''}
      ${p.address ? `<span>${escapeHtml(p.address)}</span>` : ''}
    </div>`
  }
  const names = group.map((p) => escapeHtml(fullName(p) || t('noName'))).join(', ')
  return `<div class="ft-pin-tip">
    <strong>${escapeHtml(messages.peopleAtAddress(group.length))}</strong>
    <span>${names}</span>
  </div>`
}

function pinIcon(group: Person[]): L.DivIcon {
  const html =
    group.length === 1
      ? `<div class="ft-pin ${genderClass(group[0])}"></div>`
      : `<div class="ft-pin ft-pin--group">${group.length}</div>`
  return L.divIcon({
    html,
    className: '', // reset Leaflet's default icon styling; ours is entirely in App.css
    iconSize: [22, 22],
    popupAnchor: [0, -12],
  })
}

export const FamilyMap = forwardRef<FamilyMapHandle, Props>(function FamilyMap(
  { people, onSelect },
  ref,
) {
  const { locale } = useLocale()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const personLocationRef = useRef<Map<string, string>>(new Map())
  // The signed-in user's own position (browser geolocation), shown on demand.
  const meMarkerRef = useRef<L.Marker | null>(null)
  const meAccuracyRef = useRef<L.Circle | null>(null)

  // Create the map once.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const map = L.map(el, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map

    // "My location" control — geolocation needs a user gesture and shouldn't
    // nag on load, so it's a button, not an auto-prompt.
    const LocateControl = L.Control.extend({
      options: { position: 'topleft' as L.ControlPosition },
      onAdd() {
        const wrap = L.DomUtil.create('div', 'leaflet-bar ft-locate')
        const btn = L.DomUtil.create('button', '', wrap) as HTMLButtonElement
        btn.type = 'button'
        btn.title = t('mapLocateMe')
        btn.setAttribute('aria-label', t('mapLocateMe'))
        btn.innerHTML = LOCATE_ICON
        L.DomEvent.disableClickPropagation(wrap)
        L.DomEvent.on(btn, 'click', (e) => {
          L.DomEvent.stop(e)
          btn.classList.add('is-loading')
          map.locate({ enableHighAccuracy: true, timeout: 10000 })
        })
        return wrap
      },
    })
    const locateControl = new LocateControl()
    map.addControl(locateControl)

    const clearLoading = () =>
      el.querySelector('.ft-locate button')?.classList.remove('is-loading')

    map.on('locationfound', (e) => {
      clearLoading()
      const ll = e.latlng
      if (meMarkerRef.current && meAccuracyRef.current) {
        meMarkerRef.current.setLatLng(ll)
        meAccuracyRef.current.setLatLng(ll).setRadius(e.accuracy)
      } else {
        meAccuracyRef.current = L.circle(ll, {
          radius: e.accuracy,
          color: '#2f6be0',
          weight: 1,
          fillColor: '#2f6be0',
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(map)
        meMarkerRef.current = L.marker(ll, {
          icon: L.divIcon({
            html: '<div class="ft-pin ft-pin--me"></div>',
            className: '',
            iconSize: [22, 22],
          }),
          zIndexOffset: 1000,
          keyboard: false,
        }).addTo(map)
        meMarkerRef.current.bindTooltip(t('mapYouAreHere'), {
          direction: 'top',
          offset: [0, -12],
          className: 'ft-pin-tip-wrap',
        })
      }
      map.setView(ll, Math.max(map.getZoom(), 13))
    })

    map.on('locationerror', (err) => {
      clearLoading()
      const denied = (err as L.ErrorEvent & { code?: number }).code === 1
      L.popup({ className: 'ft-pin-tip-wrap' })
        .setLatLng(map.getCenter())
        .setContent(denied ? t('mapLocateDenied') : t('mapLocateError'))
        .openOn(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
      meMarkerRef.current = null
      meAccuracyRef.current = null
    }
  }, [])

  // (Re)build markers when the data changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const marker of markersRef.current.values()) marker.remove()
    markersRef.current.clear()
    personLocationRef.current.clear()

    const groups = groupByLocation(people)
    for (const [key, group] of groups) {
      const [lat, lng] = key.split(',').map(Number)
      const marker = L.marker([lat, lng], { icon: pinIcon(group) }).addTo(map)
      for (const p of group) personLocationRef.current.set(p.id, key)
      markersRef.current.set(key, marker)

      marker.bindTooltip(tooltipHtml(group), {
        direction: 'top',
        offset: [0, -12],
        opacity: 0.97,
        sticky: true,
        className: 'ft-pin-tip-wrap',
      })

      if (group.length === 1) {
        marker.on('click', () => onSelect(group[0].id))
      } else {
        const popupHtml = `<div class="ft-pin-popup">${group
          .map((p) => {
            const years = lifespan(p)
            return `<button type="button" class="ft-pin-popup__item" data-person-id="${escapeHtml(p.id)}">${escapeHtml(fullName(p) || t('noName'))}${years ? ` <span class="ft-muted">· ${escapeHtml(years)}</span>` : ''}</button>`
          })
          .join('')}</div>`
        marker.bindPopup(popupHtml)
        marker.on('popupopen', (e) => {
          const root = e.popup.getElement()
          root?.querySelectorAll<HTMLButtonElement>('[data-person-id]').forEach((btn) => {
            btn.addEventListener('click', () => {
              onSelect(btn.dataset.personId ?? null)
              marker.closePopup()
            })
          })
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, locale])

  // Re-size the map when its container changes size (e.g. the person panel opening/closing).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => mapRef.current?.invalidateSize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useImperativeHandle(ref, (): FamilyMapHandle => ({
    fit: () => {
      const map = mapRef.current
      if (!map) return
      const markers = [...markersRef.current.values()]
      if (markers.length === 0) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
        return
      }
      const bounds = L.featureGroup(markers).getBounds()
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    },
    focus: (id: string) => {
      const map = mapRef.current
      const key = personLocationRef.current.get(id)
      if (!map || !key) return
      const marker = markersRef.current.get(key)
      if (!marker) return
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13))
      marker.openPopup()
    },
  }))

  return <div ref={containerRef} className="ft-map" />
})
