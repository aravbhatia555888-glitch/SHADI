import { Vendor } from '@/schemas/wedding';

export const vendors: Vendor[] = [
  {
    id: '1',
    name: 'Royal Palace Banquet',
    category: 'Venue',
    description: 'Luxury wedding venue with modern amenities and traditional charm. Perfect for grand celebrations with state-of-the-art facilities and expert event management team.',
    location: {
      address: 'Royal Palace Complex, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400058',
      latitude: 19.1136,
      longitude: 72.8697
    },
    rating: 4.8,
    reviewCount: 156,
    priceRange: '₹2,00,000 - ₹5,00,000',
    minPrice: 200000,
    maxPrice: 500000,
    coverImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
    photos: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
      'https://images.unsplash.com/photo-1519741497674-611481863552'
    ],
    completedBookings: 200,
    gallery: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
      'https://images.unsplash.com/photo-1519741497674-611481863552'
    ],
    contact: {
      phone: '+91 98765 43210',
      email: 'info@royalpalace.com',
      website: 'https://www.royalpalace.com'
    },
    features: [
      {
        id: 'f1',
        title: 'Spacious Halls',
        description: 'Multiple halls with varying capacities from 100 to 1000 guests'
      },
      {
        id: 'f2',
        title: 'Modern Amenities',
        description: 'State-of-the-art sound system, lighting, and climate control'
      }
    ],
    services: [
      {
        id: 's1',
        title: 'Indoor & Outdoor Venues',
        included: true
      },
      {
        id: 's2',
        title: 'Catering Services',
        included: true
      },
      {
        id: 's3',
        title: 'Decoration',
        included: true
      }
    ],
    packages: [
      {
        id: 'p1',
        title: 'Basic Package',
        price: '₹2,00,000',
        features: ['Venue rental', 'Basic decoration', 'Sound system']
      },
      {
        id: 'p2',
        title: 'Premium Package',
        price: '₹5,00,000',
        features: ['Venue rental', 'Premium decoration', 'Sound system', 'Catering', 'Valet parking']
      }
    ],
    availability: [
      {
        date: '2024-06-15T00:00:00.000Z',
        isAvailable: true,
        timeSlots: [
          { startTime: '09:00', endTime: '13:00', isBooked: false },
          { startTime: '18:00', endTime: '23:00', isBooked: false }
        ]
      }
    ],
    isAvailable: true,
    featured: true,
    verified: true,
    businessHours: {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-18:00',
      saturday: '09:00-20:00',
      sunday: '10:00-16:00'
    }
  },
  {
    id: '2',
    name: 'Mehendi Magic by Priya',
    category: 'Mehendi Artist',
    description: 'Award-winning mehendi artist specializing in intricate bridal designs with over 10 years of experience in creating stunning traditional and contemporary patterns.',
    location: {
      address: 'Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110001',
      latitude: 28.6139,
      longitude: 77.2090
    },
    rating: 4.9,
    reviewCount: 243,
    priceRange: '₹15,000 - ₹50,000',
    minPrice: 15000,
    maxPrice: 50000,
    coverImage: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74',
    photos: [
      'https://images.unsplash.com/photo-1619451334792-150fd785ee74',
      'https://images.unsplash.com/photo-1619451334915-9c0cfb0b0c0d',
      'https://images.unsplash.com/photo-1619451334899-c0a06b0b33e7'
    ],
    completedBookings: 500,
    gallery: [
      'https://images.unsplash.com/photo-1619451334792-150fd785ee74',
      'https://images.unsplash.com/photo-1619451334915-9c0cfb0b0c0d',
      'https://images.unsplash.com/photo-1619451334899-c0a06b0b33e7'
    ],
    contact: {
      phone: '+91 98765 43211',
      email: 'priya@mehendimagic.com',
      website: 'https://www.mehendimagic.com'
    },
    features: [
      {
        id: 'f1',
        title: 'Natural Henna',
        description: 'Pure organic henna paste for long-lasting color'
      },
      {
        id: 'f2',
        title: 'Custom Designs',
        description: 'Personalized patterns based on your preferences'
      }
    ],
    services: [
      {
        id: 's1',
        title: 'Bridal Mehendi',
        included: true
      },
      {
        id: 's2',
        title: 'Family Mehendi',
        included: true
      },
      {
        id: 's3',
        title: 'Arabic Design',
        included: true
      }
    ],
    packages: [
      {
        id: 'p1',
        title: 'Basic Bridal',
        price: '₹15,000',
        features: ['Hands front and back', 'Feet design', 'Touch-up service']
      },
      {
        id: 'p2',
        title: 'Premium Bridal',
        price: '₹50,000',
        features: ['Full hands and feet', 'Family members mehendi', 'Touch-up service', 'Natural henna']
      }
    ],
    availability: [
      {
        date: '2024-06-16T00:00:00.000Z',
        isAvailable: true,
        timeSlots: [
          { startTime: '10:00', endTime: '14:00', isBooked: false },
          { startTime: '16:00', endTime: '20:00', isBooked: false }
        ]
      }
    ],
    isAvailable: true,
    featured: true,
    verified: true,
    businessHours: {
      monday: '10:00-18:00',
      tuesday: '10:00-18:00',
      wednesday: '10:00-18:00',
      thursday: '10:00-18:00',
      friday: '10:00-18:00',
      saturday: '09:00-20:00',
      sunday: '12:00-17:00'
    }
  },
  {
    id: '3',
    name: 'Glamour Photography',
    category: 'Photography',
    description: 'Capturing your special moments with artistic excellence. Our team of professional photographers specializes in candid photography and cinematic wedding films.',
    location: {
      address: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560034',
      latitude: 12.9352,
      longitude: 77.6245
    },
    rating: 4.7,
    reviewCount: 189,
    priceRange: '₹1,00,000 - ₹3,00,000',
    minPrice: 100000,
    maxPrice: 300000,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552',
    photos: [
      'https://images.unsplash.com/photo-1519741497674-611481863552',
      'https://images.unsplash.com/photo-1519741497674-611481863553',
      'https://images.unsplash.com/photo-1519741497674-611481863554'
    ],
    completedBookings: 300,
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552',
      'https://images.unsplash.com/photo-1519741497674-611481863553',
      'https://images.unsplash.com/photo-1519741497674-611481863554'
    ],
    contact: {
      phone: '+91 98765 43212',
      email: 'info@glamourphotography.com',
      website: 'https://www.glamourphotography.com'
    },
    features: [
      {
        id: 'f1',
        title: 'Professional Team',
        description: 'Team of experienced photographers and cinematographers'
      },
      {
        id: 'f2',
        title: 'High-End Equipment',
        description: 'Latest cameras and drones for stunning shots'
      }
    ],
    services: [
      {
        id: 's1',
        title: 'Pre-wedding Shoot',
        included: true
      },
      {
        id: 's2',
        title: 'Wedding Photography',
        included: true
      },
      {
        id: 's3',
        title: 'Cinematic Films',
        included: true
      }
    ],
    packages: [
      {
        id: 'p1',
        title: 'Basic Photography',
        price: '₹1,00,000',
        features: ['Candid photography', 'Traditional photography', 'Photo album']
      },
      {
        id: 'p2',
        title: 'Premium Photography',
        price: '₹3,00,000',
        features: ['Cinematic wedding film', 'Drone shots', 'Photo album', 'Pre-wedding shoot']
      }
    ],
    availability: [
      {
        date: '2024-06-17T00:00:00.000Z',
        isAvailable: true,
        timeSlots: [
          { startTime: '08:00', endTime: '18:00', isBooked: false }
        ]
      }
    ],
    isAvailable: true,
    featured: true,
    verified: true,
    businessHours: {
      monday: '08:00-19:00',
      tuesday: '08:00-19:00',
      wednesday: '08:00-19:00',
      thursday: '08:00-19:00',
      friday: '08:00-19:00',
      saturday: '07:00-21:00',
      sunday: '09:00-18:00'
    }
  },
  {
    id: '4',
    name: 'Divine Decorators',
    category: 'Decoration',
    description: 'Creating magical wedding settings with innovative themes. Specializing in both traditional and contemporary decoration styles with attention to detail.',
    location: {
      address: 'Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500034',
      latitude: 17.4065,
      longitude: 78.4772
    },
    rating: 4.6,
    reviewCount: 134,
    priceRange: '₹1,00,000 - ₹3,00,000',
    minPrice: 100000,
    maxPrice: 300000,
    coverImage: 'https://images.unsplash.com/photo-1519654793190-2e8a4806f1f2',
    photos: [
      'https://images.unsplash.com/photo-1519654793190-2e8a4806f1f2',
      'https://images.unsplash.com/photo-1519654793191-2e8a4806f1f3',
      'https://images.unsplash.com/photo-1519654793192-2e8a4806f1f4'
    ],
    completedBookings: 250,
    gallery: [
      'https://images.unsplash.com/photo-1519654793190-2e8a4806f1f2',
      'https://images.unsplash.com/photo-1519654793191-2e8a4806f1f3',
      'https://images.unsplash.com/photo-1519654793192-2e8a4806f1f4'
    ],
    contact: {
      phone: '+91 98765 43213',
      email: 'info@divinedecorators.com',
      website: 'https://www.divinedecorators.com'
    },
    features: [
      {
        id: 'f1',
        title: 'Theme Expertise',
        description: 'Wide range of wedding themes and customization options'
      },
      {
        id: 'f2',
        title: 'Quality Materials',
        description: 'Premium flowers and decorative items'
      }
    ],
    services: [
      {
        id: 's1',
        title: 'Floral Decoration',
        included: true
      },
      {
        id: 's2',
        title: 'Lighting Setup',
        included: true
      },
      {
        id: 's3',
        title: 'Theme Decoration',
        included: true
      }
    ],
    packages: [
      {
        id: 'p1',
        title: 'Basic Decoration',
        price: '₹1,00,000',
        features: ['Entrance decoration', 'Stage setup', 'Basic lighting']
      },
      {
        id: 'p2',
        title: 'Premium Decoration',
        price: '₹3,00,000',
        features: ['Complete venue decoration', 'Premium flowers', 'Advanced lighting', 'Theme customization']
      }
    ],
    availability: [
      {
        date: '2024-06-18T00:00:00.000Z',
        isAvailable: true,
        timeSlots: [
          { startTime: '06:00', endTime: '22:00', isBooked: false }
        ]
      }
    ],
    isAvailable: true,
    featured: false,
    verified: true,
    businessHours: {
      monday: '06:00-22:00',
      tuesday: '06:00-22:00',
      wednesday: '06:00-22:00',
      thursday: '06:00-22:00',
      friday: '06:00-22:00',
      saturday: '05:00-23:00',
      sunday: '07:00-21:00'
    }
  }
];