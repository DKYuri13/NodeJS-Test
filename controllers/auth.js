const bcrypt = require('bcryptjs');

const Staff = require('../models/staff');

exports.getLogin = (req, res, next) => {                                                    //RENDER TRANG LOGIN
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  let previousPath;                                                                       //Đường dẫn trang trước khi logout
                             
  if (req.header('Referer')) {                                                            //Nếu có trang trước đó
    const webPath = req.header('Referer').split('/')[2];  //Lấy chuỗi tên web và tên miền (abc.xyz.com)
    previousPath = req.header('Referer').replace('http://' + webPath,'');
  } else {                                                                                //Nếu không có trang trước đó
    previousPath;                                                                         
  }

  res.render('auth/login', {
    path:'/login',
    pageTitle: 'Login',
    previousPath: previousPath,
    errorMessage: message
  })
}

exports.postLogin = (req, res, next) => {                                                 //POST THÔNG TIN LOGIN
  const username = req.body.username;
  const password = req.body.password;
  const previousPath = req.body.previousPath;                                             //Đường dẫn trang đã truy cập trước khi logout

  Staff.findOne({ username: username })
    .then(staff => {
      if (!staff) {                                                                       //Nếu người dùng không tồn tại
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }
      bcrypt.compare(password, staff.password)
        .then(doMatch => {                                                                //Nếu mật khẩu đúng
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.staff = staff;
            req.session.isAdmin = staff.isAdmin;
            return req.session.save(err => {
              console.log(err);
              res.redirect(previousPath || '/');
            });
          }
          req.flash('error', 'Invalid email or password.');                               //Nếu mật khẩu không đúng
          res.redirect('/login');
        })
        .catch(err => {                                                                   //Nếu xảy ra lỗi
          console.log(err);
          res.redirect('/login');
        })
    }) 
    .catch(err => console.log(err))
}

exports.postLogout = (req, res, next) => {                                                  //ĐĂNG XUẤT
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/login');
  });
}