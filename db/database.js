const mysql = require("mysql2/promise");

// MySQL database options

const options = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "mysqladmin",
    database: "mentallityclub_db",
};

var db = {};

db.connection = async () => {
    return await mysql.createConnection(options);
}

module.exports = db;