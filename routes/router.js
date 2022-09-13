const path = require('path');

const express = require('express');

const staffController = require('../controllers/staff');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', isAuth, staffController.getRollCall); //Router hiển thị trang điểm danh

router.post('/startWork', isAuth, staffController.postRollCall); //Router checkin

router.post('/endWork', isAuth, staffController.postStopWork); //Router checkout

router.post('/annualLeave', isAuth, staffController.postAnnualLeave);  //Router xin nghỉ

router.get('/information', isAuth, staffController.getInformation);   //Router hiển thị trang thông tin cá nhân

router.get('/work-history', isAuth, staffController.getWorkHistory);    //Router hiển thị trang lịch sử làm việc

router.get('/covid-info', isAuth, staffController.getCovidInfo);    //Router hiển thị trang đăng ký thông tin covid

router.post('/covid-temperature', isAuth, staffController.postCovidTemperature);    //Router đăng ký thân nhiệt

router.post('/covid-vaccine', isAuth, staffController.postCovidVaccine);    //Router đăng ký thông tin tiêm vaccine

router.post('/covid-status', isAuth, staffController.postCovidStatus);      //Router đăng ký tình trạng covid

router.post('/editImage', isAuth, staffController.postImage);           //Router sửa ảnh

router.post('/work-history', isAuth, staffController.postWorkHistory);  //Router chọn số ngày làm việc hiển thị (trang lịch sử làm việc)

router.post('/work-history/:month', isAuth, staffController.postMonthWorkHistory);  //Router chọn tháng lương hiển thị (trang lịch sử làm việc)

module.exports = router;