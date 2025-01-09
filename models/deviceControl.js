const mongoose = require('mongoose');

const deviceControlSchema = new mongoose.Schema({
    deviceID: {
        type: String,
        required: true,
        unique: true
    },
    autoStatus: {
        type: Number,
        enum: [0, 1], // 0: Schedule mode, 1: Auto mode
        default: 0
    },
    schedule: [{
        time: {  // Format: "HH:mm"
            type: String,
            required: function() { return this.autoStatus === 0; },
            match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
        },
        enabled: {
            type: Boolean,
            default: true
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

deviceControlSchema.pre('save', function (next) {
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model('DeviceControl', deviceControlSchema);
