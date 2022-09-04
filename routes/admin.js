const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

const router = express.Router();

router.get('/month-check', isAuth, isAdmin, adminController.getMonthCheck);

router.get('/month-check/:staffId', isAuth, isAdmin, adminController.getStaff);

router.post('/month-check/:staffId', isAuth, isAdmin, adminController.postStaff)

router.post('/delete-work-session', isAuth, isAdmin, adminController.postDeleteWorkSession);

router.post('/confirm', isAuth, isAdmin, adminController.postConfirm);

router.get('/covid-info/:staffId', isAuth, isAdmin, adminController.getPdf)

module.exports = router;