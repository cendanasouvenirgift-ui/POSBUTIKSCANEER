/* =====================================================
   SCANNER BARCODE POS BUTIK
   ===================================================== */

let scanner = null;
let scannerAktif = false;
let barcodeSedangDiproses = false;


/* =====================================================
   STATUS
   ===================================================== */

function setStatus(teks) {

  const el = document.getElementById("status");

  if (el) {
    el.textContent = teks;
  }

}


/* =====================================================
   BUNYI
   ===================================================== */

function bunyiScanner() {

  try {

    const audioContext =
      new (window.AudioContext ||
           window.webkitAudioContext)();

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      1000,
      audioContext.currentTime
    );

    gain.gain.setValueAtTime(
      0.3,
      audioContext.currentTime
    );

    oscillator.connect(gain);

    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime + 0.15
    );

  } catch (e) {

    console.log("Audio tidak tersedia.");

  }

}


/* =====================================================
   GETAR HP
   ===================================================== */

function getarHP() {

  try {

    if (navigator.vibrate) {

      navigator.vibrate(150);

    }

  } catch (e) {}

}


/* =====================================================
   KIRIM BARCODE KE HALAMAN KASIR
   ===================================================== */

function kirimBarcodeKePOS(barcode) {

  barcode =
    String(barcode || "")
      .trim();

  if (!barcode) {

    setStatus(
      "❌ Barcode kosong."
    );

    return;

  }


  console.log(
    "BARCODE AKAN DIKIRIM:",
    barcode
  );


  /*
     PENTING:

     Scanner GitHub harus dibuka
     menggunakan window.open() dari
     halaman Kasir.

     Dengan begitu window.opener
     menunjuk ke halaman Kasir.
  */

  if (
    !window.opener ||
    window.opener.closed
  ) {

    setStatus(
      "❌ Halaman Kasir tidak ditemukan."
    );

    console.error(
      "window.opener tidak tersedia."
    );

    alert(
      "Scanner harus dibuka dari tombol SCAN BARCODE pada halaman Kasir."
    );

    return;

  }


  try {

    window.opener.postMessage(
      {
        type: "POS_BUTIK_BARCODE",
        barcode: barcode
      },
      "*"
    );


    setStatus(
      "✅ Barcode dikirim ke Kasir: " +
      barcode
    );


    console.log(
      "✅ BARCODE TERKIRIM KE KASIR:",
      barcode
    );


    /*
       Jangan langsung close terlalu cepat.
       Beri waktu agar halaman Kasir
       menerima pesan.
    */

    setTimeout(function() {

      try {

        window.close();

      } catch (e) {

        console.log(
          "Window tidak dapat ditutup otomatis."
        );

      }

    }, 1000);


  } catch (error) {

    console.error(
      "Gagal mengirim barcode:",
      error
    );

    setStatus(
      "❌ Gagal mengirim barcode ke Kasir."
    );

  }

}


/* =====================================================
   MULAI SCANNER
   ===================================================== */

async function mulaiScanner() {

  if (scannerAktif) {

    return;

  }


  barcodeSedangDiproses = false;


  setStatus(
    "Meminta akses kamera..."
  );


  try {

    /*
       Tes kamera terlebih dahulu
    */

    const stream =
      await navigator.mediaDevices.getUserMedia(
        {
          video: {
            facingMode: {
              ideal: "environment"
            }
          },
          audio: false
        }
      );


    stream
      .getTracks()
      .forEach(function(track) {

        track.stop();

      });


    scanner =
      new Html5Qrcode(
        "reader"
      );


    scannerAktif = true;


    setStatus(
      "📷 Kamera aktif. Arahkan ke barcode..."
    );


    await scanner.start(

      {
        facingMode: "environment"
      },

      {
        fps: 10,

        qrbox: {
          width: 280,
          height: 160
        },

        aspectRatio: 1.7777778

      },

      function(decodedText) {

        if (barcodeSedangDiproses) {

          return;

        }


        const barcode =
          String(decodedText || "")
            .trim();


        if (!barcode) {

          return;

        }


        barcodeSedangDiproses = true;


        console.log(
          "📷 BARCODE TERBACA:",
          barcode
        );


        const hasil =
          document.getElementById(
            "hasil"
          );


        if (hasil) {

          hasil.textContent =
            barcode;

        }


        setStatus(
          "✅ Barcode terbaca: " +
          barcode
        );


        bunyiScanner();

        getarHP();


        /*
           KIRIM KE HALAMAN KASIR
        */

        kirimBarcodeKePOS(
          barcode
        );


        /*
           Stop scanner
        */

        berhentiScanner();


        /*
           Reset beberapa saat kemudian
        */

        setTimeout(function() {

          barcodeSedangDiproses =
            false;

        }, 1500);

      },

      function(errorMessage) {

        /*
           Jangan tampilkan error
           scan frame biasa.
        */

      }

    );


  } catch (error) {

    console.error(
      "Scanner error:",
      error
    );


    scannerAktif = false;


    setStatus(
      "❌ Kamera tidak dapat digunakan."
    );

  }

}


/* =====================================================
   BERHENTI SCANNER
   ===================================================== */

async function berhentiScanner() {

  if (!scanner) {

    return;

  }


  try {

    if (scannerAktif) {

      await scanner.stop();

    }

  } catch (error) {

    console.log(
      "Scanner sudah berhenti."
    );

  }


  try {

    await scanner.clear();

  } catch (error) {}


  scanner = null;

  scannerAktif = false;


  console.log(
    "Scanner dihentikan."
  );

}


/* =====================================================
   INPUT BARCODE MANUAL
   ===================================================== */

function prosesManual() {

  const input =
    document.getElementById(
      "barcodeManual"
    );


  if (!input) {

    alert(
      "Input barcode tidak ditemukan."
    );

    return;

  }


  const barcode =
    String(input.value || "")
      .trim();


  if (!barcode) {

    setStatus(
      "❌ Masukkan barcode terlebih dahulu."
    );

    input.focus();

    return;

  }


  console.log(
    "⌨️ BARCODE MANUAL:",
    barcode
  );


  const hasil =
    document.getElementById(
      "hasil"
    );


  if (hasil) {

    hasil.textContent =
      barcode;

  }


  setStatus(
    "🔎 Mencari barcode: " +
    barcode
  );


  bunyiScanner();

  getarHP();


  /*
     SAMA DENGAN HASIL SCAN KAMERA:

     Kirim barcode ke Kasir
  */

  kirimBarcodeKePOS(
    barcode
  );

}


/* =====================================================
   ENTER PADA INPUT MANUAL
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    const input =
      document.getElementById(
        "barcodeManual"
      );


    if (input) {

      input.addEventListener(
        "keydown",
        function(event) {

          if (
            event.key === "Enter"
          ) {

            event.preventDefault();

            prosesManual();

          }

        }
      );

    }

  }
);
