// Controle de som centralizado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar áudio do jogo
    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic) {
        // Carregar configurações de áudio
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                backgroundMusic.volume = (settings.musicVolume || 30) / 100;
                
                // Verificar se o som estava desligado
                if (settings.soundMuted) {
                    backgroundMusic.pause();
                    const soundIcon = document.getElementById('sound-icon');
                    if (soundIcon) {
                        soundIcon.textContent = '🔇';
                    }
                }
            } catch (e) {
                console.error('Erro ao analisar configurações de áudio:', e);
                backgroundMusic.volume = 0.3; // 30% do volume máximo
            }
        } else {
            backgroundMusic.volume = 0.3; // 30% do volume máximo
        }
    }
    
    // Botão de alternar som
    const toggleSoundBtn = document.getElementById('toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    
    if (toggleSoundBtn && soundIcon && backgroundMusic) {
        toggleSoundBtn.addEventListener('click', function() {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
                soundIcon.textContent = '🔊';
                
                // Salvar configuração
                const savedSettings = localStorage.getItem('gameSettings');
                if (savedSettings) {
                    try {
                        const settings = JSON.parse(savedSettings);
                        settings.soundMuted = false;
                        localStorage.setItem('gameSettings', JSON.stringify(settings));
                    } catch (e) {
                        console.error('Erro ao salvar configuração de som:', e);
                    }
                } else {
                    localStorage.setItem('gameSettings', JSON.stringify({
                        musicVolume: 30,
                        sfxVolume: 50,
                        soundMuted: false
                    }));
                }
            } else {
                backgroundMusic.pause();
                soundIcon.textContent = '🔇';
                
                // Salvar configuração
                const savedSettings = localStorage.getItem('gameSettings');
                if (savedSettings) {
                    try {
                        const settings = JSON.parse(savedSettings);
                        settings.soundMuted = true;
                        localStorage.setItem('gameSettings', JSON.stringify(settings));
                    } catch (e) {
                        console.error('Erro ao salvar configuração de som:', e);
                    }
                } else {
                    localStorage.setItem('gameSettings', JSON.stringify({
                        musicVolume: 30,
                        sfxVolume: 50,
                        soundMuted: true
                    }));
                }
            }
        });
    }
    
    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    if (togglePasswordButtons.length > 0) {
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                
                if (passwordInput) {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        this.classList.remove('fa-eye');
                        this.classList.add('fa-eye-slash');
                    } else {
                        passwordInput.type = 'password';
                        this.classList.remove('fa-eye-slash');
                        this.classList.add('fa-eye');
                    }
                }
            });
        });
    }
}); 