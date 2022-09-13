const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bcrypt = require('bcryptjs');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');     //Import controller, model,....
const Staff = require('./models/staff');
const Covid = require('./models/covid');
const WorkSession = require('./models/work-session');

const MONGODB_URI = 'mongodb+srv://Quang:Quang013@cluster1.oehkwdn.mongodb.net/rollcall?retryWrites=true&w=majority';

const app = express();                                                                  //Express

const store = new MongoDBStore({                                                        //Tạo store sessions mongoDB
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();
const fileStorage = multer.diskStorage({                                                //Storage ảnh
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {                                                                             //Filter file type ảnh
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.set('view engine', 'ejs');      //View engine
app.set('views', 'views');

const staffRoutes = require('./routes/router');     //Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

app.use(bodyParser.urlencoded({extended: false}));

app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));                                   //Multer config

app.use(express.static(path.join(__dirname, 'public')));                                                           //Path folder public

app.use('/images', express.static(path.join(__dirname, 'images')));                                                 //Path folder images

app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}));                     //Session config

app.use(csrfProtection);                          //Csurf chống giả mạo web

app.use(flash());                               //flash connection

app.use((req, res, next) => {                                     //Tìm staff đang dùng
    if (!req.session.staff) {
        return next();
    }
    Staff.findById(req.session.staff._id)
    .then(staff => {
      req.staff = staff;
      next();
    }) 
    .catch(err => console.log(err))
});

app.use((req, res, next) => {                                                         //Thêm dữ liệu local
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.isAdmin = req.session.isAdmin;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use(staffRoutes);               //Routes
app.use(adminRoutes);
app.use(authRoutes);

app.use(errorController.get404);    //Xử lý các link không tồn tại

mongoose                            //Connect DB và host/port
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || 8000, '0.0.0.0', () => {
            console.log("Server is running.");
        });
        // app.listen(3000)
    })
    .catch(err => console.log(err));