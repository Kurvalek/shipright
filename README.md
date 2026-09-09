# ShipRight

A prototype warehouse order and inventory tool. This is a redesign of a stripped-down v1: same information, rebuilt so the Orders screen tells a picker what to do next instead of handing them one long table in arbitrary order.

## Running it

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## What changed from v1

**Five stage tabs replace the flat pile.** The list is split along the path an order actually takes across the floor, each tab carrying a live count: Needs attention, New / unassigned, Ready to pack, Ready to ship, Completed. The default lands on Needs attention rather than "250 of 250" in no particular order. Needs attention is the only tab that cuts across stages — it collects anything overdue or blocked by stock, the orders that will not move on their own.

**Saved views.** The tabs are structure; saved views are personal. Any stage plus filter combination can be named and kept, and it is still there after a reload — so "New + Rush" is one chip instead of a combination retyped twenty times a day. Two are seeded to make the feature legible on first run.

**Checkboxes and a bulk action bar.** Select rows and a contextual bar rises from the bottom. The move a stage exists to perform is promoted to the primary button and moves that make no sense there are not offered, so a packed order is never invited to be packed again. When only part of a stage is selected the bar offers to take the rest, which is what makes `Ready to ship · 84 → Select all → Mark shipped` three clicks instead of 84 modals.

**Undo on bulk actions.** Moving 84 orders in one click is only comfortable if it is reversible, so every bulk action reports what it did in plain terms and holds an undo open for eight seconds.

**Inline stock and a can-fulfill signal.** A per-row indicator answers whether the order can actually ship: green when every line is covered, amber when filling it drops a SKU to or below its reorder point, red when there is not enough on the shelf. Expanding a row shows each SKU with required against on-hand, its bin, and its own flag. The data already lived on the Inventory screen; this joins it onto the order.

**Visible urgency.** The Ship by column reads as relative urgency rather than a raw timestamp, and the page header states the pressure as a number — how many in this stage are overdue, and how many are due today.

**Inline status advance.** Hovering a row reveals the single most likely next step for that order's state. The modal is now for detail and notes rather than the only way to move an order forward.

## Design system

Four colours carry the product: a warm shell (`#F4F2F0`), a mauve tint (`#E6DEE1`), oxblood (`#661A3A`) for anything actionable, and plum (`#3F2A31`) for text. Everything else is derived from those.

Oxblood appears on primary buttons, the active tab rule, the logo mark and focus rings. Because it sits near red, overdue and at-risk states use **amber** instead, and true red is reserved for out-of-stock and destructive actions — urgency never competes with brand.

The shell runs edge to edge and carries the top bar and the sidebar; the page floats on top of it as a single white pane with a slight lift, so chrome and content are told apart by depth rather than by another border. Search lives once, in the top bar, and each page lends it their own state.

Type is [Narnoor](https://fonts.google.com/specimen/Narnoor) throughout, at four weights. It has no italic, so nothing in the UI leans on one. Identifiers and numeric columns use tabular figures so quantities line up down the column.

All tokens live in `@theme` in [src/index.css](src/index.css).

## Data and persistence

The tenant is Hillside Home Decor, shipping lamps, textiles and tabletop pieces direct to the people who buy them. That framing decides the shape of the data: customers are individuals, and an order is one or two things rather than a pallet, so the pressure on the floor comes from the number of orders and not the size of any one of them.

Mock data only, generated deterministically in [src/lib/orderSeed.ts](src/lib/orderSeed.ts): 250 orders, 50 SKUs, 6 users. Volume is the point — a worker clearing a packed backlog in one action only reads as a win if there really is a backlog.

Every attribute is an exact count rather than a probability, so the numbers on the tabs are a design decision and not a roll of the dice: 84 ready to ship, 52 rush orders sitting unassigned, 14 blocked by an out-of-stock line. Line quantities are clamped against live stock, so whether an order is fulfillable is decided by the generator rather than by a quantity roll happening to exceed a shelf. Ship-by times are anchored to the moment the module loads, so the overdue and due-today sets are always populated.

The split on persistence is deliberate:

- **Order and inventory edits live in React state** and reset on refresh. It is a prototype, and a resettable demo is more useful than a stateful one.
- **View state persists to `localStorage`** — the selected stage, saved views, filters, and Settings tab. Re-picking your stage and re-typing your filters on every reload is exactly the friction this redesign removes, so that part survives.

## Layout

```
src/
  lib/          types, mock data and generator, derived logic (stages, stock join, urgency), store
  components/
    ui/         Button, Pill, Checkbox, Field, Toggle, Card, Modal, Menu, Avatar, EmptyState
    layout/     AppShell, TopBar, Sidebar, PageHeader, Logo
    orders/     stage tabs, saved views, toolbar, table, row, expansion, bulk bar, undo toast, modal
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
