/* Coconut Coir E-Commerce — Product data + helpers (placeholder content). */

export const BRAND = {
  name: "Coconut Coir Co.",
  tagline: "Premium sustainable growing media & soil conditioners.",
  /** Site header logo: path relative to your HTML files (put the file in `images/`). Example: `"images/logo.svg"`. Leave empty to show the “CC” mark. */
  logo: "",
};

export const CATEGORIES = [
  "All",
  "Grow Bags",
  "Coir Blocks",
  "Mulch & Mats",
  "Hydroponics",
  "Accessories",
];

/**
 * Generates a lightweight SVG data URI for product imagery.
 * Avoids heavy assets while still looking “designed”.
 */
export function productImageDataUri(seedText = "coir") {
  const safe = encodeURIComponent(seedText);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff3a00" stop-opacity=".95"/>
        <stop offset=".55" stop-color="#ff9b00" stop-opacity=".9"/>
        <stop offset="1" stop-color="#ff005c" stop-opacity=".82"/>
      </linearGradient>
      <radialGradient id="r" cx="35%" cy="25%" r="70%">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".12"/>
        <stop offset=".7" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>
    <rect width="1200" height="900" fill="#0b0d14"/>
    <rect x="-120" y="-120" width="1440" height="1140" fill="url(#g)" opacity=".25"/>
    <circle cx="330" cy="240" r="220" fill="url(#r)"/>
    <g opacity=".85">
      <path d="M130,660 C260,560 430,560 560,660 C690,760 860,760 990,660" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="18" stroke-linecap="round"/>
      <path d="M190,720 C320,620 470,620 600,720 C730,820 880,820 1010,720" fill="none" stroke="#ffffff" stroke-opacity=".10" stroke-width="14" stroke-linecap="round"/>
    </g>
    <g filter="url(#soft)">
      <circle cx="940" cy="170" r="160" fill="#ff3a00" opacity=".22"/>
      <circle cx="860" cy="210" r="190" fill="#ff005c" opacity=".12"/>
    </g>
    <text x="84" y="112" font-family="ui-sans-serif, system-ui" font-size="30" fill="#ffffff" fill-opacity=".78" letter-spacing=".08em">${safe}</text>
    <text x="84" y="156" font-family="ui-sans-serif, system-ui" font-size="16" fill="#ffffff" fill-opacity=".58" letter-spacing=".12em">COCONUT COIR PRODUCT VISUAL</text>
    <rect x="84" y="190" width="140" height="6" rx="3" fill="#ffffff" fill-opacity=".18"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Image URL for storefront, cart, and product pages. If a product has `image`, use that file
 * (path is relative to your HTML pages, e.g. `images/cc-001.jpg`). Otherwise use the SVG placeholder.
 */
export function productImageSrc(product) {
  if (product && typeof product.image === "string" && product.image.trim()) {
    return product.image.trim();
  }
  return productImageDataUri(product?.imageSeed ?? "coir");
}

/** Optional per-product field: `image: "images/your-file.jpg"` — see `productImageSrc`. */
export const PRODUCTS = [
  {
    id: "cc-001",
    name: "Coir Grow Bag — 10L",
    price: 199,
    category: "Grow Bags",
    tags: ["High porosity", "Clean rinse", "Beginner-friendly"],
    short: "Ready-to-use coir grow bag for vegetables and ornamentals.",
    details:
      "A premium washed and buffered coco coir grow bag designed for balanced air-to-water ratio. Excellent for tomatoes, peppers, and herbs. Works great with drip irrigation.",
    specs: [
      ["Volume", "10 liters"],
      ["EC", "Low (washed)"],
      ["Use", "Vegetables, herbs"],
      ["Reuse", "Up to 2 cycles (typical)"],
    ],
    imageSeed: "Grow Bag 10L",
    image: "images/products/coir1.png"
  },
  {
    id: "cc-002",
    name: "Coir Block — 5kg Brick",
    price: 349,
    category: "Coir Blocks",
    tags: ["Expands 60–70L", "Washed", "Storage friendly"],
    short: "Compressed coir brick that expands with water.",
    details:
      "Space-saving 5kg coir brick for potting mixes and soil conditioning. Hydrates quickly, fluffs evenly, and improves water retention without sacrificing aeration.",
    specs: [
      ["Weight", "5 kg"],
      ["Expansion", "60–70 liters"],
      ["Texture", "Medium-fine"],
      ["Best for", "Potting mixes, beds"],
    ],
    imageSeed: "Coir Brick 5kg",
    image: "images/products/coir2.png"
  },
  {
    id: "cc-003",
    name: "Coir Chips — 10L",
    price: 229,
    category: "Hydroponics",
    tags: ["Chunky", "Airy", "Orchids & aroids"],
    short: "Chunky chips for high-oxygen root zones.",
    details:
      "Coir chips provide structural aeration and steady moisture—ideal for orchids, anthuriums, and hydroponic blends. Mix with perlite for an ultra-light medium.",
    specs: [
      ["Volume", "10 liters"],
      ["Chip size", "8–18 mm"],
      ["Best for", "Orchids, aroids"],
      ["Blend", "Perlite, bark"],
    ],
    imageSeed: "Coir Chips",
    image: "images/products/coir3.png"
  },
  {
    id: "cc-004",
    name: "Coco Mulch Mat — 30cm",
    price: 159,
    category: "Mulch & Mats",
    tags: ["Weed barrier", "Moisture lock", "Biodegradable"],
    short: "Circular coir mat for clean, protected potted plants.",
    details:
      "A dense coconut fiber mat that suppresses weeds and reduces evaporation. Looks clean on patios and greenhouse benches while improving moisture consistency.",
    specs: [
      ["Diameter", "30 cm"],
      ["Thickness", "~8 mm"],
      ["Life", "1 season+"],
      ["Use", "Pots, planters"],
    ],
    imageSeed: "Mulch Mat 30cm",
    image: "images/products/coir4.png"
  },
  {
    id: "cc-005",
    name: "Coir Potting Mix — 20L",
    price: 299,
    category: "Accessories",
    tags: ["Balanced", "Fine texture", "Indoor plants"],
    short: "Plant-ready coir mix for indoor and nursery use.",
    details:
      "A refined coir-based potting mix designed for tidy indoor watering and stable moisture. Great for seedlings, houseplants, and propagation.",
    specs: [
      ["Volume", "20 liters"],
      ["Texture", "Fine"],
      ["Use", "Indoor, nursery"],
      ["Notes", "Add fertilizer as needed"],
    ],
    imageSeed: "Potting Mix 20L",
    image: "images/products/coir5.png"
  },
  {
    id: "cc-006",
    name: "Coir Block — Starter Pack (3x)",
    price: 899,
    category: "Coir Blocks",
    tags: ["Best value", "Batch prep", "Sustainable"],
    short: "Three bricks for quick garden season prep.",
    details:
      "Save with a 3-pack. Hydrate bricks over a weekend and store fluffed coir in bins. Ideal for gardeners mixing soil at scale.",
    specs: [
      ["Pack", "3 bricks"],
      ["Total expansion", "180–210 liters"],
      ["Use", "Beds, mixes"],
      ["Storage", "Dry & sealed"],
    ],
    imageSeed: "Starter Pack 3x",
    image: "images/products/coir6.png"
  },
];

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

