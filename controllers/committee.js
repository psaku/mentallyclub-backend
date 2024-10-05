const crypto = require('crypto');
const db = require('../db/database');

// get member by id
const getCommittee = async (req, res) => {
    const id = req.params.id;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT cm.*, c.clubname FROM committees cm inner join clubs c on cm.clubID = c.clubid  WHERE committeeID LIKE ? limit 10", `${id}%`);
        //console.log(rows);
        if (rows.length) {
            const committees = rows.map((row) => {
                decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.recordKey, 'hex'), Buffer.from(row.iv, 'hex'));
                const decrypted = decipher.update(Buffer.from(row.personalCardNo, 'hex'));
                personalcardnodecrypted = Buffer.concat([decrypted, decipher.final()]);
                //console.log('CardNo=',personalcardnodecrypted.toString());
                return { ...row, personalCardNo: personalcardnodecrypted.toString() };
            });
            return res.status(200).send({ message: committees });
            //return res.status(200).send({ message: rows });
        }

        return res.status(400).send({ message: 'Committees data not found!' });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get Committees data fail! (" + error.toString() + ")",
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
const getCommitteesByName = async (req, res) => {
    const name = req.params.name;
    let conn = null;
    const searchValue = `%${name}%`;

    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT cm.*, c.clubname FROM committees cm inner join clubs c on cm.clubID = c.clubid WHERE name like ? OR surname like ? limit 10", [searchValue, searchValue]);

        if (rows.length) {
            const committees = rows.map((row) => {
                decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(row.recordKey, 'hex'), Buffer.from(row.iv, 'hex'));
                const decrypted = decipher.update(Buffer.from(row.personalCardNo, 'hex'));
                personalcardnodecrypted = Buffer.concat([decrypted, decipher.final()]);
                //console.log('CardNo=',personalcardnodecrypted.toString());
                return { ...row, personalCardNo: personalcardnodecrypted.toString() };
            });
            return res.status(200).send({ message: committees });
        }

        return res.status(400).send({ message: 'Committees not found!' });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get committees data fail! (" + error.toString() + ")",
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

const createCommittee = async (req, res) => {
    const inbody = req.body;
    let conn = null;
    let now = new Date().toLocaleString();
    // encrypt personalCardno
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const keyHex = key.toString('hex');
    const ivHex = iv.toString('hex');
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(inbody.personalCardNo);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    inbody.personalCardNo = encrypted.toString('hex');

    // move req param into data buffer
    const educations = inbody.educations
    const experiences = inbody.experiences
    const talents = inbody.talents
    const committeeData = {
        clubID: inbody.clubID,
        name: inbody.name,
        surname: inbody.surname,
        nationality: inbody.nationality,
        ethnicity: inbody.ethnicity,
        personalStatus: inbody.personalStatus,
        personalCardNo: inbody.personalCardNo,
        personalCardIssuedDate: inbody.personalCardIssuedDate,
        personalCardExpiredDate: inbody.personalCardExpiredDate,
        phoneNo: inbody.phoneNo,
        faxNo: inbody.faxNo,
        fatherName: inbody.fatherName,
        motherName: inbody.motherName,
        disabilityCardNo: inbody.disabilityCardNo,
        fatherOccupation: inbody.fatherOccupation,
        motherOccupation: inbody.motherOccupation,
        clubResponsibility: inbody.clubResponsibility,
        jobResponsibility: inbody.jobResponsibility,
        religion: inbody.religion,
        fatherAge: inbody.fatherAge,
        motherAge: inbody.motherAge,
        homeNo: inbody.homeNo,
        moo: inbody.moo,
        tambon: inbody.tambon,
        district: inbody.district,
        province: inbody.province,
        zipcode: inbody.zipcode,
        alternativeHomeno: inbody.alternativeHomeno,
        alternativeMoo: inbody.alternativeMoo,
        alternativeTambon: inbody.alternativeTambon,
        alternativeDistrict: inbody.alternativeDistrict,
        alternativeProvince: inbody.alternativeProvince,
        alternativeZipcode: inbody.alternativeZipcode,
        birthdate: inbody.birthdate,
        personalCardIssuedPlace: inbody.personalCardIssuedPlace,
        disabilityNameInCare: inbody.disabilityNameInCare,
        occupation: inbody.occupation,
        email: inbody.email,
        latestEducation: inbody.latestEducation,
        lastUpdatedBy: inbody.lastUpdatedBy,
        lastUpdatedDate: now,
        cardNoHashing: inbody.cardNoHashing,
        recordKey: keyHex,
        iv: ivHex,
    };

    try {
        conn = await db.connection();

        // check duplicate committee (name+surname+clubid)
        const [checkrows] = await conn.query("SELECT name, surname, clubID FROM committees WHERE name = ? AND surname = ? AND clubID=?", [committeeData.name, committeeData.surname, committeeData.clubID]);
        if (checkrows.length) {
            return res.status(400).send({ message: "This committee data is already exists on database!" });
        }
        const [checkcardno] = await conn.query("SELECT name,cardNoHashing FROM committees WHERE cardNoHashing = ?", [committeeData.cardNoHashing]);
        if (checkcardno.length) {
            return res.status(400).send({ message: "The personal card no is inused! (Duplicated!)" });
        }
        await conn.beginTransaction();
        // insert committee data
        const result = await conn.query("INSERT INTO Committees SET ?", committeeData);
        // insert educational data     
        if (educations.length > 0) {
            const insertEduQuery = 'INSERT INTO CommitteeEducations (educationLevel, field, committeeID, institute, graduatedYear, lastUpdatedBy, lastUpdatedDate) VALUES ?';
            const eduValues = educations.map(education => [education.educationLevel, education.field, result[0].insertId, education.institute, education.graduatedYear, committeeData.lastUpdatedBy, now]);
            const eduResult = await conn.query(insertEduQuery, [eduValues]);
        }
        // insert experiences data
        if (experiences.length > 0) {
            const insertExpQuery = 'INSERT INTO CommitteeExperiences (responsibility, description, committeeID, organization, duration, lastUpdatedBy, lastUpdatedDate) VALUES ?';
            const expValues = experiences.map(exp => [exp.responsibility, exp.description, result[0].insertId, exp.organization, exp.duration, committeeData.lastUpdatedBy, now]);
            const expResult = await conn.query(insertExpQuery, [expValues]);
        }
        // insert talentd data
        if (talents.length > 0) {
            const insertTalentQuery = 'INSERT INTO CommitteeTalents (talentLevel, description, committeeID, lastUpdatedBy, lastUpdatedDate) VALUES ?';
            const talentValues = talents.map(tal => [tal.talentLevel, tal.description, result[0].insertId, committeeData.lastUpdatedBy, now]);
            const talentResult = await conn.query(insertTalentQuery, [talentValues]);
        }
        await conn.commit();
        res.status(200).send({ message: "ok" });
    } catch (error) {
        console.error(error);
        conn.rollback();
        res.status(400).json({
            message: "insert committee data and related fail! (" + error + ")",
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

const updateCommittee = async (req, res) => {
    const inbody = req.body;
    let conn = null;
    // move req param into data buffer
    let now = new Date().toLocaleString();
    // encrypt personalCardNo
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(inbody.recordKey, 'hex'), Buffer.from(inbody.iv, 'hex'));
    let personalCardNoEncrypted = cipher.update(inbody.personalCardNo);
    personalCardNoEncrypted = Buffer.concat([personalCardNoEncrypted, cipher.final()]);
    inbody.personalCardNo = personalCardNoEncrypted.toString('hex');

    // move req param into data buffer
    const educations = inbody.educations;
    const experiences = inbody.experiences;
    const talents = inbody.talents;

    try {
        conn = await db.connection();
        const [checkcardno] = await conn.query("SELECT cardNoHashing FROM committees WHERE cardNoHashing = ? AND committeeID <> ?", [inbody.cardNoHashing, inbody.committeeID]);
        if (checkcardno.length) {
            return res.status(400).send({ message: "The personal card no is inused! (Duplicated!)" });
        }
        await conn.beginTransaction();
        // update committee data
        const updateQuery = `
            UPDATE committees
            SET clubID = ?, name = ?, surname = ?, nationality = ?, ethnicity = ?, personalStatus = ?, personalCardNo = ?, personalCardIssuedDate = ?, personalCardExpiredDate = ?, phoneNo = ?, faxNo = ?, fatherName = ?, motherName = ?, disabilityCardNo = ?, fatherOccupation = ?, motherOccupation = ?, clubResponsibility = ?,jobResponsibility=?, religion = ?, fatherAge = ?, motherAge = ?, homeNo = ?, moo = ?, tambon = ?, district = ?, province = ?, zipcode = ?, alternativeHomeno = ?, alternativeMoo = ?, alternativeTambon = ?, alternativeDistrict = ?, alternativeProvince = ?, alternativeZipcode = ?, birthdate = ?, personalCardIssuedPlace = ?, disabilityNameInCare = ?, occupation = ?, email=?,latestEducation=?,lastUpdatedBy=?,lastUpdatedDate=?,cardNoHashing=?
            WHERE committeeID = ?
        `;
        const cmValues = [
            inbody.clubID,
            inbody.name,
            inbody.surname,
            inbody.nationality,
            inbody.ethnicity,
            inbody.personalStatus,
            inbody.personalCardNo,
            inbody.personalCardIssuedDate,
            inbody.personalCardExpiredDate,
            inbody.phoneNo,
            inbody.faxNo,
            inbody.fatherName,
            inbody.motherName,
            inbody.disabilityCardNo,
            inbody.fatherOccupation,
            inbody.motherOccupation,
            inbody.clubResponsibility,
            inbody.jobResponsibility,
            inbody.religion,
            inbody.fatherAge,
            inbody.motherAge,
            inbody.homeNo,
            inbody.moo,
            inbody.tambon,
            inbody.district,
            inbody.province,
            inbody.zipcode,
            inbody.alternativeHomeno,
            inbody.alternativeMoo,
            inbody.alternativeTambon,
            inbody.alternativeDistrict,
            inbody.alternativeProvince,
            inbody.alternativeZipcode,
            inbody.birthdate,
            inbody.personalCardIssuedPlace,
            inbody.disabilityNameInCare,
            inbody.occupation,
            inbody.email,
            inbody.latestEducation,
            inbody.lastUpdatedBy,
            now,
            inbody.cardNoHashing,
            inbody.committeeID,
        ];

        const result = await conn.query(updateQuery, cmValues);
        // --------- educations --------

        // update or insert educations of committee
        // 1) remove old records
        const rows1 = await conn.query('DELETE FROM CommitteeEducations WHERE committeeID = ?', [inbody.committeeID]);
        // 2) insert new educational data       
        if (educations.length > 0) {
            const insertEduQuery = 'INSERT INTO CommitteeEducations (educationLevel, field, committeeID, institute, graduatedYear, lastUpdatedBy, lastUpdatedDate) VALUES ?';
            const eduValues = educations.map(education => [education.educationLevel, education.field, inbody.committeeID, education.institute, education.graduatedYear, inbody.lastUpdatedBy, now]);
            const eduResult = await conn.query(insertEduQuery, [eduValues]);
        }
        // -------- experiences -------
        // 1) remove old records
        const rows2 = await conn.query('DELETE FROM CommitteeExperiences WHERE committeeID = ?', [inbody.committeeID]);
        // 2) insert new data 
        // insert experiences data
        if (experiences.length > 0) {
            const insertExpQuery = 'INSERT INTO CommitteeExperiences (responsibility, description, committeeID, organization, duration, lastUpdatedBy, lastUpdatedDate) VALUES ?';
            const expValues = experiences.map(exp => [exp.responsibility, exp.description, inbody.committeeID, exp.organization, exp.duration, inbody.lastUpdatedBy, now]);
            const expResult = await conn.query(insertExpQuery, [expValues]);
        }
        // -------- talents -------
        // 1) remove old records
        const rows3 = await conn.query('DELETE FROM CommitteeTalents WHERE committeeID = ?', [inbody.committeeID]);
        // 2) insert new data 
        // insert talentd data
        if (talents.length > 0) {
            const insertTalentQuery = 'INSERT INTO CommitteeTalents (talentLevel, description, committeeID, lastUpdatedBy, lastUpdatedDate) VALUES ?';
            const talentValues = talents.map(tal => [tal.talentLevel, tal.description, inbody.committeeID, inbody.lastUpdatedBy, now]);
            const talentResult = await conn.query(insertTalentQuery, [talentValues]);
        }
        // ----- end ----
        await conn.commit();
        res.status(200).send({ message: "ok" });
    } catch (error) {
        console.error(error);
        conn.rollback();
        res.status(400).json({
            message: "update committee data and related fail! (" + error + ")",
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
const deleteCommittee = async (req, res) => {
    const id = req.params.id;
    let conn = null;
    try {
        conn = await db.connection();
        conn.beginTransaction();
        const row1 = await conn.query("DELETE FROM committees WHERE committeeID = ?", id);
        const row2 = await conn.query('DELETE FROM CommitteeEducations WHERE committeeID = ?', id);
        const row3 = await conn.query('DELETE FROM CommitteeExperiences WHERE committeeID = ?', id);
        const row4 = await conn.query('DELETE FROM CommitteeTalents WHERE committeeID = ?', id);
        if (row1[0].affectedRows > 0) {
            conn.commit();
            return res.status(200).send({ message: 'ok' });
        }
        conn.rollback();
        return res.status(400).send({ message: 'ERROR: Delete committee data fail!' });

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

const getCommitteeEducations = async (req, res) => {
    const id = req.params.id;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT * FROM CommitteeEducations WHERE committeeID = ?", id);
        //console.log(rows);

        return res.status(200).send({ message: rows });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get educational info of committee fail! (" + error.toString() + ")",
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

const getCommitteeExperiences = async (req, res) => {
    const id = req.params.id;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT * FROM CommitteeExperiences WHERE committeeID = ?", id);
        //console.log(rows);

        return res.status(200).send({ message: rows });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get experiences of committee fail! (" + error.toString() + ")",
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

const getCommitteeTalents = async (req, res) => {
    const id = req.params.id;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT * FROM CommitteeTalents WHERE committeeID = ?", id);
        //console.log(rows);

        return res.status(200).send({ message: rows });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get talents info of committee fail! (" + error.toString() + ")",
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
    createCommittee, updateCommittee, deleteCommittee, getCommittee, getCommitteesByName, getCommitteeTalents, getCommitteeExperiences, getCommitteeEducations
};