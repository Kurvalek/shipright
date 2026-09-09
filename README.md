# ShipRight

A prototype warehouse order and inventory tool. This is a redesign of a stripped-down v1: same information, rebuilt so the Orders screen tells a picker what to do next instead of handing them fifty rows in arbitrary order.

## Running it

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## What changed from v1

The Orders screen carries four moves, layered onto the original layout so it still reads as ShipRight.

**Prioritized lanes replace the flat pile.** A row of saved views across the top of the list, each with a live count: Ship today, Overdue / at risk, Unassigned, In progress, Ready to ship, All orders. The default lands on the most urgent actionable set rather than "50 of 50" in no particular order. Ship today and Overdue overlap on purpose: the first is the whole day's workload, the second is the subset that has already slipped and needs a decision.

**Checkboxes and a bulk action bar.** Select rows and a contextual bar rises from the bottom with Mark packed, Mark shipped, Complete and Assign to. One action clears a whole backlog instead of opening one modal per order. v1 had no multi-select at all.

**Inline stock and a can-fulfill signal.** A per-row indicator answers whether the order can actually ship: green when every line is covered, amber when filling it drops a SKU to or below its reorder point, red when there is not enough on the shelf. Expanding a row shows each SKU with required against on-hand, its bin, and its own flag. The data already lived on the Inventory screen; this joins it onto the order.

**Inline status advance.** Hovering a row reveals the single most likely next step for that order's state, and the bulk bar does the same for a selection. The modal is now for detail and notes rather than the only way to move an order forward.

Smaller changes throughout: raw timestamps became relative urgency labels, Unassigned became an empty slot that reads as an action instead of italic grey text, Rush got its own amber treatment so it separates from Standard and Bulk, and every lane has a written empty state that distinguishes "this lane is genuinely clear" from "your filters matched nothing".

## Design system

Three references set the direction: warm light-neutral chrome, hairline borders rather than shadows, a serif display face against a clean sans, small uppercase tracked micro-labels, pale-tinted semantic pills, and exactly one saturated colour appearing roughly once per view.

The brand colour is oxblood (`#7C2D40`). It shows up on the active lane chip, primary buttons, the logo mark, "on" toggles and focus rings. Nowhere else. Because oxblood sits near red, overdue and at-risk states use **amber** instead, and true red is reserved for out-of-stock and destructive actions. That keeps urgency from competing with brand.

Type is `Instrument Serif` for page titles and large values, `Inter` for UI, and `JetBrains Mono` for order IDs, SKUs and bin codes. Numeric columns use tabular figures so quantities line up down the column.

All tokens live in `@theme` in [src/index.css](src/index.css).

## Data and persistence

Mock data only, seeded deterministically in [src/lib/mockData.ts](src/lib/mockData.ts): 50 orders, 50 SKUs, 5 users. Due dates are anchored to the moment the module loads rather than to fixed calendar dates, so Ship today and Overdue are always populated and the day's workload spreads across whatever is left of the shift.

The split on persistence is deliberate:

- **Order and inventory edits live in React state** and reset on refresh. It is a prototype, and a resettable demo is more useful than a stateful one.
- **View state persists to `localStorage`** — the selected lane, search text, filters, and Settings tab. Re-picking your lane and re-typing your filters on every reload is exactly the friction the lanes are meant to remove, so that part survives.

## Layout

```
src/
  lib/          types, mock data, derived logic (lanes, stock join, due labels), store
  components/
    ui/         Button, Pill, Checkbox, Field, Toggle, Card, Modal, Menu, Avatar, EmptyState
    layout/     AppShell, Sidebar, PageHeader, Logo
    orders/     lane tabs, toolbar, table, row, expansion, bulk bar, status timeline, modal
    inventory/  stat cards, edit modal
    settings/   the four tab panels
  pages/        Orders, Inventory, Settings
scripts/
  shots.mjs     drives headless Chrome to capture every screen and state
```

`scripts/shots.mjs` is a development aid, not part of the app:

```bash
node scripts/shots.mjs http://localhost:5173 ./shots
```
