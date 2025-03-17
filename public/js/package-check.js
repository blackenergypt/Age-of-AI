// Verificar se os pacotes necessários estão instalados
console.log('Verificando pacotes instalados...');

fetch('/api/auth/package-check')
    .then(response => response.json())
    .then(data => {
        console.log('Status dos pacotes:', data);
    })
    .catch(error => {
        console.error('Erro ao verificar pacotes:', error);
    }); 