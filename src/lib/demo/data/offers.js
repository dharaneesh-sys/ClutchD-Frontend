// Mock offers/coupons for marketplace demo
// 5 offers with various discount levels

export const offers = [
  {
    id: "offer-001",
    title: "New User Welcome",
    description: "Get 15% off on your first purchase of auto parts. Minimum order of ₹500.",
    discountPercent: 15,
    code: "WELCOME15",
    validUntil: "2026-12-31T23:59:59Z",
    minPurchase: 500,
  },
  {
    id: "offer-002",
    title: "Festive Season Special",
    description: "Flat 10% discount on all engine parts and filters during our festive season sale.",
    discountPercent: 10,
    code: "FESTIVE10",
    validUntil: "2026-08-31T23:59:59Z",
    minPurchase: 1000,
  },
  {
    id: "offer-003",
    title: "Brake Service Bundle",
    description: "Special 20% off on brake pads and disc rotors when bought together.",
    discountPercent: 20,
    code: "BRAKE20",
    validUntil: "2026-07-31T23:59:59Z",
    minPurchase: 1500,
  },
  {
    id: "offer-004",
    title: "Free Delivery Promo",
    description: "Get ₹200 instant discount equivalent to free delivery on orders above ₹2000.",
    discountPercent: 8,
    code: "FREEDEL",
    validUntil: "2026-06-30T23:59:59Z",
    minPurchase: 2000,
  },
  {
    id: "offer-005",
    title: "Weekend Flash Sale",
    description: "Extra 25% off on selected electrical components. Limited stock!",
    discountPercent: 25,
    code: "FLASH25",
    validUntil: "2026-06-28T23:59:59Z",
    minPurchase: 750,
  },
];
