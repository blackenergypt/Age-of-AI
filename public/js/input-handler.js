class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            buttons: {
                left: false,
                middle: false,
                right: false
            },
            wheel: 0
        };
        this.touches = [];
        this.gestures = {
            pinch: {
                active: false,
                distance: 0,
                previousDistance: 0
            },
            pan: {
                active: false,
                startX: 0,
                startY: 0
            }
        };
        
        this.eventListeners = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: [],
            wheel: [],
            touchstart: [],
            touchmove: [],
            touchend: []
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Teclado
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.triggerEvent('keydown', e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.triggerEvent('keyup', e);
        });
        
        // Mouse
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.updateMousePosition(e);
            
            switch (e.button) {
                case 0: this.mouse.buttons.left = true; break;
                case 1: this.mouse.buttons.middle = true; break;
                case 2: this.mouse.buttons.right = true; break;
            }
            
            this.triggerEvent('mousedown', e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.updateMousePosition(e);
            
            switch (e.button) {
                case 0: this.mouse.buttons.left = false; break;
                case 1: this.mouse.buttons.middle = false; break;
                case 2: this.mouse.buttons.right = false; break;
            }
            
            this.triggerEvent('mouseup', e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.updateMousePosition(e);
            this.triggerEvent('mousemove', e);
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.mouse.wheel = e.deltaY;
            this.triggerEvent('wheel', e);
        });
        
        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.updateTouches(e.touches);
            this.handleGestures('start', e);
            this.triggerEvent('touchstart', e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.updateTouches(e.touches);
            this.handleGestures('move', e);
            this.triggerEvent('touchmove', e);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.updateTouches(e.touches);
            this.handleGestures('end', e);
            this.triggerEvent('touchend', e);
        });
        
        // Prevenir menu de contexto no canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }
    
    updateTouches(touches) {
        this.touches = [];
        for (let i = 0; i < touches.length; i++) {
            const rect = this.canvas.getBoundingClientRect();
            this.touches.push({
                id: touches[i].identifier,
                x: touches[i].clientX - rect.left,
                y: touches[i].clientY - rect.top
            });
        }
    }
    
    handleGestures(type, e) {
        if (this.touches.length === 2) {
            const touch1 = this.touches[0];
            const touch2 = this.touches[1];
            
            // Calcular distância entre os dois toques
            const distance = Math.sqrt(
                Math.pow(touch2.x - touch1.x, 2) + 
                Math.pow(touch2.y - touch1.y, 2)
            );
            
            if (type === 'start') {
                this.gestures.pinch.active = true;
                this.gestures.pinch.distance = distance;
                this.gestures.pinch.previousDistance = distance;
            } else if (type === 'move' && this.gestures.pinch.active) {
                // Detectar pinch
                const delta = distance - this.gestures.pinch.previousDistance;
                this.gestures.pinch.previousDistance = distance;
                
                // Simular evento de roda do mouse para zoom
                this.mouse.wheel = -delta * 0.5;
                this.triggerEvent('wheel', { deltaY: -delta * 0.5 });
            } else if (type === 'end') {
                this.gestures.pinch.active = false;
            }
        } else if (this.touches.length === 1) {
            const touch = this.touches[0];
            
            if (type === 'start') {
                this.gestures.pan.active = true;
                this.gestures.pan.startX = touch.x;
                this.gestures.pan.startY = touch.y;
            } else if (type === 'move' && this.gestures.pan.active) {
                // Simular botão direito do mouse para pan
                this.mouse.buttons.right = true;
                this.mouse.x = touch.x;
                this.mouse.y = touch.y;
                
                this.triggerEvent('mousemove', {
                    clientX: touch.x + this.canvas.getBoundingClientRect().left,
                    clientY: touch.y + this.canvas.getBoundingClientRect().top,
                    button: 2
                });
            } else if (type === 'end') {
                this.gestures.pan.active = false;
                this.mouse.buttons.right = false;
            }
        }
    }
    
    isKeyDown(key) {
        return this.keys[key] === true;
    }
    
    isMouseButtonDown(button) {
        switch (button) {
            case 'left': return this.mouse.buttons.left;
            case 'middle': return this.mouse.buttons.middle;
            case 'right': return this.mouse.buttons.right;
            default: return false;
        }
    }
    
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
    
    updateWorldCoordinates(camera) {
        const screenCenter = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        
        this.mouse.worldX = (this.mouse.x - screenCenter.x) / camera.zoom + camera.x;
        this.mouse.worldY = (this.mouse.y - screenCenter.y) / camera.zoom + camera.y;
    }
}

// Inicializar o manipulador de entrada
const inputHandler = new InputHandler(document.getElementById('game-canvas')); 