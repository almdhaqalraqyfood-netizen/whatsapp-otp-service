const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        status: 'running', 
        service: 'WhatsApp OTP Service',
        message: '✅ Service is working correctly'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
    });
});

app.get('/qr', (req, res) => {
    res.json({ 
        status: 'ready_for_whatsapp',
        message: 'Service is ready for WhatsApp integration'
    });
});

app.post('/send-otp', (req, res) => {
    const { phone, otp, name } = req.body;
    console.log(`OTP simulation for ${phone}: ${otp}`);
    res.json({ 
        success: true, 
        message: 'OTP sent (simulation)',
        phone: phone 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
