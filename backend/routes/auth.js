const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, gender, email, password } = req.body;
    
    if (!name || !gender || !email || !password) {
        return res.status(400).json({ error: 'All fields (Name, Gender, Email, Password) are required' });
    }

    try {
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, gender, email, password_hash, plan) VALUES (?, ?, ?, ?, ?)',[name, gender, email, hashedPassword, 'Hobby']
        );

        const token = jwt.sign(
            { id: result.insertId, email, name, plan: 'Hobby' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ message: 'User registered successfully', token, userId: result.insertId, name, plan: 'Hobby' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, plan: user.plan }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ message: 'Login successful', token, userId: user.id, name: user.name, plan: user.plan });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

module.exports = router;