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
  ]
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
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading DB, returning defaults:", error);
    return DEFAULT_DB;
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
  writeDB(db);
  res.status(201).json(newRfq);
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
