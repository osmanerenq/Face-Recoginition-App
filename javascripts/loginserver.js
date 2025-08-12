const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(cors());


const mongoURI = 'mongodb://Ali:123456@localhost:22222/Project?authSource=admin';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));


const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    faceDescriptor: { type: [Number], required: true } // 128-dimensional array
});

const User = mongoose.model('User', userSchema);


function computeDistance(desc1, desc2) {
    if (desc1.length !== desc2.length) {
        throw new Error('Descriptors must have the same length');
    }
    return Math.sqrt(desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0));
}

app.post('/login', async (req, res) => {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
        return res.status(400).json({ authenticated: false, message: 'Invalid face descriptor' });
    }

    try {
        const users = await User.find({});

        let matchedUser = null;
        let minDistance = Infinity;

        for (let user of users) {
            const distance = computeDistance(faceDescriptor, user.faceDescriptor);
            if (distance < minDistance) {
                minDistance = distance;
                matchedUser = user;
            }
        }

        const threshold = 0.6; // Common threshold for face-api.js; adjust if needed

        if (minDistance < threshold && matchedUser) {
            return res.json({ authenticated: true, username: matchedUser.username });
        } else {
            return res.json({ authenticated: false });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ authenticated: false, message: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

