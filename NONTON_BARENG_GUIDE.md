# Panduan nonton bareng

1. Masuk dengan akun Firebase.
2. Buka detail film atau anime dan pilih **Nonton bareng**.
3. Masukkan tautan YouTube. Trailer resmi digunakan sebagai awal bila tersedia. Untuk file video langsung, gunakan HTTPS MP4/WebM dari host yang didaftarkan di `NEXT_PUBLIC_TRUSTED_VIDEO_HOSTS`.
4. Pilih **Buat ruang** dan salin tautannya.
5. Teman masuk dengan akun Firebase lalu membuka tautan tersebut. Chat dan daftar peserta diperbarui secara real time. Host mengendalikan putar, jeda, dan posisi video.

Browser peserta mungkin menahan autoplay. Jika demikian, peserta menekan **Sinkronkan pemutaran** sekali. Jeda jaringan dan kebijakan browser dapat menyebabkan selisih beberapa detik; player akan menyesuaikan lagi saat menerima perubahan host.

## Syarat Firebase

Publikasikan [`firestore.rules`](firestore.rules) pada proyek yang sama dengan `.env.local`. Aturan lama yang hanya mengizinkan host menulis dokumen room tidak cukup untuk koleksi chat dan peserta. `firebase.json` sudah disiapkan untuk Firebase CLI. Jika Anda memakai Firebase Console, salin seluruh isi file aturan dan tekan **Publish**.

Room yang dibuat tidak dihapus otomatis. Penghapusan otomatis memerlukan kebijakan TTL atau tugas terjadwal di proyek Firebase.
