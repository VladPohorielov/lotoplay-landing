/* global L */
const burger = document.querySelector('.burger'); const nav = document.querySelector('.nav')
if (burger) { burger.addEventListener('click', () => { const ex = burger.getAttribute('aria-expanded') === 'true'; burger.setAttribute('aria-expanded', String(!ex)); nav.classList.toggle('show') }) }
document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', e => { const id = a.getAttribute('href').slice(1); const el = document.getElementById(id); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); nav.classList.remove('show'); if (burger) burger.setAttribute('aria-expanded', 'false') } }) })

// ticket form elements (queried once; script is deferred so DOM is ready)
const ticketCity = document.getElementById('ticketCity')
const ticketVenue = document.getElementById('ticketVenue')
const ticketDate = document.getElementById('ticketDate')
const ticketQty = document.getElementById('ticketQty')

function openModal (d) {
  if (!d.open) d.showModal()
  // focus first input inside modal for accessibility
  const first = d.querySelector('input,button,select,textarea'); if (first) first.focus()
  // hide main content from assistive tech while modal open
  const mainEl = document.getElementById('main'); if (mainEl) mainEl.setAttribute('aria-hidden', 'true')
  // install simple focus-trap: keep Tab inside dialog
  const focusable = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  const nodes = Array.from(d.querySelectorAll(focusable))
  const handler = function (e) { if (e.key !== 'Tab') return; const firstNode = nodes[0]; const lastNode = nodes[nodes.length - 1]; if (nodes.length === 0) { e.preventDefault(); return } if (e.shiftKey) { if (document.activeElement === firstNode) { e.preventDefault(); lastNode.focus() } } else { if (document.activeElement === lastNode) { e.preventDefault(); firstNode.focus() } } }
  d.__focusHandler = handler
  d.addEventListener('keydown', handler)
}
function closeModal (d) {
  if (d.open) d.close()
  // return focus to last focused element if stored
  const trigger = d.__triggerButton; if (trigger) trigger.focus()
  // restore main visibility for assistive tech
  const mainEl = document.getElementById('main'); if (mainEl) mainEl.removeAttribute('aria-hidden')
  // remove focus trap handler
  if (d.__focusHandler) { d.removeEventListener('keydown', d.__focusHandler); delete d.__focusHandler }
}
// Toast helper
function showToast (msg, isError) {
  if (!msg) return
  let container = document.querySelector('.toast-container')
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container) }
  // make container a polite live region for screen readers
  container.setAttribute('role', 'status'); container.setAttribute('aria-live', 'polite')
  const t = document.createElement('div'); t.className = 'toast' + (isError ? ' error' : '')
  // message
  const txt = document.createElement('span'); txt.textContent = msg; t.appendChild(txt)
  // close button
  const close = document.createElement('button'); close.className = 'toast-close'; close.setAttribute('aria-label', 'Закрити повідомлення'); close.textContent = '✕'
  close.addEventListener('click', () => { t.remove() })
  t.appendChild(close)
  container.appendChild(t)
  // auto-dismiss
  const timer = setTimeout(() => { if (t.parentNode) t.remove() }, 3500)
  // stop timer if user focuses the toast
  t.addEventListener('mouseover', () => clearTimeout(timer))
}

// Toggle visible spinner inside a button and manage disabled/aria-busy
function setButtonLoading (button, isLoading, loadingText) {
  if (!button) return
  if (isLoading) {
    // store original label
    if (button.dataset.origLabel === undefined) button.dataset.origLabel = button.textContent
    if (loadingText) button.textContent = loadingText; else button.textContent = 'Відправляємо...'
    // add inline SVG spinner
    let sp = button.querySelector('.spinner'); if (!sp) {
      sp = document.createElement('span'); sp.className = 'spinner'; sp.setAttribute('aria-hidden', 'true')
      sp.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"></circle>
          <path d="M45 25a20 20 0 0 0-20-20" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"></path>
        </svg>`
      button.appendChild(sp)
    }
    button.disabled = true; button.setAttribute('aria-busy', 'true')
  } else {
    // restore
    if (button.dataset.origLabel !== undefined) button.textContent = button.dataset.origLabel
    // remove spinner if present
    const sp = button.querySelector('.spinner'); if (sp) sp.remove()
    button.disabled = false; button.removeAttribute('aria-busy')
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-modal-target]')
  if (t) {
    const sel = t.getAttribute('data-modal-target'); const dlg = document.querySelector(sel); if (dlg) { // store trigger for returning focus
      dlg.__triggerButton = t
      if (sel === '#ticketModal') { const { city, venue, date } = t.dataset; if (city) ticketCity.value = city; if (venue) ticketVenue.value = venue; if (date) ticketDate.value = date; ticketQty.value = ticketQty.value || 1 }
      openModal(dlg)
    }
  }
  if (e.target.matches('[data-close-modal]')) { const d = e.target.closest('dialog'); if (d) closeModal(d) }
})

// Close modal on Escape (delegate to closeModal for consistent cleanup)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('dialog[open]').forEach(d => {
      // use our close helper which will perform cleanup consistently
      try { closeModal(d) } catch (err) { /* ignore */ }
    })
  }
})

// Ensure backdrop click closes dialog (existing behavior) and also ensure
// native dialog close (e.g. pressing Escape handled by UA) triggers cleanup.
document.querySelectorAll('dialog.modal').forEach(dlg => {
  // backdrop click: close via our helper
  dlg.addEventListener('click', e => {
    const box = dlg.querySelector('.modal__box, .modal__box--wide')
    if (!box) return
    const bx = box.getBoundingClientRect()
    const inside = e.clientX >= bx.left && e.clientX <= bx.right && e.clientY >= bx.top && e.clientY <= bx.bottom
    if (!inside) closeModal(dlg)
  })

  // when the browser/UA closes the dialog (native Escape, etc.), run cleanup
  dlg.addEventListener('close', () => {
    // If we closed via closeModal already, skip duplicate cleanup
    if (dlg.__skipCloseHandler) {
      delete dlg.__skipCloseHandler
      return
    }
    // perform the same cleanup actions as closeModal does
    try {
      // restore main visibility for assistive tech
      const mainEl = document.getElementById('main')
      if (mainEl) mainEl.removeAttribute('aria-hidden')
      // return focus to trigger if present
      const trigger = dlg.__triggerButton
      if (trigger) trigger.focus()
      // remove focus trap handler if installed
      if (dlg.__focusHandler) { dlg.removeEventListener('keydown', dlg.__focusHandler); delete dlg.__focusHandler }
    } catch (err) {
      // swallow
    }
  })
})

// ——— Відправка форми квитка (GET) ———
// Українські підказки та мінімальна перевірка.
const ticketBtn = document.getElementById('ticketSubmit')
const ticketModal = document.getElementById('ticketModal')

function showTicketError (msg) {
  // Використовуємо toast якщо є, інакше alert
  if (typeof showToast === 'function') showToast(msg, true); else alert(msg)
}

if (ticketBtn) {
  ticketBtn.addEventListener('click', async (e) => {
    e.preventDefault()
    const city = document.getElementById('ticketCity')?.value.trim() || ''
    const venue = document.getElementById('ticketVenue')?.value.trim() || ''
    const date = document.getElementById('ticketDate')?.value.trim() || ''
    const qty = document.getElementById('ticketQty')?.value || ''

    if (!city || !venue || !date || !qty || Number(qty) < 1) {
      showTicketError('Заповніть усі поля квитка коректно.')
      return
    }

    const params = new URLSearchParams({ city, venue, date, qty: String(qty) })
    // Оновлюємо URL (імітація GET-відправки)
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`)

    // Необов’язково: справжній GET на endpoint, якщо задано data-action у <form id="ticketForm">
    const formEl = document.getElementById('ticketForm')
    const action = formEl?.getAttribute('data-action') || null

    try {
      setButtonLoading(ticketBtn, true, 'Надсилаємо...')
      if (action) {
        const url = action + (action.includes('?') ? '&' : '?') + params.toString()
        const res = await fetch(url, { method: 'GET' })
        if (!res.ok) throw new Error('Network response not ok')
      }
      // UX: повідомлення + закриття модалки
      if (typeof showToast === 'function') showToast('Дякуємо! Бронювання зареєстровано (перевірте параметри в адресному рядку).')
      if (ticketModal) closeModal(ticketModal)
    } catch (err) {
      showTicketError('Помилка відправки квитка. Спробуйте пізніше.')
    } finally {
      setButtonLoading(ticketBtn, false)
    }
  })
}

const form = document.getElementById('contactForm'); const statusOut = document.getElementById('formStatus')
function showErr (id, msg) { const small = document.querySelector(`small[data-for="${id}"]`); if (small) small.textContent = msg || '' }
function validEmail (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) }
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault(); const name = form.name.value.trim(); const email = form.email.value.trim(); const message = form.message.value.trim(); const agree = document.getElementById('agree').checked; let ok = true; showErr('name', ''); showErr('email', ''); showErr('message', ''); form.querySelectorAll('input,textarea').forEach(el => { el.style.outline = '' }); if (name.length < 2) { showErr('name', 'Мінімум 2 символи.'); form.name.style.outline = '2px solid rgba(255,113,113,.9)'; ok = false } if (!validEmail(email)) { showErr('email', 'Вкажи валідний email.'); form.email.style.outline = '2px solid rgba(255,113,113,.9)'; ok = false } if (message.length < 10) { showErr('message', 'Щонайменше 10 символів.'); form.message.style.outline = '2px solid rgba(255,113,113,.9)'; ok = false } if (!agree) { alert('Підтверди згоду на обробку даних.'); ok = false } if (!ok) return; const params = new URLSearchParams({ name, email, message }); statusOut.textContent = 'Надсилаємо...'
    const submitBtn = form.querySelector('button[type="submit"]'); setButtonLoading(submitBtn, true, 'Надсилаємо...')
    // Оновлюємо URL з GET-параметрами (за специфікацією)
    history.replaceState(null, '', location.pathname + '?' + params.toString())
    // опційно: виконати GET-запит до data-action якщо вказано
    const endpoint = form.getAttribute('data-action') || null
    try {
      if (endpoint) { const url = endpoint + (endpoint.includes('?') ? '&' : '?') + params.toString(); const res = await fetch(url, { method: 'GET' }); if (!res.ok) throw new Error('Network response not ok') }
      statusOut.textContent = 'Дякуємо! Повідомлення надіслано.'
      form.reset()
      showToast('Повідомлення надіслано')
    } catch (err) {
      statusOut.textContent = 'Помилка відправки. Спробуйте пізніше.'
      showToast('Помилка відправки', true)
    } finally {
      setButtonLoading(submitBtn, false)
    }
  })
}

(function () { const track = document.querySelector('.carousel__track'); if (!track) return; const prev = document.querySelector('.carousel .prev'); const next = document.querySelector('.carousel .next'); prev.addEventListener('click', () => track.scrollBy({ left: -600, behavior: 'smooth' })); next.addEventListener('click', () => track.scrollBy({ left: 600, behavior: 'smooth' })) })()

/* Leaflet map init: markers for concerts with custom popups */
function initMap () {
  if (typeof L === 'undefined') return; const mapEl = document.getElementById('leafletMap'); if (!mapEl) return
  const map = L.map(mapEl, { scrollWheelZoom: false }).setView([50.4501, 30.5234], 6)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map)

  // Approx coordinates for demo — replace with accurate ones if available
  const concerts = [
    { city: 'Київ', venue: 'Docker-G Pub', date: '25.10.2025, 19:00', coords: [50.4501, 30.5234] },
    { city: 'Львів', venue: '!FESTRepublic', date: '01.11.2025, 20:00', coords: [49.8397, 24.0297] },
    { city: 'Одеса', venue: 'Зелений театр', date: '08.11.2025, 19:30', coords: [46.4846, 30.7326] },
    { city: 'Харків', venue: 'ArtZavod', date: '16.11.2025, 19:00', coords: [49.9935, 36.2304] }
  ]

  // Helper: parse concert dates into Date objects and group times by day
  const concertSchedule = (function () {
    const map = new Map()
    concerts.forEach(c => {
      // expecting date like '25.10.2025, 19:00'
      const [dPart, tPart] = c.date.split(',').map(s => s.trim())
      const [dd, mm, yyyy] = dPart.split('.').map(Number)
      const [hh, mi] = tPart.split(':').map(Number)
      const dt = new Date(yyyy, mm - 1, dd, hh, mi)
      const key = dt.toISOString().slice(0, 10) // yyyy-mm-dd
      if (!map.has(key)) map.set(key, [])
      map.get(key).push({ time: tPart, iso: dt.toISOString(), city: c.city, venue: c.venue })
    })
    return map
  })()

  function formatDateForField (iso, time) { const d = new Date(iso); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}.${mm}.${yyyy}, ${time}` }

  function showCalendarForInput (input) {
    // remove existing
    document.querySelectorAll('.calendar-popup').forEach(el => el.remove())
    const rect = input.getBoundingClientRect()
    const popup = document.createElement('div'); popup.className = 'calendar-popup'; popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-label', 'Календар вибору дати')
    // header
    const head = document.createElement('div'); head.className = 'cal-head'
    const title = document.createElement('div'); title.textContent = 'Виберіть дату'; head.appendChild(title)
    const closeBtn = document.createElement('button'); closeBtn.textContent = '✕'; closeBtn.addEventListener('click', () => popup.remove()); head.appendChild(closeBtn)
    popup.appendChild(head)
    // calendar grid of available days
    const grid = document.createElement('div'); grid.className = 'calendar-grid'
    // get sorted keys
    const keys = Array.from(concertSchedule.keys()).sort()
    // build days for the month(s) present — we'll render only keys
    keys.forEach(k => {
      const dt = new Date(k)
      const day = document.createElement('div'); day.className = 'day available'; day.textContent = String(dt.getDate())
      day.dataset.iso = k
      // make day focusable and keyboard-accessible
      day.setAttribute('tabindex', '0')
      day.addEventListener('click', () => {
        // show times
        const times = concertSchedule.get(k) || []
        const timesWrap = document.createElement('div'); timesWrap.className = 'times-list'
        // make times list accessible as listbox
        timesWrap.setAttribute('role', 'listbox')
        times.forEach((t, idx) => {
          const b = document.createElement('button'); b.textContent = t.time; b.setAttribute('role', 'option'); b.setAttribute('tabindex', idx === 0 ? '0' : '-1')
          b.addEventListener('click', () => {
            input.value = formatDateForField(t.iso, t.time)
            popup.remove()
          })
          // keyboard: Enter/Space to select, ArrowUp/ArrowDown to move
          b.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); b.click() }
            if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
              ev.preventDefault()
              const items = Array.from(timesWrap.querySelectorAll('[role="option"]'))
              const cur = items.indexOf(document.activeElement)
              let next = cur + (ev.key === 'ArrowDown' ? 1 : -1)
              if (next < 0) next = items.length - 1; if (next >= items.length) next = 0
              items[next].focus()
            }
          })
          timesWrap.appendChild(b)
        })
        // remove old times if any
        popup.querySelectorAll('.times-list').forEach(n => n.remove())
        popup.appendChild(timesWrap)
      })
      // keyboard handlers for accessibility
      day.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); day.click() }
        if (ev.key === 'Escape') { popup.remove() }
        // arrow navigation between days
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(ev.key)) {
          ev.preventDefault()
          const focusableDays = Array.from(grid.querySelectorAll('.day.available'))
          const idx = focusableDays.indexOf(day)
          let nextIdx = idx
          if (ev.key === 'ArrowRight') nextIdx = Math.min(focusableDays.length - 1, idx + 1)
          if (ev.key === 'ArrowLeft') nextIdx = Math.max(0, idx - 1)
          if (ev.key === 'ArrowDown') nextIdx = Math.min(focusableDays.length - 1, idx + 7)
          if (ev.key === 'ArrowUp') nextIdx = Math.max(0, idx - 7)
          focusableDays[nextIdx].focus()
        }
      })
      grid.appendChild(day)
    })
    popup.appendChild(grid)
    document.body.appendChild(popup)
    // position near input
    popup.style.left = Math.max(8, rect.left + window.scrollX) + 'px'
    popup.style.top = (rect.bottom + 8 + window.scrollY) + 'px'
    // focus first available day for keyboard users
    setTimeout(() => { const firstDay = popup.querySelector('.day.available'); if (firstDay) firstDay.focus() }, 50)
  }

  // attach to ticketDate input (ticketDate is queried at top)
  if (ticketDate) { ticketDate.addEventListener('focus', (e) => { showCalendarForInput(ticketDate) }); ticketDate.addEventListener('click', (e) => { showCalendarForInput(ticketDate) }) }

  // close calendar on outside click
  document.addEventListener('click', (e) => {
    const cal = document.querySelector('.calendar-popup'); if (!cal) return
    if (e.target.closest('.calendar-popup')) return
    if (e.target === ticketDate) return // keep if clicking the input
    cal.remove()
  })

  concerts.forEach(c => {
    const marker = L.marker(c.coords).addTo(map)
    const popupHtml = `
      <div class="map-popup">
        <strong>${c.city} — ${c.venue}</strong>
        <div class="muted" style="margin:.35rem 0; font-size:.95rem">${c.date}</div>
        <button class="btn btn--small btn--accent map-order" data-city="${c.city}" data-venue="${c.venue}" data-date="${c.date}">Замовити квиток</button>
      </div>`
    marker.bindPopup(popupHtml)
  })

  // Delegate click for popup buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.map-order'); if (!btn) return
    const city = btn.getAttribute('data-city'); const venue = btn.getAttribute('data-venue'); const date = btn.getAttribute('data-date')
    const dlg = document.getElementById('ticketModal'); if (dlg) { if (city) ticketCity.value = city; if (venue) ticketVenue.value = venue; if (date) ticketDate.value = date; openModal(dlg) }
  })
}

// --- Lazy-load Leaflet when the map element becomes visible ---
function loadLeafletAssets () {
  return new Promise((resolve, reject) => {
    if (typeof L !== 'undefined') return resolve()
    // load CSS
    const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = cssHref; l.crossOrigin = ''
      document.head.appendChild(l)
    }
    // load script
    const scriptHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    if (document.querySelector(`script[src="${scriptHref}"]`)) {
      // already present
      const check = setInterval(() => { if (typeof L !== 'undefined') { clearInterval(check); resolve() } }, 50)
      setTimeout(() => { if (typeof L === 'undefined') reject(new Error('Leaflet load timeout')) }, 8000)
      return
    }
    const s = document.createElement('script'); s.src = scriptHref; s.async = true; s.defer = true; s.crossOrigin = ''
    s.onload = () => { resolve() }
    s.onerror = () => { reject(new Error('Leaflet failed to load')) }
    document.head.appendChild(s)
  })
}

function observeAndInitMap () {
  const mapEl = document.getElementById('leafletMap')
  if (!mapEl) return
  // If already loaded and ready, init immediately
  if (typeof L !== 'undefined') { setTimeout(initMap, 150); return }
  // IntersectionObserver to lazy-load when the map scrolls into view
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        observer.disconnect()
        loadLeafletAssets().then(() => { setTimeout(initMap, 120) }).catch(() => { /* ignore */ })
      }
    })
  }, { rootMargin: '300px' })
  io.observe(mapEl)
  // fallback: if user never scrolls, attempt to load after 5s
  setTimeout(() => { if (typeof L === 'undefined') { loadLeafletAssets().then(() => setTimeout(initMap, 120)).catch(() => {}) } }, 5000)
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', observeAndInitMap) } else { observeAndInitMap() }

/* Render mobile-friendly concert cards from the table for small screens */
function renderMobileConcerts () {
  if (window.innerWidth > 640) return // only for small screens
  const table = document.querySelector('.table'); if (!table) return
  // create container if not present
  let wrap = document.querySelector('.mobile-concerts')
  if (!wrap) {
    wrap = document.createElement('div'); wrap.className = 'mobile-concerts container'
    // insert after concerts section header/description
    const concertsSection = document.getElementById('concerts')
    if (concertsSection) { const container = concertsSection.querySelector('.container'); if (container) { container.appendChild(wrap) } }
  }
  // clear existing
  wrap.innerHTML = ''
  const rows = Array.from(table.querySelectorAll('tbody tr'))
  rows.forEach(r => {
    const cols = r.querySelectorAll('td')
    const cityVenue = cols[0]?.textContent?.trim() || ''
    const seats = cols[1]?.textContent?.trim() || ''
    const date = cols[2]?.textContent?.trim() || ''
    const btn = r.querySelector('button')
    const card = document.createElement('div'); card.className = 'concert-card container'
    const meta = document.createElement('div'); meta.className = 'meta'
    const strong = document.createElement('strong'); strong.textContent = cityVenue; meta.appendChild(strong)
    const m2 = document.createElement('div'); m2.className = 'muted'; m2.textContent = `${date} · ${seats} місць`; meta.appendChild(m2)
    const actions = document.createElement('div'); actions.className = 'concert-cta'
    const cta = document.createElement('button'); cta.className = 'btn btn--small btn--accent'; cta.textContent = btn ? btn.textContent.trim() : 'Замовити квиток'
    // copy data-* attributes
    if (btn) { Array.from(btn.attributes).forEach(a => { if (a.name.startsWith('data-')) cta.setAttribute(a.name, a.value) }) }
    actions.appendChild(cta)
    card.appendChild(meta); card.appendChild(actions)
    wrap.appendChild(card)
  })
  // delegate clicks for generated buttons
  wrap.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const sel = b.getAttribute('data-modal-target') || '#ticketModal'; const dlg = document.querySelector(sel); if (dlg) { const city = b.getAttribute('data-city'); const venue = b.getAttribute('data-venue'); const date = b.getAttribute('data-date'); if (city) ticketCity.value = city; if (venue) ticketVenue.value = venue; if (date) ticketDate.value = date; openModal(dlg) } })
}

// quantity controls in modal
document.addEventListener('click', e => {
  const qb = e.target.closest('.qty-btn'); if (!qb) return
  const action = qb.getAttribute('data-action'); const input = qb.parentElement.querySelector('input[type="number"]'); if (!input) return
  let v = parseInt(input.value, 10) || 1
  if (action === 'increase') v = Math.min(v + 1, parseInt(input.max || 10, 10)); else if (action === 'decrease') v = Math.max(v - 1, parseInt(input.min || 1, 10))
  input.value = v
})

window.addEventListener('resize', () => { renderMobileConcerts() })
if (document.readyState !== 'loading') renderMobileConcerts(); else document.addEventListener('DOMContentLoaded', renderMobileConcerts)
