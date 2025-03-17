const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const passport = require('passport');
const router = express.Router();
const config = require('./config');
const User = require('./models/user');
const crypto = require('crypto');
const { getRegisteredUsersCount, getDiscordMembersCount } = require('./utils/stats');
const game = require('./game/game');

// SMTP transporter setup (only if credentials are available)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        service: 'smtp',
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false 
        }
    });
    
    // Verificar conexão com o servidor SMTP
    transporter.verify(function(error, success) {
        if (error) {
            console.error('Erro na configuração do servidor SMTP:', error);
        } else {
            console.log('Servidor SMTP está pronto para enviar mensagens');
        }
    });
    
    console.log('Email transporter configured');
} else {
    console.log('Email transporter not configured - missing credentials');
}

// Middleware para verificar se o token é válido
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Rota para verificar se o token é válido
router.get('/verify-token', verifyToken, (req, res) => {
    res.status(200).json({ valid: true, user: req.user });
});

// Registration endpoint
router.post('/register', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            confirmPassword, 
            nickname, 
            name, 
            phone, 
            acceptedTerms 
        } = req.body;

        // Validar campos obrigatórios
        if (!email || !password || !confirmPassword || !nickname || !name) {
            return res.status(400).json({ 
                message: 'Todos os campos obrigatórios devem ser preenchidos' 
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Formato de email inválido' });
        }

        // Validar confirmação de senha
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'As senhas não coincidem' });
        }

        // Validar força da senha (mínimo 8 caracteres, pelo menos uma letra e um número)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números' 
            });
        }

        // Validar aceitação dos termos
        if (!acceptedTerms) {
            return res.status(400).json({ 
                message: 'Você deve aceitar os termos e políticas para se registrar' 
            });
        }

        // Verificar se o email já existe
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Este email já está em uso' });
        }

        // Verificar se o nickname já existe
        const existingNickname = await User.findOne({ nickname });
        if (existingNickname) {
            return res.status(400).json({ message: 'Este nickname já está em uso' });
        }

        // Create confirmation token if email service is available
        let confirmationToken = null;
        let confirmationExpires = null;
        
        if (transporter && config.auth.jwtSecret) {
            confirmationToken = crypto.randomBytes(20).toString('hex');
            confirmationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
        }

        // Create a new user
        const newUser = new User({
            email,
            password,
            nickname,
            name,
            phone,
            acceptedTerms,
            confirmed: !transporter, // Auto-confirm if no email service
            confirmationToken,
            confirmationExpires
        });

        // Save user to database
        await newUser.save();

        // Send confirmation email if transporter is configured
        if (transporter && confirmationToken) {
            try {
                const confirmationUrl = `http://${req.headers.host}/api/auth/confirm/${confirmationToken}`;

                await transporter.sendMail({
                    from: `"Age of AI" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: 'Confirmação de Email - Age of AI',
                    text: `Olá ${name}! Por favor, confirme seu email clicando no seguinte link: ${confirmationUrl}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                            <h2 style="color: #333; text-align: center;">Bem-vindo ao Age of AI, ${name}!</h2>
                            <p>Obrigado por se registrar. Para ativar sua conta, por favor clique no botão abaixo:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmar Email</a>
                            </div>
                            <p>Se o botão não funcionar, você pode copiar e colar o seguinte link no seu navegador:</p>
                            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${confirmationUrl}</p>
                            <p>Este link expirará em 24 horas.</p>
                            <p>Atenciosamente,<br>Equipe Age of AI</p>
                        </div>
                    `
                });
                
                res.status(201).json({ message: 'Usuário registrado. Por favor, verifique seu email para confirmar.' });
            } catch (error) {
                console.error('Erro ao enviar email:', error);
                // Auto-confirm user if email sending fails
                await User.updateOne({ email }, { confirmed: true });
                res.status(201).json({ 
                    message: 'Usuário registrado com sucesso. Não foi possível enviar o email de confirmação, mas sua conta foi ativada.',
                    error: error.message
                });
            }
        } else {
            // No email service configured, user is already auto-confirmed
            res.status(201).json({ message: 'Usuário registrado com sucesso. Confirmação de email não é necessária.' });
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Email confirmation endpoint
router.get('/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with this token and token not expired
        const user = await User.findOne({ 
            confirmationToken: token,
            confirmationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado' });
        }

        // Confirm user
        user.confirmed = true;
        user.confirmationToken = undefined;
        user.confirmationExpires = undefined;
        await user.save();

        // Redirect to success page
        res.redirect('/login.html?confirmed=true');
    } catch (error) {
        console.error('Erro na confirmação:', error);
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        // Check if email is confirmed
        if (!user.confirmed) {
            return res.status(400).json({ message: 'Email não confirmado. Por favor, verifique sua caixa de entrada.' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Create JWT token
        if (config.auth.jwtSecret) {
            const token = jwt.sign(
                { 
                    id: user._id,
                    email: user.email,
                    role: user.role
                }, 
                config.auth.jwtSecret, 
                { expiresIn: config.auth.jwtExpiresIn }
            );
            
            res.status(200).json({ 
                message: 'Login bem-sucedido', 
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } else {
            res.status(200).json({ message: 'Login bem-sucedido' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Adicionar rotas para autenticação social
router.get('/discord', (req, res, next) => {
    console.log('Tentando autenticar com Discord...');
    passport.authenticate('discord', { scope: ['identify', 'email'] })(req, res, next);
});

router.get('/discord/callback', (req, res, next) => {
    console.log('Callback do Discord recebido');
    passport.authenticate('discord', { 
        failureRedirect: '/failure.html'
    })(req, res, (err) => {
        if (err) {
            console.error('Erro na autenticação do Discord:', err);
            return res.redirect('/failure.html');
        }
        
        // Criar token JWT para o usuário autenticado
        const token = jwt.sign(
            { 
                id: req.user.id, 
                email: req.user.email,
                username: req.user.username || req.user.global_name
            },
            config.auth.jwtSecret,
            { expiresIn: config.auth.jwtExpiresIn }
        );
        
        // Simplificar os dados do usuário para armazenar no localStorage
        const userData = {
            id: req.user.id,
            email: req.user.email,
            name: req.user.username || req.user.global_name,
            avatar: req.user.avatar ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : null
        };
        
        // Redirecionar para uma página que armazenará o token e redirecionará para o menu
        res.redirect(`/auth-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    });
});

// Adicionar rotas similares para outros provedores
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/failure.html' 
    }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email },
            config.auth.jwtSecret,
            { expiresIn: config.auth.jwtExpiresIn }
        );
        res.redirect(`/auth-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    }
);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', 
    passport.authenticate('facebook', { 
        failureRedirect: '/failure.html' 
    }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email },
            config.auth.jwtSecret,
            { expiresIn: config.auth.jwtExpiresIn }
        );
        res.redirect(`/auth-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    }
);

router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback', 
    passport.authenticate('twitter', { 
        failureRedirect: '/failure.html' 
    }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email },
            config.auth.jwtSecret,
            { expiresIn: config.auth.jwtExpiresIn }
        );
        res.redirect(`/auth-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    }
);

// Rota para recuperação de senha
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email é obrigatório' });
        }
        
        // Verificar se o usuário existe
        const user = await User.findOne({ email });
        
        if (!user) {
            // Por segurança, não informamos se o email existe ou não
            return res.status(200).json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' });
        }
        
        // Gerar token de recuperação
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hora
        
        // Salvar token no usuário
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();
        
        // Enviar email com o link de recuperação
        if (transporter) {
            const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                to: user.email,
                from: process.env.SMTP_USER,
                subject: 'Age of AI - Recuperação de Senha',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4a6fa5;">Age of AI - Recuperação de Senha</h2>
                        <p>Olá,</p>
                        <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:</p>
                        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4a6fa5; color: white; text-decoration: none; border-radius: 5px;">Redefinir Senha</a></p>
                        <p>Se você não solicitou a redefinição de senha, ignore este email.</p>
                        <p>O link expira em 1 hora.</p>
                        <p>Atenciosamente,<br>Equipe Age of AI</p>
                    </div>
                `
            };
            
            await transporter.sendMail(mailOptions);
        }
        
        res.status(200).json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' });
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Rota para redefinir a senha
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ message: 'Token e senha são obrigatórios' });
        }
        
        // Verificar se o token é válido
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado' });
        }
        
        // Atualizar a senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        console.error('Erro na redefinição de senha:', error);
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Rota para verificar estratégias disponíveis (para depuração)
router.get('/strategies', (req, res) => {
    const strategies = Object.keys(passport._strategies);
    res.json({ strategies });
});

// Rota para verificar pacotes instalados
router.get('/package-check', (req, res) => {
    const packages = {
        'passport': checkPackage('passport'),
        'passport-discord': checkPackage('passport-discord'),
        'passport-google-oauth20': checkPackage('passport-google-oauth20'),
        'passport-facebook': checkPackage('passport-facebook'),
        'passport-twitter': checkPackage('passport-twitter')
    };
    
    res.json(packages);
});

function checkPackage(packageName) {
    try {
        require(packageName);
        return { installed: true, error: null };
    } catch (error) {
        return { installed: false, error: error.message };
    }
}

// Rota para criar um novo reino
router.post('/create-kingdom', (req, res) => {
    const { name } = req.body;
    const playerId = req.user.id; // Supondo que você tenha um middleware que define req.user

    if (!name) {
        return res.status(400).json({ message: 'Nome do reino é obrigatório' });
    }

    const newKingdom = game.createKingdom(name, playerId);
    res.status(201).json(newKingdom);
});

// Rota para se juntar a um reino existente
router.post('/join-kingdom', (req, res) => {
    const { kingdomId } = req.body;
    const playerId = req.user.id; // Supondo que você tenha um middleware que define req.user

    if (!kingdomId) {
        return res.status(400).json({ message: 'ID do reino é obrigatório' });
    }

    const success = game.joinKingdom(playerId, kingdomId);
    if (success) {
        res.status(200).json({ message: 'Você se juntou ao reino com sucesso!' });
    } else {
        res.status(404).json({ message: 'Reino não encontrado' });
    }
});

module.exports = router; 