const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();

// กำหนดที่เก็บไฟล์และชื่อไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// ฟังก์ชันสำหรับสร้าง key แบบสุ่ม
function generateRandomKey() {
  return crypto.randomBytes(32);
}

// ฟังก์ชันสำหรับเข้ารหัสไฟล์
function encryptFile(inputPath, outputPath, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  output.write(iv);
  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });
}

// ฟังก์ชันสำหรับบันทึก key
function saveKey(filename, key) {
  const keyInfo = {
    filename: filename,
    key: key.toString('hex')
  };
  fs.appendFileSync('key_storage.json', JSON.stringify(keyInfo) + '\n');
}

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('ไม่พบไฟล์ที่อัปโหลด');
  }

  const textField = req.body.text_field;
  const imageFile = req.file;

  console.log('ข้อความที่ได้รับ:', textField);
  console.log('ไฟล์ที่อัปโหลด:', imageFile.filename);

  // สร้าง key แบบสุ่ม
  const key = generateRandomKey();

  // กำหนดชื่อไฟล์ที่เข้ารหัสแล้ว
  const encryptedFilename = 'encrypted_' + imageFile.filename;
  const encryptedFilePath = path.join('uploads', encryptedFilename);

  try {
    // เข้ารหัสไฟล์
    await encryptFile(imageFile.path, encryptedFilePath, key);

    // บันทึก key
    saveKey(encryptedFilename, key);

    // ลบไฟล์ต้นฉบับ
    fs.unlinkSync(imageFile.path);

    res.status(200).send('อัปโหลดและเข้ารหัสไฟล์สำเร็จ');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเข้ารหัสไฟล์:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการประมวลผลไฟล์');
  }
});

app.listen(3000, () => {
  console.log('เซิร์ฟเวอร์ทำงานที่พอร์ต 3000');
});