const db = require('../db/database');

const createCommittee = async (req, res) => {
    const inbody = req.body;
    console.log(inbody)
    let conn = null;    
    res.status(200).send({ message: "ok" });
}

module.exports = {
    createCommittee
};