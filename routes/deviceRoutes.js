const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Device routes (protected by auth)
router.get('/device/:deviceID/config', 
    deviceController.createOrGetDeviceConfig
);

// Device data route (từ ESP32)
router.post('/device/data', 
    deviceController.recordFeedingData
);


module.exports = router;