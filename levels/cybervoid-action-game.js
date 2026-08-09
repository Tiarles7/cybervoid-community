(function (game) {
    'use strict';

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    const GAME_WIDTH = 900;
    const GAME_HEIGHT = 507;
    const GAME_STATE = {
        PLAYING: 'PLAYING',
        DEATH: 'DEATH',
        GAME_OVER: 'GAME_OVER',
        RESTARTING: 'RESTARTING'
    };
    const GAME_OVER_DELAY = 1100;
    const GAME_OVER_FADE_DURATION = 420;
    const PHASE_MUSIC_SRC = 'trilha-efeitos-sonoros/leberch-cyberpunk-437545.mp3';
    const BOSS_MUSIC_SRC = 'trilha-efeitos-sonoros/psychronic-darkwave-dealer-429877.mp3';
    const TRIX_BASIC_SHOT_SFX_SRC = 'trilha-efeitos-sonoros/trix-tiro-basico.mp3';
    const TRIX_STRONG_SHOT_SFX_SRC = 'trilha-efeitos-sonoros/trix-tiro-forte.mp3';
    const ENEMY_IMPACT_SFX_SRC = 'trilha-efeitos-sonoros/impacto-inimigo.mp3';
    const PHASE_MUSIC_VOLUME = 0.30;
    const BOSS_MUSIC_VOLUME = 0.36;
    const TRIX_BASIC_SHOT_SFX_VOLUME = 0.25;
    const TRIX_STRONG_SHOT_SFX_VOLUME = 0.85;
    const ENEMY_IMPACT_SFX_VOLUME = 0.20;
    const ENEMY_IMPACT_SFX_INTERVAL = 55;
    const BASIC_SHOT_AUDIO_POOL_SIZE = 4;
    const BOSS_CROSSFADE_DURATION = 1.8;
    const WAVE_CLEAR_HEAL_AMOUNT = 12;
    const HEALTH_REGEN_CONFIG = {
        activationPercent: 0.45,
        maximumRegenPercent: 0.65,
        delayAfterDamage: 3,
        regenPerSecond: 3
    };
    const ULTIMATE_PASSIVE_CHARGE = {
        normalPerSecond: 1.2,
        criticalPerSecond: 2.4,
        criticalHealthPercent: 0.40
    };
    const GAME_KEYS = {
        LEFT: ['ArrowLeft', 'KeyA'],
        RIGHT: ['ArrowRight', 'KeyD'],
        UP: ['ArrowUp', 'KeyW'],
        DOWN: ['ArrowDown', 'KeyS'],
        JUMP: ['Space'],
        RUN: ['ShiftLeft', 'ShiftRight'],
        START: ['Enter'],
        MELEE: ['KeyJ', 'KeyZ'],
        RANGE: ['KeyK', 'KeyX'],
        TARGET_NEXT: ['KeyQ'],
        ULTIMATE: ['KeyR']
    };
    const ULTIMATE_SPRITESHEET_SRC = 'images/void-runner/player_woman/preview-all-frames (3).png';
    const ULTIMATE_COLUMNS = 3;
    const ULTIMATE_ROWS = 3;
    const ULTIMATE_FRAME_WIDTH = 512;
    const ULTIMATE_FRAME_HEIGHT = 512;
    const ULTIMATE_TOTAL_FRAMES = 9;
    const ULTIMATE_FRAME_DURATIONS = [100, 100, 100, 120, 120, 160, 100, 100, 100];
    const ULTIMATE_RELEASE_FRAME = 5;
    const ULTIMATE_CHARGE_PER_DEFEAT = 12;
    const ULTIMATE_CHARGE_ON_HIT = 4;
    const ULTIMATE_STUN_DURATION = 500;
    const ULTIMATE_MIN_TARGETS = 4;
    const ULTIMATE_FLASH_DURATION = 0.2;
    const ULTIMATE_PHASE = {
        CHARGING: 'CHARGING',
        READY: 'READY',
        CASTING: 'CASTING',
        RELEASE: 'RELEASE',
        RECOVERY: 'RECOVERY'
    };
    const BROWSER_BLOCKED_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
    const GAME_CONTROL_KEYS = Object.keys(GAME_KEYS).reduce(function (keys, group) {
        return keys.concat(GAME_KEYS[group]);
    }, []);
    let phaseMusic = null;
    // Boss track: "Darkwave Dealer" — Psychronic
    let bossMusic = null;
    const gameAudio = {
        musicStarted: false,
        manuallyPaused: false,
        currentTrack: 'phase',
        bossTransitionStarted: false,
        bossTrackStarted: false,
        fadeAnimationId: null,
        fadeMode: null,
        pausedFadeMode: null,
        victoryFadeStarted: false
    };
    const SoundManager = {
        unlocked: false,
        enabled: true,
        lastPlayed: new Map(),
        gameActive: false,
        basicShotPool: [],
        basicShotPoolIndex: 0,
        strongShot: null,
        enemyImpact: null
    };

    function codeMatches(code, keys) {
        return keys.indexOf(code) !== -1;
    }

    function isGameAudioPage() {
        return !!(
            document.getElementById('void-runner') &&
            document.getElementById('void-game') &&
            document.getElementById('start-void-game')
        );
    }

    function createMusicAudio(src, volume, errorMessage) {
        const audio = new Audio(src);

        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = volume;
        audio.addEventListener('error', function () {
            console.error(errorMessage, src);
        });
        audio.load();

        return audio;
    }

    function initializeMusicAudio() {
        if (!isGameAudioPage()) {
            return false;
        }

        if (!phaseMusic) {
            phaseMusic = createMusicAudio(PHASE_MUSIC_SRC, PHASE_MUSIC_VOLUME, 'Falha ao carregar a trilha:');
        }

        if (!bossMusic) {
            // Boss track: "Darkwave Dealer" - Psychronic, Pixabay Music.
            bossMusic = createMusicAudio(BOSS_MUSIC_SRC, 0, 'Falha ao carregar a musica do Null Warden:');
        }

        return true;
    }

    function createSfxAudio(src, volume) {
        const audio = new Audio(src);

        audio.preload = 'auto';
        audio.volume = volume;
        audio.addEventListener('error', function () {
            console.error('[SFX] falha ao carregar:', src);
        });
        audio.load();

        return audio;
    }

    function initializeSoundManager() {
        if (!isGameAudioPage()) {
            return false;
        }

        if (SoundManager.basicShotPool.length > 0) {
            return true;
        }

        // Pool pequeno para tiros rapidos nao cortarem o disparo anterior.
        SoundManager.basicShotPool = Array.from({ length: BASIC_SHOT_AUDIO_POOL_SIZE }, function () {
            return createSfxAudio(TRIX_BASIC_SHOT_SFX_SRC, TRIX_BASIC_SHOT_SFX_VOLUME);
        });
        SoundManager.strongShot = createSfxAudio(TRIX_STRONG_SHOT_SFX_SRC, TRIX_STRONG_SHOT_SFX_VOLUME);
        SoundManager.enemyImpact = createSfxAudio(ENEMY_IMPACT_SFX_SRC, ENEMY_IMPACT_SFX_VOLUME);

        return true;
    }

    async function ensureSfxAudioReady() {
        if (!initializeMusicAudio() || !initializeSoundManager()) {
            console.error('[SFX] audio do jogo nao foi inicializado nesta pagina');
            return false;
        }

        SoundManager.unlocked = true;
        return true;
    }

    function canPlaySfx() {
        if (!isGameAudioPage() || !SoundManager.enabled || !SoundManager.unlocked) {
            return false;
        }

        return SoundManager.gameActive;
    }

    function resetAudioTime(audio) {
        if (!audio) {
            return;
        }

        try {
            audio.currentTime = 0;
        } catch (error) {
            // Alguns navegadores so permitem seek depois dos metadados do MP3.
        }
    }

    function stopAudioElement(audio) {
        if (!audio) {
            return;
        }

        audio.pause();
        resetAudioTime(audio);
    }

    function stopGameAudio() {
        if (gameAudio.fadeAnimationId !== null) {
            cancelAnimationFrame(gameAudio.fadeAnimationId);
            gameAudio.fadeAnimationId = null;
        }

        stopAudioElement(phaseMusic);
        stopAudioElement(bossMusic);
        SoundManager.basicShotPool.forEach(stopAudioElement);
        stopAudioElement(SoundManager.strongShot);
        stopAudioElement(SoundManager.enemyImpact);

        if (phaseMusic) {
            phaseMusic.volume = PHASE_MUSIC_VOLUME;
        }

        if (bossMusic) {
            bossMusic.volume = BOSS_MUSIC_VOLUME;
        }

        gameAudio.musicStarted = false;
        gameAudio.manuallyPaused = false;
        gameAudio.currentTrack = 'phase';
        gameAudio.bossTransitionStarted = false;
        gameAudio.bossTrackStarted = false;
        gameAudio.victoryFadeStarted = false;
        gameAudio.fadeMode = null;
        gameAudio.pausedFadeMode = null;
        SoundManager.gameActive = false;
        SoundManager.lastPlayed.clear();
    }

    function canPlayNamedSound(soundName, minimumInterval) {
        const now = performance.now();
        const previous = SoundManager.lastPlayed.get(soundName) ?? -Infinity;

        if (now - previous < minimumInterval) {
            return false;
        }

        SoundManager.lastPlayed.set(soundName, now);
        return true;
    }

    function playSfxAudio(audio, volume) {
        if (!audio) {
            return;
        }

        audio.volume = volume;

        resetAudioTime(audio);

        const playPromise = audio.play();

        if (playPromise && playPromise.catch) {
            playPromise.catch(function () {
                // O navegador pode bloquear ate a primeira interacao real do jogador.
            });
        }
    }

    function playTrixBasicShotSfx() {
        if (!canPlaySfx()) {
            return;
        }

        const pool = SoundManager.basicShotPool;

        if (!pool.length) {
            return;
        }

        const audio = pool[SoundManager.basicShotPoolIndex % pool.length];

        SoundManager.basicShotPoolIndex++;
        playSfxAudio(audio, TRIX_BASIC_SHOT_SFX_VOLUME);
    }

    function playTrixStrongShotSfx() {
        if (!canPlaySfx()) {
            return;
        }

        playSfxAudio(SoundManager.strongShot, TRIX_STRONG_SHOT_SFX_VOLUME);
    }

    function playEnemyImpactSfx() {
        if (!canPlaySfx() || !canPlayNamedSound('impact', ENEMY_IMPACT_SFX_INTERVAL)) {
            return;
        }

        playSfxAudio(SoundManager.enemyImpact, ENEMY_IMPACT_SFX_VOLUME);
    }

    class CyberVoidActionGame {
        constructor(elements) {
            this.canvas = elements.canvas;
            this.ctx = this.canvas.getContext('2d');
            this.gameStage = elements.gameStage || this.canvas;
            this.startButton = elements.startButton;
            this.fullscreenButton = elements.fullscreenButton;
            this.healthElement = elements.healthElement;
            this.phaseElement = elements.phaseElement;
            this.enemiesElement = elements.enemiesElement;
            this.input = {
                left: false,
                right: false,
                up: false,
                down: false,
                run: false,
                jumpPressed: false,
                meleePressed: false,
                rangePressed: false
            };
            this.cameraX = 0;
            this.lastTime = 0;
            this.animationFrameId = null;
            this.isRunning = false;
            this.gameStarted = false;
            this.gameState = GAME_STATE.GAME_OVER;
            this.deathStartedAt = 0;
            this.gameOverStartedAt = 0;
            this.currentPhaseIndex = 0;
            this.startSequenceId = 0;
            this.checkpoint = {
                phase: 0,
                position: null
            };
            this.effects = new game.EffectsSystem();
            this.player = new game.Player();
            this.enemySystem = new game.EnemySystem(this.effects);
            this.bossSystem = new game.BossSystem(this.effects);
            this.combat = new game.CombatSystem(this.effects);
            this.phaseManager = new game.PhaseManager(this.enemySystem, this.bossSystem);
            this.currentPhase = this.phaseManager.loadPhase(0);
            this.backgroundManager = new game.BackgroundManager();
            this.backgroundManager.loadPhase(this.currentPhase);
            this.updateCheckpoint(0, this.currentPhase);
            this.nextPhase = null;
            this.selectedTargetId = null;
            this.activeTargetId = null;
            this.manualTargetActive = false;
            this.nextTargetCycleAt = 0;
            this.trixUltimate = this.createTrixUltimateState();
            this.healthRegeneration = this.createHealthRegenerationState();
            this.ultimateImage = this.loadUltimateImage();
            this.bindEvents();
            this.createGameOverButton();
            this.createBossVictoryButtons();
            this.drawInitialScreen();
        }

        bindEvents() {
            this.startButton.addEventListener('click', () => this.start());
            this.fullscreenButton.addEventListener('click', (event) => {
                event.currentTarget.blur();
                this.toggleFullscreen();
            });

            // Captura antes do navegador rolar a pagina com as setas durante o jogo.
            document.addEventListener('keydown', (event) => this.handleKeyDown(event), { capture: true });
            document.addEventListener('keyup', (event) => this.handleKeyUp(event), { capture: true });
            this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
            document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
            document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
            document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
            window.addEventListener('resize', () => this.resizeCanvasForScreen());
            window.addEventListener('pagehide', () => stopGameAudio());
            window.addEventListener('beforeunload', () => stopGameAudio());
        }

        handleKeyDown(event) {
            this.blockBrowserControls(event);

            if (codeMatches(event.code, GAME_KEYS.START) && this.gameState === GAME_STATE.GAME_OVER && this.gameStarted) {
                event.preventDefault();
                this.restartFromCheckpoint();
                return;
            }

            if ((event.code === 'Space' || codeMatches(event.code, GAME_KEYS.START)) && !this.isRunning) {
                event.preventDefault();
                this.start();
                return;
            }

            if (!this.gameStarted || this.gameState !== GAME_STATE.PLAYING) {
                return;
            }

            if (codeMatches(event.code, GAME_KEYS.LEFT)) {
                this.input.left = true;
            }

            if (codeMatches(event.code, GAME_KEYS.RIGHT)) {
                this.input.right = true;
            }

            if (codeMatches(event.code, GAME_KEYS.JUMP) && this.isRunning && !event.repeat) {
                this.input.jumpPressed = true;
            }

            if (codeMatches(event.code, GAME_KEYS.UP)) {
                this.input.up = true;
            }

            if (codeMatches(event.code, GAME_KEYS.DOWN)) {
                this.input.down = true;
            }

            if (codeMatches(event.code, GAME_KEYS.RUN)) {
                this.input.run = true;
            }

            if (codeMatches(event.code, GAME_KEYS.MELEE) && !event.repeat) {
                this.input.meleePressed = true;
            }

            if (codeMatches(event.code, GAME_KEYS.RANGE) && !event.repeat) {
                this.input.rangePressed = true;
            }

            if (codeMatches(event.code, GAME_KEYS.TARGET_NEXT) && !event.repeat) {
                event.preventDefault();
                this.cycleManualTarget(performance.now());
            }

            if (codeMatches(event.code, GAME_KEYS.ULTIMATE) && !event.repeat) {
                event.preventDefault();
                this.tryActivateUltimate();
            }
        }

        handleCanvasClick(event) {
            if (!this.gameStarted || this.gameState !== GAME_STATE.PLAYING) {
                return;
            }

            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const canvasX = (event.clientX - rect.left) * scaleX;
            const canvasY = (event.clientY - rect.top) * scaleY;
            const targetId = this.selectCombatTargetAt(canvasX, canvasY);

            if (!targetId) {
                return;
            }

            event.preventDefault();
            this.selectedTargetId = targetId;
            this.activeTargetId = targetId;
            this.manualTargetActive = true;
        }

        cycleManualTarget(now) {
            if (now < this.nextTargetCycleAt) {
                return;
            }

            this.nextTargetCycleAt = now + 180;

            const baseTargetId = this.selectedTargetId || this.activeTargetId;
            const targetId = this.cycleCombatTarget(baseTargetId);

            if (!targetId) {
                this.clearTargetSelection();
                return;
            }

            this.selectedTargetId = targetId;
            this.activeTargetId = targetId;
            this.manualTargetActive = true;
        }

        createTrixUltimateState() {
            return {
                charge: 0,
                maxCharge: 100,
                ready: false,
                active: false,
                phase: ULTIMATE_PHASE.CHARGING,
                frameIndex: 0,
                frameTimer: 0,
                usedThisFrame: false,
                pendingCharge: 0,
                message: '',
                messageTimer: 0,
                flashTimer: 0,
                previousInvulnerable: false,
                previousInvulnerabilityTimer: 0
            };
        }

        createHealthRegenerationState() {
            return {
                enabled: false,
                timeSinceLastDamage: 0,
                accumulatedHealing: 0
            };
        }

        loadUltimateImage() {
            const image = new Image();

            image.failed = false;
            image.onerror = function () {
                image.failed = true;
                console.warn('Spritesheet do Colapso do Void nao carregou:', ULTIMATE_SPRITESHEET_SRC);
            };
            image.onload = function () {
                if (image.naturalWidth !== 1536 || image.naturalHeight !== 1536) {
                    console.warn('Spritesheet do Colapso do Void com dimensoes inesperadas:', image.naturalWidth, image.naturalHeight);
                }
            };
            image.src = ULTIMATE_SPRITESHEET_SRC;
            return image;
        }

        resetTrixUltimate() {
            this.trixUltimate.charge = 0;
            this.trixUltimate.ready = false;
            this.trixUltimate.active = false;
            this.trixUltimate.phase = ULTIMATE_PHASE.CHARGING;
            this.trixUltimate.frameIndex = 0;
            this.trixUltimate.frameTimer = 0;
            this.trixUltimate.usedThisFrame = false;
            this.trixUltimate.pendingCharge = 0;
            this.trixUltimate.message = '';
            this.trixUltimate.messageTimer = 0;
            this.trixUltimate.flashTimer = 0;
            this.trixUltimate.previousInvulnerable = false;
            this.trixUltimate.previousInvulnerabilityTimer = 0;
        }

        resetHealthRegeneration() {
            this.healthRegeneration.enabled = false;
            this.healthRegeneration.timeSinceLastDamage = 0;
            this.healthRegeneration.accumulatedHealing = 0;
        }

        addUltimateCharge(amount) {
            const ultimate = this.trixUltimate;

            if (!ultimate || amount <= 0) {
                return;
            }

            if (ultimate.active) {
                ultimate.pendingCharge += amount;
                return;
            }

            ultimate.charge = Math.min(ultimate.maxCharge, ultimate.charge + amount);
            ultimate.ready = ultimate.charge >= ultimate.maxCharge;
            ultimate.phase = ultimate.ready ? ULTIMATE_PHASE.READY : ULTIMATE_PHASE.CHARGING;
        }

        showUltimateMessage(text, seconds) {
            this.trixUltimate.message = text;
            this.trixUltimate.messageTimer = seconds;
        }

        canActivateUltimate() {
            return this.trixUltimate.ready &&
                !this.trixUltimate.active &&
                this.player &&
                !this.player.isDead &&
                this.gameState === GAME_STATE.PLAYING;
        }

        tryActivateUltimate() {
            if (!this.canActivateUltimate()) {
                return;
            }

            const validEnemies = this.enemySystem.getUltimateTargets(this.cameraX, this.canvas.width);
            const validBoss = this.bossSystem.getCombatTarget(this.cameraX, this.canvas.width);

            if (validEnemies.length < ULTIMATE_MIN_TARGETS && !validBoss) {
                this.showUltimateMessage('POUCOS ALVOS', 1);
                return;
            }

            const ultimate = this.trixUltimate;

            ultimate.active = true;
            ultimate.phase = ULTIMATE_PHASE.CASTING;
            ultimate.frameIndex = 0;
            ultimate.frameTimer = 0;
            ultimate.usedThisFrame = false;
            ultimate.pendingCharge = 0;
            ultimate.previousInvulnerable = this.player.isInvulnerable;
            ultimate.previousInvulnerabilityTimer = this.player.invulnerabilityTimer;
            this.player.isInvulnerable = true;
            this.player.invulnerabilityTimer = Math.max(this.player.invulnerabilityTimer || 0, 1.2);
            this.resetInput();
            playTrixStrongShotSfx();
        }

        handleKeyUp(event) {
            this.blockBrowserControls(event);

            if (!this.gameStarted) {
                return;
            }

            if (codeMatches(event.code, GAME_KEYS.LEFT)) this.input.left = false;
            if (codeMatches(event.code, GAME_KEYS.RIGHT)) this.input.right = false;
            if (codeMatches(event.code, GAME_KEYS.UP)) this.input.up = false;
            if (codeMatches(event.code, GAME_KEYS.DOWN)) this.input.down = false;
            if (codeMatches(event.code, GAME_KEYS.RUN)) this.input.run = false;
        }

        createGameOverButton() {
            this.gameOverButton = document.createElement('button');
            this.gameOverButton.type = 'button';
            this.gameOverButton.className = 'btn-primary';
            this.gameOverButton.textContent = 'REINICIAR ZONA';
            this.gameOverButton.style.position = 'absolute';
            this.gameOverButton.style.left = '50%';
            this.gameOverButton.style.top = '66%';
            this.gameOverButton.style.transform = 'translate(-50%, -50%)';
            this.gameOverButton.style.zIndex = '4';
            this.gameOverButton.style.display = 'none';
            this.gameOverButton.addEventListener('click', () => this.restartFromCheckpoint());
            this.gameStage.appendChild(this.gameOverButton);
        }

        createBossVictoryButtons() {
            this.continueButton = document.createElement('button');
            this.continueButton.type = 'button';
            this.continueButton.className = 'btn-primary';
            this.continueButton.textContent = 'CONTINUAR';
            this.continueButton.style.position = 'absolute';
            this.continueButton.style.left = '42%';
            this.continueButton.style.top = '63%';
            this.continueButton.style.transform = 'translate(-50%, -50%)';
            this.continueButton.style.zIndex = '4';
            this.continueButton.style.display = 'none';
            this.continueButton.addEventListener('click', () => this.showComingSoonPhaseMessage());

            this.replayButton = document.createElement('button');
            this.replayButton.type = 'button';
            this.replayButton.className = 'btn-primary btn-primary-secundario';
            this.replayButton.textContent = 'JOGAR NOVAMENTE';
            this.replayButton.style.position = 'absolute';
            this.replayButton.style.left = '58%';
            this.replayButton.style.top = '63%';
            this.replayButton.style.transform = 'translate(-50%, -50%)';
            this.replayButton.style.zIndex = '4';
            this.replayButton.style.display = 'none';
            this.replayButton.addEventListener('click', () => this.start(0));

            this.gameStage.appendChild(this.continueButton);
            this.gameStage.appendChild(this.replayButton);
        }

        updateCheckpoint(phaseIndex, phase) {
            this.checkpoint = {
                phase: phaseIndex,
                position: {
                    x: 90,
                    y: typeof phase.groundY === 'number' ? phase.groundY : game.GROUND_Y
                }
            };
        }

        async start(phaseIndex) {
            if (this.gameState === GAME_STATE.RESTARTING ||
                this.gameState === GAME_STATE.PLAYING && !(this.bossSystem && this.bossSystem.finalMessageActive)) {
                return;
            }

            // Garantia de arquitetura: existe apenas um loop principal ativo.
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            const sequenceId = ++this.startSequenceId;
            const targetPhaseIndex = typeof phaseIndex === 'number' ? phaseIndex : this.checkpoint.phase;

            this.gameState = GAME_STATE.RESTARTING;
            SoundManager.gameActive = false;
            SoundManager.lastPlayed.clear();
            await ensureSfxAudioReady();
            this.stopPhaseMusic();
            await this.startPhaseMusic();
            this.hideGameOverButton();
            this.hideBossVictoryButtons();
            this.currentPhaseIndex = targetPhaseIndex;
            this.currentPhase = this.phaseManager.startPhase(targetPhaseIndex, performance.now());
            // A fase so e liberada depois que o Drone Sentinel tentou carregar todos os frames.
            await Promise.all([
                this.enemySystem.whenVisualsReady(),
                this.bossSystem.whenVisualsReady()
            ]);

            if (sequenceId !== this.startSequenceId) {
                return;
            }

            this.backgroundManager.loadPhase(this.currentPhase);
            this.updateCheckpoint(targetPhaseIndex, this.currentPhase);
            this.nextPhase = null;
            this.deathStartedAt = 0;
            this.gameOverStartedAt = 0;
            this.effects.reset();
            this.combat.reset();
            this.clearTargetSelection();
            this.resetTrixUltimate();
            this.resetHealthRegeneration();
            this.player.reset(this.currentPhase);
            if (this.checkpoint.position) {
                this.player.x = this.checkpoint.position.x;
                this.player.y = this.checkpoint.position.y;
            }
            this.resetInput();
            this.cameraX = 0;
            this.isRunning = true;
            this.gameStarted = true;
            this.gameState = GAME_STATE.PLAYING;
            SoundManager.gameActive = true;
            this.resizeCanvasForScreen();
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        }

        restartFromCheckpoint() {
            if (this.gameState === GAME_STATE.RESTARTING) {
                return;
            }

            this.start(this.checkpoint.phase);
        }

        blockBrowserControls(event) {
            if (!this.gameStarted || GAME_CONTROL_KEYS.indexOf(event.code) === -1) {
                return;
            }

            event.preventDefault();
        }

        toggleFullscreen() {
            // Botao opcional: o jogador escolhe quando colocar o palco em tela cheia.
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                this.exitFullscreen();
                return;
            }

            this.enterFullscreen();
        }

        enterFullscreen() {
            // Fullscreen precisa nascer de uma acao do usuario: clique no botao de icone.
            const requestFullscreen = this.gameStage.requestFullscreen || this.gameStage.webkitRequestFullscreen;

            if (document.fullscreenElement || document.webkitFullscreenElement || !requestFullscreen) {
                return;
            }

            const fullscreenRequest = requestFullscreen.call(this.gameStage);

            if (fullscreenRequest && fullscreenRequest.catch) {
                fullscreenRequest.catch(function (error) {
                    console.warn('Nao foi possivel ativar tela cheia:', error);
                });
            }
        }

        exitFullscreen() {
            const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;

            if (!exitFullscreen) {
                return;
            }

            const fullscreenExit = exitFullscreen.call(document);

            if (fullscreenExit && fullscreenExit.catch) {
                fullscreenExit.catch(function (error) {
                    console.warn('Nao foi possivel sair da tela cheia:', error);
                });
            }
        }

        handleFullscreenChange() {
            this.resizeCanvasForScreen();
            this.updateFullscreenButton();

            // Sair da tela cheia nao encerra a fase.
        }

        handleVisibilityChange() {
            if (document.hidden) {
                SoundManager.gameActive = false;
                this.pausePhaseMusic();
                return;
            }

            SoundManager.gameActive = this.gameStarted &&
                this.gameState === GAME_STATE.PLAYING &&
                !(this.bossSystem && this.bossSystem.finalMessageActive);
            this.resumePhaseMusic();
        }

        releaseBrowserControls() {
            // Ao sair da fase/tela cheia, o navegador volta a receber as setas normalmente.
            this.gameStarted = false;
            this.resetInput();
        }

        resetInput() {
            this.input.left = false;
            this.input.right = false;
            this.input.up = false;
            this.input.down = false;
            this.input.run = false;
            this.input.jumpPressed = false;
            this.input.meleePressed = false;
            this.input.rangePressed = false;
        }

        clearTargetSelection() {
            this.selectedTargetId = null;
            this.activeTargetId = null;
            this.manualTargetActive = false;
            this.nextTargetCycleAt = 0;
        }

        async startPhaseMusic() {
            if (gameAudio.musicStarted) {
                return;
            }

            if (!initializeMusicAudio()) {
                return;
            }

            this.cancelAudioFade();
            phaseMusic.pause();
            bossMusic.pause();
            phaseMusic.volume = PHASE_MUSIC_VOLUME;
            bossMusic.volume = 0;
            gameAudio.currentTrack = 'phase';
            gameAudio.bossTransitionStarted = false;
            gameAudio.bossTrackStarted = false;
            gameAudio.victoryFadeStarted = false;

            try {
                phaseMusic.currentTime = 0;
                bossMusic.currentTime = 0;
                await phaseMusic.play();
                gameAudio.musicStarted = true;
                gameAudio.manuallyPaused = false;
            } catch (error) {
                console.warn('A musica aguardara interacao do jogador:', error);
            }
        }

        pausePhaseMusic() {
            if (!phaseMusic || !bossMusic) {
                return;
            }

            const shouldMarkPaused = !phaseMusic.paused || !bossMusic.paused;

            if (gameAudio.fadeAnimationId !== null) {
                gameAudio.pausedFadeMode = gameAudio.fadeMode;
                this.cancelAudioFade();
            }

            if (!phaseMusic.paused) {
                phaseMusic.pause();
            }

            if (!bossMusic.paused) {
                bossMusic.pause();
            }

            if (shouldMarkPaused) {
                gameAudio.manuallyPaused = true;
            }
        }

        async resumePhaseMusic() {
            if (!gameAudio.musicStarted ||
                !gameAudio.manuallyPaused ||
                !phaseMusic ||
                !bossMusic ||
                !this.gameStarted ||
                this.gameState !== GAME_STATE.PLAYING ||
                this.bossSystem && this.bossSystem.finalMessageActive) {
                return;
            }

            try {
                if (gameAudio.pausedFadeMode === 'bossCrossfade') {
                    await this.completeBossMusicTransition();
                    gameAudio.pausedFadeMode = null;
                } else if (gameAudio.pausedFadeMode === 'bossFadeOut') {
                    await bossMusic.play();
                    gameAudio.victoryFadeStarted = false;
                    gameAudio.pausedFadeMode = null;
                    this.fadeOutBossMusic(2);
                } else if (gameAudio.bossTransitionStarted && gameAudio.bossTrackStarted && gameAudio.currentTrack !== 'boss') {
                    await this.completeBossMusicTransition();
                } else if (gameAudio.currentTrack === 'boss') {
                    await bossMusic.play();
                } else {
                    await phaseMusic.play();
                }

                gameAudio.manuallyPaused = false;
            }
            catch (error) {
                console.warn('Nao foi possivel continuar a musica:', error);
            }
        }

        stopPhaseMusic() {
            stopGameAudio();
        }

        async crossfadeToBossMusic() {
            if (gameAudio.currentTrack === 'boss' || !gameAudio.musicStarted) {
                return;
            }

            if (!phaseMusic || !bossMusic) {
                return;
            }

            this.cancelAudioFade();
            gameAudio.fadeMode = 'bossCrossfade';

            try {
                bossMusic.currentTime = 0;
                bossMusic.volume = 0;
                await bossMusic.play();
                gameAudio.bossTrackStarted = true;
            } catch (error) {
                console.warn('Nao foi possivel iniciar a musica do boss:', error);
                gameAudio.fadeMode = null;
                return;
            }

            const startedAt = performance.now();
            const phaseInitialVolume = phaseMusic.volume;

            const updateCrossfade = (now) => {
                const progress = Math.min(1, (now - startedAt) / (BOSS_CROSSFADE_DURATION * 1000));

                phaseMusic.volume = phaseInitialVolume * (1 - progress);
                bossMusic.volume = BOSS_MUSIC_VOLUME * progress;

                if (progress < 1) {
                    gameAudio.fadeAnimationId = requestAnimationFrame(updateCrossfade);
                    return;
                }

                this.completeBossMusicTransition().catch(function (error) {
                    console.warn('Nao foi possivel concluir a transicao da musica do boss:', error);
                });
            };

            gameAudio.fadeAnimationId = requestAnimationFrame(updateCrossfade);
        }

        async completeBossMusicTransition() {
            if (!phaseMusic || !bossMusic) {
                return;
            }

            this.cancelAudioFade();
            phaseMusic.pause();

            try {
                phaseMusic.currentTime = 0;
            } catch (error) {
                console.warn('Nao foi possivel reiniciar a musica:', error);
            }

            phaseMusic.volume = PHASE_MUSIC_VOLUME;
            bossMusic.volume = BOSS_MUSIC_VOLUME;

            if (bossMusic.paused) {
                await bossMusic.play();
                gameAudio.bossTrackStarted = true;
            }

            gameAudio.currentTrack = 'boss';
            gameAudio.fadeMode = null;
        }

        startBossMusicTransition() {
            if (!gameAudio.bossTransitionStarted) {
                gameAudio.bossTransitionStarted = true;
                this.crossfadeToBossMusic();
            }
        }

        fadeOutBossMusic(duration = 2) {
            if (gameAudio.victoryFadeStarted || !gameAudio.musicStarted) {
                return;
            }

            if (!phaseMusic || !bossMusic) {
                return;
            }

            gameAudio.victoryFadeStarted = true;
            gameAudio.manuallyPaused = false;
            gameAudio.fadeMode = 'bossFadeOut';

            const fadingMusic = gameAudio.currentTrack === 'boss' || gameAudio.bossTrackStarted ? bossMusic : phaseMusic;
            const restoredVolume = fadingMusic === bossMusic ? BOSS_MUSIC_VOLUME : PHASE_MUSIC_VOLUME;
            const initialVolume = fadingMusic.volume;
            const startedAt = performance.now();

            const updateFade = (now) => {
                const progress = Math.min(1, (now - startedAt) / (duration * 1000));

                fadingMusic.volume = initialVolume * (1 - progress);

                if (progress < 1) {
                    gameAudio.fadeAnimationId = requestAnimationFrame(updateFade);
                    return;
                }

                fadingMusic.pause();

                try {
                    fadingMusic.currentTime = 0;
                } catch (error) {
                    console.warn('Nao foi possivel reiniciar a musica do boss:', error);
                }

                fadingMusic.volume = restoredVolume;
                gameAudio.musicStarted = false;
                gameAudio.manuallyPaused = false;
                gameAudio.currentTrack = 'phase';
                gameAudio.bossTrackStarted = false;
                gameAudio.fadeAnimationId = null;
                gameAudio.fadeMode = null;
            };

            gameAudio.fadeAnimationId = requestAnimationFrame(updateFade);
        }

        cancelAudioFade() {
            if (gameAudio.fadeAnimationId !== null) {
                cancelAnimationFrame(gameAudio.fadeAnimationId);
                gameAudio.fadeAnimationId = null;
            }

            gameAudio.fadeMode = null;
        }

        getCombatTargets(enemies) {
            const targets = (enemies || this.enemySystem.getAliveEnemies()).slice();
            const boss = this.bossSystem.getCombatTarget(this.cameraX, this.canvas.width);

            if (boss) {
                targets.push(boss);
            }

            return targets;
        }

        getTargetId(target) {
            if (!target) {
                return null;
            }

            return target.targetId || (game.getEnemyTargetId ? game.getEnemyTargetId(target) : null);
        }

        getTargetBounds(target) {
            if (!target) {
                return null;
            }

            if (target.getVisualBounds) {
                return target.getVisualBounds();
            }

            if (target.enemyType === game.ENEMY_TYPE.DRONE) {
                return {
                    x: target.x - target.width * 0.34,
                    y: target.y - target.height * 0.32,
                    width: target.width * 0.68,
                    height: target.height * 0.58
                };
            }

            const hitbox = target.getHitbox ? target.getHitbox() : {
                x: target.x,
                y: target.y,
                width: target.width,
                height: target.height
            };

            return {
                x: hitbox.x - target.width * 0.08,
                y: hitbox.y - target.height * 0.18,
                width: hitbox.width + target.width * 0.16,
                height: hitbox.height + target.height * 0.26
            };
        }

        getTargetCenter(target) {
            const bounds = this.getTargetBounds(target);

            return bounds ? {
                x: bounds.x + bounds.width / 2,
                y: bounds.y + bounds.height / 2
            } : { x: 0, y: 0 };
        }

        getTargetableCombatTargets() {
            const enemies = this.enemySystem.getTargetableEnemies ?
                this.enemySystem.getTargetableEnemies(this.cameraX, this.canvas.width) :
                this.enemySystem.getAliveEnemies();
            const boss = this.bossSystem.getCombatTarget(this.cameraX, this.canvas.width);
            const targets = enemies.slice();

            if (boss) {
                targets.push(boss);
            }

            return targets;
        }

        getValidCombatTargetById(targetId) {
            if (!targetId) {
                return null;
            }

            return this.bossSystem.getBossByTargetId(targetId, this.cameraX, this.canvas.width) ||
                this.enemySystem.getValidTargetById(targetId, this.cameraX, this.canvas.width);
        }

        selectCombatTargetAt(canvasX, canvasY) {
            const bossTargetId = this.bossSystem.selectTargetAt(canvasX, canvasY, this.cameraX, this.canvas.width);

            if (bossTargetId) {
                return bossTargetId;
            }

            return this.enemySystem.selectTargetAt(canvasX, canvasY, this.cameraX, this.canvas.width);
        }

        cycleCombatTarget(currentTargetId) {
            const candidates = this.getTargetableCombatTargets().sort((a, b) => {
                if (a.x !== b.x) {
                    return a.x - b.x;
                }

                const depthA = a.getDepthY ? a.getDepthY() : a.y;
                const depthB = b.getDepthY ? b.getDepthY() : b.y;

                return depthA - depthB;
            });

            if (candidates.length <= 0) {
                return null;
            }

            const currentIndex = candidates.findIndex((target) => this.getTargetId(target) === currentTargetId);
            const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % candidates.length;

            return this.getTargetId(candidates[nextIndex]);
        }

        getDefaultCombatTargetId() {
            const candidates = this.getTargetableCombatTargets();

            if (candidates.length <= 0) {
                return null;
            }

            const origin = this.player.getMuzzlePoint ? this.player.getMuzzlePoint() : { x: this.player.x, y: this.player.y };
            const aimDirection = this.player.direction < 0 ? -1 : 1;
            let best = null;
            let bestScore = Infinity;

            candidates.forEach((target) => {
                const center = this.getTargetCenter(target);
                const dx = center.x - origin.x;
                const dy = center.y - origin.y;
                const distance = Math.hypot(dx, dy);
                const behindPenalty = distance > 0 && dx / distance * aimDirection < 0 ? 900 : 0;
                const score = distance + behindPenalty + Math.abs(dy) * 0.35;

                if (score < bestScore) {
                    best = target;
                    bestScore = score;
                }
            });

            return this.getTargetId(best);
        }

        resizeCanvasForScreen() {
            // O canvas mantem a resolucao logica do jogo. A tela cheia escala por CSS,
            // preservando a proporcao 900x507 e sem deformar a Trix.
            this.canvas.width = GAME_WIDTH;
            this.canvas.height = GAME_HEIGHT;
        }

        updateFullscreenButton() {
            const isFullscreen = document.fullscreenElement === this.gameStage || document.webkitFullscreenElement === this.gameStage;

            this.fullscreenButton.dataset.fullscreen = isFullscreen ? 'true' : 'false';
            this.fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia');
            this.fullscreenButton.setAttribute('title', isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia');
        }

        loop(time) {
            if (!this.isRunning) {
                return;
            }

            const now = performance.now();
            const deltaTime = Math.min(34, time - this.lastTime || 16);

            this.lastTime = time;
            this.update(deltaTime, now);
            this.render();
            this.animationFrameId = requestAnimationFrame((nextTime) => this.loop(nextTime));
        }

        update(deltaTime, now) {
            this.updateUltimateTimers(deltaTime);

            if (this.gameState === GAME_STATE.DEATH) {
                this.updateDeath(deltaTime, now);
                return;
            }

            if (this.gameState === GAME_STATE.GAME_OVER || this.gameState === GAME_STATE.RESTARTING) {
                this.updateHud();
                return;
            }

            const combatActive = this.phaseManager.isCombatActive();
            const enemies = this.enemySystem.getAliveEnemies();
            const combatTargets = this.getCombatTargets(enemies);
            const ultimateActive = this.trixUltimate.active;

            this.updateTargetSelection(combatActive);

            if (combatActive && !ultimateActive && this.input.meleePressed) {
                this.combat.tryMelee(this.player, combatTargets, now);
            }

            if (combatActive && !ultimateActive && this.input.rangePressed) {
                this.combat.tryRange(this.player, now, combatTargets, this.activeTargetId);
            }

            this.input.meleePressed = false;
            this.input.rangePressed = false;
            if (ultimateActive) {
                this.resetInput();
                this.updateTrixUltimate(deltaTime, now);
            } else {
                this.player.update(this.input, this.currentPhase, deltaTime, now);
                this.input.jumpPressed = false;
            }
            this.enemySystem.setViewport(this.cameraX, this.canvas.width);
            if (combatActive) {
                const healthBeforeEnemyUpdate = this.player.health;

                this.enemySystem.update(this.player, deltaTime, now);

                if (this.player.health < healthBeforeEnemyUpdate) {
                    this.handleTrixRealDamage();
                    this.addUltimateCharge(ULTIMATE_CHARGE_ON_HIT);
                }
            }

            if (combatActive) {
                this.bossSystem.tryStartAfterWaves(this.currentPhase, this.enemySystem, this.player, this.cameraX, this.canvas.width);
                this.syncBossAudioState();

                const healthBeforeBossUpdate = this.player.health;

                this.bossSystem.update(this.player, deltaTime, now, this.currentPhase, this.cameraX, this.canvas.width);
                this.syncBossAudioState();

                if (this.player.health < healthBeforeBossUpdate) {
                    this.handleTrixRealDamage();
                    this.addUltimateCharge(ULTIMATE_CHARGE_ON_HIT);
                }
            } else {
                this.bossSystem.update(this.player, deltaTime, now, this.currentPhase, this.cameraX, this.canvas.width);
                this.syncBossAudioState();
            }

            if (this.player.health <= 0 && this.player.state === game.PLAYER_STATE.DEATH) {
                this.enterDeathState(now);
                this.effects.update(deltaTime);
                this.updateHud();
                return;
            }

            this.applyWaveClearHealing();
            this.updateHealthRegeneration(deltaTime);
            this.combat.update(deltaTime, this.cameraX, this.canvas.width, this.getCombatTargets());
            this.combat.updateTimers(now);
            this.effects.update(deltaTime);
            this.addUltimateCharge(this.enemySystem.consumeChargeableDefeats() * ULTIMATE_CHARGE_PER_DEFEAT);
            this.updatePassiveUltimateCharge(deltaTime, combatActive);
            this.updateTargetSelection(combatActive);
            this.phaseManager.update(now);
            this.syncBossVictoryButtons();
            if (this.phaseManager.isComplete() && !this.nextPhase) {
                this.nextPhase = this.phaseManager.prepareNextPhase();
            }
            this.updateCamera();
            this.updateHud();
        }

        enterDeathState(now) {
            this.gameState = GAME_STATE.DEATH;
            SoundManager.gameActive = false;
            this.deathStartedAt = now;
            this.resetInput();
            this.clearTargetSelection();
            this.hideBossVictoryButtons();

            if (this.bossSystem && this.bossSystem.clearHostileProjectiles) {
                this.bossSystem.clearHostileProjectiles();
            }
        }

        updateDeath(deltaTime, now) {
            this.player.update(this.input, this.currentPhase, deltaTime, now);
            this.effects.update(deltaTime);
            this.updateHud();

            if (this.player.isDeathAnimationFinished(now) && now - this.deathStartedAt >= GAME_OVER_DELAY) {
                this.enterGameOverState(now);
            }
        }

        enterGameOverState(now) {
            this.gameState = GAME_STATE.GAME_OVER;
            SoundManager.gameActive = false;
            this.gameOverStartedAt = now;
            this.clearTargetSelection();
            this.hideBossVictoryButtons();
            this.stopPhaseMusic();
            this.showGameOverButton();
        }

        syncBossAudioState() {
            if (!this.bossSystem || !gameAudio.musicStarted) {
                return;
            }

            if (this.bossSystem.bossWarningActive) {
                this.startBossMusicTransition();
            }

            const boss = this.bossSystem.currentBoss;

            if (boss &&
                boss.state === game.NULL_WARDEN_STATE.DEATH &&
                boss.deathFadeTimer > 0) {
                this.fadeOutBossMusic(2);
            }
        }

        updateTargetSelection(combatActive) {
            if (!combatActive || this.gameState !== GAME_STATE.PLAYING) {
                this.activeTargetId = null;
                return;
            }

            if (this.manualTargetActive &&
                this.getValidCombatTargetById(this.selectedTargetId)) {
                this.activeTargetId = this.selectedTargetId;
                return;
            }

            if (this.manualTargetActive) {
                const replacementTargetId = this.cycleCombatTarget(this.selectedTargetId);

                if (replacementTargetId) {
                    this.selectedTargetId = replacementTargetId;
                    this.activeTargetId = replacementTargetId;
                    return;
                }

                this.clearTargetSelection();
            }

            this.activeTargetId = this.getDefaultCombatTargetId();
        }

        applyWaveClearHealing() {
            if (!this.enemySystem.consumeWaveClearRewards || !this.player || this.player.isDead) {
                return;
            }

            const rewards = this.enemySystem.consumeWaveClearRewards();

            if (rewards <= 0) {
                return;
            }

            const maxHealth = this.player.maxHealth || game.COMBAT_BALANCE.trix.maxHealth;

            this.player.health = Math.min(maxHealth, this.player.health + rewards * WAVE_CLEAR_HEAL_AMOUNT);
        }

        getPlayerMaxHealth() {
            return this.player.maxHealth || game.COMBAT_BALANCE.trix.maxHealth;
        }

        getHealthRegenActivationHealth() {
            return this.getPlayerMaxHealth() * HEALTH_REGEN_CONFIG.activationPercent;
        }

        getHealthRegenMaximumHealth() {
            return this.getPlayerMaxHealth() * HEALTH_REGEN_CONFIG.maximumRegenPercent;
        }

        handleTrixRealDamage() {
            const regen = this.healthRegeneration;

            regen.timeSinceLastDamage = 0;
            regen.accumulatedHealing = 0;

            if (this.player.health <= this.getHealthRegenActivationHealth()) {
                regen.enabled = true;
            }
        }

        updateHealthRegeneration(deltaTime) {
            const regen = this.healthRegeneration;

            if (!this.player || this.player.isDead || this.gameState !== GAME_STATE.PLAYING) {
                return;
            }

            const maximumRegenHealth = this.getHealthRegenMaximumHealth();

            if (this.player.health >= maximumRegenHealth) {
                regen.enabled = false;
                regen.timeSinceLastDamage = 0;
                regen.accumulatedHealing = 0;
                return;
            }

            if (!regen.enabled && this.player.health <= this.getHealthRegenActivationHealth()) {
                regen.enabled = true;
            }

            if (!regen.enabled) {
                return;
            }

            const delta = deltaTime / 1000;
            const previousTimeSinceDamage = regen.timeSinceLastDamage;

            regen.timeSinceLastDamage += delta;

            if (regen.timeSinceLastDamage <= HEALTH_REGEN_CONFIG.delayAfterDamage) {
                return;
            }

            const effectiveRegenTime = previousTimeSinceDamage < HEALTH_REGEN_CONFIG.delayAfterDamage ?
                regen.timeSinceLastDamage - HEALTH_REGEN_CONFIG.delayAfterDamage :
                delta;

            regen.accumulatedHealing += effectiveRegenTime * HEALTH_REGEN_CONFIG.regenPerSecond;

            const wholeHealing = Math.floor(regen.accumulatedHealing);

            if (wholeHealing <= 0) {
                return;
            }

            const healthBeforeRegen = this.player.health;

            this.player.health = Math.min(maximumRegenHealth, this.player.health + wholeHealing);
            regen.accumulatedHealing -= wholeHealing;

            if (this.player.health >= maximumRegenHealth) {
                regen.enabled = false;
                regen.timeSinceLastDamage = 0;
                regen.accumulatedHealing = 0;
            } else if (this.player.health === healthBeforeRegen) {
                regen.accumulatedHealing = 0;
            }
        }

        canPassivelyChargeUltimate(combatActive) {
            if (!combatActive || this.gameState !== GAME_STATE.PLAYING || !this.player || this.player.isDead || this.trixUltimate.active) {
                return false;
            }

            if (this.bossSystem.getCombatTarget(this.cameraX, this.canvas.width)) {
                return true;
            }

            return this.enemySystem.getAliveEnemies().some(function (enemy) {
                return enemy && enemy.alive !== false && !enemy.removed;
            });
        }

        updatePassiveUltimateCharge(deltaTime, combatActive) {
            if (!this.canPassivelyChargeUltimate(combatActive)) {
                return;
            }

            const maxHealth = this.getPlayerMaxHealth();
            const healthRatio = maxHealth > 0 ? this.player.health / maxHealth : 1;
            const chargePerSecond = healthRatio <= ULTIMATE_PASSIVE_CHARGE.criticalHealthPercent ?
                ULTIMATE_PASSIVE_CHARGE.criticalPerSecond :
                ULTIMATE_PASSIVE_CHARGE.normalPerSecond;

            this.addUltimateCharge(chargePerSecond * (deltaTime / 1000));
        }

        updateUltimateTimers(deltaTime) {
            const delta = deltaTime / 1000;
            const ultimate = this.trixUltimate;

            ultimate.messageTimer = Math.max(0, ultimate.messageTimer - delta);
            ultimate.flashTimer = Math.max(0, ultimate.flashTimer - delta);
        }

        updateTrixUltimate(deltaTime, now) {
            const ultimate = this.trixUltimate;

            if (!ultimate.active) {
                return;
            }

            this.player.isInvulnerable = true;
            this.player.invulnerabilityTimer = Math.max(this.player.invulnerabilityTimer || 0, 1.2);
            ultimate.frameTimer += deltaTime;

            this.executeUltimateReleaseIfNeeded(now);

            while (ultimate.active && ultimate.frameTimer >= ULTIMATE_FRAME_DURATIONS[ultimate.frameIndex]) {
                ultimate.frameTimer -= ULTIMATE_FRAME_DURATIONS[ultimate.frameIndex];
                ultimate.frameIndex++;

                if (ultimate.frameIndex >= ULTIMATE_TOTAL_FRAMES) {
                    this.finishTrixUltimate();
                    return;
                }

                if (ultimate.frameIndex === ULTIMATE_RELEASE_FRAME) {
                    ultimate.phase = ULTIMATE_PHASE.RELEASE;
                } else if (ultimate.frameIndex > ULTIMATE_RELEASE_FRAME) {
                    ultimate.phase = ULTIMATE_PHASE.RECOVERY;
                }

                this.executeUltimateReleaseIfNeeded(now);
            }
        }

        executeUltimateReleaseIfNeeded(now) {
            const ultimate = this.trixUltimate;

            if (ultimate.frameIndex !== ULTIMATE_RELEASE_FRAME || ultimate.usedThisFrame) {
                return;
            }

            ultimate.usedThisFrame = true;
            ultimate.flashTimer = ULTIMATE_FLASH_DURATION;
            this.executeVoidCollapse(now);
        }

        executeVoidCollapse(now) {
            const validEnemies = this.enemySystem.getUltimateTargets(this.cameraX, this.canvas.width);
            const amountToEliminate = Math.max(1, Math.floor(validEnemies.length / 2));
            const trixCenter = this.player.getBodyHitbox ? this.player.getBodyHitbox() : {
                x: this.player.x,
                y: this.player.y,
                width: this.player.width,
                height: this.player.height
            };
            const centerX = trixCenter.x + trixCenter.width / 2;
            const centerY = trixCenter.y + trixCenter.height / 2;

            validEnemies.sort(function (a, b) {
                const aHitbox = a.getHitbox();
                const bHitbox = b.getHitbox();
                const aCenter = {
                    x: aHitbox.x + aHitbox.width / 2,
                    y: aHitbox.y + aHitbox.height / 2
                };
                const bCenter = {
                    x: bHitbox.x + bHitbox.width / 2,
                    y: bHitbox.y + bHitbox.height / 2
                };
                const distanceA = Math.hypot(aCenter.x - centerX, aCenter.y - centerY);
                const distanceB = Math.hypot(bCenter.x - centerX, bCenter.y - centerY);

                if (Math.abs(distanceA - distanceB) > 0.01) {
                    return distanceA - distanceB;
                }

                const attackingA = a.state === 'attack' || a.state === 'active' ? 1 : 0;
                const attackingB = b.state === 'attack' || b.state === 'active' ? 1 : 0;

                return attackingB - attackingA;
            });

            const eliminated = validEnemies.slice(0, amountToEliminate);
            const survivors = validEnemies.slice(amountToEliminate);

            eliminated.forEach(function (enemy) {
                enemy.defeatedByUltimate = true;
                enemy.damageInvulnerableUntil = 0;

                if (typeof enemy.takeDamage === 'function') {
                    enemy.takeDamage((enemy.health || 0) + (enemy.maxHealth || 0), { source: 'trixUltimate' });
                }
            });

            survivors.forEach((enemy) => {
                this.enemySystem.stunEnemy(enemy, ULTIMATE_STUN_DURATION, now);
            });

            this.applyUltimateBossDamage();
            this.updateTargetSelection(true);
        }

        applyUltimateBossDamage() {
            if (this.bossSystem && this.bossSystem.applyUltimateDamage) {
                this.bossSystem.applyUltimateDamage(0.15);
            }
        }

        finishTrixUltimate() {
            const pendingCharge = this.trixUltimate.pendingCharge;

            this.player.isInvulnerable = this.trixUltimate.previousInvulnerable;
            this.player.invulnerabilityTimer = this.trixUltimate.previousInvulnerabilityTimer;
            this.trixUltimate.active = false;
            this.trixUltimate.frameIndex = 0;
            this.trixUltimate.frameTimer = 0;
            this.trixUltimate.usedThisFrame = false;
            this.trixUltimate.charge = 0;
            this.trixUltimate.ready = false;
            this.trixUltimate.phase = ULTIMATE_PHASE.CHARGING;
            this.trixUltimate.pendingCharge = 0;

            if (pendingCharge > 0) {
                this.addUltimateCharge(pendingCharge);
            }
        }

        showGameOverButton() {
            if (this.gameOverButton) {
                this.gameOverButton.style.display = 'inline-flex';
            }
        }

        hideGameOverButton() {
            if (this.gameOverButton) {
                this.gameOverButton.style.display = 'none';
            }
        }

        showBossVictoryButtons() {
            if (this.continueButton) {
                this.continueButton.style.display = 'inline-flex';
            }

            if (this.replayButton) {
                this.replayButton.style.display = 'inline-flex';
            }
        }

        hideBossVictoryButtons() {
            if (this.continueButton) {
                this.continueButton.style.display = 'none';
            }

            if (this.replayButton) {
                this.replayButton.style.display = 'none';
            }
        }

        showComingSoonPhaseMessage() {
            if (this.bossSystem && this.bossSystem.showComingSoon) {
                this.bossSystem.showComingSoon();
            }
        }

        syncBossVictoryButtons() {
            if (this.bossSystem && this.bossSystem.finalMessageActive && this.gameState === GAME_STATE.PLAYING) {
                SoundManager.gameActive = false;
                this.showBossVictoryButtons();
                return;
            }

            this.hideBossVictoryButtons();
        }

        updateCamera() {
            const focusRatio = typeof this.currentPhase.cameraFocusRatio === 'number' ? this.currentPhase.cameraFocusRatio : 0.42;
            const targetX = this.player.x - this.canvas.width * focusRatio;
            this.cameraX = clamp(targetX, 0, this.currentPhase.length - this.canvas.width);
        }

        render() {
            const shake = this.bossSystem.getScreenShakeOffset ? this.bossSystem.getScreenShakeOffset() : { x: 0, y: 0 };

            if (game.resetNullWardenDrawCounter) {
                game.resetNullWardenDrawCounter();
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.save();
            this.ctx.translate(shake.x, shake.y);
            this.backgroundManager.render(this.ctx, this.cameraX, this.canvas);
            this.renderCombatActors();
            this.combat.render(this.ctx, this.cameraX);
            this.drawPlayer();
            this.effects.render(this.ctx, this.cameraX);
            this.bossSystem.renderProjectiles(this.ctx, this.cameraX);
            this.ctx.restore();
            this.drawUltimateFlash();
            this.drawHud();
            this.bossSystem.renderBossHud(this.ctx, this.canvas.width);
            this.bossSystem.renderWarning(this.ctx, this.canvas.width);
            this.drawPhaseOverlay();
            this.bossSystem.renderVictoryOverlay(this.ctx, this.canvas.width, this.canvas.height);
            this.drawGameOverOverlay();
            this.syncBossVictoryButtons();
        }

        renderCombatActors() {
            const actors = this.enemySystem.getAliveEnemies().filter(function (enemy) {
                return enemy.enemyType !== 'nullWardenBoss';
            });
            const boss = this.bossSystem.currentBoss;

            if (boss && !boss.deathComplete && !boss.removed) {
                actors.push(boss);
            }

            actors.sort(function (a, b) {
                const depthA = a.getDepthY ? a.getDepthY() : a.y;
                const depthB = b.getDepthY ? b.getDepthY() : b.y;

                return depthA - depthB;
            }).forEach((actor) => {
                if (actor.enemyType === 'nullWardenBoss' && actor !== boss) {
                    return;
                }

                actor.render(this.ctx, this.cameraX, this.player);
            });

            if (this.enemySystem.renderSoloEncounter) {
                this.enemySystem.renderSoloEncounter(this.ctx, this.cameraX);
            }
        }

        drawPlayer() {
            // Unico desenho do player por frame. Nenhum outro sistema renderiza a Trix.
            if (this.trixUltimate.active && this.drawTrixUltimate()) {
                return;
            }

            this.player.draw(this.ctx, this.cameraX);
        }

        drawUltimateFlash() {
            if (this.trixUltimate.flashTimer <= 0) {
                return;
            }

            const alpha = 0.18 * clamp(this.trixUltimate.flashTimer / ULTIMATE_FLASH_DURATION, 0, 1);

            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 46, 180, ' + alpha.toFixed(3) + ')';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        drawTrixUltimate() {
            const image = this.ultimateImage;

            if (!image || image.failed || !image.complete || image.naturalWidth <= 0) {
                return false;
            }

            const frameIndex = Math.max(0, Math.min(this.trixUltimate.frameIndex, ULTIMATE_TOTAL_FRAMES - 1));
            const column = frameIndex % ULTIMATE_COLUMNS;
            const row = Math.floor(frameIndex / ULTIMATE_COLUMNS);
            const sourceX = column * ULTIMATE_FRAME_WIDTH;
            const sourceY = row * ULTIMATE_FRAME_HEIGHT;
            const drawWidth = 168;
            const drawHeight = 168;
            const screenX = this.player.x - this.cameraX + this.player.width / 2 - drawWidth / 2;
            const screenY = this.player.getFeetY() - drawHeight;

            this.ctx.save();

            if (this.player.direction < 0) {
                this.ctx.translate(screenX + drawWidth, screenY);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(image, sourceX, sourceY, ULTIMATE_FRAME_WIDTH, ULTIMATE_FRAME_HEIGHT, 0, 0, drawWidth, drawHeight);
            } else {
                this.ctx.drawImage(image, sourceX, sourceY, ULTIMATE_FRAME_WIDTH, ULTIMATE_FRAME_HEIGHT, screenX, screenY, drawWidth, drawHeight);
            }

            this.ctx.restore();
            return true;
        }

        drawHud() {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            this.ctx.fillRect(18, 16, 230, 104);
            this.ctx.fillStyle = '#ff2eb4';
            this.ctx.font = '15px monospace';
            this.ctx.fillText('TRIX', 32, 38);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('HP', 32, 60);
            this.ctx.fillStyle = '#22111f';
            this.ctx.fillRect(62, 50, 160, 12);
            this.ctx.fillStyle = '#37ff8b';
            this.ctx.fillRect(62, 50, 160 * this.getPlayerHealthRatio(), 12);
            this.drawHealthRegenerationHud();
            this.drawUltimateHud();
            this.ctx.restore();
        }

        drawHealthRegenerationHud() {
            if (!this.isHealthRegenerating()) {
                return;
            }

            this.ctx.fillStyle = '#00e5ff';
            this.ctx.font = '10px monospace';
            this.ctx.fillText('REGENERACAO', 124, 38);
        }

        drawUltimateHud() {
            const ultimate = this.trixUltimate;
            const ratio = clamp(ultimate.charge / ultimate.maxCharge, 0, 1);
            const percent = Math.round(ratio * 100);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '11px monospace';
            this.ctx.fillText('COLAPSO DO VOID', 32, 82);
            this.ctx.fillStyle = '#22111f';
            this.ctx.fillRect(32, 90, 150, 10);
            this.ctx.fillStyle = ultimate.ready ? '#ff2eb4' : '#8a2be2';
            this.ctx.fillRect(32, 90, 150 * ratio, 10);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px monospace';
            this.ctx.fillText(percent + '%', 190, 99);

            if (ultimate.messageTimer > 0) {
                this.ctx.fillStyle = '#ff2eb4';
                this.ctx.fillText(ultimate.message, 32, 113);
            } else if (ultimate.ready && !ultimate.active) {
                this.ctx.fillStyle = '#ff2eb4';
                this.ctx.fillText('R - ATIVAR', 32, 113);
            }
        }

        getPlayerHealthRatio() {
            // A barra do HUD usa porcentagem real: vida atual dividida pela vida maxima.
            const maxHealth = this.getPlayerMaxHealth();

            return clamp(this.player.health / maxHealth, 0, 1);
        }

        isHealthRegenerating() {
            return this.healthRegeneration.enabled &&
                this.healthRegeneration.timeSinceLastDamage >= HEALTH_REGEN_CONFIG.delayAfterDamage &&
                this.player &&
                !this.player.isDead &&
                this.player.health < this.getHealthRegenMaximumHealth();
        }

        drawPhaseOverlay() {
            const text = this.phaseManager.getOverlayText();

            if (!text ||
                this.gameState === GAME_STATE.GAME_OVER ||
                this.bossSystem.finalMessageActive ||
                this.bossSystem.bossWarningActive) {
                return;
            }

            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff2eb4';
            this.ctx.font = '34px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text, this.canvas.width / 2, 170);

            if (this.phaseManager.isComplete()) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '16px monospace';
                this.ctx.fillText(this.nextPhase ? 'Proxima fase preparada.' : 'Proxima fase ainda nao cadastrada.', this.canvas.width / 2, 200);
            }

            this.ctx.restore();
        }

        drawGameOverOverlay() {
            if (this.gameState !== GAME_STATE.GAME_OVER) {
                return;
            }

            const progress = clamp((performance.now() - this.gameOverStartedAt) / GAME_OVER_FADE_DURATION, 0, 1);

            this.ctx.save();
            this.ctx.globalAlpha = progress;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff2eb4';
            this.ctx.font = '38px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SINAL PERDIDO', this.canvas.width / 2, 178);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '17px monospace';
            this.ctx.fillText('Trix foi desconectada do CyberVoid', this.canvas.width / 2, 214);
            this.ctx.fillStyle = '#00e5ff';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('Enter tambem reinicia a zona', this.canvas.width / 2, 286);
            this.ctx.restore();
        }

        drawInitialScreen() {
            this.player.reset(this.currentPhase);
            this.hideGameOverButton();
            this.hideBossVictoryButtons();
            this.render();
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff2eb4';
            this.ctx.font = '32px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CYBERVOID ACTION', this.canvas.width / 2, 166);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px monospace';
            this.ctx.fillText('Enter, Espaco ou Iniciar para jogar Rua Neon.', this.canvas.width / 2, 198);
            this.ctx.restore();
        }

        updateHud() {
            const maxHealth = this.getPlayerMaxHealth();

            this.healthElement.textContent = Math.max(0, Math.ceil(this.player.health)) + ' / ' + maxHealth;
            this.phaseElement.textContent = this.currentPhase.name;
            this.enemiesElement.textContent = this.enemySystem.getEnemiesLeftCount ?
                this.enemySystem.getEnemiesLeftCount() :
                this.enemySystem.getAliveEnemies().length;
        }
    }

    game.GAME_STATE = GAME_STATE;
    game.SoundManager = SoundManager;
    game.ensureSfxAudioReady = ensureSfxAudioReady;
    game.playTrixBasicShotSfx = playTrixBasicShotSfx;
    game.playTrixStrongShotSfx = playTrixStrongShotSfx;
    game.playEnemyImpactSfx = playEnemyImpactSfx;
    document.addEventListener('DOMContentLoaded', function () {
        const canvas = document.getElementById('void-game');
        const gameStage = document.getElementById('void-game-stage');
        const startButton = document.getElementById('start-void-game');
        const fullscreenButton = document.getElementById('toggle-fullscreen-game');
        const healthElement = document.getElementById('void-player-health');
        const phaseElement = document.getElementById('void-current-phase');
        const enemiesElement = document.getElementById('void-enemies-left');

        if (!canvas || !gameStage || !startButton || !fullscreenButton || !healthElement || !phaseElement || !enemiesElement || window.cyberVoidActionGame) {
            return;
        }

        window.cyberVoidActionGame = new CyberVoidActionGame({
            canvas: canvas,
            gameStage: gameStage,
            startButton: startButton,
            fullscreenButton: fullscreenButton,
            healthElement: healthElement,
            phaseElement: phaseElement,
            enemiesElement: enemiesElement
        });
    });

    game.CyberVoidActionGame = CyberVoidActionGame;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
