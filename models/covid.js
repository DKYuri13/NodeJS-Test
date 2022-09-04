const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const covidSchema = new Schema({
    dailyInfo: {
        items: [
            {
                temperature: {
                    type: Number
                },
                date: {
                    type: Date
                }
            }
        ],
    },        
    vaccineType1: {     //Vaccine lần 1
        type: String,
    },
    vaccineDate1: {
        type: Date,
    },
    vaccineType2: {     //Vaccine lần 2
        type: String,
    },
    vaccineDate2: {
        type: Date,
    },
    covidStatus: {      //Tình trạng covid
        type: String,
    },
    staffId: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    }
});

module.exports = mongoose.model('Covid', covidSchema);