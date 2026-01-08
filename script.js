// CONFIGURACIÓN
const CONFIG = {
    GOOGLE_SHEET_ID: '1vZncoCQHT58f0FOgJRVIxb4cRBxc8xvQ4XfOQ4VK4rM',
    RESTAURANT_INFO: {
        name: 'SABORES & AROMAS',
        slogan: 'Cocina de autor con ingredientes de temporada',
        schedule: 'Martes a Domingo: 13:00-23:00',
        phone: '+54 387 234 56 78',
        address: 'Av. San Martín, s/n · Salta',
        email: 'reservas@saboresyaromas.com'
    }
};

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

// ===== FUNCIONALIDAD DE GOOGLE SHEETS =====

async function fetchGoogleSheetData() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json`;
        console.log('Cargando datos desde:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows;
        const menuItems = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.c && row.c[1]) {
                menuItems.push({
                    categoría: row.c[0]?.v || 'General',
                    nombre: row.c[1]?.v || 'Sin nombre',
                    descripción: row.c[2]?.v || '',
                    precio: row.c[3]?.v || '0',
                    imagen: row.c[4]?.v || '',
                    etiquetas: row.c[5]?.v || '',
                    destacado: row.c[6]?.v || 'FALSE'
                });
            }
        }
        
        return menuItems.length > 0 ? menuItems : getSampleData();
        
    } catch (error) {
        console.log('Error cargando datos, mostrando ejemplo:', error);
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
        <article class="menu-item">
            <div class="item-image-container">
                <img src="${imageUrl}" alt="${item.nombre}" class="item-image" loading="lazy">
                ${isFeatured ? '<span class="item-badge">Destacado</span>' : ''}
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h3 class="item-name">${item.nombre}</h3>
                    <span class="item-price">${formatPrice(item.precio)}</span>
                </div>
                <p class="item-description">${item.descripción || ''}</p>
                ${tagsHtml ? `<div class="item-tags">${tagsHtml}</div>` : ''}
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

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);