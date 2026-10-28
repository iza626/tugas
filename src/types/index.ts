export type ShipStatus = 'Aktif' | 'Tidak Aktif' | 'Maintenance';
export type PortStatus = 'Aktif' | 'Non-Aktif';
export type Gender = 'Laki-laki' | 'Perempuan';
export type CargoCategory =
  | 'General Cargo'
  | 'Container'
  | 'Bulk Cargo'
  | 'Liquid Bulk'
  | 'Dangerous Goods (DG)'
  | 'Perishable / Reefer';

export type VoyageStatus = 'Scheduled' | 'Boarding' | 'Departed' | 'Arrived' | 'Cancelled';
export type TicketClass = 'Ekonomi' | 'Bisnis' | 'VIP';
export type PaymentStatus = 'Paid' | 'Pending' | 'Cancelled';
export type BoardingStatus = 'Booked' | 'Checked-in' | 'Boarded' | 'Paid' | 'Cancelled';
export type CargoStatus = 'Booked' | 'Loaded' | 'In Transit' | 'On Board' | 'Discharged' | 'Completed' | 'Cancelled';
export type ManifestStatus = 'Draft' | 'Certified' | 'Archived';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'Super Admin' | 'Operator Pelabuhan' | 'Syahbandar' | 'Staff Logistik';
  avatar?: string;
}

export interface Ship {
  id: string;
  name: string;
  imo_number: string;
  ship_type: string;
  flag: string;
  gt: number; // Gross Tonnage
  dwt: number; // Deadweight Tonnage
  passenger_capacity: number;
  cargo_capacity: number; // in Ton
  build_year: number;
  status: ShipStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Port {
  id: string;
  name: string;
  code: string;
  port_code?: string;
  city: string;
  province: string;
  country: string;
  port_type: 'Pelabuhan Utama' | 'Pelabuhan Pengumpul' | 'Pelabuhan Pengumpan' | 'Terminal Khusus' | 'Pelabuhan Komersial' | string;
  status: PortStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Passenger {
  id: string;
  full_name: string;
  id_number: string; // NIK or Passport
  identity_number?: string;
  gender: Gender;
  birth_date: string;
  phone: string;
  address: string;
  nationality: string;
  created_at?: string;
  updated_at?: string;
}

export interface CargoType {
  id: string;
  name: string;
  category: CargoCategory;
  unit: string; // e.g. Ton, M3, TEU, Pallet
  notes?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  company_name: string;
  pic_name: string;
  pic?: string;
  phone: string;
  email: string;
  address: string;
  created_at?: string;
  updated_at?: string;
}

export interface Voyage {
  id: string;
  voyage_number: string;
  ship_id: string;
  origin_port_id: string;
  destination_port_id: string;
  departure_date: string;
  departure_time: string;
  estimated_arrival: string;
  actual_arrival?: string;
  status: VoyageStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // joined fields (optional)
  ship?: Ship;
  origin_port?: Port;
  destination_port?: Port;
}

export interface PassengerTransaction {
  id: string;
  voyage_id: string;
  passenger_id: string;
  ticket_number: string;
  class: TicketClass;
  seat_number?: string;
  fare?: number;
  transaction_date: string;
  payment_status: PaymentStatus;
  boarding_status: BoardingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // joined fields
  passenger?: Passenger;
  voyage?: Voyage;
  passenger_details?: Passenger;
}

export interface CargoTransaction {
  id: string;
  voyage_id: string;
  customer_id: string;
  cargo_type_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  weight_ton: number;
  volume_m3?: number;
  loading_port_id: string;
  discharge_port_id: string;
  document_number: string; // BL / Resi / Tracking
  fee?: number;
  status: CargoStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // joined fields
  customer?: Customer;
  cargo_type?: CargoType;
  voyage?: Voyage;
  customer_details?: Customer;
  cargo_type_details?: CargoType;
}

export interface Manifest {
  id: string;
  manifest_number: string;
  voyage_id: string;
  total_passengers: number;
  total_cargo_items: number;
  total_weight_ton: number;
  total_volume_m3: number;
  status: ManifestStatus;
  certified_by?: string;
  certified_at?: string;
  qr_code_data: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // joined
  voyage?: Voyage;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CERTIFY' | 'LOGIN';
  old_value?: any;
  new_value?: any;
  details: string;
}

export interface DashboardStats {
  totalShips: number;
  activeShips: number;
  maintenanceShips: number;
  totalPassengers: number;
  boardedPassengers: number;
  totalCargoTrans: number;
  totalCargoWeight: number;
  totalCargoVolume: number;
  totalVoyages: number;
  departedVoyages: number;
  arrivedVoyages: number;
  scheduledVoyages: number;
  certifiedManifests: number;
  passengersPerVoyage: {
    voyage_id: string;
    voyage_number: string;
    ship_name: string;
    passenger_count: number;
  }[];
  cargoPerVoyage: {
    voyage_id: string;
    voyage_number: string;
    ship_name: string;
    cargo_weight_ton: number;
  }[];
  recentVoyages: Voyage[];
}

export interface RealtimeToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

// User Profile for Firebase Auth
export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}
