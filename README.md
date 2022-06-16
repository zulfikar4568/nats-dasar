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

## NATS CLI
```bash
# Help NATS CLI
nats -h

# Cheat sheet untuk NATS
nats cheat
# Cheat sheet berdasarkan sections
nats cheat --sections
# Contoh
nats cheat pub

nats account info

nast bench test --pub 10

nats  bench test --pub 10 --msgs 1000000
```

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

## Request-Reply

Request-Reply adalah pola yang umum di *modern distribution systems*. Sebuah request di kirim, dan aplikasi menunggu response dengan waktu tertentu atau menerima secara asynchronous

- NATS support Request-reply menggunakan mekanisme komunikasi inti - publish dan subscribe. **Responder** akan listen ke subject dan ketika ada **Requester** yang request, maka responder akan langsung meresponse ke reply subject. Reply subject disebut `inbox`.
- Beberapa responder NATS dapat membentuk queue grup yang dynamic. Jadi tidak perlu secara manual add atau remove subscriber dari group untuk memulai dan berhenti mendistribusikan message, karena akan otomatis. Jadi kita bisa men scale up/down sesuai demand.
- Karena NATS pada dasarnya publish-subscribe. Untuk observasi simple kita bisa melihat request dan response untuk mengukur latency.
- Kelebihan NATS bahkan memperbolehkan multiple response.
  
![Request Reply](out/requestReply/RequestReply.png)

### Latihan
1. Membuat Reply Client Listener (Responder), yang akan menunggu request yang masuk, akan mengirim response ke **Requester**
   ```bash
   nats reply help.please 'OK, I CAN HELP!!!'
   ```
2. Membuat Request Client (Requester), yang akan menerima response dari **Responder**
   ```bash
   nats request help.please 'I need help!'
   ```

## Queue Group

![Queue](out/queueGroup/QueueGroup.png) </br>
Ketika subscriber me-register diri mereka sendiri untuk menerima message. Pola messaging 1:M `fan out` harus memastikan bahwa message yang di kirim oleh publisher, harus tersampaikan ke semua subscriber yang sudah ter-register. Terdapat fitur Queue yang bisa me-register subscriber untuk bagian dari queue disebut `queue groups`.

- Rule penamaan queue disamakan dengan penamaan subject
- Queue subscriber idealnya untuk scalling service

### Publish Subscribe tanpa Queue

1. Membuat publisher publisher
   ```bash
   nats pub --count=-1 --sleep 500ms demo.1 "{{Count}} {{TimeStamp}}"
   ```

2. Membuat 3 buah subscriber
   ```bash
   nats sub demo.1 # terminal 1
   nats sub demo.1 # terminal 2
   nats sub demo.1 # terminal 3
   ```
Pada contoh ini setiap message akan terkirim secara merata di tiap subscriber. 1:M

### Publish Subscribe tanpa Queue

1. Membuat publisher publisher
   ```bash
   nats pub --count=-1 --sleep 500ms demo.1 "{{Count}} {{TimeStamp}}"
   ```
2. Membuat 3 buah subscriber
   ```bash
   nats sub demo.1 --queue queue.saya # terminal 1
   nats sub demo.1 --queue queue.saya # terminal 2
   nats sub demo.1 --queue queue.saya # terminal 3
   ```
Pada contoh ini setiap message akan terkirim secara distribusi random, dan akan load balance secara otomatis `Load Balanced Queues`


### Request Reply dengan Qeueu
`nats reply` tidak hanya subscribe, tapi join otomatis ke queue group (`NATS-RPLY-22` by default)

```bash
nats reply menyapa "Ini Zulfikar Reply# {{Count}}" # terminal 1
nats reply menyapa "Ini Arif Reply# {{Count}}" # terminal 2
nats reply menyapa "Ini Noval Reply# {{Count}}" # terminal 3
```

```bash
nats request menyapa --count 10 "Hai aku Doni {{Count}}"
```

### Keuntungan

- Memastikan toleransi kesalahan pada aplikasi `Fault Tolerant`
- Pemprosessan beban dapat di scale up atau down
- Tidak perlu tambahan konfigurasi
- Queue group di definisikan oleh aplikasi client bukan oleh konfigurasi server

### Stream sebagai Queue
JetStream stream juga bisa digunakan sebagai queue dengan men setting retention policy di `WorkQueuePolicy` dan memanfaatkan **pull consumers** untuk memudahkan mendapat horizontal scalability

### Queue Geo Affinity
Ketika kita memiliki NATS Super Cluster yang terhubung secara global, terdapat `automatic service geo-affinity` yang bisa meneruskan request message ke cluster region lain, jika cluster region target tidak tersedia