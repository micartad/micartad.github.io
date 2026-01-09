// Inicializar
function init() {
    loadAndDisplayData();
    
    // Configurar scroll optimizado
    window.addEventListener('scroll', throttle(handleScroll, 100));
    
    // Configurar búsqueda
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (!query) {
                filterByCategory('all');
                document.querySelectorAll('.category-filter').forEach(btn => {
                    if (btn.getAttribute('data-category') === 'all') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                return;
            }
            
            document.querySelectorAll('.category-section').forEach(section => {
                section.style.display = 'none';
            });
            
            document.querySelectorAll('.menu-item').forEach(item => {
                const name = item.querySelector('.item-name').textContent.toLowerCase();
                const description = item.querySelector('.item-description').textContent.toLowerCase();
                const parentSection = item.closest('.category-section');
                
                if (name.includes(query) || description.includes(query)) {
                    item.style.display = 'flex';
                    if (parentSection) {
                        parentSection.style.display = 'block';
                        parentSection.querySelectorAll('.menu-item').forEach(sibling => {
                            if (sibling !== item) sibling.style.display = 'flex';
                        });
                    }
                } else {
                    item.style.display = 'none';
                }
            });
            
            document.querySelectorAll('.category-filter').forEach(btn => {
                if (btn.getAttribute('data-category') === 'all') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });
    }
    
    // Botón de refrescar
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', () => {
            loadAndDisplayData();
            elements.refreshBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                elements.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }, 1000);
        });
    }
}
// CONFIGURACIÓN
const CONFIG = {
    GOOGLE_SHEET_ID: '1vZncoCQHT58f0FOgJRVIxb4cRBxc8xvQ4XfOQ4VK4rM',
    RESTAURANT_INFO: {
        name: 'SABORES & AROMAS',
        slogan: 'Cocina de autor con ingredientes de temporada',
        schedule: 'Martes a Domingo: 13:00-23:00',
        phone: '+54 387 234 56 78',
        address: 'Av. San Martín, s/n · Salta',
        email: 'reservas@saboresyaromas.com',
        // NUEVO: Configuración de WhatsApp
        whatsapp: {
            number: '5493871234567', // Tu número SIN + y sin espacios
            message: '¡Hola! Quiero hacer un pedido:\n\n',
            footer: '\n\n📍 Dirección: Av. San Martín, s/n · Salta\n⏰ Horario: Martes a Domingo 12:00-23:00'
        }
    }
};

// ===== SISTEMA DE PEDIDOS POR WHATSAPP =====

// Variables del carrito
let carrito = [];
let totalCarrito = 0;

// Función para agregar producto al carrito
function agregarAlCarrito(producto, precio) {
    const itemExistente = carrito.find(item => item.nombre === producto);
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
        itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
    } else {
        carrito.push({
            nombre: producto,
            precio: parseFloat(precio),
            cantidad: 1,
            subtotal: parseFloat(precio)
        });
    }
    
    actualizarCarrito();
    mostrarNotificacion(`${producto} agregado al carrito`);
}

// Función para actualizar la visualización del carrito
function actualizarCarrito() {
    const carritoBadge = document.getElementById('carritoBadge');
    const carritoTotal = document.getElementById('carritoTotal');
    const carritoItems = document.getElementById('carritoItems');
    const totalCarritoElement = document.getElementById('totalCarrito');
    
    if (!carritoBadge) return;
    
    // Calcular total
    totalCarrito = carrito.reduce((total, item) => total + item.subtotal, 0);
    
    // Actualizar badge
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    carritoBadge.textContent = totalItems;
    carritoBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Actualizar lista del carrito flotante
    if (carritoItems && totalCarritoElement) {
        if (carrito.length === 0) {
            carritoItems.innerHTML = '<p class="carrito-vacio">El carrito está vacío</p>';
            totalCarritoElement.textContent = '$ 0';
        } else {
            carritoItems.innerHTML = carrito.map(item => `
                <div class="carrito-item">
                    <div class="carrito-item-info">
                        <span class="carrito-item-nombre">${item.nombre}</span>
                        <span class="carrito-item-precio">$${item.precio.toLocaleString('es-AR')} x ${item.cantidad}</span>
                    </div>
                    <div class="carrito-item-subtotal">$${item.subtotal.toLocaleString('es-AR')}</div>
                    <button class="carrito-eliminar" data-producto="${item.nombre}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
            
            totalCarritoElement.textContent = `$${totalCarrito.toLocaleString('es-AR')}`;
        }
    }
}

// Función para crear el mensaje de WhatsApp
function crearMensajeWhatsApp() {
    let mensaje = CONFIG.RESTAURANT_INFO.whatsapp.message;
    
    // Agregar items del carrito
    carrito.forEach(item => {
        mensaje += `• ${item.nombre} x${item.cantidad} - $${item.subtotal.toLocaleString('es-AR')}\n`;
    });
    
    // Agregar total
    mensaje += `\n💰 *Total: $${totalCarrito.toLocaleString('es-AR')}*`;
    
    // Agregar footer
    mensaje += CONFIG.RESTAURANT_INFO.whatsapp.footer;
    
    // Agregar información del cliente (opcional)
    mensaje += `\n\n👤 *Mis datos:*\n[Nombre]\n[Dirección de entrega]\n[Teléfono]\n[Notas adicionales]`;
    
    return encodeURIComponent(mensaje);
}

// Función para enviar pedido por WhatsApp
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        mostrarNotificacion('Agrega productos al carrito primero', 'error');
        return;
    }
    
    const mensaje = crearMensajeWhatsApp();
    const whatsappUrl = `https://wa.me/${CONFIG.RESTAURANT_INFO.whatsapp.number}?text=${mensaje}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Opcional: Limpiar carrito después de enviar
    // carrito = [];
    // actualizarCarrito();
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${mensaje}</span>
        <button class="notificacion-cerrar"><i class="fas fa-times"></i></button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => notificacion.classList.add('show'), 10);
    
    // Configurar cierre automático
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
    
    // Cierre manual
    notificacion.querySelector('.notificacion-cerrar').addEventListener('click', () => {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 300);
    });
}

// Función para inicializar el sistema de pedidos
function inicializarSistemaPedidos() {
    // Crear elementos del carrito en el DOM
    crearElementosCarrito();
    
    // Actualizar carrito inicial
    actualizarCarrito();
    
    // Configurar eventos
    document.addEventListener('click', function(e) {
        // Botón "Agregar al carrito"
        if (e.target.closest('.agregar-carrito-btn')) {
            const btn = e.target.closest('.agregar-carrito-btn');
            const producto = btn.getAttribute('data-producto');
            const precio = btn.getAttribute('data-precio');
            
            agregarAlCarrito(producto, precio);
        }
        
        // Botón "Eliminar del carrito"
        if (e.target.closest('.carrito-eliminar')) {
            const btn = e.target.closest('.carrito-eliminar');
            const producto = btn.getAttribute('data-producto');
            
            eliminarDelCarrito(producto);
        }
        
        // Botón "Ver carrito"
        if (e.target.closest('#verCarritoBtn')) {
            toggleCarrito();
        }
        
        // Botón "Enviar pedido"
        if (e.target.closest('#enviarPedidoBtn')) {
            enviarPedidoWhatsApp();
        }
        
        // Cerrar carrito
        if (e.target.closest('#cerrarCarritoBtn') || e.target.closest('.overlay-carrito')) {
            toggleCarrito(false);
        }
    });
}

// Función para crear elementos del carrito en el DOM
function crearElementosCarrito() {
    // Botón flotante del carrito
    const carritoBtn = document.createElement('button');
    carritoBtn.id = 'verCarritoBtn';
    carritoBtn.className = 'carrito-flotante-btn';
    carritoBtn.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        <span id="carritoBadge" class="carrito-badge">0</span>
    `;
    
    // Overlay del carrito
    const overlay = document.createElement('div');
    overlay.className = 'overlay-carrito';
    
    // Panel del carrito
    const carritoPanel = document.createElement('div');
    carritoPanel.className = 'carrito-panel';
    carritoPanel.innerHTML = `
        <div class="carrito-header">
            <h3><i class="fas fa-shopping-cart"></i> Mi Pedido</h3>
            <button id="cerrarCarritoBtn" class="carrito-cerrar">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="carrito-body">
            <div id="carritoItems" class="carrito-items">
                <p class="carrito-vacio">El carrito está vacío</p>
            </div>
        </div>
        <div class="carrito-footer">
            <div class="carrito-total">
                <span>Total:</span>
                <span id="totalCarrito" class="carrito-total-precio">$ 0</span>
            </div>
            <button id="enviarPedidoBtn" class="enviar-pedido-btn">
                <i class="fab fa-whatsapp"></i> Enviar pedido por WhatsApp
            </button>
            <p class="carrito-nota">Al hacer clic se abrirá WhatsApp con tu pedido listo</p>
        </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(carritoBtn);
    document.body.appendChild(overlay);
    document.body.appendChild(carritoPanel);
    
    // Agregar estilos dinámicamente
    agregarEstilosCarrito();
}

// Función para agregar estilos del carrito
function agregarEstilosCarrito() {
    const estilos = `
        /* ===== SISTEMA DE CARRITO ===== */
        .carrito-flotante-btn {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            cursor: pointer;
            font-size: 1.5rem;
            z-index: 1001;
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .carrito-flotante-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(255, 107, 53, 0.6);
        }
        
        .carrito-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #FF4757;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            font-size: 0.8rem;
            font-weight: 700;
            display: none;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
        }
        
        .overlay-carrito {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1002;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .overlay-carrito.active {
            display: block;
            opacity: 1;
        }
        
        .carrito-panel {
            position: fixed;
            top: 0;
            right: -400px;
            width: 380px;
            height: 100vh;
            background: var(--bg-dark);
            z-index: 1003;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            border-left: 1px solid var(--border-color);
            box-shadow: -5px 0 30px rgba(0, 0, 0, 0.3);
        }
        
        .carrito-panel.active {
            right: 0;
        }
        
        .carrito-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-card);
        }
        
        .carrito-header h3 {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
            color: var(--text-primary);
        }
        
        .carrito-cerrar {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px;
            transition: color 0.3s ease;
        }
        
        .carrito-cerrar:hover {
            color: var(--primary);
        }
        
        .carrito-body {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
        }
        
        .carrito-items {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .carrito-vacio {
            text-align: center;
            color: var(--text-muted);
            padding: 2rem;
            font-style: italic;
        }
        
        .carrito-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px;
            background: var(--bg-card);
            border-radius: var(--border-radius-sm);
            border: 1px solid var(--border-color);
        }
        
        .carrito-item-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .carrito-item-nombre {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.95rem;
        }
        
        .carrito-item-precio {
            color: var(--text-secondary);
            font-size: 0.85rem;
        }
        
        .carrito-item-subtotal {
            font-weight: 700;
            color: var(--primary);
            font-size: 1rem;
        }
        
        .carrito-eliminar {
            background: rgba(244, 67, 54, 0.1);
            border: 1px solid rgba(244, 67, 54, 0.3);
            color: var(--error);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .carrito-eliminar:hover {
            background: var(--error);
            color: white;
        }
        
        .carrito-footer {
            padding: 1.5rem;
            border-top: 1px solid var(--border-color);
            background: var(--bg-card);
        }
        
        .carrito-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            font-size: 1.2rem;
        }
        
        .carrito-total-precio {
            font-weight: 800;
            color: var(--primary);
            font-size: 1.5rem;
        }
        
        .enviar-pedido-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #25D366, #128C7E);
            color: white;
            border: none;
            border-radius: var(--border-radius-sm);
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
            margin-bottom: 10px;
        }
        
        .enviar-pedido-btn:hover {
            background: linear-gradient(135deg, #128C7E, #075E54);
            transform: translateY(-2px);
        }
        
        .carrito-nota {
            text-align: center;
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 10px;
        }
        
        /* Notificaciones */
        .notificacion {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--bg-card);
            border-left: 4px solid var(--primary);
            padding: 15px 20px;
            border-radius: var(--border-radius-sm);
            box-shadow: var(--shadow);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1004;
            opacity: 0;
            transition: all 0.3s ease;
            min-width: 300px;
            max-width: 500px;
        }
        
        .notificacion.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        .notificacion.success {
            border-left-color: var(--success);
        }
        
        .notificacion.error {
            border-left-color: var(--error);
        }
        
        .notificacion i {
            font-size: 1.2rem;
        }
        
        .notificacion.success i {
            color: var(--success);
        }
        
        .notificacion.error i {
            color: var(--error);
        }
        
        .notificacion-cerrar {
            margin-left: auto;
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 5px;
        }
        
        /* Botón agregar al carrito en tarjetas */
        .agregar-carrito-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 10px 20px;
            border-radius: 50px;
            border: none;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 15px;
        }
        
        .agregar-carrito-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(255, 107, 53, 0.4);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .carrito-panel {
                width: 100%;
                right: -100%;
            }
            
            .carrito-flotante-btn {
                bottom: 80px;
                right: 20px;
                width: 56px;
                height: 56px;
            }
            
            .notificacion {
                width: 90%;
                max-width: none;
            }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = estilos;
    document.head.appendChild(style);
}

// Función para alternar visibilidad del carrito
function toggleCarrito(mostrar = null) {
    const overlay = document.querySelector('.overlay-carrito');
    const panel = document.querySelector('.carrito-panel');
    
    if (mostrar === null) {
        mostrar = !panel.classList.contains('active');
    }
    
    if (mostrar) {
        overlay.classList.add('active');
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        overlay.classList.remove('active');
        panel.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Función para eliminar producto del carrito
function eliminarDelCarrito(producto) {
    carrito = carrito.filter(item => item.nombre !== producto);
    actualizarCarrito();
    mostrarNotificacion(`${producto} eliminado del carrito`);
}

// Modificar renderMenuItem para incluir botón de carrito
function renderMenuItem(item) {
    const tags = item.etiquetas ? item.etiquetas.toLowerCase().split(',') : [];
    const isFeatured = item.destacado === 'TRUE';
    
    const tagsHtml = tags.map(tag => {
        const trimmed = tag.trim();
        if (trimmed === 'vegetariano') return `<span class="tag vegetarian">Vegetariano</span>`;
        if (trimmed === 'vegano') return `<span class="tag vegan">Vegano</span>`;
        return `<span class="tag">${trimmed}</span>`;
    }).join('');
    
    const imageUrl = item.imagen || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
    
    return `
        <article class="menu-item" data-product="${item.nombre}" data-price="${item.precio}">
            <div class="item-image-container">
                <img src="${imageUrl}" alt="${item.nombre}" class="item-image" loading="lazy">
                ${isFeatured ? '<span class="item-badge">⭐ Destacado</span>' : ''}
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h3 class="item-name">${item.nombre}</h3>
                    <span class="item-price">${formatPrice(item.precio)}</span>
                </div>
                <p class="item-description">${item.descripción || ''}</p>
                ${tagsHtml ? `<div class="item-tags">${tagsHtml}</div>` : ''}
                
                <!-- Botón para agregar al carrito -->
                <button class="agregar-carrito-btn" 
                        data-producto="${item.nombre}" 
                        data-precio="${item.precio}">
                    <i class="fas fa-cart-plus"></i> Agregar al carrito
                </button>
                
                <!-- Botón directo WhatsApp (opcional) -->
                <a href="https://wa.me/${CONFIG.RESTAURANT_INFO.whatsapp.number}?text=${encodeURIComponent(`¡Hola! Quiero pedir: ${item.nombre} - $${item.precio}`)}" 
                   target="_blank" 
                   class="whatsapp-btn" 
                   style="margin-top: 8px;">
                    <i class="fab fa-whatsapp"></i> Pedir directo
                </a>
            </div>
        </article>
    `;
}


// Variables globales
let menuData = [];
let categories = [];
let lastScrollTop = 0;
let scrollTimeout;

// Elementos del DOM
const elements = {
    header: document.querySelector('.header'),
    categoriesNav: document.querySelector('.categories-nav'),
    menuContainer: document.getElementById('menuContainer'),
    categoriesList: document.getElementById('categoriesList'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    restaurantName: document.getElementById('restaurantName'),
    restaurantSlogan: document.getElementById('restaurantSlogan'),
    schedule: document.getElementById('schedule'),
    phone: document.getElementById('phone'),
    address: document.getElementById('address'),
    email: document.getElementById('email'),
    lastUpdate: document.getElementById('lastUpdate'),
    updateTime: document.getElementById('updateTime')
};

// ===== FUNCIONALIDAD DE SCROLL INTELIGENTE =====

function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollingDown = scrollTop > lastScrollTop;
    const scrollThreshold = 100;

    // Comportamiento del header
    if (scrollTop > scrollThreshold) {
        elements.header.classList.add('compact');
        document.body.classList.add('header-compact');
        
        // Ocultar categorías al hacer scroll hacia abajo (solo si se está desplazando mucho)
        if (scrollingDown && scrollTop > 300) {
            elements.categoriesNav.classList.add('hidden');
        }
    } else {
        elements.header.classList.remove('compact');
        document.body.classList.remove('header-compact');
        elements.categoriesNav.classList.remove('hidden');
    }
    
    // Mostrar categorías al hacer scroll hacia arriba
    if (!scrollingDown) {
        elements.categoriesNav.classList.remove('hidden');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

// Optimizar eventos de scroll
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Scroll suave al hacer click en categorías
function setupCategoryScroll() {
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const category = this.getAttribute('data-category');
            if (category === 'all') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                const categorySection = document.querySelector(`[data-category-name="${category}"]`);
                if (categorySection) {
                    const headerHeight = elements.header.classList.contains('compact') ? 100 : 180;
                    const sectionPosition = categorySection.getBoundingClientRect().top;
                    const offsetPosition = sectionPosition + window.pageYOffset - headerHeight - 20;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    elements.categoriesNav.classList.remove('hidden');
                }
            }
        });
    });
}

// ===== FUNCIONALIDAD DE GOOGLE SHEETS - VERSIÓN 100% FUNCIONAL =====
async function fetchGoogleSheetData() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json`;
        console.log('🔗 Conectando a Google Sheets...');
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('❌ Error HTTP:', response.status);
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('✅ Datos recibidos, procesando...');
        
        // Método MÁS ROBUSTO para extraer JSON
        let jsonData;
        try {
            // Intenta varios métodos de extracción
            const cleanedText = text.replace(/^.*?{/, '{').replace(/\);?$/, '');
            jsonData = JSON.parse(cleanedText);
        } catch (e1) {
            try {
                const match = text.match(/google\.visualization\.Query\.setResponse\(({.*})\)/);
                if (match && match[1]) {
                    jsonData = JSON.parse(match[1]);
                } else {
                    throw new Error('No se pudo extraer JSON');
                }
            } catch (e2) {
                console.error('❌ Error parseando JSON:', e2);
                return getSampleData();
            }
        }
        
        // Verificar estructura
        if (!jsonData.table || !jsonData.table.rows) {
            console.error('❌ Estructura incorrecta:', jsonData);
            return getSampleData();
        }
        
        const rows = jsonData.table.rows;
        console.log(`📊 Total de filas recibidas: ${rows.length}`);
        
        // DEBUG: Mostrar todas las filas para diagnóstico
        console.log('🔍 DEBUG - Contenido de filas:');
        rows.forEach((row, index) => {
            console.log(`Fila ${index}:`, row.c ? row.c.map(cell => cell?.v || '[vacío]') : '[sin celdas]');
        });
        
        const menuItems = [];
        
        // Procesar TODAS las filas
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            if (!row.c) {
                console.log(`⚠️ Fila ${i} sin celdas, omitiendo...`);
                continue;
            }
            
            // Extraer valores de cada celda
            const categoria = row.c[0]?.v || '';
            const nombre = row.c[1]?.v || '';
            const descripcion = row.c[2]?.v || '';
            const precio = row.c[3]?.v || '';
            const imagen = row.c[4]?.v || '';
            const etiquetas = row.c[5]?.v || '';
            const destacado = row.c[6]?.v || 'FALSE';
            
            // Verificar si es la fila de encabezados
            if (i === 0) {
                // Es la primera fila (encabezados)
                console.log('📋 Encabezados detectados:', {
                    categoria, nombre, descripcion, precio, imagen, etiquetas, destacado
                });
                
                // Verificar si son encabezados válidos
                const isHeaderRow = categoria.toString().toLowerCase().includes('categor') || 
                                   nombre.toString().toLowerCase().includes('nombre');
                
                if (isHeaderRow) {
                    console.log('✅ Primera fila son encabezados, omitiendo...');
                    continue; // Saltar encabezados
                }
            }
            
            // Solo agregar si tiene nombre (evitar filas vacías)
            if (nombre && nombre.toString().trim() !== '') {
                menuItems.push({
                    categoría: categoria.toString().trim(),
                    nombre: nombre.toString().trim(),
                    descripción: descripcion.toString().trim(),
                    precio: precio.toString().trim(),
                    imagen: imagen.toString().trim(),
                    etiquetas: etiquetas.toString().trim(),
                    destacado: destacado.toString().trim().toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE'
                });
                console.log(`✅ Producto agregado: ${nombre}`);
            } else if (categoria || descripcion || precio) {
                console.log(`⚠️ Fila ${i} tiene datos pero no nombre, omitiendo:`, { categoria, nombre, precio });
            }
        }
        
        console.log(`🎉 Total productos procesados: ${menuItems.length}`);
        
        if (menuItems.length === 0) {
            console.log('📦 No se encontraron productos, usando datos de ejemplo');
            return getSampleData();
        }
        
        return menuItems;
        
    } catch (error) {
        console.error('💥 Error crítico:', error);
        console.log('🔄 Mostrando datos de ejemplo...');
        return getSampleData();
    }
}

function getSampleData() {
    return [
        {
            categoría: 'Entradas',
            nombre: 'Croquetas Caseras de Jamón',
            descripción: 'Deliciosas croquetas caseras hechas con jamón ibérico de bellota',
            precio: '8.50',
            imagen: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop',
            etiquetas: 'vegetariano',
            destacado: 'TRUE'
        },
        {
            categoría: 'Entradas',
            nombre: 'Ensalada César con Pollo',
            descripción: 'Lechuga romana, crutones, parmesano y pollo a la parrilla',
            precio: '9.90',
            imagen: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'FALSE'
        },
        {
            categoría: 'Entradas',
            nombre: 'Tartar de Atún',
            descripción: 'Atún fresco marinado con aguacate y salsa de soja',
            precio: '12.50',
            imagen: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'TRUE'
        },
        {
            categoría: 'Principales',
            nombre: 'Paella Valenciana',
            descripción: 'Arroz con pollo, conejo, judías verdes y garrofón',
            precio: '22.90',
            imagen: 'https://images.unsplash.com/photo-1534511075136-8c8c60b0c9c9?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'TRUE'
        },
        {
            categoría: 'Principales',
            nombre: 'Solomillo de Ternera',
            descripción: 'Solomillo a la plancha con salsa de vino tinto y puré de patatas',
            precio: '24.50',
            imagen: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'TRUE'
        },
        {
            categoría: 'Principales',
            nombre: 'Risotto de Setas',
            descripción: 'Arroz arborio con setas de temporada y queso parmesano',
            precio: '18.50',
            imagen: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop',
            etiquetas: 'vegetariano',
            destacado: 'FALSE'
        },
        {
            categoría: 'Bebidas',
            nombre: 'Vino Tinto Reserva',
            descripción: 'Rioja reserva 2018, cuerpo medio, taninos suaves',
            precio: '5.50',
            imagen: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'FALSE'
        },
        {
            categoría: 'Bebidas',
            nombre: 'Cerveza Artesanal',
            descripción: 'Cerveza IPA local, amargor equilibrado',
            precio: '4.50',
            imagen: 'https://images.unsplash.com/photo-1586993451385-39c6dd58f5a3?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'FALSE'
        },
        {
            categoría: 'Bebidas',
            nombre: 'Cóctel Signature',
            descripción: 'Gin, jugo de limón, almíbar de lavanda y agua de rosas',
            precio: '8.50',
            imagen: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'TRUE'
        },
        {
            categoría: 'Postres',
            nombre: 'Tarta de Queso con Frutos Rojos',
            descripción: 'Tarta de queso al horno con coulis de frutos del bosque',
            precio: '6.90',
            imagen: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop',
            etiquetas: 'vegetariano',
            destacado: 'TRUE'
        },
        {
            categoría: 'Postres',
            nombre: 'Brownie de Chocolate',
            descripción: 'Brownie denso de chocolate con nueces y helado de vainilla',
            precio: '5.50',
            imagen: 'https://images.unsplash.com/photo-1606313564200-75f2d4fa383b?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'FALSE'
        },
        {
            categoría: 'Postres',
            nombre: 'Crema Catalana',
            descripción: 'Crema tradicional con caramelo crujiente',
            precio: '4.90',
            imagen: 'https://images.unsplash.com/photo-1563379091339-03246963d9d6?w=400&h=300&fit=crop',
            etiquetas: '',
            destacado: 'FALSE'
        }
    ];
}

function formatPrice(price) {
    if (!price) return '$ --';
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '$ --' : `$ ${numPrice.toFixed(2).replace('.', ',')}`;
}

function extractCategories(items) {
    const cats = new Set(['Entradas', 'Principales', 'Bebidas', 'Postres']);
    items.forEach(item => {
        if (item.categoría) {
            cats.add(item.categoría);
        }
    });
    return Array.from(cats).sort();
}

function renderCategories(cats) {
    const allButton = `<span class="category-filter active" data-category="all">Todo</span>`;
    
    // Asegurarnos de que aparezcan las 4 categorías principales
    const mainCategories = ['Entradas', 'Principales', 'Bebidas', 'Postres'];
    const otherCategories = cats.filter(cat => !mainCategories.includes(cat));
    
    const categoryButtons = mainCategories.map(cat => 
        `<span class="category-filter" data-category="${cat}">${cat}</span>`
    ).join('');
    
    const otherButtons = otherCategories.map(cat => 
        `<span class="category-filter" data-category="${cat}">${cat}</span>`
    ).join('');
    
    elements.categoriesList.innerHTML = allButton + categoryButtons + otherButtons;
    
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            filterByCategory(category);
            
            document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function renderMenuItems(groupedItems) {
    let html = '';
    
    // Ordenar categorías: primero las principales
    const categoryOrder = ['Entradas', 'Principales', 'Bebidas', 'Postres'];
    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    sortedCategories.forEach(category => {
        const items = groupedItems[category];
        const categoryId = category.toLowerCase().replace(/\s+/g, '-');
        
        html += `
            <section class="category-section" id="${categoryId}" data-category-name="${category}">
                <h2 class="category-title">${category}</h2>
                <div class="menu-items">
                    ${items.map(item => renderMenuItem(item)).join('')}
                </div>
            </section>
        `;
    });
    
    elements.menuContainer.innerHTML = html;
}

function renderMenuItem(item) {
    const tags = item.etiquetas ? item.etiquetas.toLowerCase().split(',') : [];
    const isFeatured = item.destacado === 'TRUE';
    
    const tagsHtml = tags.map(tag => {
        const trimmed = tag.trim();
        if (trimmed === 'vegetariano') return `<span class="tag vegetarian">Vegetariano</span>`;
        if (trimmed === 'vegano') return `<span class="tag vegan">Vegano</span>`;
        if (trimmed === 'picante') return `<span class="tag spicy">Picante</span>`;
        return `<span class="tag">${trimmed}</span>`;
    }).join('');
    
    const imageUrl = item.imagen || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
    
    return `
        <article class="menu-item" data-product="${item.nombre}" data-price="${item.precio}">
            <div class="item-image-container">
                <img src="${imageUrl}" alt="${item.nombre}" class="item-image" loading="lazy">
                ${isFeatured ? '<span class="item-badge">⭐ Destacado</span>' : ''}
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h3 class="item-name">${item.nombre}</h3>
                    <span class="item-price">${formatPrice(item.precio)}</span>
                </div>
                <p class="item-description">${item.descripción || ''}</p>
                ${tagsHtml ? `<div class="item-tags">${tagsHtml}</div>` : ''}
                
                <!-- Botón para agregar al carrito -->
                <button class="agregar-carrito-btn" 
                        data-producto="${item.nombre}" 
                        data-precio="${item.precio}">
                    <i class="fas fa-cart-plus"></i> Agregar al carrito
                </button>
                
                <!-- Botón directo WhatsApp (opcional) -->
                <a href="https://wa.me/${CONFIG.RESTAURANT_INFO.whatsapp.number}?text=${encodeURIComponent(`¡Hola! Quiero pedir: ${item.nombre} - $${item.precio}`)}" 
                   target="_blank" 
                   class="whatsapp-btn" 
                   style="margin-top: 8px; display: inline-block; width: 100%; text-align: center; padding: 8px; background: #25D366; color: white; border-radius: 5px; text-decoration: none;">
                    <i class="fab fa-whatsapp"></i> Pedir directo
                </a>
            </div>
        </article>
    `;
}

function filterByCategory(category) {
    if (category === 'all') {
        document.querySelectorAll('.category-section').forEach(section => {
            section.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.category-section').forEach(section => {
            const sectionCategory = section.querySelector('.category-title').textContent;
            section.style.display = sectionCategory === category ? 'block' : 'none';
        });
    }
}

async function loadAndDisplayData() {
    try {
        elements.menuContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Cargando nuestro delicioso menú...</p>
            </div>
        `;
        
        menuData = await fetchGoogleSheetData();
        
        // Actualizar información del restaurante
        if (elements.restaurantName) elements.restaurantName.textContent = CONFIG.RESTAURANT_INFO.name;
        if (elements.restaurantSlogan) elements.restaurantSlogan.textContent = CONFIG.RESTAURANT_INFO.slogan;
        if (elements.schedule) elements.schedule.textContent = CONFIG.RESTAURANT_INFO.schedule;
        if (elements.phone) elements.phone.textContent = CONFIG.RESTAURANT_INFO.phone;
        if (elements.address) elements.address.textContent = CONFIG.RESTAURANT_INFO.address;
        if (elements.email) elements.email.textContent = CONFIG.RESTAURANT_INFO.email;
        
        // Extraer y mostrar categorías
        categories = extractCategories(menuData);
        
        // Agrupar por categoría
        const grouped = {};
        menuData.forEach(item => {
            const category = item.categoría || 'Otros';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(item);
        });
        
        // Renderizar
        renderCategories(categories);
        renderMenuItems(grouped);
        
        // Configurar scroll suave para categorías
        setupCategoryScroll();
        
        // Actualizar timestamp
        const now = new Date();
        if (elements.updateTime) {
            elements.updateTime.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        
    } catch (error) {
        console.error('Error:', error);
        elements.menuContainer.innerHTML = `
            <div class="error-message">
                <h3>Error al cargar el menú</h3>
                <p>Por favor, verifica que el ID del Google Sheet sea correcto.</p>
                <p>Mientras tanto, mostramos un menú de ejemplo.</p>
            </div>
        `;
        
        // Mostrar datos de ejemplo
        const sampleData = getSampleData();
        const grouped = {};
        sampleData.forEach(item => {
            const category = item.categoría || 'Otros';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(item);
        });
        
        categories = extractCategories(sampleData);
        renderCategories(categories);
        renderMenuItems(grouped);
        setupCategoryScroll();
    }
}



// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
