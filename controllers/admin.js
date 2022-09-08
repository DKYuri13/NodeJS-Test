const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Staff = require('../models/staff');
const WorkSession = require('../models/work-session');
const AnnualLeave = require('../models/annualLeave');
const Covid = require('../models/covid');
const workSession = require('../models/work-session');
const covid = require('../models/covid');

exports.getMonthCheck = (req, res, next) => {                         //Render màn hình chọn nhân viên thuộc quản lý để xác nhận giờ làm
    Staff.find({
      _id: {
        $in: req.staff.staffs                                         //Tìm các nhân viên thuộc quản lý từ id của nhân viên thuộc quản lý có trong staff
      }
    })
            .then(staffs => {
                res.render('admin/month-check', {
                    staff: req.staff,
                    staffs: staffs,
                    pageTitle: 'Xác nhận giờ làm',
                    path: '/month-check',
                });
            })
            .catch(err => {
                console.log(err);
            });
}

exports.getStaff = (req, res, next) => {                              //Render màn hình xác nhận giờ làm của nhân viên đã được chọn
    const staffId = req.params.staffId;

    const dayNow = new Date();                                        
    const month = dayNow.getMonth() + 1;                              //Lấy tháng hiện tại làm mặc định để hiển thị

    Staff.findById(staffId).populate(['sessions']).populate(['annualLeave'])
      .then(staff => {
        res.render('admin/staff-detail', {
          staff: staff,
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
  const staffId = req.params.staffId;
  
  const dayNow = new Date();
  const month = req.body.month                    

  Staff.findById(staffId).populate(['sessions']).populate(['annualLeave'])
    .then(staff => {
      res.render('admin/staff-detail', {
        staff: staff,
        pageTitle: staff.name,
        path: '/month-check',
        month: month,
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
      const staffId = req.params.staffId;
      const pdfName = 'covid-' + staffId + '.pdf';
      const covidPath = path.join('data', 'covidPDF', pdfName);

      const pdfDoc = new PDFDocument();
      const fontPath = path.join('fonts', 'font-times-new-roman.ttf');

      pdfDoc.registerFont('Times New Roman', fontPath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename"' + pdfName + '"');
      pdfDoc.pipe(fs.createWriteStream(covidPath));
      pdfDoc.pipe(res);

      pdfDoc.font('Times New Roman').fontSize(30).text('Thông tin covid của các nhân viên');

      pdfDoc.text('----------------------------');
      let covidArr = [];
      staffs.forEach(staff => {

        const covidId = staff.toJSON().covid[0];

        covidArr.push(Covid.find({_id: covidId}).then(covid => {
          pdfDoc.fontSize(25).text(staff.name);

          pdfDoc.fontSize(14).text('Tình trạng covid: ' + covid[0].covidStatus);
          pdfDoc.text('Lịch sử tiêm vaccine:');
          pdfDoc.text('Vaccine mũi 1: ' + covid[0].vaccineType1 + ' - Ngày: ' + covid[0].vaccineDate1);
          pdfDoc.text('Vaccine mũi 2: ' + covid[0].vaccineType2 + ' - Ngày: ' + covid[0].vaccineDate2);
          pdfDoc.fontSize(20).text('Lịch sử thân nhiệt:');

          covid[0].dailyInfo.items.forEach(item => {
            pdfDoc.fontSize(14).text('Ngày: ' + item.date);
            pdfDoc.text('Thân nhiệt: ' + item.temperature);
          });
        }))
      });
      Promise.all(covidArr).then(result => {
        pdfDoc.end();
      })
  });
}