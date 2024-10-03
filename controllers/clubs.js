const db = require('../db/database');

// get club by id
const getClub = async (req, res) => {
  const id = req.params.id;
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM clubs WHERE ClubID LIKE ? limit 10", `${id}%`);
    if (rows.length) {
      return res.status(200).send({ message: rows });
    }

    return res.status(404).send({ message: 'Club not found!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get club data fail!",
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

// get club by name
const getClubByName = async (req, res) => {
  const name = req.params.name;
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM clubs WHERE ClubName like ? limit 10", `%${name}%`);

    if (rows.length) {
      return res.status(200).send({ message: rows });
    }

    return res.status(404).send({ message: 'Club not found!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get club data fail!",
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

// get all clubs
const getClubs = async (req, res) => {
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM clubs");

    const clubs = rows.map((row) => {
      const clubFoundingDateFormatted = new Date(row.ClubFoundingDate).toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
        dateStyle: "full",
        timeStyle: "short",
      });
      return { ...row, ClubFoundingDate: clubFoundingDateFormatted };
    });
//    console.log('clubs:', clubs)
    return res.status(200).send({ message: clubs });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get club data fail!",
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

// const adjustUTCDate = (utcdate) => {
//   if (utcdate.endsWith('Z')) {
//     // เป็น UTC
//     const localDate = new Date(utcdate).toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
//     const formattedDate = new Date(localDate).toISOString().slice(0, 10);
//     //        console.log(formattedDate); // Output: "2024-07-06"
//   } else {
//     // ไม่ใช่ UTC
//     const formattedDate = new Date(utcdate).toISOString().slice(0, 10);
//     //        console.log(formattedDate); // Output: "2024-07-05"
//   }
//   return formattedDate;
// }

// create new club
const createClub = async (req, res) => {
  const { clubid, clubname, region, background, foundingdate, homeno, moo, tambon, district, province, 
          phoneno, zipcode, sponsoredby, clublogo, clubstatus, belongtoassociationname, 
          clubapproval, lastupdatedby} = req.body;

  let conn = null;
  let now = new Date().toLocaleString();

  // Store the data
  const clubData = {
    clubid: clubid,
    ClubName: clubname,
    region: region,
    background: background,
    HomeNo: homeno,
    Moo: moo,
    Tambon: tambon,
    District: district,
    Province: province,
    PhoneNo: phoneno,
    Zipcode: zipcode,
    FoundingDate: foundingdate,
    sponsoredby: sponsoredby,
    clublogo: clublogo,
    clubstatus: clubstatus,
    belongtoassociationname: belongtoassociationname,
    clubapproval: clubapproval,
    lastupdatedby: lastupdatedby,
    lastupdateddate: now
  };
  //console.log(clubData)
  try {
    conn = await db.connection();
    const result = await conn.query("INSERT INTO clubs SET ?", clubData);
    res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "insert club data fail!",
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

// update club
const updateClub = async (req, res) => {
  const { clubid, clubname, region, background, foundingdate, homeno, moo, tambon, district, province, 
    phoneno, zipcode, sponsoredby, clublogo, clubstatus, belongtoassociationname, 
    clubapproval, lastupdatedby} = req.body;
  let conn = null;
  let now = new Date().toLocaleString();

  try {
    conn = await db.connection();
    const row = await conn.query("UPDATE clubs SET ClubName=?, homeno=?, moo=?, tambon=?,district=?,province=?,phoneno=?,zipcode=?, foundingdate=?, region=?, background=?,sponsoredby=?,clublogo=?,clubstatus=?,belongtoassociationname=?,clubapproval=?,lastupdatedby=?,lastupdateddate=? WHERE ClubID = ?", 
      [clubname, homeno, moo, tambon, district, province, phoneno,zipcode,foundingdate, region,background,sponsoredby,clublogo,clubstatus,belongtoassociationname,clubapproval,lastupdatedby, now, clubid]);
    if (!(row[0].affectedRows > 0)) {
      return res.status(404).send({ message: 'ERR: update club fail!' });
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

// delete club by id
const deleteClub = async (req, res) => {
  const id = req.params.id;
  let conn = null;
  try {
    conn = await db.connection();
    const row = await conn.query("DELETE FROM clubs WHERE ClubID = ?", id);
    if (row[0].affectedRows > 0) {
      return res.status(200).send({ message: 'ok' });
    }

    return res.status(404).send({ message: 'ERROR: Delete club fail!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Delete club data fail!",
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
  createClub, getClubs, getClub, updateClub, deleteClub, getClubByName
};

