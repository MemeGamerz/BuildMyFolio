const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

router.post('/checkout', verifyToken, async (req, res) => {
    const { planName } = req.body;
    const userId = req.user.id;

    if (!planName) {
        return res.status(400).json({ error: 'Plan name is required.' });
    }

    try {
        await db.query('UPDATE users SET plan = ? WHERE id = ?',[planName, userId]);
        
        res.status(200).json({ message: 'Payment successful', updatedPlan: planName });
    } catch (error) {
        console.error('Checkout Error:', error);
        res.status(500).json({ error: 'Payment processing failed.' });
    }
});

module.exports = router;