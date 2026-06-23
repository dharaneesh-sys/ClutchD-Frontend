// Mock product reviews for marketplace demo
// 3-5 reviews per product

export const reviews = [
  // prod-001: Engine Piston Ring Set
  { id: "rev-001", productId: "prod-001", userName: "Vikram R.", rating: 5, text: "Excellent quality piston rings. Fixed my Swift's compression issue perfectly. Fit was exact.", date: "2026-05-10T14:30:00Z", verified: true },
  { id: "rev-002", productId: "prod-001", userName: "Sathish K.", rating: 4, text: "Good quality for the price. Installed in my WagonR, working well so far after 2000 km.", date: "2026-04-22T10:15:00Z", verified: true },
  { id: "rev-003", productId: "prod-001", userName: "Mohan P.", rating: 5, text: "Bought for a rebuild project. Met all specifications as advertised.", date: "2026-03-15T09:45:00Z", verified: false },

  // prod-002: Timing Belt Kit
  { id: "rev-004", productId: "prod-002", userName: "Arun S.", rating: 5, text: "Complete kit with tensioner. Saved me a trip to the dealership. Install was straightforward.", date: "2026-05-18T16:20:00Z", verified: true },
  { id: "rev-005", productId: "prod-002", userName: "Divya M.", rating: 4, text: "Good quality belt. Did 10,000 km on it already, no issues. Tensioner feels solid.", date: "2026-04-30T08:10:00Z", verified: true },
  { id: "rev-006", productId: "prod-002", userName: "Rajesh K.", rating: 4, text: "Timing marks were clear and easy to align. Good value kit overall.", date: "2026-04-05T12:30:00Z", verified: false },

  // prod-003: Cylinder Head Gasket Set
  { id: "rev-007", productId: "prod-003", userName: "Karthik N.", rating: 5, text: "MLS gasket sealed perfectly on my Innova after head skim. No coolant loss after 5000 km.", date: "2026-05-25T11:00:00Z", verified: true },
  { id: "rev-008", productId: "prod-003", userName: "Suresh B.", rating: 4, text: "Comes with all the gaskets needed for the job. Good fit on Fortuner 2.8L.", date: "2026-04-18T15:40:00Z", verified: true },
  { id: "rev-009", productId: "prod-003", userName: "Prakash R.", rating: 5, text: "Premium quality set. Mechanic was impressed with the material quality.", date: "2026-03-28T10:50:00Z", verified: false },

  // prod-004: Brake Pad Set (Ceramic)
  { id: "rev-010", productId: "prod-004", userName: "Anita S.", rating: 5, text: "Finally no more brake dust on my white alloys! Stops well, very little noise.", date: "2026-06-01T09:30:00Z", verified: true },
  { id: "rev-011", productId: "prod-004", userName: "Ganesh M.", rating: 4, text: "Great upgrade from stock pads. Initial bite could be slightly better but overall satisfied.", date: "2026-05-12T14:15:00Z", verified: true },
  { id: "rev-012", productId: "prod-004", userName: "Keerthi V.", rating: 5, text: "Used in my Creta. Braking is smooth and dust is almost zero. Highly recommend.", date: "2026-04-28T16:45:00Z", verified: true },
  { id: "rev-013", productId: "prod-004", userName: "Deepak C.", rating: 4, text: "Good pads for city driving. Haven't tried hard braking yet but feel confident.", date: "2026-04-10T08:20:00Z", verified: false },

  // prod-005: Brake Disc Rotor (Vented)
  { id: "rev-014", productId: "prod-005", userName: "Ravi T.", rating: 5, text: "Vented rotors made a noticeable difference in braking performance. No judder at high speeds.", date: "2026-05-30T12:00:00Z", verified: true },
  { id: "rev-015", productId: "prod-005", userName: "Priya A.", rating: 4, text: "Good replacement rotors. Balanced well, no vibration during braking. Finish is nice.", date: "2026-05-05T10:30:00Z", verified: true },
  { id: "rev-016", productId: "prod-005", userName: "Sundar K.", rating: 5, text: "Installed on my Baleno. Perfect fit and the anti-rust coating is a nice touch.", date: "2026-04-15T13:50:00Z", verified: true },

  // prod-006: Brake Caliper Assembly
  { id: "rev-017", productId: "prod-006", userName: "Murugan S.", rating: 4, text: "Direct fit on my Honda City. Pre-bled would have been nice but assembly quality is good.", date: "2026-05-20T11:30:00Z", verified: true },
  { id: "rev-018", productId: "prod-006", userName: "Vijay L.", rating: 5, text: "Smooth sliding pins, came with all brackets. Exactly what was needed.", date: "2026-04-25T09:00:00Z", verified: true },
  { id: "rev-019", productId: "prod-006", userName: "Harish R.", rating: 4, text: "Aluminum body is lightweight. Works well, no leaks around piston seal.", date: "2026-03-20T15:15:00Z", verified: false },

  // prod-007: Spark Plug Iridium
  { id: "rev-020", productId: "prod-007", userName: "Rahul D.", rating: 5, text: "Noticed smoother idle and slightly better fuel economy after installing these. NGK quality as expected.", date: "2026-06-02T10:00:00Z", verified: true },
  { id: "rev-021", productId: "prod-007", userName: "Nithya K.", rating: 5, text: "My car starts much quicker now, even in cold mornings. Worth the upgrade.", date: "2026-05-15T08:45:00Z", verified: true },
  { id: "rev-022", productId: "prod-007", userName: "Selva M.", rating: 4, text: "Good plugs for the price. Iridium tip should last much longer than standard copper ones.", date: "2026-04-22T12:20:00Z", verified: false },
  { id: "rev-023", productId: "prod-007", userName: "Anand P.", rating: 5, text: "Used in my i20. Genuine NGK product with proper branding. Highly recommended.", date: "2026-04-08T16:30:00Z", verified: true },

  // prod-008: Battery 12V 40Ah
  { id: "rev-024", productId: "prod-008", userName: "Kumar R.", rating: 4, text: "Good maintenance free battery. Delivered next day. Installed and started without issues.", date: "2026-05-28T14:00:00Z", verified: true },
  { id: "rev-025", productId: "prod-008", userName: "Lakshmi S.", rating: 5, text: "Replaced my old battery with this. Great cranking power even after sitting for a week.", date: "2026-05-01T11:10:00Z", verified: true },
  { id: "rev-026", productId: "prod-008", userName: "Bala K.", rating: 4, text: "Good value battery. Terminals fit perfectly. No issues so far in 3 months.", date: "2026-04-10T09:30:00Z", verified: true },

  // prod-009: Alternator Assembly 90A
  { id: "rev-027", productId: "prod-009", userName: "Suresh G.", rating: 5, text: "Perfect fit on my i20. Charging voltage is stable at 14.2V. No more dimming lights!", date: "2026-05-22T15:30:00Z", verified: true },
  { id: "rev-028", productId: "prod-009", userName: "Jayesh M.", rating: 4, text: "Good alternator for the price. Pulley alignment was correct. Working well after 1 month.", date: "2026-05-02T10:45:00Z", verified: true },
  { id: "rev-029", productId: "prod-009", userName: "Santhosh R.", rating: 4, text: "90A output handles my aftermarket audio system easily. Reliable product.", date: "2026-04-15T08:00:00Z", verified: false },

  // prod-010: Shock Absorber Set (Front Pair)
  { id: "rev-030", productId: "prod-010", userName: "Dinesh K.", rating: 5, text: "Transformed the ride quality on my Swift. No more bouncing over speed bumps.", date: "2026-05-30T16:15:00Z", verified: true },
  { id: "rev-031", productId: "prod-010", userName: "Ranjith S.", rating: 4, text: "Good shocks, improved handling noticeably. Installation was straightforward.", date: "2026-05-10T12:30:00Z", verified: true },
  { id: "rev-032", productId: "prod-010", userName: "Bhavani R.", rating: 5, text: "Had these installed at a local garage. The difference in comfort is night and day.", date: "2026-04-18T14:50:00Z", verified: true },
  { id: "rev-033", productId: "prod-010", userName: "Praveen N.", rating: 4, text: "Good value for money. Bushings included, which saved me an extra purchase.", date: "2026-03-25T11:20:00Z", verified: false },

  // prod-011: Coil Spring Kit (Rear)
  { id: "rev-034", productId: "prod-011", userName: "Vignesh M.", rating: 5, text: "My Innova now handles full load without sagging. Progressive rate works as advertised.", date: "2026-05-28T13:00:00Z", verified: true },
  { id: "rev-035", productId: "prod-011", userName: "Shankar A.", rating: 4, text: "Sturdy springs, powder coating looks durable. Ride is slightly firmer but controlled.", date: "2026-05-05T09:15:00Z", verified: true },
  { id: "rev-036", productId: "prod-011", userName: "Manikandan R.", rating: 5, text: "Perfect upgrade for Innova Crysta. Family trips are much more comfortable now.", date: "2026-04-12T11:45:00Z", verified: false },

  // prod-012: Oil Filter F-101
  { id: "rev-037", productId: "prod-012", userName: "Sathya N.", rating: 5, text: "Best budget oil filter. Used with synthetic oil, changed at 8000 km, still looked good.", date: "2026-06-03T10:30:00Z", verified: true },
  { id: "rev-038", productId: "prod-012", userName: "Arvind K.", rating: 4, text: "Fits my Swift perfectly. Good build quality, rubber seal is nice and snug.", date: "2026-05-20T14:00:00Z", verified: true },
  { id: "rev-039", productId: "prod-012", userName: "Madhu S.", rating: 5, text: "Anti-drain back valve is a great feature. No more dry starts in the morning.", date: "2026-05-01T08:15:00Z", verified: true },
  { id: "rev-040", productId: "prod-012", userName: "Kishore B.", rating: 4, text: "Bulk bought these for my garage inventory. Customers haven't complained. Good product.", date: "2026-04-08T16:00:00Z", verified: false },

  // prod-013: Air Filter Element (Panel Type)
  { id: "rev-041", productId: "prod-013", userName: "Deepa R.", rating: 5, text: "Noticed a slight improvement in pickup after replacing my old clogged filter. Genuine Valeo.", date: "2026-05-25T12:45:00Z", verified: true },
  { id: "rev-042", productId: "prod-013", userName: "Yogesh S.", rating: 4, text: "Good quality, fit was perfect in my Creta's air box. Frame feels sturdy.", date: "2026-05-10T09:30:00Z", verified: true },
  { id: "rev-043", productId: "prod-013", userName: "Sneha M.", rating: 5, text: "Great replacement filter. Easy DIY install, took 2 minutes. Car feels more responsive.", date: "2026-04-22T11:00:00Z", verified: true },

  // prod-014: Cabin Filter Activated Carbon
  { id: "rev-044", productId: "prod-014", userName: "Vasanth K.", rating: 5, text: "Made a huge difference to AC smell. The musty odor is completely gone now. Highly recommend.", date: "2026-06-01T15:00:00Z", verified: true },
  { id: "rev-045", productId: "prod-014", userName: "Latha M.", rating: 4, text: "Fits my Baleno perfectly. Carbon layer seems thick. AC airflow slightly reduced but air is fresh.", date: "2026-05-18T10:30:00Z", verified: true },
  { id: "rev-046", productId: "prod-014", userName: "Senthil R.", rating: 5, text: "Great product. Living on a busy road, the cabin used to smell of exhaust fumes. Not anymore.", date: "2026-04-30T14:15:00Z", verified: true },
  { id: "rev-047", productId: "prod-014", userName: "Pavithra S.", rating: 4, text: "Good quality carbon filter. Delivery was quick. Would buy again.", date: "2026-04-05T09:50:00Z", verified: false },

  // prod-015: Car Floor Mat Set (TPE)
  { id: "rev-048", productId: "prod-015", userName: "Ramesh B.", rating: 5, text: "Best floor mats I've bought. The TPE material is soft but durable. Raised edges catch everything.", date: "2026-05-29T11:30:00Z", verified: true },
  { id: "rev-049", productId: "prod-015", userName: "Anjali K.", rating: 4, text: "No chemical smell like cheap rubber mats. Fit is universal but works well in my i20.", date: "2026-05-12T14:00:00Z", verified: true },
  { id: "rev-050", productId: "prod-015", userName: "Thirumalai S.", rating: 5, text: "Hosed them down after a muddy trip and they looked brand new. Great investment.", date: "2026-04-22T16:45:00Z", verified: true },
  { id: "rev-051", productId: "prod-015", userName: "Gokul R.", rating: 4, text: "Anti-slip backing keeps them firmly in place. No curling at edges. Good product.", date: "2026-04-01T08:30:00Z", verified: false },
];
