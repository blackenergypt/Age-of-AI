// Funções utilitárias para o jogo

// Gerar um ID único
function generateId(prefix = '') {
    return prefix + Math.random().toString(36).substr(2, 9);
}

// Calcular distância entre dois pontos
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Verificar se um ponto está dentro de um retângulo
function pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
}

// Converter coordenadas do mundo para coordenadas da tela
function worldToScreen(worldX, worldY, cameraX, cameraY, zoom) {
    return {
        x: (worldX - cameraX) * zoom,
        y: (worldY - cameraY) * zoom
    };
}

// Converter coordenadas da tela para coordenadas do mundo
function screenToWorld(screenX, screenY, cameraX, cameraY, zoom) {
    return {
        x: screenX / zoom + cameraX,
        y: screenY / zoom + cameraY
    };
}

// Limitar um valor entre um mínimo e um máximo
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Formatar número com separadores de milhar
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Formatar tempo em formato mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Gerar cor aleatória
function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// Verificar colisão entre dois retângulos
function rectIntersect(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
    return !(r2x > r1x + r1w || 
             r2x + r2w < r1x || 
             r2y > r1y + r1h ||
             r2y + r2h < r1y);
}

// Obter ângulo entre dois pontos (em radianos)
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Converter radianos para graus
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// Converter graus para radianos
function degToRad(deg) {
    return deg * Math.PI / 180;
}

// Gerar número aleatório entre min e max
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Gerar número inteiro aleatório entre min e max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Verificar se um objeto está vazio
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

// Debounce: limitar a frequência de chamadas de uma função
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Throttle: garantir que uma função não seja chamada mais de uma vez em um período
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Verificar se o dispositivo é móvel
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Obter parâmetros da URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
} 