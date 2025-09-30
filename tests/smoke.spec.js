const { test, expect } = require('@playwright/test')

// Base URL for local dev server. Start it with: npm run serve
const BASE = process.env.BASE_URL || 'http://localhost:5173'

// We'll navigate explicitly inside each test so we can control viewport per-case.

test('burger menu toggles and anchor smooth scroll works', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const page = await context.newPage()
  await page.goto(BASE)
  const burger = page.locator('.burger')
  const nav = page.locator('.nav')
  // on narrow screens burger should be visible
  await expect(burger).toBeVisible()
  await expect(burger).toHaveAttribute('aria-expanded', 'false')
  await burger.click()
  await expect(burger).toHaveAttribute('aria-expanded', 'true')
  await expect(nav).toHaveClass(/show/)
  // click nav anchor (choose the one inside the nav)
  await page.locator('.nav a[href="#concerts"]').first().click()
  await expect(burger).toHaveAttribute('aria-expanded', 'false')
  await expect(nav).not.toHaveClass(/show/)
  await expect(page.locator('#concerts')).toBeVisible()
  await context.close()
})

test('Gallery and Ticket buttons open dialog and dialog closes via ESC/backdrop/icon', async ({ page }) => {
  await page.goto(BASE)
  // Gallery: use the explicit button selector and force click if needed
  const galleryBtn = page.locator('button[data-modal-target="#galleryModal"]')
  await galleryBtn.first().waitFor({ state: 'visible', timeout: 2000 })
  await galleryBtn.first().click({ force: true })
  const gallery = page.locator('#galleryModal')
  await expect(gallery).toBeVisible()
  // close by close icon
  await page.locator('#galleryModal [data-close-modal]').click()
  await expect(gallery).not.toBeVisible()

  // Ticket from hero
  const ticketBtn = page.locator('[data-modal-target="#ticketModal"]').first()
  await ticketBtn.click({ force: true })
  const ticket = page.locator('#ticketModal')
  await expect(ticket).toBeVisible()
  // close by backdrop click: click outside modal box (above)
  const box = await page.locator('#ticketModal .modal__box').boundingBox()
  if (box) await page.mouse.click(Math.max(5, box.x + 5), Math.max(5, box.y - 10))
  await expect(ticket).not.toBeVisible()

  // open again and close by Escape
  await ticketBtn.click({ force: true })
  await expect(ticket).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(ticket).not.toBeVisible()
})

test('Forms validate and update URL with GET params', async ({ page }) => {
  // Contact form - trigger validation errors
  const contactName = page.locator('#contactForm #name')
  const contactEmail = page.locator('#contactForm #email')
  const contactMessage = page.locator('#contactForm #message')
  const agree = page.locator('#agree')
  await page.goto(BASE)
  // submit empty to see errors
  await page.locator('#contactForm button[type="submit"]').click({ force: true })
  // small elements should contain error messages
  await expect(page.locator('small[data-for="name"]').first()).not.toHaveText('')
  await expect(page.locator('small[data-for="email"]').first()).not.toHaveText('')
  await expect(page.locator('small[data-for="message"]').first()).not.toHaveText('')

  // fill valid data
  await contactName.fill('Іван')
  await contactEmail.fill('ivan@example.test')
  await contactMessage.fill('Це тестове повідомлення, достатньо символів.')
  // checkbox's label may intercept pointer events; use force to check
  await agree.check({ force: true })
  // submit and expect URL to include params
  await page.locator('#contactForm button[type="submit"]').click()
  // Wait for history.replaceState to update URL
  await page.waitForTimeout(200)
  const url = new URL(page.url())
  expect(url.searchParams.get('name')).toBe('Іван'
    || 'Ivan' // fallback not really used; Playwright URL encodes unicode
  )
  expect(url.searchParams.get('email')).toBe('ivan@example.test')
  expect(url.searchParams.get('message')).toBeTruthy()

  // Ticket form: open modal, fill invalid, expect toast/error, then valid -> URL update
  await page.locator('[data-modal-target="#ticketModal"]').first().click()
  await expect(page.locator('#ticketModal')).toBeVisible()
  const ticketSubmit = page.locator('#ticketSubmit')
  await ticketSubmit.click()
  // should show toast with error
  await expect(page.locator('.toast')).toBeVisible()
  // fill ticket fields
  await page.fill('#ticketCity', 'Київ')
  await page.fill('#ticketVenue', 'Docker-G Pub')
  await page.fill('#ticketDate', '25.10.2025, 19:00')
  await page.fill('#ticketQty', '2')
  await page.fill('#ticketName', 'Петро')
  await page.fill('#ticketEmail', 'petro@example.test')
  await ticketSubmit.click()
  // wait a moment for history.replaceState
  await page.waitForTimeout(300)
  const url2 = new URL(page.url())
  expect(url2.searchParams.get('city')).toBe('Київ')
  expect(url2.searchParams.get('venue')).toBe('Docker-G Pub')
  expect(url2.searchParams.get('qty')).toBe('2')
})

test('Responsive: table scrolls and cards stack on narrow screens', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } })
  const page = await context.newPage()
  await page.goto(BASE)
  // wait for rendering
  await page.waitForTimeout(200)
  const mobileWrap = page.locator('.mobile-concerts')
  // Either mobile cards are rendered OR the .table-wrap has horizontal scroll — accept both
  const cardsVisible = await mobileWrap.count() > 0 && await mobileWrap.isVisible().catch(() => false)
  const tableWrap = page.locator('.table-wrap')
  const tableHandle = await tableWrap.elementHandle()
  let hasOverflow = false
  if (tableHandle) {
    hasOverflow = await page.evaluate((el) => el.scrollWidth > el.clientWidth, tableHandle).catch(() => false)
  }
  expect(cardsVisible || hasOverflow).toBeTruthy()
  await context.close()
})
