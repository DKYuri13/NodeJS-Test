const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Staff = require('../models/staff');
const WorkSession = require('../models/work-session');
const AnnualLeave = require('../models/annualLeave');
const Covid = require('../models/covid');
const workSession = require('../models/work-session');
const covid = require('../models/covid');

exports.getMonthCheck = (req, res, next) => {
  const isAdmin = req.staff.isAdmin;
    Staff.find({
      _id: {
        $in: req.staff.staffs
      }
    })
            .then(staffs => {
                res.render('admin/month-check', {
                    staff: req.staff,
                    staffs: staffs,
                    pageTitle: 'Xác nhận giờ làm',
                    path: '/month-check',
                    isAdmin: isAdmin
                });
            })
            .catch(err => {
                console.log(err);
            });
}

exports.getStaff = (req, res, next) => {
    const isAdmin = req.staff.isAdmin;
    const staffId = req.params.staffId;
    const dayNow = new Date();
    let month = dayNow.getMonth() + 1;
    Staff.findById(staffId).populate(['sessions']).populate(['annualLeave'])
      .then(staff => {
        res.render('admin/staff-detail', {
          staff: staff,
          isAdmin: isAdmin,
          pageTitle: staff.name,
          path: '/month-check',
          month: month,
          dayNow: dayNow
        });
      })
      .catch(err => {
        console.log(err)
      });
};

exports.postStaff = (req, res, next) => {
  const isAdmin = req.staff.isAdmin;
  const staffId = req.params.staffId;
  const dayNow = new Date();
  const month = req.body.month
  const monthSelected = month.split("-")[1]
  Staff.findById(staffId).populate(['sessions']).populate(['annualLeave'])
    .then(staff => {
      res.render('admin/staff-detail', {
        staff: staff,
        isAdmin: isAdmin,
        pageTitle: staff.name,
        path: '/month-check',
        month: monthSelected,
        dayNow: dayNow
      });
    })
    .catch(err => {
      console.log(err)
    });  
}

exports.postDeleteWorkSession = (req, res, next) => {
  const staffId = req.staff._id
  const workSessionId = req.body.workSessionId;
  WorkSession.findById(workSessionId)
    .then(workSession => {
      if (!workSession) {
        return next(new Error('Work session not found.'));
      }
      return WorkSession.deleteOne({ _id: workSessionId, staffId: req.staff._id })
    })
    .then(() => {
      const url = '/month-check/' + staffId;
      console.log('DESTROYED WORK SESSION');
      res.redirect(url);
    })
    .catch(err => {
      console.log(err)
    });
}

exports.postConfirm = (req, res, next) => {
  const dayNow = new Date();
  const staffId = req.body.staffId;
  let url = '/month-check/' + staffId;
  const month = dayNow.getMonth() + 1;
  WorkSession.find({staffId: staffId, month: month}).then(workSessions => {
    let workSessionSave = []
    for (let workSession of workSessions) {
      const workSessionIntance = new WorkSession(workSession)
      workSessionIntance.isApproved = true;
      workSessionSave.push(workSessionIntance.save())
    }
    Promise.all(workSessionSave).then(result => {
      Staff.findById(staffId).populate(['sessions']).populate(['annualLeave'])
      .then(staff => {
        res.render('admin/staff-detail', {
          staff: staff,
          isAdmin: req.staff.isAdmin,
          pageTitle: staff.name,
          path: '/month-check',
          month: month,
          dayNow: dayNow
        });
      })
      .catch(err => {
        console.log(err)
      });
    })
  })
}

exports.getPdf = (req, res, next) => {
  Staff.find({
    _id: {
      $in: req.staff.staffs
    }
  })
    .then(staffs => {
      const staffId = req.params.userId;
      console.log(staffId)
      const pdfName = 'covid-' + staffId + '.pdf';
      const covidPath = path.join('data', 'covidPDF', pdfName);

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename"' + pdfName + '"');
      pdfDoc.pipe(fs.createWriteStream(covidPath));
      pdfDoc.pipe(res);

      pdfDoc.setEncoding('UTF-8').fontSize(26).text('Thông tin covid của các nhân viên');

      pdfDoc.text('----------------------------');

      staffs.forEach(staff => {

        pdfDoc.fontSize(20).text(staff.name);
        const covidId = staff.covid[0]
        Covid.find({_id: covidId}).then(covid => {
          console.log(covid[0].dailyInfo)
          pdfDoc.text('Tình trạng covid: ' + covid[0].covidStatus);
          pdfDoc.text('Lịch sử tiêm vaccine:');
          pdfDoc.text('Vaccine mũi 1: ' + covid[0].vaccineType1 + ' - Ngày: ' + covid[0].vaccineDate1);
          pdfDoc.text('Vaccine mũi 2: ' + covid[0].vaccineType2 + ' - Ngày: ' + covid[0].vaccineDate2);
          pdfDoc.fontSize(20).text('Lịch sử thân nhiệt:');

          covid[0].dailyInfo.items.forEach(item => {
            pdfDoc.text('Ngày: ' + item.date);
            pdfDoc.text('Thân nhiệt: ' + item.temperature);
          });
          pdfDoc.end();
        })
      })
      
  });
}