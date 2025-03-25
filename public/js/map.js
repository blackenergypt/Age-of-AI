// Removendo a importação do módulo, pois o Three.js já está carregado globalmente
// import * as THREE from './node_modules/three/build/three.module.js';

let scene, camera, renderer, controls;
let lightAmbient, lightDirectional, lightHelper;
let terrainGroup, biomeGroup, objectsGroup;
let zoomLevel = 1, minZoom = 0.5, maxZoom = 2;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let currentPlacementBuilding = null;

// Variáveis para os menus e gestão de recursos
let resources = {
    food: 200,
    wood: 200,
    stone: 100,
    gold: 50
};

let population = {
    current: 3,
    max: 15
};

let units = {
    villagers: [],
    soldiers: []
};

let buildings = {
    townCenters: [],
    houses: [],
    farms: [],
    walls: [],
    gates: [],
    barracks: []
};

// Objeto para guardar a pré-visualização da construção
let placementPreview = null;

// Variáveis para seleção e controle de unidades
let selectedUnits = [];
let hoverObject = null;
let currentTask = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Objeto para acompanhar os villagers atribuídos a cada recurso
let assignments = {
    wood: [],
    stone: [],
    gold: [],
    berries: [],
    farms: []
};

function init() {
    // Verificar se Three.js está disponível globalmente
    if (typeof THREE === 'undefined') {
        console.error('Three.js não está disponível. Verifique se a biblioteca foi carregada corretamente.');
        return;
    }

    // Criar um container para o Three.js
    threeJsContainer = document.createElement('div');
    threeJsContainer.id = 'three-js-container';
    threeJsContainer.style.position = 'absolute';
    threeJsContainer.style.top = '0';
    threeJsContainer.style.left = '0';
    threeJsContainer.style.width = '100%';
    threeJsContainer.style.height = '100%';
    threeJsContainer.style.zIndex = '0'; // Colocar abaixo da UI
    document.getElementById('game-container').prepend(threeJsContainer);

    // Configurar a cena 3D
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2b3c); // Fundo azul escuro
    
    // Usar câmera ortográfica para ter um visual isométrico como Age of Empires
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -500 * aspect, 500 * aspect,
        500, -500,
        0.1, 2000
    );
    camera.position.set(300, 300, 300);
    camera.lookAt(0, 0, 0);

    // Criar renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    threeJsContainer.appendChild(renderer.domElement);
    
    // Adicionar luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(500, 800, 500);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Criar plano do terreno
    createTerrain();

    // Adicionar alguns objetos para demonstração
    addDemoObjects();

    // Ajustar câmera e renderização quando a janela for redimensionada
    window.addEventListener('resize', onWindowResize);
    
    // Adicionar controles de zoom e movimento
    renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('contextmenu', (e) => e.preventDefault(), false);

    animate();
    
    // Botão de alternar entre 2D e 3D
    addToggle3DButton();
    
    // Inicializar interface do usuário
    initUI();
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    // Ajustar zoom considerando o nível atual
    camera.left = -500 * aspect * zoomLevel;
    camera.right = 500 * aspect * zoomLevel;
    camera.top = 500 * zoomLevel;
    camera.bottom = -500 * zoomLevel;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Função para controlar o zoom
function onMouseWheel(event) {
    event.preventDefault();
    
    // Determinar direção do zoom (para dentro ou para fora)
    const zoomDirection = event.deltaY > 0 ? 1 : -1;
    const zoomIntensity = 0.1;
    
    // Atualizar nível de zoom
    zoomLevel += zoomDirection * zoomIntensity;
    
    // Limitar o zoom mínimo e máximo
    zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel));
    
    // Aplicar zoom à camera
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -500 * aspect * zoomLevel;
    camera.right = 500 * aspect * zoomLevel;
    camera.top = 500 * zoomLevel;
    camera.bottom = -500 * zoomLevel;
    camera.updateProjectionMatrix();
}

// Iniciar arrasto do mapa
function onMouseDown(event) {
    event.preventDefault();
    
    if (event.button === 0) { // Botão esquerdo
        if (currentPlacementBuilding) {
            // Se estiver no modo de colocação, construir o edifício
            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );
            placeBuilding(mouse, currentPlacementBuilding);
        } else {
            // Verificar se clicou em uma unidade ou recurso
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            
            if (intersects.length > 0) {
                let found = false;
                
                // Procurar por unidades ou recursos
                for (let i = 0; i < intersects.length; i++) {
                    const object = getParentWithUserData(intersects[i].object);
                    
                    if (object) {
                        if (object.userData.type === 'unit') {
                            // Selecionou uma unidade
                            if (!event.shiftKey) {
                                // Se Shift não estiver pressionado, limpar seleção anterior
                                deselectAllUnits();
                            }
                            
                            selectUnit(object);
                            found = true;
                            break;
                        } else if (selectedUnits.length > 0 && 
                                  (object.userData.type === 'resource' || 
                                   object.userData.type === 'building')) {
                            // Clicou em um recurso ou construção com unidades selecionadas
                            assignUnitsToTask(object);
                            found = true;
                            break;
                        }
                    }
                }
                
                if (!found) {
                    // Clicou em um espaço vazio, mover as unidades selecionadas
                    if (selectedUnits.length > 0) {
                        moveSelectedUnitsTo(intersects[0].point);
                    } else {
                        // Iniciar arrasto do mapa
                        isDragging = true;
                        previousMousePosition = {
                            x: event.clientX,
                            y: event.clientY
                        };
                    }
                }
            } else {
                // Clicou fora de qualquer objeto, desmarcar tudo
                deselectAllUnits();
                
                // Iniciar arrasto do mapa
                isDragging = true;
                previousMousePosition = {
                    x: event.clientX,
                    y: event.clientY
                };
            }
        }
    } else if (event.button === 2) { // Botão direito
        // Cancelar seleção atual
        deselectAllUnits();
        cancelPlacingBuilding();
    }
}

// Mover a câmera ao arrastar o mapa
function onMouseMove(event) {
    event.preventDefault();
    
    // Atualizar a posição do mouse para raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Verificar se está arrastando o mapa
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        
        // Mover a câmera com base na diferença do mouse
        camera.position.x -= deltaX * 0.1;
        camera.position.z += deltaY * 0.1;
        
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
    
    // Preview de construção se estiver no modo de colocação
    if (currentPlacementBuilding) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([terrainGroup], true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            currentPlacementBuilding.position.set(
                Math.round(point.x / 10) * 10,
                0,
                Math.round(point.z / 10) * 10
            );
            
            // Verificar se pode construir
            const canBuild = checkCanBuildHere(currentPlacementBuilding);
            
            // Atualizar material de visualização
            currentPlacementBuilding.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color.set(canBuild ? 0x88ff88 : 0xff8888);
                        });
                    } else {
                        child.material.color.set(canBuild ? 0x88ff88 : 0xff8888);
                    }
                }
            });
        }
    } else {
        // Verificar hover sobre objetos interativos
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Resetar hover
        if (hoverObject) {
            // Remove o efeito de hover do objeto anterior
            hoverObject.traverse(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.set(0x000000);
                }
            });
            hoverObject = null;
        }
        
        // Checar novos objetos para hover
        if (intersects.length > 0) {
            for (let i = 0; i < intersects.length; i++) {
                const object = getParentWithUserData(intersects[i].object);
                
                if (object && (object.userData.type === 'unit' || 
                               object.userData.type === 'resource' || 
                               object.userData.type === 'building')) {
                    // Aplicar efeito de hover
                    object.traverse(child => {
                        if (child.isMesh && child.material && child.material.emissive) {
                            child.material.emissive.set(0x333333);
                        }
                    });
                    
                    hoverObject = object;
                    break;
                }
            }
        }
    }
}

// Parar o arrasto do mapa
function onMouseUp() {
    isDragging = false;
}

function createTerrain() {
    // Criar um plano grande para o terreno base
    const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    const terrainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x81C784,  // Verde claro
        roughness: 0.7,
        metalness: 0.1 
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2; // Rotar para ficar na horizontal
    terrain.receiveShadow = true;
    scene.add(terrain);
    
    // Adicionar diferentes biomas
    createBiomes();
}

function createBiomes() {
    // Criar biomas em estilo AoE2
    const biomes = [
        { type: 'forest', color: 0x2E7D32, count: 5, size: 100 },
        { type: 'desert', color: 0xFFF176, count: 2, size: 120 },
        { type: 'mountain', color: 0x757575, count: 3, size: 90 },
        { type: 'water', color: 0x42A5F5, count: 2, size: 80 }
    ];
    
    // Criar uma rede de estradas/caminhos que conectam as áreas
    createRoads();
    
    biomes.forEach(biome => {
        for (let i = 0; i < biome.count; i++) {
            // Distribuir biomas de forma mais organizada em um padrão circular
            const angle = (i / biome.count) * Math.PI * 2;
            const distance = 200 + Math.random() * 100;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const size = biome.size * (0.7 + Math.random() * 0.6);
            
            createBiome(biome.type, biome.color, x, z, size);
        }
    });
}

function createBiome(type, color, x, z, size) {
    // Criar bioma com forma mais natural e irregular
    const segments = 16;
    const noise = [];
    
    // Gerar ruído para bordas irregulares
    for (let i = 0; i <= segments; i++) {
        noise.push(0.7 + Math.random() * 0.6);
    }
    
    // Criar pontos para a forma irregular
    const shape = new THREE.Shape();
    
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const radius = size * noise[i];
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        
        if (i === 0) {
            shape.moveTo(px, pz);
        } else {
            shape.lineTo(px, pz);
        }
    }
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    
    const biomeMesh = new THREE.Mesh(geometry, material);
    biomeMesh.rotation.x = -Math.PI / 2;
    biomeMesh.position.set(x, 0.2, z);
    biomeMesh.receiveShadow = true;
    scene.add(biomeMesh);
    
    // Adicionar elementos específicos do bioma
    switch (type) {
        case 'forest':
            addForestElements(x, z, size);
            break;
        case 'desert':
            addDesertElements(x, z, size);
            break;
        case 'mountain':
            addMountainElements(x, z, size);
            break;
        case 'water':
            addWaterElements(x, z, size);
            break;
    }
}

function addForestElements(x, z, size) {
    // Adicionar árvores em padrão denso
    const treeCount = Math.floor(size / 10);
    
    for (let i = 0; i < treeCount; i++) {
        // Distribuição circular irregular
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * size * 0.7;
        const posX = x + Math.cos(angle) * distance;
        const posZ = z + Math.sin(angle) * distance;
        
        // Tamanho variável das árvores
        const scale = 0.7 + Math.random() * 0.6;
        const treeType = Math.random() > 0.3 ? 'oak' : 'pine';
        
        addTree(posX, posZ, scale, treeType);
    }
}

function addTree(x, z, scale = 1, type = 'oak') {
    // Árvores diferentes baseadas no tipo
    if (type === 'oak') {
        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 7.5 * scale, z);
        trunk.scale.set(scale, scale, scale);
        trunk.castShadow = true;
        scene.add(trunk);
        
        // Copa (várias esferas sobrepostas para parecer mais natural)
        const leavesCount = 3;
        for (let i = 0; i < leavesCount; i++) {
            const radius = 8 - i;
            const leavesGeometry = new THREE.SphereGeometry(radius, 8, 8);
            const leavesColor = i === 0 ? 0x2E7D32 : 0x388E3C; // Tons variados de verde
            const leavesMaterial = new THREE.MeshStandardMaterial({ color: leavesColor });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            
            leaves.position.set(x, (15 + radius - i*2) * scale, z);
            leaves.scale.set(scale, scale * 0.8, scale);
            leaves.castShadow = true;
            scene.add(leaves);
        }
    } else {
        // Pinheiro
        const trunkGeometry = new THREE.CylinderGeometry(1.5, 2, 20, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 10 * scale, z);
        trunk.scale.set(scale, scale, scale);
        trunk.castShadow = true;
        scene.add(trunk);
        
        // Copas de pinheiro (cones empilhados)
        const levels = 4;
        for (let i = 0; i < levels; i++) {
            const coneGeometry = new THREE.ConeGeometry(8 - i, 10, 8);
            const coneMaterial = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
            
            cone.position.set(x, (20 + i * 6) * scale, z);
            cone.scale.set(scale, scale, scale);
            cone.castShadow = true;
            scene.add(cone);
        }
    }
}

function addDesertElements(x, z, size) {
    // Adicionar cactos e pedras
    const elementCount = Math.floor(size / 20);
    
    for (let i = 0; i < elementCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * size * 0.7;
        const posX = x + Math.cos(angle) * distance;
        const posZ = z + Math.sin(angle) * distance;
        
        if (Math.random() > 0.6) {
            // Cacto
            addCactus(posX, posZ, 0.7 + Math.random() * 0.6);
        } else {
            // Pedra do deserto
            const rockGeometry = new THREE.DodecahedronGeometry(3 + Math.random() * 2, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xD4B996, // Cor de areia amarelada
                roughness: 0.9,
                metalness: 0.1
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(posX, 2 + Math.random() * 2, posZ);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            scene.add(rock);
        }
    }
    
    // Adicionar ondulações na areia
    for (let i = 0; i < 8; i++) {
        const waveGeometry = new THREE.PlaneGeometry(size * 0.3, size * 0.05);
        const waveMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFE082, // Tom mais claro de areia
            side: THREE.DoubleSide
        });
        
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * size * 0.4;
        wave.position.set(
            x + Math.cos(angle) * distance, 
            0.3, 
            z + Math.sin(angle) * distance
        );
        
        wave.rotation.x = -Math.PI / 2;
        wave.rotation.z = Math.random() * Math.PI;
        
        scene.add(wave);
    }
}

function addMountainElements(x, z, size) {
    // Adicionar montanhas
    const peakCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < peakCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * size * 0.5;
        const posX = x + Math.cos(angle) * distance;
        const posZ = z + Math.sin(angle) * distance;
        
        // Montanha com altura variável
        const height = 20 + Math.random() * 30;
        const radius = 15 + Math.random() * 10;
        
        const mountainGeometry = new THREE.ConeGeometry(radius, height, 8);
        const mountainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x757575,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(posX, height/2, posZ);
        mountain.castShadow = true;
        scene.add(mountain);
        
        // Pico com neve
        const snowCapGeometry = new THREE.ConeGeometry(radius * 0.4, height * 0.2, 8);
        const snowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            roughness: 0.5,
            metalness: 0.1
        });
        
        const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
        snowCap.position.set(posX, height * 0.9, posZ);
        snowCap.castShadow = true;
        scene.add(snowCap);
        
        // Adicionar algumas rochas na base
        const rockCount = 3 + Math.floor(Math.random() * 4);
        for (let j = 0; j < rockCount; j++) {
            const rockAngle = Math.random() * Math.PI * 2;
            const rockDist = radius * 0.7 + Math.random() * (radius * 0.3);
            const rockX = posX + Math.cos(rockAngle) * rockDist;
            const rockZ = posZ + Math.sin(rockAngle) * rockDist;
            
            addRock(rockX, rockZ, 0.8 + Math.random() * 0.4);
        }
    }
}

function addWaterElements(x, z, size) {
    // Adicionar efeito de água com ondulações
    const waterGeometry = new THREE.PlaneGeometry(size, size, 16, 16);
    
    // Modificar os vértices para criar ondulações
    const vertices = waterGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 1] = Math.sin(vertices[i] / 20) * Math.cos(vertices[i + 2] / 20) * 2;
    }
    
    waterGeometry.computeVertexNormals();
    
    const waterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x42A5F5,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2,
        metalness: 0.1
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, 0, z);
    scene.add(water);
    
    // Adicionar algumas pedras/rochas nas bordas
    const rockCount = Math.floor(size / 20);
    
    for (let i = 0; i < rockCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = size * 0.4 + Math.random() * (size * 0.1);
        const posX = x + Math.cos(angle) * distance;
        const posZ = z + Math.sin(angle) * distance;
        
        addRock(posX, posZ, 0.5 + Math.random() * 0.5);
    }
    
    // Adicionar alguns arbustos/vegetação nas margens
    const bushCount = Math.floor(size / 25);
    
    for (let i = 0; i < bushCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = size * 0.45 + Math.random() * (size * 0.1);
        const posX = x + Math.cos(angle) * distance;
        const posZ = z + Math.sin(angle) * distance;
        
        // Criar arbusto
        const bushGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
        const bushMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x66BB6A
        });
        
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(posX, 1.5, posZ);
        bush.scale.set(1, 0.7, 1);
        bush.castShadow = true;
        scene.add(bush);
    }
}

function createRoads() {
    // Criar rede de estradas/caminhos conectando as principais áreas
    const roadWidth = 10;
    const roadColor = 0xD7CCC8;
    
    // Caminho principal central
    const mainRoadLength = 800;
    const mainRoadGeometry = new THREE.PlaneGeometry(roadWidth, mainRoadLength);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: roadColor,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    
    const mainRoadNS = new THREE.Mesh(mainRoadGeometry, roadMaterial);
    mainRoadNS.rotation.x = -Math.PI / 2;
    mainRoadNS.position.set(0, 0.1, 0);
    scene.add(mainRoadNS);
    
    const mainRoadEW = new THREE.Mesh(mainRoadGeometry, roadMaterial);
    mainRoadEW.rotation.x = -Math.PI / 2;
    mainRoadEW.rotation.z = Math.PI / 2;
    mainRoadEW.position.set(0, 0.1, 0);
    scene.add(mainRoadEW);
    
    // Caminhos diagonais
    const diagonalLength = 400;
    const diagonalGeometry = new THREE.PlaneGeometry(roadWidth, diagonalLength);
    
    const diagonalNESW = new THREE.Mesh(diagonalGeometry, roadMaterial);
    diagonalNESW.rotation.x = -Math.PI / 2;
    diagonalNESW.rotation.z = Math.PI / 4;
    diagonalNESW.position.set(0, 0.1, 0);
    scene.add(diagonalNESW);
    
    const diagonalNWSE = new THREE.Mesh(diagonalGeometry, roadMaterial);
    diagonalNWSE.rotation.x = -Math.PI / 2;
    diagonalNWSE.rotation.z = -Math.PI / 4;
    diagonalNWSE.position.set(0, 0.1, 0);
    scene.add(diagonalNWSE);
}

function addDemoObjects() {
    // Limpar objetos existentes
    scene.children.forEach(child => {
        if (child.userData && child.userData.isGameObject) {
            scene.remove(child);
        }
    });
    
    // Criar um grupo para a cidade
    const villageGroup = new THREE.Group();
    villageGroup.userData = { isGameObject: true };
    scene.add(villageGroup);
    
    // Adicionar Town Center (centro da cidade)
    createTownCenter(0, 0);
    
    // Adicionar casas em volta
    createHouse(-60, 50, 1.2);
    createHouse(-80, 20, 1);
    createHouse(-40, 30, 1.1);
    createHouse(60, 30, 1);
    createHouse(40, 50, 0.9);
    
    // Adicionar fazendas
    createFarm(50, -50);
    createFarm(90, -50);
    createFarm(50, -90);
    createFarm(90, -90);
    
    // Adicionar muro parcial
    createWallSegment(-20, 80, 100, 10);
    createWallSegment(-70, 30, 10, 60);
    createGate(-20, 30);
    
    // Recursos próximos
    createResourceArea('wood', -120, -40, 15);
    createResourceArea('stone', 120, 80, 10);
    createResourceArea('gold', -100, 120, 8);
    createResourceArea('berries', 100, -140, 12);
    
    // Adicionar unidades
    createVillager(20, 20, 'farmer');
    createVillager(-20, 20, 'lumberjack');
    createVillager(-30, -20, 'miner');
    createSoldier(30, -30);
}

function createTownCenter(x, z) {
    // Criar Town Center no estilo AoE2
    const townCenter = new THREE.Group();
    townCenter.position.set(x, 0, z);
    townCenter.userData = { isGameObject: true, type: 'building', name: 'Town Center' };
    
    // Base do Town Center
    const baseGeometry = new THREE.BoxGeometry(60, 6, 60);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xA1887F,
        roughness: 0.8
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 3, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    townCenter.add(base);
    
    // Segundo andar
    const secondFloorGeometry = new THREE.BoxGeometry(50, 20, 50);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xD7CCC8,
        roughness: 0.9
    });
    
    const secondFloor = new THREE.Mesh(secondFloorGeometry, wallMaterial);
    secondFloor.position.set(0, 16, 0);
    secondFloor.castShadow = true;
    secondFloor.receiveShadow = true;
    townCenter.add(secondFloor);
    
    // Telhado do Town Center
    const roofGeometry = new THREE.ConeGeometry(40, 20, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x795548,
        roughness: 0.7
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 36, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    townCenter.add(roof);
    
    // Bandeira no topo
    const flagpoleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
    const flagpoleMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
    const flagpole = new THREE.Mesh(flagpoleGeometry, flagpoleMaterial);
    flagpole.position.set(0, 51, 0);
    townCenter.add(flagpole);
    
    const flagGeometry = new THREE.PlaneGeometry(8, 4);
    const flagMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3F51B5,
        side: THREE.DoubleSide
    });
    
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(4, 49, 0);
    flag.rotation.y = Math.PI / 2;
    townCenter.add(flag);
    
    // Detalhes da fachada
    // Porta principal
    const doorGeometry = new THREE.BoxGeometry(10, 15, 1);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 8, 25.5);
    townCenter.add(door);
    
    // Janelas
    for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
            if (i === 0 && j === 1) continue; // Pular onde está a porta
            
            const windowGeometry = new THREE.BoxGeometry(8, 8, 1);
            const windowMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xBBDEFB,
                transparent: true,
                opacity: 0.7
            });
            
            const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
            window1.position.set(i * 15, 18, j * 25);
            
            // Rotacionar as janelas de acordo com a posição
            if (j === 0) {
                window1.rotation.y = Math.PI / 2;
            }
            
            townCenter.add(window1);
        }
    }
    
    scene.add(townCenter);
}

function addToggle3DButton() {
    // Verificar se o botão já existe
    let toggle3DBtn = document.getElementById('toggle-3d-btn');
    
    if (!toggle3DBtn) {
        toggle3DBtn = document.createElement('button');
        toggle3DBtn.id = 'toggle-3d-btn';
        toggle3DBtn.textContent = 'Mudar para 2D';
        toggle3DBtn.style.position = 'absolute';
        toggle3DBtn.style.top = '10px';
        toggle3DBtn.style.right = '10px';
        toggle3DBtn.style.zIndex = '1000';
        toggle3DBtn.style.padding = '8px 12px';
        toggle3DBtn.style.backgroundColor = '#4CAF50';
        toggle3DBtn.style.color = 'white';
        toggle3DBtn.style.border = 'none';
        toggle3DBtn.style.borderRadius = '4px';
        toggle3DBtn.style.cursor = 'pointer';
        
        let is3DView = true;
        
        toggle3DBtn.addEventListener('click', () => {
            is3DView = !is3DView;
            toggle3DBtn.textContent = is3DView ? 'Mudar para 2D' : 'Mudar para 3D';
            
            if (is3DView) {
                // Alternar para visualização 3D
                threeJsContainer.style.display = 'block';
                camera.position.set(300, 200, 300);
                camera.lookAt(0, 0, 0);
            } else {
                // Alternar para visualização 2D (topo)
                threeJsContainer.style.display = 'none';
                camera.position.set(0, 500, 0);
                camera.lookAt(0, 0, 0);
            }
        });
        
        document.body.appendChild(toggle3DBtn);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

const canvas = document.getElementById('game-canvas');
if (canvas) {
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left; // Coordenada X no canvas
        const y = event.clientY - rect.top; // Coordenada Y no canvas

        // Chame a função para construir a casa na posição (x, y)
        if (window.gameClient) {
            window.gameClient.buildHouseAt(x, y);
        }
    });
}

// Inicializar apenas quando a página estiver totalmente carregada
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function addCactus(x, z, scale = 1) {
    // Criar um grupo para o cacto
    const cactusGroup = new THREE.Group();
    cactusGroup.position.set(x, 0, z);
    cactusGroup.scale.set(scale, scale, scale);
    
    // Corpo principal do cacto
    const mainBodyGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 8);
    const cactusMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2E7D32,
        roughness: 0.8
    });
    
    const mainBody = new THREE.Mesh(mainBodyGeometry, cactusMaterial);
    mainBody.position.set(0, 7.5, 0);
    mainBody.castShadow = true;
    cactusGroup.add(mainBody);
    
    // Número aleatório de braços (1-3)
    const armsCount = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < armsCount; i++) {
        // Posição do braço no corpo principal
        const height = 4 + Math.random() * 8;
        const angle = Math.random() * Math.PI * 2;
        
        // Braço
        const armGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        const arm = new THREE.Mesh(armGeometry, cactusMaterial);
        
        // Posicionar no corpo principal
        arm.position.set(
            Math.cos(angle) * 2.5,
            height,
            Math.sin(angle) * 2.5
        );
        
        // Rotacionar para fora
        arm.rotation.z = Math.cos(angle) * (Math.PI / 3);
        arm.rotation.x = Math.sin(angle) * (Math.PI / 3);
        
        arm.castShadow = true;
        cactusGroup.add(arm);
    }
    
    scene.add(cactusGroup);
}

function addRock(x, z, scale = 1) {
    // Criar pedra com geometria irregular
    const geometry = new THREE.DodecahedronGeometry(4 + Math.random() * 3, 1);
    
    // Aplicar ruído aos vértices para deixar mais natural
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i] += (Math.random() - 0.5) * 1.5;
        vertices[i + 1] += (Math.random() - 0.5) * 1.5;
        vertices[i + 2] += (Math.random() - 0.5) * 1.5;
    }
    
    geometry.computeVertexNormals();
    
    // Cor da pedra aleatória variando entre cinza e marrom
    const grayness = 0.4 + Math.random() * 0.3;
    const rockColor = new THREE.Color(grayness, grayness * 0.9, grayness * 0.8);
    
    if (Math.random() > 0.7) {
        // Algumas pedras mais marrons
        rockColor.setRGB(0.5 + Math.random() * 0.2, 0.4 + Math.random() * 0.1, 0.3 + Math.random() * 0.1);
    }
    
    const material = new THREE.MeshStandardMaterial({ 
        color: rockColor,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const rock = new THREE.Mesh(geometry, material);
    rock.position.set(x, 2 * scale, z);
    rock.scale.set(scale, scale, scale);
    
    // Rotacionar aleatoriamente
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    scene.add(rock);
    
    // Às vezes adicionar pedras menores ao redor
    if (Math.random() > 0.6) {
        const smallRocksCount = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < smallRocksCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 4 + Math.random() * 3;
            const smallRockX = x + Math.cos(angle) * distance;
            const smallRockZ = z + Math.sin(angle) * distance;
            
            const smallGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 1.5, 0);
            const smallRock = new THREE.Mesh(smallGeometry, material);
            
            smallRock.position.set(smallRockX, 1 * scale, smallRockZ);
            smallRock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            smallRock.castShadow = true;
            scene.add(smallRock);
        }
    }
}

function createHouse(x, z, scale = 1) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);
    house.scale.set(scale, scale, scale);
    house.userData = { isGameObject: true, type: 'building', name: 'House' };
    
    // Base da casa
    const baseGeometry = new THREE.BoxGeometry(25, 12, 20);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xD7CCC8, // Cor clara para as paredes
        roughness: 0.8
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 6, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    house.add(base);
    
    // Telhado
    const roofGeometry = new THREE.ConeGeometry(20, 10, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x795548, // Marrom para o telhado
        roughness: 0.7
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 17, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);
    
    // Porta
    const doorGeometry = new THREE.BoxGeometry(5, 8, 1);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 4, 10.5);
    house.add(door);
    
    // Janelas
    const windowGeometry = new THREE.BoxGeometry(4, 4, 1);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xBBDEFB,
        transparent: true,
        opacity: 0.7
    });
    
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-7, 7, 10.1);
    house.add(window1);
    
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(7, 7, 10.1);
    house.add(window2);
    
    // Detalhes estruturais
    // Vigas de madeira cruzadas na fachada
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    
    // Viga horizontal
    const hBeamGeometry = new THREE.BoxGeometry(25, 1, 0.5);
    const hBeam = new THREE.Mesh(hBeamGeometry, beamMaterial);
    hBeam.position.set(0, 9, 10.3);
    house.add(hBeam);
    
    // Vigas verticais
    const vBeamGeometry = new THREE.BoxGeometry(1, 12, 0.5);
    
    for (let i = -1; i <= 1; i++) {
        const vBeam = new THREE.Mesh(vBeamGeometry, beamMaterial);
        vBeam.position.set(i * 8, 6, 10.3);
        house.add(vBeam);
    }
    
    scene.add(house);
}

function createFarm(x, z) {
    const farm = new THREE.Group();
    farm.position.set(x, 0, z);
    farm.userData = { isGameObject: true, type: 'building', name: 'Farm' };
    
    // Terra cultivada
    const fieldGeometry = new THREE.PlaneGeometry(40, 40);
    const fieldMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8D6E63, // Marrom escuro para a terra
        roughness: 1.0,
        side: THREE.DoubleSide
    });
    
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.position.set(0, 0.1, 0);
    farm.add(field);
    
    // Criar fileiras de plantação
    const rowCount = 5;
    const rowSpacing = 30 / rowCount;
    
    for (let i = 0; i < rowCount; i++) {
        const posZ = (i - rowCount/2 + 0.5) * rowSpacing;
        
        const rowGeometry = new THREE.BoxGeometry(35, 0.5, 2);
        const rowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFDD835, // Amarelo para as plantações de trigo
            roughness: 1.0
        });
        
        const row = new THREE.Mesh(rowGeometry, rowMaterial);
        row.position.set(0, 0.3, posZ);
        farm.add(row);
        
        // Adicionar plantas nas fileiras
        for (let j = -4; j <= 4; j++) {
            if (Math.random() > 0.2) { // Nem todos os espaços têm plantas
                const plantGeometry = new THREE.CylinderGeometry(0.2, 0, 3, 8);
                const plantMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xAED581 // Verde claro para as plantas
                });
                
                const plant = new THREE.Mesh(plantGeometry, plantMaterial);
                plant.position.set(j * 4, 1.5, posZ);
                farm.add(plant);
            }
        }
    }
    
    // Cerca ao redor da fazenda
    createFarmFence(farm);
    
    scene.add(farm);
}

function createFarmFence(farmGroup) {
    const fenceSize = 38;
    const postSpacing = 5;
    const postCount = Math.floor(fenceSize / postSpacing) + 1;
    
    const postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
    const railGeometry = new THREE.BoxGeometry(postSpacing, 0.4, 0.4);
    
    const woodMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8D6E63,
        roughness: 1.0
    });
    
    // Criar os lados da cerca
    for (let side = 0; side < 4; side++) {
        for (let i = 0; i < postCount; i++) {
            // Calcular a posição do poste
            const position = -fenceSize/2 + i * postSpacing;
            let posX, posZ;
            
            switch(side) {
                case 0: // Lado norte
                    posX = position;
                    posZ = -fenceSize/2;
                    break;
                case 1: // Lado leste
                    posX = fenceSize/2;
                    posZ = position;
                    break;
                case 2: // Lado sul
                    posX = position;
                    posZ = fenceSize/2;
                    break;
                case 3: // Lado oeste
                    posX = -fenceSize/2;
                    posZ = position;
                    break;
            }
            
            // Criar poste
            const post = new THREE.Mesh(postGeometry, woodMaterial);
            post.position.set(posX, 1.5, posZ);
            post.castShadow = true;
            farmGroup.add(post);
            
            // Adicionar trilhos horizontais entre os postes (exceto no último poste)
            if (i < postCount - 1) {
                for (let railHeight = 0; railHeight < 2; railHeight++) {
                    const rail = new THREE.Mesh(railGeometry, woodMaterial);
                    
                    // Posicionar o trilho dependendo do lado
                    if (side === 0 || side === 2) {
                        rail.position.set(position + postSpacing/2, 1 + railHeight, posZ);
                    } else {
                        rail.position.set(posX, 1 + railHeight, position + postSpacing/2);
                        rail.rotation.y = Math.PI / 2;
                    }
                    
                    rail.castShadow = true;
                    farmGroup.add(rail);
                }
            }
        }
    }
}

function createWallSegment(x, z, width, depth) {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(x, 0, z);
    wallGroup.userData = { isGameObject: true, type: 'building', name: 'Wall' };
    
    // Base do muro
    const baseGeometry = new THREE.BoxGeometry(width, 10, depth);
    const stoneMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x9E9E9E,
        roughness: 0.8
    });
    
    const base = new THREE.Mesh(baseGeometry, stoneMaterial);
    base.position.set(0, 5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    wallGroup.add(base);
    
    // Merlões (ameias) no topo do muro
    const merlonCount = Math.floor(width / 5);
    const merlonWidth = width / merlonCount;
    
    for (let i = 0; i < merlonCount; i++) {
        const posX = -width/2 + merlonWidth/2 + i * merlonWidth;
        
        const merlonGeometry = new THREE.BoxGeometry(merlonWidth * 0.8, 2, depth);
        const merlon = new THREE.Mesh(merlonGeometry, stoneMaterial);
        merlon.position.set(posX, 11, 0);
        wallGroup.add(merlon);
    }
    
    scene.add(wallGroup);
}

function createGate(x, z) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(x, 0, z);
    gateGroup.userData = { isGameObject: true, type: 'building', name: 'Gate' };
    
    // Torres do portão
    const towerGeometry = new THREE.BoxGeometry(15, 20, 15);
    const stoneMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x9E9E9E,
        roughness: 0.8
    });
    
    // Torre esquerda
    const leftTower = new THREE.Mesh(towerGeometry, stoneMaterial);
    leftTower.position.set(-20, 10, 0);
    leftTower.castShadow = true;
    leftTower.receiveShadow = true;
    gateGroup.add(leftTower);
    
    // Torre direita
    const rightTower = new THREE.Mesh(towerGeometry, stoneMaterial);
    rightTower.position.set(20, 10, 0);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    gateGroup.add(rightTower);
    
    // Seção superior do portão
    const topSectionGeometry = new THREE.BoxGeometry(55, 5, 15);
    const topSection = new THREE.Mesh(topSectionGeometry, stoneMaterial);
    topSection.position.set(0, 17.5, 0);
    topSection.castShadow = true;
    topSection.receiveShadow = true;
    gateGroup.add(topSection);
    
    // Portão (portas)
    const gateGeometry = new THREE.BoxGeometry(20, 15, 2);
    const gateMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5D4037,
        roughness: 0.7
    });
    
    const gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(0, 7.5, 0);
    gate.castShadow = true;
    gateGroup.add(gate);
    
    // Detalhes metálicos do portão
    const metalMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x616161,
        roughness: 0.5,
        metalness: 0.8
    });
    
    // Reforços horizontais
    for (let i = 0; i < 3; i++) {
        const reinforcementGeometry = new THREE.BoxGeometry(20, 0.5, 2.2);
        const reinforcement = new THREE.Mesh(reinforcementGeometry, metalMaterial);
        reinforcement.position.set(0, 3 + i * 5, 0);
        gateGroup.add(reinforcement);
    }
    
    scene.add(gateGroup);
}

function createResourceArea(type, x, z, count) {
    const resourceGroup = new THREE.Group();
    resourceGroup.position.set(x, 0, z);
    resourceGroup.userData = { isGameObject: true, type: 'resource', name: type };
    
    const radius = count * 3;
    
    // Distribuir recursos em um padrão circular
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const distance = radius * (0.4 + Math.random() * 0.6);
        const posX = Math.cos(angle) * distance;
        const posZ = Math.sin(angle) * distance;
        
        switch (type) {
            case 'wood':
                // Criar árvores para madeira
                addTree(x + posX, z + posZ, 0.9 + Math.random() * 0.3, 
                        Math.random() > 0.7 ? 'pine' : 'oak');
                break;
                
            case 'stone':
                // Criar pedras
                const stoneScale = 1 + Math.random() * 0.8;
                addRock(x + posX, z + posZ, stoneScale);
                break;
                
            case 'gold':
                // Criar depósitos de ouro
                createGoldDeposit(x + posX, z + posZ, 0.7 + Math.random() * 0.6);
                break;
                
            case 'berries':
                // Criar arbustos de frutas
                createBerryBush(x + posX, z + posZ, 0.8 + Math.random() * 0.4);
                break;
        }
    }
    
    scene.add(resourceGroup);
}

function createGoldDeposit(x, z, scale) {
    // Base da rocha
    const rockGeometry = new THREE.DodecahedronGeometry(4, 1);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x757575,
        roughness: 0.8
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 2 * scale, z);
    rock.scale.set(scale, scale, scale);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    rock.castShadow = true;
    scene.add(rock);
    
    // Veios de ouro na rocha
    const goldCount = 3 + Math.floor(Math.random() * 4);
    const goldMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        roughness: 0.3,
        metalness: 0.8
    });
    
    for (let i = 0; i < goldCount; i++) {
        const goldGeometry = new THREE.SphereGeometry(1, 8, 8);
        const gold = new THREE.Mesh(goldGeometry, goldMaterial);
        
        // Posicionar o ouro na superfície da rocha
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI;
        
        const radius = 3.8 * scale;
        gold.position.set(
            x + Math.cos(angle1) * Math.sin(angle2) * radius,
            2 * scale + Math.cos(angle2) * radius,
            z + Math.sin(angle1) * Math.sin(angle2) * radius
        );
        
        gold.scale.set(scale * 0.5, scale * 0.2, scale * 0.5);
        gold.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        scene.add(gold);
    }
}

function createBerryBush(x, z, scale) {
    // Arbusto
    const bushGeometry = new THREE.SphereGeometry(3, 8, 8);
    const bushMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x33691E, // Verde escuro
        roughness: 0.9
    });
    
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, 3 * scale, z);
    bush.scale.set(scale, scale * 0.8, scale);
    bush.castShadow = true;
    scene.add(bush);
    
    // Adicionar bagas/frutas
    const berryCount = 5 + Math.floor(Math.random() * 10);
    const berryMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xE53935, // Vermelho para as bagas
        roughness: 0.5
    });
    
    for (let i = 0; i < berryCount; i++) {
        const berryGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const berry = new THREE.Mesh(berryGeometry, berryMaterial);
        
        // Posicionar as bagas na superfície do arbusto
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI;
        
        const radius = 3 * scale;
        berry.position.set(
            x + Math.cos(angle1) * Math.sin(angle2) * radius,
            3 * scale + Math.cos(angle2) * radius,
            z + Math.sin(angle1) * Math.sin(angle2) * radius
        );
        
        scene.add(berry);
    }
}

function createVillager(x, z, type = 'farmer') {
    const villager = new THREE.Group();
    villager.position.set(x, 0, z);
    villager.userData = { isGameObject: true, type: 'unit', name: 'Villager' };
    
    // Corpo do villager
    const bodyGeometry = new THREE.CylinderGeometry(2, 1.5, 6, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x795548,
        roughness: 0.8
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 5, 0);
    body.castShadow = true;
    villager.add(body);
    
    // Cabeça
    const headGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFE0B2, // Cor de pele clara
        roughness: 0.5
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 10, 0);
    head.castShadow = true;
    villager.add(head);
    
    // Braços
    const armGeometry = new THREE.BoxGeometry(1, 4, 1);
    const armMaterial = new THREE.MeshStandardMaterial({ 
        color: bodyMaterial.color,
        roughness: 0.8
    });
    
    // Braço esquerdo
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-2, 7, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    villager.add(leftArm);
    
    // Braço direito
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(2, 7, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    villager.add(rightArm);
    
    // Pernas
    const legGeometry = new THREE.BoxGeometry(1.2, 4, 1.2);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3E2723, // Marrom escuro
        roughness: 0.8
    });
    
    // Perna esquerda
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-1, 1, 0);
    leftLeg.castShadow = true;
    villager.add(leftLeg);
    
    // Perna direita
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(1, 1, 0);
    rightLeg.castShadow = true;
    villager.add(rightLeg);
    
    // Adicionar ferramentas baseadas no tipo
    switch(type) {
        case 'farmer':
            // Adicionar enxada
            const hoeGeometry = new THREE.BoxGeometry(0.5, 6, 0.5);
            const hoeBladGeometry = new THREE.BoxGeometry(2, 0.5, 1);
            const toolMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 }); // Marrom para madeira
            const metalMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x9E9E9E,
                metalness: 0.7,
                roughness: 0.4
            });
            
            const hoeHandle = new THREE.Mesh(hoeGeometry, toolMaterial);
            hoeHandle.position.set(3, 7, 1);
            hoeHandle.rotation.set(0, 0, -Math.PI / 4);
            villager.add(hoeHandle);
            
            const hoeBlade = new THREE.Mesh(hoeBladGeometry, metalMaterial);
            hoeBlade.position.set(5, 4.5, 1);
            hoeBlade.rotation.set(0, 0, -Math.PI / 2);
            villager.add(hoeBlade);
            break;
            
        case 'lumberjack':
            // Adicionar machado
            const axeHandleGeometry = new THREE.BoxGeometry(0.5, 5, 0.5);
            const axeBladeGeometry = new THREE.ConeGeometry(1.5, 3, 4);
            const axeToolMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
            const axeMetalMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x9E9E9E,
                metalness: 0.7,
                roughness: 0.4
            });
            
            const axeHandle = new THREE.Mesh(axeHandleGeometry, axeToolMaterial);
            axeHandle.position.set(3, 7, 1);
            axeHandle.rotation.set(0, 0, -Math.PI / 4);
            villager.add(axeHandle);
            
            const axeBlade = new THREE.Mesh(axeBladeGeometry, axeMetalMaterial);
            axeBlade.position.set(4.5, 5.5, 1);
            axeBlade.rotation.set(0, 0, Math.PI / 2);
            villager.add(axeBlade);
            break;
            
        case 'miner':
            // Adicionar picareta
            const pickaxeHandleGeometry = new THREE.BoxGeometry(0.5, 5, 0.5);
            const pickaxeHeadGeometry = new THREE.CylinderGeometry(0.1, 1, 3, 4);
            const pickaxeToolMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
            const pickaxeMetalMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x9E9E9E,
                metalness: 0.7,
                roughness: 0.4
            });
            
            const pickaxeHandle = new THREE.Mesh(pickaxeHandleGeometry, pickaxeToolMaterial);
            pickaxeHandle.position.set(3, 7, 1);
            pickaxeHandle.rotation.set(0, 0, -Math.PI / 4);
            villager.add(pickaxeHandle);
            
            const pickaxeHead = new THREE.Mesh(pickaxeHeadGeometry, pickaxeMetalMaterial);
            pickaxeHead.position.set(5, 5, 1);
            pickaxeHead.rotation.set(Math.PI / 2, Math.PI / 2, 0);
            villager.add(pickaxeHead);
            break;
    }
    
    // Rotacionar o villager aleatoriamente
    villager.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(villager);
}

function createSoldier(x, z) {
    const soldier = new THREE.Group();
    soldier.position.set(x, 0, z);
    soldier.userData = { isGameObject: true, type: 'unit', name: 'Soldier' };
    
    // Corpo do soldado (mais robusto que o villager)
    const bodyGeometry = new THREE.CylinderGeometry(2.2, 1.8, 6, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3F51B5, // Azul para uniforme
        roughness: 0.8
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 5, 0);
    body.castShadow = true;
    soldier.add(body);
    
    // Cabeça com capacete
    const headGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFE0B2, // Cor de pele clara
        roughness: 0.5
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 10, 0);
    head.castShadow = true;
    soldier.add(head);
    
    // Capacete
    const helmetGeometry = new THREE.CylinderGeometry(2, 1.8, 2, 8);
    const helmetMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x9E9E9E,
        metalness: 0.7,
        roughness: 0.3
    });
    
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(0, 11, 0);
    helmet.castShadow = true;
    soldier.add(helmet);
    
    // Detalhes do capacete (penacho)
    const plumageGeometry = new THREE.BoxGeometry(0.5, 3, 0.5);
    const plumageMaterial = new THREE.MeshStandardMaterial({ color: 0xE53935 }); // Vermelho
    
    const plumage = new THREE.Mesh(plumageGeometry, plumageMaterial);
    plumage.position.set(0, 13.5, 0);
    plumage.castShadow = true;
    soldier.add(plumage);
    
    // Braços
    const armGeometry = new THREE.BoxGeometry(1.2, 4, 1.2);
    const armMaterial = new THREE.MeshStandardMaterial({ 
        color: bodyMaterial.color,
        roughness: 0.8
    });
    
    // Braço esquerdo (segurando escudo)
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-2.5, 7, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    soldier.add(leftArm);
    
    // Escudo
    const shieldGeometry = new THREE.BoxGeometry(1, 5, 5);
    const shieldMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1976D2,
        roughness: 0.7
    });
    
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.set(-4, 7, 0);
    shield.castShadow = true;
    soldier.add(shield);
    
    // Braço direito (segurando espada)
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(2.5, 7, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    soldier.add(rightArm);
    
    // Espada
    const swordHandleGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const swordBladeGeometry = new THREE.BoxGeometry(0.5, 5, 0.2);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
    const bladeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xE0E0E0,
        metalness: 0.8,
        roughness: 0.2
    });
    
    const swordHandle = new THREE.Mesh(swordHandleGeometry, handleMaterial);
    swordHandle.position.set(4, 8, 0);
    swordHandle.castShadow = true;
    soldier.add(swordHandle);
    
    const swordBlade = new THREE.Mesh(swordBladeGeometry, bladeMaterial);
    swordBlade.position.set(4, 11.5, 0);
    swordBlade.castShadow = true;
    soldier.add(swordBlade);
    
    // Pernas
    const legGeometry = new THREE.BoxGeometry(1.4, 4, 1.4);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x303F9F, // Azul escuro
        roughness: 0.8
    });
    
    // Perna esquerda
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-1.2, 1, 0);
    leftLeg.castShadow = true;
    soldier.add(leftLeg);
    
    // Perna direita
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(1.2, 1, 0);
    rightLeg.castShadow = true;
    soldier.add(rightLeg);
    
    // Rotacionar o soldado aleatoriamente
    soldier.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(soldier);
}

// Criar menu para construções
function createBuildingMenu() {
    const buildingMenu = document.createElement('div');
    buildingMenu.id = 'building-menu';
    buildingMenu.style.position = 'absolute';
    buildingMenu.style.bottom = '10px';
    buildingMenu.style.left = '50%';
    buildingMenu.style.transform = 'translateX(-50%)';
    buildingMenu.style.display = 'flex';
    buildingMenu.style.gap = '10px';
    buildingMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    buildingMenu.style.padding = '10px';
    buildingMenu.style.borderRadius = '5px';
    buildingMenu.style.zIndex = '50';
    
    // Botões para diferentes tipos de edifícios
    const buildings = [
        { name: 'House', icon: '🏠', cost: { wood: 30, stone: 0, gold: 0 } },
        { name: 'Farm', icon: '🌾', cost: { wood: 20, stone: 0, gold: 0 } },
        { name: 'TownCenter', icon: '🏛️', cost: { wood: 200, stone: 100, gold: 0 } },
        { name: 'Barracks', icon: '⚔️', cost: { wood: 150, stone: 50, gold: 0 } },
        { name: 'Wall', icon: '🧱', cost: { wood: 0, stone: 10, gold: 0 } },
        { name: 'Gate', icon: '🚪', cost: { wood: 30, stone: 10, gold: 0 } },
    ];
    
    buildings.forEach(building => {
        const btn = document.createElement('button');
        btn.style.width = '60px';
        btn.style.height = '60px';
        btn.style.fontSize = '24px';
        btn.style.backgroundColor = '#333';
        btn.style.border = '1px solid #555';
        btn.style.borderRadius = '5px';
        btn.style.color = 'white';
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.style.position = 'relative';
        
        // Ícone
        const icon = document.createElement('div');
        icon.textContent = building.icon;
        icon.style.fontSize = '24px';
        
        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px';
        tooltip.style.borderRadius = '3px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.display = 'none';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.fontSize = '12px';
        tooltip.style.marginBottom = '5px';
        tooltip.innerHTML = `
            <div>${building.name}</div>
            <div>
                ${building.cost.wood > 0 ? `🪵 ${building.cost.wood}` : ''}
                ${building.cost.stone > 0 ? `🪨 ${building.cost.stone}` : ''}
                ${building.cost.gold > 0 ? `💰 ${building.cost.gold}` : ''}
            </div>
        `;
        
        btn.appendChild(icon);
        btn.appendChild(tooltip);
        
        // Mostrar tooltip ao passar o mouse
        btn.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
        });
        
        btn.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
        
        // Iniciar colocação do edifício ao clicar
        btn.addEventListener('click', () => {
            // Verificar recursos
            if (!checkResources(building.cost)) {
                showNotification('Recursos insuficientes para construir ' + building.name);
                return;
            }
            
            startPlacingBuilding(building.name);
        });
        
        buildingMenu.appendChild(btn);
    });
    
    document.body.appendChild(buildingMenu);
}

// Iniciar colocação do edifício
// Iniciar o processo de colocação de um edifício
function startPlacingBuilding(buildingType) {
    // Cancelar qualquer colocação atual
    cancelPlacingBuilding();
    
    // Criar preview de acordo com o tipo
    let preview;
    switch(buildingType) {
        case 'House':
            preview = createHousePreview();
            break;
        case 'Farm':
            preview = createFarmPreview();
            break;
        case 'TownCenter':
            preview = createTownCenterPreview();
            break;
        case 'Barracks':
            preview = createBarracksPreview();
            break;
        case 'Wall':
            preview = createWallPreview();
            break;
        case 'Gate':
            preview = createGatePreview();
            break;
        default:
            preview = createHousePreview();
    }
    
    // Configurar a preview
    preview.userData.type = 'building';
    preview.userData.buildingType = buildingType;
    preview.userData.isPreview = true;
    preview.userData.underConstruction = true;
    
    // Definir material semitransparente para a preview
    preview.traverse(child => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.transparent = true;
                    mat.opacity = 0.5;
                });
            } else {
                child.material.transparent = true;
                child.material.opacity = 0.5;
            }
        }
    });
    
    // Adicionar à cena
    scene.add(preview);
    currentPlacementBuilding = preview;
    
    // Mudar o cursor
    document.body.style.cursor = 'crosshair';
    
    showNotification(`Escolha um local para construir ${buildingType}`);
}

// Verificar recursos para criação de unidades
function hasEnoughResourcesForUnit(unitType) {
    switch(unitType) {
        case 'villager':
        case 'lumberjack':
        case 'miner':
            return resources.food >= 50;
        case 'soldier':
            return resources.food >= 60 && resources.gold >= 20;
        default:
            return false;
    }
}

// Deduzir recursos para criação de unidades
function deductResourcesForUnit(unitType) {
    switch(unitType) {
        case 'villager':
        case 'lumberjack':
        case 'miner':
            resources.food -= 50;
            break;
        case 'soldier':
            resources.food -= 60;
            resources.gold -= 20;
            break;
    }
    
    // Atualizar exibição dos recursos
    updateResourceDisplay();
}

// Criar um quartel
function createBarracks(x, z) {
    const barracks = new THREE.Group();
    barracks.position.set(x, 0, z);
    barracks.userData = { isGameObject: true, type: 'building', name: 'Barracks' };
    
    // Base do quartel
    const baseGeometry = new THREE.BoxGeometry(40, 15, 40);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8D6E63,
        roughness: 0.8
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 7.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    barracks.add(base);
    
    // Telhado
    const roofGeometry = new THREE.ConeGeometry(35, 15, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5D4037,
        roughness: 0.7
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 22.5, 0);
    roof.rotation.y = Math.PI / 4;
    barracks.add(roof);
    
    // Porta
    const doorGeometry = new THREE.BoxGeometry(10, 12, 1);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3E2723 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 6, 20.5);
    barracks.add(door);
    
    // Janelas
    const windowGeometry = new THREE.BoxGeometry(6, 6, 1);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xBBDEFB,
        transparent: true,
        opacity: 0.7
    });
    
    // Adicionar janelas nas laterais
    for (let i = -1; i <= 1; i += 2) {
        const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(15 * i, 8, 15);
        window1.rotation.y = Math.PI / 2;
        barracks.add(window1);
        
        const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(15 * i, 8, -15);
        window2.rotation.y = Math.PI / 2;
        barracks.add(window2);
    }
    
    // Adicionar bandeira
    const poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 35, 0);
    barracks.add(pole);
    
    const flagGeometry = new THREE.PlaneGeometry(8, 4);
    const flagMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xE53935,
        side: THREE.DoubleSide
    });
    
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(4, 33, 0);
    flag.rotation.y = Math.PI / 2;
    barracks.add(flag);
    
    scene.add(barracks);
}

// Obter o objeto pai com userData
function getParentWithUserData(object) {
    let current = object;
    
    while (current !== null) {
        if (current.userData && current.userData.type) {
            return current;
        }
        
        current = current.parent;
    }
    
    return null;
}

// Selecionar uma unidade
function selectUnit(unit) {
    if (!selectedUnits.includes(unit)) {
        selectedUnits.push(unit);
        
        // Criar um indicador visual para a unidade selecionada
        const selectionRing = new THREE.Mesh(
            new THREE.RingGeometry(5, 5.5, 32),
            new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                side: THREE.DoubleSide
            })
        );
        
        selectionRing.rotation.x = -Math.PI / 2; // Colocar paralelo ao solo
        selectionRing.position.y = 0.1; // Ligeiramente acima do solo
        selectionRing.name = 'selectionRing';
        
        unit.add(selectionRing);
        
        // Mostrar painel de informações da unidade
        showUnitInfo(unit);
    }
}

// Desselecionar todas as unidades
function deselectAllUnits() {
    selectedUnits.forEach(unit => {
        // Remover indicador visual
        const selectionRing = unit.getObjectByName('selectionRing');
        if (selectionRing) {
            unit.remove(selectionRing);
        }
    });
    
    selectedUnits = [];
    
    // Esconder painel de informações
    hideUnitInfo();
}

// Mostrar informações da unidade selecionada
function showUnitInfo(unit) {
    // Remover painel antigo se existir
    const oldPanel = document.getElementById('unit-info-panel');
    if (oldPanel) {
        oldPanel.remove();
    }
    
    // Criar novo painel
    const panel = document.createElement('div');
    panel.id = 'unit-info-panel';
    panel.style.position = 'absolute';
    panel.style.bottom = '150px';
    panel.style.left = '50%';
    panel.style.transform = 'translateX(-50%)';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.borderRadius = '5px';
    panel.style.zIndex = '100';
    panel.style.minWidth = '200px';
    panel.style.textAlign = 'center';
    
    // Conteúdo do painel
    let unitType = 'Desconhecido';
    let unitIcon = '👤';
    
    if (unit.userData.name === 'Villager') {
        unitType = 'Aldeão';
        switch(unit.userData.role) {
            case 'farmer':
                unitIcon = '👨‍🌾';
                break;
            case 'lumberjack':
                unitIcon = '🪓';
                break;
            case 'miner':
                unitIcon = '⛏️';
                break;
            default:
                unitIcon = '👨‍🌾';
        }
    } else if (unit.userData.name === 'Soldier') {
        unitType = 'Soldado';
        unitIcon = '⚔️';
    }
    
    panel.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 5px;">${unitIcon}</div>
        <div style="font-weight: bold; margin-bottom: 5px;">${unitType}</div>
        <div>${selectedUnits.length} unidade(s) selecionada(s)</div>
    `;
    
    // Adicionar botões de ação se for aldeão
    if (unit.userData.name === 'Villager') {
        const actionDiv = document.createElement('div');
        actionDiv.style.marginTop = '10px';
        actionDiv.style.display = 'flex';
        actionDiv.style.justifyContent = 'center';
        actionDiv.style.gap = '5px';
        
        // Botões de ação
        const actions = [
            { name: 'Coletar', icon: '🌲', action: 'gather' },
            { name: 'Construir', icon: '🏗️', action: 'build' },
            { name: 'Parar', icon: '⏹️', action: 'stop' }
        ];
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.textContent = action.icon;
            btn.title = action.name;
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.fontSize = '20px';
            btn.style.backgroundColor = '#333';
            btn.style.border = '1px solid #555';
            btn.style.borderRadius = '5px';
            btn.style.color = 'white';
            btn.style.cursor = 'pointer';
            
            btn.addEventListener('click', () => {
                setUnitTask(action.action);
            });
            
            actionDiv.appendChild(btn);
        });
        
        panel.appendChild(actionDiv);
    }
    
    document.body.appendChild(panel);
}

// Esconder painel de informações da unidade
function hideUnitInfo() {
    const panel = document.getElementById('unit-info-panel');
    if (panel) {
        panel.remove();
    }
}

// Definir tarefa para as unidades selecionadas
function setUnitTask(taskType) {
    currentTask = taskType;
    
    if (taskType === 'stop') {
        // Parar todas as unidades selecionadas
        selectedUnits.forEach(unit => {
            stopUnit(unit);
        });
        
        currentTask = null;
        showNotification('Unidades paradas');
    } else {
        // Mudar cursor para indicar modo de seleção
        document.body.style.cursor = 'crosshair';
        
        showNotification(`Selecione alvo para ${taskType === 'gather' ? 'coletar' : 'construir'}`);
    }
}

// Parar uma unidade
function stopUnit(unit) {
    // Remover qualquer tarefa atual
    clearInterval(unit.userData.taskInterval);
    unit.userData.task = null;
    unit.userData.taskTarget = null;
    
    // Remover das atribuições
    Object.keys(assignments).forEach(resourceType => {
        const index = assignments[resourceType].indexOf(unit);
        if (index !== -1) {
            assignments[resourceType].splice(index, 1);
        }
    });
}

// Mover as unidades selecionadas para uma posição
function moveSelectedUnitsTo(position) {
    if (selectedUnits.length === 0) return;
    
    // Distribuir unidades em formação ao redor do ponto
    const unitCount = selectedUnits.length;
    const radius = Math.max(5, Math.sqrt(unitCount) * 5);
    
    selectedUnits.forEach((unit, index) => {
        // Calcular posição em círculo
        const angle = (index / unitCount) * Math.PI * 2;
        const unitRadius = radius * Math.sqrt(Math.random()); // Distribuição uniforme
        const offsetX = Math.cos(angle) * unitRadius;
        const offsetZ = Math.sin(angle) * unitRadius;
        
        // Definir posição final
        const targetPosition = new THREE.Vector3(
            position.x + offsetX,
            0, // manter no solo
            position.z + offsetZ
        );
        
        // Parar qualquer tarefa atual
        stopUnit(unit);
        
        // Inicio da animação de movimento
        const startPosition = unit.position.clone();
        const distance = startPosition.distanceTo(targetPosition);
        const duration = distance * 100; // ajustar velocidade
        const startTime = Date.now();
        
        // Animar movimento
        const moveInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Interpolação linear
            unit.position.x = startPosition.x + (targetPosition.x - startPosition.x) * progress;
            unit.position.z = startPosition.z + (targetPosition.z - startPosition.z) * progress;
            
            // Rotacionar na direção do movimento
            if (progress < 1) {
                const direction = new THREE.Vector3(
                    targetPosition.x - unit.position.x,
                    0,
                    targetPosition.z - unit.position.z
                ).normalize();
                
                const angle = Math.atan2(direction.x, direction.z);
                unit.rotation.y = angle;
            }
            
            // Completar movimento
            if (progress >= 1) {
                clearInterval(moveInterval);
            }
        }, 16);
        
        unit.userData.moveInterval = moveInterval;
    });
}

// Atribuir unidades selecionadas a uma tarefa
function assignUnitsToTask(target) {
    if (selectedUnits.length === 0) return;
    
    if (currentTask === 'gather') {
        // Atribuir para coleta de recursos
        if (target.userData.type === 'resource') {
            assignToResource(target);
        } else {
            showNotification('Selecione um recurso para coletar');
        }
    } else if (currentTask === 'build') {
        // Atribuir para construção
        if (target.userData.type === 'building' && target.userData.underConstruction) {
            assignToBuild(target);
        } else {
            showNotification('Selecione uma construção incompleta');
        }
    } else {
        // Sem tarefa específica, mover para o alvo
        moveSelectedUnitsTo(target.position);
    }
    
    // Limpar tarefa atual
    currentTask = null;
    document.body.style.cursor = 'default';
}

// Atribuir aldeões para coletar recursos
function assignToResource(resource) {
    const resourceType = resource.userData.name;
    
    // Filtrar apenas aldeões
    const villagers = selectedUnits.filter(unit => unit.userData.name === 'Villager');
    
    if (villagers.length === 0) {
        showNotification('Apenas aldeões podem coletar recursos');
        return;
    }
    
    // Parar unidades e adicionar à lista de atribuições
    villagers.forEach(villager => {
        stopUnit(villager);
        
        // Mover para o recurso
        const resourcePosition = resource.position.clone();
        const offsetDistance = 15;
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();
        
        const harvestPosition = new THREE.Vector3(
            resourcePosition.x + direction.x * offsetDistance,
            0,
            resourcePosition.z + direction.z * offsetDistance
        );
        
        // Início da animação
        const startPosition = villager.position.clone();
        const distance = startPosition.distanceTo(harvestPosition);
        const duration = distance * 100;
        const startTime = Date.now();
        
        const moveInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Interpolação linear
            villager.position.x = startPosition.x + (harvestPosition.x - startPosition.x) * progress;
            villager.position.z = startPosition.z + (harvestPosition.z - startPosition.z) * progress;
            
            // Rotacionar na direção do recurso
            const lookDirection = new THREE.Vector3(
                resourcePosition.x - villager.position.x,
                0,
                resourcePosition.z - villager.position.z
            ).normalize();
            
            const angle = Math.atan2(lookDirection.x, lookDirection.z);
            villager.rotation.y = angle;
            
            // Completar movimento e iniciar coleta
            if (progress >= 1) {
                clearInterval(moveInterval);
                startResourceGathering(villager, resource, resourceType);
            }
        }, 16);
        
        villager.userData.moveInterval = moveInterval;
    });
    
    showNotification(`${villagers.length} aldeões atribuídos à coleta de ${resourceTypeToPortuguese(resourceType)}`);
}

// Converter tipo de recurso para português
function resourceTypeToPortuguese(type) {
    switch(type) {
        case 'wood': return 'madeira';
        case 'stone': return 'pedra';
        case 'gold': return 'ouro';
        case 'berries': return 'frutas';
        case 'farm': return 'fazenda';
        default: return type;
    }
}

// Iniciar coleta de recursos
function startResourceGathering(villager, resource, resourceType) {
    // Atualizar função do aldeão
    switch(resourceType) {
        case 'wood':
            villager.userData.role = 'lumberjack';
            break;
        case 'stone':
        case 'gold':
            villager.userData.role = 'miner';
            break;
        case 'berries':
        case 'farm':
            villager.userData.role = 'farmer';
            break;
    }
    
    // Adicionar à lista de atribuições
    if (resourceType === 'farm') {
        assignments.farms.push(villager);
    } else {
        assignments[resourceType].push(villager);
    }
    
    // Definir tarefa e alvo
    villager.userData.task = 'gathering';
    villager.userData.taskTarget = resource;
    
    // Definir intervalo de coleta
    const gatherInterval = setInterval(() => {
        // Verificar se o recurso ainda existe
        if (!resource.parent) {
            stopUnit(villager);
            return;
        }
        
        // Coletar recursos de acordo com o tipo
        if (resourceType === 'wood') {
            resources.wood += 1;
        } else if (resourceType === 'stone') {
            resources.stone += 1;
        } else if (resourceType === 'gold') {
            resources.gold += 1;
        } else if (resourceType === 'berries' || resourceType === 'farm') {
            resources.food += 1;
        }
        
        // Atualizar interface
        updateResourceDisplay();
        
        // Animação simples de coleta
        const arm = villager.getObjectByName('rightArm');
        if (arm) {
            // Animar braço
            arm.rotation.z = -Math.PI / 3 + Math.sin(Date.now() * 0.01) * 0.2;
        }
    }, 1000); // Coletar a cada segundo
    
    villager.userData.taskInterval = gatherInterval;
}

// ... existing code ... 

// Função para atribuir aldeões a construir
function assignToBuild(building) {
    // Filtrar apenas aldeões
    const villagers = selectedUnits.filter(unit => unit.userData.name === 'Villager');
    
    if (villagers.length === 0) {
        showNotification('Apenas aldeões podem construir');
        return;
    }
    
    // Parar as unidades atuais
    villagers.forEach(villager => {
        stopUnit(villager);
        
        // Mover para a construção
        const buildingPosition = building.position.clone();
        const offsetDistance = 20;
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();
        
        const buildPosition = new THREE.Vector3(
            buildingPosition.x + direction.x * offsetDistance,
            0,
            buildingPosition.z + direction.z * offsetDistance
        );
        
        // Início da animação
        const startPosition = villager.position.clone();
        const distance = startPosition.distanceTo(buildPosition);
        const duration = distance * 100;
        const startTime = Date.now();
        
        const moveInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Interpolação linear
            villager.position.x = startPosition.x + (buildPosition.x - startPosition.x) * progress;
            villager.position.z = startPosition.z + (buildPosition.z - startPosition.z) * progress;
            
            // Rotacionar na direção da construção
            const lookDirection = new THREE.Vector3(
                buildingPosition.x - villager.position.x,
                0,
                buildingPosition.z - villager.position.z
            ).normalize();
            
            const angle = Math.atan2(lookDirection.x, lookDirection.z);
            villager.rotation.y = angle;
            
            // Completar movimento e iniciar construção
            if (progress >= 1) {
                clearInterval(moveInterval);
                startBuilding(villager, building);
            }
        }, 16);
        
        villager.userData.moveInterval = moveInterval;
    });
    
    showNotification(`${villagers.length} aldeões atribuídos à construção`);
}

// ... existing code ... 

// Iniciar processo de construção
function startBuilding(villager, building) {
    // Definir tarefa e alvo
    villager.userData.task = 'building';
    villager.userData.taskTarget = building;
    
    // Obter o progresso atual da construção
    let buildProgress = building.userData.buildProgress || 0;
    building.userData.buildProgress = buildProgress;
    
    // Verificar se já tem animação de construção
    if (!building.userData.buildAnimation) {
        // Criar animação de construção
        building.userData.buildAnimation = true;
        
        // Animar a construção (aumentar altura)
        building.scale.y = 0.1;
        
        // Opacidade inicial
        building.traverse(child => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.transparent = true;
                        mat.opacity = 0.5;
                    });
                } else {
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            }
        });
    }
    
    // Definir intervalo de construção
    const buildInterval = setInterval(() => {
        // Verificar se o edifício ainda existe
        if (!building.parent) {
            stopUnit(villager);
            return;
        }
        
        // Atualizar progresso de construção
        buildProgress += 0.01;
        building.userData.buildProgress = buildProgress;
        
        // Animar o villager (movimento de braço)
        const arm = villager.getObjectByName('rightArm');
        if (arm) {
            arm.rotation.z = -Math.PI / 3 + Math.sin(Date.now() * 0.01) * 0.3;
        }
        
        // Animar a construção
        building.scale.y = Math.min(1, 0.1 + buildProgress * 0.9);
        
        // Atualizar opacidade
        const opacity = 0.5 + buildProgress * 0.5;
        building.traverse(child => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.opacity = opacity;
                    });
                } else {
                    child.material.opacity = opacity;
                }
            }
        });
        
        // Verificar se a construção está concluída
        if (buildProgress >= 1) {
            // Construção concluída
            building.userData.underConstruction = false;
            building.userData.buildAnimation = false;
            
            // Restaurar opacidade total
            building.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1;
                        });
                    } else {
                        child.material.transparent = false;
                        child.material.opacity = 1;
                    }
                }
            });
            
            // Adicionar o edifício à lista apropriada
            if (building.userData.buildingType === 'House') {
                buildings.houses.push(building);
                population.max += 5;
                updatePopulationDisplay();
            } else if (building.userData.buildingType === 'Farm') {
                buildings.farms.push(building);
            } else if (building.userData.buildingType === 'TownCenter') {
                buildings.townCenters.push(building);
                population.max += 15;
                updatePopulationDisplay();
            } else if (building.userData.buildingType === 'Barracks') {
                buildings.barracks.push(building);
            }
            
            // Parar a construção
            stopUnit(villager);
            clearInterval(buildInterval);
            
            // Notificar o jogador
            showNotification(`${building.userData.buildingType} concluído!`);
        }
    }, 500); // Construção a cada meio segundo
    
    villager.userData.taskInterval = buildInterval;
}

// ... existing code ... 

// Verificar se é possível construir em determinada posição
function checkCanBuildHere(building) {
    // Obter o tamanho do edifício
    const buildingType = building.userData.buildingType;
    let sizeX = 20, sizeZ = 20; // Tamanho padrão
    
    // Definir tamanhos diferentes para cada tipo de edifício
    if (buildingType === 'TownCenter') {
        sizeX = 60;
        sizeZ = 60;
    } else if (buildingType === 'House') {
        sizeX = 20;
        sizeZ = 20;
    } else if (buildingType === 'Farm') {
        sizeX = 30;
        sizeZ = 30;
    } else if (buildingType === 'Barracks') {
        sizeX = 40;
        sizeZ = 40;
    } else if (buildingType === 'Wall') {
        sizeX = 10;
        sizeZ = 10;
    } else if (buildingType === 'Gate') {
        sizeX = 20;
        sizeZ = 20;
    }
    
    // Criar um box para verificar colisões
    const position = building.position.clone();
    const buildBox = new THREE.Box3().setFromCenterAndSize(
        position,
        new THREE.Vector3(sizeX, 10, sizeZ)
    );
    
    // Verificar colisão com água (não pode construir na água)
    const waterIntersects = raycaster.intersectObjects(biomeGroup.children.filter(obj => obj.userData.biome === 'water'), true);
    if (waterIntersects.length > 0 && waterIntersects[0].distance < 5) {
        return false;
    }
    
    // Verificar colisão com outros edifícios
    for (const buildingType in buildings) {
        for (const otherBuilding of buildings[buildingType]) {
            // Ignorar a própria construção
            if (otherBuilding === building) continue;
            
            // Obter o tamanho do outro edifício
            let otherSizeX = 20, otherSizeZ = 20;
            
            if (otherBuilding.userData.buildingType === 'TownCenter') {
                otherSizeX = 60;
                otherSizeZ = 60;
            } else if (otherBuilding.userData.buildingType === 'House') {
                otherSizeX = 20;
                otherSizeZ = 20;
            } else if (otherBuilding.userData.buildingType === 'Farm') {
                otherSizeX = 30;
                otherSizeZ = 30;
            } else if (otherBuilding.userData.buildingType === 'Barracks') {
                otherSizeX = 40;
                otherSizeZ = 40;
            } else if (otherBuilding.userData.buildingType === 'Wall') {
                otherSizeX = 10;
                otherSizeZ = 10;
            } else if (otherBuilding.userData.buildingType === 'Gate') {
                otherSizeX = 20;
                otherSizeZ = 20;
            }
            
            // Criar um box para o outro edifício
            const otherPosition = otherBuilding.position.clone();
            const otherBox = new THREE.Box3().setFromCenterAndSize(
                otherPosition,
                new THREE.Vector3(otherSizeX, 10, otherSizeZ)
            );
            
            // Verificar interseção
            if (buildBox.intersectsBox(otherBox)) {
                return false;
            }
        }
    }
    
    // Verificar colisão com recursos
    // Árvores, rochas, etc.
    const resourceObjects = [
        ...assignments.wood.map(unit => unit.userData.taskTarget),
        ...assignments.stone.map(unit => unit.userData.taskTarget),
        ...assignments.gold.map(unit => unit.userData.taskTarget),
        ...assignments.berries.map(unit => unit.userData.taskTarget)
    ].filter(resource => resource !== null);
    
    for (const resource of resourceObjects) {
        const resourcePosition = resource.position.clone();
        const resourceBox = new THREE.Box3().setFromCenterAndSize(
            resourcePosition,
            new THREE.Vector3(15, 10, 15)
        );
        
        // Verificar interseção
        if (buildBox.intersectsBox(resourceBox)) {
            return false;
        }
    }
    
    // Não há colisões, pode construir
    return true;
}

// Inicializar a interface com os menus de construção e criação de unidades
function initUI() {
    // Criar o menu de construção
    createBuildingMenu();
    
    // Criar o menu de unidades
    createUnitMenu();
    
    // Inicializar elementos UI
    initResourceDisplay();
    
    // Criar o botão de alternar entre 2D e 3D
    createToggleButton();
    
    // Criar área de notificações
    createNotificationArea();
}

// Verificar se há recursos suficientes
function checkResources(cost) {
    if (resources.wood < cost.wood) return false;
    if (resources.stone < cost.stone) return false;
    if (resources.gold < cost.gold) return false;
    return true;
}

// Deduzir recursos ao construir
function deductResources(cost) {
    resources.wood -= cost.wood;
    resources.stone -= cost.stone;
    resources.gold -= cost.gold;
    updateResourceDisplay();
}

// Colocar o edifício no mapa
function placeBuilding(mouse, building) {
    raycaster.setFromCamera(mouse, camera);
    // Usar scene.children para garantir que todos os objetos sejam considerados na interseção
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        // Verificar se pode construir aqui
        const canBuild = checkCanBuildHere(building);
        
        if (!canBuild) {
            showNotification('Não é possível construir aqui');
            return;
        }
        
        // Deduzir recursos
        const cost = getBuildingCost(building.userData.buildingType);
        deductResources(cost);
        
        // Criar o edifício real baseado na preview
        let realBuilding;
        
        switch(building.userData.buildingType) {
            case 'House':
                realBuilding = createHouse(building.position.x, building.position.z);
                // Adicionar à lista de casas
                buildings.houses.push(realBuilding);
                // Aumentar a população máxima
                population.max += 5;
                updatePopulationDisplay();
                break;
            case 'Farm':
                realBuilding = createFarm(building.position.x, building.position.z);
                buildings.farms.push(realBuilding);
                break;
            case 'TownCenter':
                realBuilding = createTownCenter(building.position.x, building.position.z);
                buildings.townCenters.push(realBuilding);
                // Aumentar a população máxima
                population.max += 15;
                updatePopulationDisplay();
                break;
            case 'Barracks':
                realBuilding = createBarracks(building.position.x, building.position.z);
                buildings.barracks.push(realBuilding);
                break;
            case 'Wall':
                realBuilding = createWall(building.position.x, building.position.z);
                buildings.walls.push(realBuilding);
                break;
            case 'Gate':
                realBuilding = createGate(building.position.x, building.position.z);
                buildings.gates.push(realBuilding);
                break;
            default:
                realBuilding = createHouse(building.position.x, building.position.z);
                buildings.houses.push(realBuilding);
        }
        
        // Configurar o edifício real
        realBuilding.userData.type = 'building';
        realBuilding.userData.buildingType = building.userData.buildingType;
        realBuilding.userData.underConstruction = true;
        
        // Cancelar modo de colocação
        cancelPlacingBuilding();
        
        // Mostrar mensagem ao usuário
        showNotification(`${building.userData.buildingType} em construção! Atribua aldeões para concluir.`);
    }
}

// Obter custo do edifício
function getBuildingCost(buildingType) {
    switch(buildingType) {
        case 'House':
            return { wood: 30, stone: 0, gold: 0 };
        case 'Farm':
            return { wood: 20, stone: 0, gold: 0 };
        case 'TownCenter':
            return { wood: 200, stone: 100, gold: 0 };
        case 'Barracks':
            return { wood: 150, stone: 50, gold: 0 };
        case 'Wall':
            return { wood: 0, stone: 10, gold: 0 };
        case 'Gate':
            return { wood: 30, stone: 10, gold: 0 };
        default:
            return { wood: 0, stone: 0, gold: 0 };
    }
}

// Criar menu de unidades
function createUnitMenu() {
    const unitMenu = document.createElement('div');
    unitMenu.id = 'unit-menu';
    unitMenu.style.position = 'absolute';
    unitMenu.style.bottom = '90px';
    unitMenu.style.left = '50%';
    unitMenu.style.transform = 'translateX(-50%)';
    unitMenu.style.display = 'flex';
    unitMenu.style.gap = '10px';
    unitMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    unitMenu.style.padding = '10px';
    unitMenu.style.borderRadius = '5px';
    unitMenu.style.zIndex = '50';
    
    // Botões para diferentes tipos de unidades
    const units = [
        { name: 'Villager', icon: '👨‍🌾', cost: { food: 50, gold: 0 } },
        { name: 'Lumberjack', icon: '🪓', cost: { food: 50, gold: 0 } },
        { name: 'Miner', icon: '⛏️', cost: { food: 50, gold: 0 } },
        { name: 'Soldier', icon: '⚔️', cost: { food: 60, gold: 20 } }
    ];
    
    units.forEach(unit => {
        const btn = document.createElement('button');
        btn.style.width = '60px';
        btn.style.height = '60px';
        btn.style.fontSize = '24px';
        btn.style.backgroundColor = '#333';
        btn.style.border = '1px solid #555';
        btn.style.borderRadius = '5px';
        btn.style.color = 'white';
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.style.position = 'relative';
        
        // Ícone
        const icon = document.createElement('div');
        icon.textContent = unit.icon;
        icon.style.fontSize = '24px';
        
        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px';
        tooltip.style.borderRadius = '3px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.display = 'none';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.fontSize = '12px';
        tooltip.style.marginBottom = '5px';
        tooltip.innerHTML = `
            <div>${unit.name}</div>
            <div>
                🍖 ${unit.cost.food}
                ${unit.cost.gold > 0 ? `💰 ${unit.cost.gold}` : ''}
            </div>
        `;
        
        btn.appendChild(icon);
        btn.appendChild(tooltip);
        
        // Mostrar tooltip ao passar o mouse
        btn.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
        });
        
        btn.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
        
        // Criar unidade ao clicar
        btn.addEventListener('click', () => {
            // Verificar recursos
            if (!checkResources(unit.cost)) {
                showNotification('Recursos insuficientes para criar ' + unit.name);
                return;
            }
            
            // Verificar população
            if (population.current >= population.max) {
                showNotification('População máxima atingida. Construa mais casas!');
                return;
            }
            
            // Verificar se há um centro da cidade para criar unidades
            if (buildings.townCenters.length === 0) {
                showNotification('É necessário um Centro da Cidade para criar unidades');
                return;
            }
            
            // Criar unidade
            createNewUnit(unit.name);
            
            // Deduzir recursos
            deductResources(unit.cost);
            
            // Incrementar população
            population.current++;
            updatePopulationDisplay();
            
            showNotification(`${unit.name} criado`);
        });
        
        unitMenu.appendChild(btn);
    });
    
    document.body.appendChild(unitMenu);
}

// Criar nova unidade
function createNewUnit(unitType) {
    // Encontrar a posição do centro da cidade
    const townCenter = buildings.townCenters[0];
    
    // Posição inicial da unidade (próxima ao centro da cidade)
    const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        0,
        (Math.random() - 0.5) * 30
    );
    
    const position = new THREE.Vector3(
        townCenter.position.x + offset.x,
        0,
        townCenter.position.z + offset.z
    );
    
    // Criar a unidade
    let unit;
    
    switch(unitType) {
        case 'Villager':
            unit = createVillager(position.x, position.z);
            unit.userData.role = 'farmer';
            break;
        case 'Lumberjack':
            unit = createVillager(position.x, position.z);
            unit.userData.role = 'lumberjack';
            break;
        case 'Miner':
            unit = createVillager(position.x, position.z);
            unit.userData.role = 'miner';
            break;
        case 'Soldier':
            unit = createSoldier(position.x, position.z);
            break;
        default:
            unit = createVillager(position.x, position.z);
    }
    
    // Adicionar à cena
    scene.add(unit);
}

// Criar área de notificações
function createNotificationArea() {
    const area = document.createElement('div');
    area.id = 'notification-area';
    area.style.position = 'absolute';
    area.style.top = '10px';
    area.style.right = '10px';
    area.style.width = '300px';
    area.style.maxHeight = '200px';
    area.style.overflow = 'hidden';
    area.style.display = 'flex';
    area.style.flexDirection = 'column';
    area.style.gap = '5px';
    area.style.zIndex = '100';
    
    document.body.appendChild(area);
}

// Inicializar recursos visuais
function initResourceDisplay() {
    const resourcesPanel = document.createElement('div');
    resourcesPanel.id = 'resources-panel';
    resourcesPanel.style.position = 'absolute';
    resourcesPanel.style.top = '10px';
    resourcesPanel.style.left = '10px';
    resourcesPanel.style.display = 'flex';
    resourcesPanel.style.gap = '15px';
    resourcesPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    resourcesPanel.style.padding = '10px';
    resourcesPanel.style.borderRadius = '5px';
    resourcesPanel.style.zIndex = '50';
    
    // Recursos
    const resourceTypes = [
        { name: 'food', icon: '🍖', id: 'food-count' },
        { name: 'wood', icon: '🪵', id: 'wood-count' },
        { name: 'stone', icon: '🪨', id: 'stone-count' },
        { name: 'gold', icon: '💰', id: 'gold-count' }
    ];
    
    resourceTypes.forEach(resource => {
        const resourceDiv = document.createElement('div');
        resourceDiv.className = 'resource';
        resourceDiv.style.display = 'flex';
        resourceDiv.style.alignItems = 'center';
        resourceDiv.style.gap = '5px';
        
        const icon = document.createElement('span');
        icon.textContent = resource.icon;
        icon.style.fontSize = '24px';
        
        const count = document.createElement('span');
        count.id = resource.id;
        count.textContent = resources[resource.name];
        count.className = 'resource-high';
        count.style.fontSize = '18px';
        count.style.fontWeight = 'bold';
        
        resourceDiv.appendChild(icon);
        resourceDiv.appendChild(count);
        resourcesPanel.appendChild(resourceDiv);
    });
    
    // População
    const populationDiv = document.createElement('div');
    populationDiv.className = 'resource';
    populationDiv.style.display = 'flex';
    populationDiv.style.alignItems = 'center';
    populationDiv.style.gap = '5px';
    populationDiv.style.marginLeft = '15px';
    populationDiv.style.borderLeft = '1px solid #555';
    populationDiv.style.paddingLeft = '15px';
    
    const popIcon = document.createElement('span');
    popIcon.textContent = '👨‍👩‍👧‍👦';
    popIcon.style.fontSize = '24px';
    
    const popCount = document.createElement('span');
    popCount.id = 'population-count';
    popCount.textContent = `${population.current}/${population.max}`;
    popCount.className = 'resource-high';
    popCount.style.fontSize = '18px';
    popCount.style.fontWeight = 'bold';
    
    populationDiv.appendChild(popIcon);
    populationDiv.appendChild(popCount);
    resourcesPanel.appendChild(populationDiv);
    
    document.body.appendChild(resourcesPanel);
    
    // Atualizar exibição inicial
    updateResourceDisplay();
    updatePopulationDisplay();
}

// Funções de previsualização de edifícios
function createHousePreview() {
    const preview = new THREE.Group();
    
    // Base da casa
    const baseGeometry = new THREE.BoxGeometry(20, 10, 20);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xD7CCC8 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 5, 0);
    preview.add(base);
    
    // Telhado da casa
    const roofGeometry = new THREE.ConeGeometry(15, 10, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x795548 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 15, 0);
    roof.rotation.y = Math.PI / 4;
    preview.add(roof);
    
    return preview;
}

function createFarmPreview() {
    const preview = new THREE.Group();
    
    // Base da fazenda (campo plano)
    const fieldGeometry = new THREE.PlaneGeometry(30, 30);
    const fieldMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8D6E63, 
        side: THREE.DoubleSide 
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.position.y = 0.1;
    preview.add(field);
    
    // Cerca em volta da fazenda
    const fenceHeight = 2;
    const fenceWidth = 1;
    const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0xA1887F });
    
    // Criar 4 lados da cerca
    const fenceSideGeometry1 = new THREE.BoxGeometry(30, fenceHeight, fenceWidth);
    const fenceSide1 = new THREE.Mesh(fenceSideGeometry1, fenceMaterial);
    fenceSide1.position.set(0, fenceHeight/2, 15);
    preview.add(fenceSide1);
    
    const fenceSide2 = new THREE.Mesh(fenceSideGeometry1, fenceMaterial);
    fenceSide2.position.set(0, fenceHeight/2, -15);
    preview.add(fenceSide2);
    
    const fenceSideGeometry2 = new THREE.BoxGeometry(fenceWidth, fenceHeight, 30);
    const fenceSide3 = new THREE.Mesh(fenceSideGeometry2, fenceMaterial);
    fenceSide3.position.set(15, fenceHeight/2, 0);
    preview.add(fenceSide3);
    
    const fenceSide4 = new THREE.Mesh(fenceSideGeometry2, fenceMaterial);
    fenceSide4.position.set(-15, fenceHeight/2, 0);
    preview.add(fenceSide4);
    
    return preview;
}

function createTownCenterPreview() {
    const preview = new THREE.Group();
    
    // Base do centro da cidade
    const baseGeometry = new THREE.BoxGeometry(60, 15, 60);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xA1887F });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 7.5, 0);
    preview.add(base);
    
    // Segundo andar do centro da cidade
    const secondFloorGeometry = new THREE.BoxGeometry(40, 10, 40);
    const secondFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
    const secondFloor = new THREE.Mesh(secondFloorGeometry, secondFloorMaterial);
    secondFloor.position.set(0, 20, 0);
    preview.add(secondFloor);
    
    // Telhado do centro da cidade
    const roofGeometry = new THREE.ConeGeometry(30, 15, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 32.5, 0);
    roof.rotation.y = Math.PI / 4;
    preview.add(roof);
    
    return preview;
}

function createBarracksPreview() {
    const preview = new THREE.Group();
    
    // Base do quartel
    const baseGeometry = new THREE.BoxGeometry(40, 15, 40);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 7.5, 0);
    preview.add(base);
    
    // Telhado do quartel
    const roofGeometry = new THREE.ConeGeometry(30, 15, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 22.5, 0);
    roof.rotation.y = Math.PI / 4;
    preview.add(roof);
    
    return preview;
}

function createWallPreview() {
    const preview = new THREE.Group();
    
    // Muro
    const wallGeometry = new THREE.BoxGeometry(10, 15, 10);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x9E9E9E });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 7.5, 0);
    preview.add(wall);
    
    return preview;
}

function createGatePreview() {
    const preview = new THREE.Group();
    
    // Base do portão
    const baseGeometry = new THREE.BoxGeometry(20, 5, 20);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x9E9E9E });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 2.5, 0);
    preview.add(base);
    
    // Torres do portão
    const towerGeometry = new THREE.BoxGeometry(6, 20, 6);
    const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x9E9E9E });
    
    const tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(8, 12.5, 8);
    preview.add(tower1);
    
    const tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(-8, 12.5, 8);
    preview.add(tower2);
    
    const tower3 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower3.position.set(8, 12.5, -8);
    preview.add(tower3);
    
    const tower4 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower4.position.set(-8, 12.5, -8);
    preview.add(tower4);
    
    // Portão (parte central)
    const gateGeometry = new THREE.BoxGeometry(10, 15, 2);
    const gateMaterial = new THREE.MeshStandardMaterial({ color: 0x795548 });
    const gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(0, 7.5, 0);
    preview.add(gate);
    
    return preview;
}

// Cancelar colocação de edifício
function cancelPlacingBuilding() {
    if (currentPlacementBuilding) {
        scene.remove(currentPlacementBuilding);
        currentPlacementBuilding = null;
        document.body.style.cursor = 'default';
    }
}

// Criar um muro
function createWall(x, z) {
    return createWallSegment(x, z, 10, 10);
}