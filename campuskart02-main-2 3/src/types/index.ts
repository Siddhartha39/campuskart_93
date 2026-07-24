export interface User {
  uid: string;
  name: string;
  email: string;
  city: string;
  college: string;
  mobile: string;
  bio?: string;
  profilePhoto?: string;
  campusId?: string;
  campusProfile?: {
    id: string;
    avatarUrl?: string | null;
  };
  followers: string[];
  following: string[];
  createdAt: string;
  holidayMode?: {
    isActive: boolean;
    fromDate: string;
    toDate: string;
    activatedAt?: number;
    deactivatedAt?: number;
  };
}

export interface Item {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerCollege: string;
  sellerMobile?: string;
  productName: string;
  productImage: string;
  productImages?: string[];
  type: string;
  price: number;
  category: 'gadgets' | 'books' | 'stationary' | 'other';
  condition: 'new' | 'like new' | 'used';
  showMobileNumber: boolean;
  description: string;
  isActive: boolean;
  isSold: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  college: string;
  organizer: string;
  image: string;
  registrationUrl?: string;
  city?: string;
  openToAllCollege?: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Offer {
  id: string;
  itemId: string;
  buyerId: string;
  buyerName: string;
  offerPrice: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface PlacementCompany {
  id: string;
  companyName: string;
  description: string;
  jobDescription: string;
  eligibility: string;
  skills: string[];
  salary: string;
  location: string;
  selectionProcess?: string;
  lastDate: string;
  website?: string;
  applyLink?: string;
  logoUrl?: string;
  bannerUrl?: string;
  imageLink?: string;
  isFeatured: boolean;
  isHiringOpen: boolean;
  type: 'Internship' | 'Placement';
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  aiSummary?: string;
  aiKeywords?: string[];
  aiScore?: number;
}

export interface PlacementApplication {
  id: string;
  userId: string;
  placementId: string;
  companyName: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'accepted';
  appliedAt: string;
}
