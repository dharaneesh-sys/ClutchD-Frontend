/**
 * Vehicle data for VIN fitment — vehicle selector.
 *
 * Hardcoded demo data covering popular Indian car makes, models,
 * model years (2015–2025), and trim variants.
 *
 * Structure:
 *   makes    → [{ value, label }]
 *   models   → { [makeValue]: [{ value, label }] }
 *   years    → [{ value, label }]
 *   variants → { [makeValue-modelValue]: [{ value, label }] }
 */

export const VEHICLE_MAKES = [
  { value: "maruti-suzuki", label: "Maruti Suzuki" },
  { value: "hyundai", label: "Hyundai" },
  { value: "tata", label: "Tata" },
  { value: "toyota", label: "Toyota" },
  { value: "honda", label: "Honda" },
  { value: "mahindra", label: "Mahindra" },
  { value: "kia", label: "Kia" },
  { value: "volkswagen", label: "Volkswagen" },
  { value: "renault", label: "Renault" },
  { value: "ford", label: "Ford" },
  { value: "mg", label: "MG" },
  { value: "nissan", label: "Nissan" },
];

export const VEHICLE_MODELS = {
  "maruti-suzuki": [
    { value: "alto", label: "Alto" },
    { value: "swift", label: "Swift" },
    { value: "baleno", label: "Baleno" },
    { value: "dzire", label: "Dzire" },
    { value: "ertiga", label: "Ertiga" },
    { value: "brezza", label: "Brezza" },
    { value: "wagonr", label: "WagonR" },
    { value: "s-presso", label: "S-Presso" },
    { value: "ignis", label: "Ignis" },
    { value: "ciaz", label: "Ciaz" },
    { value: "xl6", label: "XL6" },
    { value: "grand-vitara", label: "Grand Vitara" },
    { value: "fronx", label: "Fronx" },
    { value: "jimny", label: "Jimny" },
    { value: "invicto", label: "Invicto" },
  ],
  hyundai: [
    { value: "i10", label: "i10 / Grand i10" },
    { value: "i20", label: "i20 / Grand i20" },
    { value: "creta", label: "Creta" },
    { value: "venue", label: "Venue" },
    { value: "verna", label: "Verna" },
    { value: "tucson", label: "Tucson" },
    { value: "elantra", label: "Elantra" },
    { value: "aura", label: "Aura" },
    { value: "exter", label: "Exter" },
    { value: "alcazar", label: "Alcazar" },
    { value: "ioniq", label: "Ioniq 5" },
  ],
  tata: [
    { value: "tiago", label: "Tiago" },
    { value: "altroz", label: "Altroz" },
    { value: "nexon", label: "Nexon" },
    { value: "harrier", label: "Harrier" },
    { value: "safari", label: "Safari" },
    { value: "punch", label: "Punch" },
    { value: "tigor", label: "Tigor" },
    { value: "curvv", label: "Curvv" },
    { value: "avinya", label: "Avinya" },
  ],
  toyota: [
    { value: "fortuner", label: "Fortuner" },
    { value: "innova", label: "Innova Crysta" },
    { value: "glanza", label: "Glanza" },
    { value: "urban-cruiser", label: "Urban Cruiser" },
    { value: "camry", label: "Camry" },
    { value: "hycross", label: "Innova Hycross" },
    { value: "vellfire", label: "Vellfire" },
    { value: "rumion", label: "Rumion" },
    { value: "taisor", label: "Taisor" },
  ],
  honda: [
    { value: "city", label: "City" },
    { value: "amaze", label: "Amaze" },
    { value: "jazz", label: "Jazz" },
    { value: "civic", label: "Civic" },
    { value: "crv", label: "CR-V" },
    { value: "wrv", label: "WR-V" },
    { value: "elevate", label: "Elevate" },
  ],
  mahindra: [
    { value: "scorpio", label: "Scorpio / Scorpio-N" },
    { value: "xuv700", label: "XUV700" },
    { value: "thar", label: "Thar" },
    { value: "bolero", label: "Bolero" },
    { value: "xuv300", label: "XUV300" },
    { value: "marazzo", label: "Marazzo" },
    { value: "alturas", label: "Alturas G4" },
    { value: "xe", label: "XUV400 / BE" },
  ],
  kia: [
    { value: "seltos", label: "Seltos" },
    { value: "sonet", label: "Sonet" },
    { value: "carnival", label: "Carnival" },
    { value: "ev6", label: "EV6" },
    { value: "carens", label: "Carens" },
    { value: "syros", label: "Syros" },
  ],
  volkswagen: [
    { value: "polo", label: "Polo" },
    { value: "vento", label: "Vento" },
    { value: "taigun", label: "Taigun" },
    { value: "tiguan", label: "Tiguan" },
    { value: "virtus", label: "Virtus" },
    { value: "jetta", label: "Jetta" },
  ],
  renault: [
    { value: "kwid", label: "Kwid" },
    { value: "triber", label: "Triber" },
    { value: "kiger", label: "Kiger" },
    { value: "duster", label: "Duster" },
    { value: "capture", label: "Captur" },
  ],
  ford: [
    { value: "ecosport", label: "EcoSport" },
    { value: "endeavour", label: "Endeavour" },
    { value: "figo", label: "Figo" },
    { value: "aspire", label: "Aspire" },
    { value: "mustang", label: "Mustang" },
    { value: "freestyle", label: "Freestyle" },
  ],
  mg: [
    { value: "hector", label: "Hector" },
    { value: "zs-ev", label: "ZS EV" },
    { value: "gloster", label: "Gloster" },
    { value: "astor", label: "Astor" },
    { value: "comet", label: "Comet EV" },
    { value: "windsor", label: "Windsor EV" },
  ],
  nissan: [
    { value: "magnite", label: "Magnite" },
    { value: "terrano", label: "Terrano" },
    { value: "sunny", label: "Sunny" },
    { value: "kicks", label: "Kicks" },
    { value: "micra", label: "Micra" },
  ],
};

/** Common model years (2015 – 2025) */
export const VEHICLE_YEARS = Array.from({ length: 11 }, (_, i) => {
  const year = 2015 + i;
  return { value: String(year), label: String(year) };
});

/**
 * Trim variants keyed by "make-model".
 */
const _variants = {
  "maruti-suzuki-alto": ["Std", "LXi", "VXi", "VXi+"],
  "maruti-suzuki-swift": ["LXi", "VXi", "ZXi", "ZXi+"],
  "maruti-suzuki-baleno": ["Sigma", "Delta", "Zeta", "Alpha"],
  "maruti-suzuki-dzire": ["LXi", "VXi", "ZXi", "ZXi+"],
  "maruti-suzuki-ertiga": ["LXi", "VXi", "ZXi", "ZXi+"],
  "maruti-suzuki-brezza": ["LXi", "VXi", "ZXi", "ZXi+"],
  "maruti-suzuki-wagonr": ["LXi", "VXi", "ZXi"],
  "maruti-suzuki-s-presso": ["Std", "LXi", "VXi"],
  "maruti-suzuki-ignis": ["Sigma", "Delta", "Zeta", "Alpha"],
  "maruti-suzuki-ciaz": ["Sigma", "Delta", "Zeta", "Alpha"],
  "maruti-suzuki-xl6": ["Delta", "Zeta", "Alpha"],
  "maruti-suzuki-grand-vitara": ["Sigma", "Delta", "Zeta", "Alpha"],
  "maruti-suzuki-fronx": ["Sigma", "Delta", "Zeta", "Alpha"],
  "maruti-suzuki-jimny": ["Zeta", "Alpha"],
  "maruti-suzuki-invicto": ["Zeta", "Alpha"],

  "hyundai-i10": ["Era", "Magna", "Sportz", "Asta"],
  "hyundai-i20": ["Magna", "Sportz", "Asta", "N-Line"],
  "hyundai-creta": ["E", "EX", "S", "SX", "SX+"],
  "hyundai-venue": ["E", "S", "SX", "SX+"],
  "hyundai-verna": ["S", "SX", "SX+"],
  "hyundai-tucson": ["E", "GL", "GLS", "Platinum"],
  "hyundai-elantra": ["S", "SX", "SX+"],
  "hyundai-aura": ["E", "Magna", "Sportz", "Asta"],
  "hyundai-exter": ["E", "EX", "S", "SX", "SX+"],
  "hyundai-alcazar": ["E", "EX", "S", "SX", "SX+"],
  "hyundai-ioniq": ["RWD", "AWD"],

  "tata-tiago": ["XE", "XT", "XZ", "XZ+"],
  "tata-altroz": ["XE", "XT", "XZ", "XZ+"],
  "tata-nexon": ["XE", "XM", "XZ", "XZ+"],
  "tata-harrier": ["XE", "XM", "XZ", "XZ+"],
  "tata-safari": ["XE", "XM", "XZ", "XZ+"],
  "tata-punch": ["Pure", "Adventure", "Accomplished", "Creative"],
  "tata-tigor": ["XE", "XT", "XZ", "XZ+"],
  "tata-curvv": ["Smart", "Pure", "Creative", "Accomplished"],

  "toyota-fortuner": ["2.4 MT", "2.4 AT", "2.8 AT 4x4", "Legender"],
  "toyota-innova": ["G", "GX", "VX", "ZX"],
  "toyota-glansa": ["G", "G+"],
  "toyota-urban-cruiser": ["S", "G", "V"],
  "toyota-camry": ["Hybrid"],
  "toyota-hycross": ["G", "GX", "VX", "ZX"],
  "toyota-vellfire": ["Luxury"],
  "toyota-rumion": ["S", "G", "V"],
  "toyota-taisor": ["S", "G", "V"],

  "honda-city": ["S", "V", "VX", "ZX"],
  "honda-amaze": ["S", "V", "VX"],
  "honda-jazz": ["V", "VX"],
  "honda-civic": ["V", "VX", "ZX"],
  "honda-crv": ["V", "VX"],
  "honda-wrv": ["S", "V", "VX"],
  "honda-elevate": ["S", "V", "VX", "ZX"],

  "mahindra-scorpio": ["S", "S5", "S7", "S9", "S11", "Z8", "Z8L"],
  "mahindra-xuv700": ["MX", "AX3", "AX5", "AX7"],
  "mahindra-thar": ["AX", "LX", "AX Option"],
  "mahindra-bolero": ["B6", "B6+"],
  "mahindra-xuv300": ["W4", "W6", "W8", "W10"],
  "mahindra-marazzo": ["M2", "M4", "M6", "M8"],
  "mahindra-alturas": ["4X2", "4X4"],

  "kia-seltos": ["HTE", "HTK", "HTK+", "HTX", "GT Line"],
  "kia-sonet": ["HTE", "HTK", "HTK+", "HTX", "GT Line"],
  "kia-carnival": ["Premium", "Prestige", "Limited", "Platinum"],
  "kia-ev6": ["RWD", "AWD", "GT Line"],
  "kia-carens": ["Premium", "Prestige", "Prestige+", "Luxury", "Luxury+"],
  "kia-syros": ["HTE", "HTK", "HTK+", "HTX"],

  "volkswagen-polo": ["Trendline", "Comfortline", "Highline", "GT"],
  "volkswagen-vento": ["Trendline", "Comfortline", "Highline"],
  "volkswagen-taigun": ["Comfortline", "Highline", "GT"],
  "volkswagen-tiguan": ["Comfortline", "Highline", "Elegance"],
  "volkswagen-virtus": ["Comfortline", "Highline", "GT"],

  "renault-kwid": ["RXE", "RXL", "RXT", "Climber"],
  "renault-triber": ["RXE", "RXL", "RXT", "RXT+"],
  "renault-kiger": ["RXE", "RXL", "RXT", "RXT+"],
  "renault-duster": ["RXE", "RXL", "RXT", "RXZ"],
  "renault-captur": ["RXE", "RXL", "RXT"],

  "ford-ecosport": ["Ambiente", "Trend", "Titanium", "S"],
  "ford-endeavour": ["Ambiente", "Trend", "Titanium", "Sport"],
  "ford-figo": ["Ambiente", "Trend", "Titanium"],
  "ford-aspire": ["Ambiente", "Trend", "Titanium"],
  "ford-mustang": ["GT", "Mach 1", "Dark Horse"],
  "ford-freestyle": ["Ambiente", "Trend", "Titanium"],

  "mg-hector": ["Style", "Super", "Smart", "Sharp"],
  "mg-zs-ev": ["Excite", "Exclusive"],
  "mg-gloster": ["Super", "Smart", "Sharp", "Savvy"],
  "mg-astor": ["Style", "Super", "Smart", "Sharp"],
  "mg-comet": ["Excite", "Exclusive"],
  "mg-windsor": ["Excite", "Exclusive"],

  "nissan-magnite": ["Pure", "XL", "XV", "XV+"],
  "nissan-terrano": ["XL", "XV", "XVL"],
  "nissan-sunny": ["XL", "XV"],
  "nissan-kicks": ["XL", "XV", "XVL"],
  "nissan-micra": ["XE", "XL", "XV"],
};

export function getVariants(make, model) {
  const key = `${make}-${model}`;
  const list = _variants[key];
  if (!list) return [{ value: "standard", label: "Standard" }];
  return list.map((v) => ({ value: v.toLowerCase().replace(/\s+/g, "-"), label: v }));
}

/**
 * Convert a variant label to a value slug (since _variants uses labels).
 */
function variantToValue(label) {
  return label.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Build the full variants map in the standard { value, label } format.
 */
export const VEHICLE_VARIANTS = {};
for (const [key, labels] of Object.entries(_variants)) {
  VEHICLE_VARIANTS[key] = labels.map((label) => ({
    value: variantToValue(label),
    label,
  }));
}
