const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const db = require('../db/database');
const multer = require('multer');

dotenv.config();

const UPLOAD_PATH = process.env.UPLOAD_CLUB_STORAGE_FOLDER;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_PATH); // กำหนดที่เก็บไฟล์
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // ตั้งชื่อไฟล์ใหม่เพื่อหลีกเลี่ยงการชนกัน
    }
});

const upload = multer({ storage: storage });

// ฟังก์ชันสำหรับจัดการการอัปโหลดไฟล์
const uploadFile = (req, res) => {
    const responsiblePerson = req.body.responsible; // ข้อมูลชื่อผู้รับผิดชอบ
    const filePath = req.file.path; // ที่อยู่ของไฟล์ที่อัปโหลด

    // บันทึกข้อมูลในฐานข้อมูลถ้าจำเป็น

    res.status(200).json({ message: 'File uploaded successfully', filePath, responsiblePerson });
};

module.exports = {
    uploadFile,
};