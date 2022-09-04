const Staff = require('../models/staff');
const WorkSession = require('../models/work-session');
const AnnualLeave = require('../models/annualLeave');
const Covid = require('../models/covid');

let startHour;                      // Thời điểm bắt đầu làm của session ở global
let timeWorkedToday = 0;            // Thời gian đã làm cả ngày
let totalOverTime = 0;              // Tổng thời gian làm thêm cả tháng
let timeShort = 0;                  // Thời gian làm thiếu của ngày hôm đó
let totalTimeShort = 0;             // Tổng thời gian làm thiếu cả tháng
let lastSessionDate;                // Ngày của session trước
let lastSessionMonth;               // Tháng của session trước

let ITEMS_PER_PAGE = 20

exports.getRollCall = (req, res, next) => {
        const isAdmin = req.staff.isAdmin;
        Staff.findOne({username: req.staff.username}).populate(['sessions']).populate(['annualLeave'])    //Trả về staff và session, annualLeave tương ứng với staff
            .then(staff => {
                res.render('app/roll-call', {
                    staff: staff,
                    pageTitle: 'Điểm Danh',
                    timeWorkedToday: timeWorkedToday.toFixed(2),
                    path: '/',
                    isAdmin: isAdmin,
                });
            })
            .catch(err => {
                console.log(err);
            });
};

exports.postRollCall = (req, res, next) => {       //Post checkin

    const workplace = req.body.workplace;
    const current = new Date();
    const month = current.getMonth() + 1;
    let date = '';
    date = date.concat('ngày ', current.getDate().toString(), ' tháng ', (current.getMonth() + 1).toString(), ' năm ', current.getFullYear().toString());
    const startTime = current;      //Thời gian bắt đầu làm của session ở block
    startHour = startTime;          // Thời điểm bắt đầu làm của session ở global
    const status = req.body.status;

    const session = new WorkSession({
        workplace: workplace,
        date: date,
        month: month,
        startTime: startTime,
        timeWorkedToday: timeWorkedToday,
        staffId: req.staff
    })
    req.staff.addToSession(status, session);
    
    session
        .save()
        .then(result => {
            res.redirect('/')
        })
        .catch(err => console.log(err))
};

exports.postStopWork = (req, res, next) => {        //Post checkout

    const current = new Date;
    const stopTime = current;
    let overTime = 0;

    const timeWorked = (stopTime.getTime() - startHour.getTime())/3600000; // Thời gian đã làm của session. Chia cho 3600000 để đổi từ MILI GIÂY thành GIỜ

    const today = current.getDate();
    const month = current.getMonth();

    if(month !== lastSessionMonth) {
        totalOverTime = 0;
        totalTimeShort = 0;
    };

    if(today !== lastSessionDate) {
        timeWorkedToday = timeWorked;
        timeShort = 8 - timeWorked;
        overTime = 0;
    } else {
        timeShort = timeShort - timeWorked;
    };

    if(timeWorkedToday > 8) {
        timeShort = 0;
        overTime = timeWorkedToday - 8;
    }
    
    totalOverTime = totalOverTime + overTime;
    totalTimeShort = totalTimeShort + timeShort;

    lastSessionDate = startHour.getDate();
    lastSessionMonth = startHour.getMonth();

    const status = req.body.status;

    req.staff.addTime(totalOverTime, totalTimeShort, status);

    const length = req.staff.sessions.length-1          //Lấy id của session cuối cùng được tạo mới
    const sessionId = req.staff.sessions[length]._id;

    WorkSession.findByIdAndUpdate(
        sessionId,
        {$set: {
            stopTime: stopTime,
            timeWorked: timeWorked,
            timeShort: timeShort,
            timeWorkedToday: timeWorkedToday,
            overTime: overTime,
        }},
        {new: true, upsert: true},
        function (err) {
            if(err) throw err;
        });
    res.redirect('/');
}

exports.postAnnualLeave = (req, res, next) => {     //Post xin nghỉ
    const annualLeaveDate = req.body.annualLeaveDate;
    const annualLeaveHour = req.body.annualLeaveHour;
    const reason = req.body.reason;

    const annualLeave = new AnnualLeave({
        annualLeaveDate: annualLeaveDate,
        annualLeaveHour: annualLeaveHour,
        reason: reason,
        staffId: req.staff,
    })

    req.staff.addToLeave(annualLeave);

    annualLeave
        .save()
        .then(result => {
            res.redirect('/');
        })
        .catch(err => console.log(err))
}

exports.getInformation = (req, res, next) => {      //Hiển thị thông tin cá nhân
    const isAdmin = req.staff.isAdmin;
    Staff.findOne({username: req.staff.username}).populate(['annualLeave'])
        .then(staff => {
            res.render('app/information', {
                staff: staff,
                pageTitle: 'My Information',
                path: '/information',
                isAuthenticated: req.session.isLoggedIn,
                isAdmin: isAdmin, 
            }); 
        })
        .catch(err => console.log(err));
};

exports.getWorkHistory = (req, res, next) => {                          //Hiển thị lịch sử làm việc
    const page = +req.query.page || 1;
    const isAdmin = req.staff.isAdmin;
    let totalItems;
    WorkSession.find({
        _id: {
          $in: req.staff.sessions
        }
      }).countDocuments().then(numSessions => {
        totalItems = numSessions;
        return Staff.findOne({username: req.session.staff.username})
                    .populate({path: 'sessions', 
                        options: {
                            skip: (page - 1)*ITEMS_PER_PAGE, 
                            limit: ITEMS_PER_PAGE
                        }})
                    .populate(['annualLeave'])
      })
        .then(staff => {
            res.render('app/work-history', {
                staff: staff,
                sessions: staff.sessions,
                pageTitle: 'Work History',
                path:'/work-history',
                isAuthenticated: req.session.isLoggedIn,
                isAdmin: isAdmin,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                line: ITEMS_PER_PAGE,
            });
        })
        .catch(err => console.log(err))
};

exports.postWorkHistory = (req, res, next) => {
    ITEMS_PER_PAGE = req.body.line;
    const page = +req.query.page || 1;
    const isAdmin = req.staff.isAdmin;
    let totalItems;
    WorkSession.find({
        _id: {
          $in: req.staff.sessions
        }
      }).countDocuments().then(numSessions => {
        totalItems = numSessions;
        return Staff.findOne({username: req.session.staff.username})
                    .populate({path: 'sessions', 
                        options: {
                            skip: (page - 1)*ITEMS_PER_PAGE, 
                            limit: ITEMS_PER_PAGE
                        }})
                    .populate(['annualLeave'])
      })
        .then(staff => {
            res.render('app/work-history', {
                staff: staff,
                sessions: staff.sessions,
                pageTitle: 'Work History',
                path:'/work-history',
                isAuthenticated: req.session.isLoggedIn,
                isAdmin: isAdmin,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                line: ITEMS_PER_PAGE,
            });
        })
        .catch(err => console.log(err))
}

exports.getCovidInfo = (req, res, next) => {        //Hiển thị view covid
    const isAdmin = req.staff.isAdmin;
    Staff.find({
        _id: {
          $in: req.staff.staffs
        }
      }).then(staffs => {
            let covidArr = [];
            let findArr = [];
            for (let staff of staffs) {
                const covidId = staff.covid[0]
                findArr.push(Covid.findById(covidId).then(covid => {
                    const covidInc = covid;
                    covidArr.push(covidInc);
                }))
            }
            Promise.all(findArr).then(result => {
                res.render('app/covid-info', {
                    user: req.staff,
                    isAmin: req.staff.isAdmin,
                    staffs: staffs,
                    covid: covidArr,
                    pageTitle: 'Covid Information',
                    path:'/covid-info',
                    isAuthenticated: req.session.isLoggedIn,
                    isAdmin: isAdmin
                });
            })
        })
};

exports.postImage = (req, res, next) => {
    const image = req.file;
    console.log(req.file);

    const imageUrl = image.path;

    Staff.findOne({username: req.session.staff.username}).then(staff => {
        staff.imageUrl = imageUrl;
        return staff.save()
            .then(result => {
                res.redirect('/information')
            })
            .catch(err => console.log(err));
    })
}

exports.postCovidTemperature = (req, res, next) => {    //Post thân nhiệt
    const temperature = req.body.temperature;
    const date = req.body.date;
    Covid.findOne({_id: req.staff.covid[0]._id}).then(covid => {
        covid.dailyInfo.items.push({
            temperature: temperature,
            date: date
        });
        covid.save();
        res.redirect('/covid-info')
    })
}

exports.postCovidVaccine = (req, res, next) => {    //Post Vaccine
    const vaccineType1 = req.body.vaccineType1;
    const vaccineDate1 = req.body.vaccineDate1;
    const vaccineType2 = req.body.vaccineType2;
    const vaccineDate2 = req.body.vaccineDate2;
    Covid.findOne({_id: req.staff.covid[0]._id}).then(covid => {
        covid.vaccineDate1 = vaccineDate1;
        covid.vaccineType1 = vaccineType1;
        covid.vaccineDate2 = vaccineDate2;
        covid.vaccineType2 = vaccineType2;
        covid.save();
        res.redirect('/covid-info')
    })
}

exports.postCovidStatus = (req, res, next) => {    //Post Vaccine
    const covidStatus = req.body.covidStatus;
    Covid.findOne({_id: req.staff.covid[0]._id}).then(covid => {
        covid.covidStatus = covidStatus;
        covid.save();
        res.redirect('/covid-info')
    })
}