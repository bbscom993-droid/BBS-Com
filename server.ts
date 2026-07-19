import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { adminDb } from "./src/lib/firebase-admin.ts";

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

// Lazy-initialized accessor for the BBS AI engine
const getAi = () => {
  return getGeminiClient();
};

// Default Database State for Seeding
const DEFAULT_DB = {
  settings: {
    companyName: "Berkah Bintang Solusindo",
    tagline: "Solusi Teknologi Informasi dan Pengadaan Terpercaya",
    description: "Melayani kebutuhan pengadaan perangkat IT, infrastruktur jaringan, server, CCTV, software, maintenance, serta konsultasi teknologi informasi untuk perusahaan, umum, pendidikan, dan UMKM.",
    address: "Jl.Raya Cempaka No 10 Jakarta",
    whatsapp: "+6281234567890",
    email: "bbscom993@gmail.com",
    website: "www.berkahbintangsolusindo.com",
    workingHours: "Senin - Jumat: 08:30 - 17:30 WIB",
    logoText: "BBS",
    motto: "Inovasi, Integritas & Pelayanan Terbaik",
    bankAccount: {
      bankName: "SeaBank",
      accountNumber: "901640383663",
      accountHolder: "Arif Suharyadi"
    },
    customRfqStatuses: []
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
  ]
};

// Seeding routine to populate Firestore on boot if empty
async function seedFirestoreIfNeeded() {
  try {
    const configRef = adminDb.collection("settings").doc("config");
    const doc = await configRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (data && data.bankAccount && (data.bankAccount.accountNumber === "123-45-67890-1" || data.bankAccount.bankName === "Bank Mandiri")) {
        console.log("[Firebase Seeding] Migrating placeholder bankAccount to SeaBank...");
        await configRef.update({
          bankAccount: {
            bankName: "SeaBank",
            accountNumber: "901640383663",
            accountHolder: "Arif Suharyadi"
          }
        });
      }
    }
    if (!doc.exists) {
      console.log("[Firebase Seeding] Seeding default configurations...");
      await configRef.set(DEFAULT_DB.settings);

      const reminderConfig = {
        autoSchedule: true,
        delayHours: 48,
        subjectTemplate: "[PENGINGAT] Menunggu Tindak Lanjut Permintaan Penawaran - {rfqNumber}",
        bodyTemplate: "Halo {clientName},\n\nKami ingin mengonfirmasi bahwa kami sedang menyusun penawaran terbaik untuk RFQ {rfqNumber} Anda.\n\nTim sales kami akan segera menghubungi Anda untuk mendiskusikan spesifikasi perangkat berkualitas tinggi yang Anda butuhkan.\n\nTerima kasih,\n{companyName}"
      };
      await adminDb.collection("settings").doc("reminderConfig").set(reminderConfig);

      for (const rfq of DEFAULT_DB.rfqs) {
        await adminDb.collection("rfqs").doc(rfq.id).set(rfq);
      }

      for (const q of DEFAULT_DB.quotations) {
        await adminDb.collection("quotations").doc(q.id).set(q);
      }

      const sampleOrder = {
        id: "order_1",
        orderNumber: "TRX-2026-0001",
        date: "2026-07-02",
        status: "processing",
        paymentStatus: "paid",
        clientName: "Andi Wijaya",
        companyName: "PT Bintang Timur",
        whatsapp: "081122334455",
        email: "andi.wijaya@bintangtimur.com",
        address: "Ruko Harmony Blok C-4, Kebon Jeruk, Jakarta Barat",
        items: [
          { productId: "prod_1", name: "Laptop Kantor Lenovo ThinkBook 14 G6", quantity: 2, price: 11450000, totalPrice: 22900000 }
        ],
        subtotal: 22900000,
        tax: 2519000,
        discount: 1145000,
        shippingCost: 150000,
        total: 24424000,
        paymentMethod: "bank_transfer",
        deliveryMethod: "bbs_delivery"
      };
      await adminDb.collection("orders").doc(sampleOrder.id).set(sampleOrder);

      console.log("[Firebase Seeding] Default data seeded successfully!");
    } else {
      // If document exists, migrate the address if it contains old values
      const data = doc.data();
      if (data && data.address && (
        data.address.includes("Grand Slipi") || 
        data.address.includes("Slipi") || 
        data.address.includes("Cempaka putih") || 
        data.address.includes("Cempaka Putih")
      )) {
        console.log("[Firebase Seeding] Migrating old address to: Jl.Raya Cempaka No 10 Jakarta");
        await configRef.update({
          address: "Jl.Raya Cempaka No 10 Jakarta"
        });
      }
    }
  } catch (error) {
    console.error("[Firebase Seeding] Error seeding data:", error);
  }
}

// Helpers for reading settings and configuration
async function getCompanySettings() {
  try {
    const doc = await adminDb.collection("settings").doc("config").get();
    if (doc.exists) return doc.data();
  } catch (error) {
    console.error("Error reading company settings:", error);
  }
  return DEFAULT_DB.settings;
}

async function getReminderConfig() {
  try {
    const doc = await adminDb.collection("settings").doc("reminderConfig").get();
    if (doc.exists) return doc.data();
  } catch (error) {
    console.error("Error reading reminder config:", error);
  }
  return {
    autoSchedule: true,
    delayHours: 48,
    subjectTemplate: "[PENGINGAT] Menunggu Tindak Lanjut Permintaan Penawaran - {rfqNumber}",
    bodyTemplate: "Halo {clientName},\n\nKami ingin mengonfirmasi bahwa kami sedang menyusun penawaran terbaik untuk RFQ {rfqNumber} Anda.\n\nTim sales kami akan segera menghubungi Anda untuk mendiskusikan spesifikasi perangkat berkualitas tinggi yang Anda butuhkan.\n\nTerima kasih,\n{companyName}"
  };
}

// API: Company Settings
app.get("/api/settings", async (req, res) => {
  const settings = await getCompanySettings();
  res.json(settings);
});

app.post("/api/settings", async (req, res) => {
  try {
    await adminDb.collection("settings").doc("config").set(req.body, { merge: true });
    const settings = await getCompanySettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menyimpan konfigurasi", details: error.message });
  }
});

// API: Status Filter Layout Preferences (Pinned & Order)
app.get("/api/settings/layout-preferences", async (req, res) => {
  try {
    const doc = await adminDb.collection("settings").doc("layoutPreferences").get();
    if (doc.exists) {
      res.json(doc.data());
    } else {
      res.json({
        pinnedStatuses: [],
        legendStatusOrder: ["pending", "processing", "quoted", "completed", "cancelled"]
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Gagal mendapatkan preferensi layout", details: error.message });
  }
});

app.post("/api/settings/layout-preferences", async (req, res) => {
  try {
    const { pinnedStatuses, legendStatusOrder } = req.body;
    await adminDb.collection("settings").doc("layoutPreferences").set({
      pinnedStatuses: pinnedStatuses || [],
      legendStatusOrder: legendStatusOrder || ["pending", "processing", "quoted", "completed", "cancelled"]
    }, { merge: true });
    res.json({ success: true, pinnedStatuses, legendStatusOrder });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menyimpan preferensi layout", details: error.message });
  }
});

// Helper to send simulated email alerts to admin
async function triggerAdminEmailAlert(rfq: any, settings: any, actionType: "new" | "update") {
  const emailAlertsEnabled = settings.emailAlertsEnabled !== false;
  if (!emailAlertsEnabled) return;

  const adminAlertEmail = settings.adminAlertEmail || "admin@berkahbintangsolusindo.com";
  const alertOnHighPriorityOnly = settings.alertOnHighPriorityOnly || false;
  const priority = rfq.priority || "medium";

  if (alertOnHighPriorityOnly && priority !== "high" && priority !== "urgent") {
    return;
  }

  const companyEmail = settings.email || "noreply@berkahbintangsolusindo.com";
  const companyName = settings.companyName || "PT. Berkah Bintang Solusindo";

  let subject = "";
  let html = "";

  if (actionType === "new") {
    subject = `🚨 [ADMIN ALERT] RFQ Baru Masuk: ${rfq.rfqNumber} [${priority.toUpperCase()}]`;
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f1f5f9;">
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0; font-size: 20px;">Notifikasi RFQ Masuk Baru</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Sistem Otomatis PT. Berkah Bintang Solusindo</p>
        </div>
        <p>Ada permintaan penawaran (RFQ) baru masuk ke sistem dengan detail sebagai berikut:</p>
        <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0;"><strong>Nomor RFQ:</strong> <span style="font-family: monospace; color: #38bdf8; font-weight: bold;">${rfq.rfqNumber}</span></p>
          <p style="margin: 0 0 8px 0;"><strong>Nama Klien:</strong> ${rfq.clientName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Instansi/Perusahaan:</strong> ${rfq.companyName || "Personal/Retail"}</p>
          <p style="margin: 0 0 8px 0;"><strong>Skala Prioritas:</strong> <span style="color: ${priority === 'urgent' ? '#f43f5e' : priority === 'high' ? '#f59e0b' : '#38bdf8'}; font-weight: bold; text-transform: uppercase;">${priority}</span></p>
          <p style="margin: 0;"><strong>Kategori:</strong> ${rfq.clientCategory}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="color: #f1f5f9; font-size: 14px; border-bottom: 1px solid #334155; padding-bottom: 6px;">Daftar Perangkat yang Dicari:</h3>
          <ul style="padding-left: 20px; margin: 10px 0;">
            ${(rfq.items || []).map((it: any) => `<li style="margin-bottom: 6px;"><strong>${it.name}</strong> (${it.quantity} unit)</li>`).join('')}
          </ul>
        </div>
        <div style="text-align: center; margin-top: 25px; border-top: 1px solid #334155; padding-top: 15px;">
          <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 10px;">Gunakan Portal Admin untuk segera melakukan analisis & generate quotation AI</span>
          <span style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Masuk ke Portal Admin</span>
        </div>
      </div>
    `;
  } else {
    subject = `⚠️ [ADMIN ALERT] RFQ Diperbarui: ${rfq.rfqNumber} [${priority.toUpperCase()}]`;
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f1f5f9;">
        <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 20px;">Pembaruan Informasi RFQ</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Sistem Otomatis PT. Berkah Bintang Solusindo</p>
        </div>
        <p>RFQ berikut telah diperbarui catatannya atau tingkat prioritasnya:</p>
        <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0;"><strong>Nomor RFQ:</strong> <span style="font-family: monospace; color: #38bdf8; font-weight: bold;">${rfq.rfqNumber}</span></p>
          <p style="margin: 0 0 8px 0;"><strong>Klien:</strong> ${rfq.clientName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold;">${rfq.status}</span></p>
          <p style="margin: 0 0 8px 0;"><strong>Skala Prioritas:</strong> <span style="color: ${priority === 'urgent' ? '#f43f5e' : priority === 'high' ? '#f59e0b' : '#38bdf8'}; font-weight: bold; text-transform: uppercase;">${priority}</span></p>
          <p style="margin: 0;"><strong>Catatan Admin terbaru:</strong> <span style="color: #94a3b8; font-style: italic;">"${rfq.notes || "Tidak ada catatan."}"</span></p>
        </div>
        <div style="text-align: center; margin-top: 25px; border-top: 1px solid #334155; padding-top: 15px;">
          <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 10px;">Pembaruan ini tersinkronisasi langsung ke database Firestore</span>
        </div>
      </div>
    `;
  }

  const newEmail = {
    id: "alert_" + Date.now(),
    to: adminAlertEmail,
    from: companyEmail,
    subject,
    body: html,
    sentAt: new Date().toISOString(),
    rfqNumber: rfq.rfqNumber,
    clientName: rfq.clientName,
    companyName: rfq.companyName || "",
    status: "sent"
  };

  await adminDb.collection("emails").doc(newEmail.id).set(newEmail);
}

// Helper to send simulated email
async function triggerSimulatedEmail(rfq: any, settings: any) {
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

  await adminDb.collection("emails").doc(newEmail.id).set(newEmail);
}

async function triggerSimulatedReminderEmail(reminder: any, rfq: any, settings: any) {
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

  await adminDb.collection("emails").doc(newEmail.id).set(newEmail);
}

// API: RFQs
app.get("/api/rfqs", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("rfqs").get();
    const rfqs = snapshot.docs.map(doc => doc.data());
    // Robust in-memory sorting to avoid requiring Firestore composite index on startup
    rfqs.sort((a: any, b: any) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.id || "").localeCompare(a.id || "");
    });
    res.json(rfqs);
  } catch (error: any) {
    console.error("Error fetching rfqs:", error);
    res.status(500).json({ error: "Gagal mengambil data RFQ", details: error.message });
  }
});

app.post("/api/rfqs", async (req, res) => {
  try {
    const settings = await getCompanySettings();
    const rfqSnapshot = await adminDb.collection("rfqs").get();
    const totalCount = rfqSnapshot.size;

    const id = "rfq_" + Date.now();
    const newRfq = {
      id,
      rfqNumber: `RFQ-${new Date().getFullYear()}-${String(totalCount + 1).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      history: [
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
          operator: "Klien"
        }
      ],
      ...req.body
    };

    await adminDb.collection("rfqs").doc(id).set(newRfq);
    
    // Trigger simulated email confirmation immediately
    try {
      await triggerSimulatedEmail(newRfq, settings);
    } catch (err) {
      console.error("Error sending simulated email:", err);
    }

    // Trigger admin email alert
    try {
      await triggerAdminEmailAlert(newRfq, settings, "new");
    } catch (err) {
      console.error("Error sending admin alert email:", err);
    }

    // Auto-schedule follow-up reminder if enabled
    try {
      const config = await getReminderConfig();

      if (config.autoSchedule) {
        const delay = parseFloat(config.delayHours) || 48;
        const scheduledTime = new Date(Date.now() + delay * 60 * 60 * 1000).toISOString();
        const companyName = settings.companyName || "Berkah Bintang Solusindo (BBS)";

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

        await adminDb.collection("reminders").doc(autoReminder.id).set(autoReminder);
      }
    } catch (err) {
      console.error("Error scheduling auto follow-up reminder:", err);
    }
    
    res.status(201).json(newRfq);
  } catch (error: any) {
    console.error("Error creating rfq:", error);
    res.status(500).json({ error: "Gagal menyimpan RFQ baru", details: error.message });
  }
});

// API: Simulated Emails
app.get("/api/emails", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("emails").get();
    const emails = snapshot.docs.map(doc => doc.data());
    emails.sort((a: any, b: any) => (b.sentAt || "").localeCompare(a.sentAt || ""));
    res.json(emails);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal mengambil log email", details: error.message });
  }
});

app.delete("/api/emails/:id", async (req, res) => {
  try {
    await adminDb.collection("emails").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menghapus email", details: error.message });
  }
});

app.delete("/api/emails", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("emails").get();
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal mengosongkan log email", details: error.message });
  }
});

// API: Reminders
app.get("/api/reminders", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("reminders").get();
    const reminders = snapshot.docs.map(doc => doc.data());
    reminders.sort((a: any, b: any) => (b.scheduledTime || "").localeCompare(a.scheduledTime || ""));
    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal mengambil data reminder", details: error.message });
  }
});

app.get("/api/reminders/config", async (req, res) => {
  const config = await getReminderConfig();
  res.json(config);
});

app.post("/api/reminders/config", async (req, res) => {
  try {
    await adminDb.collection("settings").doc("reminderConfig").set(req.body, { merge: true });
    const config = await getReminderConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menyimpan konfigurasi reminder", details: error.message });
  }
});

app.post("/api/reminders", async (req, res) => {
  try {
    const { rfqId, delayHours, subject, body } = req.body;
    const rfqDoc = await adminDb.collection("rfqs").doc(rfqId).get();
    if (!rfqDoc.exists) {
      return res.status(404).json({ error: "RFQ tidak ditemukan" });
    }
    const rfq = rfqDoc.data() as any;

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

    await adminDb.collection("reminders").doc(newReminder.id).set(newReminder);
    res.status(201).json(newReminder);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal membuat pengingat", details: error.message });
  }
});

app.post("/api/reminders/:id/trigger", async (req, res) => {
  try {
    const reminderDoc = await adminDb.collection("reminders").doc(req.params.id).get();
    if (!reminderDoc.exists) {
      return res.status(404).json({ error: "Reminder tidak ditemukan" });
    }
    const reminder = reminderDoc.data() as any;

    const rfqDoc = await adminDb.collection("rfqs").doc(reminder.rfqId).get();
    if (!rfqDoc.exists) {
      return res.status(404).json({ error: "RFQ pendukung tidak ditemukan" });
    }
    const rfq = rfqDoc.data() as any;

    const settings = await getCompanySettings();

    await triggerSimulatedReminderEmail(reminder, rfq, settings);
    
    const updatedReminder = {
      ...reminder,
      status: "sent",
      sentAt: new Date().toISOString()
    };
    await adminDb.collection("reminders").doc(req.params.id).set(updatedReminder);
    res.json(updatedReminder);
  } catch (err: any) {
    res.status(500).json({ error: "Gagal mengirimkan email reminder", details: err.message });
  }
});

app.delete("/api/reminders/:id", async (req, res) => {
  try {
    await adminDb.collection("reminders").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menghapus pengingat", details: error.message });
  }
});

app.put("/api/rfqs/:id", async (req, res) => {
  try {
    const rfqRef = adminDb.collection("rfqs").doc(req.params.id);
    const doc = await rfqRef.get();
    if (doc.exists) {
      const existingData = doc.data() || {};
      const newStatus = req.body.status;
      const historyNote = req.body.historyNote;
      const operator = req.body.operator || "Sales Admin";
      
      let history = existingData.history || [];
      if (history.length === 0) {
        history.push({
          status: existingData.status || "pending",
          timestamp: new Date(existingData.date || Date.now()).toISOString(),
          note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
          operator: "Klien"
        });
      }

      if (newStatus && newStatus !== existingData.status) {
        let note = historyNote;
        if (!note) {
          if (newStatus === "pending") note = "Permintaan Penawaran menunggu proposal.";
          if (newStatus === "processing") note = "Sales Engineer sedang menganalisis & memproses RFQ.";
          if (newStatus === "quoted") note = "Surat Penawaran Harga resmi (Quotation) telah diterbitkan.";
          if (newStatus === "completed") note = "Pengadaan selesai & seluruh perangkat dikirim.";
          if (newStatus === "cancelled") note = "RFQ dibatalkan.";
        }
        history.push({
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: note || `Status diperbarui menjadi ${newStatus}.`,
          operator
        });
      }

      const settings = await getCompanySettings();
      const updated = { ...existingData, ...req.body, history };
      await rfqRef.set(updated);

      // Trigger admin email alert
      try {
        await triggerAdminEmailAlert(updated, settings, "update");
      } catch (err) {
        console.error("Error sending admin alert email:", err);
      }

      res.json(updated);
    } else {
      res.status(404).json({ error: "RFQ tidak ditemukan" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Gagal memperbarui RFQ", details: error.message });
  }
});

app.post("/api/rfqs/bulk-status", async (req, res) => {
  try {
    const { rfqIds, status, historyNote, operator } = req.body;
    if (!rfqIds || !Array.isArray(rfqIds) || !status) {
      return res.status(400).json({ error: "Parameter rfqIds dan status diperlukan." });
    }

    const updatedRfqs = [];
    const op = operator || "Sales Admin";

    for (const rfqId of rfqIds) {
      const rfqRef = adminDb.collection("rfqs").doc(rfqId);
      const doc = await rfqRef.get();
      if (doc.exists) {
        const existingData = doc.data() || {};
        let history = existingData.history || [];
        
        if (history.length === 0) {
          history.push({
            status: existingData.status || "pending",
            timestamp: new Date(existingData.date || Date.now()).toISOString(),
            note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
            operator: "Klien"
          });
        }

        if (status !== existingData.status) {
          let note = historyNote;
          if (!note) {
            if (status === "pending") note = "Permintaan Penawaran menunggu proposal.";
            if (status === "processing") note = "Sales Engineer sedang menganalisis & memproses RFQ.";
            if (status === "quoted") note = "Surat Penawaran Harga resmi (Quotation) telah diterbitkan.";
            if (status === "completed") note = "Pengadaan selesai & seluruh perangkat dikirim.";
            if (status === "cancelled") note = "RFQ dibatalkan.";
          }
          history.push({
            status,
            timestamp: new Date().toISOString(),
            note: note || `Status diperbarui menjadi ${status}.`,
            operator: op
          });
        }

        const updated = { ...existingData, status, history };
        await rfqRef.set(updated);
        updatedRfqs.push(updated);
      }
    }

    res.json({ success: true, count: updatedRfqs.length, rfqs: updatedRfqs });
  } catch (error: any) {
    console.error("Error updating bulk status:", error);
    res.status(500).json({ error: "Gagal memperbarui status secara massal", details: error.message });
  }
});

app.post("/api/rfqs/bulk-delete", async (req, res) => {
  try {
    const { rfqIds } = req.body;
    if (!rfqIds || !Array.isArray(rfqIds) || rfqIds.length === 0) {
      return res.status(400).json({ error: "Parameter rfqIds berupa array yang tidak kosong diperlukan." });
    }

    const batch = adminDb.batch();
    for (const rfqId of rfqIds) {
      const rfqRef = adminDb.collection("rfqs").doc(rfqId);
      batch.delete(rfqRef);
    }
    await batch.commit();

    res.json({ success: true, count: rfqIds.length });
  } catch (error: any) {
    console.error("Error deleting bulk RFQs:", error);
    res.status(500).json({ error: "Gagal menghapus RFQ secara massal", details: error.message });
  }
});

app.post("/api/rfqs/bulk-notify", async (req, res) => {
  try {
    const { rfqIds, operator } = req.body;
    if (!rfqIds || !Array.isArray(rfqIds) || rfqIds.length === 0) {
      return res.status(400).json({ error: "Parameter rfqIds berupa array yang tidak kosong diperlukan." });
    }

    const settingsDoc = await adminDb.collection("settings").doc("config").get();
    const settings = settingsDoc.exists ? settingsDoc.data() || {} : {};
    const companyEmail = settings.email || "noreply@berkahbintangsolusindo.com";
    const companyName = settings.companyName || "Berkah Bintang Solusindo (BBS)";
    const op = operator || "Sales Admin";

    const sentEmails = [];
    const updatedRfqs = [];

    for (const rfqId of rfqIds) {
      const rfqRef = adminDb.collection("rfqs").doc(rfqId);
      const doc = await rfqRef.get();
      if (doc.exists) {
        const rfq = doc.data() || {};
        const status = rfq.status || "pending";
        
        let statusTitle = "Pembaruan Status RFQ";
        let statusDesc = "Status penawaran Anda telah diperbarui.";
        let gradient = "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)";
        let statusBadgeColor = "#4f46e5";
        let statusBadgeBg = "#e0e7ff";

        if (status === "pending") {
          statusTitle = "Permintaan Penawaran Dalam Antrean";
          statusDesc = "RFQ Anda saat ini berada dalam antrean peninjauan oleh tim Sales & Technical Engineer kami. Kami akan segera menganalisis spesifikasi kebutuhan Anda.";
          gradient = "linear-gradient(135deg, #64748b 0%, #334155 100%)";
          statusBadgeColor = "#475569";
          statusBadgeBg = "#f1f5f9";
        } else if (status === "processing") {
          statusTitle = "Permintaan Sedang Diproses Analisis";
          statusDesc = "Sales & Technical Engineer kami sedang menganalisis spesifikasi kebutuhan perangkat dan memeriksa estimasi ketersediaan unit di database inventaris.";
          gradient = "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
          statusBadgeColor = "#1d4ed8";
          statusBadgeBg = "#dbeafe";
        } else if (status === "quoted") {
          statusTitle = "Surat Penawaran resmi (Quotation) Telah Terbit";
          statusDesc = "Surat Penawaran Harga resmi (Quotation) untuk RFQ Anda telah berhasil diterbitkan! Anda dapat meninjau detail penawaran, PPN, dan opsi diskon langsung di platform.";
          gradient = "linear-gradient(135deg, #10b981 0%, #047857 100%)";
          statusBadgeColor = "#047857";
          statusBadgeBg = "#d1fae5";
        } else if (status === "completed") {
          statusTitle = "Pengadaan Selesai & Berhasil Dikirim";
          statusDesc = "Seluruh unit perangkat dalam RFQ Anda telah selesai diproses, diverifikasi melalui barcode serial number, dan dikirimkan ke alamat tujuan.";
          gradient = "linear-gradient(135deg, #0d9488 0%, #115e59 100%)";
          statusBadgeColor = "#115e59";
          statusBadgeBg = "#ccfbf1";
        } else if (status === "cancelled") {
          statusTitle = "Permintaan Penawaran Dibatalkan";
          statusDesc = "Permintaan Penawaran (RFQ) Anda saat ini telah dibatalkan atau ditutup. Silakan hubungi representative kami jika Anda memerlukan klarifikasi atau koreksi.";
          gradient = "linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)";
          statusBadgeColor = "#9f1239";
          statusBadgeBg = "#ffe4e6";
        }

        const formattedItems = rfq.items && rfq.items.length > 0
          ? rfq.items.map((item: any, idx: number) => {
              return `<tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 13px; color: #1e293b;">${idx + 1}. <strong>${item.name}</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 13px; color: #1e293b; text-align: center;">${item.quantity} unit</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 13px; color: #64748b;">${item.description || "-"}</td>
              </tr>`;
            }).join("")
          : `<tr><td colspan="3" style="padding: 15px; text-align: center; color: #64748b; font-family: sans-serif; font-size: 13px;">Tidak ada item perangkat</td></tr>`;

        const emailSubject = `[PEMBERITAHUAN STATUS] RFQ ${rfq.rfqNumber} - ${statusTitle}`;

        const emailHtml = `
          <div style="background-color: #f8fafc; padding: 40px 20px; font-family: sans-serif; color: #1e293b;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
              <!-- Header -->
              <div style="background: ${gradient}; padding: 30px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; font-family: sans-serif;">${companyName}</h1>
                <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9; font-family: sans-serif;">Pemberitahuan Status Permintaan Penawaran</p>
              </div>
              
              <!-- Body -->
              <div style="padding: 30px;">
                <p style="font-size: 15px; line-height: 1.6; font-family: sans-serif;">Halo <strong>${rfq.clientName}</strong>,</p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; font-family: sans-serif;">
                  Kami ingin menginformasikan pembaruan status terkini mengenai pengajuan Permintaan Penawaran (RFQ) Anda dengan nomor <strong>${rfq.rfqNumber}</strong>.
                </p>

                <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid ${statusBadgeColor};">
                  <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #475569; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">Status RFQ Terbaru</h3>
                  <div style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; font-family: monospace;">
                    ${status.toUpperCase()}
                  </div>
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155; font-family: sans-serif; font-weight: 500;">
                    ${statusDesc}
                  </p>
                </div>

                <h4 style="margin: 20px 0 10px 0; font-size: 14px; font-weight: 700; color: #1e293b; font-family: sans-serif;">Rangkuman Kebutuhan Unit</h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                  <thead>
                    <tr style="background-color: #f8fafc;">
                      <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; font-family: sans-serif; font-size: 11px; color: #475569; text-transform: uppercase;">Nama Perangkat</th>
                      <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: center; font-family: sans-serif; font-size: 11px; color: #475569; text-transform: uppercase; width: 80px;">Jumlah</th>
                      <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; font-family: sans-serif; font-size: 11px; color: #475569; text-transform: uppercase;">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${formattedItems}
                  </tbody>
                </table>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b; font-family: sans-serif;">
                    Butuh bantuan atau ingin mendiskusikan penawaran harga Anda secara prioritas? Anda dapat membalas email ini secara langsung atau menghubungi tim support kami di nomor WhatsApp: <a href="https://wa.me/${settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : ''}" style="color: #4f46e5; font-weight: bold; text-decoration: none;">${settings.whatsapp || ''}</a>.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 30px; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
                <p style="margin: 0 0 4px 0; font-weight: 700; color: #475569; font-family: sans-serif;">${companyName}</p>
                <p style="margin: 0 0 8px 0; font-family: sans-serif;">${settings.address || ""}</p>
                <p style="margin: 0; font-family: sans-serif;">
                  Email: <a href="mailto:${companyEmail}" style="color: #4f46e5; text-decoration: none;">${companyEmail}</a> | 
                  Website: <a href="http://${settings.website || ""}" style="color: #4f46e5; text-decoration: none;">${settings.website || ""}</a>
                </p>
                <p style="margin: 15px 0 0 0; font-size: 9px; color: #94a3b8; font-family: sans-serif;">
                  Ini adalah email pemberitahuan simulasi otomatis yang dipicu langsung dari dashboard administrator BBS.
                </p>
              </div>
            </div>
          </div>
        `;

        const newEmail = {
          id: "email_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
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

        await adminDb.collection("emails").doc(newEmail.id).set(newEmail);
        sentEmails.push(newEmail);

        let history = rfq.history || [];
        if (history.length === 0) {
          history.push({
            status: rfq.status || "pending",
            timestamp: new Date(rfq.date || Date.now()).toISOString(),
            note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
            operator: "Klien"
          });
        }

        history.push({
          status: rfq.status,
          timestamp: new Date().toISOString(),
          note: `Email notifikasi status "${status.toUpperCase()}" telah dikirim ke klien (${rfq.email}).`,
          operator: op
        });

        const updated = { ...rfq, history };
        await rfqRef.set(updated);
        updatedRfqs.push(updated);
      }
    }

    res.json({ success: true, count: updatedRfqs.length, emailsSentCount: sentEmails.length });
  } catch (error: any) {
    console.error("Error sending bulk notification:", error);
    res.status(500).json({ error: "Gagal mengirim notifikasi secara massal", details: error.message });
  }
});

// API: Quotations
app.get("/api/quotations", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("quotations").get();
    const quotations = snapshot.docs.map(doc => doc.data());
    quotations.sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
    res.json(quotations);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal mengambil data Quotation", details: error.message });
  }
});

app.post("/api/quotations", async (req, res) => {
  try {
    const quoteSnapshot = await adminDb.collection("quotations").get();
    const count = quoteSnapshot.size;

    const id = "q_" + Date.now();
    const newQuotation = {
      id,
      quotationNumber: `Q-BBS-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days
      status: "draft",
      adminSignature: "Direktur Pengadaan BBS",
      ...req.body
    };
    
    await adminDb.collection("quotations").doc(id).set(newQuotation);
    
    // Link to RFQ if exists
    if (newQuotation.rfqId) {
      const rfqRef = adminDb.collection("rfqs").doc(newQuotation.rfqId);
      const rfqDoc = await rfqRef.get();
      if (rfqDoc.exists) {
        const rfqData = rfqDoc.data() || {};
        let history = rfqData.history || [];
        if (history.length === 0) {
          history.push({
            status: rfqData.status || "pending",
            timestamp: new Date(rfqData.date || Date.now()).toISOString(),
            note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
            operator: "Klien"
          });
        }
        history.push({
          status: "quoted",
          timestamp: new Date().toISOString(),
          note: "Surat Penawaran Harga resmi (Quotation) telah diterbitkan secara manual.",
          operator: req.body.operator || "Sales Admin"
        });
        await rfqRef.update({
          generatedQuotationId: id,
          status: "quoted",
          history
        });
      }
    }

    res.status(201).json(newQuotation);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menyimpan Quotation baru", details: error.message });
  }
});

app.put("/api/quotations/:id", async (req, res) => {
  try {
    const quoteRef = adminDb.collection("quotations").doc(req.params.id);
    const doc = await quoteRef.get();
    if (doc.exists) {
      const updated = { ...doc.data(), ...req.body };
      await quoteRef.set(updated);
      res.json(updated);
    } else {
      res.status(404).json({ error: "Quotation tidak ditemukan" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Gagal memperbarui Quotation", details: error.message });
  }
});

// API: Orders (Online Store Beli Langsung)
app.get("/api/orders", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("orders").get();
    const orders = snapshot.docs.map(doc => doc.data());
    // Sort reverse chronological
    orders.sort((a: any, b: any) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.id || "").localeCompare(a.id || "");
    });
    res.json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Gagal mengambil data pesanan", details: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const ordersSnapshot = await adminDb.collection("orders").get();
    const totalCount = ordersSnapshot.size;

    const id = "order_" + Date.now();
    const orderNumber = `TRX-${new Date().getFullYear()}-${String(totalCount + 1).padStart(4, "0")}`;
    const newOrder = {
      id,
      orderNumber,
      date: new Date().toISOString().split("T")[0],
      status: "pending", // pending, processing, shipped, completed, cancelled
      paymentStatus: req.body.paymentMethod === "credit_card" ? "paid" : "unpaid", // unpaid, paid
      ...req.body
    };

    await adminDb.collection("orders").doc(id).set(newOrder);
    res.json(newOrder);
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Gagal menyimpan pesanan baru", details: error.message });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    const orderRef = adminDb.collection("orders").doc(req.params.id);
    const doc = await orderRef.get();
    if (doc.exists) {
      const updated = { ...doc.data(), ...req.body };
      await orderRef.set(updated);
      res.json(updated);
    } else {
      res.status(404).json({ error: "Pesanan tidak ditemukan" });
    }
  } catch (error: any) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Gagal memperbarui data pesanan", details: error.message });
  }
});

// API: AI Consultation Chatbot
app.post("/api/consult", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages history." });
  }

  const aiClient = getAi();

  // Fallback if no Gemini AI is initialized
  if (!aiClient) {
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    let responseText = "Terima kasih telah menghubungi Berkah Bintang Solusindo. Saat ini sistem kecerdasan buatan kami sedang berjalan dalam mode demonstrasi offline. ";
    if (lastUserMsg.toLowerCase().includes("laptop") || lastUserMsg.toLowerCase().includes("komputer")) {
      responseText += "Kami siap menyediakan pengadaan Komputer/Laptop kantor bergaransi resmi dari brand ASUS, Lenovo, Dell, dan HP dengan spesifikasi Core i3/i5/i7 yang sesuai anggaran Anda. Silakan tambahkan item laptop ke Keranjang RFQ Anda di halaman utama kami agar tim kami dapat membuatkan penawaran harga resmi.";
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

    console.log("Calling Gemini API with model gemini-3.5-flash for IT Consultation...");
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah asisten konsultan IT handal untuk Berkah Bintang Solusindo. Berikan jawaban dalam Bahasa Indonesia. Fokus pada solusi teknis yang bergaransi, harga kompetitif, pelayanan purna jual handal, dan pengerjaan oleh teknisi bersertifikat.",
        temperature: 0.7,
      }
    });

    const responseText = response.text || "Maaf, saya tidak dapat merumuskan tanggapan saat ini. Silakan coba lagi.";
    res.json({ text: responseText });
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

  try {
    const rfqDoc = await adminDb.collection("rfqs").doc(rfqId).get();
    if (!rfqDoc.exists) {
      return res.status(404).json({ error: "RFQ not found." });
    }
    const rfq = rfqDoc.data() as any;

    const quoteSnapshot = await adminDb.collection("quotations").get();
    const count = quoteSnapshot.size;

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
        quotationNumber: `Q-BBS-AUTO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
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

    const aiClient = getAi();

    if (!aiClient) {
      const fallbackQuote = generateFallbackQuotation(rfq);
      await adminDb.collection("quotations").doc(fallbackQuote.id).set(fallbackQuote);
      
      const rfqRef = adminDb.collection("rfqs").doc(rfq.id);
      const rfqDoc = await rfqRef.get();
      if (rfqDoc.exists) {
        const rfqData = rfqDoc.data() || {};
        let history = rfqData.history || [];
        if (history.length === 0) {
          history.push({
            status: rfqData.status || "pending",
            timestamp: new Date(rfqData.date || Date.now()).toISOString(),
            note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
            operator: "Klien"
          });
        }
        history.push({
          status: "quoted",
          timestamp: new Date().toISOString(),
          note: "Surat Penawaran Harga resmi (Quotation) telah di-generate secara otomatis.",
          operator: "Sistem (Offline)"
        });
        await rfqRef.update({
          generatedQuotationId: fallbackQuote.id,
          status: "quoted",
          history
        });
      }
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

      const response = await aiClient.models.generateContent({
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

      const newQuotation = {
        id: "q_" + Date.now(),
        rfqId: rfq.id,
        quotationNumber: `Q-BBS-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
        date: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "draft",
        adminSignature: "Direktur Pengadaan BBS",
        ...parsedData
      };

      await adminDb.collection("quotations").doc(newQuotation.id).set(newQuotation);
      
      const rfqRef = adminDb.collection("rfqs").doc(rfq.id);
      let rfqDoc = await rfqRef.get();
      if (rfqDoc.exists) {
        const rfqData = rfqDoc.data() || {};
        let history = rfqData.history || [];
        if (history.length === 0) {
          history.push({
            status: rfqData.status || "pending",
            timestamp: new Date(rfqData.date || Date.now()).toISOString(),
            note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
            operator: "Klien"
          });
        }
        history.push({
          status: "quoted",
          timestamp: new Date().toISOString(),
          note: "Surat Penawaran Harga resmi (Quotation) telah di-generate oleh Gemini AI.",
          operator: "Gemini AI"
        });
        await rfqRef.update({
          generatedQuotationId: newQuotation.id,
          status: "quoted",
          history
        });
      }

      res.status(201).json(newQuotation);
    } catch (err: any) {
      console.error("AI Quotation Generation Error:", err);
      const fallbackQuote = generateFallbackQuotation(rfq);
      await adminDb.collection("quotations").doc(fallbackQuote.id).set(fallbackQuote);
      
      const rfqRef = adminDb.collection("rfqs").doc(rfq.id);
      let rfqDoc = await rfqRef.get();
      if (rfqDoc.exists) {
        const rfqData = rfqDoc.data() || {};
        let history = rfqData.history || [];
        if (history.length === 0) {
          history.push({
            status: rfqData.status || "pending",
            timestamp: new Date(rfqData.date || Date.now()).toISOString(),
            note: "Permintaan Penawaran (RFQ) diajukan oleh klien.",
            operator: "Klien"
          });
        }
        history.push({
          status: "quoted",
          timestamp: new Date().toISOString(),
          note: "Surat Penawaran Harga resmi (Quotation) telah di-generate secara otomatis.",
          operator: "Sistem (Offline)"
        });
        await rfqRef.update({
          generatedQuotationId: fallbackQuote.id,
          status: "quoted",
          history
        });
      }
      res.status(201).json(fallbackQuote);
    }
  } catch (error: any) {
    res.status(500).json({ error: "Gagal memproses dokumen quotation", details: error.message });
  }
});

// Background Service: Periodically check and trigger scheduled follow-up reminders
setInterval(async () => {
  try {
    const remindersSnapshot = await adminDb.collection("reminders").get();
    const reminders = remindersSnapshot.docs.map(doc => doc.data() as any);
    if (reminders.length === 0) return;

    const now = new Date();
    const settings = await getCompanySettings();

    for (const reminder of reminders) {
      if (reminder.status === "scheduled") {
        const scheduledTime = new Date(reminder.scheduledTime);
        if (now >= scheduledTime) {
          const rfqDoc = await adminDb.collection("rfqs").doc(reminder.rfqId).get();

          if (!rfqDoc.exists) {
            await adminDb.collection("reminders").doc(reminder.id).update({
              status: "failed",
              error: "RFQ pendukung tidak ditemukan."
            });
            continue;
          }

          const rfq = rfqDoc.data() as any;

          // If the RFQ is already quoted, completed, or cancelled, do not remind
          if (rfq.status === "quoted" || rfq.status === "completed" || rfq.status === "cancelled") {
            await adminDb.collection("reminders").doc(reminder.id).update({
              status: "cancelled",
              note: `Dibatalkan otomatis karena RFQ berstatus "${rfq.status}"`
            });
            continue;
          }

          // Otherwise, send the reminder email!
          try {
            await triggerSimulatedReminderEmail(reminder, rfq, settings);
            await adminDb.collection("reminders").doc(reminder.id).update({
              status: "sent",
              sentAt: new Date().toISOString()
            });
            console.log(`[Follow-up Scheduler] Sent reminder for RFQ ${rfq.rfqNumber} to ${rfq.email}`);
          } catch (err: any) {
            console.error(`[Follow-up Scheduler] Failed to send reminder for RFQ ${rfq.rfqNumber}:`, err);
            await adminDb.collection("reminders").doc(reminder.id).update({
              status: "failed",
              error: err.message || "Gagal mengirimkan email."
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[Follow-up Scheduler] Background check error:", err);
  }
}, 30000);

// Main full-stack integration handler
async function startServer() {
  // Ensure default data is present on boot
  await seedFirestoreIfNeeded();

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
