const Staff = require('../models/staff');
const WorkSession = require('../models/work-session');
const AnnualLeave = require('../models/annualLeave');
const Covid = require('../models/covid');
const session = require('express-session');

let ITEMS_PER_PAGE = 10

exports.getRollCall = (req, res, next) => {                                                                 //HIỂN THỊ MÀN HÌNH ĐIỂM DANH
        Staff.findOne({username: req.staff.username}).populate(['sessions']).populate(['annualLeave'])    //Trả về staff và session, annualLeave tương ứng với staff
            .then(staff => {
                res.render('app/roll-call', {
                    staff: staff,
                    workSessions: staff.sessions,
                    pageTitle: 'Điểm Danh',
                    path: '/',
                });
            })
            .catch(err => {
                console.log(err);
            });
};

exports.postRollCall = (req, res, next) => {       //POST CHECKIN

    const workplace = req.body.workplace;
    const current = new Date();
    const month = current.getMonth() + 1;
    const day = current.getDate();
    const startTime = current;
    const status = req.body.status;
    const length = req.staff.sessions.length - 1;                 // Index của work session mới nhất

    WorkSession.findById(req.staff.sessions[length])
        .then(session => {
            if (session !== null) {                               // Check xem có work session chưa
                if (session.day == day) {                         // Check xem work session đã sang ngày mới chưa
                    session.items.push({                          // Push vào work session gần đây nhất
                        startTime: startTime,
                        workplace: workplace,
                    })
                    req.staff.changeStatus(status);
                    session.save()
                        .then(result => {
                            res.redirect('/')
                        })
                        .catch(err => console.log(err));
                } else {
                    const session = new WorkSession({             // Tạo mới khi đã sang ngày mới
                        day: day,
                        month: month,
                        items: [
                            {
                                startTime: startTime,
                                workplace: workplace,
                            }
                        ],
                        totalHrs: 0,
                        overTime: 0,
                        staffId: req.staff,
                        isApproved: false,
                    })
                    req.staff.addToSession(status, session);
                    session.save()
                        .then(result => {
                            res.redirect('/')
                        })
                        .catch(err => console.log(err));
                }
            } else {
                const session = new WorkSession({                  // Tạo mới khi chưa có work session
                    day: day,
                    month: month,
                    items: [
                        {
                            startTime: startTime,
                            workplace: workplace,
                        }
                    ],
                    totalHrs: 0,
                    overTime: 0,
                    staffId: req.staff,
                    isApproved: false,
                })
                req.staff.addToSession(status, session);
                session.save()
                    .then(result => {
                        res.redirect('/')
                    })
                    .catch(err => console.log(err));
            }
        })
        .catch(err => console.log(err))   
};

exports.postStopWork = (req, res, next) => {        //POST CHECK OUT

    const current = new Date;
    const stopTime = current;

    const status = req.body.status;

    req.staff.changeStatus(status);

    const length = req.staff.sessions.length - 1;          //Index của session cuối cùng được tạo mới
    const sessionId = req.staff.sessions[length];          //Lấy ID

    WorkSession.findById(sessionId).then(session => {
        const itemsLength = session.items.length - 1;
        const hours = (stopTime.getTime() - session.items[itemsLength].startTime.getTime())/3600000;
        session.items[itemsLength].stopTime = stopTime;
        session.items[itemsLength].hours = hours;
        session.totalHrs += hours;

        if (session.totalHrs >= 8) {
            session.overTime = session.totalHrs - 8;
        }

        session.save()
            .then(result => {
                res.redirect('/');
            })
            .catch(err => console.log(err));
    });
}

exports.postAnnualLeave = (req, res, next) => {                                         //POST XIN NGHỈ
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

exports.getInformation = (req, res, next) => {                                      //HIỂN THỊ THÔNG TIN CÁ NHÂN
    Staff.findOne({username: req.staff.username}).populate(['annualLeave'])
        .then(staff => {
            res.render('app/information', {
                staff: staff,
                pageTitle: 'My Information',
                path: '/information',
            }); 
        })
        .catch(err => console.log(err));
};

exports.getWorkHistory = (req, res, next) => {                          //HIỂN THỊ LỊCH SỬ LÀM VIỆC
    const page = +req.query.page || 1;
    const dayNow = new Date();
    const month = dayNow.getMonth() + 1;                                //Lấy mặc định tháng hiện tại

    let totalItems;                                                     //Tổng số phiên làm việc

    WorkSession.find({
        _id: {
          $in: req.staff.sessions                                       //Tìm các phiên làm việc của nhân viên
        }
      }).countDocuments().then(numSessions => {                                        //Đếm tổng số phiên làm việc và populate phiên làm việc hiển thị từng trang
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
            Staff.findOne({_id: staff.managerId})                                       //Tìm quản lý
                .then(result => {

                    if(result !== null) {                                               //NẾU CÓ QUẢN LÝ
                        const managerName = result.toJSON().name;
                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;

                        staff.sessions.forEach(session => {                             //Tính các dữ kiện thời gian làm việc cả tháng
                            if(session.month == month) {
                                if (session.totalHrs < 8) {
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })

                        res.render('app/work-history', {                                //Render
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            isAuthenticated: req.session.isLoggedIn,
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                            managerName: managerName,
                            currentPage: page,
                            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                            hasPreviousPage: page > 1,
                            nextPage: page + 1,
                            previousPage: page - 1,
                            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                            line: ITEMS_PER_PAGE,
                        });

                    } else {                                                            //NẾU KHÔNG CÓ QUẢN LÝ

                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;

                        staff.sessions.forEach(session => {                             //Tính các dữ kiện thời gian làm việc cả tháng
                            if(session.month == month) {
                                if (session.totalHrs < 8) {
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })

                        res.render('app/work-history', {                                  //Render
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            isAuthenticated: req.session.isLoggedIn,
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                            currentPage: page,
                            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                            hasPreviousPage: page > 1,
                            nextPage: page + 1,
                            previousPage: page - 1,
                            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                            line: ITEMS_PER_PAGE,
                        });
                    }
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
};

exports.postMonthWorkHistory = (req, res, next) => {                                    //RENDER MÀN HÌNH THÔNG TIN GIỜ LÀM KHI CHỌN THÁNG LƯƠNG HIỂN THỊ
    const page = +req.query.page || 1;
    const month = req.body.month;

    let totalItems;                                                                     //Tổng số phiên làm việc

    WorkSession.find({
        _id: {
          $in: req.staff.sessions                                                       //Tìm các phiên làm việc của nhân viên
        }
      }).countDocuments().then(numSessions => {                                         //Tính tổng số phiên làm việc và populate số phiên làm việc từng trang
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
            Staff.findOne({_id: staff.managerId})                                       //Tìm quản lý
                .then(result => {

                    if(result !== null) {                                               //NẾU CÓ QUẢN LÝ
                        const managerName = result.toJSON().name;
                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;

                        staff.sessions.forEach(session => {                                 //Tính các dữ kiện thời gian làm việc cả tháng
                            if(session.month == month) {
                                if (session.totalHrs < 8) {
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })

                        res.render('app/work-history', {                                    //Render
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            isAuthenticated: req.session.isLoggedIn,
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                            managerName: managerName,
                            currentPage: page,
                            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                            hasPreviousPage: page > 1,
                            nextPage: page + 1,
                            previousPage: page - 1,
                            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                            line: ITEMS_PER_PAGE,
                        });

                    } else {                                                                    //NẾU KHÔNG CÓ QUẢN LÝ
                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;

                        staff.sessions.forEach(session => {                                     //Tính dữ kiện thời gian làm việc cả tháng
                            if(session.month == month) {
                                if (session.totalHrs < 8) {
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })

                        res.render('app/work-history', {                                        //Render
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            isAuthenticated: req.session.isLoggedIn,
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                            currentPage: page,
                            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                            hasPreviousPage: page > 1,
                            nextPage: page + 1,
                            previousPage: page - 1,
                            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                            line: ITEMS_PER_PAGE,
                        });
                    }
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
}

exports.postWorkHistory = (req, res, next) => {                                     //RENDER MÀN HÌNH THÔNG TIN GIỜ LÀM KHI CHỌN SỐ PHIÊN HIỂN THỊ TỪNG TRANG

    ITEMS_PER_PAGE = req.body.line;                                                 //Số phiên làm việc hiển thị từng trang
    const page = +req.query.page || 1;

    const dayNow = new Date();
    const month = dayNow.getMonth() + 1;

    let totalItems;                                                                 //Tổng số phiên làm việc

    WorkSession.find({                                                              //Tìm các phiên làm việc của nhân viên
        _id: {
          $in: req.staff.sessions
        }
      }).countDocuments().then(numSessions => {                                      //Tính tổng số phiên làm việc và populate phiên làm việc từng trang
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
            Staff.findOne({_id: staff.managerId})                                      //Tìm quản lý
                .then(result => {

                    if(result !== null) {                                               //NẾU KHÔNG CÓ QUẢN LÝ
                        const managerName = result.toJSON().name;
                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;

                        staff.sessions.forEach(session => {                              //Tính các dữ kiện thời gian làm việc cả tháng
                            if(session.month == month) {
                                if (session.totalHrs < 8) {
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })

                        res.render('app/work-history', {                                    //Render
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            isAuthenticated: req.session.isLoggedIn,
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                            managerName: managerName,
                            currentPage: page,
                            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                            hasPreviousPage: page > 1,
                            nextPage: page + 1,
                            previousPage: page - 1,
                            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                            line: ITEMS_PER_PAGE,
                        });

                    } else {                                                                //NẾU KHÔNG CÓ QUẢN LÝ
                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;

                        staff.sessions.forEach(session => {                                     //Tính các dữ kiện thời gian làm việc cả tháng
                            if(session.month == month) {
                                if (session.totalHrs < 8) {
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })

                        res.render('app/work-history', {                                        //Render
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            isAuthenticated: req.session.isLoggedIn,
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                            currentPage: page,
                            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                            hasPreviousPage: page > 1,
                            nextPage: page + 1,
                            previousPage: page - 1,
                            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                            line: ITEMS_PER_PAGE,
                        });
                    }
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
}

exports.getCovidInfo = (req, res, next) => {        //Hiển thị view covid
    Staff.find({                                                               //Tìm staff từ id các staff thuộc quản lý
        _id: {
          $in: req.staff.staffs
        }
      }).then(staffs => {
            let covidArr = [];
            let findArr = [];

            for (let staff of staffs) {                                         //Vòng lặp để push dữ liệu covid của từng staff vào covidArr
                const covidId = staff.covid[0]
                findArr.push(Covid.findById(covidId).then(covid => {
                    const covidInc = covid;
                    covidArr.push(covidInc);
                }))
            }

            Promise.all(findArr).then(result => {                               //Promise để thực hiện toàn bộ vòng lặp và render
                res.render('app/covid-info', {
                    user: req.staff,
                    staffs: staffs,
                    covid: covidArr,
                    pageTitle: 'Covid Information',
                    path:'/covid-info',
                    isAuthenticated: req.session.isLoggedIn,
                });
            })
        })
};

exports.postImage = (req, res, next) => {                                           //POST ẢNH
    const image = req.file;

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

exports.postCovidTemperature = (req, res, next) => {                                //POST THÂN NHIỆT
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

exports.postCovidVaccine = (req, res, next) => {                                        //POST VACCINE
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

exports.postCovidStatus = (req, res, next) => {                                         //POST TÌNH TRẠNG COVID 
    const covidStatus = req.body.covidStatus;
    Covid.findOne({_id: req.staff.covid[0]._id}).then(covid => {
        covid.covidStatus = covidStatus;
        covid.save();
        res.redirect('/covid-info')
    })
}

exports.getAbc = (req, res, next) => {
    res.render('app/abc.ejs')
}