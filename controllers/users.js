const bcrypt = require("bcrypt");
const db = require('../db/database');

// get user by id
const getUser = async (req, res) => {
  const username = req.params.name;
  let conn = null;
  try {
    conn = await db.connection();
    const [userrows] = await conn.query("SELECT * FROM users WHERE Username = ?", username);
    if (userrows.length) {
      return res.status(200).send({ message: userrows });
    }

    return res.status(404).send({ message: 'User not found!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get users data fail!",
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

// get all users
const getUsers = async (req, res) => {
  let conn = null;
  try {
    conn = await db.connection();
    const [rows] = await conn.query("SELECT * FROM users");
    const userrows = rows.map((row) => {
      const lastAccessedFormatted = new Date(row.LastAccessed).toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
        dateStyle: "full",
        timeStyle: "short",
      });
      return { ...row, LastAccessed: lastAccessedFormatted };
    });
    
    return res.status(200).send({ message: userrows });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get users data fail!",
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

// register new user
const createUser = async (req, res) => {
  const { username, password, role, status, email, personalname } = req.body;

  let conn = null;
  try {
    conn = await db.connection();
    // check unique username?
    const [userrows] = await conn.query("SELECT * FROM users WHERE Username = ?", username);
    if (userrows.length) {
      return res.status(400).send({ message: "Username is already registered" });
    }
    // check unique email?
    const [emailrows] = await conn.query("SELECT * FROM users WHERE email = ?", email);
    if (emailrows.length) {
      return res.status(400).send({ message: "Email is already registered" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database error!",
      error,
    });
  }
  // Hash the password, round of sult = 10-12
  //const hashResult = await bcrypt.hash(password, 10);
  // 10 = salt (การสุ่มค่าเพื่อเพิ่มความซับซ้อนในการเข้ารหัส)

  const salt = await bcrypt.genSalt(10);
  // แฮชรหัสผ่านด้วยซอลต์ที่สร้างขึ้น
  const hashResult = await  bcrypt.hash(password, salt);
  
  console.log(salt, hashResult);
  // Store the user data
  const userData = {
    username: username,
    personalname: personalname,
    role: role,
    status: status,
    email: email,
    password: hashResult
  };

  try {
    const result = await conn.query("INSERT INTO users SET ?", userData);
    res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "insert user data fail!",
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

// update user
const updateUser = async (req, res) => {
  const { username, role, status, email, personalname } = req.body;
  //console.log(username);
  let conn = null;
  try {
    conn = await db.connection();
    // check unique email?
    const [emailrows] = await conn.query("SELECT * FROM users WHERE email = ? AND Username != ?", [email, username]);
    if (emailrows.length) {
      return res.status(400).send({ message: "Email is already registered" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database error!",
      error,
    });
  }

  try {
    const row = await conn.query("UPDATE users SET role = ?, status = ?, email = ?, personalname = ? WHERE Username = ?", [role, status, email, personalname, username]);
    if (!(row[0].affectedRows > 0)) {
      return res.status(404).send({ message: 'ERR: update user fail!' });
    }
    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "update user data fail!",
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

// update user status
const updateUserStatus = async (req, res) => {
  const { username, status } = req.body;
  let conn = null;
  try {
    conn = await db.connection();
    const row = await conn.query("UPDATE users SET status = ? WHERE Username = ?", [status, username]);
    // console.log(row[0].affectedRows)
    if (row[0].affectedRows > 0) {
      return res.status(200).send({ message: "User status updated successfully" });
    }
    return res.status(404).send({ message: 'ERR: update user status fail!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Update Database error!",
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

// update password
const updatePassword = async (req, res) => {
  const { username, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);
  let conn = null;
  try {
    conn = await db.connection();
    const row = await conn.query("UPDATE users SET password = ? WHERE Username = ?", [hashPassword, username]);
    // console.log(row[0].affectedRows)
    if (row[0].affectedRows > 0) {
      return res.status(200).send({ message: "ok" });
    }
    return res.status(404).send({ message: 'ERR: change password fail!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Update Database error!",
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

// update email
const updateEmail = async (req, res) => {
  const { username, email } = req.body;
  let conn = null;
  try {
    conn = await db.connection();
    // check unique email?
    const [emailrows] = await conn.query("SELECT * FROM users WHERE email = ? AND Username != ?", [email, username]);
    if (emailrows.length) {
      return res.status(400).send({ message: "Email is already registered" });
    }

    const row = await conn.query("UPDATE users SET email = ? WHERE Username = ?", [email, username]);
    // console.log(row[0].affectedRows)
    if (row[0].affectedRows > 0) {
      return res.status(200).send({ message: "Email updated successfully" });
    }
    return res.status(404).send({ message: 'ERR: update email fail!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Update Database error!",
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

// delete user by name
const deleteUser = async (req, res) => {
  const username = req.params.name;
  let conn = null;
  try {
    conn = await db.connection();
    const row = await conn.query("DELETE FROM users WHERE Username = ?", username);
    if (row[0].affectedRows > 0) {
      return res.status(200).send({ message: 'ok' });
    }

    return res.status(404).send({ message: 'ERROR: Delete user fail!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Delete users data fail!",
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
  createUser, getUsers, getUser, updateUserStatus, updateUser, deleteUser, updateEmail, updatePassword
};

