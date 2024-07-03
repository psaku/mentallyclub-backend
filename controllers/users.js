const bcrypt = require("bcrypt");
const db = require('../db/database');

// get user by id
const getUser = async(req, res) => {
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
      await conn.close(); // Close the connection in the finally block
    }
  }
}

// get all users
const getUsers = async(req, res) => { 
  let conn = null;
  try {
    conn = await db.connection();
    const [userrows] = await conn.query("SELECT * FROM users");
    if (userrows.length) {
      return res.status(200).send({ message: userrows });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "get users data fail!",
      error,
    });
  } finally {
    if (conn) {
      await conn.close(); // Close the connection in the finally block
    }
  }
}

// register new user
const createUser = async (req, res) => {
  const { username, password, role, status, email } = req.body;
  console.log(username);
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
  // Hash the password
  const hashResult = await bcrypt.hash(password, 256);
  // 256 = salt (การสุ่มค่าเพื่อเพิ่มความซับซ้อนในการเข้ารหัส)

  // Store the user data
  const userData = {
    username: username,
    role: role,
    status: status,
    email: email,
    password: hashResult
  };

  try {
    const result = await conn.query("INSERT INTO users SET ?", userData);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert user data fail!",
      error,
    });
  } finally {
    if (conn) {
      await conn.close(); // Close the connection in the finally block
    }
  }
  res.status(200).send({ message: "ok" });
}

// update user
const updateUser = async (req, res) => {
  const { username, role, status, email } = req.body;
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
    const row = await conn.query("UPDATE users SET role = ?, status = ?, email = ? WHERE Username = ?", [role, status, email, username]);
    if (!(row[0].affectedRows > 0)) {
      return res.status(404).send({ message: 'ERR: update user fail!' });
    }     
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert user data fail!",
      error,
    });
  } finally {
    if (conn) {
      await conn.close(); // Close the connection in the finally block
    }
  }
  return res.status(200).send({ message: "ok" });
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
      await conn.close(); // Close the connection in the finally block
    }
  }
}

// update password
const updatePassword = async (req, res) => {
  const { username, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 256);
  let conn = null;
  try {
    conn = await db.connection();
    const row = await conn.query("UPDATE users SET password = ? WHERE Username = ?", [hashPassword, username]);
    // console.log(row[0].affectedRows)
    if (row[0].affectedRows > 0) {
      return res.status(200).send({ message: "Change user password successfully" });
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
      await conn.close(); // Close the connection in the finally block
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
      await conn.close(); // Close the connection in the finally block
    }
  }
}

// delete user by name
const deleteUser = async(req, res) => {
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
      message: "get users data fail!",
      error,
    });
  } finally {
    if (conn) {
      await conn.close(); // Close the connection in the finally block
    }
  }
}

module.exports = {
  createUser, getUsers, getUser, updateUserStatus, updateUser, deleteUser, updateEmail, updatePassword
};

