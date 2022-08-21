const path = require('path');

const express = require('express');

const staffController = require('../controllers/staff');

const router = express.Router();

router.get('/', staffController.getRollCall); //Router hiển thị trang điểm danh

router.post('/startWork', staffController.postRollCall); //Router checkin

router.post('/endWork', staffController.postStopWork); //Router checkout

router.post('/annualLeave', staffController.postAnnualLeave);

router.get('/information', staffController.getInformation);

router.get('/work-history', staffController.getWorkHistory);

router.get('/covid-info', staffController.getCovidInfo);

router.post('/covid-temperature', staffController.postCovidTemperature);

router.post('/covid-vaccine', staffController.postCovidVaccine);

router.post('/covid-status', staffController.postCovidStatus);

router.post('/editImage', staffController.postImageUrl);

module.exports = router;