const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const userActionController = require('../controllers/userActionController')
const authMiddleware = require('../middleware/auth')

router.post('/register', userAuthController.register);
router.post('/login', userAuthController.login);

router.get('/device/:deviceID/config', 
    authMiddleware, 
    userActionController.getDeviceConfig
);

router.put('/device/:deviceID/config', 
    authMiddleware, 
    userActionController.updateDeviceConfig
);

router.get('/device/:deviceID/history', 
    authMiddleware, 
    userActionController.getFeedingHistory
);

module.exports = router;