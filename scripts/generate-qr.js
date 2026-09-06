const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const QRCode = require("qrcode");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "assets");

const specs = [
  {
    file: "nikah-qr.png",
    url: "https://www.google.com/maps/search/?api=1&query=Swaraj+Mangal+Karyalaya+Dindrud+Beed",
  },
  {
    file: "walima-qr.png",
    url: "https://maps.app.goo.gl/BQpYjiWpXdY7hcud9",
  },
];

const qrOptions = {
  errorCorrectionLevel: "H",
  type: "png",
  width: 720,
  margin: 2,
  color: {
    dark: "#111111",
    light: "#FFFDF8",
  },
};

const framePs = path.join(__dirname, "_frame-qr.ps1");

async function main() {
  for (const spec of specs) {
    const raw = path.join(outDir, "_raw-" + spec.file);
    const out = path.join(outDir, spec.file);
    await QRCode.toFile(raw, spec.url, qrOptions);
    execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", framePs, raw, out],
      { stdio: "inherit" }
    );
    fs.unlinkSync(raw);
    console.log("OK", spec.file, fs.statSync(out).size, "bytes →", spec.url);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
