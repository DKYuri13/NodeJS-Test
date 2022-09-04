const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const Staff = require('../models/staff');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);

module.exports = router;
