const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// تخزين حالة واتساب
let whatsappClient = null;
let isAuthenticated = false;
let qrCode = null;
let clientReady = false;

// تهيئة واتساب
function initializeWhatsApp() {
    console.log('🚀 Initializing WhatsApp...');
    
    whatsappClient = new Client({
        authStrategy: new LocalAuth({
            clientId: "whatsapp-otp-client"
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        }
    });

    whatsappClient.on('qr', (qr) => {
        console.log('📱 QR Code received! Scan with WhatsApp');
        qrcodeTerminal.generate(qr, { small: true }); // يطبع في اللوج
        qrCode = qr;
        isAuthenticated = false;
        clientReady = false;
    });

    whatsappClient.on('ready', () => {
        console.log('✅ WhatsApp Client is ready!');
        isAuthenticated = true;
        clientReady = true;
        qrCode = null;
    });

    whatsappClient.on('authenticated', () => {
        console.log('✅ WhatsApp authenticated successfully!');
        isAuthenticated = true;
    });

    whatsappClient.on('auth_failure', (msg) => {
        console.log('❌ WhatsApp authentication failed:', msg);
        isAuthenticated = false;
        clientReady = false;
    });

    whatsappClient.on('disconnected', (reason) => {
        console.log('❌ WhatsApp disconnected:', reason);
        isAuthenticated = false;
        clientReady = false;
        // إعادة المحاولة بعد 10 ثواني
        setTimeout(() => {
            console.log('🔄 Reconnecting WhatsApp...');
            initializeWhatsApp();
        }, 10000);
    });

    whatsappClient.initialize();
}

// دالة إرسال رسالة واتساب
async function sendWhatsAppMessage(phoneNumber, message) {
    if (!clientReady || !whatsappClient) {
        throw new Error('WhatsApp client is not ready');
    }

    try {
        // تنظيف رقم الهاتف
        const cleanedPhone = phoneNumber.replace(/\D/g, '');
        
        // تنسيق الرقم الدولي (افتراضي السعودية 966)
        let formattedPhone;
        if (cleanedPhone.startsWith('966')) {
            formattedPhone = cleanedPhone;
        } else if (cleanedPhone.startsWith('0')) {
            formattedPhone = '966' + cleanedPhone.substring(1);
        } else if (cleanedPhone.startsWith('+966')) {
            formattedPhone = cleanedPhone.substring(1);
        } else {
            formattedPhone = '966' + cleanedPhone;
        }
        
        const chatId = `${formattedPhone}@c.us`;
        
        // التحقق من وجود الرقم في واتساب
        const isRegistered = await whatsappClient.isRegisteredUser(chatId);
        if (!isRegistered) {
            throw new Error('Phone number is not registered on WhatsApp');
        }
        
        // إرسال الرسالة
        await whatsappClient.sendMessage(chatId, message);
        return true;
        
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp OTP Service',
        status: clientReady ? 'ready' : 'initializing',
        whatsapp_authenticated: isAuthenticated,
        qr_required: !isAuthenticated && qrCode !== null
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        whatsapp_ready: clientReady,
        whatsapp_authenticated: isAuthenticated
    });
});

// ✅ API يرجع QR كصورة PNG
app.get('/qr', async (req, res) => {
    if (isAuthenticated && clientReady) {
        return res.json({ 
            status: 'authenticated',
            message: 'WhatsApp is already authenticated and ready' 
        });
    }
    
    if (qrCode) {
        try {
            res.setHeader("Content-Type", "image/png");
            return QRCode.toFileStream(res, qrCode);
        } catch (err) {
            console.error("❌ Error generating QR image:", err);
            return res.status(500).json({ error: "Failed to generate QR image" });
        }
    } else {
        res.json({ 
            status: 'generating_qr',
            message: 'QR code is being generated, please refresh in a few seconds...' 
        });
    }
});

app.get('/status', (req, res) => {
    res.json({
        authenticated: isAuthenticated,
        client_ready: clientReady,
        qr_available: qrCode !== null,
        service: 'whatsapp-otp-service'
    });
});

app.post('/send-otp', async (req, res) => {
    const { phone, otp, name = 'عميلنا' } = req.body;
    
    if (!phone || !otp) {
        return res.status(400).json({ 
            success: false, 
            error: 'Phone and OTP are required' 
        });
    }

    try {
        if (!clientReady) {
            return res.json({ 
                success: false, 
                error: 'WhatsApp service is not ready yet. Please check /qr and scan the code.',
                status: 'not_ready'
            });
        }

        const message = `🔐 رمز التحقق 🔐

مرحباً ${name}،

رمز التحقق الخاص بك هو: 
📱 *${otp}*

⏰ هذا الرمز صالح لمدة 5 دقائق.

⚠️ لا تشارك هذا الرمز مع أي شخص.`;

        await sendWhatsAppMessage(phone, message);
        
        console.log(`✅ OTP sent via WhatsApp to ${phone}`);
        
        res.json({
            success: true,
            message: 'تم إرسال رمز التحقق عبر واتساب بنجاح',
            method: 'whatsapp',
            phone: phone
        });
        
    } catch (error) {
        console.error('❌ Error sending OTP:', error);
        res.json({
            success: false,
            error: error.message,
            message: 'فشل إرسال الرمز عبر واتساب'
        });
    }
});

// Initialize WhatsApp when server starts
initializeWhatsApp();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp OTP Service running on port ${PORT}`);
    console.log(`📍 Health check: https://whatsapp-otp-service.onrender.com/health`);
    console.log(`📍 QR Code: https://whatsapp-otp-service.onrender.com/qr`);
});
