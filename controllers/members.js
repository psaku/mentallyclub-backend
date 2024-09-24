const crypto = require('crypto');

const db = require('../db/database');
const iv = crypto.randomBytes(16);

// get member by id
const getMember = async (req, res) => {
  const id = req.params.id;
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM members WHERE MemberID = ?", id);
    if (rows.length) {
      const members = rows.map((row) => {
        const personalcardnodecrypted =  crypto.crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.recordkey), iv).update(row.personalcardno);  
        return { ...row, personalcardno: personalcardnodecrypted };
      });
      return res.status(200).send({ message: members });
      //return res.status(200).send({ message: rows });
    }

    return res.status(404).send({ message: 'Member not found!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get member data fail!",
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
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM members WHERE (Name like ? or Surname like ?) limit 10", `%${name}%`, `%${name}%`);

    if (rows.length) {
      const members = rows.map((row) => {
        const personalcardnodecrypted =  crypto.crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.recordkey), iv).update(row.personalcardno);  
        return { ...row, personalcardno: personalcardnodecrypted };
      });
      return res.status(200).send({ message: members });
    }

    return res.status(404).send({ message: 'Member not found!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get member data fail!",
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
      const personalcardnodecrypted =  crypto.crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.recordkey), iv).update(row.personalcardno);  
      return { ...row, personalcardno: personalcardnodecrypted };
    });
    return res.status(200).send({ message: members });

//    console.log('members:', members)
//    return res.status(200).send({ message: rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get member data fail!",
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
  const { memberid,title,name,surname,applieddate,birthdate,clubid,homeno,moo,tambon,district,province,phoneno,zipcode,personalcardno,personalstatus,ethnicity,nationality,memberstatus,membertype,religion,congenitaldisease,caregivername,caregiverflag,caregiverphoneno,gender,daughter,disabilitycardno,disabilitytype,son,extraabilities,educationinfo,lastupdatedby } = req.body;

  let conn = null;
  let now = new Date().toLocaleString();
  const key = crypto.randomBytes(32);
  const keyBased64 = key.toString('base64');
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);

  // Store the data
  const memberData = {
    memberid: memberid,
    title: title,
    name: name,
    surname: surname,
    applieddate: applieddate,
    birthdate: birthdate,
    clubid: clubid,
    religion:religion,
    HomeNo: homeno,
    Moo: moo,
    Tambon: tambon,
    District: district,
    Province: province,
    PhoneNo: phoneno,
    Zipcode: zipcode,
    lastupdatedby: lastupdatedby,
    personalcardno: cipher.update(personalcardno).toString('base64'),
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
    recordkey: keyBased64,
    lastupdateddate: now
  };
  console.log(memberData)
  try {
    conn = await db.connection();
    const result = await conn.query("INSERT INTO members SET ?", memberData);
    res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "insert member data fail!",
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
  const { memberid,title,name,surname,applieddate,birthdate,clubid,homeno,moo,tambon,district,province,phoneno,zipcode,personalcardno,personalstatus,ethnicity,nationality,memberstatus,membertype,religion,congenitaldisease,caregivername,caregiverflag,caregiverphoneno,gender,daughter,disabilitycardno,disabilitytype,son,extraabilities,educationinfo,recordkey,lastupdatedby } = req.body;
  let conn = null;
  let now = new Date().toLocaleString();
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(recordkey), iv);
  let personalcardnoEncrypted = cipher.update(personalcardno);

  try {
    conn = await db.connection();
    const row = await conn.query("UPDATE members SET title=?,name=?,surname=?,applieddate=?,birthdate=?,religion=?,clubid=?,homeno=?,moo=?,tambon=?,district=?,province=?,phoneno=?,zipcode=?,personalcardno=?,personalstatus=?,ethnicity=?,nationality=?,memberstatus=?,membertype=?,congenitaldisease=?,caregivername=?,caregiverflag=?,caregiverphoneno=?,gender=?,daughter=?,disabilitycardno=?,disabilitytype=?,son=?,extraabilities=?,educationinfo=?,recordkey=?,lastupdatedby=?,lastupdateddate=? WHERE MemberID = ?", 
      [title,name,surname,applieddate,birthdate,religion,clubid,homeno,moo,tambon,district,province,phoneno,zipcode,personalcardnoEncrypted,personalstatus,ethnicity,nationality,memberstatus,membertype,congenitaldisease,caregivername,caregiverflag,caregiverphoneno,gender,daughter,disabilitycardno,disabilitytype,son,extraabilities,educationinfo,recordkey,lastupdatedby, now, memberid]);
    if (!(row[0].affectedRows > 0)) {
      return res.status(404).send({ message: 'ERR: update member fail!' });
    }
    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "update club data fail!",
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
    const row = await conn.query("DELETE FROM members WHERE MemberID = ?", id);
    if (row[0].affectedRows > 0) {
      return res.status(200).send({ message: 'ok' });
    }

    return res.status(404).send({ message: 'ERROR: Delete member fail!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Delete member data fail!",
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
  createMember, getMembers, getMember, updateMember, deleteMember, getMemberByName
};

