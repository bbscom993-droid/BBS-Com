import { ServiceOffering, ProductItem } from "./types";
import imgLenovo from "./assets/images/lenovo_thinkbook_1782410804422.jpg";
import imgAsus from "./assets/images/asus_expertcenter_1782410820249.jpg";
import imgDell from "./assets/images/dell_poweredge_1782410833679.jpg";
import imgSynology from "./assets/images/synology_nas_1782410848563.jpg";
import imgMikrotik from "./assets/images/mikrotik_router_1782410863979.jpg";
import imgUnifi from "./assets/images/unifi_ap_1782410878346.jpg";
import imgHikvision from "./assets/images/hikvision_camera_1782410893714.jpg";
import imgMicrosoft from "./assets/images/microsoft_365_1782410907906.jpg";

export const SERVICE_OFFERINGS: ServiceOffering[] = [
  {
    id: "srv_1",
    name: "Pengadaan Komputer & Laptop",
    description: "Pengadaan komputer workstation, PC All-in-One, laptop bisnis, serta mini PC bergaransi resmi untuk operasional kantor, lembaga pendidikan, swasta, dan laboratorium computer.",
    category: "Hardware",
    icon: "Laptop",
    features: [
      "Produk original 100% bergaransi resmi distributor Indonesia",
      "Pilihan brand ternama (ASUS, Lenovo, HP, Dell, Acer)",
      "Ready stock tipe bisnis tahan banting dengan sistem keamanan tinggi",
      "Custom spec sesuai kebutuhan aplikasi (kantor, desain grafis, coding)"
    ]
  },
  {
    id: "srv_2",
    name: "Pengadaan Server & Storage",
    description: "Solusi server handal tipe Rackmount maupun Tower, serta penyimpanan skala besar (NAS/SAN/DAS) untuk menjamin kelancaran database dan file sharing perusahaan Anda.",
    category: "Infrastructure",
    icon: "Server",
    features: [
      "Konfigurasi RAID hardware untuk ketahanan kegagalan disk",
      "Processor server-grade Intel Xeon / AMD EPYC berkapasitas besar",
      "Sistem pendingin server room & rak server komprehensif",
      "Backup sistem otomatis & penyimpanan cloud hybrid"
    ]
  },
  {
    id: "srv_3",
    name: "Instalasi Jaringan LAN / WAN",
    description: "Perancangan dan penarikan infrastruktur kabel jaringan terstruktur, setting router, switch manageable, VPN antarkantor, serta instalasi access point Wi-Fi berkecepatan tinggi.",
    category: "Networking",
    icon: "Network",
    features: [
      "Kabel UTP/FTP Cat6 berkualitas tinggi dengan hasil tes Fluke",
      "Konfigurasi router Mikrotik, Cisco, Ubiquiti, Ruijie",
      "Manajemen bandwidth cerdas untuk kelancaran video conference",
      "Setting keamanan nirkabel (SSID tamu, voucher, enkripsi enterprise)"
    ]
  },
  {
    id: "srv_4",
    name: "CCTV & Security System",
    description: "Sistem keamanan kamera pengawas CCTV IP maupun Analog berkualitas tinggi untuk monitoring ruangan kantor, koridor, parkiran, gudang, maupun area pabrik.",
    category: "Security",
    icon: "ShieldCheck",
    features: [
      "Kamera beresolusi tinggi (2MP s.d 4K) dengan fitur infra merah/night color",
      "Koneksi online untuk monitoring jarak jauh via Android/iOS",
      "Penyimpanan rekaman aman hingga 30 hari atau lebih",
      "Instalasi kabel rapi menggunakan konduit pelindung"
    ]
  },
  {
    id: "srv_5",
    name: "Software & Licensing",
    description: "Penyediaan lisensi perangkat lunak resmi sistem operasi Windows, paket produktivitas Microsoft 365, software desain Adobe, CAD, Antivirus, serta operating system server.",
    category: "Software",
    icon: "Key",
    features: [
      "Pembelian lisensi resmi legal (CSP, ESD, OLP)",
      "Aman dari tuntutan hukum hak kekayaan intelektual (HAKI)",
      "Bantuan instalasi awal dan proses aktivasi sistem",
      "Lisensi langganan tahunan maupun lifetime pembelian sekali"
    ]
  },
  {
    id: "srv_6",
    name: "Maintenance & Support",
    description: "Kontrak kerja sama perawatan hardware dan software rutin (SLA) untuk memastikan seluruh aset IT Anda bekerja maksimal tanpa gangguan (downtime).",
    category: "Support",
    icon: "Wrench",
    features: [
      "Pembersihan debu fisik PC/Server & optimasi software rutin",
      "Kunjungan darurat (emergency visit) teknisi dalam hitungan jam",
      "Laporan status kesehatan IT berkala bagi manajemen",
      "Layanan helpdesk online & remote troubleshooting instan"
    ]
  },
  {
    id: "srv_7",
    name: "IT Consulting",
    description: "Layanan konsultasi analisis kebutuhan teknologi informasi, pembuatan blueprint arsitektur sistem, audit keamanan jaringan, dan roadmap digitalisasi bisnis.",
    category: "Consulting",
    icon: "HeartHandshake",
    features: [
      "Analisis mendalam proses bisnis dan pain point operasional",
      "Rekomendasi spesifikasi yang hemat biaya namun berskala jangka panjang",
      "Desain skema topologi jaringan dan arsitektur server terperinci",
      "Pendampingan vendor audit & penyusunan dokumen teknis TOR/KAK"
    ]
  },
  {
    id: "srv_8",
    name: "Managed Services",
    description: "Serahkan seluruh pengelolaan IT kantor Anda kepada tim profesional kami. Dari helpdesk harian, sewa perangkat komputer, cloud hosting, hingga admin jaringan.",
    category: "Support",
    icon: "Activity",
    features: [
      "Sewa komputer/laptop jangka panjang tanpa pusing depresiasi aset",
      "Monitoring jaringan nirkabel dan firewall 24/7",
      "Managed backup database harian di luar lokasi (off-site)",
      "Tim support yang berdedikasi tinggi layaknya divisi IT internal"
    ]
  }
];

export const PRODUCT_CATALOG: ProductItem[] = [
  {
    id: "prod_1",
    name: "Laptop Kantor Lenovo ThinkBook 14 G6",
    category: "Komputer & Laptop",
    description: "Laptop tangguh bodi aluminium khusus bisnis berkinerja tinggi dengan keamanan fingerprint sensor.",
    estimatedPriceRange: "Rp 10.500.000 - Rp 14.500.000",
    specifications: [
      "Processor Intel Core i5 / i7 Generasi Terbaru",
      "RAM 8GB / 16GB DDR5 High Speed",
      "Storage 512GB / 1TB SSD NVMe PCIe",
      "Layar 14\" IPS WUXGA Anti-Glare",
      "Windows 11 Pro Original"
    ],
    icon: "Laptop",
    image: imgLenovo
  },
  {
    id: "prod_2",
    name: "PC Desktop ASUS ExpertCenter D7 Mini Tower",
    category: "Komputer & Laptop",
    description: "PC desktop handal performa tinggi dengan ketahanan kelas militer (MIL-STD 810H) untuk produktivitas harian kantor.",
    estimatedPriceRange: "Rp 8.500.000 - Rp 12.000.000",
    specifications: [
      "Intel Core i3 / i5 Processor",
      "RAM 8GB DDR4 (Expandable to 128GB)",
      "Storage 512GB SSD NVMe",
      "Monitor ASUS 21.5\" FHD",
      "Sudah termasuk Keyboard & Mouse USB ASUS"
    ],
    icon: "Monitor",
    image: imgAsus
  },
  {
    id: "prod_3",
    name: "Server Rackmount Dell PowerEdge R250",
    category: "Server & Storage",
    description: "Server rackmount 1U entry-level yang bertenaga, ideal untuk menangani kolaborasi file sharing, web hosting, dan database.",
    estimatedPriceRange: "Rp 26.500.000 - Rp 38.000.000",
    specifications: [
      "Intel Xeon E-2314 2.8GHz",
      "RAM 16GB UDIMM ECC Server Memory",
      "Storage 2x 2TB SATA 7.2K Enterprise HDD (RAID 1)",
      "Dual Gigabit Ethernet Ports",
      "Dell iDRAC9 Basic Remote Management"
    ],
    icon: "Database",
    image: imgDell
  },
  {
    id: "prod_4",
    name: "Synology NAS Storage DS923+",
    category: "Server & Storage",
    description: "Pusat penyimpanan data berkapasitas besar dan backup terpusat untuk keamanan file penting seluruh karyawan kantor.",
    estimatedPriceRange: "Rp 12.500.000 - Rp 18.000.000 (Tanpa HDD)",
    specifications: [
      "AMD Ryzen R1600 Dual-Core 2.6GHz",
      "4-Bay Drive (Mendukung HDD/SSD 3.5\" & 2.5\")",
      "RAM 4GB DDR4 ECC (Upgradable to 32GB)",
      "Built-in 2x M.2 NVMe Slot untuk SSD Cache",
      "Synology DiskStation Manager (DSM) OS"
    ],
    icon: "HardDrive",
    image: imgSynology
  },
  {
    id: "prod_5",
    name: "Router Mikrotik RB5009UG+S+IN",
    category: "Infrastruktur Jaringan",
    description: "Routerboard tangguh kelas enterprise berkecepatan tinggi dengan port SFP+ 10Gbps untuk manajemen bandwidth kantor besar.",
    estimatedPriceRange: "Rp 3.800.000 - Rp 4.500.000",
    specifications: [
      "Marvell Armada Quad-core 1.4GHz CPU",
      "1GB RAM DDR4 & 512MB NAND Storage",
      "7x Gigabit Ethernet Ports & 1x 2.5G Port",
      "1x 10G SFP+ Cage untuk koneksi FO",
      "MikroTik RouterOS v7 License Level 5"
    ],
    icon: "Cpu",
    image: imgMikrotik
  },
  {
    id: "prod_6",
    name: "Access Point Ubiquiti UniFi U6-Lite",
    category: "Infrastruktur Jaringan",
    description: "Access point Wi-Fi 6 indoor berdesain minimalis dengan jangkauan sinyal luas dan stabil untuk lingkungan padat pengguna.",
    estimatedPriceRange: "Rp 2.100.000 - Rp 2.500.000",
    specifications: [
      "Wi-Fi 6 (802.11ax) Dual-Band High Speed",
      "Kecepatan s.d 1.5 Gbps (5GHz & 2.4GHz)",
      "Cakupan Sinyal s.d 115 m² (1,250 ft²)",
      "Mendukung 300+ Koneksi Client Bersamaan",
      "Powered by PoE (Power over Ethernet)"
    ],
    icon: "Wifi",
    image: imgUnifi
  },
  {
    id: "prod_7",
    name: "IP Camera Dome Hikvision DS-2CD1123G0-I",
    category: "CCTV & Security",
    description: "Kamera pengawas indoor tipe dome tahan benturan (Vandal-Proof IK10) dengan gambar tajam siang dan malam.",
    estimatedPriceRange: "Rp 1.100.000 - Rp 1.400.000",
    specifications: [
      "Resolusi Full HD 1080p (2 Megapixel)",
      "Lensa Wide Angle 2.8mm (Sudut pandang luas)",
      "Night Vision Smart IR s.d Jarak 30 Meter",
      "Sertifikasi Tahan Air IP67 & Vandal-proof IK10",
      "Teknologi Kompresi Hemat Bandwidth H.265+"
    ],
    icon: "Shield",
    image: imgHikvision
  },
  {
    id: "prod_8",
    name: "Lisensi Microsoft 365 Business Standard",
    category: "Software & Lisensi",
    description: "Langganan lisensi produktivitas kerja kolaboratif lengkap dengan aplikasi desktop Office terbaru dan cloud email premium.",
    estimatedPriceRange: "Rp 195.000 - Rp 230.000 / User / Bulan",
    specifications: [
      "Aplikasi Premium: Word, Excel, PowerPoint, Outlook",
      "Email Bisnis Exchange dengan Storage 50GB per user",
      "Penyimpanan Cloud OneDrive for Business 1TB",
      "Microsoft Teams untuk meeting online up to 300 orang",
      "Bisa diinstal di 5 perangkat (PC/Mac/HP) per user"
    ],
    icon: "FileCode",
    image: imgMicrosoft
  }
];
