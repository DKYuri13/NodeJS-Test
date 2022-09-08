const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const workSessionSchema = new Schema({ 
    month: {
        type: Number,
    },
    day: {
        type: Number,
    },
    items: [
        {
            startTime: {
                type: Date,
            },
            stopTime: {
                type: Date,
            },
            workplace: {
                type: String,
            },
            hours: {
                type: Number,
            }
        },
    ],
    overTime: {
        type: Number,
    },
    totalHrs: {
        type: Number,
    },
    staffId: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    isApproved: {
        type: Boolean,
    }
});

module.exports = mongoose.model('WorkSession', workSessionSchema);