const mysql = require("mysql2/promise");
// Load environment variables from .env file
const dotenv = require('dotenv'); 
dotenv.config();

// MySQL database options using environment variables
const options = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
var db = {};

db.connection = async () => {
    return await mysql.createConnection(options);
}

module.exports = db;