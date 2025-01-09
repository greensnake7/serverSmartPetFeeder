const User = require('../models/user.js');
const DeviceControl = require('../models/deviceControl')
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Tên người dùng đã tồn tại' });
        }

        // Create new user
        const user = new User({ username, password });
        await user.save();

        res.status(201).json({ userId: user.userId, message: 'Đăng kí người dùng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.userId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        if (user.deviceIds.length > 0) {
            const deviceControl = await DeviceControl.findOne({ deviceID: user.deviceIds[0] });
            return res.json({ token, deviceControl });
        } else {
            return res.json({ token });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};