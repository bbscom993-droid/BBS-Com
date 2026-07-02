import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'src/db.json');

// Memory cache of our NoSQL database
let dbData: { [collection: string]: { [docId: string]: any } } = {
  settings: {},
  rfqs: {},
  quotations: {},
  emails: {},
  reminders: {}
};

// Load data from db.json and migrate to NoSQL format if necessary
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      // If it is already in our NoSQL dictionary format (e.g. has config inside settings)
      if (parsed.settings && parsed.settings.config) {
        dbData = parsed;
      } else {
        // Migrate from old array-based format
        if (parsed.settings) {
          dbData.settings.config = parsed.settings;
        }
        
        // Default reminder config
        dbData.settings.reminderConfig = {
          autoSchedule: true,
          delayHours: 48,
          subjectTemplate: "[PENGINGAT] Menunggu Tindak Lanjut Permintaan Penawaran - {rfqNumber}",
          bodyTemplate: "Halo {clientName},\n\nKami ingin mengonfirmasi bahwa kami sedang menyusun penawaran terbaik untuk RFQ {rfqNumber} Anda.\n\nTim sales kami akan segera menghubungi Anda untuk mendiskusikan spesifikasi perangkat berkualitas tinggi yang Anda butuhkan.\n\nTerima kasih,\n{companyName}"
        };

        if (Array.isArray(parsed.rfqs)) {
          parsed.rfqs.forEach((rfq: any) => {
            if (rfq.id) dbData.rfqs[rfq.id] = rfq;
          });
        }

        if (Array.isArray(parsed.quotations)) {
          parsed.quotations.forEach((q: any) => {
            if (q.id) dbData.quotations[q.id] = q;
          });
        }

        if (Array.isArray(parsed.emails)) {
          parsed.emails.forEach((email: any) => {
            if (email.id) dbData.emails[email.id] = email;
          });
        }

        if (Array.isArray(parsed.reminders)) {
          parsed.reminders.forEach((r: any) => {
            if (r.id) dbData.reminders[r.id] = r;
          });
        }

        // Save migrated format back to db.json
        saveDb();
      }
    } else {
      // Default initial state if file doesn't exist
      saveDb();
    }
  } catch (err) {
    console.error("Error loading local database file:", err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving local database file:", err);
  }
}

// Initial load
loadDb();

// Mock Classes mimicking Firestore Admin SDK
class AdminDoc {
  constructor(private colPath: string, private docId: string) {}

  get ref() {
    return this;
  }

  get id() {
    return this.docId;
  }

  async get() {
    loadDb();
    const col = dbData[this.colPath] || {};
    const docData = col[this.docId];
    return {
      exists: docData !== undefined,
      id: this.docId,
      data: () => docData ? JSON.parse(JSON.stringify(docData)) : undefined
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    loadDb();
    if (!dbData[this.colPath]) {
      dbData[this.colPath] = {};
    }
    
    if (options?.merge && dbData[this.colPath][this.docId]) {
      dbData[this.colPath][this.docId] = {
        ...dbData[this.colPath][this.docId],
        ...data
      };
    } else {
      dbData[this.colPath][this.docId] = data;
    }
    
    saveDb();
  }

  async update(data: any) {
    loadDb();
    if (dbData[this.colPath] && dbData[this.colPath][this.docId]) {
      dbData[this.colPath][this.docId] = {
        ...dbData[this.colPath][this.docId],
        ...data
      };
      saveDb();
    } else {
      throw new Error(`Document ${this.colPath}/${this.docId} not found for update`);
    }
  }

  async delete() {
    loadDb();
    if (dbData[this.colPath] && dbData[this.colPath][this.docId]) {
      delete dbData[this.colPath][this.docId];
      saveDb();
    }
  }
}

class AdminCollection {
  constructor(private colPath: string) {}

  doc(id: string) {
    return new AdminDoc(this.colPath, id);
  }

  async get() {
    loadDb();
    const col = dbData[this.colPath] || {};
    const docs = Object.keys(col).map(id => ({
      id,
      ref: new AdminDoc(this.colPath, id),
      data: () => JSON.parse(JSON.stringify(col[id]))
    }));
    return { docs, size: docs.length };
  }
}

class AdminBatch {
  private operations: (() => Promise<void>)[] = [];

  delete(docRef: AdminDoc) {
    this.operations.push(async () => {
      await docRef.delete();
    });
  }

  async commit() {
    for (const op of this.operations) {
      await op();
    }
  }
}

export const adminDb = {
  collection(colPath: string) {
    return new AdminCollection(colPath);
  },
  batch() {
    return new AdminBatch();
  }
};

export const adminAuth = {} as any;
