class Game {
  constructor() {
    this.selectedEntities = [];
    this.actionButtons = [];
  }
  
  handleAction(action, targetId) {
    // Implementar ações do jogo aqui
    console.log(`Ação: ${action}, Alvo: ${targetId}`);
    
    // Exemplo de implementação de ações
    switch (action) {
      case 'move':
        // Lógica para mover unidades
        break;
        
      case 'attack':
        // Lógica para atacar
        break;
        
      case 'build':
        // Lógica para construir
        break;
        
      case 'gather':
        // Lógica para coletar recursos
        break;
    }
  }
  
  updateUI() {
    // Atualizar a interface do usuário com base nas entidades selecionadas
    const selectionInfo = document.getElementById('selection-info');
    const actionButtons = document.getElementById('action-buttons');
    
    // Limpar botões de ação anteriores
    actionButtons.innerHTML = '';
    
    if (this.selectedEntities.length === 0) {
      selectionInfo.textContent = 'Nenhuma unidade selecionada';
      return;
    }
    
    // Mostrar informações sobre as entidades selecionadas
    const firstEntity = this.selectedEntities[0];
    selectionInfo.textContent = `${this.selectedEntities.length} ${firstEntity.type}(s) selecionado(s)`;
    
    // Adicionar botões de ação com base no tipo de entidade
    if (firstEntity.type === 'villager') {
      this.addActionButton(actionButtons, 'build', '🏠', 'Construir');
      this.addActionButton(actionButtons, 'gather', '🪓', 'Coletar');
    } else if (firstEntity.type.includes('warrior') || firstEntity.type.includes('archer')) {
      this.addActionButton(actionButtons, 'attack', '⚔️', 'Atacar');
    }
    
    // Botão de movimento para todos os tipos
    this.addActionButton(actionButtons, 'move', '👣', 'Mover');
  }
  
  addActionButton(container, action, icon, tooltip) {
    const button = document.createElement('div');
    button.className = 'action-button';
    button.setAttribute('data-action', action);
    button.setAttribute('title', tooltip);
    button.textContent = icon;
    
    button.addEventListener('click', () => {
      this.handleAction(action);
    });
    
    container.appendChild(button);
  }
  
  // Adicionar método para atualizar a interface com informações de tempo
  updateTimeDisplay(timeOfDay) {
    const timeDisplay = document.getElementById('time-display');
    if (!timeDisplay) return;
    
    // Formatar hora e minuto
    const hour = timeOfDay.hour.toString().padStart(2, '0');
    const minute = timeOfDay.minute.toString().padStart(2, '0');
    
    // Determinar ícone baseado no tempo
    let timeIcon;
    if (timeOfDay.hour >= 6 && timeOfDay.hour < 10) {
      timeIcon = '🌅'; // Amanhecer
    } else if (timeOfDay.hour >= 10 && timeOfDay.hour < 16) {
      timeIcon = '☀️'; // Dia
    } else if (timeOfDay.hour >= 16 && timeOfDay.hour < 20) {
      timeIcon = '🌇'; // Pôr do sol
    } else {
      timeIcon = '🌙'; // Noite
    }
    
    // Atualizar o display
    timeDisplay.innerHTML = `${timeIcon} ${hour}:${minute}`;
    
    // Adicionar classe CSS baseada no período do dia
    timeDisplay.className = 'time-display';
    if (timeOfDay.isDayTime) {
      timeDisplay.classList.add('day-time');
    } else {
      timeDisplay.classList.add('night-time');
    }
  }
}

// Inicializar o jogo
const game = new Game();

document.getElementById('collect-wood').addEventListener('click', () => {
    // Lógica para coletar madeira
    gameClient.collectResource('wood');
});

document.getElementById('build-house').addEventListener('click', () => {
    // Lógica para construir uma casa
    gameClient.buildHouse();
}); 