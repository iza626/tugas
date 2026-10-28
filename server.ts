import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'portiva_db.json');

app.use(express.json());

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// SSE Clients for Real-Time Broadcasting
type SSEClient = {
  id: string;
  res: Response;
};
let sseClients: SSEClient[] = [];

function broadcastEvent(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch (err) {
      // client disconnected
    }
  });
}

// Memory database types
interface DBData {
  admins: any[];
  ships: any[];
  ports: any[];
  passengers: any[];
  cargo_types: any[];
  customers: any[];
  voyages: any[];
  passenger_transactions: any[];
  cargo_transactions: any[];
  manifests: any[];
  audit_logs: any[];
}

function getInitialData(): DBData {
  const passwordHash = bcrypt.hashSync('Admin123!Portiva', 10);
  const now = new Date().toISOString();

  return {
    admins: [
      {
        id: 'adm-001',
        username: 'admin',
        email: 'admin@portiva.co.id',
        full_name: 'Capt. Hendra Wicaksono',
        role: 'Super Admin',
        password_hash: passwordHash,
        created_at: now,
      },
      {
        id: 'adm-002',
        username: 'operator',
        email: 'operator@portiva.co.id',
        full_name: 'Dewi Anggraini, S.T.',
        role: 'Operator Pelabuhan',
        password_hash: passwordHash,
        created_at: now,
      },
    ],
    ships: [
      {
        id: 'SHP-001',
        name: 'KM Samudera Mandiri IX',
        imo_number: '9248102',
        ship_type: 'Roll-on/Roll-off (Ro-Ro)',
        flag: 'Indonesia (ID)',
        gt: 14500,
        dwt: 6800,
        passenger_capacity: 850,
        cargo_capacity: 4500,
        build_year: 2018,
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'SHP-002',
        name: 'KM Nusantara Express',
        imo_number: '9312457',
        ship_type: 'Container Ship',
        flag: 'Indonesia (ID)',
        gt: 22000,
        dwt: 18500,
        passenger_capacity: 0,
        cargo_capacity: 15000,
        build_year: 2020,
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'SHP-003',
        name: 'KM Pelni Baruna Jaya',
        imo_number: '9187345',
        ship_type: 'Kapal Penumpang & Muatan',
        flag: 'Indonesia (ID)',
        gt: 12800,
        dwt: 5200,
        passenger_capacity: 1200,
        cargo_capacity: 2800,
        build_year: 2016,
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'SHP-004',
        name: 'TB Maritim Perkasa 02',
        imo_number: '9456123',
        ship_type: 'General Cargo',
        flag: 'Indonesia (ID)',
        gt: 8500,
        dwt: 7200,
        passenger_capacity: 0,
        cargo_capacity: 6800,
        build_year: 2015,
        status: 'Maintenance',
        created_at: now,
        updated_at: now,
      },
    ],
    ports: [
      {
        id: 'PRT-001',
        name: 'Tanjung Priok',
        port_code: 'IDTPP',
        city: 'Jakarta Utara',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        port_type: 'Pelabuhan Utama Internasional',
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'PRT-002',
        name: 'Tanjung Perak',
        port_code: 'IDSUB',
        city: 'Surabaya',
        province: 'Jawa Timur',
        country: 'Indonesia',
        port_type: 'Pelabuhan Utama Komersial',
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'PRT-003',
        name: 'Soekarno-Hatta Makassar',
        port_code: 'IDMAK',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        country: 'Indonesia',
        port_type: 'Pelabuhan Hub Regional',
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'PRT-004',
        name: 'Pelabuhan Belawan',
        port_code: 'IDBLW',
        city: 'Medan',
        province: 'Sumatera Utara',
        country: 'Indonesia',
        port_type: 'Pelabuhan Utama Komersial',
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'PRT-005',
        name: 'Pelabuhan Benoa',
        port_code: 'IDBOA',
        city: 'Denpasar',
        province: 'Bali',
        country: 'Indonesia',
        port_type: 'Pelabuhan Pariwisata & Penumpang',
        status: 'Aktif',
        created_at: now,
        updated_at: now,
      },
    ],
    passengers: [
      {
        id: 'PSG-001',
        full_name: 'Budi Santoso',
        identity_number: '3171051204850001',
        gender: 'Laki-laki',
        birth_date: '1985-04-12',
        phone: '081298457201',
        address: 'Jl. Melati No. 15, Kemayoran, Jakarta Pusat',
        nationality: 'Indonesia (WNI)',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'PSG-002',
        full_name: 'Siti Rahmawati',
        identity_number: '3578014508920003',
        gender: 'Perempuan',
        birth_date: '1992-08-15',
        phone: '081387654321',
        address: 'Jl. Rungkut Asri Blok C-4, Surabaya',
        nationality: 'Indonesia (WNI)',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'PSG-003',
        full_name: 'Ahmad Fauzan',
        identity_number: '7371102306900002',
        gender: 'Laki-laki',
        birth_date: '1990-06-23',
        phone: '085244556677',
        address: 'Jl. Urip Sumoharjo No. 88, Makassar',
        nationality: 'Indonesia (WNI)',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'PSG-004',
        full_name: 'Ratna Kusuma Wardani',
        identity_number: '3201086201950004',
        gender: 'Perempuan',
        birth_date: '1995-01-22',
        phone: '087811223344',
        address: 'Jl. Pajajaran No. 10, Bogor',
        nationality: 'Indonesia (WNI)',
        created_at: now,
        updated_at: now,
      },
    ],
    cargo_types: [
      {
        id: 'CRG-001',
        name: 'Kontainer Kering 20ft (FCL)',
        category: 'Container',
        unit: 'TEU / Box',
        description: 'Dry container standar muatan manufaktur & FMCG',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'CRG-002',
        name: 'Beras & Bahan Pokok Pangan',
        category: 'Bulk Cargo',
        unit: 'Ton',
        description: 'Beras karungan dalam palet kayu standar logistik pangan',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'CRG-003',
        name: 'Truk Ekspedisi Tronton 20T',
        category: 'Kendaraan',
        unit: 'Unit Kendaraan',
        description: 'Kendaraan logistik Ro-Ro antar pulau',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'CRG-004',
        name: 'Minyak Kelapa Sawit Mentah (CPO)',
        category: 'Liquid Cargo',
        unit: 'Kiloliter / Ton',
        description: 'Muatan curah cair tangki khusus',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'CRG-005',
        name: 'Suku Cadang & Mesin Industri',
        category: 'General Cargo',
        unit: 'Koli / Box',
        description: 'Spare part mesin pabrik bersertifikat',
        created_at: now,
        updated_at: now,
      },
    ],
    customers: [
      {
        id: 'CST-001',
        company_name: 'PT Samudera Logistik Nusantara',
        pic: 'Ir. Irwan Subagja',
        phone: '021-43908811',
        email: 'ops@samuderalogistik.co.id',
        address: 'Jl. Sulawesi No. 45, Pelabuhan Tanjung Priok, Jakarta Utara',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'CST-002',
        company_name: 'CV Berkah Pangan Mandiri',
        pic: 'Hj. Mardiah',
        phone: '031-7489201',
        email: 'distribusi@berkahpangan.com',
        address: 'Kawasan Pergudangan Margomulyo Indah B-12, Surabaya',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'CST-003',
        company_name: 'PT Borneo Agro Kencana',
        pic: 'Bambang Sudarsono',
        phone: '0541-765432',
        email: 'logistik@borneoagro.co.id',
        address: 'Jl. Gajah Mada No. 102, Pontianak',
        created_at: now,
        updated_at: now,
      },
    ],
    voyages: [
      {
        id: 'VYG-2026-001',
        voyage_number: 'VYG/PRIOK-PERAK/082',
        ship_id: 'SHP-001',
        origin_port_id: 'PRT-001',
        destination_port_id: 'PRT-002',
        departure_date: '2026-10-08',
        departure_time: '14:00',
        estimated_arrival: '2026-10-09 08:30',
        status: 'Scheduled',
        notes: 'Pelayaran reguler lintas Jawa bagian utara',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'VYG-2026-002',
        voyage_number: 'VYG/PERAK-MAKASSAR/041',
        ship_id: 'SHP-003',
        origin_port_id: 'PRT-002',
        destination_port_id: 'PRT-003',
        departure_date: '2026-10-07',
        departure_time: '09:00',
        estimated_arrival: '2026-10-08 17:00',
        status: 'Departed',
        notes: 'Kapal telah berlayar sesuai jadwal resmi',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'VYG-2026-003',
        voyage_number: 'VYG/PRIOK-BELAWAN/019',
        ship_id: 'SHP-002',
        origin_port_id: 'PRT-001',
        destination_port_id: 'PRT-004',
        departure_date: '2026-10-06',
        departure_time: '20:00',
        estimated_arrival: '2026-10-08 10:00',
        status: 'Arrived',
        notes: 'Kapal tiba di Belawan tanpa kendala cuaca',
        created_at: now,
        updated_at: now,
      },
    ],
    passenger_transactions: [
      {
        id: 'TRX-PSG-001',
        voyage_id: 'VYG-2026-001',
        passenger_id: 'PSG-001',
        ticket_number: 'TKT-2026-008201',
        class: 'Bisnis',
        transaction_date: '2026-10-06',
        payment_status: 'Paid',
        boarding_status: 'Paid',
        notes: 'Kabin dek 3 nomor B-14',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'TRX-PSG-002',
        voyage_id: 'VYG-2026-001',
        passenger_id: 'PSG-002',
        ticket_number: 'TKT-2026-008202',
        class: 'Ekonomi',
        transaction_date: '2026-10-06',
        payment_status: 'Paid',
        boarding_status: 'Booked',
        notes: 'Tiket dewasa + bagasi 20kg',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'TRX-PSG-003',
        voyage_id: 'VYG-2026-002',
        passenger_id: 'PSG-003',
        ticket_number: 'TKT-2026-004101',
        class: 'VIP',
        transaction_date: '2026-10-05',
        payment_status: 'Paid',
        boarding_status: 'Boarded',
        notes: 'Sudah melalui scanning gate Makassar',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'TRX-PSG-004',
        voyage_id: 'VYG-2026-002',
        passenger_id: 'PSG-004',
        ticket_number: 'TKT-2026-004102',
        class: 'Bisnis',
        transaction_date: '2026-10-05',
        payment_status: 'Paid',
        boarding_status: 'Boarded',
        notes: 'Boarding diverifikasi petugas',
        created_at: now,
        updated_at: now,
      },
    ],
    cargo_transactions: [
      {
        id: 'TRX-CRG-001',
        voyage_id: 'VYG-2026-001',
        customer_id: 'CST-001',
        cargo_type_id: 'CRG-001',
        item_name: 'Elektronik & Alat Rumah Tangga (FCL 20ft)',
        quantity: 4,
        unit: 'TEU / Box',
        weight_ton: 48.5,
        volume_m3: 132,
        loading_port_id: 'PRT-001',
        discharge_port_id: 'PRT-002',
        document_number: 'BL/SLN-PRIOK/2026/089',
        status: 'Loaded',
        notes: 'Muatan telah dimuat di hold 2',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'TRX-CRG-002',
        voyage_id: 'VYG-2026-001',
        customer_id: 'CST-002',
        cargo_type_id: 'CRG-002',
        item_name: 'Beras Premium Karung 50kg (Palet)',
        quantity: 50,
        unit: 'Ton',
        weight_ton: 50.0,
        volume_m3: 75,
        loading_port_id: 'PRT-001',
        discharge_port_id: 'PRT-002',
        document_number: 'BL/BPM-FOOD/2026/033',
        status: 'Booked',
        notes: 'Menunggu proses stowing crane',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'TRX-CRG-003',
        voyage_id: 'VYG-2026-002',
        customer_id: 'CST-001',
        cargo_type_id: 'CRG-003',
        item_name: 'Truk Ekspedisi Logistik Sembako',
        quantity: 6,
        unit: 'Unit Kendaraan',
        weight_ton: 120.0,
        volume_m3: 380,
        loading_port_id: 'PRT-002',
        discharge_port_id: 'PRT-003',
        document_number: 'BL/SLN-RORO/2026/112',
        status: 'On Board',
        notes: 'Kendaraan diikat (lashing) pada dek bawah',
        created_at: now,
        updated_at: now,
      },
    ],
    manifests: [
      {
        id: 'MNF-2026-001',
        manifest_number: 'MNF/PORTIVA/2026/001',
        voyage_id: 'VYG-2026-002',
        total_passengers: 2,
        total_cargo_items: 6,
        total_weight_ton: 120.0,
        total_volume_m3: 380,
        status: 'Certified',
        certified_by: 'Capt. Hendra Wicaksono (Syahbandar)',
        certified_at: '2026-10-07T08:30:00Z',
        qr_code_data: 'PORTIVA:MNF/PORTIVA/2026/001:VYG-2026-002:AUTH-VERIFIED',
        created_at: now,
        updated_at: now,
      },
    ],
    audit_logs: [
      {
        id: 'AUD-001',
        timestamp: now,
        user_name: 'Capt. Hendra Wicaksono',
        user_role: 'Super Admin',
        table_name: 'manifests',
        record_id: 'MNF-2026-001',
        action: 'CERTIFY',
        old_value: JSON.stringify({ status: 'Draft' }),
        new_value: JSON.stringify({
          status: 'Certified',
          certified_by: 'Capt. Hendra Wicaksono (Syahbandar)',
        }),
        details: 'Manifest pelayaran VYG-2026-002 resmi disahkan oleh Otoritas Syahbandar.',
      },
      {
        id: 'AUD-002',
        timestamp: now,
        user_name: 'Dewi Anggraini, S.T.',
        user_role: 'Operator Pelabuhan',
        table_name: 'cargo_transactions',
        record_id: 'TRX-CRG-001',
        action: 'UPDATE',
        old_value: JSON.stringify({ status: 'Booked' }),
        new_value: JSON.stringify({ status: 'Loaded' }),
        details: 'Status muatan elektronik diperbarui menjadi Loaded (Telah dimuat).',
      },
    ],
  };
}

// Database helper with atomic write
function readDB(): DBData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      saveDB(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, initializing fresh:', err);
    const initial = getInitialData();
    saveDB(initial);
    return initial;
  }
}

function saveDB(data: DBData) {
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

// Audit trail logging helper
function logAudit(
  userName: string,
  userRole: string,
  tableName: string,
  recordId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CERTIFY',
  oldValue: any,
  newValue: any,
  details: string
) {
  const db = readDB();
  const log = {
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user_name: userName || 'Admin System',
    user_role: userRole || 'Administrator',
    table_name: tableName,
    record_id: recordId,
    action,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    details,
  };
  db.audit_logs.unshift(log);
  // Keep last 500 audit logs
  if (db.audit_logs.length > 500) {
    db.audit_logs = db.audit_logs.slice(0, 500);
  }
  saveDB(db);
  broadcastEvent('AUDIT_LOG_ADDED', log);
  return log;
}

// Active Sessions Store
const activeSessions = new Map<string, { admin: any; expiresAt: number }>();

function authenticate(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Autentikasi dibutuhkan. Silakan login terlebih dahulu.' });
  }

  const token = authHeader.split('Bearer ')[1];
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ success: false, message: 'Sesi telah kedaluwarsa. Silakan login kembali.' });
  }

  (req as any).admin = session.admin;
  next();
}

// --- SSE Realtime Endpoint ---
app.get('/api/realtime/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = crypto.randomUUID();
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial connection acknowledgement
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username / Email dan Password wajib diisi!' });
  }

  const db = readDB();
  const admin = db.admins.find(
    (a) => a.username.toLowerCase() === username.toLowerCase() || a.email.toLowerCase() === username.toLowerCase()
  );

  if (!admin) {
    return res.status(401).json({ success: false, message: 'Username atau Email tidak terdaftar dalam sistem!' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Kata sandi (Password) yang Anda masukkan salah!' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  activeSessions.set(token, {
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
    },
    expiresAt: Date.now() + sessionDuration,
  });

  logAudit(
    admin.full_name,
    admin.role,
    'admins',
    admin.id,
    'UPDATE',
    null,
    { login: true },
    `Admin ${admin.full_name} (${admin.username}) berhasil masuk ke sistem PORTIVA.`
  );

  return res.json({
    success: true,
    message: 'Login berhasil! Selamat datang di PORTIVA.',
    token,
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
    },
  });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const admin = (req as any).admin;
  return res.json({ success: true, user: admin });
});

app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Berhasil logout dari sistem.' });
});

// --- DASHBOARD OVERVIEW STATS ---
app.get('/api/dashboard/stats', authenticate, (req: Request, res: Response) => {
  const db = readDB();

  const totalShips = db.ships.length;
  const activeShips = db.ships.filter((s) => s.status === 'Aktif').length;
  const maintenanceShips = db.ships.filter((s) => s.status === 'Maintenance').length;

  const totalPassengers = db.passenger_transactions.length;
  const boardedPassengers = db.passenger_transactions.filter((t) => t.boarding_status === 'Boarded').length;

  const totalCargoTrans = db.cargo_transactions.length;
  const totalCargoWeight = db.cargo_transactions.reduce((acc, c) => acc + (Number(c.weight_ton) || 0), 0);
  const totalCargoVolume = db.cargo_transactions.reduce((acc, c) => acc + (Number(c.volume_m3) || 0), 0);

  const totalVoyages = db.voyages.length;
  const departedVoyages = db.voyages.filter((v) => v.status === 'Departed').length;
  const arrivedVoyages = db.voyages.filter((v) => v.status === 'Arrived').length;
  const scheduledVoyages = db.voyages.filter((v) => v.status === 'Scheduled').length;

  const certifiedManifests = db.manifests.filter((m) => m.status === 'Certified').length;

  // Chart data: Passengers per voyage
  const passengersPerVoyage = db.voyages.slice(0, 6).map((v) => {
    const ship = db.ships.find((s) => s.id === v.ship_id);
    const count = db.passenger_transactions.filter((t) => t.voyage_id === v.id).length;
    return {
      voyage_id: v.id,
      voyage_number: v.voyage_number,
      ship_name: ship ? ship.name : 'Unknown',
      passenger_count: count,
    };
  });

  // Chart data: Cargo weight per voyage
  const cargoPerVoyage = db.voyages.slice(0, 6).map((v) => {
    const ship = db.ships.find((s) => s.id === v.ship_id);
    const weight = db.cargo_transactions
      .filter((c) => c.voyage_id === v.id)
      .reduce((sum, c) => sum + (Number(c.weight_ton) || 0), 0);
    return {
      voyage_id: v.id,
      voyage_number: v.voyage_number,
      ship_name: ship ? ship.name : 'Unknown',
      cargo_weight_ton: Math.round(weight * 10) / 10,
    };
  });

  return res.json({
    success: true,
    data: {
      totalShips,
      activeShips,
      maintenanceShips,
      totalPassengers,
      boardedPassengers,
      totalCargoTrans,
      totalCargoWeight: Math.round(totalCargoWeight * 10) / 10,
      totalCargoVolume: Math.round(totalCargoVolume * 10) / 10,
      totalVoyages,
      departedVoyages,
      arrivedVoyages,
      scheduledVoyages,
      certifiedManifests,
      passengersPerVoyage,
      cargoPerVoyage,
      recentVoyages: db.voyages.slice(0, 5),
    },
  });
});

// Generic CRUD Route Generator with Audit Trail & Realtime SSE
function setupCRUD(endpoint: string, entityKey: keyof DBData, idPrefix: string) {
  // GET ALL
  app.get(`/api/${endpoint}`, authenticate, (req: Request, res: Response) => {
    const db = readDB();
    return res.json({ success: true, data: db[entityKey] });
  });

  // GET ONE
  app.get(`/api/${endpoint}/:id`, authenticate, (req: Request, res: Response) => {
    const db = readDB();
    const item = (db[entityKey] as any[]).find((x: any) => x.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: `Data ${endpoint} tidak ditemukan.` });
    }
    return res.json({ success: true, data: item });
  });

  // CREATE
  app.post(`/api/${endpoint}`, authenticate, (req: Request, res: Response) => {
    const db = readDB();
    const admin = (req as any).admin;
    const now = new Date().toISOString();
    const newId = req.body.id || `${idPrefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const newItem = {
      ...req.body,
      id: newId,
      created_at: now,
      updated_at: now,
    };

    (db[entityKey] as any[]).unshift(newItem);
    saveDB(db);

    logAudit(
      admin?.full_name,
      admin?.role,
      entityKey,
      newId,
      'CREATE',
      null,
      newItem,
      `Menambahkan data baru pada ${endpoint}: ${newItem.name || newItem.voyage_number || newItem.full_name || newItem.ticket_number || newItem.manifest_number || newId}`
    );

    broadcastEvent(`${entityKey.toUpperCase()}_CREATED`, newItem);

    return res.status(201).json({
      success: true,
      message: `Data ${endpoint} berhasil ditambahkan ke database!`,
      data: newItem,
    });
  });

  // UPDATE
  app.put(`/api/${endpoint}/:id`, authenticate, (req: Request, res: Response) => {
    const db = readDB();
    const admin = (req as any).admin;
    const index = (db[entityKey] as any[]).findIndex((x: any) => x.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Data ${endpoint} tidak ditemukan.` });
    }

    const oldItem = (db[entityKey] as any[])[index];
    const updatedItem = {
      ...oldItem,
      ...req.body,
      id: oldItem.id, // preserve primary key
      updated_at: new Date().toISOString(),
    };

    (db[entityKey] as any[])[index] = updatedItem;
    saveDB(db);

    logAudit(
      admin?.full_name,
      admin?.role,
      entityKey,
      oldItem.id,
      'UPDATE',
      oldItem,
      updatedItem,
      `Memperbarui data ${endpoint} [${oldItem.id}]`
    );

    broadcastEvent(`${entityKey.toUpperCase()}_UPDATED`, updatedItem);

    return res.json({
      success: true,
      message: `Data ${endpoint} berhasil diperbarui!`,
      data: updatedItem,
    });
  });

  // DELETE
  app.delete(`/api/${endpoint}/:id`, authenticate, (req: Request, res: Response) => {
    const db = readDB();
    const admin = (req as any).admin;
    const index = (db[entityKey] as any[]).findIndex((x: any) => x.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Data ${endpoint} tidak ditemukan.` });
    }

    const removedItem = (db[entityKey] as any[])[index];

    // Relational Foreign Key Integrity Checks
    if (entityKey === 'ships') {
      const hasVoyages = db.voyages.some((v) => v.ship_id === removedItem.id);
      if (hasVoyages) {
        return res.status(400).json({
          success: false,
          message: 'Kapal tidak dapat dihapus karena masih terhubung dengan data Perjalanan Kapal aktif!',
        });
      }
    } else if (entityKey === 'ports') {
      const hasVoyages = db.voyages.some((v) => v.origin_port_id === removedItem.id || v.destination_port_id === removedItem.id);
      if (hasVoyages) {
        return res.status(400).json({
          success: false,
          message: 'Pelabuhan tidak dapat dihapus karena terdaftar sebagai pelabuhan asal/tujuan pada data Perjalanan Kapal!',
        });
      }
    } else if (entityKey === 'voyages') {
      const hasPassengers = db.passenger_transactions.some((p) => p.voyage_id === removedItem.id);
      const hasCargo = db.cargo_transactions.some((c) => c.voyage_id === removedItem.id);
      if (hasPassengers || hasCargo) {
        return res.status(400).json({
          success: false,
          message: 'Perjalanan tidak dapat dihapus karena sudah memiliki transaksi penumpang atau muatan!',
        });
      }
    }

    (db[entityKey] as any[]).splice(index, 1);
    saveDB(db);

    logAudit(
      admin?.full_name,
      admin?.role,
      entityKey,
      removedItem.id,
      'DELETE',
      removedItem,
      null,
      `Menghapus data ${endpoint} [${removedItem.id}]`
    );

    broadcastEvent(`${entityKey.toUpperCase()}_DELETED`, { id: removedItem.id });

    return res.json({
      success: true,
      message: `Data ${endpoint} berhasil dihapus dari database!`,
    });
  });
}

// Register CRUDs
setupCRUD('ships', 'ships', 'SHP');
setupCRUD('ports', 'ports', 'PRT');
setupCRUD('passengers', 'passengers', 'PSG');
setupCRUD('cargo-types', 'cargo_types', 'CRG');
setupCRUD('customers', 'customers', 'CST');
setupCRUD('voyages', 'voyages', 'VYG');
setupCRUD('passenger-transactions', 'passenger_transactions', 'TRX-PSG');
setupCRUD('cargo-transactions', 'cargo_transactions', 'TRX-CRG');
setupCRUD('manifests', 'manifests', 'MNF');

// --- SPECIAL MANIFEST CERTIFICATION ENDPOINT WITH QR CODE ---
app.post('/api/manifests/:id/certify', authenticate, (req: Request, res: Response) => {
  const db = readDB();
  const admin = (req as any).admin;
  const manifest = db.manifests.find((m) => m.id === req.params.id);

  if (!manifest) {
    return res.status(404).json({ success: false, message: 'Manifest tidak ditemukan.' });
  }

  const oldManifest = { ...manifest };
  manifest.status = 'Certified';
  manifest.certified_by = `${admin?.full_name || 'Petugas Syahbandar'} (${admin?.role || 'Admin'})`;
  manifest.certified_at = new Date().toISOString();
  manifest.updated_at = new Date().toISOString();

  // Create authoritative verification signature
  manifest.qr_code_data = `PORTIVA-AUTH:${manifest.manifest_number}:VOYAGE=${manifest.voyage_id}:CERTIFIED_BY=${manifest.certified_by}:TS=${manifest.certified_at}:SIG=${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  saveDB(db);

  logAudit(
    admin?.full_name,
    admin?.role,
    'manifests',
    manifest.id,
    'CERTIFY',
    oldManifest,
    manifest,
    `Manifest ${manifest.manifest_number} resmi DISAHKAN dengan kode verifikasi QR Syahbandar.`
  );

  broadcastEvent('MANIFEST_CERTIFIED', {
    manifest,
    message: `Manifest ${manifest.manifest_number} berhasil disahkan oleh ${manifest.certified_by}!`,
  });

  return res.json({
    success: true,
    message: `Manifest ${manifest.manifest_number} berhasil disahkan secara resmi!`,
    data: manifest,
  });
});

// --- MANIFEST DETAILS WITH EXPANDED RELATIONS ---
app.get('/api/manifests/voyage/:voyageId', authenticate, (req: Request, res: Response) => {
  const db = readDB();
  const voyageId = req.params.voyageId;
  const voyage = db.voyages.find((v) => v.id === voyageId);

  if (!voyage) {
    return res.status(404).json({ success: false, message: 'Perjalanan kapal tidak ditemukan.' });
  }

  const ship = db.ships.find((s) => s.id === voyage.ship_id);
  const originPort = db.ports.find((p) => p.id === voyage.origin_port_id);
  const destinationPort = db.ports.find((p) => p.id === voyage.destination_port_id);

  // Expand passengers
  const passengerTrans = db.passenger_transactions.filter((pt) => pt.voyage_id === voyageId);
  const passengers = passengerTrans.map((pt) => {
    const p = db.passengers.find((pass) => pass.id === pt.passenger_id);
    return {
      ...pt,
      passenger_details: p || null,
    };
  });

  // Expand cargo
  const cargoTrans = db.cargo_transactions.filter((ct) => ct.voyage_id === voyageId);
  const cargo = cargoTrans.map((ct) => {
    const customer = db.customers.find((c) => c.id === ct.customer_id);
    const cargoType = db.cargo_types.find((cty) => cty.id === ct.cargo_type_id);
    const loadPort = db.ports.find((p) => p.id === ct.loading_port_id);
    const disPort = db.ports.find((p) => p.id === ct.discharge_port_id);
    return {
      ...ct,
      customer_details: customer || null,
      cargo_type_details: cargoType || null,
      loading_port_details: loadPort || null,
      discharge_port_details: disPort || null,
    };
  });

  const totalWeight = cargo.reduce((sum, item) => sum + (Number(item.weight_ton) || 0), 0);
  const totalVolume = cargo.reduce((sum, item) => sum + (Number(item.volume_m3) || 0), 0);
  const totalPassengers = passengers.length;

  const existingManifest = db.manifests.find((m) => m.voyage_id === voyageId);

  return res.json({
    success: true,
    data: {
      voyage,
      ship,
      originPort,
      destinationPort,
      passengers,
      cargo,
      summary: {
        totalPassengers,
        totalCargoItems: cargo.length,
        totalWeightTon: Math.round(totalWeight * 10) / 10,
        totalVolumeM3: Math.round(totalVolume * 10) / 10,
      },
      manifest: existingManifest || null,
    },
  });
});

// --- UNIVERSAL QR CODE VERIFICATION LOOKUP (MANIFEST, PASSENGER, CARGO) ---
app.post('/api/manifests/verify-qr', authenticate, (req: Request, res: Response) => {
  const { qr_string } = req.body;
  if (!qr_string || typeof qr_string !== 'string') {
    return res.status(400).json({ success: false, message: 'Kode QR wajib disertakan!' });
  }

  const cleanQuery = qr_string.trim();
  const db = readDB();

  // 1. Check for Manifest
  const manifest = db.manifests.find(
    (m) =>
      m.qr_code_data === cleanQuery ||
      cleanQuery.includes(m.manifest_number) ||
      m.manifest_number.toLowerCase() === cleanQuery.toLowerCase() ||
      cleanQuery.includes(m.id)
  );

  if (manifest) {
    const voyage = db.voyages.find((v) => v.id === manifest.voyage_id);
    const ship = voyage ? db.ships.find((s) => s.id === voyage.ship_id) : null;
    const originPort = voyage ? db.ports.find((p) => p.id === voyage.origin_port_id) : null;
    const destPort = voyage ? db.ports.find((p) => p.id === voyage.destination_port_id) : null;

    return res.json({
      success: true,
      doc_type: 'MANIFEST',
      message: 'Dokumen Manifest Resmi Syahbandar Terverifikasi!',
      data: {
        doc_type: 'MANIFEST',
        manifest,
        voyage,
        ship,
        originPort,
        destPort,
      },
    });
  }

  // 2. Check for Passenger Ticket
  const ticket = db.passenger_transactions.find(
    (t) =>
      cleanQuery.includes(t.ticket_number) ||
      t.ticket_number.toLowerCase() === cleanQuery.toLowerCase() ||
      t.id === cleanQuery
  );

  if (ticket) {
    const passenger = db.passengers.find((p) => p.id === ticket.passenger_id);
    const voyage = db.voyages.find((v) => v.id === ticket.voyage_id);
    const ship = voyage ? db.ships.find((s) => s.id === voyage.ship_id) : null;
    const originPort = voyage ? db.ports.find((p) => p.id === voyage.origin_port_id) : null;
    const destPort = voyage ? db.ports.find((p) => p.id === voyage.destination_port_id) : null;

    return res.json({
      success: true,
      doc_type: 'PASSENGER_TICKET',
      message: 'Tiket Penumpang Resmi Terverifikasi!',
      data: {
        doc_type: 'PASSENGER_TICKET',
        ticket,
        passenger,
        voyage,
        ship,
        originPort,
        destPort,
      },
    });
  }

  // 3. Check for Cargo Transaction (Bill of Lading / Resi)
  const cargo = db.cargo_transactions.find(
    (c) =>
      cleanQuery.includes(c.document_number) ||
      c.document_number.toLowerCase() === cleanQuery.toLowerCase() ||
      c.id === cleanQuery
  );

  if (cargo) {
    const customer = db.customers.find((cust) => cust.id === cargo.customer_id);
    const cargoType = db.cargo_types.find((ct) => ct.id === cargo.cargo_type_id);
    const voyage = db.voyages.find((v) => v.id === cargo.voyage_id);
    const ship = voyage ? db.ships.find((s) => s.id === voyage.ship_id) : null;
    const loadPort = db.ports.find((p) => p.id === cargo.loading_port_id);
    const disPort = db.ports.find((p) => p.id === cargo.discharge_port_id);

    return res.json({
      success: true,
      doc_type: 'CARGO_DOCUMENT',
      message: 'Dokumen Muatan / Bill of Lading Terverifikasi!',
      data: {
        doc_type: 'CARGO_DOCUMENT',
        cargo,
        customer,
        cargoType,
        voyage,
        ship,
        loadingPort: loadPort,
        dischargePort: disPort,
      },
    });
  }

  return res.status(404).json({
    success: false,
    message: `Data tidak ditemukan untuk kode "${cleanQuery}". Pastikan kode QR merupakan Manifest, Tiket Penumpang, atau Dokumen Muatan PORTIVA.`,
  });
});

// Quick action: Update passenger boarding status directly from scanner
app.post('/api/verify-qr/check-in-passenger', authenticate, (req: Request, res: Response) => {
  const { ticket_id, new_status = 'Boarded' } = req.body;
  const db = readDB();
  const admin = (req as any).admin;
  const ticket = db.passenger_transactions.find((t) => t.id === ticket_id || t.ticket_number === ticket_id);

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Tiket penumpang tidak ditemukan.' });
  }

  const oldStatus = ticket.boarding_status;
  ticket.boarding_status = new_status;
  ticket.updated_at = new Date().toISOString();
  saveDB(db);

  logAudit(
    admin?.full_name,
    admin?.role,
    'passenger_transactions',
    ticket.id,
    'UPDATE',
    { boarding_status: oldStatus },
    { boarding_status: new_status },
    `Petugas memvalidasi boarding tiket ${ticket.ticket_number} menjadi ${new_status} via QR Scanner.`
  );

  broadcastEvent('PASSENGER_TRANSACTIONS_UPDATED', ticket);

  return res.json({
    success: true,
    message: `Status boarding tiket ${ticket.ticket_number} berhasil diubah menjadi ${new_status}!`,
    data: ticket,
  });
});

// Quick action: Update cargo status directly from scanner
app.post('/api/verify-qr/update-cargo-status', authenticate, (req: Request, res: Response) => {
  const { cargo_id, new_status = 'Loaded' } = req.body;
  const db = readDB();
  const admin = (req as any).admin;
  const cargo = db.cargo_transactions.find((c) => c.id === cargo_id || c.document_number === cargo_id);

  if (!cargo) {
    return res.status(404).json({ success: false, message: 'Dokumen muatan tidak ditemukan.' });
  }

  const oldStatus = cargo.status;
  cargo.status = new_status;
  cargo.updated_at = new Date().toISOString();
  saveDB(db);

  logAudit(
    admin?.full_name,
    admin?.role,
    'cargo_transactions',
    cargo.id,
    'UPDATE',
    { status: oldStatus },
    { status: new_status },
    `Status muatan B/L ${cargo.document_number} diperbarui menjadi ${new_status} via QR Scanner.`
  );

  broadcastEvent('CARGO_TRANSACTIONS_UPDATED', cargo);

  return res.json({
    success: true,
    message: `Status muatan ${cargo.item_name} berhasil diubah menjadi ${new_status}!`,
    data: cargo,
  });
});

// --- AUDIT TRAIL LOGS ROUTE ---
app.get('/api/audit-logs', authenticate, (req: Request, res: Response) => {
  const db = readDB();
  const { limit = '100', table_name } = req.query;

  let logs = db.audit_logs;
  if (table_name) {
    logs = logs.filter((l) => l.table_name === table_name);
  }

  const parsedLimit = parseInt(limit as string, 10) || 100;
  return res.json({ success: true, data: logs.slice(0, parsedLimit) });
});

// --- DATABASE DUMP & RELATIONS SCHEMA (SUPABASE EXPORT READY) ---
app.get('/api/database/schema-info', authenticate, (req: Request, res: Response) => {
  const db = readDB();
  const stats = {
    admins: db.admins.length,
    ships: db.ships.length,
    ports: db.ports.length,
    passengers: db.passengers.length,
    cargo_types: db.cargo_types.length,
    customers: db.customers.length,
    voyages: db.voyages.length,
    passenger_transactions: db.passenger_transactions.length,
    cargo_transactions: db.cargo_transactions.length,
    manifests: db.manifests.length,
    audit_logs: db.audit_logs.length,
  };

  return res.json({
    success: true,
    storage: 'Persistent File-backed Relational Engine with Atomic Sync',
    database_file: DB_FILE,
    is_real_database: true,
    realtime_stream: 'Active Server-Sent Events (SSE)',
    stats,
  });
});

// Setup Vite development server middlewares or serve production dist
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV !== 'production' && !hasDist) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PORTIVA Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
