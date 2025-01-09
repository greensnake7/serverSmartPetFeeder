const DeviceControl = require('../models/deviceControl.js');
const DeviceData = require('../models/deviceData.js');
const User = require('../models/user.js')


// Cập nhật cấu hình thiết bị
exports.updateDeviceConfig = async (req, res) => {
    try {
        const { deviceID } = req.params;
        const { autoStatus, schedule } = req.body;

         // Kiểm tra nếu autoStatus = 0 thì schedule phải có ít nhất 1 lịch
        if (autoStatus === 0 && schedule.length === 0) {
            return res.status(400).json({ error: 'Chưa có lịch' });
        }

        // Validate định dạng thời gian
        if (schedule) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            const validSchedule = schedule.every(s => 
                timeRegex.test(s.time)
            );
            if (!validSchedule) {
                return res.status(400).json({
                    error: 'Định dạng thời gian không hợp lệ. Sử dụng HH:mm'
                });
            }
        }

        const deviceControl = await DeviceControl.findOneAndUpdate(
            { deviceID },
            {
                autoStatus,
                schedule: autoStatus === 1 ? [] : schedule,
            },
            { new: true, upsert: true }
        );

        res.status(200).json(deviceControl);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy lịch sử cho ăn
exports.getFeedingHistory = async (req, res) => {
    try {
        const { deviceID } = req.params;
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const history = await DeviceData.find({
            deviceID,
            feedingTime: { $gte: startDate }
        })
        .sort({ feedingTime: -1 });

        // Thống kê
        const stats = {
            totalFeedings: history.length,
            byTriggerType: {
                MOTION: history.filter(h => h.triggerType === 'MOTION').length,
                SCHEDULE: history.filter(h => h.triggerType === 'SCHEDULE').length
            },
            latestFoodLevel: history[0]?.remainingFood || 0
        };

        res.json({ history, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Lay cau hinh thiet bi
exports.getDeviceConfig = async (req, res) => {
    try {
        const { deviceID } = req.params;
        const userId = req.user.userId;
        
        const deviceControl = await DeviceControl.findOne({ deviceID });
        if (!deviceControl) {
            return res.status(404).json({error: "Chua tim thay thiet bi"});
        }

        const user = await User.findOne({ userId });
        user.deviceIds[0] = deviceID;
        await user.save();

        res.status(200).json(deviceControl);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};