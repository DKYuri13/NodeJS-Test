const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    workplace: {
        type: String,
    },
    date: {
        type: String,
    },
    overTime: {
        type: Number
    },
    startTime: {
        type: Date,
    },
    stopTime: {
        type: Date,
    },
    timeWorked: {
        type: Number,
    },
    staffId: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    timeWorkedToday: {
        type: Number,
    }
});

sessionSchema.methods.addToLeave = function(annualLeave) {      //Push id ngày nghỉ vào session
    this.annualLeave.push(annualLeave._id);
    return this.save();
}

module.exports = mongoose.model('Session', sessionSchema);