import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_SEO = {
  title: 'Aviora Resort — Ultra-Luxury Eco Villas, Wellness Sanctuary & Private Estate',
  description:
    'Experience Aviora Resort, a bespoke eco-luxury sanctuary nestled in the Seychelles archipelago. Featuring 12 private pool villas, Ayurvedic spa rituals, and oceanfront dining.',
  keywords:
    'Aviora Resort, luxury resort Seychelles, private pool villas, Ayurvedic wellness, eco-luxury hotel, fine dining, tropical sanctuary, presidential villa, ocean villa',
  image: '/assets/images/hero-night.jpg',
  type: 'website',
};

const PAGE_SEO = {
  '/': {
    title: 'Aviora Resort — Ultra-Luxury Eco Villas & Tropical Sanctuary',
    description:
      'Discover Aviora Resort, an ultra-luxury sanctuary amid ancient rainforests and azure waters. 12 bespoke private villas, holistic wellness, and tailored luxury hospitality.',
    keywords:
      'Aviora Resort, luxury villas, tropical resort, Seychelles luxury stay, private island escape, luxury hotel',
  },
  '/rooms-villas': {
    title: 'Luxury Villas & Suites | Aviora Resort Seychelles',
    description:
      'Explore our collection of 12 mastercrafted beachfront, rainforest, and panoramic ocean pool villas with private infinity pools and 24/7 dedicated butler service.',
    keywords:
      'Aviora villas, ocean pool villa, presidential water sanctuary, forest canopy suite, beachfront villa, luxury suite Seychelles',
  },
  '/booking': {
    title: 'Reserve Your Villa Stay | Aviora Resort Official Booking',
    description:
      'Book direct for guaranteed best rates, complimentary spa credits, sunset yacht cruise inclusions, and personalized concierge itineraries at Aviora Resort.',
    keywords:
      'book Aviora resort, villa reservation, luxury suite booking, direct resort booking, best rates Seychelles',
  },
  '/dining': {
    title: 'Fine Dining & Private Cellar | Culinary Sanctuaries at Aviora',
    description:
      'Indulge in Michelin-inspired dining, open-flame seafood delicacies, and private beach omakase overlooking the Indian Ocean at Aviora Resort.',
    keywords:
      'Aviora dining, luxury resort restaurant, beach omakase, private cellar wine tasting, Seychelles fine dining',
  },
  '/wellness': {
    title: 'Ayurvedic Wellness & Spa Sanctuary | Aviora Resort',
    description:
      'Rebalance mind, body, and soul with ancient Ayurvedic healing, bespoke sound baths, oceanfront yoga, and thermal hydrotherapy at Aviora Wellness Sanctuary.',
    keywords:
      'Ayurvedic spa, wellness sanctuary, holistic healing, oceanfront yoga, hydrotherapy spa, luxury spa Seychelles',
  },
  '/sustainability': {
    title: 'Sustainability & Conservation Charter | Aviora Resort',
    description:
      '100% solar-powered luxury, coral reef restoration, zero single-use plastics, and local community stewardship at Aviora Resort.',
    keywords:
      'eco-luxury resort, sustainability charter, marine conservation, solar powered luxury hotel, green resort Seychelles',
  },
  '/gallery': {
    title: 'Visual Sanctuary & Estate Gallery | Aviora Resort',
    description:
      'Immerse yourself in high-resolution photography and cinematic captures of our villas, culinary creations, wildlife encounters, and estate grounds.',
    keywords:
      'Aviora gallery, resort photos, luxury villa photos, Seychelles resort images, luxury travel gallery',
  },
  '/destination': {
    title: 'Silhouette Island & Seychelles Destination | Aviora Resort',
    description:
      'Explore the enchanting Silhouette Island and Seychelles Archipelago. Helicopter arrivals, private yacht charters, and untouched marine reserves.',
    keywords:
      'Silhouette Island Seychelles, Seychelles destination guide, helicopter arrival, private yacht charter',
  },
  '/contact': {
    title: 'Contact Concierge & Inquiries | Aviora Resort',
    description:
      'Connect with our 24/7 concierge desk. Direct telephone lines, EmailJS inquiry dispatch, and instant WhatsApp reception liaison.',
    keywords:
      'contact Aviora resort, resort reception, hotel concierge, WhatsApp concierge, luxury resort reservations',
  },
  '/login': {
    title: 'Guest & Staff Portal Sign In | Aviora Resort',
    description:
      'Access your personal reservation history, digital vouchers, and staff administration operations portal at Aviora Resort.',
    keywords: 'Aviora login, guest portal, staff admin portal, resort sign in',
  },
  '/signup': {
    title: 'Create Guest Profile | Aviora Privilege Membership',
    description:
      'Join Aviora Privilege for instant booking confirmations, bespoke concierge requests, and elite member privileges.',
    keywords: 'Aviora signup, create guest account, member registration, luxury resort privileges',
  },
  '/admin': {
    title: 'Resort Operations & Administration Console | Aviora Resort',
    description:
      'Administrative console for managing occupancy KPIs, live guest reservations, check-in vouchers, and villa allocations.',
    keywords: 'Aviora admin, resort operations console, staff dashboard',
  },
};

export default function SEO() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const pageConfig = PAGE_SEO[currentPath] || DEFAULT_SEO;

    // 1. Update Document Title
    document.title = pageConfig.title;

    // 2. Helper to set or create meta tags
    const setMetaTag = (nameAttr, nameVal, contentVal) => {
      let meta = document.querySelector(`meta[${nameAttr}="${nameVal}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(nameAttr, nameVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', contentVal);
    };

    // 3. Update Standard Meta Tags
    setMetaTag('name', 'description', pageConfig.description);
    setMetaTag('name', 'keywords', pageConfig.keywords || DEFAULT_SEO.keywords);

    // 4. Update Open Graph Meta Tags
    setMetaTag('property', 'og:title', pageConfig.title);
    setMetaTag('property', 'og:description', pageConfig.description);
    setMetaTag('property', 'og:url', `https://aviora-resort.com${currentPath}`);
    setMetaTag('property', 'og:image', pageConfig.image || DEFAULT_SEO.image);
    setMetaTag('property', 'og:type', pageConfig.type || 'website');

    // 5. Update Twitter Card Meta Tags
    setMetaTag('name', 'twitter:title', pageConfig.title);
    setMetaTag('name', 'twitter:description', pageConfig.description);
    setMetaTag('name', 'twitter:image', pageConfig.image || DEFAULT_SEO.image);

    // 6. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://aviora-resort.com${currentPath}`);
  }, [location.pathname]);

  return null;
}
