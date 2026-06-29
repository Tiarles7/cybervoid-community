// Captura o formulário de contato
const formContato = document.getElementById('form-contato');

// Só executa esse código se o formulário existir na página atual
if (formContato) {
    const mensagemSucesso = document.getElementById('mensagem-sucesso');

    formContato.addEventListener('submit', function (evento) {
        evento.preventDefault(); // Impede o recarregamento da página

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
                // Mostra a mensagem com efeito de fade in
                mensagemSucesso.classList.add('mostrar');

                // Limpa os campos do formulário
                formContato.reset();

                // Esconde a mensagem novamente depois de 4 segundos
                setTimeout(function () {
                    mensagemSucesso.classList.remove('mostrar');
                }, 7000);
            } else {
                alert('Algo deu errado ao enviar. Tente novamente.');
            }
        })
        .catch(function (erro) {
            alert('Erro de conexão. Verifique sua internet e tente novamente.');
        });
    });
}

// ===== MENU HAMBÚRGUER =====
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
        menuToggle.classList.toggle('ativo');
        navLinks.classList.toggle('ativo');
    });

    // Fecha o menu automaticamente quando clica em algum link
    const links = navLinks.querySelectorAll('a');
    links.forEach(function (link) {
        link.addEventListener('click', function () {
            menuToggle.classList.remove('ativo');
            navLinks.classList.remove('ativo');
        });
    });
}

// ===== EASTER EGG: MENSAGEM NO CONSOLE =====
console.log(
    '%c:: Você abriu o console. ::\n%cBem-vindo ao Void.\nNem todo dado é visível na superfície...',
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

                // Fecha automaticamente depois de 5 segundos
                setTimeout(function () {
                    voidSecreto.classList.remove('ativo');
                }, 7000);
            }
        } else {
            posicaoAtual = 0;
        }
    });
}

// ===== EFEITO TERMINAL (PÁGINA SOBRE) =====


const terminalTexto = document.getElementById('terminal-texto');

if (terminalTexto) {
    const textoCompleto = `> Me chamo Tiarles, formado em Administração de Empresas, mas foi a tecnologia que realmente fez meu coração acelerar.

> Há cerca de um ano, troquei de rota: passei a estudar programação por conta própria, fascinado pela trajetória que vai de Turing e Ada Lovelace até os robôs humanoides e as inteligências artificiais de hoje.

> O que mais me move é o impacto real dessa tecnologia: IAs que ajudam a descobrir novos medicamentos, preveem estruturas de proteínas e identificam tumores em exames de imagem anos antes de se tornarem críticos.

> Acredito em um futuro onde essas ferramentas estejam ao alcance de todos — não só de poucos.

> Estou no começo dessa jornada, aprendendo todos os dias e usando as próprias ferramentas de IA como aliadas no processo.

> A CyberVoid Company nasce dessa mistura: paixão por tecnologia, vontade de aprender e compromisso de entregar projetos reais para quem precisa.`;

    let indice = 0;

    function digitar() {
        if (indice < textoCompleto.length) {
            terminalTexto.textContent += textoCompleto.charAt(indice);
            indice++;
    
            // Rola o terminal automaticamente acompanhando a digitação
            const terminalCorpo = terminalTexto.parentElement;
            terminalCorpo.scrollTop = terminalCorpo.scrollHeight;
    
            setTimeout(digitar, 100); // velocidade da digitação (em ms)
        }
    }

    digitar();
}

// ===== NAVES ANIMADAS (FUNDO - PÁGINA SERVIÇOS) =====
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

        // Posição inicial aleatória nas bordas da tela


        const ladoInicial = Math.floor(Math.random() * 4); // 0=topo, 1=direita, 2=baixo, 3=esquerda
        let inicioX, inicioY, destinoX, destinoY, angulo;

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
