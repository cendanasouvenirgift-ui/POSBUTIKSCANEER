let scanner = null;

let scannerAktif = false;

let barcodeSedangDiproses = false;


/* ==========================================
   STATUS
   ========================================== */

function setStatus(pesan) {

  const el =
    document.getElementById("status");

  if (el) {

    el.textContent = pesan;

  }

}


/* ==========================================
   BUNYI BEEP
   ========================================== */

function bunyiScanner() {

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;


    if (!AudioContext) {
      return;
    }


    const ctx =
      new AudioContext();


    const oscillator =
      ctx.createOscillator();


    const gain =
      ctx.createGain();


    oscillator.type =
      "sine";


    oscillator.frequency.value =
      1100;


    gain.gain.setValueAtTime(
      0.0001,
      ctx.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
      0.25,
      ctx.currentTime + 0.01
    );


    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.15
    );


    oscillator.connect(gain);

    gain.connect(ctx.destination);

    oscillator.start();

    oscillator.stop(
      ctx.currentTime + 0.16
    );


  } catch (error) {

    console.log(
      "Audio tidak tersedia."
    );

  }

}


/* ==========================================
   GETAR HP
   ========================================== */

function getarHP() {

  try {

    if (
      navigator.vibrate
    ) {

      navigator.vibrate(
        [100, 50, 100]
      );

    }

  } catch (error) {}

}


/* ==========================================
   KIRIM BARCODE KE POS BUTIK
   ========================================== */

function kirimBarcodeKePOS(
  barcode
) {

  barcode =
    String(
      barcode || ""
    ).trim();


  if (!barcode) {

    return;

  }


  console.log(
    "📤 Mengirim barcode ke POS BUTIK:",
    barcode
  );


  /*
   * CEK APAKAH SCANNER
   * DIBUKA DARI HALAMAN KASIR
   */

  if (
    !window.opener ||
    window.opener.closed
  ) {

    setStatus(
      "⚠️ Halaman Kasir tidak ditemukan."
    );


    console.error(
      "window.opener tidak tersedia."
    );


    return;

  }


  /*
   * KIRIM BARCODE
   */

  try {

    window.opener.postMessage(

      {

        type:
          "POS_BUTIK_BARCODE",

        barcode:
          barcode

      },

      "*"

    );


    setStatus(
      "✅ Barcode dikirim ke POS BUTIK."
    );


    console.log(
      "✅ Barcode berhasil dikirim:",
      barcode
    );


    /*
     * Beri sedikit waktu agar
     * pesan diterima Kasir
     */

    setTimeout(
      function() {

        try {

          window.close();

        } catch (error) {

          console.log(
            "Window tidak dapat ditutup otomatis."
          );

        }

      },
      500
    );


  } catch (error) {

    console.error(
      "Gagal mengirim barcode:",
      error
    );


    setStatus(
      "❌ Gagal mengirim barcode ke POS."
    );

  }

}


/* ==========================================
   MULAI SCANNER
   ========================================== */

async function mulaiScanner() {

  if (scannerAktif) {

    setStatus(
      "Scanner sudah aktif."
    );

    return;

  }


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    setStatus(
      "❌ Library scanner belum dimuat."
    );

    return;

  }


  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    setStatus(
      "❌ Browser tidak mendukung kamera."
    );

    return;

  }


  if (
    !window.isSecureContext
  ) {

    setStatus(
      "❌ Scanner harus dibuka melalui HTTPS."
    );

    return;

  }


  setStatus(
    "📷 Meminta izin kamera..."
  );


  let stream = null;


  try {

    stream =
      await navigator.mediaDevices
        .getUserMedia({

          video: {
            facingMode: {
              ideal: "environment"
            }
          },

          audio: false

        });


  } catch (error) {

    console.error(
      "Camera permission:",
      error
    );


    if (
      error.name ===
      "NotAllowedError"
    ) {

      setStatus(
        "❌ Akses kamera ditolak oleh browser."
      );

    } else if (
      error.name ===
      "NotFoundError"
    ) {

      setStatus(
        "❌ Kamera tidak ditemukan."
      );

    } else if (
      error.name ===
      "NotReadableError"
    ) {

      setStatus(
        "❌ Kamera sedang digunakan aplikasi lain."
      );

    } else {

      setStatus(
        "❌ Kamera tidak dapat digunakan."
      );

    }


    return;

  }


  stream
    .getTracks()
    .forEach(
      track => track.stop()
    );


  document.getElementById(
    "reader"
  ).innerHTML = "";


  scanner =
    new Html5Qrcode(
      "reader"
    );


  const config = {

    fps: 10,

    qrbox: {

      width: 280,

      height: 150

    },

    aspectRatio: 1.777778,

    disableFlip: false

  };


  try {

    await scanner.start(

      {
        facingMode:
          "environment"
      },

      config,


      function(decodedText) {

        if (
          barcodeSedangDiproses
        ) {

          return;

        }


        barcodeSedangDiproses =
          true;


        const barcode =
          String(
            decodedText || ""
          ).trim();


        if (!barcode) {

          barcodeSedangDiproses =
            false;

          return;

        }


        document.getElementById(
          "hasil"
        ).textContent =
          barcode;


        setStatus(
          "✅ Barcode berhasil dibaca."
        );


        bunyiScanner();

        getarHP();


        console.log(
          "BARCODE:",
          barcode
        );


        /*
         * INI BAGIAN PENTING
         *
         * Kirim barcode ke halaman Kasir.
         */

        kirimBarcodeKePOS(
          barcode
        );


        setTimeout(
          function() {

            barcodeSedangDiproses =
              false;

          },
          1500
        );

      },


      function(errorMessage) {

        /*
         * Error frame diabaikan.
         */

      }

    );


    scannerAktif =
      true;


    setStatus(
      "📷 Scanner aktif. Arahkan kamera ke barcode."
    );


  } catch (error) {

    console.error(
      "Scanner start error:",
      error
    );


    scannerAktif =
      false;


    scanner =
      null;


    setStatus(
      "❌ Kamera gagal dijalankan."
    );

  }

}


/* ==========================================
   STOP SCANNER
   ========================================== */

async function berhentiScanner() {

  if (
    !scanner
  ) {

    scannerAktif =
      false;

    setStatus(
      "Scanner berhenti."
    );

    return;

  }


  try {

    if (
      scannerAktif
    ) {

      await scanner.stop();

    }


    scanner.clear();


  } catch (error) {

    console.error(
      "Stop scanner:",
      error
    );

  }


  scanner =
    null;


  scannerAktif =
    false;


  barcodeSedangDiproses =
    false;


  setStatus(
    "Scanner berhenti."
  );

}


/* ==========================================
   BARCODE MANUAL
   ========================================== */

function prosesManual() {

  const input =
    document.getElementById(
      "barcodeManual"
    );


  const barcode =
    String(
      input.value || ""
    ).trim();


  if (!barcode) {

    setStatus(
      "Masukkan barcode terlebih dahulu."
    );

    return;

  }


  document.getElementById(
    "hasil"
  ).textContent =
    barcode;


  setStatus(
    "✅ Barcode berhasil dibaca."
  );


  bunyiScanner();

  getarHP();


  console.log(
    "BARCODE MANUAL:",
    barcode
  );


  /*
   * KIRIM BARCODE MANUAL
   * KE POS BUTIK JUGA
   */

  kirimBarcodeKePOS(
    barcode
  );


  input.value = "";

}


/* ==========================================
   ENTER PADA INPUT
   ========================================== */

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
            event.key ===
            "Enter"
          ) {

            prosesManual();

          }

        }
      );

    }

  }
);
