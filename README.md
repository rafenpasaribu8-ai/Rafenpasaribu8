# IX-C Forever · Kenangan Kelas 9C

Sebuah memorial digital untuk menyimpan foto, cerita, dan momen kebersamaan Kelas 9C.

**Live website:** https://rafenpasaribu8-ai.github.io/Rafenpasaribu8/

## Fitur

- Desain responsif untuk ponsel, tablet, dan desktop.
- Galeri foto dengan tampilan lightbox, tombol navigasi, dan dukungan geser pada perangkat sentuh.
- Sistem visual glassmorphism dengan aksen warna aurora.
- Animasi masuk dan transisi halus, dengan dukungan preferensi **reduced motion**.
- Navigasi mobile yang ramah keyboard.
- Tombol berbagi tautan galeri menggunakan fitur share bawaan perangkat saat tersedia.
- Pemuatan gambar bertahap untuk membantu menjaga performa.

## Struktur proyek

- \`index.html\` — konten dan struktur halaman.
- \`assets/\` — foto-foto memorial asli.
- \`upgrade.css\`, \`mobile-fix.css\`, \`pro.css\` — desain, responsivitas, dan lapisan visual.
- \`upgrade.js\`, \`pro.js\` — interaksi galeri, navigasi, dan fitur berbagi.

Tidak diperlukan framework, bundler, atau dependensi pihak ketiga untuk menjalankan website ini.

## Menjalankan secara lokal

Dari direktori proyek, jalankan:

\`\`\`bash
python -m http.server 8000
\`\`\`

Kemudian buka http://localhost:8000 di browser.

## Publikasi

Website dipublikasikan melalui GitHub Pages dari branch \`main\`. Perubahan pada file situs akan memicu proses build/deployment GitHub Pages.

## Menjaga foto

Foto-foto di folder \`assets/\` merupakan bagian inti dari memorial ini. Saat memperbarui desain atau konten, pertahankan sumber foto dan nama file yang dirujuk oleh \`index.html\` agar galeri serta spotlight tetap berfungsi.

---

Dibuat untuk menjaga kenangan Kelas 9C tetap dekat, bahkan setelah perjalanan sekolah berubah.
