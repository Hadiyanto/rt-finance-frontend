# RT Finance — Frontend

Aplikasi web (PWA, mobile-first) keuangan RT 001/016 Graha Mampang Mas: warga melaporkan iuran yang sudah ditransfer, pengurus menyetujui laporan dan mengelola kas.

Backend: [rt-finance-backend](https://github.com/Hadiyanto/rt-finance-backend).

## Halaman

| Halaman | Untuk | Isi |
|---|---|---|
| `/` | Warga | **Setor Iuran**: pilih satu atau beberapa rumah, beberapa bulan sekaligus (termasuk tunggakan & bulan ke depan), nominal transfer + perkiraan, upload bukti |
| `/thr` | Warga | Lapor THR (per rumah per tahun) |
| `/report-iuran` | Publik | Laporan iuran per bulan: total, rekap setoran, status per rumah, ekspor PDF |
| `/rekap-thr` | Publik | Rekap THR per tahun |
| `/pengeluaran` | Publik / pengurus | Kas: saldo, iuran mengendap, riwayat transaksi. Pengurus: input manual (+), catat iuran bulanan & THR ke kas (tombol **Iuran**), approve transaksi |
| `/login`, `/profile` | Pengurus | Login (ikon orang di kanan atas `/`), profil, menu admin |
| `/approval-iuran` | Pengurus | Setujui / tolak laporan iuran & THR (bandingkan nominal transfer, seharusnya, dan OCR) |
| `/unpaid-residents` | Pengurus | Tunggakan per rumah, kirim pengingat lewat WhatsApp (`wa.me`), ekspor PDF |

Semua panggilan API lewat satu client: [`src/lib/api.ts`](src/lib/api.ts) (base URL, token, error, redirect ke login saat sesi habis).

## Development

```bash
npm install
cp .env.example .env.local   # atau isi manual, lihat di bawah
npm run dev -- -p 3030       # http://localhost:3030
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3031
```

Backend lokal berjalan di port 3031 (lihat README backend). Login pengurus lokal: `dev@local.test` / `rahasia123` (dibuat oleh `scripts/db-reset-local.sh` di backend).

## Build

```bash
npm run build                 # output: .next/standalone (untuk Docker)
node .next/standalone/server.js
```

`NEXT_PUBLIC_API_URL` dibaca saat build, jadi untuk produksi isi dengan `https://api-gmm-rt001.ruangin.xyz` sebelum `npm run build`.

## Teknologi

Next.js 16 (App Router, semua halaman client component), React 19, Tailwind CSS 4, react-icons, jsPDF.
