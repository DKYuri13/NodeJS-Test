const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const staffSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    doB: {
        type: Date
    },
    salaryScale: {
        type: Number
    },
    startDate: {
        type: Date
    },
    department: {
        type: String
    },
    timeWorkedToday: {
        type: Number,
    },
    sessions: [
        { 
            type: Schema.Types.ObjectId,
            ref: 'WorkSession',
            required: true
        }
    ],
    annualLeaveMax: {
        type: Number
    },
    annualLeaveLeft: {
        type: Number
    },
    annualLeave: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'AnnualLeave', 
            required: true
        }
    ],
    covid: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Covid', 
            required: true
        }
    ],
    imageUrl: {
        type: String
    },
    overTime: {
        type: Number
    },
    timeShort: {
        type: Number
    },
    isAdmin: {
        type: Boolean,
        required: true
    },
    staffs: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Staff',
        }
    ]
});

staffSchema.methods.addToSession = function(status, session) {         //Thay đổi status và push id session vào staff
    this.status = status;
    this.sessions.push(session._id); 
    return this.save();
}

staffSchema.methods.addTime = function(totalOverTime, totalTimeShort, status) {     //Thay đổi status và tính giờ làm thêm, giờ làm thiếu cả tháng
    this.status = status;
    if (this.timeShort) {
        this.timeShort = this.timeShort + totalTimeShort;
    } else {
        this.timeShort = totalTimeShort;
    }
    if (this.overTime) {
        this.overTime = (this.overTime + totalOverTime);
    } else {
        this.overTime = totalOverTime;
    }
    return this.save();
}

staffSchema.methods.addToLeave = function(annualLeave) {     //Giảm số ngày nghỉ còn lại và push id ngày nghỉ vào staff
    this.annualLeave.push(annualLeave._id);
    this.annualLeaveLeft = (this.annualLeaveLeft - (annualLeave.annualLeaveHour/8)).toFixed(1);
    return this.save();
}

module.exports = mongoose.model('Staff', staffSchema);