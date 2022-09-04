const path = require('path');

const express = require('express');

const staffController = require('../controllers/staff');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', isAuth, staffController.getRollCall); //Router hiển thị trang điểm danh

router.post('/startWork', isAuth, staffController.postRollCall); //Router checkin

router.post('/endWork', isAuth, staffController.postStopWork); //Router checkout

router.post('/annualLeave', isAuth, staffController.postAnnualLeave);

router.get('/information', isAuth, staffController.getInformation);

router.get('/work-history', isAuth, staffController.getWorkHistory);

router.get('/covid-info', isAuth, staffController.getCovidInfo);

router.post('/covid-temperature', isAuth, staffController.postCovidTemperature);

router.post('/covid-vaccine', isAuth, staffController.postCovidVaccine);

router.post('/covid-status', isAuth, staffController.postCovidStatus);

router.post('/editImage', isAuth, staffController.postImage);

router.post('/work-history', isAuth, staffController.postWorkHistory);

module.exports = router;