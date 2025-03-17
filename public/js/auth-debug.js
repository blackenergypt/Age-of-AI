// Script para depurar problemas de autenticação
console.log('Auth debug script loaded');

// Verificar se as estratégias de autenticação estão disponíveis
fetch('/api/auth/strategies')
    .then(response => response.json())
    .then(data => {
        console.log('Estratégias de autenticação disponíveis:', data);
    })
    .catch(error => {
        console.error('Erro ao verificar estratégias de autenticação:', error);
    });

// Adicionar logs aos botões de login social
document.addEventListener('DOMContentLoaded', () => {
    const discordButton = document.querySelector('.social-btn[data-provider="discord"]');
    if (discordButton) {
        discordButton.addEventListener('click', () => {
            console.log('Clicou no botão do Discord');
        });
    }
}); 