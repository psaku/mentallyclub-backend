const express = require('express');
const jwt = require("jsonwebtoken");
const usersController = require('../controllers/users');
const authController = require('../controllers/auth');
const locationController = require('../controllers/locations');
const clubsController = require('../controllers/clubs');

const authChecker = (req, res, next) => {
  const token = req.cookies.token; // เปลี่ยนมาเช็คผ่าน cookie ที่ใส่ไปแทน
  console.log('Token:', token);
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

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.sendStatus(403)
  }
  jwt.verify(token, authController.secretKey, (err, decoded)=> {
    if (err) {
      return res.status(401).json({error: 'Failed to authenticate token'})
    }
    req.user = decoded;
    next();
  });
}

const router = express.Router();

router.post('/login', authController.login);
router.get('/logout', verifyToken, authController.logout);
router.post('/users', verifyToken, usersController.createUser);
router.put('/users', verifyToken, usersController.updateUser);
router.put('/users/status', verifyToken, usersController.updateUserStatus);
router.put('/users/email', verifyToken, usersController.updateEmail);
router.put('/users/password', verifyToken, usersController.updatePassword);
router.delete('/users/:name', verifyToken, usersController.deleteUser);
router.get('/users/:name', verifyToken, usersController.getUser);
router.get('/users', verifyToken, usersController.getUsers);
router.get('/locations',locationController.getLocationID);
router.get('/locations/tambons',locationController.getTambons);
router.get('/locations/districts',locationController.getDistricts);
router.get('/locations/provinces/:region',locationController.getProvincesByRegion);
router.get('/locations/:postcode',locationController.getLocationByPostcode);
router.get('/locations/provinces',locationController.getProvinces);
router.get('/locations/regions',locationController.getRegions);
// club api
router.get('/clubs', verifyToken, clubsController.getClubs);
router.get('/clubs/:id', verifyToken, clubsController.getClub);
router.post('/clubs', verifyToken, clubsController.createClub);
router.put('/clubs', verifyToken, clubsController.updateClub);
router.delete('/clubs/:id', verifyToken, clubsController.deleteClub);

module.exports = router;