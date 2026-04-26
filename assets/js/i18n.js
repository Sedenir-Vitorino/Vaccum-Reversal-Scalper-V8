// ========== SISTEMA DE INTERNACIONALIZAÇÃO (i18n) ==========

const I18n = {
    currentLang: 'en',
    translations: {},
    basePath: '',

    // Inicializa o sistema
    async init() {
        this.basePath = this.getBasePath();
        const savedLang = localStorage.getItem('vrs_lang') || 'en';
        await this.loadLanguage(savedLang);
        this.createLanguageSwitcher();
    },

    // Detecta o caminho base do site
    getBasePath() {
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src.includes('i18n.js')) {
                return script.src.replace(/\/assets\/js\/i18n\.js.*$/, '');
            }
        }
        const path = window.location.pathname;
        const depth = (path.match(/\//g) || []).length - 1;
        return '../'.repeat(depth) || '.';
    },

    // Carrega arquivo de tradução
    async loadLanguage(lang) {
        try {
            const url = `${this.basePath}/lang/${lang}.json`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Language file not found: ${url}`);
            
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('vrs_lang', lang);
            this.translatePage();
            this.updateSwitcher();
        } catch (error) {
            console.error('Error loading language:', error);
            if (lang !== 'en') {
                await this.loadLanguage('en');
            }
        }
    },

    // Traduz a página inteira
    translatePage() {
        if (!this.translations || Object.keys(this.translations).length === 0) {
            console.warn('No translations loaded');
            return;
        }

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getNestedValue(this.translations, key);
            if (translation) {
                if (element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translation);
                } else if (element.tagName === 'META' && element.hasAttribute('content')) {
                    element.setAttribute('content', translation);
                } else {
                    element.textContent = translation;
                }
            }
        });

        document.querySelectorAll('[data-i18n-list]').forEach(element => {
            const key = element.getAttribute('data-i18n-list');
            const items = this.getNestedValue(this.translations, key);
            if (Array.isArray(items)) {
                element.innerHTML = items.map(item => `<li>${item}</li>`).join('');
            }
        });

        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const items = this.getNestedValue(this.translations, key);
            if (Array.isArray(items)) {
                element.innerHTML = items.map(item => 
                    `<span class="zip-item">${item}</span>`
                ).join('');
            }
        });

        const title = this.getNestedValue(this.translations, 'site.title');
        if (title) document.title = title;
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            const desc = this.getNestedValue(this.translations, 'site.description');
            if (desc) metaDesc.setAttribute('content', desc);
        }

        document.documentElement.lang = this.currentLang;
    },

    // Pega valor aninhado do JSON
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    },

    // Cria o seletor de idioma com bandeiras
    createLanguageSwitcher() {
        const existing = document.getElementById('lang-switcher');
        if (existing) existing.remove();

        const nav = document.querySelector('nav');
        if (!nav) return;

        const switcher = document.createElement('div');
        switcher.id = 'lang-switcher';
        switcher.className = 'lang-switcher';
        switcher.innerHTML = `
            <button class="lang-btn" data-lang="en" title="English">
                <img src="${this.basePath}/assets/images/flags/us.svg" alt="English" width="24" height="24">
            </button>
            <button class="lang-btn" data-lang="pt" title="Português">
                <img src="${this.basePath}/assets/images/flags/br.svg" alt="Português" width="24" height="24">
            </button>
        `;

        nav.appendChild(switcher);

        switcher.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const lang = btn.getAttribute('data-lang');
                switcher.querySelectorAll('.lang-btn').forEach(b => b.disabled = true);
                await this.loadLanguage(lang);
                switcher.querySelectorAll('.lang-btn').forEach(b => b.disabled = false);
            });
        });

        this.updateSwitcher();
    },

    // Atualiza o botão ativo
    updateSwitcher() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            if (lang === this.currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
});