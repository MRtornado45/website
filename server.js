const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// JSON files to store messages and users
const MESSAGES_FILE = path.join(__dirname, 'measdfg.json');
const USERS_FILE = path.join(__dirname, 'usfgh.json');

// Maximum number of messages to store
const MAX_MESSAGES = 100;

// Load messages from JSON file
function loadMessages() {
    if (fs.existsSync(MESSAGES_FILE)) {
        return JSON.parse(fs.readFileSync(MESSAGES_FILE));
    }
    return [];
}

// Save messages to JSON file
function saveMessagesToFile(messages) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Load users from JSON file
function loadUsers() {
    if (fs.existsSync(USERS_FILE)) {
        return JSON.parse(fs.readFileSync(USERS_FILE));
    }
    return {};
}

// Save users to JSON file
function saveUsersToFile(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Initialize messages and users from files
let messages = loadMessages();
let users = loadUsers();

// Register endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing username or password'
            });
        }

        if (username in users) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(password, salt);
        
        // Store user
        users[username] = hashed;
        saveUsersToFile(users);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing username or password'
            });
        }

        if (!(username in users)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        // Verify password
        const match = await bcrypt.compare(password, users[username]);
        if (match) {
            res.status(200).json({ success: true });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Save message endpoint
app.post('/saveMessage', (req, res) => {
    try {
        const messageObj = req.body;
        console.log('Received POST to /saveMessage:', messageObj);
        
        // Validate required fields
        if (!messageObj.text || !messageObj.color || !messageObj.timestamp || !messageObj.username) {
            return res.status(400).json({
                success: false,
                error: 'Missing required message fields'
            });
        }

        // Add message to array
        messages.push(messageObj);

        // Keep only last MAX_MESSAGES
        if (messages.length > MAX_MESSAGES) {
            messages = messages.slice(-MAX_MESSAGES);
        }

        // Save to file
        saveMessagesToFile(messages);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get messages endpoint
app.get('/getMessages', (req, res) => {
    try {
        console.log('Received GET to /getMessages');
        // Load latest messages from file
        messages = loadMessages();
        console.log('Returning messages:', messages);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Serve static files from public directory
app.use(express.static('public'));

// Create files if they don't exist
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, '[]');
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '{}');
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
