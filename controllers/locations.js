const db = require('../db/database');

const getLocationID = async (req, res) => {
    const { tambon, district, province, postcode } = req.body;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT LocationID FROM ThailandLocations WHERE TambonThai = ? AND ProvinceThai = ? AND DistrictThai = ? AND PostCode = ?", [tambon, province, district, postcode]);
        if (rows.length) {
            return res.status(200).send({ message: rows[0] });
        }

        return res.status(404).send({ message: 'Location not found!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "get location data fail!",
            error,
        });
    }
}

const getTambons = async (req, res) => {
    const { district, province } = req.body;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT TambonThai FROM ThailandLocations WHERE ProvinceThai = ? AND DistrictThai = ? ORDER BY TambonThai ASC", [province, district]);
        if (rows.length) {
            return res.status(200).send({ message: rows });
        }

        return res.status(404).send({ message: 'Tambon not found!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "get Tambon data fail!",
            error,
        });
    }
}

const getDistricts = async (req, res) => {
    const { province } = req.body;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT DISTINCT DistrictThai FROM ThailandLocations WHERE ProvinceThai = ? ORDER BY DistrictThai ASC", [province]);
        if (rows.length) {
            return res.status(200).send({ message: rows });
        }

        return res.status(404).send({ message: 'District not found!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "get District data fail!",
            error,
        });
    }
}

const getProvincesByRegion = async (req, res) => {
    const regionname = req.params.region;
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT DISTINCT ProvinceThai FROM ThailandLocations WHERE RegionName like ? ORDER BY ProvinceThai ASC", [regionname]);
        if (rows.length) {
            return res.status(200).send({ message: rows });
        }

        return res.status(404).send({ message: 'Province not found!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "get Province data fail!",
            error,
        });
    }
}

const getProvinces = async (req, res) => {    
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT DISTINCT ProvinceThai FROM ThailandLocations ORDER BY ProvinceThai ASC");
        if (rows.length) {
            return res.status(200).send({ message: rows });
        }

        return res.status(404).send({ message: 'Province not found!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "get Province data fail!",
            error,
        });
    }
}

const getRegions = async (req, res) => {    
    let conn = null;
    try {
        conn = await db.connection();
        const [rows] = await conn.query("SELECT DISTINCT RegionName FROM ThailandLocations ORDER BY RegionName ASC");
        if (rows.length) {
            return res.status(200).send({ message: rows });
        }

        return res.status(404).send({ message: 'Region not found!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "get region data fail!",
            error,
        });
    }
}

module.exports = { getLocationID, getTambons, getDistricts, getProvincesByRegion, getProvinces, getRegions  }