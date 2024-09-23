const db = require('../db/database');

const createCommittee = async (req, res) => {
    const inbody = req.body;
    let conn = null;
    // move req param into data buffer
    const educations = inbody.educations
    const experiences = inbody.experiences
    const talents = inbody.talents
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
    };
    try {
        conn = await db.connection();
        await conn.beginTransaction();
        // insert committee data
        const result = await conn.query("INSERT INTO ClubCommittee SET ?", committeeData);
        // insert educational data        
        const insertEduQuery = 'INSERT INTO CommitteeEducations (EducationLevel, Major, CommitteeID, institute, GraduatedYear) VALUES ?';
        const eduValues = educations.map(education => [education.educationlevel, education.major, result[0].insertId, education.institute, education.graduatedyear]);
        const eduResult = await conn.query(insertEduQuery, [eduValues]);
        // insert experiences data
        const insertExpQuery = 'INSERT INTO CommitteeExperiences (Responsibility, Description, CommitteeID, Organization, Duration) VALUES ?';
        const expValues = experiences.map(exp => [exp.responsibility, exp.description, result[0].insertId, exp.organization, exp.duration]);
        const expResult = await conn.query(insertExpQuery, [expValues]);
        // insert talentd data
        const insertTalentQuery = 'INSERT INTO CommitteeTalents (TalentLevel, Description, CommitteeID) VALUES ?';
        const talentValues = talents.map(tal => [tal.talentlevel, tal.description, result[0].insertId]);
        const talentResult = await conn.query(insertTalentQuery, [talentValues]);

        await conn.commit();
        res.status(200).send({ message: "ok" });
    } catch (error) {
        console.error(error);
        conn.rollback();
        res.status(500).json({
            message: "insert committee data and related fail!",
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
        res.status(500).json({
            message: "update committee data and related fail!",
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