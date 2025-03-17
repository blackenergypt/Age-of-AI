document.addEventListener('DOMContentLoaded', () => {
    const itemsList = document.getElementById('items-list');
    const closeStoreButton = document.getElementById('close-store');

    // Exemplo de itens da loja
    const items = [
        { id: 1, name: 'Espada', price: 100 },
        { id: 2, name: 'Escudo', price: 150 },
        { id: 3, name: 'Poção de Vida', price: 50 }
    ];

    // Carregar itens na loja
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
            <span>${item.name} - ${item.price} Ouro</span>
            <button class="buy-button" data-id="${item.id}">Comprar</button>
        `;
        itemsList.appendChild(itemDiv);
    });

    // Adicionar evento de compra
    itemsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-button')) {
            const itemId = event.target.getAttribute('data-id');
            buyItem(itemId);
        }
    });

    // Função para comprar item
    function buyItem(itemId) {
        const item = items.find(i => i.id == itemId);
        if (item) {
            alert(`Você comprou ${item.name} por ${item.price} Ouro!`);
            // Aqui você pode adicionar lógica para subtrair o ouro do jogador
        }
    }

    // Fechar loja
    closeStoreButton.addEventListener('click', () => {
        window.location.href = '/menu'; // Redirecionar para o menu
    });
}); 