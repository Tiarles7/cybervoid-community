(function (game) {
    'use strict';

    const PHASE_STATUS = {
        READY: 'ready',
        INTRO: 'intro',
        ACTIVE: 'active',
        CLEARED: 'cleared',
        COMPLETE: 'complete'
    };

    const PHASE_01_BACKGROUND = 'images/void-runner/background/phase-01-neon-street/';
    const VOID_RUNNER_OBSTACLES = 'images/void-runner/obstacles/';

    const PHASE_01_ASSET_WIDTH = 1672;
    const PHASE_01_ASSET_HEIGHT = 941;
    const PHASE_01_CANVAS_WIDTH = 900;
    const PHASE_01_CANVAS_HEIGHT = Math.round(PHASE_01_CANVAS_WIDTH * (PHASE_01_ASSET_HEIGHT / PHASE_01_ASSET_WIDTH));
    const PHASE_01_SCALE = PHASE_01_CANVAS_WIDTH / PHASE_01_ASSET_WIDTH;
    const PHASE_01_GROUND_SOURCE_Y = 285;
    const PHASE_01_GROUND_SOURCE_HEIGHT = PHASE_01_ASSET_HEIGHT - PHASE_01_GROUND_SOURCE_Y;
    const PHASE_01_GROUND_Y = Math.round(810 * PHASE_01_SCALE);
    const PHASE_01_PLAY_AREA_TOP = Math.round(585 * PHASE_01_SCALE);

    // GROUND_Y e a linha unica onde os pes da Trix encostam no PNG de chao.
    // Para proximas fases, ajuste este valor para a altura visual do asset real.
    const GROUND_Y = PHASE_01_GROUND_Y;

    const phases = [
        {
            id: 1,
            name: 'Rua Neon',
            background: {
                name: 'Rua Neon',
                // Cenario novo baseado em assets da Fase 1.
                // Sistema antigo removido: sem skyline, rua ou plataforma desenhados por codigo.
                layers: [
                    {
                        name: 'fundo distante',
                        type: 'distant',
                        src: PHASE_01_BACKGROUND + 'img1-bg-far.png',
                        parallax: 0.12,
                        y: 0,
                        width: PHASE_01_CANVAS_WIDTH,
                        height: PHASE_01_CANVAS_HEIGHT,
                        alpha: 1
                    },
                    {
                        name: 'fundo medio',
                        type: 'midground',
                        src: PHASE_01_BACKGROUND + 'img2-city-mid.png',
                        parallax: 0.28,
                        y: 0,
                        width: PHASE_01_CANVAS_WIDTH,
                        height: PHASE_01_CANVAS_HEIGHT,
                        alpha: 0.72
                    },
                    {
                        name: 'chao jogavel',
                        type: 'ground',
                        src: PHASE_01_BACKGROUND + 'ground-layer-01-neon-street.png',
                        parallax: 1,
                        y: Math.round(PHASE_01_GROUND_SOURCE_Y * PHASE_01_SCALE),
                        width: PHASE_01_CANVAS_WIDTH,
                        height: Math.round(PHASE_01_GROUND_SOURCE_HEIGHT * PHASE_01_SCALE),
                        sourceY: PHASE_01_GROUND_SOURCE_Y,
                        sourceHeight: PHASE_01_GROUND_SOURCE_HEIGHT,
                        alpha: 1
                    }
                ]
            },
            decorations: {
                aerial: [
                    {
                        name: 'drone distante',
                        src: VOID_RUNNER_OBSTACLES + 'obstacle-drone-01-fixed.png',
                        x: 360,
                        y: 118,
                        width: 92,
                        height: 64,
                        sourceX: 38,
                        sourceY: 190,
                        sourceWidth: 1167,
                        sourceHeight: 802,
                        parallax: 0.2,
                        speedX: -8,
                        alpha: 0.46,
                        cycleWidth: 980
                    },
                    {
                        name: 'orb entre predios',
                        src: VOID_RUNNER_OBSTACLES + 'obstacle-orb-01-transparent.png',
                        x: 820,
                        y: 156,
                        width: 46,
                        height: 46,
                        sourceX: 145,
                        sourceY: 144,
                        sourceWidth: 957,
                        sourceHeight: 958,
                        parallax: 0.24,
                        speedX: 5,
                        alpha: 0.34,
                        cycleWidth: 1120
                    },
                    {
                        name: 'drone alto',
                        src: VOID_RUNNER_OBSTACLES + 'obstacle-drone-01-fixed.png',
                        x: 1520,
                        y: 88,
                        width: 72,
                        height: 50,
                        sourceX: 38,
                        sourceY: 190,
                        sourceWidth: 1167,
                        sourceHeight: 802,
                        parallax: 0.16,
                        speedX: -6,
                        alpha: 0.32,
                        cycleWidth: 1280
                    }
                ],
                ground: [
                    {
                        name: 'spike desligado',
                        src: VOID_RUNNER_OBSTACLES + 'obstacle-spike-01-transparent.png',
                        x: 520,
                        y: GROUND_Y + 2,
                        width: 118,
                        height: 46,
                        sourceX: 49,
                        sourceY: 432,
                        sourceWidth: 1159,
                        sourceHeight: 450,
                        parallax: 1,
                        alpha: 0.58
                    },
                    {
                        name: 'sucata de spike',
                        src: VOID_RUNNER_OBSTACLES + 'obstacle-spike-01-transparent.png',
                        x: 1220,
                        y: GROUND_Y + 4,
                        width: 96,
                        height: 38,
                        sourceX: 49,
                        sourceY: 432,
                        sourceWidth: 1159,
                        sourceHeight: 450,
                        parallax: 1,
                        alpha: 0.42
                    },
                    {
                        name: 'orb quebrado',
                        src: VOID_RUNNER_OBSTACLES + 'obstacle-orb-01-transparent.png',
                        x: 1860,
                        y: GROUND_Y - 10,
                        width: 36,
                        height: 36,
                        sourceX: 145,
                        sourceY: 144,
                        sourceWidth: 957,
                        sourceHeight: 958,
                        parallax: 1,
                        alpha: 0.34
                    }
                ]
            },
            length: 2400,
            // Linha do chao onde os pes da Trix encostam.
            // Para proximas fases, ajuste groundY para casar com o asset de chao do novo cenario.
            groundY: GROUND_Y,
            playAreaTop: PHASE_01_PLAY_AREA_TOP,
            playAreaBottom: GROUND_Y,
            streetTop: PHASE_01_PLAY_AREA_TOP,
            streetBottom: GROUND_Y,
            cameraFocusRatio: 0.36,
            enemies: [
                { x: 620, y: 306 },
                { x: 980, y: 274 },
                { x: 1380, y: 326 },
                { x: 1780, y: 292 }
            ],
            enemyWaves: [
                [
                    { type: 'droneSentinel', x: 620, y: 306 },
                    { type: 'droneSentinel', x: 980, y: 274 }
                ],
                [
                    { type: 'droneSentinel', x: 1380, y: 326 },
                    { type: 'droneSentinel', x: 1780, y: 292 }
                ],
                [
                    { type: 'droneSentinel', x: 1480, y: 312 },
                    { type: 'droneSentinel', x: 1760, y: 274 },
                    { type: 'corruptedFragment', x: 1680 }
                ],
                [
                    { type: 'droneSentinel', x: 1580, y: 326 },
                    { type: 'droneSentinel', x: 1880, y: 292 },
                    { type: 'corruptedFragment', x: 1740 },
                    { type: 'digitalParasite', x: 1940 }
                ],
                [
                    { type: 'droneSentinel', x: 1480, y: 306 },
                    { type: 'droneSentinel', x: 1760, y: 274 },
                    { type: 'droneSentinel', x: 2040, y: 326 },
                    { type: 'corruptedFragment', x: 1820 },
                    { type: 'corruptedFragment', x: 1980 },
                    { type: 'digitalParasite', x: 1900 },
                    { type: 'digitalParasite', x: 2120 }
                ]
            ],
            boss: { type: 'nullWarden' },
            status: PHASE_STATUS.READY
        }
    ];

    class PhaseManager {
        constructor(enemySystem, bossSystem) {
            this.enemySystem = enemySystem;
            this.bossSystem = bossSystem;
            this.phaseIndex = 0;
            this.currentPhase = phases[0];
            this.introUntil = 0;
            this.clearMessageUntil = 0;
        }

        loadPhase(index) {
            const phase = phases[index] || phases[0];

            this.phaseIndex = phases.indexOf(phase);
            this.currentPhase = phase;
            this.currentPhase.status = PHASE_STATUS.READY;
            this.enemySystem.loadEnemies(phase);
            this.bossSystem.prepareBoss(phase.boss);
            this.introUntil = 0;
            this.clearMessageUntil = 0;
            return phase;
        }

        startPhase(index, now) {
            // Fluxo da fase: primeiro mostra o nome, depois libera o combate.
            const phase = this.loadPhase(index);
            phase.status = PHASE_STATUS.INTRO;
            this.introUntil = now + 1700;
            return phase;
        }

        getCurrentPhase() {
            return this.currentPhase;
        }

        update(now) {
            if (this.currentPhase.status === PHASE_STATUS.INTRO && now >= this.introUntil) {
                this.currentPhase.status = PHASE_STATUS.ACTIVE;
            }

            if (this.currentPhase.status === PHASE_STATUS.ACTIVE &&
                this.enemySystem.isCleared() &&
                this.isPhaseObjectiveComplete()) {
                this.currentPhase.status = PHASE_STATUS.CLEARED;
                this.clearMessageUntil = now + 2200;
            }

            if (this.currentPhase.status === PHASE_STATUS.CLEARED && now >= this.clearMessageUntil) {
                this.currentPhase.status = PHASE_STATUS.COMPLETE;
            }
        }

        isCombatActive() {
            return this.currentPhase.status === PHASE_STATUS.ACTIVE;
        }

        isPhaseObjectiveComplete() {
            if (!this.currentPhase.boss) {
                return true;
            }

            return this.bossSystem &&
                this.bossSystem.isPhaseBossComplete &&
                this.bossSystem.isPhaseBossComplete();
        }

        getOverlayText() {
            if (this.currentPhase.status === PHASE_STATUS.INTRO) {
                return this.currentPhase.name;
            }

            if (this.currentPhase.status === PHASE_STATUS.CLEARED || this.currentPhase.status === PHASE_STATUS.COMPLETE) {
                return 'Fase concluída';
            }

            return '';
        }

        prepareNextPhase() {
            // Ponto de expansao: quando novas fases forem adicionadas ao array,
            // este metodo podera carregar phaseIndex + 1.
            return phases[this.phaseIndex + 1] || null;
        }

        isComplete() {
            return this.currentPhase.status === PHASE_STATUS.COMPLETE;
        }
    }

    game.PHASE_STATUS = PHASE_STATUS;
    game.GROUND_Y = GROUND_Y;
    game.phases = phases;
    game.PhaseManager = PhaseManager;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
