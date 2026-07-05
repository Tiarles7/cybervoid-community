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
    const textoCompleto = `> O CyberVoid nasceu de uma crença simples: tecnologia de qualidade não deveria ser privilégio de poucos.

    > Vivemos numa era em que a programação é uma das habilidades mais transformadoras do mundo, mas o acesso a bons recursos, mentores e comunidades ainda é desigual. O CyberVoid existe pra mudar isso.
    
    > Aqui você encontra um espaço aberto para tirar dúvidas, compartilhar ideias, descobrir livros, explorar projetos e evoluir junto com outros desenvolvedores, do iniciante ao experiente.
    
    > Acreditamos que o conhecimento cresce quando é compartilhado. Que uma dúvida respondida hoje pode ser o detalhe que muda a carreira de alguém amanhã.
    
    > Não importa de onde você vem, qual linguagem você usa ou em que nível está. Se você tem curiosidade e vontade de aprender, você pertence ao Void.
    
    > Bem-vindo à comunidade. Você está conectado.`;

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
// ===== MINI GAME: VOID RUNNER =====

document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('void-game');
    const botaoIniciar = document.getElementById('start-void-game');
    const scoreElemento = document.getElementById('void-score');
    const bestScoreElemento = document.getElementById('void-best-score');

    // Só executa o jogo se todos os elementos existirem na página atual.
    // Isso evita erro nas páginas que não têm o mini game.
    if (!canvas || !botaoIniciar || !scoreElemento || !bestScoreElemento) {
        return;
    }

    const ctx = canvas.getContext('2d');

    // ===== SPRITES DO VOID RUNNER =====
    // Aqui carregamos as imagens reais do personagem.
    // Elas precisam estar dentro da pasta:
    // images/void-runner/

    const spritesVoidRunner = {
        idle: new Image(),
        run01: new Image(),
        run02: new Image(),
        run03: new Image(),
        jump: new Image(),
        fall: new Image(),
        slide: new Image()
    };

    spritesVoidRunner.idle.src = 'images/void-runner/idle.png';
    spritesVoidRunner.run01.src = 'images/void-runner/run-01.png';
    spritesVoidRunner.run02.src = 'images/void-runner/run-02.png';
    spritesVoidRunner.run03.src = 'images/void-runner/run-03.png';
    spritesVoidRunner.jump.src = 'images/void-runner/jump.png';
    spritesVoidRunner.fall.src = 'images/void-runner/fall.png';
    spritesVoidRunner.slide.src = 'images/void-runner/slide.png';

    // Teste simples para avisar no console se o sprite principal carregou.
    spritesVoidRunner.idle.onload = function () {
        console.log('Sprite idle carregado com sucesso.');
    };

    spritesVoidRunner.idle.onerror = function () {
        console.error('Erro ao carregar idle.png. Verifique o caminho: images/void-runner/idle.png');
    };

    // ===== VARIÁVEIS DO JOGO =====

    let jogoRodando = false;
    let gameOver = false;
    let score = 0;
    let velocidade = 6;
    let gravidade = 0.7;
    let frame = 0;
    let obstaculos = [];

    let melhorScore = localStorage.getItem('voidRunnerBestScore') || 0;
    bestScoreElemento.textContent = melhorScore;

    // ===== JOGADOR =====
    // Aqui você ajusta tamanho e posição do Void Runner.
    // Se ele ficar grande demais, diminua largura e altura.
    // Se ele ficar pequeno demais, aumente largura e altura.

    const jogador = {
        x: 70,
        y: 160,
        largura: 100,
        altura: 100,
        velocidadeY: 0,
        pulando: false
    };

    // ===== FUNDO DO JOGO =====

    function desenharFundo() {
        ctx.fillStyle = '#080812';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grade cyberpunk no chão
        ctx.strokeStyle = 'rgba(255, 46, 180, 0.18)';
        ctx.lineWidth = 1;

        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 250);
            ctx.lineTo(x - 80, canvas.height);
            ctx.stroke();
        }

        for (let y = 250; y < canvas.height; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Linha do chão
        ctx.strokeStyle = '#ff2eb4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 250);
        ctx.lineTo(canvas.width, 250);
        ctx.stroke();
    }

    // ===== ESCOLHER SPRITE DO PERSONAGEM =====
    // Essa função decide qual imagem usar:
    // parado, correndo, pulando ou caindo.

    function escolherSpriteDoJogador() {
        // Se estiver subindo, usa sprite de pulo.
        if (jogador.velocidadeY < -1) {
            return spritesVoidRunner.jump;
        }

        // Se estiver caindo, usa sprite de queda.
        if (jogador.velocidadeY > 1) {
            return spritesVoidRunner.fall;
        }

        // Se o jogo estiver rodando e ele estiver no chão, usa animação de corrida.
        if (jogoRodando) {
            const frameCorrida = Math.floor(frame / 8) % 3;

            if (frameCorrida === 0) {
                return spritesVoidRunner.run01;
            }

            if (frameCorrida === 1) {
                return spritesVoidRunner.run02;
            }

            return spritesVoidRunner.run03;
        }

        // Antes de iniciar o jogo, usa sprite parado.
        return spritesVoidRunner.idle;
    }

    // ===== DESENHAR JOGADOR =====

    function desenharJogador() {
        const spriteAtual = escolherSpriteDoJogador();

        // Se o sprite carregou, desenha a imagem real.
        if (spriteAtual.complete && spriteAtual.naturalWidth > 0) {
            ctx.drawImage(
                spriteAtual,
                jogador.x,
                jogador.y,
                jogador.largura,
                jogador.altura
            );
        } else {
            // Fallback temporário.
            // Se a imagem não carregar, aparece um quadrado rosa para o personagem não sumir.
            ctx.fillStyle = '#ff2eb4';
            ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(jogador.x + 60, jogador.y + 25, 10, 10);
        }
    }

    // ===== ATUALIZAR JOGADOR =====
    // Aplica gravidade e faz o personagem voltar para o chão.

    function atualizarJogador() {
        jogador.y += jogador.velocidadeY;
        jogador.velocidadeY += gravidade;

        // Chão do personagem.
        // Se o sprite ficar flutuando ou afundando no chão, ajuste esse 160.
        if (jogador.y >= 160) {
            jogador.y = 160;
            jogador.velocidadeY = 0;
            jogador.pulando = false;
        }
    }

    // ===== OBSTÁCULOS =====

    function criarObstaculo() {
        const altura = 28 + Math.random() * 35;

        obstaculos.push({
            x: canvas.width,
            y: 250 - altura,
            largura: 28,
            altura: altura
        });
    }

    function desenharObstaculos() {
        ctx.fillStyle = '#8a2be2';

        obstaculos.forEach(function (obstaculo) {
            ctx.fillRect(obstaculo.x, obstaculo.y, obstaculo.largura, obstaculo.altura);

            ctx.fillStyle = 'rgba(138, 43, 226, 0.35)';
            ctx.fillRect(
                obstaculo.x - 4,
                obstaculo.y - 4,
                obstaculo.largura + 8,
                obstaculo.altura + 8
            );

            ctx.fillStyle = '#8a2be2';
        });
    }

    function atualizarObstaculos() {
        obstaculos.forEach(function (obstaculo) {
            obstaculo.x -= velocidade;
        });

        obstaculos = obstaculos.filter(function (obstaculo) {
            return obstaculo.x + obstaculo.largura > 0;
        });
    }

    // ===== COLISÃO =====

    function verificarColisao() {
        obstaculos.forEach(function (obstaculo) {
            const colidiu =
                jogador.x < obstaculo.x + obstaculo.largura &&
                jogador.x + jogador.largura > obstaculo.x &&
                jogador.y < obstaculo.y + obstaculo.altura &&
                jogador.y + jogador.altura > obstaculo.y;

            if (colidiu) {
                encerrarJogo();
            }
        });
    }

    // ===== CONTROLE DE PULO =====

    function pular() {
        if (!jogoRodando || gameOver) {
            return;
        }

        if (!jogador.pulando) {
            jogador.velocidadeY = -13;
            jogador.pulando = true;
        }
    }

    // ===== SCORE =====

    function atualizarScore() {
        score++;
        scoreElemento.textContent = score;

        // A cada 500 pontos, aumenta um pouco a velocidade.
        if (score % 500 === 0) {
            velocidade += 0.5;
        }
    }

    // ===== ENCERRAR JOGO =====

    function encerrarJogo() {
        jogoRodando = false;
        gameOver = true;

        if (score > melhorScore) {
            melhorScore = score;
            localStorage.setItem('voidRunnerBestScore', melhorScore);
            bestScoreElemento.textContent = melhorScore;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff2eb4';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONEXÃO PERDIDA', canvas.width / 2, 135);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText('Clique em iniciar para tentar novamente', canvas.width / 2, 165);
    }

    // ===== REINICIAR JOGO =====

    function reiniciarJogo() {
        jogoRodando = true;
        gameOver = false;
        score = 0;
        velocidade = 6;
        frame = 0;
        obstaculos = [];

        jogador.y = 160;
        jogador.velocidadeY = 0;
        jogador.pulando = false;

        scoreElemento.textContent = score;

        loopJogo();
    }

    // ===== LOOP PRINCIPAL DO JOGO =====

    function loopJogo() {
        if (!jogoRodando) {
            return;
        }

        frame++;

        desenharFundo();
        atualizarJogador();
        atualizarObstaculos();

        if (frame % 90 === 0) {
            criarObstaculo();
        }

        desenharJogador();
        desenharObstaculos();
        verificarColisao();
        atualizarScore();

        requestAnimationFrame(loopJogo);
    }

    // ===== TELA INICIAL =====

    function telaInicial() {
        desenharFundo();

        ctx.fillStyle = '#ff2eb4';
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VOID RUNNER', canvas.width / 2, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText('Pressione iniciar para entrar no Void', canvas.width / 2, 155);

        // Mostra o personagem parado na tela inicial.
        desenharJogador();
    }

    // ===== EVENTOS =====

    botaoIniciar.addEventListener('click', reiniciarJogo);

    document.addEventListener('keydown', function (evento) {
        if (evento.code === 'Space') {
            evento.preventDefault();
            pular();
        }
    });

    canvas.addEventListener('click', pular);

    canvas.addEventListener('touchstart', function (evento) {
        evento.preventDefault();
        pular();
    });

    telaInicial();
});