import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will run in mock mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGeminiClient();

// Database Path
const DB_PATH = path.join(process.cwd(), "src", "db.json");

// Default Database State
const DEFAULT_DB = {
  settings: {
    companyName: "Berkah Bintang Solusindo",
    tagline: "Solusi Teknologi Informasi dan Pengadaan Terpercaya",
    description: "Melayani kebutuhan pengadaan perangkat IT, infrastruktur jaringan, server, CCTV, software, maintenance, serta konsultasi teknologi informasi untuk perusahaan, instansi pemerintah, pendidikan, dan UMKM.",
    address: "Grand Slipi Tower Lt. 18, Jl. S. Parman Kav 22, Slipi, Palmerah, Jakarta Barat, DKI Jakarta 11480",
    whatsapp: "+6281234567890",
    email: "bbscom993@gmail.com",
    website: "www.berkahbintangsolusindo.com",
    workingHours: "Senin - Jumat: 08:30 - 17:30 WIB",
    logoText: "BBS",
    bankAccount: {
      bankName: "Bank Mandiri",
      accountNumber: "123-45-67890-1",
      accountHolder: "PT Berkah Bintang Solusindo"
    }
  },
  rfqs: [
    {
      id: "rfq_1",
      rfqNumber: "RFQ-2026-0001",
      date: "2026-06-25",
      status: "quoted",
      companyName: "PT Maju Bersama Sejahtera",
      clientName: "Budi Santoso",
      whatsapp: "081298765432",
      email: "budi.santoso@majubersama.com",
      address: "Jl. Sudirman No. 45, Jakarta Pusat",
      clientCategory: "perusahaan",
      items: [
        { name: "Laptop Kantor Core i5", quantity: 5, description: "RAM minimal 8GB, SSD 512GB, Windows 11 Home" },
        { name: "Printer Laserjet Monokrom", quantity: 2, description: "Bisa print, scan, copy. Kecepatan minimal 20ppm" }
      ],
      customRequirements: "Butuh pengiriman cepat dalam 5 hari kerja karena kantor baru akan dibuka.",
      notes: "Sudah dihubungi via WA, tertarik dengan garansi purna jual.",
      generatedQuotationId: "q_1"
    }
  ],
  quotations: [
    {
      id: "q_1",
      rfqId: "rfq_1",
      quotationNumber: "Q-BBS-2026-0001",
      date: "2026-06-25",
      expiryDate: "2026-07-25",
      introductoryText: "Menunjuk permintaan penawaran harga (RFQ) dari PT Maju Bersama Sejahtera tanggal 25 Juni 2026, bersama ini kami dari Berkah Bintang Solusindo menyampaikan penawaran harga terbaik untuk pengadaan perangkat IT pendukung operasional kantor Anda.",
      items: [
        { name: "Laptop Lenovo ThinkBook 14 G6 Core i5", quantity: 5, unitPrice: 10500000, totalPrice: 52500000, specification: "Intel Core i5-1335U, RAM 8GB DDR5, SSD 512GB NVMe, Screen 14\" FHD, Windows 11 Home, Garansi Resmi Lenovo Indonesia 1 Tahun" },
        { name: "Printer HP LaserJet MFP M141a", quantity: 2, unitPrice: 2200000, totalPrice: 4400000, specification: "Print, Scan, Copy. Up to 20 ppm, USB 2.0 connection, Toner HP 150A, Garansi Resmi HP Indonesia 1 Tahun" }
      ],
      subtotal: 56900000,
      tax: 6259000,
      discount: 1000000,
      total: 62159000,
      termsAndConditions: [
        "Harga di atas sudah termasuk PPN 11%.",
        "Waktu pengiriman barang berkisar 3-5 hari kerja setelah kami menerima Purchase Order (PO) resmi.",
        "Pembayaran dilakukan dengan ketentuan DP 30%, sisanya pelunasan dalam waktu 7 hari setelah seluruh barang diterima dengan baik.",
        "Garansi produk merujuk pada syarat dan ketentuan garansi resmi masing-masing distributor pabrikan (Lenovo & HP).",
        "Penawaran harga ini bersifat mengikat dan berlaku sampai tanggal 25 Juli 2026."
      ],
      status: "sent",
      adminSignature: "Direktur Pengadaan BBS"
    }
  ],
  emails: []
};

// Database Helpers
const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Create directories if they don't exist
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    if (!db.emails) {
      db.emails = [];
    }
    if (!db.reminders) {
      db.reminders = [];
    }
    if (!db.reminderConfig) {
      db.reminderConfig = {
        autoSchedule: true,
        delayHours: 48,
        subjectTemplate: "[PENGINGAT] Menunggu Tindak Lanjut Permintaan Penawaran - {rfqNumber}",
        bodyTemplate: "Halo {clientName},\n\nKami ingin mengonfirmasi bahwa kami sedang menyusun penawaran terbaik untuk RFQ {rfqNumber} Anda.\n\nTim sales kami akan segera menghubungi Anda untuk mendiskusikan spesifikasi perangkat berkualitas tinggi yang Anda butuhkan.\n\nTerima kasih,\n{companyName}"
      };
    }
    return db;
  } catch (error) {
    console.error("Error reading DB, returning defaults:", error);
    const db = { ...DEFAULT_DB } as any;
    if (!db.emails) {
      db.emails = [];
    }
    if (!db.reminders) {
      db.reminders = [];
    }
    if (!db.reminderConfig) {
      db.reminderConfig = {
        autoSchedule: true,
        delayHours: 48,
        subjectTemplate: "[PENGINGAT] Menunggu Tindak Lanjut Permintaan Penawaran - {rfqNumber}",
        bodyTemplate: "Halo {clientName},\n\nKami ingin mengonfirmasi bahwa kami sedang menyusun penawaran terbaik untuk RFQ {rfqNumber} Anda.\n\nTim sales kami akan segera menghubungi Anda untuk mendiskusikan spesifikasi perangkat berkualitas tinggi yang Anda butuhkan.\n\nTerima kasih,\n{companyName}"
      };
    }
    return db;
  }
};

const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to DB:", error);
  }
};

// API: Company Settings
app.get("/api/settings", (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.post("/api/settings", (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json(db.settings);
});

// Helper to send simulated email
function triggerSimulatedEmail(rfq: any, settings: any, db: any) {
  if (!db.emails) {
    db.emails = [];
  }

  const companyEmail = settings.email || "noreply@berkahbintangsolusindo.com";
  const companyName = settings.companyName || "Berkah Bintang Solusindo (BBS)";
  
  const formattedItems = rfq.items && rfq.items.length > 0
    ? rfq.items.map((item: any, idx: number) => {
        return `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b;">${idx + 1}. <strong>${item.name}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b; text-align: center;">${item.quantity} unit</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #64748b;">${item.description || "-"}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="3" style="padding: 15px; text-align: center; color: #64748b; font-family: sans-serif; font-size: 14px;">Tidak ada item perangkat yang ditambahkan</td></tr>`;

  const emailSubject = `[BBS Pengadaan IT] Konfirmasi Permintaan Penawaran - ${rfq.rfqNumber}`;
  
  const emailHtml = `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: sans-serif; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; font-family: sans-serif;">${companyName}</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #c7d2fe; font-family: sans-serif;">Solusi IT & Pengadaan Terpercaya</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; font-family: sans-serif;">Halo <strong>${rfq.clientName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; font-family: sans-serif;">
            Terima kasih telah mengajukan Permintaan Penawaran (RFQ) kepada kami. Kami sangat menghargai minat Anda terhadap solusi teknologi dari <strong>${companyName}</strong>.
          </p>
          
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #4f46e5;">
            <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1e293b; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">Detail Pengajuan RFQ</h3>
            <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Nomor RFQ:</strong></td>
                <td style="padding: 4px 0; color: #1e293b; font-family: monospace; font-size: 14px; font-weight: bold;">${rfq.rfqNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Tanggal Pengajuan:</strong></td>
                <td style="padding: 4px 0; color: #1e293b;">${rfq.date}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Nama Klien:</strong></td>
                <td style="padding: 4px 0; color: #1e293b;">${rfq.clientName}</td>
              </tr>
              ${rfq.companyName ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Perusahaan/Instansi:</strong></td>
                <td style="padding: 4px 0; color: #1e293b;">${rfq.companyName}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>WhatsApp:</strong></td>
                <td style="padding: 4px 0; color: #1e293b;">${rfq.whatsapp}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Alamat Pengiriman:</strong></td>
                <td style="padding: 4px 0; color: #1e293b;">${rfq.address}</td>
              </tr>
            </table>
          </div>
          
          <h4 style="margin: 20px 0 10px 0; font-size: 15px; font-weight: 700; color: #1e293b; font-family: sans-serif;">Daftar Kebutuhan Perangkat / Layanan</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: left; font-family: sans-serif; font-size: 12px; color: #475569; text-transform: uppercase;">Nama Barang</th>
                <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: center; font-family: sans-serif; font-size: 12px; color: #475569; text-transform: uppercase; width: 80px;">Jumlah</th>
                <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: left; font-family: sans-serif; font-size: 12px; color: #475569; text-transform: uppercase;">Spesifikasi Kebutuhan</th>
              </tr>
            </thead>
            <tbody>
              ${formattedItems}
            </tbody>
          </table>

          ${rfq.customRequirements ? `
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 700; color: #b45309; font-family: sans-serif;">Catatan / Persyaratan Khusus Klien:</p>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #78350f; font-family: sans-serif; font-style: italic;">"${rfq.customRequirements}"</p>
          </div>` : ''}

          <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 25px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1e293b; font-family: sans-serif;">Apa Langkah Selanjutnya?</h4>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569; font-family: sans-serif;">
              <li style="margin-bottom: 6px;">Tim internal kami bersama asisten AI (Gemini) akan meninjau ketersediaan stok & spesifikasi teknis.</li>
              <li style="margin-bottom: 6px;">Kami akan menerbitkan Surat Penawaran Harga resmi (Quotation) lengkap dengan rincian harga, pajak (PPN), opsi diskon, serta syarat & ketentuan pembayaran.</li>
              <li style="margin-bottom: 6px;">Quotation resmi akan segera diunggah ke platform dan kami juga akan mem-follow up Anda melalui nomor WhatsApp <strong>${rfq.whatsapp}</strong> dalam 1x24 jam kerja.</li>
            </ol>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-top: 30px; font-family: sans-serif;">
            Jika Anda memiliki pertanyaan mendesak, silakan langsung menghubungi sales representatif kami via WhatsApp di nomor resmi kami <a href="https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}" style="color: #4f46e5; font-weight: bold; text-decoration: none;">${settings.whatsapp}</a> atau membalas pesan ini.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 30px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0 0 5px 0; font-weight: 700; color: #475569; font-family: sans-serif;">${companyName}</p>
          <p style="margin: 0 0 10px 0; font-family: sans-serif;">${settings.address}</p>
          <p style="margin: 0; font-family: sans-serif;">
            Email: <a href="mailto:${companyEmail}" style="color: #4f46e5; text-decoration: none;">${companyEmail}</a> | 
            Website: <a href="http://${settings.website}" style="color: #4f46e5; text-decoration: none;">${settings.website}</a>
          </p>
          <p style="margin: 15px 0 0 0; font-size: 10px; color: #94a3b8; font-family: sans-serif;">
            Ini adalah email simulasi otomatis yang dipicu langsung setelah pengiriman RFQ sukses.
          </p>
        </div>
      </div>
    </div>
  `;

  const newEmail = {
    id: "email_" + Date.now(),
    to: rfq.email,
    from: companyEmail,
    subject: emailSubject,
    body: emailHtml,
    sentAt: new Date().toISOString(),
    rfqNumber: rfq.rfqNumber,
    clientName: rfq.clientName,
    companyName: rfq.companyName,
    status: "sent"
  };

  db.emails.unshift(newEmail);
}

function triggerSimulatedReminderEmail(reminder: any, rfq: any, settings: any, db: any) {
  if (!db.emails) {
    db.emails = [];
  }

  const companyEmail = settings.email || "noreply@berkahbintangsolusindo.com";
  const companyName = settings.companyName || "Berkah Bintang Solusindo (BBS)";
  
  const emailSubject = reminder.subject || `[PENGINGAT] Follow-up Permintaan Penawaran - ${rfq.rfqNumber}`;
  
  const emailHtml = `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: sans-serif; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; font-family: sans-serif;">${companyName}</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #fecdd3; font-family: sans-serif;">Pengingat Permintaan Penawaran (Follow-Up)</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; font-family: sans-serif;">Halo <strong>${rfq.clientName}</strong>,</p>
          <div style="font-size: 14px; line-height: 1.6; color: #475569; font-family: sans-serif; white-space: pre-line; margin-bottom: 25px;">
            ${reminder.body.replace(/{rfqNumber}/g, rfq.rfqNumber).replace(/{clientName}/g, rfq.clientName).replace(/{companyName}/g, companyName)}
          </div>
          
          <div style="background-color: #fff1f2; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #f43f5e;">
            <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #be123c; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">Informasi RFQ Anda</h3>
            <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Nomor RFQ:</strong></td>
                <td style="padding: 4px 0; color: #1e293b; font-family: monospace; font-size: 14px; font-weight: bold;">${rfq.rfqNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Tanggal Pengajuan:</strong></td>
                <td style="padding: 4px 0; color: #1e293b;">${rfq.date}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Status Saat Ini:</strong></td>
                <td style="padding: 4px 0;"><span style="background-color: #fecdd3; color: #be123c; padding: 2px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase;">${rfq.status}</span></td>
              </tr>
            </table>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 25px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1e293b; font-family: sans-serif;">Butuh Bantuan Segera?</h4>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569; font-family: sans-serif;">
              Silakan hubungi sales manager kami secara langsung via WhatsApp di <a href="https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}" style="color: #f43f5e; font-weight: bold; text-decoration: none;">${settings.whatsapp}</a> atau balas email ini untuk mendiskusikan penawaran harga Anda secara prioritas.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 30px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0 0 5px 0; font-weight: 700; color: #475569; font-family: sans-serif;">${companyName}</p>
          <p style="margin: 0 0 10px 0; font-family: sans-serif;">${settings.address}</p>
          <p style="margin: 0; font-family: sans-serif;">
            Email: <a href="mailto:${companyEmail}" style="color: #f43f5e; text-decoration: none;">${companyEmail}</a> | 
            Website: <a href="http://${settings.website}" style="color: #f43f5e; text-decoration: none;">${settings.website}</a>
          </p>
          <p style="margin: 15px 0 0 0; font-size: 10px; color: #94a3b8; font-family: sans-serif;">
            Ini adalah email pengingat simulasi otomatis yang dikirimkan karena status RFQ masih memerlukan tindak lanjut.
          </p>
        </div>
      </div>
    </div>
  `;

  const newEmail = {
    id: "email_" + Date.now(),
    to: rfq.email,
    from: companyEmail,
    subject: emailSubject,
    body: emailHtml,
    sentAt: new Date().toISOString(),
    rfqNumber: rfq.rfqNumber,
    clientName: rfq.clientName,
    companyName: rfq.companyName,
    status: "sent"
  };

  db.emails.unshift(newEmail);
}

// API: RFQs
app.get("/api/rfqs", (req, res) => {
  const db = readDB();
  res.json(db.rfqs);
});

app.post("/api/rfqs", (req, res) => {
  const db = readDB();
  const newRfq = {
    id: "rfq_" + Date.now(),
    rfqNumber: `RFQ-${new Date().getFullYear()}-${String(db.rfqs.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    ...req.body
  };
  db.rfqs.unshift(newRfq);
  
  // Trigger simulated email confirmation immediately
  try {
    triggerSimulatedEmail(newRfq, db.settings, db);
  } catch (err) {
    console.error("Error sending simulated email:", err);
  }

  // Auto-schedule follow-up reminder if enabled
  try {
    const config = db.reminderConfig || {
      autoSchedule: true,
      delayHours: 48,
      subjectTemplate: "[PENGINGAT] Menunggu Tindak Lanjut Permintaan Penawaran - {rfqNumber}",
      bodyTemplate: "Halo {clientName},\n\nKami ingin mengonfirmasi bahwa kami sedang menyusun penawaran terbaik untuk RFQ {rfqNumber} Anda.\n\nTim sales kami akan segera menghubungi Anda untuk mendiskusikan spesifikasi perangkat berkualitas tinggi yang Anda butuhkan.\n\nTerima kasih,\n{companyName}"
    };

    if (config.autoSchedule) {
      const delay = parseFloat(config.delayHours) || 48;
      const scheduledTime = new Date(Date.now() + delay * 60 * 60 * 1000).toISOString();
      const companyName = db.settings.companyName || "Berkah Bintang Solusindo (BBS)";

      const subject = config.subjectTemplate
        .replace(/{rfqNumber}/g, newRfq.rfqNumber)
        .replace(/{clientName}/g, newRfq.clientName)
        .replace(/{companyName}/g, companyName);

      const body = config.bodyTemplate
        .replace(/{rfqNumber}/g, newRfq.rfqNumber)
        .replace(/{clientName}/g, newRfq.clientName)
        .replace(/{companyName}/g, companyName);

      const autoReminder = {
        id: "reminder_" + (Date.now() + 10),
        rfqId: newRfq.id,
        rfqNumber: newRfq.rfqNumber,
        clientName: newRfq.clientName,
        email: newRfq.email,
        scheduledTime,
        delayHours: delay,
        subject,
        body,
        status: "scheduled"
      };

      if (!db.reminders) {
        db.reminders = [];
      }
      db.reminders.unshift(autoReminder);
    }
  } catch (err) {
    console.error("Error scheduling auto follow-up reminder:", err);
  }
  
  writeDB(db);
  res.status(201).json(newRfq);
});

// API: Simulated Emails
app.get("/api/emails", (req, res) => {
  const db = readDB();
  res.json(db.emails || []);
});

app.delete("/api/emails/:id", (req, res) => {
  const db = readDB();
  const index = db.emails ? db.emails.findIndex((e: any) => e.id === req.params.id) : -1;
  if (index !== -1) {
    db.emails.splice(index, 1);
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Email not found" });
  }
});

app.delete("/api/emails", (req, res) => {
  const db = readDB();
  db.emails = [];
  writeDB(db);
  res.json({ success: true });
});

// API: Reminders
app.get("/api/reminders", (req, res) => {
  const db = readDB();
  res.json(db.reminders || []);
});

app.get("/api/reminders/config", (req, res) => {
  const db = readDB();
  res.json(db.reminderConfig || {
    autoSchedule: true,
    delayHours: 48,
    subjectTemplate: "[PENGINGAT] Menunggu Tindak Lanjut Permintaan Penawaran - {rfqNumber}",
    bodyTemplate: "Halo {clientName},\n\nKami ingin mengonfirmasi bahwa kami sedang menyusun penawaran terbaik untuk RFQ {rfqNumber} Anda.\n\nTim sales kami akan segera menghubungi Anda untuk mendiskusikan spesifikasi perangkat berkualitas tinggi yang Anda butuhkan.\n\nTerima kasih,\n{companyName}"
  });
});

app.post("/api/reminders/config", (req, res) => {
  const db = readDB();
  db.reminderConfig = {
    ...db.reminderConfig,
    ...req.body
  };
  writeDB(db);
  res.json(db.reminderConfig);
});

app.post("/api/reminders", (req, res) => {
  const db = readDB();
  const { rfqId, delayHours, subject, body } = req.body;
  const rfq = db.rfqs.find((r: any) => r.id === rfqId);
  if (!rfq) {
    return res.status(404).json({ error: "RFQ tidak ditemukan" });
  }

  const hours = parseFloat(delayHours) || 48;
  const scheduledTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const newReminder = {
    id: "reminder_" + Date.now(),
    rfqId,
    rfqNumber: rfq.rfqNumber,
    clientName: rfq.clientName,
    email: rfq.email,
    scheduledTime,
    delayHours: hours,
    subject: subject || `[PENGINGAT] Tindak Lanjut Permintaan Penawaran - ${rfq.rfqNumber}`,
    body: body || `Halo ${rfq.clientName},\n\nKami ingin menginformasikan bahwa RFQ ${rfq.rfqNumber} Anda sedang kami proses.`,
    status: "scheduled"
  };

  if (!db.reminders) {
    db.reminders = [];
  }
  db.reminders.unshift(newReminder);
  writeDB(db);
  res.status(201).json(newReminder);
});

app.post("/api/reminders/:id/trigger", (req, res) => {
  const db = readDB();
  const reminderIndex = db.reminders ? db.reminders.findIndex((r: any) => r.id === req.params.id) : -1;
  if (reminderIndex === -1) {
    return res.status(404).json({ error: "Reminder tidak ditemukan" });
  }

  const reminder = db.reminders[reminderIndex];
  const rfq = db.rfqs.find((r: any) => r.id === reminder.rfqId);
  if (!rfq) {
    return res.status(404).json({ error: "RFQ pendukung tidak ditemukan" });
  }

  try {
    triggerSimulatedReminderEmail(reminder, rfq, db.settings, db);
    reminder.status = "sent";
    reminder.sentAt = new Date().toISOString();
    writeDB(db);
    res.json(reminder);
  } catch (err: any) {
    res.status(500).json({ error: "Gagal mengirimkan email reminder", details: err.message });
  }
});

app.delete("/api/reminders/:id", (req, res) => {
  const db = readDB();
  const index = db.reminders ? db.reminders.findIndex((r: any) => r.id === req.params.id) : -1;
  if (index !== -1) {
    db.reminders.splice(index, 1);
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Reminder tidak ditemukan" });
  }
});

app.put("/api/rfqs/:id", (req, res) => {
  const db = readDB();
  const index = db.rfqs.findIndex((r: any) => r.id === req.params.id);
  if (index !== -1) {
    db.rfqs[index] = { ...db.rfqs[index], ...req.body };
    writeDB(db);
    res.json(db.rfqs[index]);
  } else {
    res.status(404).json({ error: "RFQ not found" });
  }
});

// API: Quotations
app.get("/api/quotations", (req, res) => {
  const db = readDB();
  res.json(db.quotations);
});

app.post("/api/quotations", (req, res) => {
  const db = readDB();
  const newQuotation = {
    id: "q_" + Date.now(),
    quotationNumber: `Q-BBS-${new Date().getFullYear()}-${String(db.quotations.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days
    status: "draft",
    adminSignature: "Direktur Pengadaan BBS",
    ...req.body
  };
  
  db.quotations.unshift(newQuotation);
  
  // Link to RFQ if exists
  if (newQuotation.rfqId) {
    const rfqIndex = db.rfqs.findIndex((r: any) => r.id === newQuotation.rfqId);
    if (rfqIndex !== -1) {
      db.rfqs[rfqIndex].generatedQuotationId = newQuotation.id;
      db.rfqs[rfqIndex].status = "quoted";
    }
  }

  writeDB(db);
  res.status(201).json(newQuotation);
});

app.put("/api/quotations/:id", (req, res) => {
  const db = readDB();
  const index = db.quotations.findIndex((q: any) => q.id === req.params.id);
  if (index !== -1) {
    db.quotations[index] = { ...db.quotations[index], ...req.body };
    writeDB(db);
    res.json(db.quotations[index]);
  } else {
    res.status(404).json({ error: "Quotation not found" });
  }
});

// API: AI Consultation Chatbot
app.post("/api/consult", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages history." });
  }

  // Fallback if no Gemini AI is initialized
  if (!ai) {
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    let responseText = "Terima kasih telah menghubungi Berkah Bintang Solusindo. Saat ini sistem kecerdasan buatan kami sedang berjalan dalam mode demonstrasi offline. ";
    if (lastUserMsg.toLowerCase().includes("laptop") || lastUserMsg.toLowerCase().includes("komputer")) {
      responseText += "Kami siap menyediakan pengadaan Komputer/Laptop kantor original bergaransi resmi dari brand ASUS, Lenovo, Dell, dan HP dengan spesifikasi Core i3/i5/i7 yang sesuai anggaran Anda. Silakan tambahkan item laptop ke Keranjang RFQ Anda di halaman utama kami agar tim kami dapat membuatkan penawaran harga resmi.";
    } else if (lastUserMsg.toLowerCase().includes("jaringan") || lastUserMsg.toLowerCase().includes("lan") || lastUserMsg.toLowerCase().includes("wifi")) {
      responseText += "Untuk instalasi jaringan LAN/WAN, kami menyediakan layanan penarikan kabel cat6, instalasi Switch manageable, Router Mikrotik/Cisco, serta setting Access Point. Silakan berikan info luas kantor dan estimasi jumlah pengguna agar teknisi kami dapat merancang topologi terbaik.";
    } else {
      responseText += "Kami siap melayani pengadaan IT, Server, Jaringan, CCTV, Lisensi Software, dan Maintenance rutin. Anda dapat mengisi form Request for Quote (RFQ) langsung melalui tombol 'Buat RFQ' di menu navigasi, atau sebutkan perangkat yang sedang Anda cari di sini.";
    }
    return res.json({ text: responseText });
  }

  try {
    const formattedHistory = messages.map(m => `${m.role === 'user' ? 'Client' : 'BBS Consultant'}: ${m.text}`).join("\n");
    const prompt = `Anda adalah Senior IT Consultant & Procurement Specialist di perusahaan "Berkah Bintang Solusindo (BBS)".
Tugas Anda adalah melayani konsultasi pengadaan barang IT, perancangan jaringan, pemasangan CCTV, server, software licensing, atau kontrak maintenance.

Berikut adalah riwayat percakapan terkini:
${formattedHistory}

BBS Consultant: (Lanjutkan tanggapan Anda yang sopan, ramah, profesional, bernilai tinggi, menggunakan bahasa Indonesia formal namun luwes, dan berikan rekomendasi spesifikasi barang serta estimasi budget bersaing jika relevan. Ajak mereka untuk memasukkan barang tersebut ke form RFQ di aplikasi untuk dibuatkan dokumen Penawaran Harga resmi)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah asisten konsultan IT handal untuk Berkah Bintang Solusindo. Berikan jawaban dalam Bahasa Indonesia. Fokus pada solusi teknis yang bergaransi, harga kompetitif, pelayanan purna jual handal, dan pengerjaan oleh teknisi bersertifikat.",
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Consultation Error:", err);
    res.status(500).json({ error: "Gagal memproses konsultasi AI.", details: err.message });
  }
});

// API: AI Automated Quotation Generator
app.post("/api/generate-quotation", async (req, res) => {
  const { rfqId } = req.body;
  if (!rfqId) {
    return res.status(400).json({ error: "rfqId is required." });
  }

  const db = readDB();
  const rfq = db.rfqs.find((r: any) => r.id === rfqId);
  if (!rfq) {
    return res.status(404).json({ error: "RFQ not found." });
  }

  // Helper to generate a dummy/fallback quotation if Gemini is offline
  const generateFallbackQuotation = (rfqData: any) => {
    const items = rfqData.items.map((item: any, idx: number) => {
      const estimatedUnitPrice = (idx + 1) * 3500000; // Mock calculation
      return {
        name: `${item.name} - Standard Edition`,
        quantity: item.quantity,
        unitPrice: estimatedUnitPrice,
        totalPrice: estimatedUnitPrice * item.quantity,
        specification: item.description || "Spesifikasi standar industri bergaransi resmi 1 tahun."
      };
    });

    const subtotal = items.reduce((acc: number, curr: any) => acc + curr.totalPrice, 0);
    const tax = Math.round(subtotal * 0.11); // PPN 11%
    const discount = 0;
    const total = subtotal + tax;

    return {
      id: "q_" + Date.now(),
      rfqId: rfqData.id,
      quotationNumber: `Q-BBS-AUTO-${new Date().getFullYear()}-${String(db.quotations.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      introductoryText: `Menunjuk Request for Quote (RFQ) dari ${rfqData.clientName} (${rfqData.companyName || "UMKM"}) pada tanggal ${rfqData.date}, kami dari Berkah Bintang Solusindo mengajukan penawaran harga komprehensif untuk pengadaan barang dan jasa IT sesuai kebutuhan Anda.`,
      items,
      subtotal,
      tax,
      discount,
      total,
      termsAndConditions: [
        "Harga di atas sudah termasuk PPN 11%.",
        "Waktu pengiriman maksimal 7 hari kerja setelah PO resmi kami terima.",
        "Ketentuan pembayaran: DP 50%, sisa pembayaran 50% setelah barang dikirim dan dites.",
        "Seluruh perangkat keras mendapatkan garansi resmi distributor selama 1 tahun.",
        "Penawaran harga ini berlaku selama 14 hari kalender sejak diterbitkan."
      ],
      status: "draft",
      adminSignature: "Direktur Pengadaan BBS"
    };
  };

  if (!ai) {
    const fallbackQuote = generateFallbackQuotation(rfq);
    db.quotations.unshift(fallbackQuote);
    rfq.generatedQuotationId = fallbackQuote.id;
    rfq.status = "quoted";
    writeDB(db);
    return res.status(201).json(fallbackQuote);
  }

  try {
    const itemsText = rfq.items.map((it: any) => `- ${it.name} (Jumlah: ${it.quantity} unit) | Deskripsi user: ${it.description || 'Tidak ada'}`).join("\n");
    
    const prompt = `Anda adalah Senior Sales & Estimator Officer untuk Berkah Bintang Solusindo.
Kami baru saja menerima Request for Quote (RFQ) resmi dari klien berikut:
Klien: ${rfq.clientName}
Instansi/Perusahaan: ${rfq.companyName || 'UMKM / Individu'}
Kategori Klien: ${rfq.clientCategory} (perusahaan, pemerintah, pendidikan, atau umkm)
Alamat Pengiriman: ${rfq.address}
Kebutuhan Khusus: ${rfq.customRequirements || 'Tidak ada'}

Berikut daftar barang yang mereka butuhkan:
${itemsText}

Tugas Anda adalah:
1. Lakukan pemilihan produk yang paling cocok (spesifikasikan brand terkenal seperti Asus, Lenovo, HP, Mikrotik, Hikvision, Microsoft, Cisco, dll. yang lazim dipakai di Indonesia).
2. Tentukan harga unit komersial yang bersaing dan realistis dalam Rupiah (IDR). Laptop kantor berkisar Rp7.000.000 s.d Rp15.000.000, Router Mikrotik Rp1.500.000 s.d Rp5.000.000, CCTV IP Camera Rp1.200.000 s.d Rp3.000.000 per titik, dst.
3. Buat pembuka surat penawaran komersial (introductoryText) yang sangat formal, ramah, dan bernilai tinggi dalam bahasa Indonesia profesional.
4. Tentukan syarat dan ketentuan pengerjaan/pengiriman (termsAndConditions) yang masuk akal dan aman bagi BBS (misalnya lead time pengiriman, garansi resmi distributor, DP 30-50%, pelunasan setelah barang diterima dengan baik, dan batas berlaku penawaran).
5. Hitung Pajak (PPN 11%) - jika kategori klien adalah 'pemerintah', maka PPN 11% WAJIB disertakan. Untuk kategori lain, PPN dapat disertakan atau harga dianggap sudah termasuk.
6. Berikan diskon wajar jika pembelian dalam jumlah banyak.

Anda harus mengembalikan respons dalam format JSON murni yang sesuai dengan skema TypeScript berikut:
{
  "introductoryText": "string",
  "items": [
    { "name": "string (nama produk spesifik lengkap dengan merk/tipe)", "quantity": number, "unitPrice": number (dalam rupiah, tanpa koma/desimal), "totalPrice": number (quantity * unitPrice), "specification": "string (spesifikasi teknis lengkap yang ditawarkan)" }
  ],
  "subtotal": number (jumlah dari seluruh totalPrice),
  "discount": number (diskon yang diberikan, jika ada, dalam rupiah),
  "tax": number (PPN 11% dari subtotal dikurangi diskon, bulatkan),
  "total": number (subtotal - discount + tax),
  "termsAndConditions": ["string (daftar syarat & ketentuan lengkap, minimal 4 butir)"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            introductoryText: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.INTEGER },
                  unitPrice: { type: Type.INTEGER },
                  totalPrice: { type: Type.INTEGER },
                  specification: { type: Type.STRING }
                },
                required: ["name", "quantity", "unitPrice", "totalPrice", "specification"]
              }
            },
            subtotal: { type: Type.INTEGER },
            discount: { type: Type.INTEGER },
            tax: { type: Type.INTEGER },
            total: { type: Type.INTEGER },
            termsAndConditions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["introductoryText", "items", "subtotal", "discount", "tax", "total", "termsAndConditions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());

    // Setup and save the quotation document
    const newQuotation = {
      id: "q_" + Date.now(),
      rfqId: rfq.id,
      quotationNumber: `Q-BBS-${new Date().getFullYear()}-${String(db.quotations.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "draft",
      adminSignature: "Direktur Pengadaan BBS",
      ...parsedData
    };

    db.quotations.unshift(newQuotation);
    rfq.generatedQuotationId = newQuotation.id;
    rfq.status = "quoted";
    writeDB(db);

    res.status(201).json(newQuotation);
  } catch (err: any) {
    console.error("AI Quotation Generation Error:", err);
    // If Gemini fails, fallback gracefully so that the app works seamlessly
    const fallbackQuote = generateFallbackQuotation(rfq);
    db.quotations.unshift(fallbackQuote);
    rfq.generatedQuotationId = fallbackQuote.id;
    rfq.status = "quoted";
    writeDB(db);
    res.status(201).json(fallbackQuote);
  }
});

// Background Service: Periodically check and trigger scheduled follow-up reminders
setInterval(() => {
  try {
    const db = readDB();
    if (!db.reminders || db.reminders.length === 0) {
      return;
    }

    let changed = false;
    const now = new Date();

    db.reminders.forEach((reminder: any) => {
      if (reminder.status === "scheduled") {
        const scheduledTime = new Date(reminder.scheduledTime);
        if (now >= scheduledTime) {
          // Find the corresponding RFQ to check if it's still unquoted
          const rfq = db.rfqs.find((r: any) => r.id === reminder.rfqId);

          if (!rfq) {
            reminder.status = "failed";
            reminder.error = "RFQ pendukung tidak ditemukan.";
            changed = true;
            return;
          }

          // If the RFQ is already quoted, completed, or cancelled, do not remind
          if (rfq.status === "quoted" || rfq.status === "completed" || rfq.status === "cancelled") {
            reminder.status = "cancelled";
            reminder.note = `Dibatalkan otomatis karena RFQ berstatus "${rfq.status}"`;
            changed = true;
            return;
          }

          // Otherwise, send the reminder email!
          try {
            triggerSimulatedReminderEmail(reminder, rfq, db.settings, db);
            reminder.status = "sent";
            reminder.sentAt = new Date().toISOString();
            changed = true;
            console.log(`[Follow-up Scheduler] Sent reminder for RFQ ${rfq.rfqNumber} to ${rfq.email}`);
          } catch (err: any) {
            console.error(`[Follow-up Scheduler] Failed to send reminder for RFQ ${rfq.rfqNumber}:`, err);
            reminder.status = "failed";
            reminder.error = err.message || "Gagal mengirimkan email.";
            changed = true;
          }
        }
      }
    });

    if (changed) {
      writeDB(db);
    }
  } catch (err) {
    console.error("[Follow-up Scheduler] Background check error:", err);
  }
}, 10000);

// Main full-stack integration handler
async function startServer() {
  // Vite integration in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Berkah Bintang Solusindo Portal] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
