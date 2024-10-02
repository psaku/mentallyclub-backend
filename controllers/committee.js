const db = require('../db/database');

const createCommittee = async (req, res) => {
    const inbody = req.body;
    let conn = null;
    let now = new Date().toLocaleString();
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
    };
    try {
        conn = await db.connection();

        // check duplicate committee (name+surname+clubid)
        const [checkrows] = await conn.query("SELECT name, surname, clubID FROM committees WHERE name = ? AND surname = ? AND clubID=?", [committeeData.name, committeeData.surname, committeeData.clubID]);
        if (checkrows.length) {
            return res.status(400).send({ message: "This committee data is already exists on database!" });
        }
        await conn.beginTransaction();
        // insert committee data
        const result = await conn.query("INSERT INTO Committees SET ?", committeeData);
        // insert educational data        
        const insertEduQuery = 'INSERT INTO CommitteeEducations (educationLevel, major, committeeID, institute, graduatedYear, lastUpdatedBy, lastUpdatedDate) VALUES ?';
        const eduValues = educations.map(education => [education.educationLevel, education.major, result[0].insertId, education.institute, education.graduatedYear, committeeData.lastUpdatedBy, now]);
        const eduResult = await conn.query(insertEduQuery, [eduValues]);
        // insert experiences data
        const insertExpQuery = 'INSERT INTO CommitteeExperiences (responsibility, description, committeeID, organization, duration, lastUpdatedBy, lastUpdatedDate) VALUES ?';
        const expValues = experiences.map(exp => [exp.responsibility, exp.description, result[0].insertId, exp.organization, exp.duration, committeeData.lastUpdatedBy, now]);
        const expResult = await conn.query(insertExpQuery, [expValues]);
        // insert talentd data
        const insertTalentQuery = 'INSERT INTO CommitteeTalents (talentLevel, description, committeeID, lastUpdatedBy, lastUpdatedDate) VALUES ?';
        const talentValues = talents.map(tal => [tal.talentLevel, tal.description, result[0].insertId, committeeData.lastUpdatedBy, now]);
        const talentResult = await conn.query(insertTalentQuery, [talentValues]);

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
    const committeeData = {
        clubid: inbody.clubid,
        name: inbody.name,
        surname: inbody.surname,
        nationality: inbody.nationality,
        ethnicity: inbody.ethnicity,
        personalstatus: inbody.personalstatus,
        licenseno: inbody.licenseno,
        licensecardissueddate: inbody.licensecardissueddate,
        licensecardexpireddate: inbody.licensecardexpireddate,
        phoneno: inbody.phoneno,
        faxno: inbody.faxno,
        fathername: inbody.fathername,
        mothername: inbody.mothername,
        disabilitycardno: inbody.disabilitycardno,
        fatheroccupation: inbody.fatheroccupation,
        motheroccupation: inbody.motheroccupation,
        responsibility: inbody.responsibility,
        religion: inbody.religion,
        fatherage: inbody.fatherage,
        motherage: inbody.motherage,
        homeno: inbody.homeno,
        moo: inbody.moo,
        tambon: inbody.tambon,
        district: inbody.district,
        province: inbody.province,
        zipcode: inbody.zipcode,
        alternativehomeno: inbody.alternativehomeno,
        alternativemoo: inbody.alternativemoo,
        alternativetambon: inbody.alternativetambon,
        alternativedistrict: inbody.alternativedistrict,
        alternativeprovince: inbody.alternativeprovince,
        alternativezipcode: inbody.alternativezipcode,
        birthdate: inbody.birthdate,
        licensecardissuedplace: inbody.licensecardissuedplace,
        disabledpersonnameincare: inbody.disabledpersonnameincare,
        occupation: inbody.occupation,
        committeeid: inbody.id
    };
    try {
        conn = await db.connection();
        await conn.beginTransaction();
        // update committee data
        const updateQuery = `
            UPDATE committee
            SET clubid = ?, name = ?, surname = ?, nationality = ?, ethnicity = ?, personalstatus = ?, licenseno = ?, licensecardissueddate = ?, licensecardexpireddate = ?, phoneno = ?, faxno = ?, fathername = ?, mothername = ?, disabilitycardno = ?, fatheroccupation = ?, motheroccupation = ?, responsibility = ?, religion = ?, fatherage = ?, motherage = ?, homeno = ?, moo = ?, tambon = ?, district = ?, province = ?, zipcode = ?, alternativehomeno = ?, alternativemoo = ?, alternativetambon = ?, alternativedistrict = ?, alternativeprovince = ?, alternativezipcode = ?, birthdate = ?, licensecardissuedplace = ?, disabledpersonnameincare = ?, occupation = ?
            WHERE id = ?
        `;
        const cmValues = [
            committeeData.clubid,
            committeeData.name,
            committeeData.surname,
            committeeData.nationality,
            committeeData.ethnicity,
            committeeData.personalstatus,
            committeeData.licenseno,
            committeeData.licensecardissueddate,
            committeeData.licensecardexpireddate,
            committeeData.phoneno,
            committeeData.faxno,
            committeeData.fathername,
            committeeData.mothername,
            committeeData.disabilitycardno,
            committeeData.fatheroccupation,
            committeeData.motheroccupation,
            committeeData.responsibility,
            committeeData.religion,
            committeeData.fatherage,
            committeeData.motherage,
            committeeData.homeno,
            committeeData.moo,
            committeeData.tambon,
            committeeData.district,
            committeeData.province,
            committeeData.zipcode,
            committeeData.alternativehomeno,
            committeeData.alternativemoo,
            committeeData.alternativetambon,
            committeeData.alternativedistrict,
            committeeData.alternativeprovince,
            committeeData.alternativezipcode,
            committeeData.birthdate,
            committeeData.licensecardissuedplace,
            committeeData.disabledpersonnameincare,
            committeeData.occupation,
            committeeData.committeeid
        ];
        const result = await conn.query(updateQuery, cmValues);
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

module.exports = {
    createCommittee, updateCommittee
};