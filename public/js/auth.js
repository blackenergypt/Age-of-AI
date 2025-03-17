class Auth {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.checkAuthStatus();
        this.setupEventListeners();
    }
    
    loadUsers() {
        // Em um sistema real, isso seria feito no servidor
        const savedUsers = localStorage.getItem('age_of_ai_users');
        return savedUsers ? JSON.parse(savedUsers) : [];
    }
    
    saveUsers() {
        // Em um sistema real, isso seria feito no servidor
        localStorage.setItem('age_of_ai_users', JSON.stringify(this.users));
    }
    
    setupEventListeners() {
        // Botões de login/logout
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        // Verificar se os elementos existem antes de adicionar event listeners
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginForm());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Formulários
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const createKingdomForm = document.getElementById('create-kingdom-form');
        const joinKingdomForm = document.getElementById('join-kingdom-form');
        
        // Verificar se os formulários existem antes de adicionar event listeners
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }
        
        if (createKingdomForm) {
            createKingdomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createKingdom();
            });
        }
        
        if (joinKingdomForm) {
            joinKingdomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.joinKingdom();
            });
        }
    }
    
    showScreen(screenId) {
        // Esconder todas as telas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        
        // Mostrar a tela desejada
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;
        
        if (!email || !password) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        // Verificar se o usuário existe
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            alert('Email ou senha incorretos.');
            return;
        }
        
        this.currentUser = user;
        
        // Atualizar informações do jogador no menu principal
        document.getElementById('main-menu-player-name').textContent = user.nickname;
        
        // Ir para o menu principal em vez da tela de escolha de reino
        this.showScreen('main-menu-screen');
    }
    
    register() {
        const nickname = document.getElementById('register-nickname').value.trim();
        const fullname = document.getElementById('register-fullname').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const phone = document.getElementById('register-phone').value.trim();
        const birthdate = document.getElementById('register-birthdate').value;
        const termsAccepted = document.getElementById('register-terms').checked;
        
        // Validações básicas
        if (!nickname || !fullname || !email || !password || !confirmPassword || !birthdate) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }
        
        if (!termsAccepted) {
            alert('Você precisa aceitar os termos de uso e políticas de privacidade.');
            return;
        }
        
        // Verificar idade mínima (12 anos)
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 12) {
            alert('Você precisa ter pelo menos 12 anos para jogar Age of AI.');
            return;
        }
        
        // Verificar se o email já está em uso
        if (this.users.some(u => u.email === email)) {
            alert('Este email já está em uso.');
            return;
        }
        
        // Verificar se o nickname já está em uso
        if (this.users.some(u => u.nickname === nickname)) {
            alert('Este nome de jogador já está em uso.');
            return;
        }
        
        // Criar novo usuário
        const newUser = {
            id: Date.now().toString(),
            nickname,
            fullname,
            email,
            password,
            phone,
            birthdate,
            registeredAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        this.currentUser = newUser;
        
        // Mostrar o nome do jogador na tela de escolha de reino
        document.getElementById('player-name-display').textContent = nickname;
        
        // Ir para a tela de escolha de reino
        this.showScreen('kingdom-choice-screen');
    }
    
    createKingdom() {
        if (!this.currentUser) return;
        
        const kingdomName = document.getElementById('new-kingdom-name').value.trim();
        
        if (!kingdomName) {
            alert('Por favor, digite um nome para o seu reino.');
            return;
        }
        
        // Iniciar o jogo com o reino criado
        gameClient.playerName = this.currentUser.nickname;
        gameClient.kingdomName = kingdomName;
        gameClient.connectToServer();
        
        // Esconder todas as telas e mostrar a tela do jogo
        this.showScreen('game-screen');
    }
    
    joinKingdom() {
        if (!this.currentUser) return;
        
        const kingdomName = document.getElementById('existing-kingdom-name').value.trim();
        
        if (!kingdomName) {
            alert('Por favor, digite o nome do reino que deseja se juntar.');
            return;
        }
        
        // Iniciar o jogo com o reino selecionado
        gameClient.playerName = this.currentUser.nickname;
        gameClient.kingdomName = kingdomName;
        gameClient.connectToServer();
        
        // Esconder todas as telas e mostrar a tela do jogo
        this.showScreen('game-screen');
    }
    
    checkAuthStatus() {
        // Verificar se há um token de autenticação armazenado
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (token && user) {
            this.token = token;
            this.currentUser = JSON.parse(user);
            console.log('Usuário autenticado:', this.currentUser.name);
            
            // Atualizar a interface para usuário logado
            this.updateUIForLoggedInUser();
        } else {
            console.log('Nenhum usuário autenticado');
            
            // Atualizar a interface para usuário não logado
            this.updateUIForLoggedOutUser();
        }
    }
    
    updateUIForLoggedInUser() {
        // Elementos que devem ser mostrados apenas para usuários logados
        const loggedInElements = document.querySelectorAll('.logged-in-only');
        const loggedOutElements = document.querySelectorAll('.logged-out-only');
        
        // Mostrar elementos para usuários logados
        if (loggedInElements) {
            loggedInElements.forEach(el => {
                el.style.display = 'block';
            });
        }
        
        // Esconder elementos para usuários não logados
        if (loggedOutElements) {
            loggedOutElements.forEach(el => {
                el.style.display = 'none';
            });
        }
        
        // Atualizar nome do usuário onde for necessário
        const userNameElements = document.querySelectorAll('.user-name');
        if (userNameElements && this.currentUser) {
            userNameElements.forEach(el => {
                el.textContent = this.currentUser.name || this.currentUser.nickname || this.currentUser.email;
            });
        }
    }
    
    updateUIForLoggedOutUser() {
        // Elementos que devem ser mostrados apenas para usuários logados
        const loggedInElements = document.querySelectorAll('.logged-in-only');
        const loggedOutElements = document.querySelectorAll('.logged-out-only');
        
        // Esconder elementos para usuários logados
        if (loggedInElements) {
            loggedInElements.forEach(el => {
                el.style.display = 'none';
            });
        }
        
        // Mostrar elementos para usuários não logados
        if (loggedOutElements) {
            loggedOutElements.forEach(el => {
                el.style.display = 'block';
            });
        }
    }
    
    logout() {
        // Remover token e informações do usuário
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        
        this.token = null;
        this.currentUser = null;
        
        // Atualizar a interface
        this.updateUIForLoggedOutUser();
        
        // Redirecionar para a página inicial
        window.location.href = '/';
    }

    // Função para fazer login
    login(email, password, rememberMe) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Armazenar token e dados do usuário
                    if (rememberMe) {
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                    } else {
                        sessionStorage.setItem('authToken', data.token);
                        sessionStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
                    // Definir o usuário atual
                    this.currentUser = data.user;
                    this.token = data.token;
                    
                    console.log('Login bem-sucedido:', data.user.email);
                    resolve(data);
                } else {
                    console.error('Erro no login:', data.message);
                    reject(data.message || 'Erro ao fazer login');
                }
            } catch (error) {
                console.error('Erro no login:', error);
                reject('Erro ao conectar ao servidor');
            }
        });
    }
}

// Inicializar a autenticação apenas quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;
            const messageElement = document.getElementById('loginMessage');
            
            if (!messageElement) return;
            
            try {
                messageElement.textContent = 'Autenticando...';
                messageElement.className = 'auth-message';
                messageElement.style.display = 'block';
                
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageElement.textContent = data.message || 'Login bem-sucedido!';
                    messageElement.className = 'auth-message success';
                    
                    // Salvar token e dados do usuário
                    if (data.token) {
                        if (rememberMe) {
                            localStorage.setItem('authToken', data.token);
                            localStorage.setItem('user', JSON.stringify(data.user));
                        } else {
                            sessionStorage.setItem('authToken', data.token);
                            sessionStorage.setItem('user', JSON.stringify(data.user));
                        }
                    }
                    
                    // Redirecionar para o menu após o login bem-sucedido
                    console.log('Login bem-sucedido, redirecionando para o menu');
                    
                    // Usar setTimeout para garantir que o redirecionamento ocorra após a mensagem ser exibida
                    setTimeout(() => {
                        window.location.href = '/menu';
                    }, 1000);
                } else {
                    messageElement.textContent = data.message || 'Erro ao fazer login';
                    messageElement.className = 'auth-message error';
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                messageElement.textContent = 'Erro ao conectar ao servidor. Tente novamente.';
                messageElement.className = 'auth-message error';
            }
        });
    }
    
    // Handle registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nickname = document.getElementById('nickname').value;
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone') ? document.getElementById('phone').value : '';
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const acceptedTerms = document.getElementById('acceptedTerms') ? document.getElementById('acceptedTerms').checked : false;
            const messageElement = document.getElementById('registerMessage');
            
            if (!messageElement) return;
            
            // Client-side validation
            if (password !== confirmPassword) {
                messageElement.textContent = 'As senhas não coincidem';
                messageElement.className = 'auth-message error';
                messageElement.style.display = 'block';
                return;
            }
            
            if (!acceptedTerms) {
                messageElement.textContent = 'Você deve aceitar os termos e políticas';
                messageElement.className = 'auth-message error';
                messageElement.style.display = 'block';
                return;
            }
            
            try {
                messageElement.textContent = 'Registrando...';
                messageElement.className = 'auth-message';
                messageElement.style.display = 'block';
                
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nickname,
                        name,
                        email,
                        phone,
                        password,
                        confirmPassword,
                        acceptedTerms
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageElement.textContent = data.message;
                    messageElement.className = 'auth-message success';
                    
                    // Clear form after successful registration
                    registerForm.reset();
                    
                    // Redirect to login page if no email confirmation is required
                    if (data.message.includes('não é necessária')) {
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    }
                } else {
                    messageElement.textContent = data.message;
                    messageElement.className = 'auth-message error';
                }
            } catch (error) {
                if (messageElement) {
                    messageElement.textContent = 'Erro ao conectar ao servidor. Tente novamente.';
                    messageElement.className = 'auth-message error';
                }
                console.error('Registration error:', error);
            }
        });
    }
    
    // Check for confirmed email parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const confirmed = urlParams.get('confirmed');
    
    if (confirmed === 'true') {
        const messageElement = document.getElementById('loginMessage');
        if (messageElement) {
            messageElement.textContent = 'Email confirmado com sucesso! Você já pode fazer login.';
            messageElement.className = 'auth-message success';
            messageElement.style.display = 'block';
        }
    }
}); 