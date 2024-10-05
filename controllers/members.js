const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const db = require('../db/database');

// get member by id
const getMember = async (req, res) => {
  const id = req.params.id;
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM members WHERE MemberID LIKE ? limit 10", `${id}%`);
    //console.log(rows);
    if (rows.length) {
      const members = rows.map((row) => {
        decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.RecordKey, 'hex'), Buffer.from(row.iv, 'hex'));
        const decrypted = decipher.update(Buffer.from(row.PersonalCardNo, 'hex'));
        personalcardnodecrypted = Buffer.concat([decrypted, decipher.final()]);
        //console.log('CardNo=',personalcardnodecrypted.toString());
        return { ...row, PersonalCardNo: personalcardnodecrypted.toString() };
      });
      return res.status(200).send({ message: members });
      //return res.status(200).send({ message: rows });
    }

    return res.status(404).send({ message: 'Member not found!' });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "get member data fail! (" + error.toString() + ")",
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

// async function getImageFile(filePath, key, iv)  {
//   let ivBuffer = Buffer.from(iv, 'hex');
//   const BLOCK_SIZE = 16;
//   try {
//     await fs.access(filePath); 
//     const inputBuffer = await fs.readFile(filePath);
//     if (inputBuffer.length <= ivBuffer.length) {
//       //throw new Error(`Input buffer too short: ${inputBuffer.length} bytes`);
//       return null;
//     }

//     const ivPrefix = inputBuffer.slice(0, ivBuffer.length);
//     const encryptedData = inputBuffer.slice(ivBuffer.length);

//     if (Buffer.from(key, 'hex').length !== 32) {
//       //throw new Error(`Invalid record key length: ${key.length} chars. Expected 64 chars (32 bytes in hex).`);
//       return null;
//     }

//     decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
//     decipher.setAutoPadding(false);

//     let decrypted = Buffer.alloc(0);
//     for (let i = 0; i < encryptedData.length; i += BLOCK_SIZE) {
//       const chunk = encryptedData.slice(i, i + BLOCK_SIZE);
//       decrypted = Buffer.concat([decrypted, decipher.update(chunk)]);
//     }
//     // Handle the last block manually
//     const lastBlock = decrypted.slice(-BLOCK_SIZE);
//     const paddingLength = lastBlock[BLOCK_SIZE - 1];

//     if (paddingLength > 0 && paddingLength <= BLOCK_SIZE) {
//       // Remove padding only if it's valid
//       decrypted = decrypted.slice(0, -paddingLength);
//     }

//     return decrypted.toString('base64');
//   } catch (error) {
//     throw new Error(`Decryption failed: ${error.message}`);
//   }
// }

async function getImageFile(filePath, key, iv) {
  let ivBuffer = Buffer.from(iv, 'hex');
  try {
    await fs.access(filePath);
    const inputBuffer = await fs.readFile(filePath);
    if (inputBuffer.length <= ivBuffer.length) {
      //throw new Error(`Input buffer too short: ${inputBuffer.length} bytes`);
      return null;
    }

    const ivPrefix = inputBuffer.slice(0, ivBuffer.length);
    const encryptedData = inputBuffer.slice(ivBuffer.length);

    if (Buffer.from(key, 'hex').length !== 32) {
      //throw new Error(`Invalid record key length: ${key.length} chars. Expected 64 chars (32 bytes in hex).`);
      return null;
    }

    decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));

    //Decrypt the data
    let decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    return decrypted.toString('base64');
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// get member by id
const getMemberDocuments = async (req, res) => {
  const id = req.params.id;
  let conn = null;
  let memberPhoto = '';
  let personalCardPicture = '';
  let disabilityCardPicture = '';
  let houseRegistrationPicture = '';
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM members m INNER JOIN memberdocuments d on m.memberid = d.memberid WHERE m.MemberID LIKE ?", `${id}%`);
    //console.log(rows);
    if (rows.length) {
      //get file & decrypt
      memberPhoto = await getImageFile(rows[0].MemberPicture, rows[0].RecordKey, rows[0].iv);
      personalCardPicture = await getImageFile(rows[0].PersonalCardPicture, rows[0].RecordKey, rows[0].iv);
      disabilityCardPicture = await getImageFile(rows[0].DisabilityCardPicture, rows[0].RecordKey, rows[0].iv);
      houseRegistrationPicture = await getImageFile(rows[0].HouseRegistrationPicture, rows[0].RecordKey, rows[0].iv);

      return res.status(200).send({ message: [{ 'memberID': rows[0].MemberID, 'lastUpdatedBy': rows[0].LastUpdatedBy, 'lastUpdatedDate': rows[0].LastUpdatedDate, 'memberPhoto': memberPhoto, 'personalCardPicture': personalCardPicture, 'disabilityCardPicture': disabilityCardPicture, 'houseRegistrationPicture': houseRegistrationPicture }] });
    } else {
      return res.status(404).send({ message: 'Member documents not found!' });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "get member data fail! (" + error.toString() + ")",
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

// get member by name
const getMemberByName = async (req, res) => {
  const name = req.params.name;
  let conn = null;
  const searchValue = `%${name}%`;

  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM members WHERE Name like ? OR Surname like ? limit 10", [searchValue, searchValue]);

    if (rows.length) {
      const members = rows.map((row) => {
        decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.RecordKey, 'hex'), Buffer.from(row.iv, 'hex'));
        const decrypted = decipher.update(Buffer.from(row.PersonalCardNo, 'hex'));
        personalcardnodecrypted = Buffer.concat([decrypted, decipher.final()]);
        //console.log('CardNo=',personalcardnodecrypted.toString());
        return { ...row, PersonalCardNo: personalcardnodecrypted.toString() };
      });
      return res.status(200).send({ message: members });
    }

    return res.status(404).send({ message: 'Member not found!' });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "get member data fail! (" + error.toString() + ")",
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

// get all members
const getMembers = async (req, res) => {
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM members");

    const members = rows.map((row) => {
      decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.RecordKey, 'hex'), Buffer.from(row.iv, 'hex'));
      const decrypted = decipher.update(Buffer.from(row.PersonalCardNo, 'hex'));
      personalcardnodecrypted = Buffer.concat([decrypted, decipher.final()]);
      //console.log('CardNo=',personalcardnodecrypted.toString());
      return { ...row, PersonalCardNo: personalcardnodecrypted.toString() };
    });
    return res.status(200).send({ message: members });

    //    console.log('members:', members)
    //    return res.status(200).send({ message: rows });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "get member data fail! (" + error.toString() + ")",
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

// create new club
const createMember = async (req, res) => {
  const { memberid, title, name, surname, applieddate, birthdate, clubid, homeno, moo, tambon, district, province, phoneno, zipcode, personalcardno, personalstatus, ethnicity, nationality, memberstatus, membertype, religion, congenitaldisease, caregivername, caregiverflag, caregiverphoneno, gender, daughter, disabilitycardno, disabilitytype, son, extraabilities, educationinfo, lastupdatedby, cardNoHashing } = req.body;

  let conn = null;
  let now = new Date().toLocaleString();
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const keyHex = key.toString('hex');
  const ivHex = iv.toString('hex');
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(personalcardno);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  //console.log('oldCardNo',personalcardno);

  // Store the data
  const memberData = {
    memberid: memberid,
    title: title,
    name: name,
    surname: surname,
    applieddate: applieddate,
    birthdate: birthdate,
    clubid: clubid,
    religion: religion,
    HomeNo: homeno,
    Moo: moo,
    Tambon: tambon,
    District: district,
    Province: province,
    PhoneNo: phoneno,
    Zipcode: zipcode,
    lastupdatedby: lastupdatedby,
    personalcardno: encrypted.toString('hex'),
    personalstatus: personalstatus,
    ethnicity: ethnicity,
    nationality: nationality,
    memberstatus: memberstatus,
    membertype: membertype,
    congenitaldisease: congenitaldisease,
    caregivername: caregivername,
    caregiverflag: caregiverflag,
    caregiverphoneno: caregiverphoneno,
    gender: gender,
    daughter: daughter,
    disabilitycardno: disabilitycardno,
    disabilitytype: disabilitytype,
    son: son,
    extraabilities: extraabilities,
    educationinfo: educationinfo,
    recordkey: keyHex,
    iv: ivHex,
    lastupdateddate: now,
    cardNoHashing: cardNoHashing,
  };
  //console.log(memberData)
  try {
    conn = await db.connection();
    const [checkcardno] = await conn.query("SELECT name,cardNoHashing FROM members WHERE cardNoHashing = ?", [cardNoHashing]);
    if (checkcardno.length) {
      return res.status(400).send({ message: "The personal card no is inused! (Duplicated!)" });
    }
    const result = await conn.query("INSERT INTO members SET ?", memberData);
    res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert member data fail! (" + error.toString() + ")",
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

// update 
const updateMember = async (req, res) => {
  const { memberid, title, name, surname, applieddate, birthdate, clubid, homeno, moo, tambon, district, province, phoneno, zipcode, personalcardno, personalstatus, ethnicity, nationality, memberstatus, membertype, religion, congenitaldisease, caregivername, caregiverflag, caregiverphoneno, gender, daughter, disabilitycardno, disabilitytype, son, extraabilities, educationinfo, recordkey, iv, lastupdatedby,cardNoHashing } = req.body;
  let conn = null;
  let now = new Date().toLocaleString();
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(recordkey, 'hex'), Buffer.from(iv, 'hex'));
  let personalcardnoEncrypted = cipher.update(personalcardno);
  personalcardnoEncrypted = Buffer.concat([personalcardnoEncrypted, cipher.final()]);

  try {
    conn = await db.connection();
    const [checkcardno] = await conn.query("SELECT cardNoHashing FROM members WHERE cardNoHashing = ? AND memberid <> ?", [cardNoHashing, memberid]);
    if (checkcardno.length) {
      return res.status(400).send({ message: "The personal card no is inused! (Duplicated!)" });
    }
    const row = await conn.query("UPDATE members SET title=?,name=?,surname=?,applieddate=?,birthdate=?,religion=?,clubid=?,homeno=?,moo=?,tambon=?,district=?,province=?,phoneno=?,zipcode=?,personalcardno=?,personalstatus=?,ethnicity=?,nationality=?,memberstatus=?,membertype=?,congenitaldisease=?,caregivername=?,caregiverflag=?,caregiverphoneno=?,gender=?,daughter=?,disabilitycardno=?,disabilitytype=?,son=?,extraabilities=?,educationinfo=?,recordkey=?,lastupdatedby=?,lastupdateddate=?, cardNoHashing=? WHERE MemberID = ?",
      [title, name, surname, applieddate, birthdate, religion, clubid, homeno, moo, tambon, district, province, phoneno, zipcode, personalcardnoEncrypted.toString('hex'), personalstatus, ethnicity, nationality, memberstatus, membertype, congenitaldisease, caregivername, caregiverflag, caregiverphoneno, gender, daughter, disabilitycardno, disabilitytype, son, extraabilities, educationinfo, recordkey, lastupdatedby, now, cardNoHashing, memberid]);
    if (!(row[0].affectedRows > 0)) {
      return res.status(404).send({ message: 'ERR: update member fail!' });
    }
    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "update member data fail! (" + error.toString() + ")",
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

// delete by id
const deleteMember = async (req, res) => {
  const id = req.params.id;
  let conn = null;
  try {
    conn = await db.connection();
    conn.beginTransaction();
    const row1 = await conn.query("DELETE FROM members WHERE MemberID = ?", id);
    const row2 = await conn.query("DELETE FROM memberdocuments WHERE MemberID = ?", id);
    if (row1[0].affectedRows > 0) {
      conn.commit();
      return res.status(200).send({ message: 'ok' });
    }
    conn.rollback();
    return res.status(400).send({ message: 'ERROR: Delete member data fail!' });

  } catch (error) {
    conn.rollback();
    console.error(error);
    res.status(400).json({
      message: "Delete member data fail! (" + error.toString() + ")",
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

module.exports = {
  createMember, getMembers, getMember, updateMember, deleteMember, getMemberByName, getMemberDocuments
};

