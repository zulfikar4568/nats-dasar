# Pendahuluan
## Koneksi NATS Client Application ke NATS Server

Agar bisa publish/subscribe message subject, kita harus konfigurasi:
- NATS_URL = Format string, yang digunakan untuk membangun koneksi (plain TCP, TLS, or Websocket).
  1. TLS encrypted only TCP connection `tls://...`
  2. TLS encrypted jika di konfigurasikan atau konfigurasi plain un-encrypted TCP `nats://...`
  3. Websocket `ws://...`
  4. Koneksi ke cluster `nats://server1:port1,nats://server2:port2`
- Authentikasi (opsional) jika kita butuh aplikasi kita lebih secure. NATS support multi authentikasi (username/password, decentralized JWT, Token, TLS Certificate, NKey Challange)


## NATS Quality of Service (QoS)
Terdapat beberapa QoS di NATS, tergantung dari aplikasi yang kita gunakan apakah Core NATS atau menambahkan fiture JetStream (Jetstream di bangun ke dalam `nats-server` yang mungkin tidak dikonfigurasikan)
- **At most once QoS**: Core NATS menawarkan at most once QoS. Jika subscriber tidak listen ke subject (no subject match), atau tidak aktif ketika message di kirim, message tidak akan diterima. Ini sama dengan level garansi TCP/IP. Core NATS adalah kirim dan lupakan messaging system. **hanya akan di dalam memori dan tidak akan di simpan di disk**
- **At Least / exaclty once QoS**: Jika kamu butuh QoS dengan order tinggi (At Least & exaclty once), atau fungsi yang seperti *persistent streaming, de-coupled flow control, and Key/Value Store* kita bisa gunakan **NATS JetStream** (harus di aktifkan di dalam `NATS server`)

## Setup NATS

Install NATS CLI Tools Di MacOS
```bash
brew tap nats-io/nats-tools
brew install nats-io/nats-tools/nats
```

Install NATS Server secara lokal di MacOS
```bash
brew install nats-server
```

Jalankan NATS Server
```bash
nats-server
# atau jika ingin mengaktifkan fitur monitoring HTTP
nats-server -m 8222
```
Buka di Web browser kita `0.0.0.0:8222` dan NATS Server aktif di port 4222

## Subject berbasis messaging
Dasarnya, NATS itu mempublish dan listening sebuah message, Keduanya bergantung kepada subject yang ada.

### **Apa itu subject**
![Subject](out/subject/Subject.png) </br>
Sederhananya, subject hanyalah string dari nama character yang mana digunakan *publisher* dan *subscriber* untuk berkomunikasi, Jadi message akan berkomunikasi melalui subject.

**Character yang di izinkan untuk penamaan subject**
- `a to z`, `a to Z` (Case Sensitive, tidak boleh ada spasi)
- Spesial Karakter: `.` digunakan sebagai pemisah dalam subject dan `*`, `>` sebagai wildcards


### **Contoh Subject Hirarki**
```
time.us
time.us.east
time.us.east.atlanta
time.eu.east
time.eu.warsaw
```

## **Wildcards**
- NATS hanya menyediakan 2 buah wildcards
- Wildcard bisa digunakan untuk menggantikan `.` (pemisah subject)
- Subscriber bisa menggunakan wildcard untuk listen ke multiple subject dengan single subscription.
- Publisher tidak bisa menggunakan wildcards

### Single Token (*)
![Subject](out/wildcardSingleToken/WildcardSingleToken.png) </br>

Pada contoh diatas subscriber ini akan mendapatkan `msg` `SUB time.*.east` dari subject yang berformat antara `time` dan `east` (hanya satu format token saja)
misal:
```bash
# Di terima karena token (us) single
time.us.east
time.en.east

# Tidak di terima karena token (us.en) multi
time.us.en.east
```

### Multiple Token (>)
![Subject](out/wildcardMultipleToken/WildcardMultipleToken.png) </br>

- Pada contoh diatas `>` hanya bisa di aplikasikan di akhir subject saja, misal `SUB time.us.>`.
- Sebagai contoh `time.us.>` akan cocok dengan `time.us.east` dan `time.us.east.atlanta`, sementara `time.us.*` hanya akan cocok dengan `time.us.east` karena `*` tidak bisa mencocokkan lebih dari satu token.

### Mixing Wildcard
`*` dapat digunakan beberapa kali di subject, sedangkan `>` hanya di akhir saja, misal: `*.*.east.>` akan bisa menerima `time.us.east.atlanta`

### Rekomendasi Subject Token
Di rekomendasikan agar tetap menjaga jumlah token yang masuk akal, maksimal 16 token

# NATS Core

NATS Core adalah `kumpulan fungsi dasar` dan `quality service` yang di offer oleh `NATS service infrastructure`. Dimana tidak ada `nats-server` yang di konfigurasi untuk mengaktifkan `JetStream`.

Fungsi dasar NATS Core adalah `publish/subscribe`, `subject-based-addressing` dan `queuing` dengan QoS **at most once**

## Publish Subscribe
NATS Mengimplementasi distribusi message publish-subscribe dengan model `1:M` one to many communication. Publisher akan mengirim message ke subject dan akan di terima oleh subscriber yang aktif me-listen ke subject tersebut. Pola 1:M biasa disebut `fan-out`

![Publish Subscribe](./out/publishSubscribe/PublishSubscribe.png) </br>

### Message
Message terdiri dari
  1. Subject
  2. payload dalam bentuk byte array
  3. number di field headers
  4. opsional `reply` di field address
   
- Message mempunyai ukuran maksimal (yang mana di konfigurasi di `max_payload`).
- Ukuran default nya 1MB, tapi bisa di perbesar sampai dengan 64MB. Rekomendasinya maksimal 8MB

### Latihan
Dalam hal ini akan menggunakan [nats](https://docs.nats.io/nats-concepts/what-is-nats/walkthrough_setup) client untuk berkomunikasi dengan `nats-server`
1. Membuat subscriber dengan format `nats sub <subject>`
   ```bash
   nats sub msg.zul
   ```
2. Membuat publisher dengan format `nats pub <subject> <message>`
   ```bash
   nats pub msg.zul "Hallo Bro"
   ```
3. Membuat subscriber dengan format wildcard single token 
   ```bash
   # Terminal 1
   nats sub "msg.*"
   # Terminal 2
   nats sub "msg.>"

   # Terminal 3
   nats pub msg.zul "Hallo Zul"
   nats pub msg.rif "Hallo Rif"
   nats pub msg.test.yog "Hallo Yog" #Tidak akan di terima oleh msg.* diterima oleh msg.>
   ```