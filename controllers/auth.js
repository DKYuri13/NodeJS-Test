const bcrypt = require('bcryptjs');

const Staff = require('../models/staff');

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  let previousPath;
  const webPath = req.header('Referer').split('/')[2];                           //Lấy chuỗi tên web
  
  if (req.header('Referer')) {
    previousPath = req.header('Referer').replace('http://' + webPath,'');
  } else {
    previousPath;
  }

  res.render('auth/login', {
    path:'/login',
    pageTitle: 'Login',
    previousPath: previousPath,
    errorMessage: message
  })
}

exports.postLogin = (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const previousPath = req.body.previousPath;
  Staff.findOne({ username: username })
    .then(staff => {
      if (!staff) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }
      bcrypt.compare(password, staff.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.staff = staff;
            req.session.isAdmin = staff.isAdmin;
            return req.session.save(err => {
              console.log(err);
              res.redirect(previousPath || '/');
            });
          }
          req.flash('error', 'Invalid email or password.');
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })
    }) 
    .catch(err => console.log(err))
}

exports.postLogout = (req, res, next) => {
  const path = req.header('Referer');
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/login');
  });
}