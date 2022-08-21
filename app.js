const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');     //Controller, model,....
const Staff = require('./model/staff');
const Covid = require('./model/covid');

const app = express();

app.set('view engine', 'ejs');      //View engine
app.set('views', 'views');

const staffRoutes = require('./routes/router');     //Routes

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {                       //Tìm staff (mặc định)
    Staff.findById('6301d5f6162a690a999804e9')
        .then(staff => {
            req.staff = staff;
            next();
        })
        .catch(err => console.log(err));
});

app.use(staffRoutes);

app.use(errorController.get404);

mongoose
    .connect('mongodb+srv://Quang:Quang013@cluster1.oehkwdn.mongodb.net/rollcall?retryWrites=true&w=majority')
    .then(result => {
        Staff.findOne().then(staff => {             //Tạo staff (mặc định)
            if (!staff) {
                const staff = new Staff({
                    name: 'Võ Khánh Băng',
                    doB: new Date('2000-08-04'),
                    startDate: new Date('2018-08-04'),
                    salaryScale: 1.3,
                    department: 'PR',
                    status: 'Resting',
                    imageUrl: 'https://180dc.org/wp-content/uploads/2022/04/Blank-Avatar.png',
                    annualLeaveMax: 12,
                    annualLeaveLeft: 12,
                    timesheets: {
                        timesheet: {}
                    }
                });
                staff.save();
            }
        });

        app.listen(3000);
    })
    .catch(err => console.log(err));
