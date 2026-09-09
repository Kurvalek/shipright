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
  { id: 'u-emma', name: 'Emma Davis', email: 'emma.davis@hillsidehome.com', role: 'admin' },
  { id: 'u-john', name: 'John Smith', email: 'john.smith@hillsidehome.com', role: 'manager' },
  { id: 'u-bahar', name: 'Bahar Yilmaz', email: 'bahar.yilmaz@hillsidehome.com', role: 'worker' },
  { id: 'u-mike', name: 'Mike Johnson', email: 'mike.johnson@hillsidehome.com', role: 'worker' },
  { id: 'u-sarah', name: 'Sarah Williams', email: 'sarah.williams@hillsidehome.com', role: 'worker' },
  { id: 'u-robert', name: 'Robert Chen', email: 'robert.chen@hillsidehome.com', role: 'worker' },
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
  ['SKU-101', 'Ceramic Table Lamp', 'Matte glaze base with a linen drum shade', 'Lighting', 350, 100, 'A1-S2-B3', 6],
  ['SKU-102', 'Arc Floor Lamp', 'Brushed brass arc with a marble foot', 'Lighting', 85, 50, 'A2-S3-B1', 28],
  ['SKU-103', 'Rattan Pendant Shade', 'Hand-woven rattan, 400mm diameter', 'Lighting', 28, 40, 'B1-S3-B1', 52],
  ['SKU-104', 'Wall Sconce Pair', 'Frosted glass globe, plug-in, set of two', 'Lighting', 145, 60, 'E1-S1-B4', 9],
  ['SKU-105', 'Festoon String Lights', 'Warm white, 10 metre, indoor and outdoor', 'Lighting', 210, 75, 'A1-S4-B2', 30],
  ['SKU-106', 'Pleated Lamp Shade', 'Ivory cotton pleat, fits E27 base', 'Lighting', 64, 40, 'A3-S1-B2', 74],
  ['SKU-107', 'Picture Light', 'Slim LED picture light, antique brass', 'Lighting', 96, 45, 'A2-S2-B4', 18],
  ['SKU-108', 'Glass Hurricane Lantern', 'Clear glass with a blackened metal frame', 'Lighting', 132, 60, 'A1-S3-B1', 44],

  ['SKU-201', 'Pillar Candle Set', 'Unscented ivory pillars, set of three', 'Candles & Scent', 800, 200, 'B2-S1-B5', 6],
  ['SKU-202', 'Taper Candles', 'Hand-dipped tapers, 25cm, pack of twelve', 'Candles & Scent', 420, 150, 'B2-S2-B1', 22],
  ['SKU-203', 'Tealights Box', 'Four-hour tealights, box of fifty', 'Candles & Scent', 265, 100, 'B2-S2-B3', 36],
  ['SKU-204', 'Reed Diffuser', 'Fig and cedar, 200ml with rattan reeds', 'Candles & Scent', 510, 180, 'B2-S1-B2', 12],
  ['SKU-205', 'Large Scented Candle', 'Three-wick soy candle, amber glass, 500g', 'Candles & Scent', 0, 60, 'B3-S1-B1', 80],
  ['SKU-206', 'Wax Melt Selection', 'Six seasonal scents in a gift box', 'Candles & Scent', 340, 120, 'B2-S3-B2', 48],
  ['SKU-207', 'Match Cloche', 'Glass cloche with 100 colour-tipped matches', 'Candles & Scent', 88, 50, 'B3-S2-B4', 26],

  ['SKU-301', 'Round Wall Mirror', 'Thin brass frame, 600mm diameter', 'Wall Decor', 45, 30, 'C1-S2-B4', 27],
  ['SKU-302', 'Arched Floor Mirror', 'Full length arch, oak frame, 1600mm', 'Wall Decor', 18, 25, 'C1-S3-B2', 58],
  ['SKU-303', 'Framed Botanical Print', 'Giclee print in an oak frame, A2', 'Wall Decor', 120, 50, 'D1-S1-B2', 8],
  ['SKU-304', 'Gallery Frame Set', 'Nine frames in mixed sizes, black', 'Wall Decor', 275, 90, 'C2-S1-B1', 34],
  ['SKU-305', 'Floating Wall Shelf', 'Solid oak, 800mm, concealed fixings', 'Wall Decor', 52, 30, 'C3-S1-B3', 15],
  ['SKU-306', 'Silent Wall Clock', 'Sweep movement, 300mm, warm white face', 'Wall Decor', 190, 70, 'C2-S2-B2', 62],
  ['SKU-307', 'Brass Wall Hooks', 'Solid brass hooks, set of four', 'Wall Decor', 430, 150, 'C2-S3-B1', 40],

  ['SKU-401', 'Fluted Ceramic Vase', 'Speckled stoneware, 280mm tall', 'Tabletop', 62, 25, 'D2-S2-B3', 7],
  ['SKU-402', 'Stoneware Serving Bowl', 'Reactive glaze, 300mm, dishwasher safe', 'Tabletop', 310, 100, 'D2-S1-B1', 50],
  ['SKU-403', 'Marble Candle Holder', 'Carrara marble, fits taper candles', 'Tabletop', 240, 80, 'D2-S1-B4', 66],
  ['SKU-404', 'Cork Coaster Set', 'Natural cork with a brass inlay, set of six', 'Tabletop', 385, 120, 'D2-S3-B2', 20],
  ['SKU-405', 'Mango Wood Tray', 'Round serving tray with cut-out handles', 'Tabletop', 74, 35, 'D3-S1-B2', 32],
  ['SKU-406', 'Linen Napkin Set', 'Stonewashed linen, set of four', 'Tabletop', 520, 150, 'D2-S2-B1', 70],
  ['SKU-407', 'Table Runner', 'Hand-loomed cotton, 2 metre, sand', 'Tabletop', 145, 60, 'D3-S2-B3', 11],

  ['SKU-501', 'Throw Pillow Cover', 'Boucle cover, 450mm square, hidden zip', 'Textiles', 960, 300, 'E2-S1-B1', 5],
  ['SKU-502', 'Lambswool Throw', 'Herringbone weave, 130x180cm', 'Textiles', 720, 250, 'E2-S1-B2', 5],
  ['SKU-503', 'Linen Curtain Pair', 'Pencil pleat, 140x230cm, oatmeal', 'Textiles', 405, 200, 'E2-S1-B3', 16],
  ['SKU-504', 'Wool Area Rug', 'Hand-tufted, 150x240cm, natural', 'Textiles', 45, 80, 'E2-S2-B1', 3],
  ['SKU-505', 'Turkish Towel Set', 'Stonewashed cotton, bath and hand pair', 'Textiles', 130, 60, 'E3-S1-B1', 24],
  ['SKU-506', 'Chunky Knit Blanket', 'Merino blend, 120x150cm, oat', 'Textiles', 88, 40, 'E3-S1-B2', 38],
  ['SKU-507', 'Sheepskin Rug', 'Single pelt, ethically sourced, ivory', 'Textiles', 640, 200, 'E2-S3-B2', 13],
  ['SKU-508', 'Floor Cushion', 'Cotton canvas pouffe, 600mm, terracotta', 'Textiles', 215, 90, 'E2-S2-B4', 4],

  ['SKU-601', 'Boucle Accent Chair', 'Curved back, solid beech legs', 'Furniture', 12, 30, 'F1-S1-B1', 46],
  ['SKU-602', 'Travertine Side Table', 'Round top, 450mm, natural travertine', 'Furniture', 68, 25, 'F1-S1-B2', 56],
  ['SKU-603', 'Oak Console Table', 'Two drawers, 1200mm, white oak', 'Furniture', 94, 40, 'F1-S2-B1', 68],
  ['SKU-604', 'Rattan Bar Stool', 'Woven seat, 650mm, black frame', 'Furniture', 22, 10, 'F1-S2-B3', 90],
  ['SKU-605', 'Storage Ottoman', 'Upholstered lid, linen, 900mm', 'Furniture', 57, 25, 'F1-S3-B2', 78],

  ['SKU-701', 'Terracotta Planter', 'Hand-thrown, 350mm, with saucer', 'Outdoor', 165, 60, 'G1-S1-B1', 21],
  ['SKU-702', 'Hanging Planter', 'Glazed stoneware with a cotton rope hanger', 'Outdoor', 0, 20, 'G1-S2-B1', 2],
  ['SKU-703', 'Garden Lantern', 'Powder-coated steel, 600mm, candle', 'Outdoor', 14, 6, 'G2-S1-B2', 100],
  ['SKU-704', 'Coir Doormat', 'Natural coir with a rubber backing', 'Outdoor', 31, 12, 'G2-S1-B3', 42],
  ['SKU-705', 'Outdoor Cushion Pair', 'Water-resistant canvas, set of two', 'Outdoor', 78, 30, 'G1-S1-B4', 64],

  ['SKU-801', 'Woven Seagrass Basket', 'Handled basket, 400mm, natural', 'Storage', 260, 80, 'H1-S1-B1', 33],
  ['SKU-802', 'Rattan Storage Box', 'Lidded box, 350x250mm', 'Storage', 175, 60, 'H1-S2-B2', 72],
  ['SKU-803', 'Magazine Rack', 'Bent plywood rack, walnut veneer', 'Storage', 40, 15, 'H2-S1-B1', 86],
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
  companyName: 'Hillside Home Decor',
  billingEmail: 'billing@hillsidehome.com',
  tier: 'Professional',
}

export const warehouseSettings: WarehouseSettings = {
  name: 'Hillside Fulfillment Center',
  address: '4820 Canyon Ridge Road, Asheville, NC 28806',
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
