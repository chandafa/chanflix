# Chanflix

Katalog film, serial, dan anime dengan wishlist dan ruang nonton bersama. Dibangun dengan Next.js 16, React 19, Firebase Authentication, dan Cloud Firestore.

## Menjalankan proyek

1. Jalankan `npm install`.
2. Salin `.env.local.example` menjadi `.env.local`, lalu isi TMDB dan Firebase. Jangan commit `.env.local`.
3. Aktifkan login Email/Password dan Google pada Firebase Authentication. Tambahkan domain aplikasi ke **Authorized domains**.
4. Buat Cloud Firestore dan publikasikan `firestore.rules` dengan `npx firebase deploy --only firestore:rules`.
5. Jalankan `npm run dev`.

## Katalog dan pemutaran

- Katalog umum memakai metadata TMDB. Halaman `/movies` dan `/movies/kebioskop21` menampilkan film terbaru yang dibaca dari kategori film KeBioskop21. Halaman judul memeriksa apakah player sumber mengizinkan iframe di Chanflix.
- Detail film dan serial TMDB mencoba mencocokkan judul asli dan tahun dengan halaman LK21 serta IDLIX IP. Player hanya ditampilkan untuk sumber yang terdeteksi dapat di-embed; sumber lain ditandai belum tersedia di Chanflix.
- Katalog anime memakai metadata AniList. Daftar episode dan tautan video dicari melalui API Sanka: Otakudesu dan Samehadaku untuk anime Jepang, Donghua dan Donghub untuk anime China. Episode yang tercantum di sumber tampil sebagai tautan; nomor lain dapat diperiksa melalui isian nomor episode. Player FileDon hanya ditampilkan setelah respons server diperiksa.
- Menu `/donghua` memakai katalog Donghua API Sanka langsung. Halaman episode memakai server OK.ru dan D-Tube jika pemeriksaan iframe lolos, serta menyediakan pilihan episode lain dan tombol room otomatis.
- API Sanka memiliki batas publik 60 permintaan per menit. Adapter membatasi hingga 40 permintaan per menit per proses dan menyimpan hasil dengan cache. Ketersediaan dapat berubah ketika API atau server video menolak akses.
- Watchmode hanya menyediakan metadata layanan menonton dan tidak dipakai sebagai sumber video. Alamat Cineby, IDLIX domain, arsip IP, dan Grisham disimpan di contoh konfigurasi; belum ada player yang dapat diverifikasi untuk situs-situs tersebut.
- Wishlist disimpan di Firestore berdasarkan UID akun Firebase.
- Tombol nonton bareng mengambil video dari halaman yang sedang dibuka; pengguna tidak memasukkan URL. Tombol nonaktif jika sumber yang dapat diputar belum ditemukan. Ruang nonton menyinkronkan chat dan peserta melalui Firestore. Video langsung MP4/WebM dapat disinkronkan posisinya. Iframe pihak ketiga dibagikan ke semua peserta, tetapi setiap peserta mengendalikan waktu putarnya sendiri karena browser tidak memberikan akses kontrol lintas situs. Room lama yang memakai YouTube tetap dapat dibuka, tetapi YouTube tidak lagi ditawarkan sebagai sumber baru.

Situs sumber dapat mengganti markup, memblokir permintaan server, atau menolak pemutaran lintas situs. Tidak semua judul di katalog memiliki video yang dapat diputar di Chanflix. Respons HTTP 200 pada halaman embed pun belum membuktikan file video berjalan sampai diuji di browser.

### Hasil pemeriksaan sumber (27 September 2026)

| Sumber | Hasil |
| --- | --- |
| IDLIX IP `154.203.167.249` | Halaman judul dan iframe Playsobat tersedia untuk beberapa film, termasuk `Avatar Aang: The Last Airbender` dan `Coyote vs. Acme`. Adapter aktif. |
| IDLIX `z2.idlixku.com` | Halaman katalog terlihat lewat peramban web, tetapi permintaan dari server aplikasi mendapat HTTP 403. |
| LK21 `tv12.lk21official.cc` | Halaman judul tersedia; player Videonode merespons HTTP 403 dan `X-Frame-Options: SAMEORIGIN`. |
| KeBioskop21 | Katalog dan detail film tersedia; player AbyssCDN merespons HTTP 403 dan menolak iframe. Katalog aktif, pemutaran yang diblokir diberi status belum tersedia. |
| Arsip `139.59.113.220` | Halaman film tersedia; contoh iframe Morencius merespons HTTP 403. |
| Cineby | Halaman utama tersedia, tetapi `X-Frame-Options: SAMEORIGIN` menolak penanaman halaman. |
| Grisham Farms | Halaman utama tersedia; contoh detail film menutup koneksi saat diambil server. |
| Watchmode | Metadata ketersediaan layanan, bukan file/player video. |
| Sanka Donghua | Episode BTTH 212 memberi embed OK.ru dan D-Tube dengan respons yang mengizinkan iframe. |

## Pemeriksaan

Jalankan `npm run lint` dan `npm run build`. Untuk pemeriksaan manual, buka `/movies/kebioskop21`, satu halaman judul film, dan episode anime yang memiliki tautan Sanka. Uji ruang nonton dengan dua akun pada dua browser atau perangkat.
