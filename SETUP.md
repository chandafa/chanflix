# Menyiapkan Chanflix

1. Jalankan `npm install`.
2. Salin `.env.local.example` ke `.env.local`, lalu isi konfigurasi TMDB, Firebase, dan Watchmode. Jangan commit `.env.local`.
3. Di Firebase Authentication, aktifkan Email/Password dan Google. Tambahkan domain aplikasi pada **Authorized domains**.
4. Buat Cloud Firestore pada proyek yang tercantum di `.firebaserc`.
5. Jalankan `npx firebase login`, lalu `npx firebase deploy --only firestore:rules` untuk menerbitkan [`firestore.rules`](firestore.rules). Periksa nama proyek yang ditampilkan CLI sebelum menyetujui deploy.
6. Jalankan `npm run dev` dan buka `http://localhost:3000`.

Gunakan dua akun di dua browser untuk menguji ruang nonton. Host membuat ruang dari halaman detail, membagikan tautan, lalu memutar video. Peserta dapat mengobrol dan mengikuti posisi video. Video untuk ruang harus berupa tautan YouTube atau file MP4/WebM HTTPS dari host yang tercantum di `NEXT_PUBLIC_TRUSTED_VIDEO_HOSTS`.

Pemutar film di halaman detail mengambil iframe dari sumber yang berhasil dicocokkan judul dan tahunnya. Situs sumber dapat memblokir iframe atau mengubah strukturnya kapan saja. Watchmode menyediakan informasi tempat menonton, bukan file video. Episode anime tanpa tautan streaming resmi tetap mempunyai halaman episode, tetapi tidak mempunyai player langsung.
