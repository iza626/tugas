export type ShipStatus = 'Aktif' | 'Tidak Aktif' | 'Maintenance';
export type PortStatus = 'Aktif' | 'Non-Aktif';
export type Gender = 'Laki-laki' | 'Perempuan';
export type CargoCategory =
  | 'General Cargo'
  | 'Container'
  | 'Bulk Cargo'
  | 'Liquid Cargo'
  | 'Dangerous Goods'
  | 'Kendaraan'
  | 'Lainnya';

export type VoyageStatus = 'Scheduled' | 'Boarding' | 'Departed' | 'Arrived' | 'Cancelled';
export type TicketClass = 'Ekonomi' | 'Bisnis' | 'VIP' | 'First Class';
export type PaymentStatus = 'Unpaid' | 'Paid';
export type BoardingStatus = 'Booked' | 'Paid' | 'Boarded' | 'Cancelled';
export type CargoStatus = 'Booked' | 'Loaded' | 'On Board' | 'Discharged' | 'Cancelled';
export type ManifestStatus = 'Draft' | 'Validated' | 'Certified' | 'Revoked';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface Ship {
  id: string;
  name: string;
  imo_number: string;
  ship_type: string;
  flag: string;
  gt: number;
  dwt: number;
  passenger_capacity: number;
  cargo_capacity: number;
  build_year: number;
  status: ShipStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Port {
  id: string;
  name: string;
  port_code: string;
  city: string;
  province: string;
  country: string;
  port_type: string;
  status: PortStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Passenger {
  id: string;
  full_name: string;
  identity_number: string;
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
  unit: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  company_name: string;
  pic: string;
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
  status: VoyageStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PassengerTransaction {
  id: string;
  voyage_id: string;
  passenger_id: string;
  ticket_number: string;
  class: TicketClass;
  transaction_date: string;
  payment_status: PaymentStatus;
  boarding_status: BoardingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  volume_m3: number;
  loading_port_id: string;
  discharge_port_id: string;
  document_number: string; // Bill of Lading / Resi
  status: CargoStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  customer_details?: Customer;
  cargo_type_details?: CargoType;
  loading_port_details?: Port;
  discharge_port_details?: Port;
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
  qr_code_data?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CERTIFY';
  old_value: string | null;
  new_value: string | null;
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
  passengersPerVoyage: Array<{
    voyage_id: string;
    voyage_number: string;
    ship_name: string;
    passenger_count: number;
  }>;
  cargoPerVoyage: Array<{
    voyage_id: string;
    voyage_number: string;
    ship_name: string;
    cargo_weight_ton: number;
  }>;
  recentVoyages: Voyage[];
}

export interface RealtimeToast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}
