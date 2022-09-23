const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

const router = express.Router();

router.get('/month-check', isAuth, isAdmin, adminController.getMonthCheck);                        //Router hiển thị trang xác nhận giờ làm (chọn nhân viên hiển thị)

router.get('/month-check/:staffId', isAuth, isAdmin, adminController.getStaff);                   //Router hiển thị trang xác nhận giờ làm (hiển thị nhân viên đã chọn)

router.post('/month-check/:staffId', isAuth, isAdmin, adminController.postStaff)                  //Router chọn tháng hiển thị cho trang xác nhận giờ làm

router.post('/delete-work-session/:workSessionId', isAuth, isAdmin, adminController.postDeleteWorkSession);      //Router xóa giờ làm của nhân viên hiển thị

router.post('/confirm', isAuth, isAdmin, adminController.postConfirm);                            //Router xác nhận giờ làm tháng hiện tại của nhân viên hiển thị

router.get('/covid-info/:staffId', isAuth, isAdmin, adminController.getPdf)                       //Router xuất file pdf thông tin covid nhân viên

module.exports = router;