const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// محاكاة حالة واتساب
let whatsappReady = false;

app.get('/', (req, res) => {
    res.json({ 
        status: 'running', 
        service: 'WhatsApp OTP Service',
        whatsapp: whatsappReady ? 'ready' : 'initializing'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/qr', (req, res) => {
    // بعد نجاح ال deployment، سنضيف QR code حقيقي هنا
    whatsappReady = true;
    res.json({ 
        status: 'simulated_authentication',
        message: 'WhatsApp is ready for testing',
        whatsapp_ready: true
    });
});

app.post('/send-otp', (req, res) => {
    const { phone, otp, name } = req.body;
    
    console.log(`📨 OTP to ${phone}: ${otp} for ${name}`);
    
    res.json({
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        method: 'whatsapp',
        phone: phone
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp OTP Service running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
});