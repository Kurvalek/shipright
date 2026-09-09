/* Drives headless Chrome over the DevTools Protocol to capture the prototype's
   key screens and interaction states. Development aid, not part of the app.

   Usage: node scripts/shots.mjs [baseUrl] [outDir] */
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.argv[2] ?? 'http://localhost:5185'
const OUT = process.argv[3] ?? '/tmp/sr-shots'
const PORT = 9333
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
  await send('Page.navigate', { url: `${BASE}${path}` })
  await sleep(900)
  // Wait for webfonts so serif headings never capture mid-swap.
  await evaluate('document.fonts.ready.then(() => true)')
  await sleep(250)
}

async function capture(name, fullPage = false) {
  const args = { format: 'png' }
  if (fullPage) args.captureBeyondViewport = true
  const { data } = await send('Page.captureScreenshot', args)
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
  console.log(`captured ${name}`)
}

/** Clicks the first element whose text content matches, via the DOM. */
async function clickText(selector, text) {
  const ok = await evaluate(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find(n => n.textContent.trim().startsWith(${JSON.stringify(text)}));
    if (!el) return false;
    el.click();
    return true;
  })()`)
  if (!ok) throw new Error(`no ${selector} matching "${text}"`)
  await sleep(400)
}

async function setView(key, value) {
  await evaluate(
    `localStorage.setItem('shipright:${key}', ${JSON.stringify(JSON.stringify(value))})`,
  )
}

// --- Orders, default lane -------------------------------------------------
await goto('/orders')
await setView('orders.lane', 'ship_today')
await goto('/orders')
await capture('01-orders-ship-today')

// --- Orders, a row expanded to show SKU-level stock ----------------------
await clickText('td', 'ORD-')
await capture('02-orders-row-expanded')

// --- Orders, multi-select with the bulk bar up ---------------------------
await goto('/orders')
await evaluate(`(() => {
  const boxes = [...document.querySelectorAll('tbody [role=checkbox]')];
  boxes.slice(0, 4).forEach(b => b.click());
})()`)
await sleep(400)
await capture('03-orders-bulk-selected')

// --- Orders, the at-risk lane -------------------------------------------
await goto('/orders')
await clickText('[role=tab]', 'Overdue')
await capture('04-orders-at-risk')

// --- Orders, an empty lane ----------------------------------------------
await goto('/orders')
await evaluate(`(() => {
  const input = document.querySelector('input[aria-label="Search orders"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'zzzzz');
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`)
await sleep(500)
await capture('05-orders-empty')

// --- Order details modal -------------------------------------------------
// Filters persist by design, so the empty-state search above has to be
// cleared before the remaining captures.
await setView('orders.filters', { search: '', status: '', priority: '', assignee: '' })
await goto('/orders')
await clickText('button', 'View')
await capture('06-order-details')

// --- Inventory -----------------------------------------------------------
await goto('/inventory')
await capture('07-inventory')

// --- Edit inventory item -------------------------------------------------
await evaluate(`(() => {
  const row = document.querySelector('tbody tr');
  row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  [...row.querySelectorAll('button')].find(b => b.textContent.includes('Edit'))?.click();
})()`)
await sleep(500)
await capture('08-inventory-edit')

// --- Settings, all four tabs --------------------------------------------
for (const tab of ['account', 'users', 'warehouse', 'notifications']) {
  await goto('/settings')
  await setView('settings.tab', tab)
  await goto('/settings')
  await capture(`09-settings-${tab}`)
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
