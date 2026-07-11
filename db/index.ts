import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { schema } from './schema';

// Provide a fallback JWT_SECRET so the application doesn't crash on start
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dummy-jwt-secret-for-local-demo-development-purposes';

const connectionString = process.env.DATABASE_URL;

let poolInstance: any;
let dbInstance: any;

if (!connectionString) {
  console.warn('⚠️ Warning: DATABASE_URL is not defined. Running database in DEMO/MOCK mode.');
  
  // Mock PostgreSQL Pool query method
  poolInstance = {
    query: async (sql: string, params: any[]) => {
      console.log('🔍 [Mock Pool Query]:', sql, params);
      if (sql.includes('COUNT(*)')) {
        return { rows: [{ count: '3' }] };
      }
      return { rows: [] };
    },
    connect: async () => {
      return {
        query: async () => ({ rows: [] }),
        release: () => {}
      };
    }
  };

  // Helper to find email or values recursively
  const findEmail = (obj: any, visited = new Set()): string | null => {
    if (typeof obj === 'string' && obj.includes('@')) {
      return obj;
    }
    if (obj && typeof obj === 'object') {
      if (visited.has(obj)) return null;
      visited.add(obj);
      try {
        for (const key in obj) {
          const found = findEmail(obj[key], visited);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  };

  const getMockResponse = (chain: string[], argsCollected: any[]) => {
    const email = findEmail(argsCollected);
    console.log('🔍 [Mock DB Request] Table/Chain:', chain, 'Email parameter:', email);

    if (chain.includes('users') || chain.includes('staff')) {
      const role = email?.split('@')[0] || 'clinic_admin';
      return [
        {
          id: 'mock-user-id',
          email: email || 'admin@clinic.com',
          name: role === 'doctor' ? 'د. محمد علي' : role === 'receptionist' ? 'سارة أحمد' : 'أحمد محمد',
          passwordHash: '$2b$10$fMSRr5m.aQGNwNOb1BeIu.OtE7E4barWgC2e84xjl7o8XX/gG64Oi', // password123
          role: role === 'doctor' || role === 'receptionist' || role === 'super_admin' ? role : 'clinic_admin',
          clinicId: 'mock-clinic-id',
          isActive: true,
          deletedAt: null,
          permissions: {
            appointments: ['view', 'create', 'edit', 'delete'],
            patients: ['view', 'create', 'edit', 'delete'],
            medical_records: ['view', 'create', 'edit', 'delete'],
            prescriptions: ['view', 'create', 'edit', 'delete'],
            invoices: ['view', 'create', 'edit', 'delete'],
            finance: ['view', 'create', 'edit', 'delete'],
            staff_management: ['view', 'create', 'edit', 'delete'],
            departments: ['view', 'create', 'edit', 'delete'],
          }
        }
      ];
    }

    if (chain.includes('clinics')) {
      return [
        {
          id: 'mock-clinic-id',
          name: 'عيادة الشفاء النموذجية',
          slug: 'shifa',
          facilityType: 'single_clinic',
          edition: 'pro',
          isActive: true,
          enabledModules: [
            'appointments',
            'patients',
            'medical_records',
            'prescriptions',
            'invoices',
            'payments',
            'specialties',
            'calendar',
            'schedule',
            'live-monitor',
            'staff_management',
            'departments',
            'lab_results',
            'radiology_images',
            'medical_documents'
          ],
          config: {},
          createdAt: new Date().toISOString()
        }
      ];
    }

    if (chain.includes('specialties')) {
      return [
        { id: 'spec-1', name: 'الطب العام', code: 'general', isActive: true, clinicId: 'mock-clinic-id' },
        { id: 'spec-2', name: 'طب الأطفال', code: 'pediatric', isActive: true, clinicId: 'mock-clinic-id' },
        { id: 'spec-3', name: 'طب الأسنان', code: 'dentist', isActive: true, clinicId: 'mock-clinic-id' },
        { id: 'spec-4', name: 'أمراض القلب', code: 'cardiology', isActive: true, clinicId: 'mock-clinic-id' }
      ];
    }

    if (chain.includes('departments')) {
      return [
        { id: 'dept-1', name: 'قسم العيادات الخارجية', isActive: true, clinicId: 'mock-clinic-id' },
        { id: 'dept-2', name: 'قسم الطوارئ', isActive: true, clinicId: 'mock-clinic-id' }
      ];
    }

    if (chain.includes('patients')) {
      return [
        { id: 'pat-1', fullName: 'عبدالرحمن محمد علي', phone: '+201012345678', email: 'abdulrahman@test.com', isActive: true, createdAt: new Date().toISOString() },
        { id: 'pat-2', fullName: 'فاطمة الزهراء عبدالله', phone: '+201112345679', email: 'fatima@test.com', isActive: true, createdAt: new Date().toISOString() },
        { id: 'pat-3', fullName: 'يوسف عمر حسن', phone: '+201212345680', email: 'youssef@test.com', isActive: true, createdAt: new Date().toISOString() },
        { id: 'pat-4', fullName: 'سارة خالد محمود', phone: '+201512345681', email: 'sara@test.com', isActive: true, createdAt: new Date().toISOString() }
      ];
    }

    if (chain.includes('appointments')) {
      return [
        {
          id: 'apt-1',
          clinicId: 'mock-clinic-id',
          doctorId: 'doc-1',
          patientId: 'pat-1',
          patientName: 'عبدالرحمن محمد علي',
          doctorName: 'د. محمد علي',
          appointmentDate: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '09:30',
          status: 'confirmed',
          priority: 'normal',
          notes: 'متابعة دورية',
          createdAt: new Date().toISOString()
        },
        {
          id: 'apt-2',
          clinicId: 'mock-clinic-id',
          doctorId: 'doc-1',
          patientId: 'pat-2',
          patientName: 'فاطمة الزهراء عبدالله',
          doctorName: 'د. محمد علي',
          appointmentDate: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '10:30',
          status: 'in-waiting-room',
          priority: 'emergency',
          notes: 'حالة مستعجلة - ارتفاع حرارة',
          createdAt: new Date().toISOString()
        },
        {
          id: 'apt-3',
          clinicId: 'mock-clinic-id',
          doctorId: 'doc-1',
          patientId: 'pat-3',
          patientName: 'يوسف عمر حسن',
          doctorName: 'د. محمد علي',
          appointmentDate: new Date().toISOString().split('T')[0],
          startTime: '11:00',
          endTime: '11:30',
          status: 'pending',
          priority: 'normal',
          notes: 'استشارة أولى',
          createdAt: new Date().toISOString()
        }
      ];
    }

    if (chain.includes('invoices')) {
      return [
        { id: 'inv-1', clinicId: 'mock-clinic-id', patientId: 'pat-1', patientName: 'عبدالرحمن محمد علي', totalAmount: '350.00', status: 'paid', createdAt: new Date().toISOString() },
        { id: 'inv-2', clinicId: 'mock-clinic-id', patientId: 'pat-2', patientName: 'فاطمة الزهراء عبدالله', totalAmount: '500.00', status: 'sent', createdAt: new Date().toISOString() }
      ];
    }

    if (chain.includes('medical_records')) {
      return [
        { id: 'rec-1', clinicId: 'mock-clinic-id', patientId: 'pat-1', doctorId: 'doc-1', diagnosis: 'نزلة شعبية حادة', chiefComplaint: 'سعال مستمر وضيق تنفس', symptoms: 'كحة، حرارة 38.5', clinicalNotes: 'الصدر ممتلئ بصوت رنين بالسمّاعة', vitalSigns: 'BP: 120/80, HR: 88, Temp: 38.5', treatmentPlan: 'مضاد حيوي ومذيب للبلغم مع راحة تامة', createdAt: new Date().toISOString() }
      ];
    }

    if (chain.includes('prescriptions')) {
      return [
        { id: 'pres-1', clinicId: 'mock-clinic-id', patientId: 'pat-1', doctorId: 'doc-1', medicationName: 'Amoxicillin 500mg', dosage: 'كبسولة واحدة', frequency: '3 مرات يومياً', duration: '7 أيام', instructions: 'بعد الأكل', status: 'active', createdAt: new Date().toISOString() }
      ];
    }

    if (chain.includes('count')) {
      return [{ count: 5 }];
    }

    return [];
  };

  const createQueryProxy = () => {
    const chain: string[] = [];
    const argsCollected: any[] = [];

    const handler = {
      get(target: any, prop: any, receiver: any): any {
        if (prop === 'then') {
          return (resolve: any) => {
            const result = getMockResponse(chain, argsCollected);
            resolve(result);
          };
        }
        if (prop === 'transaction') {
          return async (callback: any) => {
            return callback(receiver);
          };
        }
        if (typeof prop === 'string') {
          chain.push(prop);
        }
        return new Proxy(() => {}, handler);
      },
      apply(target: any, thisArg: any, args: any): any {
        argsCollected.push(...args);
        for (const arg of args) {
          if (arg && typeof arg === 'object') {
            const symbols = Object.getOwnPropertySymbols(arg);
            for (const sym of symbols) {
              if (sym.toString().includes('drizzle:Name')) {
                chain.push(arg[sym]);
              }
            }
          }
        }
        return new Proxy(() => {}, handler);
      }
    };
    return new Proxy(() => {}, handler);
  };

  dbInstance = new Proxy({}, {
    get(target, prop) {
      if (prop === 'transaction') {
        return async (callback: any) => {
          return callback(dbInstance);
        };
      }
      const queryProxy = createQueryProxy();
      return (queryProxy as any)[prop];
    }
  });
} else {
  // Use Pool to support interactive transactions required for smart booking engine
  poolInstance = new Pool({ connectionString });
  dbInstance = drizzle(poolInstance, { schema });
}

export const pool = poolInstance;
export const db = dbInstance;
