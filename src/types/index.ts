export type Role = 'USER' | 'SPECIALIST' | 'COMPANY' | 'SUPPLIER' | 'MANUFACTURER' | 'ADMIN';

export type SpecialistType = 'MANAGER' | 'DESIGNER' | 'TECHNOLOGIST' | 'INSTALLER' | 'OTHER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  inn: string | null;
  phone: string | null;
  createdAt: string;
}

export interface Image {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  style: string | null;
  category: string | null;
  tags: string[];
  downloads: number;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  category: string;
  fileType: string;
  downloads: number;
  createdAt: string;
}

export interface Reference {
  id: string;
  title: string;
  description: string | null;
  content: Record<string, string[]>;
  category: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  categories: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface Specialist {
  id: string;
  type: SpecialistType;
  description: string | null;
  experience: number | null;
  portfolio: string | null;
  rating: number;
  user: {
    name: string | null;
    email: string;
  };
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string[];
  category: string;
  companyId: string | null;
  supplierId: string | null;
}
