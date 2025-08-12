
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = 'mongodb://Ali:123456@localhost:22222/Project?authSource=admin';
const client = new MongoClient(mongoUri, { useUnifiedTopology: true });

async function connectToMongo() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db('Project').collection('users');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
}
app.post('/register', async (req, res) => {
    const { username, faceDescriptor } = req.body;

    // Validate request
    if (!username || !faceDescriptor || !Array.isArray(faceDescriptor)) {
        return res.status(400).json({ error: 'Username and faceDescriptor are required' });
    }

    try {
        const usersCollection = await connectToMongo();

        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = {
            username,
            faceDescriptor: faceDescriptor, // Array of numbers from face-api.js
            createdAt: new Date()
        };

        await usersCollection.insertOne(user);
        res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

const PORT = 2999;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

