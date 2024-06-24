const express = require('express');
const jwt = require("jsonwebtoken");
const usersController = require('../controllers/users');
const authController = require('../controllers/auth');
const locationController = require('../controllers/locations');

const authChecker = (req, res, next) => {
  const token = req.cookies.token; // เปลี่ยนมาเช็คผ่าน cookie ที่ใส่ไปแทน
  console.log('Token:', authController.secretKey);
  if (token == null) return res.sendStatus(401); // if there isn't any token
  
  try {
    const user = jwt.verify(token, authController.secretKey);
    req.user = user;
    console.log("user", user);
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
}

const router = express.Router();

router.post('/login', authController.login);
router.get('/logout', authChecker, authController.logout);
router.post('/users', authChecker, usersController.createUser);
router.put('/users/status', authChecker, usersController.updateUserStatus);
router.put('/users/email', authChecker, usersController.updateEmail);
router.put('/users/password', authChecker, usersController.updatePassword);
router.delete('/users/:name', authChecker, usersController.deleteUser);
router.get('/users/:name', authChecker, usersController.getUser);
router.get('/users', authChecker, usersController.getUsers);
router.get('/locations',locationController.getLocationID);
router.get('/locations/tambons',locationController.getTambons);
router.get('/locations/districts',locationController.getDistricts);
router.get('/locations/provinces/:region',locationController.getProvincesByRegion);
router.get('/locations/provinces',locationController.getProvinces);
router.get('/locations/regions',locationController.getRegions);

module.exports = router;