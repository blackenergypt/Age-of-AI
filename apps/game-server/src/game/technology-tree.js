class TechnologyTree {
  constructor() {
    this.technologies = {
      // Tecnologias da Era Inicial
      initial: {
        woodcutting: {
          name: "Técnicas de Corte de Madeira",
          description: "Aumenta a eficiência da coleta de madeira em 15%",
          cost: { food: 75, wood: 0 },
          effect: player => {
            player.gatheringRates.wood *= 1.15;
          }
        },
        farming: {
          name: "Agricultura Básica",
          description: "Aumenta a eficiência da coleta de comida em 15%",
          cost: { food: 50, wood: 75 },
          effect: player => {
            player.gatheringRates.food *= 1.15;
          }
        }
      },
      
      // Tecnologias da Era Feudal
      feudal: {
        doubleBitAxe: {
          name: "Machado de Lâmina Dupla",
          description: "Aumenta a eficiência da coleta de madeira em 20%",
          cost: { food: 100, wood: 50 },
          effect: player => {
            player.gatheringRates.wood *= 1.2;
          },
          requires: ["woodcutting"]
        },
        horseCollar: {
          name: "Colar de Cavalo",
          description: "Aumenta a eficiência da coleta de comida em 20%",
          cost: { food: 75, wood: 75 },
          effect: player => {
            player.gatheringRates.food *= 1.2;
          },
          requires: ["farming"]
        },
        scaleArmor: {
          name: "Armadura de Escamas",
          description: "Aumenta a defesa das unidades militares em 10%",
          cost: { food: 100, gold: 50 },
          effect: player => {
            player.combatBonuses.defense += 0.1;
          }
        }
      },
      
      // Tecnologias da Era dos Castelos
      castle: {
        bowSaw: {
          name: "Serra de Arco",
          description: "Aumenta a eficiência da coleta de madeira em 25%",
          cost: { food: 150, wood: 100 },
          effect: player => {
            player.gatheringRates.wood *= 1.25;
          },
          requires: ["doubleBitAxe"]
        },
        heavyPlow: {
          name: "Arado Pesado",
          description: "Aumenta a eficiência da coleta de comida em 25%",
          cost: { food: 125, wood: 125 },
          effect: player => {
            player.gatheringRates.food *= 1.25;
          },
          requires: ["horseCollar"]
        },
        chainMail: {
          name: "Cota de Malha",
          description: "Aumenta a defesa das unidades militares em 15%",
          cost: { food: 200, gold: 100 },
          effect: player => {
            player.combatBonuses.defense += 0.15;
          },
          requires: ["scaleArmor"]
        }
      },
      
      // Tecnologias da Era Imperial
      imperial: {
        twoManSaw: {
          name: "Serra de Dois Homens",
          description: "Aumenta a eficiência da coleta de madeira em 30%",
          cost: { food: 200, wood: 150 },
          effect: player => {
            player.gatheringRates.wood *= 1.3;
          },
          requires: ["bowSaw"]
        },
        cropRotation: {
          name: "Rotação de Culturas",
          description: "Aumenta a eficiência da coleta de comida em 30%",
          cost: { food: 250, wood: 200 },
          effect: player => {
            player.gatheringRates.food *= 1.3;
          },
          requires: ["heavyPlow"]
        },
        plateMail: {
          name: "Armadura de Placas",
          description: "Aumenta a defesa das unidades militares em 20%",
          cost: { food: 300, gold: 150 },
          effect: player => {
            player.combatBonuses.defense += 0.2;
          },
          requires: ["chainMail"]
        }
      }
    };
  }
  
  // Desbloquear tecnologias disponíveis para a era
  unlockAgeTechnologies(player, age) {
    // Adicionar tecnologias da era atual às disponíveis para o jogador
    const ageTechnologies = this.technologies[age];
    
    for (const [techId, tech] of Object.entries(ageTechnologies)) {
      // Verificar se os pré-requisitos foram atendidos
      if (!tech.requires || tech.requires.every(req => player.researched.includes(req))) {
        if (!player.availableTechnologies.includes(techId)) {
          player.availableTechnologies.push(techId);
        }
      }
    }
  }
  
  // Pesquisar uma tecnologia
  researchTechnology(player, techId) {
    // Verificar se a tecnologia existe
    let tech = null;
    let techAge = null;
    
    // Encontrar a tecnologia em todas as eras
    for (const [age, ageTechs] of Object.entries(this.technologies)) {
      if (techId in ageTechs) {
        tech = ageTechs[techId];
        techAge = age;
        break;
      }
    }
    
    if (!tech) {
      return { success: false, message: "Tecnologia não encontrada" };
    }
    
    // Verificar se o jogador está na era correta ou posterior
    const ageOrder = ['initial', 'feudal', 'castle', 'imperial'];
    const playerAgeIndex = ageOrder.indexOf(player.age);
    const techAgeIndex = ageOrder.indexOf(techAge);
    
    if (playerAgeIndex < techAgeIndex) {
      return { 
        success: false, 
        message: `Precisa estar na era ${techAge} ou superior para pesquisar esta tecnologia` 
      };
    }
    
    // Verificar se o jogador já pesquisou esta tecnologia
    if (player.researched.includes(techId)) {
      return { success: false, message: "Tecnologia já pesquisada" };
    }
    
    // Verificar se a tecnologia está disponível para o jogador
    if (!player.availableTechnologies.includes(techId)) {
      return { success: false, message: "Tecnologia não disponível" };
    }
    
    // Verificar se os pré-requisitos foram atendidos
    if (tech.requires && !tech.requires.every(req => player.researched.includes(req))) {
      return { 
        success: false, 
        message: "Pré-requisitos não atendidos" 
      };
    }
    
    // Verificar se o jogador tem recursos suficientes
    for (const [resource, amount] of Object.entries(tech.cost)) {
      if (player.resources[resource] < amount) {
        return { 
          success: false, 
          message: `Recursos insuficientes: necessário ${amount} de ${resource}` 
        };
      }
    }
    
    // Deduzir recursos
    for (const [resource, amount] of Object.entries(tech.cost)) {
      player.resources[resource] -= amount;
    }
    
    // Aplicar efeito da tecnologia
    tech.effect(player);
    
    // Adicionar à lista de tecnologias pesquisadas
    player.researched.push(techId);
    
    // Remover da lista de tecnologias disponíveis
    player.availableTechnologies = player.availableTechnologies.filter(id => id !== techId);
    
    // Desbloquear novas tecnologias que dependem desta
    this.unlockDependentTechnologies(player);
    
    return { 
      success: true, 
      message: `Tecnologia ${tech.name} pesquisada com sucesso` 
    };
  }
  
  // Desbloquear tecnologias que dependem das já pesquisadas
  unlockDependentTechnologies(player) {
    for (const [age, ageTechs] of Object.entries(this.technologies)) {
      // Só verificar eras que o jogador já alcançou
      const ageOrder = ['initial', 'feudal', 'castle', 'imperial'];
      const playerAgeIndex = ageOrder.indexOf(player.age);
      const techAgeIndex = ageOrder.indexOf(age);
      
      if (playerAgeIndex >= techAgeIndex) {
        for (const [techId, tech] of Object.entries(ageTechs)) {
          if (tech.requires && 
              tech.requires.every(req => player.researched.includes(req)) &&
              !player.researched.includes(techId) &&
              !player.availableTechnologies.includes(techId)) {
            player.availableTechnologies.push(techId);
          }
        }
      }
    }
  }
}

module.exports = TechnologyTree; 