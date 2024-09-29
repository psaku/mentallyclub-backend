//const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const db = require('../db/database');

dotenv.config();

const UPLOAD_PATH = process.env.UPLOAD_STORAGE_FOLDER;

async function getRecordKey(id) {
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT RecordKey, iv FROM members WHERE MemberID = ?", id);
    const memberKey = rows[0];

    if (conn) {
      try {
        await conn.close(); // Close the connection in the finally block
        if (memberKey) {
          return { recordKey: memberKey.RecordKey, iv: memberKey.iv }
        }
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  } catch (error) {
    console.error(error);
  }
  return null;
}
// กำหนดที่เก็บไฟล์และชื่อไฟล์
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = './uploads';
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir);
//     }
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     // Encrypt the filename to ensure security
//     const encryptedName = crypto.createHash('sha256').update(file.originalname + Date.now()).digest('hex');
//     cb(null, `${encryptedName}${path.extname(file.originalname)}`);
//   }
// });

// const upload = multer({ storage: storage });

// ฟังก์ชันสำหรับเข้ารหัสไฟล์
async function encryptFile(inputBuffer, outputPath, keyrec) {
  // Decode the base64 inputBuffer to a Buffer
  const decodedBuffer = Buffer.from(inputBuffer, 'base64');
  //console.log(keyrec.recordKey, keyrec.iv);
  // Create a cipher using AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(keyrec.recordKey, 'hex'), Buffer.from(keyrec.iv, 'hex'));

  // Create a write stream for the output file
  const output = fs.createWriteStream(outputPath);

  // Write the IV to the output file first
  output.write(Buffer.from(keyrec.iv, 'hex'));

  //const encryptedStream = cipher.update(decodedBuffer);
  // Encrypt and write the data
  const encryptedData = Buffer.concat([cipher.update(decodedBuffer), cipher.final()]);

  output.write(encryptedData);
  output.end();
  output.close();
}

const uploadFiles = async (req, res) => {
  const { memberID, lastUpdatedBy, memberPhoto, personalCardPicture, disabilityCardPicture, houseRegistrationPicture } = req.body;

  if (!memberPhoto && !personalCardPicture && !disabilityCardPicture && !houseRegistrationPicture) {
    return res.status(400).send({ message: 'No files were uploaded.' });
  }
  // get defined key of member
  const resultKey = await getRecordKey(memberID);
  if (!resultKey) {
    return res.status(400).send({ message: 'Not found key of member for encryption' });
  }
  try {
    // process member photo 
    encryptedFilename = 'encrypted_1_' + memberID;
    const memberPhotoFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    if (!fs.existsSync(UPLOAD_PATH)) {
      fs.mkdirSync(UPLOAD_PATH, { recursive: true }); // Use recursive to create nested directories
    }
    // if (fs.existsSync(memberPhotoFilePath) || fs.existsSync(personalCardPictureFilePath) || fs.existsSync(disabilityCardPictureFilePath) || fs.existsSync(houseRegistrationPictureFilePath)) {
    //   res.status(200).send({ message: "Duplicated file, please remove old file or choose update process" });
    // } else {
    await encryptFile(memberPhoto, memberPhotoFilePath, resultKey);

    // process personalCardPicture 
    encryptedFilename = 'encrypted_2_' + memberID;
    const personalCardPictureFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    await encryptFile(personalCardPicture, personalCardPictureFilePath, resultKey);

    // process disabilityCardPicture 
    encryptedFilename = 'encrypted_3_' + memberID;
    const disabilityCardPictureFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    await encryptFile(disabilityCardPicture, disabilityCardPictureFilePath, resultKey);

    // process houseRegistrationPicture 
    encryptedFilename = 'encrypted_4_' + memberID;
    const houseRegistrationPictureFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    await encryptFile(houseRegistrationPicture, houseRegistrationPictureFilePath, resultKey);

    result = await saveDocument(memberID, memberPhotoFilePath, personalCardPictureFilePath, disabilityCardPictureFilePath, houseRegistrationPictureFilePath, lastUpdatedBy);
    if (result == true) {
      res.status(200).send({ message: "ok" });
    } else {

      res.status(500).send({ message: result });
    }
    //}  // if check dup
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเข้ารหัสไฟล์:', error);
    res.status(500).send({ message: 'เกิดข้อผิดพลาดในการประมวลผลไฟล์' });
  }

}

const updateFiles = async (req, res) => {
  const { memberID, lastUpdatedBy, memberPhoto, personalCardPicture, disabilityCardPicture, houseRegistrationPicture } = req.body;

  if (!memberPhoto && !personalCardPicture && !disabilityCardPicture && !houseRegistrationPicture) {
    return res.status(400).send({ message: 'No files were uploaded.' });
  }
  // get defined key of member
  const resultKey = await getRecordKey(memberID);
  if (!resultKey) {
    return res.status(400).send({ message: 'Not found key of member for encryption' });
  }
  try {
    // process member photo 
    encryptedFilename = 'encrypted_1_' + memberID;
    const memberPhotoFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    if (!fs.existsSync(UPLOAD_PATH)) {
      fs.mkdirSync(UPLOAD_PATH, { recursive: true }); // Use recursive to create nested directories
    }
    // if (fs.existsSync(memberPhotoFilePath) || fs.existsSync(personalCardPictureFilePath) || fs.existsSync(disabilityCardPictureFilePath) || fs.existsSync(houseRegistrationPictureFilePath)) {
    //   res.status(200).send({ message: "Duplicated file, please remove old file or choose update process" });
    // } else {
    await encryptFile(memberPhoto, memberPhotoFilePath, resultKey);

    // process personalCardPicture 
    encryptedFilename = 'encrypted_2_' + memberID;
    const personalCardPictureFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    await encryptFile(personalCardPicture, personalCardPictureFilePath, resultKey);

    // process disabilityCardPicture 
    encryptedFilename = 'encrypted_3_' + memberID;
    const disabilityCardPictureFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    await encryptFile(disabilityCardPicture, disabilityCardPictureFilePath, resultKey);

    // process houseRegistrationPicture 
    encryptedFilename = 'encrypted_4_' + memberID;
    const houseRegistrationPictureFilePath = path.join(UPLOAD_PATH, encryptedFilename);
    await encryptFile(houseRegistrationPicture, houseRegistrationPictureFilePath, resultKey);

    result = await updateDocument(memberID, memberPhotoFilePath, personalCardPictureFilePath, disabilityCardPictureFilePath, houseRegistrationPictureFilePath, lastUpdatedBy);
    if (result == true) {
      res.status(200).send({ message: "ok" });
    } else {

      res.status(500).send({ message: result });
    }
    //}  // if check dup
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเข้ารหัสไฟล์:', error);
    res.status(500).send({ message: 'เกิดข้อผิดพลาดในการประมวลผลไฟล์' });
  }

}

async function saveDocument(memberID, memberPhotoFilePath, personalCardPictureFilePath, disabilityCardPictureFilePath, houseRegistrationPictureFilePath, lastUpdatedBy) {
  let conn = null;
  let now = new Date().toLocaleString();

  const documentSet = {
    MemberID: memberID,
    LastUpdatedDate: now,
    LastUpdatedBy: lastUpdatedBy,
    DisabilityCardPicture: disabilityCardPictureFilePath,
    HouseRegistrationPicture: houseRegistrationPictureFilePath,
    MemberPicture: memberPhotoFilePath,
    PersonalCardPicture: personalCardPictureFilePath
  };
  try {
    conn = await db.connection();
    const result = await conn.query("INSERT INTO MemberDocuments SET ?", documentSet);
    if (conn) {
      try {
        await conn.close(); // Close the connection in the finally block
        return true;
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  } catch (error) {
    console.error(error.message);
    return error.message;
  }
}

async function updateDocument(memberID, memberPhotoFilePath, personalCardPictureFilePath, disabilityCardPictureFilePath, houseRegistrationPictureFilePath, lastUpdatedBy) {
  let conn = null;
  let now = new Date().toLocaleString();

  try {
    conn = await db.connection();
    const result = await conn.query("UPDATE MemberDocuments SET LastUpdatedDate=?,LastUpdatedBy=?,DisabilityCardPicture=?,HouseRegistrationPicture=?,MemberPicture=?,PersonalCardPicture=? WHERE MemberID = ?", [now, lastUpdatedBy, disabilityCardPictureFilePath, houseRegistrationPictureFilePath, memberPhotoFilePath, personalCardPictureFilePath, memberID]);
    if (conn) {
      try {
        await conn.close(); // Close the connection in the finally block
        return true;
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  } catch (error) {
    console.error(error.message);
    return error.message;
  }
}

const unlinkFiles = async (req, res) => {
  const id = req.params.id;
  let conn = null;
  try {
    conn = await db.connection();
    const rows = await conn.query("DELETE FROM memberdocuments WHERE MemberID = ?", id);
    if (rows[0].affectedRows > 0) {
      await deleteDocumentFromStorage(id);
      return res.status(200).send({ message: 'ok' });
    }
    return res.status(404).send({ message: 'ERROR: Delete documents data fail!' });
  } catch (error) {
    conn.rollback();
    console.error(error);
    res.status(500).json({
      message: "Delete documents data fail!",
      error,
    });
  } finally {
    if (conn) {
      try {
        await conn.close(); // Close the connection in the finally block
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

async function deleteDocumentFromStorage(id) {
  try {
    const removedFiles = ['encrypted_1_'+id, 'encrypted_2_'+id, 'encrypted_3_'+id, 'encrypted_4_'+id];

    removedFiles.forEach((file) => {
      const filePath = path.join(UPLOAD_PATH, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Error on remove files:', error);
  }
}

module.exports = {
  uploadFiles, updateFiles, unlinkFiles
};



