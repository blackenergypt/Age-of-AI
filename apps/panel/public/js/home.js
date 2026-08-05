document.addEventListener('DOMContentLoaded', function() {
    const backgroundMusic = document.getElementById('background-music');
    const toggleSoundBtn = document.getElementById('toggle-sound');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');

    function setSoundUi(isPlaying) {
        if (!soundIconOn || !soundIconOff) return;
        soundIconOn.classList.toggle('is-hidden', !isPlaying);
        soundIconOff.classList.toggle('is-hidden', isPlaying);
        if (toggleSoundBtn) {
            toggleSoundBtn.setAttribute('aria-label', isPlaying ? 'Silenciar' : 'Ativar som');
        }
    }

    if (backgroundMusic) {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                backgroundMusic.volume = (settings.musicVolume || 30) / 100;
            } catch (e) {
                backgroundMusic.volume = 0.3;
            }
        } else {
            backgroundMusic.volume = 0.3;
        }

        backgroundMusic.pause();
        setSoundUi(false);
    }

    if (toggleSoundBtn && backgroundMusic) {
        toggleSoundBtn.addEventListener('click', function() {
            if (backgroundMusic.paused) {
                backgroundMusic.play().then(() => setSoundUi(true)).catch(() => setSoundUi(false));
            } else {
                backgroundMusic.pause();
                setSoundUi(false);
            }
        });
    }

    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (token && userStr) {
        try {
            const userData = JSON.parse(userStr);
            if (userData) {
                const loginBtn = document.getElementById('login-btn');
                const accountBtn = document.getElementById('account-btn');

                if (loginBtn) loginBtn.hidden = true;
                if (accountBtn) {
                    accountBtn.hidden = false;
                    accountBtn.textContent = userData.nickname || userData.name || 'Minha Conta';
                }
            }
        } catch (e) {
            console.error('Erro ao analisar dados do usuário:', e);
        }
    }

    function setStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? 0;
    }

    function setDefaultStats() {
        setStat('online-players-welcome', 0);
        setStat('kingdoms-count-welcome', 0);
        setStat('registered-users-count', 0);
        setStat('discord-members-count', 0);
    }

    async function fetchGameStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error('Network response was not ok');

            const stats = await response.json();
            setStat('online-players-welcome', stats.onlinePlayers);
            setStat('kingdoms-count-welcome', stats.kingdoms);
            setStat('registered-users-count', stats.registeredUsers);
            setStat('discord-members-count', stats.discordMembers);
        } catch (error) {
            console.error('Error fetching game stats:', error);
            setDefaultStats();
        }
    }

    setDefaultStats();
    fetchGameStats();
});
