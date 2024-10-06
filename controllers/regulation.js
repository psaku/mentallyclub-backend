const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const db = require('../db/database');

dotenv.config();

const UPLOAD_PATH = process.env.UPLOAD_CLUB_STORAGE_FOLDER;

async function getRegulationFile(filePath) {
    try {
        await fs.existsSync(filePath); // Check if the file is accessible
        
        const inputBuffer = await fs.readFileSync(filePath); // Read the file into a buffer
        return inputBuffer; // Return the buffer
    } catch (error) {
        throw new Error(`Read fail: ${error.message}`); // Handle errors
    }
}

const getRegulationDocument = async (req, res) => {
    const id = req.params.id;
    let conn = null;
    let regulationData = '';
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT * FROM clubregulation WHERE clubID = ?", `${id}`);
        //console.log(rows);
        if (rows.length) { 
            regulationData =  await getRegulationFile(rows[0].regulationFile);
            return res.status(200).send({ message: [{ 'clubID': rows[0].clubID, 'lastUpdatedBy': rows[0].LastUpdatedBy, 'lastUpdatedDate': rows[0].LastUpdatedDate, 'regulationFile': regulationData.toString() }] });
        } else {
            return res.status(404).send({ message: 'Regulation documents not found!' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get regulation data fail! (" + error.toString() + ")",
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

const getClubRegulationByID = async (req, res) => {
    const id = req.params.id;
    let conn = null;

    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT cr.*, c.clubid, c.clubname, c.foundingdate FROM clubs c INNER JOIN clubregulation cr on c.clubid = cr.clubid WHERE c.clubid LIKE ? LIMIT 10", `${id}%`);
        //console.log(rows);
        if (rows.length) {
            return res.status(200).send({ message: rows });
        } else {
            return res.status(404).send({ message: 'Club Regulation file not found!' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get regulation data fail! (" + error.toString() + ")",
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
// get by name
const getClubRegulationByName = async (req, res) => {
    const name = req.params.name;
    let conn = null;

    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT cr.*, c.clubid, c.clubname, c.foundingdate FROM clubs c INNER JOIN clubregulation cr on c.clubid = cr.clubid WHERE c.clubname LIKE ? LIMIT 10", `${name}%`);
        //console.log(rows);
        if (rows.length) {
            return res.status(200).send({ message: rows });
        } else {
            return res.status(404).send({ message: 'Club Regulation file not found!' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "get regulation data fail! (" + error.toString() + ")",
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

async function keepFile(inputBuffer, outputPath) {
    try {
        // Create a write stream for the output file
        const output = fs.createWriteStream(outputPath);
        output.write(inputBuffer);
        output.end();
        output.close();
    } catch (err) {
        throw err;
    }
}

async function saveRegulationInfo(clubID, filePath, lastUpdatedBy) {
    let conn = null;
    let now = new Date().toLocaleString();

    const dataSet = {
        clubID: clubID,
        lastUpdatedDate: now,
        lastUpdatedBy: lastUpdatedBy,
        regulationFile: filePath
    };
    try {
        conn = await db.connection();
        const result = await conn.query("INSERT INTO ClubRegulation SET ?", dataSet);
        if (conn) {
            try {
                await conn.close(); // Close the connection in the finally block
                return true;
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
                return false;
            }
        }
    } catch (error) {
        console.error(error.message);
        return error.message;
    }
}

async function updateRegulationInfo(clubID, filePath, lastUpdatedBy) {
    let conn = null;
    let now = new Date().toLocaleString();

    try {
        conn = await db.connection();
        const result = await conn.query("UPDATE ClubRegulation SET lastUpdatedDate=?,lastUpdatedBy=?, regulationFile=? WHERE clubID = ?", [now, lastUpdatedBy, filePath, clubID]);
        if (conn) {
            try {
                await conn.close(); // Close the connection in the finally block
                return true;
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
                return false;
            }
        }
    } catch (error) {
        console.error(error.message);
        return error.message;
    }
}

// ฟังก์ชันสำหรับจัดการการอัปโหลดไฟล์
const uploadFile = async (req, res) => {
    const { clubID, lastUpdatedBy, regulationFile } = req.body;

    if (!regulationFile) {
        return res.status(400).send({ message: 'No regulation file was uploaded.' });
    }
    try {
        const regulationFileName = 'regulation_' + clubID;
        const regulationFilePath = path.join(UPLOAD_PATH, regulationFileName);
        if (!fs.existsSync(UPLOAD_PATH)) {
            fs.mkdirSync(UPLOAD_PATH, { recursive: true }); // Use recursive to create nested directories
        }

        await keepFile(regulationFile, regulationFilePath);
        result = await saveRegulationInfo(clubID, regulationFilePath, lastUpdatedBy);

        if (result == true) {
            res.status(200).send({ message: "ok" });
        } else {
            res.status(400).send({ message: result });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัพโหลดไฟล์:', error);
        res.status(500).send({ message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์' });
    }
};

// update
const updateFile = async (req, res) => {
    const { clubID, lastUpdatedBy, regulationFile } = req.body;

    if (!regulationFile) {
        return res.status(400).send({ message: 'No regulation file was uploaded.' });
    }
    try {
        const regulationFileName = 'regulation_' + clubID;
        const regulationFilePath = path.join(UPLOAD_PATH, regulationFileName);
        if (!fs.existsSync(UPLOAD_PATH)) {
            fs.mkdirSync(UPLOAD_PATH, { recursive: true }); // Use recursive to create nested directories
        }

        await keepFile(regulationFile, regulationFilePath);
        result = await updateRegulationInfo(clubID, regulationFilePath, lastUpdatedBy);

        if (result == true) {
            res.status(200).send({ message: "ok" });
        } else {
            res.status(400).send({ message: result });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัพโหลดไฟล์:', error);
        res.status(500).send({ message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์' });
    }
};

const unlinkFile = async (req, res) => {
    const id = req.params.id;
    let conn = null;
    try {
        conn = await db.connection();
        const rows = await conn.query("DELETE FROM ClubRegulation WHERE clubID = ?", id);
        if (rows[0].affectedRows > 0) {
            await deleteDocumentFromStorage(id);
            return res.status(200).send({ message: 'ok' });
        }
        return res.status(404).send({ message: 'ERROR: Delete regulation file fail!' });
    } catch (error) {
        conn.rollback();
        console.error(error);
        res.status(500).json({
            message: "Delete regulation file fail!",
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
        const removedFiles = ['regulation_' + id];

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
    uploadFile, unlinkFile, updateFile, getClubRegulationByID, getClubRegulationByName, getRegulationDocument
};