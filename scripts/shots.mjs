/* Drives headless Chrome over the DevTools Protocol to capture the prototype's
   key screens and interaction states. Development aid, not part of the app.

   Usage: node scripts/shots.mjs [baseUrl] [outDir] */
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.argv[2] ?? 'http://localhost:5185'
const OUT = process.argv[3] ?? '/tmp/sr-shots'
// A per-run port, so a leftover browser from an earlier run can never be
// mistaken for this one.
const PORT = 9400 + (process.pid % 400)
const VIEWPORT = { width: 1560, height: 1000 }

mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// A unique profile per run guarantees a cold cache and empty localStorage,
// rather than silently attaching to a stale instance.
const PROFILE = `/tmp/sr-chrome-${Date.now()}`

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
  'about:blank',
])
chrome.stderr.on('data', () => {})

async function findTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = await res.json()
      const page = targets.find((t) => t.type === 'page')
      if (page) return page
    } catch {
      // Chrome has not opened the port yet.
    }
    await sleep(250)
  }
  throw new Error('Chrome DevTools endpoint never came up')
}

const target = await findTarget()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  const resolver = pending.get(msg.id)
  if (!resolver) return
  pending.delete(msg.id)
  if (msg.error) resolver.reject(new Error(JSON.stringify(msg.error)))
  else resolver.resolve(msg.result)
})

function send(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'evaluate failed')
  }
  return result.result.value
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  ...VIEWPORT,
  deviceScaleFactor: 2,
  mobile: false,
})

async function goto(path) {
  const url = `${BASE}${path}`
  await send('Page.navigate', { url })
  await sleep(900)
  // Wait for webfonts so headings never capture mid-swap.
  await evaluate('document.fonts.ready.then(() => true)')
  await sleep(250)

  // A silent failure here shows up much later as an inexplicable SecurityError
  // on localStorage, so check the document actually arrived.
  const href = await evaluate('location.href')
  if (!href.startsWith(BASE)) throw new Error(`navigation failed: at ${href}, wanted ${url}`)
}

async function capture(name, fullPage = false) {
  const args = { format: 'png' }
  if (fullPage) args.captureBeyondViewport = true
  const { data } = await send('Page.captureScreenshot', args)
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
  console.log(`captured ${name}`)
}

/* Clicks the first matching element, optionally scoped to a container. Rows
   carry the same action labels as the bulk bar, so an unscoped click on
   "Mark shipped" hits row one instead of the whole selection. */
async function clickText(selector, text, within = null) {
  const ok = await evaluate(`(() => {
    const root = ${within ? `document.querySelector(${JSON.stringify(within)})` : 'document'};
    if (!root) return false;
    const el = [...root.querySelectorAll(${JSON.stringify(selector)})]
      .find(n => n.textContent.trim().startsWith(${JSON.stringify(text)}));
    if (!el) return false;
    el.click();
    return true;
  })()`)
  if (!ok) throw new Error(`no ${selector} matching "${text}"${within ? ` within ${within}` : ''}`)
  await sleep(400)
}

const BULK_BAR = '[aria-label="Bulk actions"]'

async function setView(key, value) {
  await evaluate(
    `localStorage.setItem('shipright:${key}', ${JSON.stringify(JSON.stringify(value))})`,
  )
}

const NO_FILTERS = { search: '', status: '', priority: '', assignee: '' }

/** Ticks the table's header checkbox, which takes every row in the stage. */
async function selectAll() {
  const ok = await evaluate(`(() => {
    const box = document.querySelector('thead [role=checkbox]');
    if (!box) return false;
    box.click();
    return true;
  })()`)
  if (!ok) throw new Error('no header checkbox')
  await sleep(400)
}

// --- Orders, the default stage -------------------------------------------
await goto('/orders')
await setView('orders.lane', 'needs_attention')
await setView('orders.filters', NO_FILTERS)
await goto('/orders')
await capture('01-orders-needs-attention')

// --- A row expanded to show SKU-level stock ------------------------------
await clickText('td', 'ORD-')
await capture('02-orders-row-expanded')

/* Scenario one: clear the packed backlog in a single action. */
await goto('/orders')
await clickText('[role=tab]', 'Ready to ship')
await capture('03-ready-to-ship')

await selectAll()
await capture('04-ready-to-ship-all-selected')

await clickText('button', 'Mark shipped', BULK_BAR)
await capture('05-ready-to-ship-shipped-with-undo')

/* Scenario two: hand 52 rush orders to one worker in one action. */
await goto('/orders')
await setView('orders.lane', 'new_unassigned')
await setView('orders.filters', { ...NO_FILTERS, priority: 'rush' })
await goto('/orders')
await capture('06-new-unassigned-rush')

await selectAll()
await clickText('button', 'Assign to', BULK_BAR)
await capture('07-new-rush-assign-menu')

await clickText('[role=menuitem]', 'Bahar')
await capture('08-new-rush-assigned')

// --- Order details panel -------------------------------------------------
await goto('/orders')
await setView('orders.lane', 'ready_to_pack')
await setView('orders.filters', NO_FILTERS)
await goto('/orders')
await clickText('button', 'View')
await capture('09-order-details')

/* The next step is a named button, so advancing one order does not depend on
   working out that the timeline circles are clickable. */
await clickText('button', 'Mark as packed')
await capture('09b-order-details-advanced')

// The end of the flow has no next step left to offer.
await goto('/orders')
await setView('orders.lane', 'completed')
await setView('orders.filters', { ...NO_FILTERS, status: 'completed' })
await goto('/orders')
await clickText('button', 'View')
await capture('09c-order-details-closed-out')

// --- Inventory -----------------------------------------------------------
await goto('/inventory')
await capture('10-inventory')

// --- Settings ------------------------------------------------------------
for (const tab of ['account', 'users', 'warehouse', 'notifications']) {
  await goto('/settings')
  await setView('settings.tab', tab)
  await goto('/settings')
  await capture(`11-settings-${tab}`)
}

ws.close()
chrome.kill()
try {
  // Chrome may still be flushing the profile as it exits.
  rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
} catch {
  console.log(`left profile behind at ${PROFILE}`)
}
console.log('done')
