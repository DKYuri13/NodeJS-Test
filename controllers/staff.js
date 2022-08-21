const Staff = require('../model/staff');
const Session = require('../model/session');
const AnnualLeave = require('../model/annualLeave');
const Covid = require('../model/covid');

let startHour;                      // Thời điểm bắt đầu làm của session ở global
let timeWorkedToday = 0;            // Thời gian đã làm cả ngày
let totalOverTime = 0;              // Tổng thời gian làm thêm cả tháng
let timeShort = 0;                  // Thời gian làm thiếu của ngày hôm đó
let totalTimeShort = 0;             // Tổng thời gian làm thiếu cả tháng
let lastSessionDate;                // Ngày của session trước
let lastSessionMonth;               // Tháng của session trước

exports.getRollCall = (req, res, next) => {
        Staff.findOne().populate(['sessions']).populate(['annualLeave'])    //Trả về staff và session, annualLeave tương ứng với staff
            .then(staff => {
                res.render('app/roll-call', {
                    staff: staff,
                    pageTitle: 'Điểm Danh',
                    timeWorkedToday: timeWorkedToday.toFixed(2),
                    path: '/'
                });
            })
            .catch(err => {
                console.log(err);
            });
};

exports.postRollCall = (req, res, next) => {       //Post checkin

    const workplace = req.body.workplace;
    const current = new Date;
    let date = '';
    date = date.concat('ngày ', current.getDate().toString(), ' tháng ', current.getMonth().toString(), ' năm ', current.getFullYear().toString());
    const startTime = current;      //Thời gian bắt đầu làm của session ở block
    startHour = startTime;          // Thời điểm bắt đầu làm của session ở global
    const status = req.body.status;

    const session = new Session({
        workplace: workplace,
        date: date,
        startTime: startTime,
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
        timeWorkedToday = timeWorkedToday + timeWorked;
    };

    if(timeWorkedToday > 8) {
        timeShort = 0
        overTime = timeWorkedToday - 8;
    }
    totalOverTime = totalOverTime + overTime;
    totalTimeShort = totalOverTime = timeShort;

    lastSessionDate = startHour.getDate();
    lastSessionMonth = startHour.getMonth();

    const status = req.body.status;

    req.staff.addTime(totalOverTime, totalTimeShort, status);

    const length = req.staff.sessions.length-1          //Lấy id của session cuối cùng được tạo mới
    const sessionId = req.staff.sessions[length]._id;

    Session.findByIdAndUpdate(
        sessionId,
        {$set: {
            stopTime: stopTime,
            timeWorked: timeWorked,
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
    Staff.findOne().populate(['annualLeave'])
        .then(staff => {
            res.render('app/information', {
                staff: staff,
                pageTitle: 'My Information',
                path: '/information' 
            }); 
        })
        .catch(err => console.log(err));
};

exports.getWorkHistory = (req, res, next) => {                          //Hiển thị lịch sử làm việc
    Staff.findOne().populate(['sessions']).populate(['annualLeave'])
        .then(staff => {
            res.render('app/work-history', {
                staff: staff,
                pageTitle: 'Work History',
                path:'/work-history' 
            });
        })
        .catch(err => console.log(err))
};

exports.getCovidInfo = (req, res, next) => {        //Hiển thị view covid
            res.render('app/covid-info', {
                pageTitle: 'Covid Information',
                path:'/covid-info'
            });
};

exports.postImageUrl = (req, res, next) => {
    const imageUrl = req.body.imageUrl;
    Staff.findOne().then(staff => {
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
    Covid.findOne().then(covid => {
        if (covid == null) {
            const covid = new Covid({
                dailyInfo: {
                    items: [
                        {
                            temperature: temperature,
                            date: date
                        }
                    ]
                },
                staffId: req.staff
            });
            covid.save()
                .then(result => {
                    res.redirect('/covid-info')
                })
                .catch(err => console.log(err))
        } else {
            Covid.findOne().then(covid => {
                covid.dailyInfo.items.push({
                    temperature: temperature,
                    date: date
                });
                covid.save();
                res.redirect('/covid-info')
            })
        }
    })
}

exports.postCovidVaccine = (req, res, next) => {    //Post Vaccine
    const vaccineType1 = req.body.vaccineType1;
    const vaccineDate1 = req.body.vaccineDate1;
    const vaccineType2 = req.body.vaccineType2;
    const vaccineDate2 = req.body.vaccineDate2;
    Covid.findOne().then(covid => {
        if (covid == null) {
            const covid = new Covid({
                vaccineDate1: vaccineDate1,
                vaccineType1: vaccineType1,
                vaccineDate2: vaccineDate2,
                vaccineType2: vaccineType2,
                staffId: req.staff
            });
            covid.save()
                .then(result => {
                    res.redirect('/covid-info')
                })
                .catch(err => console.log(err))
        } else {
            Covid.findOne().then(covid => {
                covid.vaccineDate1 = vaccineDate1;
                covid.vaccineType1 = vaccineType1;
                covid.vaccineDate2 = vaccineDate2;
                covid.vaccineType2 = vaccineType2;
                covid.save();
                res.redirect('/covid-info')
            })
        }
    })
}

exports.postCovidStatus = (req, res, next) => {    //Post Vaccine
    const covidStatus = req.body.covidStatus;
    Covid.findOne().then(covid => {
        if (covid == null) {
            const covid = new Covid({
                covidStatus: covidStatus,
                staffId: req.staff
            });
            covid.save()
                .then(result => {
                    res.redirect('/covid-info')
                })
                .catch(err => console.log(err))
        } else {
            Covid.findOne().then(covid => {
                covid.covidStatus = covidStatus;
                covid.save();
                res.redirect('/covid-info')
            })
        }
    })
}