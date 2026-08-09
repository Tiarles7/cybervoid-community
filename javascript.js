// Captura o formulario de contato.
const formContato = document.getElementById('form-contato');

// So executa esse codigo se o formulario existir na pagina atual.
if (formContato) {
    const mensagemSucesso = document.getElementById('mensagem-sucesso');

    formContato.addEventListener('submit', function (evento) {
        evento.preventDefault();

        const dadosFormulario = new FormData(formContato);

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: dadosFormulario
        })
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (dados) {
            if (dados.success) {
                mensagemSucesso.classList.add('mostrar');
                formContato.reset();

                setTimeout(function () {
                    mensagemSucesso.classList.remove('mostrar');
                }, 7000);
            } else {
                alert('Algo deu errado ao enviar. Tente novamente.');
            }
        })
        .catch(function () {
            alert('Erro de conexao. Verifique sua internet e tente novamente.');
        });
    });
}

// ===== MENU HAMBURGUER =====

const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

if (menuToggle && navLinks) {
    const menuIcons = {
        'index.html': 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z',
        'cyberfeed.html': 'M4 8.5a8 8 0 0 1 16 0h-2a6 6 0 0 0-12 0H4Zm4 0a4 4 0 0 1 8 0h-2a2 2 0 0 0-4 0H8Zm4 3.5a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0v-4a3 3 0 0 1 3-3Z',
        'void-runner.html': 'M7 9h10a5 5 0 0 1 4.8 3.6l.7 2.6A3 3 0 0 1 17.3 18L15 15H9l-2.3 3A3 3 0 0 1 1.5 15.2l.7-2.6A5 5 0 0 1 7 9Zm1 3H6v2H4v2h2v2h2v-2h2v-2H8v-2Zm8 2.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm3 3a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z',
        'contato.html': 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm1.8 2 7.2 5 7.2-5H4.8Zm15.2 8V9.9l-8 5.5-8-5.5V16h16Z'
    };

    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

    function criarIconeMenu(pageKey) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        svg.setAttribute('class', 'menu-icon');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        path.setAttribute('d', menuIcons[pageKey] || menuIcons['index.html']);
        svg.appendChild(path);
        return svg;
    }

    function prepararLinkMenu(link) {
        const href = link.getAttribute('href') || '';
        const pageKey = (href.split('/').pop() || 'index.html').split('?')[0].toLowerCase();
        const label = link.textContent.trim();

        link.querySelectorAll('.menu-icon').forEach(function (icon) {
            icon.remove();
        });

        link.textContent = '';
        link.prepend(criarIconeMenu(pageKey));

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        link.appendChild(labelSpan);

        if (pageKey === currentPage || (currentPage === '' && pageKey === 'index.html')) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    }

    function prepararDrawerGlobal() {
        if (!navLinks.querySelector('.drawer-heading')) {
            const headingItem = document.createElement('li');
            const headingText = document.createElement('span');

            headingItem.className = 'drawer-heading';
            headingText.textContent = 'Navegação';
            headingItem.appendChild(headingText);
            navLinks.prepend(headingItem);
        }

        navLinks.querySelectorAll('a').forEach(prepararLinkMenu);
    }

    function sincronizarMenuGlobal() {
        const isOpen = navLinks.classList.contains('ativo');

        document.body.classList.toggle('site-menu-open', isOpen);
        menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        menuToggle.setAttribute('title', isOpen ? 'Fechar menu' : 'Abrir menu');
        menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function fecharMenuGlobal() {
        menuToggle.classList.remove('ativo');
        navLinks.classList.remove('ativo');
        sincronizarMenuGlobal();
    }

    prepararDrawerGlobal();
    sincronizarMenuGlobal();

    menuToggle.addEventListener('click', function () {
        menuToggle.classList.toggle('ativo');
        navLinks.classList.toggle('ativo');
        sincronizarMenuGlobal();
    });

    const links = navLinks.querySelectorAll('a');
    links.forEach(function (link) {
        link.addEventListener('click', function () {
            fecharMenuGlobal();
        });
    });

    document.addEventListener('click', function (evento) {
        if (!document.body.classList.contains('site-menu-open')) {
            return;
        }

        if (evento.target.closest('#nav-links') || evento.target.closest('#menu-toggle')) {
            return;
        }

        fecharMenuGlobal();
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape' && document.body.classList.contains('site-menu-open')) {
            fecharMenuGlobal();
        }
    });
}

// ===== EASTER EGG: MENSAGEM NO CONSOLE =====

console.log(
    '%c:: Voce abriu o console. ::\n%cBem-vindo ao Void.\nNem todo dado e visivel na superficie...',
    'color: #ff2eb4; font-size: 18px; font-weight: bold;',
    'color: #8a2be2; font-size: 14px;'
);

// ===== EASTER EGG: KONAMI CODE =====

const voidSecreto = document.getElementById('void-secreto');

if (voidSecreto) {
    const sequenciaSecreta = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
    ];
    let posicaoAtual = 0;

    document.addEventListener('keydown', function (evento) {
        const teclaEsperada = sequenciaSecreta[posicaoAtual];

        if (evento.key === teclaEsperada) {
            posicaoAtual++;

            if (posicaoAtual === sequenciaSecreta.length) {
                voidSecreto.classList.add('ativo');
                posicaoAtual = 0;

                setTimeout(function () {
                    voidSecreto.classList.remove('ativo');
                }, 7000);
            }
        } else {
            posicaoAtual = 0;
        }
    });
}

// ===== EFEITO TERMINAL (PAGINA SOBRE) =====

const terminalTexto = document.getElementById('terminal-texto');

if (terminalTexto) {
    const textoCompleto = `> CyberVoid.
> Feed, jogo, perfis e ranking.
> Voce esta conectado.`;

    let indice = 0;

    function digitar() {
        if (indice < textoCompleto.length) {
            terminalTexto.textContent += textoCompleto.charAt(indice);
            indice++;

            const terminalCorpo = terminalTexto.parentElement;
            terminalCorpo.scrollTop = terminalCorpo.scrollHeight;

            setTimeout(digitar, 100);
        }
    }

    digitar();
}

// ===== NAVES ANIMADAS (FUNDO - PAGINA SERVICOS) =====

const navesContainer = document.getElementById('naves-container');

if (navesContainer) {
    function criarNave() {
        const nave = document.createElement('div');
        nave.classList.add('nave');

        const idUnico = Date.now() + Math.random();
        nave.innerHTML = `
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="casco${idUnico}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#1a2a3a"/>
                        <stop offset="50%" stop-color="#3a5a7a"/>
                        <stop offset="100%" stop-color="#1a2a3a"/>
                    </linearGradient>
                    <linearGradient id="brilho${idUnico}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#00e5ff"/>
                        <stop offset="100%" stop-color="#5cf0ff"/>
                    </linearGradient>
                </defs>

                <path d="M40 30 L8 50 L18 54 L40 42 Z" fill="url(#casco${idUnico})" stroke="#00e5ff" stroke-width="1.2"/>
                <path d="M40 30 L72 50 L62 54 L40 42 Z" fill="url(#casco${idUnico})" stroke="#00e5ff" stroke-width="1.2"/>
                <path d="M40 4 L52 38 L48 70 L40 76 L32 70 L28 38 Z" fill="url(#casco${idUnico})" stroke="#00e5ff" stroke-width="1.5"/>
                <line x1="40" y1="14" x2="40" y2="66" stroke="url(#brilho${idUnico})" stroke-width="2" opacity="0.8"/>
                <ellipse cx="40" cy="22" rx="5" ry="8" fill="#5cf0ff" opacity="0.85"/>
                <circle cx="34" cy="68" r="3" fill="#00e5ff" opacity="0.9"/>
                <circle cx="46" cy="68" r="3" fill="#00e5ff" opacity="0.9"/>
                <path d="M34 71 L31 84 L37 71 Z" fill="#00e5ff" opacity="0.4"/>
                <path d="M46 71 L43 84 L49 71 Z" fill="#00e5ff" opacity="0.4"/>
            </svg>
        `;

        const ladoInicial = Math.floor(Math.random() * 4);
        let inicioX;
        let inicioY;
        let destinoX;
        let destinoY;
        let angulo;

        const larguraTela = window.innerWidth;
        const alturaTela = window.innerHeight;

        if (ladoInicial === 0) {
            inicioX = Math.random() * larguraTela;
            inicioY = -50;
            destinoX = (Math.random() - 0.5) * 300;
            destinoY = alturaTela + 100;
            angulo = 180;
        } else if (ladoInicial === 1) {
            inicioX = larguraTela + 50;
            inicioY = Math.random() * alturaTela;
            destinoX = -(larguraTela + 200);
            destinoY = (Math.random() - 0.5) * 300;
            angulo = -90;
        } else if (ladoInicial === 2) {
            inicioX = Math.random() * larguraTela;
            inicioY = alturaTela + 50;
            destinoX = (Math.random() - 0.5) * 300;
            destinoY = -(alturaTela + 100);
            angulo = 0;
        } else {
            inicioX = -50;
            inicioY = Math.random() * alturaTela;
            destinoX = larguraTela + 200;
            destinoY = (Math.random() - 0.5) * 300;
            angulo = 90;
        }

        nave.style.left = inicioX + 'px';
        nave.style.top = inicioY + 'px';
        nave.style.setProperty('--angulo', angulo + 'deg');
        nave.style.setProperty('--destino-x', destinoX + 'px');
        nave.style.setProperty('--destino-y', destinoY + 'px');

        const duracao = 4 + Math.random() * 3;
        nave.style.animationDuration = duracao + 's';

        navesContainer.appendChild(nave);

        setTimeout(function () {
            nave.remove();
        }, duracao * 1000);
    }

    function iniciarNaves() {
        criarNave();
        const proximoIntervalo = 1500 + Math.random() * 2000;
        setTimeout(iniciarNaves, proximoIntervalo);
    }

    iniciarNaves();
}

// ===== HOME: ENTRADA ANIMADA DA TRIX =====

(function iniciarPortalDaHome() {
    const portal = document.querySelector('[data-home-portal]');

    if (!portal) {
        return;
    }

    // Limpeza dos controladores de animacao.
    if (window.cyberVoidHomeController && window.cyberVoidHomeController.destroy) {
        window.cyberVoidHomeController.destroy();
    }

    const arena = portal.querySelector('[data-trix-arena]');
    const actor = portal.querySelector('[data-trix-actor]');
    const sprite = portal.querySelector('[data-trix-sprite]');
    const dialog = portal.querySelector('[data-trix-dialog]');
    const dialogText = portal.querySelector('[data-trix-dialog-text]');
    const cards = portal.querySelector('[data-home-cards]');
    const walkSrc = 'images/void-runner/player_woman/Dream25-ezgif.com-gif-to-sprite-converter-Photoroom.png';
    const idleSrc = 'images/void-runner/player_woman/Dream223-ezgif.com-gif-to-sprite-converter.png';
    const walkFrames = 10;
    const idleFrames = 16;
    const walkColumns = 5;
    const idleColumns = 5;
    const walkRows = 2;
    const idleRows = 4;
    const walkDuration = 2600;
    const frameDuration = 95;
    const text = 'Bem-vindo ao Void.';
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrameId = null;
    let typeTimerId = null;
    let idleTimerId = null;
    let destroyed = false;

    if (!arena || !actor || !sprite || !dialog || !dialogText || !cards) {
        return;
    }

    portal.classList.add('home-motion-pending');

    function carregarImagem(src) {
        return new Promise(function (resolve, reject) {
            const image = new Image();

            image.onload = function () {
                resolve(image);
            };
            image.onerror = function () {
                reject(new Error('Asset da Trix nao carregou: ' + src));
            };
            image.src = src;
        });
    }

    // Controle dos frames de caminhada.
    function aplicarFrame(totalFrames, columns, rows, frame) {
        const safeFrame = frame % totalFrames;
        const column = safeFrame % columns;
        const row = Math.floor(safeFrame / columns);

        sprite.style.backgroundPosition = (column * 100 / (columns - 1)) + '% ' + (row * 100 / (rows - 1)) + '%';
    }

    function calcularCena() {
        const actorWidth = actor.getBoundingClientRect().width || 176;
        const arenaWidth = arena.getBoundingClientRect().width || 640;
        const startX = -actorWidth - 28;
        const endX = Math.max(24, arenaWidth * 0.5 - actorWidth * 0.5);

        return { actorWidth: actorWidth, startX: startX, endX: endX };
    }

    function posicionarActor(x) {
        actor.style.transform = 'translateX(' + x + 'px)';
    }

    // Transicao da caminhada para idle.
    function ativarIdle() {
        sprite.classList.remove('is-walking');
        sprite.classList.add('is-idle');
        aplicarFrame(idleFrames, idleColumns, idleRows, 0);

        idleTimerId = window.setInterval(function () {
            const current = Number(sprite.dataset.idleFrame || 0) + 1;

            sprite.dataset.idleFrame = String(current % idleFrames);
            aplicarFrame(idleFrames, idleColumns, idleRows, current);
        }, 180);

        mostrarDialogo();
    }

    // Caixa de dialogo.
    function mostrarDialogo() {
        let index = 0;

        dialog.classList.add('is-visible');
        dialogText.textContent = '';

        function digitar() {
            if (destroyed) {
                return;
            }

            dialogText.textContent = text.slice(0, index);
            index++;

            if (index <= text.length) {
                typeTimerId = window.setTimeout(digitar, 42);
                return;
            }

            window.setTimeout(function () {
                if (!destroyed) {
                    cards.classList.add('is-visible');
                    portal.classList.remove('home-motion-pending');
                }
            }, 360);
        }

        digitar();
    }

    function iniciarAnimacao() {
        const scene = calcularCena();

        actor.classList.add('is-ready');
        sprite.classList.add('is-walking');
        posicionarActor(scene.startX);
        aplicarFrame(walkFrames, walkColumns, walkRows, 0);

        if (reducedMotion) {
            posicionarActor(scene.endX);
            ativarIdle();
            return;
        }

        const startedAt = performance.now();

        function step(now) {
            if (destroyed) {
                return;
            }

            const progress = Math.min(1, (now - startedAt) / walkDuration);
            const eased = 1 - Math.pow(1 - progress, 3);
            const x = scene.startX + (scene.endX - scene.startX) * eased;
            const frame = Math.floor((now - startedAt) / frameDuration) % walkFrames;

            posicionarActor(x);
            aplicarFrame(walkFrames, walkColumns, walkRows, frame);

            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(step);
                return;
            }

            posicionarActor(scene.endX);
            ativarIdle();
        }

        animationFrameId = window.requestAnimationFrame(step);
    }

    window.cyberVoidHomeController = {
        destroy: function () {
            destroyed = true;
            window.cancelAnimationFrame(animationFrameId);
            window.clearTimeout(typeTimerId);
            window.clearInterval(idleTimerId);
        }
    };

    Promise.all([carregarImagem(walkSrc), carregarImagem(idleSrc)])
        .then(iniciarAnimacao)
        .catch(function (error) {
            console.error(error.message);
            portal.classList.remove('home-motion-pending');
            cards.classList.add('is-visible');
        });
}());
