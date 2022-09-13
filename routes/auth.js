const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);      //Router hiển thị trang login

router.post('/login', authController.postLogin);        //Router gửi thông tin login

router.post('/logout', authController.postLogout);      //Router logout

module.exports = router;
