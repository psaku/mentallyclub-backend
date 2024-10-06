const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('../db/database');

const secretKey = "8BC9B61C942F9B69C8E438B5F692E";

const login = async (req, res) => {
    const { username, password } = req.body;
    let conn = null;
    try {
        conn = await db.connection();
        const [result] = await conn.query("SELECT * from users WHERE username = ? AND status = 'active'", username);
        const user = result[0];

        if (!user) {
            return res.status(401).send({ message: "Invalid username or password!" });
        }

        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) {
            return res.status(401).send({ message: "Invalid username or password!" });
        }
        // update last login datetime
        const upd = await conn.query("UPDATE users SET lastaccessed = NOW() WHERE username = ?", username);

        const token = jwt.sign({ username: user.Username, role: user.Role }, secretKey, { expiresIn: "1h" });

        res.cookie("token", token, {
            maxAge: 1000 * 60 * 60 * 24,   // expired after 24 hours
            secure: false,  // not use with HTTPS only
            httpOnly: false,
            sameSite: "Lax",  // None, (Strict, Lax)
        });

        res.status(200).send({ message: "Login successful", UserID: user.UserID, PersonalName: user.PersonalName, Email: user.Email, Role: user.Role, Password: user.Password, token: token });
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Internal server error' });
    } finally {
        if (conn) {
            try {
                await conn.close(); // Close the connection in the finally block
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
};

// user logout
const logout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.send({ message: "ok" });
    } catch (err) {
        res.send({ message: err });
        console.log(err);
    }
};

module.exports = {
    login, logout, secretKey
}

