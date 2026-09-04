/* =====================================================================
   AVIORA RESORT - STATIC VILLA / RATE / ADD-ON DATA
   ---------------------------------------------------------------------
   MIGRATION STATUS  (Villas module complete)

   VILLAS_DATA   LEGACY. The database is now the source of truth.
                 dbo.Villas holds exactly these six records, seeded by
                 Database/03_Villas_Schema.sql, and GET /api/villas returns
                 them with the same field names used below.

                 RoomsAndVillas.jsx no longer imports this array. Three files
                 still do:
                     pages/BookingPage.jsx
                     features/booking/BookingCheckoutModal.jsx
                     pages/AdminDashboard.jsx
                 They move to the API during the Bookings module, when the
                 quote and create endpoints exist. Converting them now would
                 mean rewriting the same code twice.

                 Do not edit villa details here any more - edit the database.
                 If the two ever disagree, the database wins.

   ADDONS_LIST   Still authoritative. dbo.Addons does not exist yet.
   RATE_PLANS    Still authoritative. dbo.RatePlans does not exist yet.
                 Both move to the API in module 3, together with promo codes,
                 because the booking quote endpoint needs the discount
                 percentages on the server before it can price anything.

   The arrays below are byte-for-byte unchanged. Only this header is new.
   ===================================================================== */

export const VILLAS_DATA = [
  {
    id: "canopy-villa-01",
    slug: "canopy-forest-villa",
    name: "Canopy Forest Villa",
    category: "canopy",
    tagline: "Suspended in the forest canopy, where the rainforest breathes below you.",
    description: "The Canopy Forest Villa offers an extraordinary elevated retreat nestled 12 metres above the forest floor. Floor-to-ceiling glass walls dissolve the boundary between your living space and the ancient tropical forest.",
    pricePerNight: 1850,
    currency: "LKR",
    size: 280,
    sizeUnit: "sqm",
    maxOccupancy: 2,
    bedConfiguration: "1 King Bedroom",
    view: "forest",
    availableSlots: 2,
    totalUnits: 5,
    rating: 4.96,
    reviewCount: 48,
    popularBadge: "🔥 Only 2 villas left for your dates!",
    image: "/assets/images/villas/canopy-villa-01.jpg",
    images: [
      "/assets/images/villas/canopy-villa-01.jpg",
      "/assets/images/villas/canopy-villa-01b.jpg",
      "/assets/images/villas/canopy-villa-01c.jpg"
    ],
    amenities: [
      "Private infinity plunge pool",
      "Outdoor rain shower",
      "Butler service",
      "Nespresso machine & minibar",
      "Indoor outdoor living room",
      "Forest-view soaking tub",
      "High-speed WiFi",
      "Daily fruit basket"
    ],
    featured: true,
    sustainability: "Built from reclaimed timber. Solar-heated water."
  },
  {
    id: "lagoon-suite-01",
    slug: "lagoon-water-suite",
    name: "Lagoon Water Suite",
    category: "lagoon",
    tagline: "Float above the lagoon — where sky and water become one.",
    description: "The Lagoon Water Suite sits directly over a natural brackish lagoon. An over-water deck with glass floor panels reveals the life below, while your private pool reflects the ever-changing equatorial sky.",
    pricePerNight: 2400,
    currency: "LKR",
    size: 320,
    sizeUnit: "sqm",
    maxOccupancy: 3,
    bedConfiguration: "1 King Bedroom + Day Bed",
    view: "ocean",
    availableSlots: 1,
    totalUnits: 4,
    rating: 4.98,
    reviewCount: 62,
    popularBadge: "⚡ High Demand: Only 1 suite left!",
    image: "/assets/images/villas/lagoon-suite-01.jpg",
    images: [
      "/assets/images/villas/lagoon-suite-01.jpg",
      "/assets/images/villas/lagoon-suite-01b.jpg"
    ],
    amenities: [
      "Over-water infinity pool",
      "Glass-floor deck",
      "Sunset pavilion",
      "Dedicated butler",
      "In-villa dining on request",
      "Kayak & stand-up paddleboard",
      "Outdoor rainfall shower",
      "Hammock terrace"
    ],
    featured: true,
    sustainability: "Lagoon ecosystem monitoring. Rainwater harvesting."
  },
  {
    id: "treetop-suite-01",
    slug: "treetop-heritage-suite",
    name: "Treetop Heritage Suite",
    category: "treetop",
    tagline: "A sanctuary of colonial heritage re-imagined for the ultra-luxury traveller.",
    description: "Positioned in the heart of the property's oldest grove, the Treetop Heritage Suite is housed within a restored colonial-era pavilion elevated on ancient ironwood stilts.",
    pricePerNight: 2100,
    currency: "LKR",
    size: 260,
    sizeUnit: "sqm",
    maxOccupancy: 2,
    bedConfiguration: "1 Heritage Four-Poster King",
    view: "forest",
    availableSlots: 3,
    totalUnits: 6,
    rating: 4.92,
    reviewCount: 39,
    popularBadge: "🌿 Eco Luxury Choice",
    image: "/assets/images/villas/treetop-suite-01.jpg",
    images: [
      "/assets/images/villas/treetop-suite-01.jpg",
      "/assets/images/villas/treetop-suite-01b.jpg"
    ],
    amenities: [
      "Private plunge pool",
      "Heritage four-poster bed",
      "Antique writing desk",
      "Outdoor clawfoot bathtub",
      "Butler service",
      "Vintage bar trolley",
      "Morning birding walk (guided)"
    ],
    featured: false,
    sustainability: "Restored heritage structure. Organic linen & cotton."
  },
  {
    id: "beachfront-villa-01",
    slug: "beachfront-infinity-villa",
    name: "Beachfront Infinity Villa",
    category: "beachfront",
    tagline: "Where the Indian Ocean horizon becomes your private view.",
    description: "The Beachfront Infinity Villa offers the resort's most dramatic relationship with the sea. An 18-metre private infinity pool appears to pour directly into the Indian Ocean.",
    pricePerNight: 3200,
    currency: "LKR",
    size: 450,
    sizeUnit: "sqm",
    maxOccupancy: 4,
    bedConfiguration: "1 King Master + 1 King Guest Room",
    view: "ocean",
    availableSlots: 2,
    totalUnits: 3,
    rating: 4.99,
    reviewCount: 84,
    popularBadge: "⭐ Top Rated Beachfront",
    image: "/assets/images/villas/beachfront-villa-01.jpg",
    images: [
      "/assets/images/villas/beachfront-villa-01.jpg",
      "/assets/images/villas/beachfront-villa-01b.jpg"
    ],
    amenities: [
      "18m private infinity pool",
      "Direct beach access",
      "Outdoor shower & daybed",
      "Two master suites",
      "Full kitchen & dining pavilion",
      "Dedicated butler & chef",
      "Private catamaran excursion"
    ],
    featured: true,
    sustainability: "Coral restoration programme contribution with each stay."
  },
  {
    id: "garden-pool-villa-01",
    slug: "garden-pool-villa",
    name: "Garden Pool Villa",
    category: "canopy",
    tagline: "An intimate garden sanctuary — privacy woven in tropical blooms.",
    description: "Enclosed within high garden walls draped in bougainvillea and jasmine, the Garden Pool Villa delivers absolute privacy at ground level with exposed timber rafters and private pool.",
    pricePerNight: 1650,
    currency: "LKR",
    size: 220,
    sizeUnit: "sqm",
    maxOccupancy: 2,
    bedConfiguration: "1 King Bedroom",
    view: "garden",
    availableSlots: 4,
    totalUnits: 8,
    rating: 4.89,
    reviewCount: 51,
    popularBadge: "🌸 Best Value Luxury",
    image: "/assets/images/villas/garden-pool-villa-01.jpg",
    images: [
      "/assets/images/villas/garden-pool-villa-01.jpg"
    ],
    amenities: [
      "Private walled garden pool",
      "Outdoor living pavilion",
      "Hammock garden",
      "Butler service",
      "In-villa yoga space",
      "Outdoor dining table for two"
    ],
    featured: false,
    sustainability: "100% organic garden. Composting programme."
  },
  {
    id: "sky-villa-penthouse",
    slug: "sky-villa-penthouse",
    name: "Sky Villa Penthouse",
    category: "treetop",
    tagline: "The summit of the Aviora experience — above the canopy, among the clouds.",
    description: "The Sky Villa Penthouse occupies the highest point of the resort's principal structure with 360° views across the jungle, lagoon, and ocean. Rooftop plunge pool and dedicated villa host.",
    pricePerNight: 5200,
    currency: "LKR",
    size: 650,
    sizeUnit: "sqm",
    maxOccupancy: 4,
    bedConfiguration: "2 King Bedrooms + Loft Study",
    view: "forest",
    availableSlots: 1,
    totalUnits: 2,
    rating: 5.0,
    reviewCount: 27,
    popularBadge: "👑 Presidential Flagship Suite",
    image: "/assets/images/villas/sky-villa-01.jpg",
    images: [
      "/assets/images/villas/sky-villa-01.jpg",
      "/assets/images/villas/sky-villa-01b.jpg"
    ],
    amenities: [
      "Rooftop infinity plunge pool",
      "360° panoramic terrace",
      "Private villa host (24hr)",
      "Dedicated in-villa chef",
      "Curated wine & spirits programme",
      "Home cinema projection room",
      "Private helicopter landing arrangement"
    ],
    featured: true,
    sustainability: "Net-zero design. All energy from on-site solar."
  }
];

export const ADDONS_LIST = [
  {
    id: "transfer",
    name: "Luxury SUV Airport Transfer",
    description: "Round-trip private transfer in an executive SUV with chilled refreshments & WiFi.",
    price: 250,
    icon: "🚗"
  },
  {
    id: "spa",
    name: "60-Min Couples Ayurvedic Massage",
    description: "Signature herbal oil ritual at the Wellness Spa or in-villa terrace.",
    price: 320,
    icon: "💆"
  },
  {
    id: "dinner",
    name: "Private Candlelight Beach Dinner",
    description: "5-course bespoke seafood menu prepared by your private chef on the shoreline.",
    price: 450,
    icon: "🍷"
  },
  {
    id: "welcome",
    name: "Champagne & Exotic Fruit Welcome",
    description: "Moët & Chandon Champagne paired with seasonal organic tropical fruit platter.",
    price: 150,
    icon: "🍾"
  }
];

export const RATE_PLANS = [
  {
    id: "standard",
    name: "Flexible Standard Rate",
    badge: "Most Popular",
    discountPercent: 0,
    features: [
      "Gourmet Breakfast Included Daily",
      "FREE Cancellation up to 48 hours before check-in",
      "No prepayment required (Pay at resort)",
      "Welcome Drink & Botanical Foot Soak"
    ]
  },
  {
    id: "saver",
    name: "Best Saver Non-Refundable Rate",
    badge: "Save 15%",
    discountPercent: 15,
    features: [
      "Gourmet Breakfast Included Daily",
      "Non-refundable rate — best price guaranteed",
      "Instant lock-in for your selected dates",
      "Includes LKR 15,000 Resort Spa Credit per stay"
    ]
  },
  {
    id: "allinclusive",
    name: "All-Inclusive Luxury Experience",
    badge: "VIP Package",
    discountPercent: -25, // Premium surcharge (+25%)
    features: [
      "All meals included (Breakfast, Lunch & 5-Course Dinner)",
      "Unlimited premium beverages & curated wine list",
      "Complimentary Luxury Airport SUV Transfer",
      "Daily 60-min Ayurvedic Spa Treatment per guest"
    ]
  }
];