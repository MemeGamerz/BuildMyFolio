const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

const ALLOWED_PLANS = ['Hobby', 'Pro', 'Enterprise'];

router.post('/checkout', verifyToken, async (req, res) => {
    const { planName } = req.body;
    const userId = req.user.id;

    if (!planName || !ALLOWED_PLANS.includes(planName)) {
        return res.status(400).json({ error: `Invalid plan specified. Allowed plans: ${ALLOWED_PLANS.join(', ')}` });
    }

    try {
        await db.query('UPDATE users SET plan = ? WHERE id = ?',[planName, userId]);
        
        const newSignedToken = jwt.sign(
            { id: req.user.id, email: req.user.email, name: req.user.name, plan: planName },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            message: 'Payment successful', 
            updatedPlan: planName, 
            token: newSignedToken 
        });
    } catch (error) {
        console.error('Checkout Error:', error);
        res.status(500).json({ error: 'Payment processing failed.' });
    }
});

module.exports = router;