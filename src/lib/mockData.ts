import { generateOrders } from './orderSeed'
import type {
  AccountSettings,
  InventoryItem,
  NotificationSettings,
  Order,
  User,
  WarehouseSettings,
} from './types'

/* Ship-by times are anchored to the moment the module loads rather than to
   fixed calendar dates, so the overdue and due-today sets are always populated
   no matter when the prototype is opened. */

const NOW = new Date()

function hoursAgo(h: number): string {
  return new Date(NOW.getTime() - h * 3_600_000).toISOString()
}

export const users: User[] = [
  { id: 'u-emma', name: 'Emma Davis', email: 'emma.davis@warehouse.com', role: 'admin' },
  { id: 'u-john', name: 'John Smith', email: 'john.smith@warehouse.com', role: 'manager' },
  { id: 'u-bahar', name: 'Bahar Yilmaz', email: 'bahar.yilmaz@warehouse.com', role: 'worker' },
  { id: 'u-mike', name: 'Mike Johnson', email: 'mike.johnson@warehouse.com', role: 'worker' },
  { id: 'u-sarah', name: 'Sarah Williams', email: 'sarah.williams@warehouse.com', role: 'worker' },
  { id: 'u-robert', name: 'Robert Chen', email: 'robert.chen@warehouse.com', role: 'worker' },
]

export const currentUser = users[0]

type ItemSeed = [
  sku: string,
  name: string,
  description: string,
  category: string,
  quantity: number,
  reorderPoint: number,
  location: string,
  updatedHoursAgo: number,
]

const itemSeeds: ItemSeed[] = [
  ['SKU-101', 'Wireless Mouse', 'Bluetooth wireless mouse with ergonomic design', 'Peripherals', 350, 100, 'A1-S2-B3', 6],
  ['SKU-102', 'Ergonomic Keyboard', 'Mechanical keyboard with wrist rest', 'Peripherals', 85, 50, 'A2-S3-B1', 28],
  ['SKU-103', 'Webcam HD', '1080p HD webcam with built-in microphone', 'Peripherals', 28, 40, 'B1-S3-B1', 52],
  ['SKU-104', 'Headset Pro', 'Noise-cancelling headset with boom mic', 'Peripherals', 145, 60, 'E1-S1-B4', 9],
  ['SKU-105', 'USB Hub 7-Port', 'Powered 7-port USB 3.0 hub', 'Peripherals', 210, 75, 'A1-S4-B2', 30],
  ['SKU-106', 'Wireless Trackpad', 'Multi-touch trackpad, rechargeable', 'Peripherals', 64, 40, 'A3-S1-B2', 74],
  ['SKU-107', 'Mechanical Keypad', 'Ten-key numeric keypad, hot-swappable', 'Peripherals', 96, 45, 'A2-S2-B4', 18],
  ['SKU-108', 'Gaming Mouse', 'High-DPI optical sensor, eight buttons', 'Peripherals', 132, 60, 'A1-S3-B1', 44],

  ['SKU-201', 'USB-C Cable', '6ft USB-C to USB-C cable, fast charging', 'Cables', 800, 200, 'B2-S1-B5', 6],
  ['SKU-202', 'HDMI Cable 2m', 'High-speed HDMI 2.1 cable, 2 metre', 'Cables', 420, 150, 'B2-S2-B1', 22],
  ['SKU-203', 'DisplayPort Cable', 'DisplayPort 1.4 cable, 1.8 metre', 'Cables', 265, 100, 'B2-S2-B3', 36],
  ['SKU-204', 'Lightning Cable', '1m Lightning to USB-C, MFi certified', 'Cables', 510, 180, 'B2-S1-B2', 12],
  ['SKU-205', 'Ethernet Cat6 3m', 'Shielded Cat6 patch cable, 3 metre', 'Cables', 0, 60, 'B3-S1-B1', 80],
  ['SKU-206', 'USB-A Extension', '2m USB-A male to female extension', 'Cables', 340, 120, 'B2-S3-B2', 48],
  ['SKU-207', 'Thunderbolt Cable', 'Thunderbolt 4 cable, 0.8 metre', 'Cables', 88, 50, 'B3-S2-B4', 26],

  ['SKU-301', 'Monitor Stand', 'Adjustable height monitor stand with storage', 'Accessories', 45, 30, 'C1-S2-B4', 27],
  ['SKU-302', 'Laptop Stand', 'Aluminium folding laptop riser', 'Accessories', 18, 25, 'C1-S3-B2', 58],
  ['SKU-303', 'Laptop Sleeve', '15" laptop protective sleeve', 'Accessories', 120, 50, 'D1-S1-B2', 8],
  ['SKU-304', 'Cable Organizer', 'Adhesive cable management channel, 6-pack', 'Accessories', 275, 90, 'C2-S1-B1', 34],
  ['SKU-305', 'Docking Station', 'USB-C dock, dual display, 100W passthrough', 'Accessories', 52, 30, 'C3-S1-B3', 15],
  ['SKU-306', 'Screen Cleaner Kit', 'Microfibre cloth and alcohol-free spray', 'Accessories', 190, 70, 'C2-S2-B2', 62],
  ['SKU-307', 'Phone Grip', 'Collapsible phone grip and stand', 'Accessories', 430, 150, 'C2-S3-B1', 40],

  ['SKU-401', 'Desk Lamp LED', 'Adjustable LED desk lamp with USB charging port', 'Office', 62, 25, 'D2-S2-B3', 7],
  ['SKU-402', 'Notebook A5', 'Hardcover dotted notebook, 160 pages', 'Office', 310, 100, 'D2-S1-B1', 50],
  ['SKU-403', 'Whiteboard Markers', 'Dry-erase markers, assorted, 8-pack', 'Office', 240, 80, 'D2-S1-B4', 66],
  ['SKU-404', 'Sticky Notes Pack', '76mm sticky notes, 12 pads', 'Office', 385, 120, 'D2-S3-B2', 20],
  ['SKU-405', 'Desk Mat', 'Felt and cork desk mat, 900x400mm', 'Office', 74, 35, 'D3-S1-B2', 32],
  ['SKU-406', 'Pen Set', 'Rollerball pen set, black, 10-pack', 'Office', 520, 150, 'D2-S2-B1', 70],
  ['SKU-407', 'Paper Ream A4', '80gsm A4 copy paper, 500 sheets', 'Office', 145, 60, 'D3-S2-B3', 11],

  ['SKU-501', 'Shipping Box S', 'Single-wall carton, 200x150x100mm', 'Packaging', 960, 300, 'E2-S1-B1', 5],
  ['SKU-502', 'Shipping Box M', 'Single-wall carton, 350x250x150mm', 'Packaging', 720, 250, 'E2-S1-B2', 5],
  ['SKU-503', 'Shipping Box L', 'Double-wall carton, 500x400x300mm', 'Packaging', 405, 200, 'E2-S1-B3', 16],
  ['SKU-504', 'Packing Tape', '48mm clear packing tape, 66m roll', 'Packaging', 45, 80, 'E2-S2-B1', 3],
  ['SKU-505', 'Bubble Wrap Roll', 'Small-bubble roll, 500mm x 50m', 'Packaging', 130, 60, 'E3-S1-B1', 24],
  ['SKU-506', 'Void Fill Paper', 'Kraft void fill, 400mm x 250m', 'Packaging', 88, 40, 'E3-S1-B2', 38],
  ['SKU-507', 'Poly Mailer M', 'Opaque poly mailer, 300x400mm', 'Packaging', 640, 200, 'E2-S3-B2', 13],
  ['SKU-508', 'Shipping Label Roll', 'Thermal labels 100x150mm, 500 per roll', 'Packaging', 215, 90, 'E2-S2-B4', 4],

  ['SKU-601', 'Safety Gloves', 'Cut-resistant gloves, level 3, size L', 'Safety', 12, 30, 'F1-S1-B1', 46],
  ['SKU-602', 'Hi-Vis Vest', 'Class 2 reflective vest, one size', 'Safety', 68, 25, 'F1-S1-B2', 56],
  ['SKU-603', 'Safety Goggles', 'Anti-fog polycarbonate goggles', 'Safety', 94, 40, 'F1-S2-B1', 68],
  ['SKU-604', 'First Aid Kit', 'Workplace first aid kit, 50 person', 'Safety', 22, 10, 'F1-S2-B3', 90],
  ['SKU-605', 'Ear Protection', 'Over-ear defenders, 30dB SNR', 'Safety', 57, 25, 'F1-S3-B2', 78],

  ['SKU-701', 'Box Cutter', 'Retractable safety knife with spare blades', 'Tools', 165, 60, 'G1-S1-B1', 21],
  ['SKU-702', 'Pallet Wrap', 'Stretch wrap, 500mm x 300m', 'Tools', 0, 20, 'G1-S2-B1', 2],
  ['SKU-703', 'Label Printer', 'Thermal label printer, USB and network', 'Tools', 14, 6, 'G2-S1-B2', 100],
  ['SKU-704', 'Barcode Scanner', 'Wireless 2D barcode scanner with cradle', 'Tools', 31, 12, 'G2-S1-B3', 42],
  ['SKU-705', 'Tape Dispenser', 'Heavy-duty pistol grip tape gun', 'Tools', 78, 30, 'G1-S1-B4', 64],

  ['SKU-801', 'Storage Bin M', 'Stackable tote, 600x400x220mm', 'Storage', 260, 80, 'H1-S1-B1', 33],
  ['SKU-802', 'Shelf Divider', 'Steel shelf divider, 400mm', 'Storage', 175, 60, 'H1-S2-B2', 72],
  ['SKU-803', 'Pallet Rack Beam', 'Galvanised beam, 2700mm, 1500kg pair', 'Storage', 40, 15, 'H2-S1-B1', 86],
]

export const inventory: InventoryItem[] = itemSeeds.map(
  ([sku, name, description, category, quantity, reorderPoint, location, updatedHoursAgo]) => ({
    sku,
    name,
    description,
    category,
    quantity,
    reorderPoint,
    location,
    updatedAt: hoursAgo(updatedHoursAgo),
  }),
)

export const orders: Order[] = generateOrders(NOW, inventory)

export const accountSettings: AccountSettings = {
  companyName: 'Warehouse Management Co.',
  billingEmail: 'billing@warehouse.com',
  tier: 'Professional',
}

export const warehouseSettings: WarehouseSettings = {
  name: 'Main Warehouse - Building A',
  address: '1234 Industrial Blvd, City, ST 12345',
  locations: [
    { code: 'A1-S2-B3', kind: 'bin' },
    { code: 'B2-S1-B5', kind: 'bin' },
    { code: 'A2-S3-B1', kind: 'bin' },
    { code: 'C1-S2-B4', kind: 'bin' },
    { code: 'D1-S1-B2', kind: 'bin' },
    { code: 'E2-S1-B1', kind: 'bin' },
    { code: 'F1-S1-B1', kind: 'bin' },
    { code: 'G1-S2-B1', kind: 'bin' },
    { code: 'Zone A', kind: 'zone' },
    { code: 'Zone B', kind: 'zone' },
    { code: 'Zone C', kind: 'zone' },
  ],
}

export const notificationSettings: NotificationSettings = {
  email: true,
  lowStock: true,
  orderUpdates: true,
  systemAlerts: false,
}

export const subscriptionFeatures = [
  'Unlimited orders per month',
  'Up to 10 team members',
  'Advanced notifications and alerts',
  'Priority customer support',
]
