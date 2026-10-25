# Valen Database — Telegram + WhatsApp pairing

Bot terpisah dari website Next.js. Akun dibuat dan dikelola melalui bot Telegram; website tetap dapat dipakai sebagai dashboard. Bot ini menyediakan pengelolaan akun/role, pairing WhatsApp milik pengguna yang memberi izin, serta notifikasi saat koneksi berubah. Bot ini sengaja tidak menyertakan fitur blast, spam, atau pengiriman otomatis ke daftar nomor.

## Persiapan

1. Gunakan Node.js 20 atau lebih baru.
2. Buat bot lewat `@BotFather`, lalu salin token.
3. Di folder `telegram-bot`, salin `.env.example` menjadi `.env` dan isi `TELEGRAM_BOT_TOKEN` serta `OWNER_TELEGRAM_IDS` dengan Telegram user ID milik owner.
4. Jalankan `npm install` lalu `npm start`.
5. Simpan folder `data/` secara persisten. Folder itu berisi database akun dan kredensial sesi WhatsApp; jangan upload ke Git atau membagikannya.

Contoh:

```bash
cd telegram-bot
cp .env.example .env
npm install
npm start
```

## Login dan hak akses

Owner bootstrap adalah Telegram ID di `OWNER_TELEGRAM_IDS`. Buat akun pertama dengan `/addowner username,password`, kemudian pemilik akun dapat menjalankan `/login username,password` dari chat pribadi bot untuk menautkan Telegram ID. Password disimpan dalam bentuk hash bcrypt. Jangan gunakan password yang sama dengan layanan lain.

Role dari level rendah ke tinggi: `user`, `seller` (alias perintah `seler`), `prem`, `admin`, `partner`, `owner`. Masa aktif menerima `1d`, `7d`, `30d`, `12h`, dan `unlimited`.

## Perintah

- `/start` — menu utama; opsional `START_MEDIA_URL` dapat berisi URL langsung gambar atau MP4.
- `/login username,password` — menautkan akun database ke Telegram.
- `/adduser username,password`
- `/addseler username,password`
- `/addprem username,password`
- `/addpartner username,password`
- `/addadmin username,password`
- `/addowner username,password`
- `/addrole seler,username,7d`
- `/deleteakun username`
- `/pairpriv 62xxxxxxxxxx,username` — menautkan sender ke akun tertentu.
- `/pairpub 62xxxxxxxxxx` — mendaftarkan sender public.
- `/ceksender` — melihat status koneksi.

Pairing menghasilkan kode yang harus dimasukkan di WhatsApp milik pemilik nomor tersebut. Jangan pernah meminta atau membagikan kode pairing kepada pihak lain. Sender public di versi ini hanya didaftarkan dan status koneksinya dipantau; sistem tidak menyediakan endpoint pengiriman pesan publik. Pengiriman pesan otomatis/massal belum dibuat.

## Catatan deployment

- Jalankan bot sebagai proses Node.js persisten (VPS/container/worker), bukan di fungsi serverless yang tidur atau di-restart terus-menerus.
- Atur backup terenkripsi untuk `data/`, batasi akses filesystem, dan jangan commit `.env`, `database.json`, atau `whatsapp-sessions/`.
- Baileys adalah library WhatsApp Web pihak ketiga, bukan API resmi WhatsApp Business. Penggunaan dapat terputus atau terkena pembatasan; untuk layanan produksi gunakan WhatsApp Business Platform resmi.

## Pembaruan pairing dan tampilan

- Menu utama memakai panel ringkas dengan jumlah akun aktif, sender online, tombol Pair Private/Public, profil, dan bantuan.
- Kode pairing meminta waktu inisialisasi socket yang lebih longgar dan mencoba ulang hingga tiga kali jika Baileys belum siap.
- Sesi yang sudah tersimpan dicoba dipulihkan saat proses bot mulai ulang; status perubahan koneksi dikirim ke chat Telegram peminta.
- Jalankan pada Node.js 20+ dengan penyimpanan `DATA_DIR` persisten. Pairing tetap bergantung pada koneksi internet, kondisi layanan WhatsApp, dan kompatibilitas Baileys; tidak ada cara menjamin koneksi 100% selalu berhasil.
