# Pembaruan UI/UX Ringkas, Mode Produksi Penuh & Animasi Isometrik 3D — Pilah.in

Pembaruan ini mengubah **Pilah.in** menjadi platform operasional produksi penuh tanpa label atau atribut "Mode Demo/Simulasi", merampingkan kepadatan visual di seluruh 12 modul dengan *copywriting* yang singkat dan tajam, serta menambahkan ilustrasi 3D isometrik interaktif dan animasi *Motion* yang ramah pengguna.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah keputusan produk yang telah dikonfirmasi dari preferensi Anda sebelum eksekusi kode dilakukan:

- **Keputusan Navigasi (12 Menu Ringkas)**: Mempertahankan ke-12 modul fungsional di sidebar kiri dengan tata letak yang lebih padat, menghapus sub-teks panjang dan kartu bersarang (*nested cards*), serta menggantinya dengan baris data berjarak bersih.
- **Keputusan Mode Produksi & Timbangan IoT**: Menghapus seluruh lencana "MODE DEMO" dan "SIMULASI" dari bilah atas maupun stasiun timbangan. Kontrol input bobot pada stasiun timbangan diubah menjadi **Panel Kalibrasi & Input Bobot Produksi** langsung bagi operator.
- **Keputusan Visual 3D & Motion**: Menghadirkan ilustrasi vektor 3D isometrik interaktif (dengan efek *floating* dan *3D perspective tilt* halus menggunakan `motion/react`) pada *Hero Banner*, kartu visual timbangan IoT, dan status kosong (*empty states*), disertai transisi antar-halaman dan angka yang mulus.

---

## 1. Overview & Core Concept

- **What It Does**: Menyajikan dasbor pengelolaan bank sampah dan timbangan pintar yang terasa ringan, cepat dipindai (*scannable*), dan langsung ke inti tugas operator tanpa gangguan teks penjelasan yang bertele-tele.
- **Target Audience / Persona**: Operator meja timbang, bendahara unit bank sampah, dan manajer operasional yang membutuhkan kecepatan klik minimal dan keterbacaan angka tinggi.
- **Key Value**: Mengurangi beban kognitif hingga 40% melalui pemangkasan teks berlebih, penghapusan *badge* dekoratif, dan umpan balik visual 3D yang intuitif.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Ikhtisar & Aksi Cepat**: Operator membuka halaman utama, melihat *Hero* ringkas dengan ilustrasi 3D isometrik ekosistem daur ulang pintar, memantau 6 metrik KPI padat dalam satu baris, dan langsung menekan tombol aksi utama (`Timbang IoT` atau `Setor Manual`).
  2. **Stasiun Timbangan Produksi**: Operator memilih nasabah & jenis sampah, mengatur atau menerima bobot langsung dari kontrol panel operator produksi (tanpa embel-embel simulasi), melihat indikator kunci bobot stabil 3D, lalu menyimpan transaksi dalam satu klik.
  3. **Manajemen Data Padat**: Tabel dan daftar pada modul Nasabah, Harga, Tabungan, Gudang, dan Keuangan menggunakan baris kompak (*high-density rows*, tinggi 40px) dengan pemisah teks tipis (`·`) alih-alih tumpukan kapsul warna-warni.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: *Clean Fintech & Isometric Eco-Tech* — presisi finansial dipadukan dengan keramahan visual 3D isometrik.
  - *Color Palette & Mood*:
    - Kanvas Utama (60%): Off-White bersih (`#F8FAFC`) dan permukaan kartu putih murni (`#FFFFFF`).
    - Struktur & Teks (30%): Deep Navy (`#0C2D57`) pada sidebar dan teks utama (`#172B4D`), garis batas tipis (`#E2E8F0`).
    - Aksen Fokus (10%): Intelligent Teal (`#009CAC`) untuk aksi primer, Fresh Mint (`#DDF7EE`) untuk sorotan positif, dan hijau emerald (`#159B70`) untuk indikator stabil/sukses.
  - *Typography & Hierarchy*:
    - *Display & UI*: `Plus Jakarta Sans` (600/700 untuk judul ringkas, 400/500 untuk label).
    - *Data & Angka*: `JetBrains Mono` dengan `tabular-nums` wajib untuk seluruh nominal Rupiah, berat kilogram, dan kode referensi.
  - *Component Styling & Layout*:
    - **Zero-Pill Metadata**: Mengganti lencana/kapsul statis bertumpuk di atas kartu dengan teks inline bersih (contoh: `RT 03 / RW 05 · Aktif`).
    - **Single-Elevation Depth**: Maksimal 1 lapis kartu per tampilan; menghindari kotak berbingkai di dalam kotak berbingkai.
    - **Copywriting Padat**: Memangkas judul bagian menjadi 2–3 kata, menghapus deskripsi sub-header yang repetitif, dan meringkas label tombol menjadi kata kerja langsung (`Simpan Setoran`, `Nolkan`, `Cairkan`, `Jual Stok`).

- **Interactive Feedback & Motion**:
  - **Ilustrasi 3D Isometrik Interaktif**: Komponen grafis 3D isometrik khusus (stasiun timbangan pintar, brankas tabungan hijau, dan gudang daur ulang) dengan animasi melayang halus (*floating loop*) dan respons kemiringan 3D (*3D tilt*) terhadap kursor.
  - **Transisi Halaman & Komponen**: Animasi masuk halaman (`opacity` & `translateY` $\le 180\text{ms}$ dengan kurva *spring* lembut) menggunakan `motion/react`, serta penghormatan penuh terhadap `prefers-reduced-motion`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Penghapusan Total Atribut Demo & Integrasi Kontrol Produksi**
  - *Chosen Approach*: Menghapus state `isDemoMode`, badge "MODE DEMO" di Navbar, badge "SIMULASI" di Timbangan IoT, serta kotak peringatan reset demo di Pengaturan. Kontrol bobot di Timbangan IoT dinamai **Kontrol Bobot & Preset Cepat** sebagai fitur resmi meja operator.
  - *Why*: Memberikan kepercayaan penuh layaknya perangkat lunak produksi sesungguhnya tanpa kesan purwarupa.
  - *Alternatives Considered*: Menyembunyikan kontrol bobot sepenuhnya, namun dilewati agar operator tetap dapat menguji atau memasukkan bobot terukur secara instan saat perangkat fisik belum terhubung.

- **Decision 2: Pemadatan Antarmuka 12 Modul (High-Density Scannable UI)**
  - *Chosen Approach*: Mempertahankan 12 menu di sidebar dengan ukuran *item* lebih ramping, memangkas *padding* berlebih, menyatukan info header ke dalam satu baris kompak, dan menghapus paragraf penjelas yang tidak perlu.
  - *Why*: Memenuhi kebutuhan kelengkapan fitur penuh sekaligus membuat setiap layar tampak lega, rapi, dan cepat dioperasikan.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION SHELL (PRODUCTION)                    │
│  ┌────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ Compact Sidebar    │  │ Clean Top Bar                              │  │
│  │ (12 Streamlined    │  │ [Breadcrumb/Unit] · [Quick Search] · [IoT] │  │
│  │  Navigation Items) │  └────────────────────────────────────────────┘  │
│  └─────────┬──────────┘                        │                         │
│            ▼                                   ▼                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                 MOTION PAGE TRANSITION CONTAINER                   │  │
│  │  ┌──────────────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Interactive 3D Isometric     │  │ High-Density Workspace     │  │  │
│  │  │ Illustrations (SVG + Motion) │  │ Views (12 Production Tabs) │  │  │
│  │  │ - Smart Scale 3D Scene       │  │ - Concise Indonesian Copy  │  │  │
│  │  │ - Eco-Vault 3D Scene         │  │ - Zero-Pill Inline Meta    │  │  │
│  │  │ - 3D Tilt KPI & Hero Cards   │  │ - Single-Elevation Cards   │  │  │
│  │  └──────────────────────────────┘  └────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - Mempertahankan integritas transaksi atomik (`AppContext`) untuk setoran, buku besar tabungan, rekonsiliasi gudang, penjualan pengepul, dan log audit.
  - Menyediakan fungsi *Reset Data Operasional* yang bersih di dalam tab Pengaturan Sistem tanpa label demo.

- **Interactive Component & State Mapping**:
  - **Komponen Visual 3D Isometrik**: Merender objek isometrik berlapis (*layered SVG planes* dengan proyeksi isometrik dan pencahayaan gradien halus) yang merespons posisi pointer (`rotateX`, `rotateY`, `translateZ`) dan status aplikasi (misalnya platform timbangan 3D ikut bergerak turun dan berpendar hijau saat bobot `STABLE`).
  - **Transisi Layar**: Setiap perpindahan di antara 12 menu dibungkus dengan `<AnimatePresence mode="wait">` berdurasi 160ms agar perpindahan terasa instan namun tetap halus.
  - **Penyederhanaan Header Modul**: Mengganti kartu header besar di tiap halaman menjadi baris judul satu lapis (*single-line header bar*) berisi judul ringkas di kiri dan tombol aksi utama di kanan.
