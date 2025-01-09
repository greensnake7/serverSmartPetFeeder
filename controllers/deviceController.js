const DeviceControl = require('../models/deviceControl.js');
const DeviceData = require('../models/deviceData.js');


// Lấy cấu hình thiet bi
exports.createOrGetDeviceConfig = async (req, res) => {
    try {
        const { deviceID } = req.params;
        
        let deviceControl = await DeviceControl.findOne({ deviceID });
        if (!deviceControl) {
            deviceControl = new DeviceControl({
                deviceID,
                autoStatus: 1, // Mặc định Auto mode
                schedule: [],  // Mặc định không có lịch
            });

            await deviceControl.save();
        }

        res.status(200).json(deviceControl);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thiet bi gui du lieu
exports.recordFeedingData = async (req, res) => {
    try {
        const { deviceID, remainingFood, triggerType } = req.body;

        const deviceData = new DeviceData({
            deviceID,
            feedingTime: new Date(),
            remainingFood,
            triggerType
        });
        await deviceData.save();

        res.json({
            success: true,
            message: "Gửi dữ liệu thành công"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

