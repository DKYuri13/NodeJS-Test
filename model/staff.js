const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const staffSchema = new Schema({
    name: {
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
            ref: 'Session',
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
});

staffSchema.methods.addToSession = function(status, session) {         //Thay đổi status và push id session vào staff
    this.status = status;
    this.sessions.push(session._id); 
    return this.save();
}

staffSchema.methods.addTime = function(totalOverTime, totalTimeShort, status) {     //Thay đổi status và tính giờ làm thêm, giờ làm thiếu cả tháng
    this.status = status;
    if (this.timeShort) {
        this.timeShort = (this.timeShort + totalTimeShort.toFixed(1));
    } else {
        this.timeShort = totalTimeShort.toFixed(1);
    }
    if (this.overTime) {
        this.overTime = (this.overTime + totalOverTime).toFixed(1);
    } else {
        this.overTime = totalOverTime.toFixed(1);
    }
    return this.save();
}

staffSchema.methods.addToLeave = function(annualLeave) {     //Giảm số ngày nghỉ còn lại và push id ngày nghỉ vào staff
    this.annualLeave.push(annualLeave._id);
    if(this.annualLeaveLeft == this.annualLeaveMax) {
        this.annualLeaveLeft = (this.annualLeaveMax - (annualLeave.annualLeaveHour/8)).toFixed(1);
    } else {
        this.annualLeaveLeft = (this.annualLeaveLeft - (annualLeave.annualLeaveHour/8)).toFixed(1);
    };
    return this.save();
}

module.exports = mongoose.model('Staff', staffSchema);