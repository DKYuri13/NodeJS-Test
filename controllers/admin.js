const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Staff = require('../models/staff');
const WorkSession = require('../models/work-session');
const AnnualLeave = require('../models/annualLeave');
const Covid = require('../models/covid');
const workSession = require('../models/work-session');
const covid = require('../models/covid');

exports.getMonthCheck = (req, res, next) => {                         //RENDER MÀN HÌNH CHỌN NHÂN VIÊN ĐỂ XÁC NHẬN THÔNG TIN GIỜ LÀM
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

exports.getStaff = (req, res, next) => {                              //RENDER MÀN HÌNH XÁC NHẬN THÔNG TIN GIỜ LÀM CỦA NHÂN VIÊN ĐÃ CHỌN
    const staffId = req.params.staffId;

    const dayNow = new Date();                                        
    const month = dayNow.getMonth() + 1;                              //Lấy tháng hiện tại làm mặc định để hiển thị

    Staff.findById(staffId).populate(['sessions']).populate(['annualLeave'])      //Render
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

exports.postStaff = (req, res, next) => {                                   //RENDER MÀN HÌNH XÁC NHẬN THÔNG TIN GIỜ KHI CHỌN THÁNG HIỂN THỊ
  const staffId = req.params.staffId;
  
  const dayNow = new Date();
  const month = req.body.month                                              //Lấy tháng đã chọn

  Staff.findById(staffId).populate(['sessions']).populate(['annualLeave'])          //Render
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

exports.postDeleteWorkSession = (req, res, next) => {                                   //XÓA PHIÊN LÀM VIỆC KHI NHẤN CHỌN XÓA
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

exports.postConfirm = (req, res, next) => {                                             //XÁC NHẬN CÁC PHIÊN LÀM VIỆC KHI NHẤN CHỌN XÁC NHẬN
  const staffId = req.body.staffId;

  const dayNow = new Date();
  const month = dayNow.getMonth() + 1;                                                  //Lấy tháng hiện tại để render (chỉ được phép xác nhận giờ làm của tháng hiện tại)

  WorkSession.find({staffId: staffId, month: month}).then(workSessions => {             //Tìm các phiên làm việc trong tháng hiện tại của nhân viên đã chọn

    let workSessionSave = []

    for (let workSession of workSessions) {                                             //Vòng lặp update trạng thái xác nhận của các phiên làm việc
      const workSessionIntance = new WorkSession(workSession)
      workSessionIntance.isApproved = true;
      workSessionSave.push(workSessionIntance.save())
    }

    Promise.all(workSessionSave).then(result => {                                         //Promise để thực hiện bước save của vòng lặp và render màn hình sau khi xác nhận
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

exports.getPdf = (req, res, next) => {                                                    //XUẤT FILE PDF
  Staff.find({                                           //Tìm các nhân viên thuộc quản lý bằng id của các nhân viên thuộc quản lý có trong staff
    _id: {
      $in: req.staff.staffs
    }
  })
    .then(staffs => {
      const staffId = req.params.staffId;

      const pdfName = 'covid-' + staffId + '.pdf';
      const covidPath = path.join('data', 'covidPDF', pdfName);                               //Đường dẫn file pdf

      const pdfDoc = new PDFDocument();

      const fontPath = path.join('fonts', 'font-times-new-roman.ttf');                        //Regist font
      pdfDoc.registerFont('Times New Roman', fontPath);

      res.setHeader('Content-Type', 'application/pdf');                                             //Setting content và create stream
      res.setHeader('Content-Disposition', 'inline; filename"' + pdfName + '"');
      pdfDoc.pipe(fs.createWriteStream(covidPath));
      pdfDoc.pipe(res);

      pdfDoc.font('Times New Roman').fontSize(30).text('Thông tin covid của các nhân viên');          //Tiêu đề

      pdfDoc.text('----------------------------');

      let covidArr = [];
      staffs.forEach(staff => {                                                                     //Vòng lặp truy cập từng staff thuộc quản lý

        const covidId = staff.toJSON().covid[0];

        covidArr.push(Covid.find({_id: covidId}).then(covid => {                                    //Push thao tác render nội dung file pdf vào covidArr
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
      Promise.all(covidArr).then(result => {                                                          //Promise để thực hiện các thao tác render nội dung
        pdfDoc.end();
      })
  });
}