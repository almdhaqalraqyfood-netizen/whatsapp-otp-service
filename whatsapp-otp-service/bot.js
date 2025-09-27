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
        message: 'Service is working - WhatsApp integration will be added next'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/qr', (req, res) => {
    res.json({ 
        status: 'simulation',
        message: 'QR code endpoint - real WhatsApp integration coming soon',
        qr_available: false
    });
});

app.post('/send-otp', (req, res) => {
    const { phone, otp, name } = req.body;
    
    console.log(`📨 Simulated OTP to ${phone}: ${otp} for ${name}`);
    
    res.json({
        success: true,
        message: 'OTP sent successfully (simulation mode)',
        phone: phone,
        method: 'simulation'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp OTP Service running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
});