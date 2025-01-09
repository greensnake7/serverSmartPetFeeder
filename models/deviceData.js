const mongoose = require('mongoose');

const deviceDataSchema = new mongoose.Schema({
    deviceID: {
        type: String,
        required: true,
        index: true
    },
    feedingTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    remainingFood: {
        type: Number,  // Lượng thức ăn còn lại (kg)
        required: true
    },
    triggerType: {
        type: String,
        enum: ['MOTION', 'SCHEDULE'], // Cho biết việc cho ăn được kích hoạt bởi chuyển động hay lịch trình
        required: true
    }
}, {
    timestamps: true
});

deviceDataSchema.index({ deviceID: 1, timestamp: -1 });

module.exports = mongoose.model('DeviceData', deviceDataSchema);