const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp OTP Service',
        status: 'running',
        message: 'Service is working - WhatsApp integration pending'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'WhatsApp OTP Service',
        timestamp: new Date().toISOString()
    });
});

app.get('/qr', (req, res) => {
    res.json({ 
        status: 'simulation',
        message: 'QR code simulation - real WhatsApp integration will be added after successful deployment'
    });
});

app.post('/send-otp', async (req, res) => {
    const { phone, otp, name } = req.body;
    
    console.log(`📨 Simulated OTP to ${phone}: ${otp}`);
    
    res.json({
        success: true,
        message: 'OTP sent successfully (simulation)',
        phone: phone,
        otp: otp
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});