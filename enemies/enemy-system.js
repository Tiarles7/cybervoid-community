(function (game) {
    'use strict';

    function rectsOverlap(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    function getNow() {
        return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function sourceReady(source) {
        return source && !source.failed && (source.naturalWidth > 0 || source.width > 0);
    }

    function getCombatBalance() {
        // Inimigos leem vida, dano e cooldowns do balanceamento central.
        return game.COMBAT_BALANCE;
    }

    const ENEMY_TYPE = {
        DRONE: 'droneSentinel',
        FRAGMENT: 'corruptedFragment',
        PARASITE: 'digitalParasite'
    };
    const DRONE_SPRITESHEET_SRC = 'images/void-runner/img-assets-vilo/preview-all-frames.png';
    const DRONE_SHEET_WIDTH = 1088;
    const DRONE_SHEET_HEIGHT = 1360;
    const DRONE_SHEET_COLUMNS = 4;
    const DRONE_FRAME_WIDTH = 272;
    const DRONE_FRAME_HEIGHT = 272;
    const DRONE_DRAW_SIZE = 190;
    const DRONE_COMBAT_DISTANCE = 260;
    const DRONE_MIN_PLAYER_DISTANCE = 128;
    const DRONE_ATTACK_RANGE = 340;
    const DRONE_ATTACK_COOLDOWN = 1450;
    const DRONE_ATTACK_PROJECTILE_FRAME = 1;
    const DRONE_PROJECTILE_SPEED = 360;
    const DRONE_PROJECTILE_TURN_SPEED = 1.8;
    const DRONE_PROJECTILE_LIFETIME = 5;
    const DRONE_PROJECTILE_HOMING_DURATION = 1.4;
    const DRONE_SEPARATION_DISTANCE = 150;
    const DRONE_SEPARATION_FORCE = 0.08;
    const DRONE_MAX_SEPARATION_FORCE = 1.5;
    const DRONE_MAX_SPEED = 138;
    const DRONE_STUCK_ESCAPE_AFTER = 1000;
    const DRONE_STUCK_ESCAPE_DURATION = 420;
    const DRONES_PER_WAVE = 2;
    const WAVE_DELAY = 1.2;
    const WAVE_ENTRY_STAGGER = 0.3;
    const FINAL_WAVE_ENTRY_STAGGER = 0.55;
    const DEBUG_COMBAT_HITBOXES = false;
    const SOLO_ENCOUNTER_CHANCE = 0.35;
    const SOLO_ENCOUNTER_MIN_INTERVAL = 15;
    const SOLO_ENCOUNTER_MAX_PER_PHASE = 1;
    const SOLO_ENCOUNTER_ENTRY_SPEED = 145;
    const SOLO_ENCOUNTER_PRESENT_DURATION = 1.2;
    const SOLO_ENCOUNTER_FINISH_MIN_DELAY = 1.5;
    const SOLO_ENCOUNTER_FINISH_MAX_DELAY = 2;
    const SOLO_ENCOUNTER_SAFE_DISTANCE = 350;
    const SOLO_ENCOUNTER_HEALTH_MULTIPLIER = 1.15;
    const RIGHT_SPAWN_MARGIN = 100;
    const RIGHT_SPAWN_SEPARATION = 90;
    const RIGHT_SPAWN_TARGET_PADDING = 70;
    const FRAGMENT_SPRITESHEET_SRC = 'images/void-runner/img-assets-vilo/preview-all-frames (1).png';
    const FRAGMENT_SHEET_WIDTH = 2048;
    const FRAGMENT_SHEET_HEIGHT = 3072;
    const FRAGMENT_FRAME_WIDTH = 512;
    const FRAGMENT_FRAME_HEIGHT = 512;
    const FRAGMENT_DRAW_SIZE = 220;
    const FRAGMENT_ACTIVE_ATTACK_FRAME = 2;
    const FRAGMENT_ENTRY_STAGGER = 0.4;
    const FRAGMENT_PERSONAL_RADIUS = 55;
    const FRAGMENT_SEPARATION_DISTANCE = FRAGMENT_PERSONAL_RADIUS * 2;
    const FRAGMENT_STUCK_ESCAPE_AFTER = 0.8;
    const FRAGMENT_VERTICAL_DEAD_ZONE = 10;
    const FRAGMENT_VERTICAL_ATTACK_TOLERANCE = 35;
    const PARASITE_SPRITESHEET_SRC = 'images/void-runner/img-assets-vilo/preview-all-frames (2).png';
    const PARASITE_SHEET_WIDTH = 2048;
    const PARASITE_SHEET_HEIGHT = 3072;
    const PARASITE_FRAME_WIDTH = 512;
    const PARASITE_FRAME_HEIGHT = 512;
    const PARASITE_DRAW_SIZE = 165;
    const PARASITE_ACTIVE_ATTACK_FRAME = 2;
    const PARASITE_ENTRY_STAGGER = 0.35;
    const PARASITE_SEPARATION_DISTANCE = 95;
    const PARASITE_SEPARATION_FORCE = 0.10;
    const PARASITE_ATTACK_SLOT_DISTANCE = 118;
    const PARASITE_VERTICAL_DEAD_ZONE = 10;
    const PARASITE_STATE_PRIORITY = {
        death: 6,
        hit: 5,
        attack: 4,
        jump: 3,
        move: 2,
        idle: 1
    };
    const FRAGMENT_STATES = {
        IDLE: 'idle',
        CHASE: 'chase',
        WINDUP: 'windup',
        LUNGE: 'lunge',
        ACTIVE: 'active',
        RECOVERY: 'recovery',
        HIT: 'hit',
        DEATH: 'death'
    };
    const SOLO_ENCOUNTER_STATE = {
        IDLE: 'IDLE',
        SPAWNING: 'SPAWNING',
        INTRO: 'INTRO',
        COMBAT: 'COMBAT',
        FINISHING: 'FINISHING'
    };
    const FRAGMENT_STATE_PRIORITY = {
        death: 8,
        hit: 7,
        active: 6,
        lunge: 5,
        windup: 4,
        recovery: 3,
        chase: 2,
        idle: 1
    };
    const DRONE_PREVIEW_BACKGROUND = {
        r: 21,
        g: 16,
        b: 32,
        tolerance: 5
    };
    const DRONE_STATE_PRIORITY = {
        death: 5,
        hit: 4,
        attack: 3,
        move: 2,
        idle: 1
    };

    // Mapeamento da spritesheet unica: usa somente as 18 celulas validas.
    const DRONE_ANIMATIONS = {
        idle: {
            name: 'idle',
            fps: 6,
            loop: true,
            frames: [
                { col: 0, row: 0 },
                { col: 1, row: 0 },
                { col: 2, row: 0 },
                { col: 3, row: 0 }
            ]
        },
        move: {
            name: 'move',
            fps: 8,
            loop: true,
            frames: [
                { col: 0, row: 1 },
                { col: 1, row: 1 },
                { col: 2, row: 1 },
                { col: 3, row: 1 }
            ]
        },
        attack: {
            name: 'attack',
            fps: 10,
            loop: false,
            frames: [
                { col: 0, row: 2 },
                { col: 1, row: 2 },
                { col: 2, row: 2 }
            ]
        },
        hit: {
            name: 'hit',
            fps: 10,
            loop: false,
            frames: [
                { col: 3, row: 2 },
                { col: 0, row: 3 }
            ]
        },
        death: {
            name: 'death',
            fps: 8,
            loop: false,
            frames: [
                { col: 1, row: 3 },
                { col: 2, row: 3 },
                { col: 3, row: 3 },
                { col: 0, row: 4 },
                { col: 1, row: 4 }
            ]
        }
    };

    // Atlas terrestre: a imagem ja vem transparente e cada draw usa apenas uma celula.
    const FRAGMENT_ANIMATIONS = {
        idle: {
            name: 'idle',
            fps: 6,
            loop: true,
            frames: [
                { col: 0, row: 0 },
                { col: 1, row: 0 },
                { col: 2, row: 0 },
                { col: 3, row: 0 }
            ]
        },
        move: {
            name: 'move',
            fps: 10,
            loop: true,
            frames: [
                { col: 0, row: 1 },
                { col: 1, row: 1 },
                { col: 2, row: 1 },
                { col: 3, row: 1 },
                { col: 0, row: 2 },
                { col: 1, row: 2 }
            ]
        },
        attack: {
            name: 'attack',
            fps: 10,
            loop: false,
            frames: [
                { col: 2, row: 2 },
                { col: 3, row: 2 },
                { col: 0, row: 3 },
                { col: 1, row: 3 }
            ]
        },
        hit: {
            name: 'hit',
            fps: 10,
            loop: false,
            frames: [
                { col: 2, row: 3 },
                { col: 3, row: 3 }
            ]
        },
        death: {
            name: 'death',
            fps: 8,
            loop: false,
            frames: [
                { col: 0, row: 4 },
                { col: 1, row: 4 },
                { col: 2, row: 4 },
                { col: 3, row: 4 },
                { col: 0, row: 5 },
                { col: 1, row: 5 }
            ]
        }
    };

    // Atlas do Digital Parasite: usa 23 frames validos e ignora a ultima celula vazia.
    const PARASITE_ANIMATIONS = {
        idle: {
            name: 'idle',
            fps: 7,
            loop: true,
            frames: [
                { col: 0, row: 0 },
                { col: 1, row: 0 },
                { col: 2, row: 0 },
                { col: 3, row: 0 }
            ]
        },
        move: {
            name: 'move',
            fps: 12,
            loop: true,
            frames: [
                { col: 0, row: 1 },
                { col: 1, row: 1 },
                { col: 2, row: 1 },
                { col: 3, row: 1 },
                { col: 0, row: 2 },
                { col: 1, row: 2 }
            ]
        },
        jump: {
            name: 'jump',
            fps: 1,
            loop: false,
            frames: [
                { col: 2, row: 2 },
                { col: 3, row: 2 }
            ]
        },
        attack: {
            name: 'attack',
            fps: 12,
            loop: false,
            frames: [
                { col: 0, row: 3 },
                { col: 1, row: 3 },
                { col: 2, row: 3 },
                { col: 3, row: 3 }
            ]
        },
        hit: {
            name: 'hit',
            fps: 10,
            loop: false,
            frames: [
                { col: 0, row: 4 },
                { col: 1, row: 4 }
            ]
        },
        death: {
            name: 'death',
            fps: 9,
            loop: false,
            frames: [
                { col: 2, row: 4 },
                { col: 3, row: 4 },
                { col: 0, row: 5 },
                { col: 1, row: 5 },
                { col: 2, row: 5 }
            ]
        }
    };

    let droneSpritesheetSource = null;
    let dronePreloadPromise = null;
    let droneAssetsReady = false;
    let fragmentSpritesheetSource = null;
    let fragmentPreloadPromise = null;
    let fragmentAssetsReady = false;
    let parasiteSpritesheetSource = null;
    let parasitePreloadPromise = null;
    let parasiteAssetsReady = false;

    function makePreviewBackgroundTransparent(image) {
        if (!document.createElement) {
            console.warn('Nao foi possivel limpar o fundo do Drone Sentinel: canvas indisponivel.');
            return null;
        }

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                return null;
            }

            canvas.width = DRONE_SHEET_WIDTH;
            canvas.height = DRONE_SHEET_HEIGHT;
            ctx.drawImage(image, 0, 0, DRONE_SHEET_WIDTH, DRONE_SHEET_HEIGHT);

            const imageData = ctx.getImageData(0, 0, DRONE_SHEET_WIDTH, DRONE_SHEET_HEIGHT);
            const pixels = imageData.data;
            const background = DRONE_PREVIEW_BACKGROUND;

            // Remove somente o fundo #151020 da montagem, preservando tons escuros do Drone.
            for (let index = 0; index < pixels.length; index += 4) {
                const red = pixels[index];
                const green = pixels[index + 1];
                const blue = pixels[index + 2];
                const isPreviewBackground =
                    Math.abs(red - background.r) <= background.tolerance &&
                    Math.abs(green - background.g) <= background.tolerance &&
                    Math.abs(blue - background.b) <= background.tolerance;

                if (isPreviewBackground) {
                    pixels[index + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            return canvas;
        } catch (error) {
            console.warn('Nao foi possivel limpar o fundo do Drone Sentinel:', error);
            return null;
        }
    }

    function preloadDroneFrames() {
        if (dronePreloadPromise) {
            return dronePreloadPromise;
        }

        // Carrega uma unica spritesheet real e prepara o canvas transparente no preload.
        dronePreloadPromise = new Promise(function (resolve) {
            const image = new Image();

            image.failed = false;
            image.onload = function () {
                if (image.naturalWidth !== DRONE_SHEET_WIDTH || image.naturalHeight !== DRONE_SHEET_HEIGHT) {
                    console.warn('Spritesheet do Drone Sentinel com dimensoes inesperadas:', DRONE_SPRITESHEET_SRC, image.naturalWidth, image.naturalHeight);
                }

                droneSpritesheetSource = makePreviewBackgroundTransparent(image);
                droneAssetsReady = sourceReady(droneSpritesheetSource);

                if (!droneAssetsReady) {
                    console.warn('Drone Sentinel nao sera desenhado porque a spritesheet real nao pode ser preparada.');
                }

                resolve(droneAssetsReady);
            };
            image.onerror = function () {
                image.failed = true;
                droneAssetsReady = false;
                console.warn('Spritesheet do Drone Sentinel nao carregou:', DRONE_SPRITESHEET_SRC);
                resolve(false);
            };
            image.src = DRONE_SPRITESHEET_SRC;
        });

        return dronePreloadPromise;
    }

    function droneVisualsReady() {
        return droneAssetsReady && sourceReady(droneSpritesheetSource);
    }

    function preloadFragmentFrames() {
        if (fragmentPreloadPromise) {
            return fragmentPreloadPromise;
        }

        // O atlas do Corrupted Fragment ja tem transparencia; nao ha processamento de pixels.
        fragmentPreloadPromise = new Promise(function (resolve) {
            const image = new Image();

            image.failed = false;
            image.onload = function () {
                if (image.naturalWidth !== FRAGMENT_SHEET_WIDTH || image.naturalHeight !== FRAGMENT_SHEET_HEIGHT) {
                    console.warn('Spritesheet do Corrupted Fragment com dimensoes inesperadas:', FRAGMENT_SPRITESHEET_SRC, image.naturalWidth, image.naturalHeight);
                }

                fragmentSpritesheetSource = image;
                fragmentAssetsReady = sourceReady(fragmentSpritesheetSource);
                resolve(fragmentAssetsReady);
            };
            image.onerror = function () {
                image.failed = true;
                fragmentAssetsReady = false;
                console.warn('Spritesheet do Corrupted Fragment nao carregou:', FRAGMENT_SPRITESHEET_SRC);
                resolve(false);
            };
            image.src = FRAGMENT_SPRITESHEET_SRC;
        });

        return fragmentPreloadPromise;
    }

    function fragmentVisualsReady() {
        return fragmentAssetsReady && sourceReady(fragmentSpritesheetSource);
    }

    function preloadParasiteFrames() {
        if (parasitePreloadPromise) {
            return parasitePreloadPromise;
        }

        // O Digital Parasite tambem usa transparencia real do atlas, sem limpar pixels.
        parasitePreloadPromise = new Promise(function (resolve) {
            const image = new Image();

            image.failed = false;
            image.onload = function () {
                if (image.naturalWidth !== PARASITE_SHEET_WIDTH || image.naturalHeight !== PARASITE_SHEET_HEIGHT) {
                    console.warn('Spritesheet do Digital Parasite com dimensoes inesperadas:', PARASITE_SPRITESHEET_SRC, image.naturalWidth, image.naturalHeight);
                }

                parasiteSpritesheetSource = image;
                parasiteAssetsReady = sourceReady(parasiteSpritesheetSource);
                resolve(parasiteAssetsReady);
            };
            image.onerror = function () {
                image.failed = true;
                parasiteAssetsReady = false;
                console.warn('Spritesheet do Digital Parasite nao carregou:', PARASITE_SPRITESHEET_SRC);
                resolve(false);
            };
            image.src = PARASITE_SPRITESHEET_SRC;
        });

        return parasitePreloadPromise;
    }

    function parasiteVisualsReady() {
        return parasiteAssetsReady && sourceReady(parasiteSpritesheetSource);
    }

    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function limitVector(vector, maxLength) {
        const length = Math.hypot(vector.x, vector.y);

        if (length <= maxLength || length === 0) {
            return vector;
        }

        return {
            x: vector.x / length * maxLength,
            y: vector.y / length * maxLength
        };
    }

    function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    function getRectCenter(rect) {
        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
        };
    }

    function getInitialProjectileVelocity(projectile, target, fallbackDirection, speed) {
        if (target && target.getBodyHitbox) {
            const targetCenter = getRectCenter(target.getBodyHitbox());
            const dx = targetCenter.x - projectile.x;
            const dy = targetCenter.y - projectile.y;
            const distance = Math.hypot(dx, dy);

            if (distance > 0) {
                return {
                    x: dx / distance * speed,
                    y: dy / distance * speed
                };
            }
        }

        return {
            x: fallbackDirection * speed,
            y: 0
        };
    }

    function distributeDroneSpawns(spawns) {
        const placed = [];

        return spawns.map(function (spawn, index) {
            const candidate = Object.assign({}, spawn);
            const baseX = typeof spawn.x === 'number' ? spawn.x : 0;
            const baseY = typeof spawn.y === 'number' ? spawn.y : 0;
            let attempt = 0;

            // Evita que varios drones nascam no mesmo ponto sem alterar a fase.
            candidate.y = baseY + (index % 3 - 1) * 34;

            while (attempt < 8 && placed.some(function (other) {
                return Math.hypot(candidate.x - other.x, candidate.y - other.y) < 100;
            })) {
                const angle = index * 2.399963 + attempt * 0.85;
                const radius = 110 + attempt * 24;

                candidate.x = baseX + Math.cos(angle) * radius;
                candidate.y = baseY + Math.sin(angle) * radius * 0.65;
                attempt++;
            }

            placed.push({
                x: candidate.x,
                y: candidate.y
            });

            return candidate;
        });
    }

    function cloneSpawn(spawn, fallbackType) {
        const normalized = Object.assign({}, spawn);

        normalized.type = normalized.type || fallbackType || ENEMY_TYPE.DRONE;
        return normalized;
    }

    function normalizeWaveDefinitions(source) {
        const phase = Array.isArray(source) ? { enemies: source } : source || {};

        if (Array.isArray(phase.enemyWaves) && phase.enemyWaves.length > 0) {
            return phase.enemyWaves.map(function (wave) {
                return wave.map(function (spawn) {
                    return cloneSpawn(spawn, ENEMY_TYPE.DRONE);
                });
            });
        }

        const droneSpawns = distributeDroneSpawns(phase.enemies || []);
        const waves = [];

        for (let index = 0; index < droneSpawns.length; index += DRONES_PER_WAVE) {
            waves.push(droneSpawns.slice(index, index + DRONES_PER_WAVE).map(function (spawn) {
                return cloneSpawn(spawn, ENEMY_TYPE.DRONE);
            }));
        }

        return waves;
    }

    function countWaveEnemies(waves) {
        return waves.reduce(function (total, wave) {
            return total + wave.length;
        }, 0);
    }

    function getPlayerGroundFeetY(player) {
        // No projeto atual, player.y e a posicao dos pes na rua; getFeetY inclui o pulo visual.
        return player && typeof player.y === 'number' ? player.y : player && player.getFeetY ? player.getFeetY() : game.GROUND_Y;
    }

    function getWalkableTop(phase) {
        if (typeof phase.playAreaTop === 'number') return phase.playAreaTop;
        if (typeof phase.streetTop === 'number') return phase.streetTop;
        return typeof phase.groundY === 'number' ? phase.groundY : game.GROUND_Y;
    }

    function getWalkableBottom(phase) {
        if (typeof phase.playAreaBottom === 'number') return phase.playAreaBottom;
        if (typeof phase.streetBottom === 'number') return phase.streetBottom;
        return typeof phase.groundY === 'number' ? phase.groundY : game.GROUND_Y;
    }

    function getEnemyDisplayName(type) {
        if (type === ENEMY_TYPE.FRAGMENT) return 'CORRUPTED FRAGMENT';
        if (type === ENEMY_TYPE.PARASITE) return 'DIGITAL PARASITE';
        return 'DRONE SENTINEL';
    }

    function getEnemyDrawCenter(enemy) {
        if (enemy.enemyType === ENEMY_TYPE.DRONE) {
            return { x: enemy.x, y: enemy.y };
        }

        return {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2
        };
    }

    function getEnemyTargetId(enemy) {
        if (!enemy) return null;
        if (enemy.targetId) return enemy.targetId;
        if (enemy.enemyType === ENEMY_TYPE.FRAGMENT) return 'fragment-' + enemy.fragmentIndex;
        if (enemy.enemyType === ENEMY_TYPE.PARASITE) return 'parasite-' + enemy.parasiteIndex;
        return 'drone-' + enemy.droneIndex;
    }

    function enemyInSelectableState(enemy) {
        if (!enemy || !enemy.alive || enemy.removed || enemy.health <= 0) {
            return false;
        }

        if (enemy.state === 'death' || enemy.state === FRAGMENT_STATES.DEATH) {
            return false;
        }

        return enemy.soloIntroState !== SOLO_ENCOUNTER_STATE.SPAWNING &&
            enemy.soloIntroState !== SOLO_ENCOUNTER_STATE.INTRO;
    }

    function getEnemyVisualBounds(enemy) {
        if (!enemy) {
            return null;
        }

        if (enemy.enemyType === ENEMY_TYPE.DRONE) {
            return {
                x: enemy.x - enemy.width * 0.34,
                y: enemy.y - enemy.height * 0.32,
                width: enemy.width * 0.68,
                height: enemy.height * 0.58
            };
        }

        const hitbox = enemy.getHitbox ? enemy.getHitbox() : {
            x: enemy.x,
            y: enemy.y,
            width: enemy.width,
            height: enemy.height
        };

        return {
            x: hitbox.x - enemy.width * 0.08,
            y: hitbox.y - enemy.height * 0.18,
            width: hitbox.width + enemy.width * 0.16,
            height: hitbox.height + enemy.height * 0.26
        };
    }

    class DroneProjectile {
        constructor(x, y, direction, target) {
            const initialVelocity = getInitialProjectileVelocity({
                x: x,
                y: y
            }, target, direction, DRONE_PROJECTILE_SPEED);

            // Projetil proprio do inimigo: dano acontece apenas por colisao real.
            this.x = x;
            this.y = y;
            this.width = 28;
            this.height = 14;
            this.visualWidth = 48;
            this.visualHeight = 22;
            this.direction = initialVelocity.x >= 0 ? 1 : -1;
            this.velocityX = initialVelocity.x;
            this.velocityY = initialVelocity.y;
            this.speed = DRONE_PROJECTILE_SPEED;
            this.target = target;
            this.targetId = 'trix';
            this.turnSpeed = DRONE_PROJECTILE_TURN_SPEED;
            this.owner = 'drone';
            this.damage = getCombatBalance().enemyDamage.basicProjectile;
            this.lifetime = DRONE_PROJECTILE_LIFETIME;
            this.homingDuration = DRONE_PROJECTILE_HOMING_DURATION;
            this.hasHit = false;
            this.alive = true;
            this.age = 0;
        }

        getHitbox() {
            return {
                x: this.x - this.width / 2,
                y: this.y - this.height / 2,
                width: this.width,
                height: this.height
            };
        }

        update(player, deltaTime, cameraX, canvasWidth, effects, now) {
            const delta = deltaTime / 1000;

            this.age += deltaTime;
            if (this.age / 1000 >= this.lifetime) {
                this.alive = false;
                return;
            }

            if (this.age / 1000 <= this.homingDuration) {
                this.updateHoming(delta);
            }

            this.x += this.velocityX * delta;
            this.y += this.velocityY * delta;
            this.direction = this.velocityX >= 0 ? 1 : -1;

            if (!this.hasHit && rectsOverlap(this.getHitbox(), player.getBodyHitbox())) {
                this.hasHit = true;
                this.alive = false;
                player.takeDamage(this.damage, now);
                effects.addSpark(this.x, this.y, '#ff2eb4');
                return;
            }

            if (this.x < cameraX - 160 || this.x > cameraX + canvasWidth + 160) {
                this.alive = false;
            }
        }

        updateHoming(delta) {
            if (!this.target || !this.target.getBodyHitbox) {
                return;
            }

            const targetCenter = getRectCenter(this.target.getBodyHitbox());
            const dx = targetCenter.x - this.x;
            const dy = targetCenter.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance <= 0) {
                return;
            }

            const desiredAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.velocityY, this.velocityX);
            const angleDifference = normalizeAngle(desiredAngle - currentAngle);
            const maxTurn = this.turnSpeed * delta;
            const newAngle = currentAngle + clamp(angleDifference, -maxTurn, maxTurn);

            // Homing inimigo e limitado para a Trix conseguir desviar.
            this.velocityX = Math.cos(newAngle) * this.speed;
            this.velocityY = Math.sin(newAngle) * this.speed;
        }

        render(ctx, cameraX) {
            const screenX = this.x - cameraX;
            const pulse = 0.5 + Math.sin(this.age / 70) * 0.18;
            const angle = Math.atan2(this.velocityY, this.velocityX);

            ctx.save();
            ctx.translate(screenX, this.y);
            ctx.rotate(angle);
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#00e5ff';
            ctx.fillStyle = 'rgba(0, 229, 255, 0.82)';
            ctx.fillRect(-this.visualWidth / 2, -this.visualHeight / 2, this.visualWidth, this.visualHeight);
            ctx.shadowColor = '#ff2eb4';
            ctx.fillStyle = 'rgba(255, 46, 180, 0.82)';
            ctx.fillRect(-this.visualWidth / 2 + this.visualWidth * pulse, -this.visualHeight / 2 + 4, 14, this.visualHeight - 8);
            ctx.restore();
        }
    }

    class Enemy {
        constructor(spawn, effects, index) {
            // x/y representam o centro do Drone; left/top sao calculados para recorte e colisao.
            this.enemyType = ENEMY_TYPE.DRONE;
            this.droneIndex = index || 0;
            this.targetId = getEnemyTargetId(this);
            this.spawnX = spawn.x;
            this.x = typeof spawn.centerX === 'number' ? spawn.centerX : spawn.x + 360;
            this.y = spawn.y;
            this.baseY = spawn.y;
            this.width = DRONE_DRAW_SIZE;
            this.height = DRONE_DRAW_SIZE;
            this.maxHealth = spawn.health || getCombatBalance().droneSentinel.maxHealth;
            this.health = this.maxHealth;
            this.damage = spawn.damage || getCombatBalance().droneSentinel.contactDamage;
            this.contactDamageTimer = 0;
            this.speed = spawn.speed || 92;
            this.state = 'idle';
            this.previousState = 'idle';
            this.alive = true;
            this.removed = false;
            this.direction = -1;
            this.effects = effects;
            this.frameIndex = 0;
            this.frameTimer = 0;
            this.animationFinished = false;
            this.hitFlashUntil = 0;
            this.damageInvulnerableUntil = 0;
            this.nextAttackAt = 0;
            this.attackProjectileCreated = false;
            this.projectiles = [];
            this.velocityX = 0;
            this.velocityY = 0;
            this.combatOffsetX = randomRange(260, 480);
            this.combatOffsetY = randomRange(-180, 180);
            this.floatPhase = randomRange(0, Math.PI * 2);
            this.stuckNearSince = 0;
            this.escapeUntil = 0;
            this.escapeX = 0;
            this.escapeY = 0;
            this.visual = DRONE_ANIMATIONS;
        }

        getLeft() {
            return this.x - this.width / 2;
        }

        getTop() {
            return this.y - this.height / 2;
        }

        getHitbox() {
            const left = this.getLeft();
            const top = this.getTop();

            // Hitbox central: nao inclui asas, canhao, propulsores ou transparencia.
            return {
                x: left + this.width * 0.19,
                y: top + this.height * 0.32,
                width: this.width * 0.67,
                height: this.height * 0.36
            };
        }

        takeDamage(amount) {
            const now = getNow();

            if (!this.alive || this.state === 'death' || now < this.damageInvulnerableUntil) {
                return false;
            }

            this.health = Math.max(0, this.health - amount);
            this.hitFlashUntil = now + 150;
            this.damageInvulnerableUntil = now + getCombatBalance().droneSentinel.hitInvulnerabilityDuration * 1000;

            if (this.health <= 0) {
                this.startDeath();
                return true;
            }

            this.previousState = this.state === 'attack' ? 'attack' : this.resolveMovementState();
            this.enterState('hit', true);
            return false;
        }

        startDeath() {
            // A morte tem prioridade total: desliga ataque/hitbox e espera o ultimo frame.
            this.alive = false;
            this.projectiles = [];
            this.enterState('death', true);
            this.effects.addSpark(this.x, this.y, '#00e5ff');
        }

        enterState(nextState, restart) {
            const currentPriority = DRONE_STATE_PRIORITY[this.state] || 0;
            const nextPriority = DRONE_STATE_PRIORITY[nextState] || 0;

            if (this.state === 'death' && nextState !== 'death') {
                return;
            }

            if (nextPriority < currentPriority && !this.animationFinished) {
                return;
            }

            if (restart || this.state !== nextState) {
                this.state = nextState;
                this.frameIndex = 0;
                this.frameTimer = 0;
                this.animationFinished = false;

                if (nextState === 'attack') {
                    this.attackProjectileCreated = false;
                }
            }
        }

        resolveMovementState() {
            return Math.abs(this.lastMoveX || 0) > 0.4 || Math.abs(this.lastMoveY || 0) > 0.4 ? 'move' : 'idle';
        }

        update(player, deltaTime, now, effects, cameraX, canvasWidth, drones) {
            if (this.removed) {
                return;
            }

            this.updateProjectiles(player, deltaTime, now, effects, cameraX, canvasWidth);
            this.updateContactDamage(player, deltaTime, now, effects);

            if (this.state === 'death') {
                this.updateAnimation(deltaTime);

                if (this.animationFinished) {
                    this.removed = true;
                }

                return;
            }

            if (this.state === 'hit') {
                this.updateAnimation(deltaTime);

                if (this.animationFinished) {
                    this.enterState(this.previousState, true);
                }

                return;
            }

            if (this.state === 'attack') {
                this.updateMovement(player, deltaTime, now, drones);
                this.updateAnimation(deltaTime);

                if (this.frameIndex === DRONE_ATTACK_PROJECTILE_FRAME && !this.attackProjectileCreated) {
                    this.createProjectile(player);
                }

                if (this.animationFinished) {
                    this.enterState(this.resolveMovementState(), true);
                }

                return;
            }

            this.updateMovement(player, deltaTime, now, drones);

            if (this.canAttack(player, now)) {
                this.nextAttackAt = now + DRONE_ATTACK_COOLDOWN;
                this.enterState('attack', true);
            } else {
                this.enterState(this.resolveMovementState(), false);
            }

            this.updateAnimation(deltaTime);
        }

        updateContactDamage(player, deltaTime, now, effects) {
            if (!this.alive || this.removed || this.state === 'death' || !player || !player.getBodyHitbox) {
                return;
            }

            const balance = getCombatBalance().droneSentinel;

            // O contato fisico tem recarga propria para impedir dano a cada frame.
            this.contactDamageTimer = Math.max(0, this.contactDamageTimer - deltaTime / 1000);

            if (this.contactDamageTimer > 0 || !rectsOverlap(this.getHitbox(), player.getBodyHitbox())) {
                return;
            }

            player.takeDamage(balance.contactDamage, now);
            this.contactDamageTimer = balance.contactDamageCooldown;

            if (effects && effects.addSpark) {
                effects.addSpark(player.x + 48, player.getFeetY() - 58, '#ff2eb4');
            }
        }

        updateMovement(player, deltaTime, now, drones) {
            const delta = deltaTime / 1000;
            const feetY = player.getFeetY ? player.getFeetY() : player.y;
            const playTop = typeof player.groundY === 'number' ? player.groundY - 230 : this.baseY - 120;
            const playBottom = typeof player.groundY === 'number' ? player.groundY - this.height / 2 : this.baseY + 70;
            const side = this.x >= player.x ? 1 : -1;
            const targetX = player.x + this.combatOffsetX * side;
            const targetY = clamp(feetY - 130 + this.combatOffsetY * 0.55, playTop, playBottom);
            const floatOffsetY = Math.sin(now / 560 + this.floatPhase) * 18;
            const separation = this.calculateSeparation(drones || [], now);
            const approachVelocityX = clamp((targetX - this.x) * 1.7, -this.speed, this.speed);
            const approachVelocityY = clamp((targetY + floatOffsetY - this.y) * 1.35, -this.speed * 0.72, this.speed * 0.72);
            let desiredVelocityX = approachVelocityX + separation.x * DRONE_SEPARATION_FORCE * 1350;
            let desiredVelocityY = approachVelocityY + separation.y * DRONE_SEPARATION_FORCE * 1350;

            if (now < this.escapeUntil) {
                // Escape curto e suave para pares quase sobrepostos; sem teletransporte.
                desiredVelocityX += this.escapeX * this.speed * 0.85;
                desiredVelocityY += this.escapeY * this.speed * 0.85;
            }

            const limitedVelocity = limitVector({
                x: desiredVelocityX,
                y: desiredVelocityY
            }, DRONE_MAX_SPEED);

            this.velocityX = this.velocityX * 0.72 + limitedVelocity.x * 0.28;
            this.velocityY = this.velocityY * 0.72 + limitedVelocity.y * 0.28;

            const previousX = this.x;
            const previousY = this.y;

            this.x += this.velocityX * delta;
            this.y += this.velocityY * delta;

            if (side > 0 && this.x < player.x + DRONE_MIN_PLAYER_DISTANCE) {
                this.x = player.x + DRONE_MIN_PLAYER_DISTANCE;
                this.velocityX = Math.max(0, this.velocityX);
            } else if (side < 0 && this.x > player.x - DRONE_MIN_PLAYER_DISTANCE) {
                this.x = player.x - DRONE_MIN_PLAYER_DISTANCE;
                this.velocityX = Math.min(0, this.velocityX);
            }

            this.y = clamp(this.y, playTop, playBottom);
            this.trackStuckEscape(separation.nearby, previousX, previousY, now);
            this.lastMoveX = this.x - previousX;
            this.lastMoveY = this.y - previousY;
            this.direction = player.x >= this.x ? 1 : -1;
        }

        calculateSeparation(drones, now) {
            let separationX = 0;
            let separationY = 0;
            let nearby = false;

            drones.forEach((other) => {
                if (other === this || other.removed || !other.alive) {
                    return;
                }

                // No modelo atual x/y ja sao o centro visual do Drone.
                let dx = this.x - other.x;
                let dy = this.y - other.y;
                let distance = Math.hypot(dx, dy);

                if (distance < 0.001) {
                    const angle = (this.droneIndex + 1) * 2.399963 + now * 0.0004;

                    dx = Math.cos(angle);
                    dy = Math.sin(angle);
                    distance = 1;
                }

                if (distance < DRONE_SEPARATION_DISTANCE) {
                    const strength = (DRONE_SEPARATION_DISTANCE - distance) / DRONE_SEPARATION_DISTANCE;

                    nearby = true;
                    separationX += dx / distance * strength;
                    separationY += dy / distance * strength;
                }
            });

            const limited = limitVector({
                x: separationX,
                y: separationY
            }, DRONE_MAX_SEPARATION_FORCE);

            limited.nearby = nearby;
            return limited;
        }

        trackStuckEscape(hasNearbyDrone, previousX, previousY, now) {
            const movedDistance = Math.hypot(this.x - previousX, this.y - previousY);

            if (!hasNearbyDrone || movedDistance > 0.25) {
                this.stuckNearSince = 0;
                return;
            }

            if (!this.stuckNearSince) {
                this.stuckNearSince = now;
                return;
            }

            if (now - this.stuckNearSince >= DRONE_STUCK_ESCAPE_AFTER) {
                const angle = (this.droneIndex + 1) * 2.399963;

                this.escapeX = Math.cos(angle);
                this.escapeY = Math.sin(angle) * 0.75;
                this.escapeUntil = now + DRONE_STUCK_ESCAPE_DURATION;
                this.stuckNearSince = now;
            }
        }

        canAttack(player, now) {
            const distanceX = Math.abs(player.x - this.x);
            const distanceY = Math.abs((player.getFeetY ? player.getFeetY() : player.y) - this.y);

            return this.alive &&
                now >= this.nextAttackAt &&
                distanceX <= DRONE_ATTACK_RANGE &&
                distanceX >= DRONE_MIN_PLAYER_DISTANCE - 12 &&
                distanceY <= 150;
        }

        createProjectile(player) {
            const left = this.getLeft();
            const top = this.getTop();
            const projectileX = left + this.width * (this.direction > 0 ? 0.92 : 0.08);
            const projectileY = top + this.height * 0.5;

            this.attackProjectileCreated = true;
            this.projectiles.push(new DroneProjectile(projectileX, projectileY, this.direction, player));
        }

        updateProjectiles(player, deltaTime, now, effects, cameraX, canvasWidth) {
            this.projectiles.forEach(function (projectile) {
                projectile.update(player, deltaTime, cameraX, canvasWidth, effects, now);
            });

            this.projectiles = this.projectiles.filter(function (projectile) {
                return projectile.alive;
            });
        }

        updateAnimation(deltaTime) {
            const animation = DRONE_ANIMATIONS[this.state] || DRONE_ANIMATIONS.idle;
            const frameDuration = 1000 / animation.fps;

            this.frameTimer += deltaTime;

            while (this.frameTimer >= frameDuration) {
                this.frameTimer -= frameDuration;

                if (this.frameIndex < animation.frames.length - 1) {
                    this.frameIndex++;
                    continue;
                }

                if (animation.loop) {
                    this.frameIndex = 0;
                } else {
                    this.animationFinished = true;
                }
            }
        }

        render(ctx, cameraX) {
            if (this.removed) {
                return;
            }

            this.renderDrone(ctx, cameraX);
            this.projectiles.forEach(function (projectile) {
                projectile.render(ctx, cameraX);
            });
        }

        renderDrone(ctx, cameraX) {
            const animation = DRONE_ANIMATIONS[this.state] || DRONE_ANIMATIONS.idle;
            const frameData = animation.frames[Math.max(0, Math.min(this.frameIndex, animation.frames.length - 1))];
            const sourceX = frameData.col * DRONE_FRAME_WIDTH;
            const sourceY = frameData.row * DRONE_FRAME_HEIGHT;
            const screenX = this.x - cameraX;
            const now = getNow();

            // Sem spritesheet real preparada, nao desenha placeholder.
            if (!droneVisualsReady()) {
                return;
            }

            ctx.save();
            ctx.globalAlpha = now < this.hitFlashUntil ? 0.72 : 1;
            ctx.translate(screenX, this.y);

            // A arte original olha para a esquerda; direita usa espelhamento horizontal.
            if (this.direction > 0) {
                ctx.scale(-1, 1);
            }

            ctx.drawImage(
                droneSpritesheetSource,
                sourceX,
                sourceY,
                DRONE_FRAME_WIDTH,
                DRONE_FRAME_HEIGHT,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

            ctx.restore();
            this.drawHealthBar(ctx, screenX);
        }

        drawHealthBar(ctx, screenX) {
            if (!this.alive) {
                return;
            }

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenX - 42, this.y - this.height / 2 - 12, 84, 5);
            ctx.fillStyle = '#37ff8b';
            ctx.fillRect(screenX - 42, this.y - this.height / 2 - 12, 84 * Math.max(0, this.health / this.maxHealth), 5);
            ctx.restore();
        }
    }

    class CorruptedFragment {
        constructor(spawn, effects, index) {
            const balance = getCombatBalance().corruptedFragment;

            this.enemyType = ENEMY_TYPE.FRAGMENT;
            this.fragmentIndex = index || 0;
            this.targetId = getEnemyTargetId(this);
            this.spawnX = spawn.x;
            this.width = FRAGMENT_DRAW_SIZE;
            this.height = FRAGMENT_DRAW_SIZE;
            this.groundY = typeof spawn.groundY === 'number' ? spawn.groundY : game.GROUND_Y;
            this.walkableTop = typeof spawn.walkableTop === 'number' ? spawn.walkableTop : this.groundY;
            this.walkableBottom = typeof spawn.walkableBottom === 'number' ? spawn.walkableBottom : this.groundY;
            this.phaseLength = typeof spawn.phaseLength === 'number' ? spawn.phaseLength : 2400;
            this.x = typeof spawn.x === 'number' ? spawn.x : 0;
            this.feetY = clamp(typeof spawn.feetY === 'number' ? spawn.feetY : this.groundY, this.walkableTop, this.walkableBottom);
            this.y = this.feetY - this.height;
            this.maxHealth = spawn.health || balance.maxHealth;
            this.health = this.maxHealth;
            this.speed = spawn.speed || balance.moveSpeed;
            this.depthSpeed = this.speed * 0.7;
            this.state = FRAGMENT_STATES.CHASE;
            this.previousState = FRAGMENT_STATES.CHASE;
            this.alive = true;
            this.removed = false;
            this.facing = 'left';
            this.direction = -1;
            this.effects = effects;
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.animationFinished = false;
            this.hitFlashUntil = 0;
            this.damageInvulnerableUntil = 0;
            this.attackCooldownTimer = 0;
            this.attackStateTimer = 0;
            this.attackDirection = -1;
            this.attackTargetFeetY = this.feetY;
            this.damageAppliedThisAttack = false;
            this.hasAttackToken = false;
            this.velocityX = 0;
            this.velocityY = 0;
            this.lastMoveX = 0;
            this.lastMoveY = 0;
            this.formationOffsetY = (this.fragmentIndex % 3 - 1) * 18;
            this.stuckChaseTimer = 0;
            this.escapeImpulse = 0;
        }

        getHitbox() {
            return {
                x: this.x + this.width * 0.14,
                y: this.y + this.height * 0.25,
                width: this.width * 0.72,
                height: this.height * 0.65
            };
        }

        getDepthY() {
            return this.feetY;
        }

        getImpactPoint() {
            const hitbox = this.getHitbox();

            return {
                x: hitbox.x + hitbox.width / 2,
                y: hitbox.y + hitbox.height / 2
            };
        }

        getAttackHitbox() {
            if (this.state !== FRAGMENT_STATES.ACTIVE || this.currentFrame !== FRAGMENT_ACTIVE_ATTACK_FRAME) {
                return null;
            }

            const width = this.width * 0.48;

            // A area ativa existe somente no terceiro frame e espelha com a direcao.
            return {
                x: this.attackDirection < 0 ? this.x - this.width * 0.10 : this.x + this.width - width + this.width * 0.10,
                y: this.y + this.height * 0.30,
                width: width,
                height: this.height * 0.46
            };
        }

        takeDamage(amount) {
            const now = getNow();

            if (!this.alive || this.state === FRAGMENT_STATES.DEATH || now < this.damageInvulnerableUntil) {
                return false;
            }

            this.health = Math.max(0, this.health - amount);
            this.hitFlashUntil = now + 150;
            this.damageInvulnerableUntil = now + getCombatBalance().corruptedFragment.hitInvulnerabilityDuration * 1000;

            if (this.health <= 0) {
                this.startDeath();
                return true;
            }

            if (this.state !== FRAGMENT_STATES.ACTIVE && this.state !== FRAGMENT_STATES.LUNGE) {
                this.previousState = FRAGMENT_STATES.CHASE;
                this.enterState(FRAGMENT_STATES.HIT, true);
            }

            return false;
        }

        startDeath() {
            if (this.state === FRAGMENT_STATES.DEATH) {
                return;
            }

            // A morte desativa ataque e colisao ofensiva, mas aguarda todos os frames.
            this.alive = false;
            this.damageAppliedThisAttack = true;
            this.velocityX = 0;
            this.velocityY = 0;
            this.enterState(FRAGMENT_STATES.DEATH, true);
            this.effects.addSpark(this.x + this.width / 2, this.feetY - this.height * 0.45, '#37ff8b');
        }

        enterState(nextState, restart) {
            if (this.state === FRAGMENT_STATES.DEATH && nextState !== FRAGMENT_STATES.DEATH) {
                return;
            }

            if (restart || this.state !== nextState) {
                this.state = nextState;
                this.currentFrame = 0;
                this.frameTimer = 0;
                this.animationFinished = false;

                if (nextState === FRAGMENT_STATES.WINDUP) {
                    this.damageAppliedThisAttack = false;
                    this.attackStateTimer = getCombatBalance().corruptedFragment.windupDuration;
                    this.currentFrame = 0;
                } else if (nextState === FRAGMENT_STATES.LUNGE) {
                    this.attackStateTimer = getCombatBalance().corruptedFragment.lungeDuration;
                    this.currentFrame = 1;
                } else if (nextState === FRAGMENT_STATES.ACTIVE) {
                    this.attackStateTimer = getCombatBalance().corruptedFragment.activeDuration;
                    this.currentFrame = 2;
                } else if (nextState === FRAGMENT_STATES.RECOVERY) {
                    this.attackStateTimer = getCombatBalance().corruptedFragment.recoveryDuration;
                    this.currentFrame = 3;
                }
            }
        }

        resolveMovementState() {
            return Math.hypot(this.velocityX || 0, this.velocityY || 0) > 5 ? FRAGMENT_STATES.CHASE : FRAGMENT_STATES.IDLE;
        }

        syncVisualY() {
            this.feetY = clamp(this.feetY, this.walkableTop, this.walkableBottom);
            this.y = this.feetY - this.height;
        }

        update(player, deltaTime, now, effects, cameraX, canvasWidth, enemies) {
            if (this.removed) {
                return;
            }

            const delta = deltaTime / 1000;

            this.syncVisualY();
            this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - delta);

            if (this.state === FRAGMENT_STATES.DEATH) {
                this.updateAnimation(deltaTime);

                if (this.animationFinished) {
                    this.removed = true;
                }

                return;
            }

            if (this.state === FRAGMENT_STATES.HIT) {
                this.updateAnimation(deltaTime);

                if (this.animationFinished) {
                    this.enterState(FRAGMENT_STATES.CHASE, true);
                }

                return;
            }

            if (this.updateAttackSequence(player, deltaTime, now, effects)) {
                return;
            }

            this.updateChase(player, deltaTime, enemies || []);
            this.updateAnimation(deltaTime);
        }

        updateFacing(player) {
            const playerHitbox = player && player.getBodyHitbox ? player.getBodyHitbox() : { x: player.x, width: 0 };
            const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
            const fragmentCenterX = this.x + this.width / 2;

            this.facing = playerCenterX < fragmentCenterX ? 'left' : 'right';
            this.direction = this.facing === 'left' ? -1 : 1;
        }

        updateChase(player, deltaTime, enemies) {
            const delta = deltaTime / 1000;
            const balance = getCombatBalance().corruptedFragment;
            const playerHitbox = player.getBodyHitbox();
            const fragmentHitbox = this.getHitbox();
            const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
            const fragmentCenterX = fragmentHitbox.x + fragmentHitbox.width / 2;
            const horizontalGap = this.getHorizontalGap(playerHitbox, fragmentHitbox);
            const trixFeetY = getPlayerGroundFeetY(player);
            const verticalGap = Math.abs(trixFeetY - this.feetY);
            const hasToken = this.resolveAttackToken(player, enemies);
            const desiredGap = hasToken ? balance.attackEnterGap : balance.attackExitGap + 52;
            const separation = this.calculateSeparation(enemies);
            const previousX = this.x;
            const previousFeetY = this.feetY;
            let targetX = this.x;
            const targetFeetY = clamp(trixFeetY + (hasToken ? 0 : this.formationOffsetY), this.walkableTop, this.walkableBottom);
            let dx = 0;
            let dy = 0;
            let distance = 0;

            this.updateFacing(player);

            if (hasToken && horizontalGap <= balance.attackEnterGap && verticalGap <= FRAGMENT_VERTICAL_ATTACK_TOLERANCE && this.attackCooldownTimer <= 0) {
                this.beginWindup(player);
                return;
            }

            if (horizontalGap > desiredGap) {
                targetX = this.x + Math.sign(playerCenterX - fragmentCenterX) * horizontalGap;
            } else if (!hasToken && horizontalGap < desiredGap - 20) {
                targetX = this.x - Math.sign(playerCenterX - fragmentCenterX) * (desiredGap - horizontalGap);
            }

            dx = targetX - this.x;
            dy = Math.abs(targetFeetY - this.feetY) > FRAGMENT_VERTICAL_DEAD_ZONE ? targetFeetY - this.feetY : 0;
            distance = Math.hypot(dx, dy);

            if (distance > 0) {
                this.velocityX = dx / distance * this.speed + separation.x * this.speed * 0.85 + this.escapeImpulse;
                this.velocityY = dy / distance * this.depthSpeed + separation.y * this.depthSpeed * 0.85;
            } else {
                this.velocityX = separation.x * this.speed * 0.85 + this.escapeImpulse;
                this.velocityY = separation.y * this.depthSpeed * 0.85;
            }

            // Perseguicao em dois eixos no plano da rua: x lateral e feetY em profundidade.
            this.x += this.velocityX * delta;
            this.x = clamp(this.x, 30, this.phaseLength - this.width);
            this.feetY = clamp(this.feetY + this.velocityY * delta, this.walkableTop, this.walkableBottom);
            this.syncVisualY();
            this.lastMoveX = this.x - previousX;
            this.lastMoveY = this.feetY - previousFeetY;
            this.escapeImpulse *= 0.86;
            this.trackChaseStuck(horizontalGap, Math.hypot(this.lastMoveX, this.lastMoveY), delta);
            this.enterState(Math.hypot(this.velocityX, this.velocityY) > 5 ? FRAGMENT_STATES.CHASE : FRAGMENT_STATES.IDLE, false);
        }

        beginWindup(player) {
            // Ultima mirada antes do golpe: daqui em diante a direcao fica travada.
            this.updateFacing(player);
            this.attackDirection = this.direction;
            this.attackTargetFeetY = clamp(getPlayerGroundFeetY(player), this.walkableTop, this.walkableBottom);
            this.velocityX = 0;
            this.velocityY = 0;
            this.hasAttackToken = true;
            this.enterState(FRAGMENT_STATES.WINDUP, true);
        }

        updateAttackSequence(player, deltaTime, now, effects) {
            const delta = deltaTime / 1000;
            const balance = getCombatBalance().corruptedFragment;

            if (this.state !== FRAGMENT_STATES.WINDUP &&
                this.state !== FRAGMENT_STATES.LUNGE &&
                this.state !== FRAGMENT_STATES.ACTIVE &&
                this.state !== FRAGMENT_STATES.RECOVERY) {
                return false;
            }

            this.attackStateTimer = Math.max(0, this.attackStateTimer - delta);
            this.syncVisualY();

            if (this.state === FRAGMENT_STATES.WINDUP) {
                this.currentFrame = 0;
                this.velocityX = 0;
                this.velocityY = 0;

                if (this.attackStateTimer <= 0) {
                    this.enterState(FRAGMENT_STATES.LUNGE, true);
                }

                return true;
            }

            if (this.state === FRAGMENT_STATES.LUNGE) {
                this.currentFrame = 1;
                this.velocityX = this.attackDirection * balance.lungeSpeed;
                this.velocityY = clamp(this.attackTargetFeetY - this.feetY, -this.depthSpeed * 0.35, this.depthSpeed * 0.35);
                this.x += this.velocityX * delta;
                this.feetY = clamp(this.feetY + this.velocityY * delta, this.walkableTop, this.walkableBottom);
                this.preventCrossingTrix(player);
                this.x = clamp(this.x, 30, this.phaseLength - this.width);
                this.syncVisualY();

                if (this.attackStateTimer <= 0) {
                    this.velocityX = 0;
                    this.velocityY = 0;
                    this.enterState(FRAGMENT_STATES.ACTIVE, true);
                }

                return true;
            }

            if (this.state === FRAGMENT_STATES.ACTIVE) {
                this.currentFrame = 2;
                this.velocityX = 0;
                this.velocityY = 0;
                this.applyAttackDamage(player, now, effects);

                if (this.attackStateTimer <= 0) {
                    this.enterState(FRAGMENT_STATES.RECOVERY, true);
                }

                return true;
            }

            this.currentFrame = 3;
            this.velocityX = 0;
            this.velocityY = 0;

            if (this.attackStateTimer <= 0) {
                this.attackCooldownTimer = balance.attackCooldown;
                this.hasAttackToken = false;
                this.enterState(FRAGMENT_STATES.CHASE, true);
            }

            return true;
        }

        preventCrossingTrix(player) {
            if (!player || !player.getBodyHitbox) {
                return;
            }

            const playerHitbox = player.getBodyHitbox();
            const fragmentHitbox = this.getHitbox();

            if (this.attackDirection > 0 && fragmentHitbox.x + fragmentHitbox.width > playerHitbox.x) {
                this.x = playerHitbox.x - fragmentHitbox.width - this.width * 0.14;
            } else if (this.attackDirection < 0 && fragmentHitbox.x < playerHitbox.x + playerHitbox.width) {
                this.x = playerHitbox.x + playerHitbox.width - this.width * 0.14;
            }
        }

        trackChaseStuck(horizontalGap, movedDistance, delta) {
            const balance = getCombatBalance().corruptedFragment;

            if (this.state !== FRAGMENT_STATES.CHASE || horizontalGap <= balance.attackEnterGap || movedDistance >= 2) {
                this.stuckChaseTimer = 0;
                return;
            }

            this.stuckChaseTimer += delta;

            if (this.stuckChaseTimer >= FRAGMENT_STUCK_ESCAPE_AFTER) {
                // Pequena fuga lateral para a separacao nao anular a perseguicao por muito tempo.
                this.escapeImpulse = (this.direction || 1) * this.speed * 0.35;
                this.stuckChaseTimer = 0;
            }
        }

        calculateSeparation(enemies) {
            let separationX = 0;
            let separationY = 0;

            enemies.forEach((other) => {
                if (other === this || other.enemyType !== ENEMY_TYPE.FRAGMENT || other.removed || !other.alive) {
                    return;
                }

                const dx = this.x - other.x;
                const dy = this.feetY - (typeof other.feetY === 'number' ? other.feetY : other.getDepthY ? other.getDepthY() : other.y);
                const distance = Math.hypot(dx, dy);

                if (distance > 0 && distance < FRAGMENT_SEPARATION_DISTANCE) {
                    const strength = (FRAGMENT_SEPARATION_DISTANCE - distance) / FRAGMENT_SEPARATION_DISTANCE;

                    separationX += dx / distance * strength;
                    separationY += dy / distance * strength;
                } else if (distance === 0) {
                    separationX += this.fragmentIndex % 2 === 0 ? 1 : -1;
                    separationY += this.fragmentIndex % 3 - 1;
                }
            });

            return {
                x: clamp(separationX, -1, 1),
                y: clamp(separationY, -1, 1)
            };
        }

        resolveAttackToken(player, enemies) {
            const playerHitbox = player.getBodyHitbox();
            const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
            const myCenterX = this.x + this.width / 2;
            const mySide = myCenterX < playerCenterX ? 'left' : 'right';
            const myGap = this.getHorizontalGap(playerHitbox, this.getHitbox());
            let tokenHolder = this;
            let tokenGap = myGap;
            const attackStates = [
                FRAGMENT_STATES.WINDUP,
                FRAGMENT_STATES.LUNGE,
                FRAGMENT_STATES.ACTIVE,
                FRAGMENT_STATES.RECOVERY
            ];

            enemies.forEach((other) => {
                if (other === this || other.enemyType !== ENEMY_TYPE.FRAGMENT || other.removed || !other.alive) {
                    return;
                }

                const otherCenterX = other.x + other.width / 2;
                const otherSide = otherCenterX < playerCenterX ? 'left' : 'right';

                if (otherSide !== mySide) {
                    return;
                }

                if (attackStates.indexOf(other.state) !== -1) {
                    tokenHolder = other;
                    tokenGap = this.getHorizontalGap(playerHitbox, other.getHitbox());
                    return;
                }

                const otherGap = this.getHorizontalGap(playerHitbox, other.getHitbox());

                if (otherGap < tokenGap || otherGap === tokenGap && other.fragmentIndex < tokenHolder.fragmentIndex) {
                    tokenHolder = other;
                    tokenGap = otherGap;
                }
            });

            this.hasAttackToken = tokenHolder === this;
            return this.hasAttackToken;
        }

        getHorizontalGap(a, b) {
            if (a.x + a.width < b.x) {
                return b.x - (a.x + a.width);
            }

            if (b.x + b.width < a.x) {
                return a.x - (b.x + b.width);
            }

            return 0;
        }

        hasVerticalOverlap(a, b) {
            const overlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

            // Evita dano por raspao vertical quando a Trix pulou acima do golpe.
            return overlap >= Math.min(a.height, b.height) * 0.35;
        }

        canAttack(player, now) {
            if (!this.alive || this.attackCooldownTimer > 0 || !player || !player.getBodyHitbox) {
                return false;
            }

            const playerHitbox = player.getBodyHitbox();
            const fragmentHitbox = this.getHitbox();
            const verticalGap = Math.abs(getPlayerGroundFeetY(player) - this.feetY);

            return verticalGap <= FRAGMENT_VERTICAL_ATTACK_TOLERANCE &&
                this.getHorizontalGap(playerHitbox, fragmentHitbox) <= getCombatBalance().corruptedFragment.attackEnterGap;
        }

        applyAttackDamage(player, now, effects) {
            const attackHitbox = this.getAttackHitbox();

            if (!attackHitbox || this.damageAppliedThisAttack || !player || !player.getBodyHitbox) {
                return;
            }

            const playerHitbox = player.getBodyHitbox();

            if (rectsOverlap(attackHitbox, playerHitbox) && this.hasVerticalOverlap(playerHitbox, attackHitbox)) {
                this.damageAppliedThisAttack = true;
                player.takeDamage(getCombatBalance().corruptedFragment.meleeDamage, now);

                if (effects && effects.addSpark) {
                    effects.addSpark(player.x + 48, player.getFeetY() - 52, '#37ff8b');
                }
            }
        }

        updateAnimation(deltaTime) {
            const animation = this.getAnimationConfig();
            const lockedAttackFrame = this.getLockedAttackFrame();

            if (typeof lockedAttackFrame === 'number') {
                this.currentFrame = lockedAttackFrame;
                return;
            }

            const frameDuration = 1000 / animation.fps;

            this.frameTimer += deltaTime;

            while (this.frameTimer >= frameDuration) {
                this.frameTimer -= frameDuration;

                if (this.currentFrame < animation.frames.length - 1) {
                    this.currentFrame++;
                    continue;
                }

                if (animation.loop) {
                    this.currentFrame = 0;
                } else {
                    this.animationFinished = true;
                }
            }
        }

        getAnimationConfig() {
            if (this.state === FRAGMENT_STATES.CHASE) {
                return Math.hypot(this.velocityX, this.velocityY) > 5 ? FRAGMENT_ANIMATIONS.move : FRAGMENT_ANIMATIONS.idle;
            }

            if (this.state === FRAGMENT_STATES.HIT) {
                return FRAGMENT_ANIMATIONS.hit;
            }

            if (this.state === FRAGMENT_STATES.DEATH) {
                return FRAGMENT_ANIMATIONS.death;
            }

            return FRAGMENT_ANIMATIONS.idle;
        }

        getLockedAttackFrame() {
            if (this.state === FRAGMENT_STATES.WINDUP) return 0;
            if (this.state === FRAGMENT_STATES.LUNGE) return 1;
            if (this.state === FRAGMENT_STATES.ACTIVE) return 2;
            if (this.state === FRAGMENT_STATES.RECOVERY) return 3;

            return null;
        }

        render(ctx, cameraX, debugPlayer) {
            if (this.removed || !fragmentVisualsReady()) {
                return;
            }

            const animation = this.getLockedAttackFrame() === null ? this.getAnimationConfig() : FRAGMENT_ANIMATIONS.attack;
            const frame = animation.frames[Math.max(0, Math.min(this.currentFrame, animation.frames.length - 1))];
            const sourceX = frame.col * FRAGMENT_FRAME_WIDTH;
            const sourceY = frame.row * FRAGMENT_FRAME_HEIGHT;
            const screenX = this.x - cameraX;
            const now = getNow();

            ctx.save();
            ctx.globalAlpha = now < this.hitFlashUntil ? 0.72 : 1;

            if (this.facing === 'right') {
                ctx.translate(screenX + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(fragmentSpritesheetSource, sourceX, sourceY, FRAGMENT_FRAME_WIDTH, FRAGMENT_FRAME_HEIGHT, 0, 0, this.width, this.height);
            } else {
                ctx.drawImage(fragmentSpritesheetSource, sourceX, sourceY, FRAGMENT_FRAME_WIDTH, FRAGMENT_FRAME_HEIGHT, screenX, this.y, this.width, this.height);
            }

            ctx.restore();
            this.drawHealthBar(ctx, screenX);
            this.drawDebugHitboxes(ctx, cameraX, debugPlayer);
        }

        drawHealthBar(ctx, screenX) {
            if (!this.alive) {
                return;
            }

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenX + 42, this.y + 16, 94, 6);
            ctx.fillStyle = '#37ff8b';
            ctx.fillRect(screenX + 42, this.y + 16, 94 * Math.max(0, this.health / this.maxHealth), 6);
            ctx.restore();
        }

        drawDebugHitboxes(ctx, cameraX, player) {
            if (!DEBUG_COMBAT_HITBOXES) {
                return;
            }

            const bodyHitbox = this.getHitbox();
            const attackHitbox = this.getAttackHitbox();

            ctx.save();
            ctx.lineWidth = 2;
            ctx.font = '11px monospace';

            // Debug amarelo: corpo/hurtbox do Corrupted Fragment.
            ctx.strokeStyle = 'rgba(255, 238, 0, 0.92)';
            ctx.strokeRect(bodyHitbox.x - cameraX, bodyHitbox.y, bodyHitbox.width, bodyHitbox.height);

            // Debug vermelho: hitbox ofensiva somente durante ACTIVE.
            if (attackHitbox) {
                ctx.strokeStyle = 'rgba(255, 46, 46, 0.95)';
                ctx.strokeRect(attackHitbox.x - cameraX, attackHitbox.y, attackHitbox.width, attackHitbox.height);
            }

            // Debug azul: hurtbox atual da Trix.
            if (player && player.getBodyHitbox) {
                const playerHitbox = player.getBodyHitbox();
                const playerFeetY = getPlayerGroundFeetY(player);
                const verticalGap = Math.abs(playerFeetY - this.feetY);

                ctx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
                ctx.strokeRect(playerHitbox.x - cameraX, playerHitbox.y, playerHitbox.width, playerHitbox.height);

                ctx.beginPath();
                ctx.moveTo(playerHitbox.x - cameraX - 10, playerFeetY);
                ctx.lineTo(playerHitbox.x - cameraX + playerHitbox.width + 10, playerFeetY);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.fillText('vgap ' + Math.round(verticalGap), this.x - cameraX + 36, this.y + 8);
            }

            ctx.strokeStyle = 'rgba(255, 238, 0, 0.92)';
            ctx.beginPath();
            ctx.moveTo(this.x - cameraX + this.width * 0.25, this.feetY);
            ctx.lineTo(this.x - cameraX + this.width * 0.75, this.feetY);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.state, this.x - cameraX + 36, this.y - 8);
            ctx.restore();
        }
    }

    class DigitalParasite {
        constructor(spawn, effects, index) {
            const balance = getCombatBalance().digitalParasite;

            this.enemyType = ENEMY_TYPE.PARASITE;
            this.parasiteIndex = index || 0;
            this.targetId = getEnemyTargetId(this);
            this.spawnX = spawn.x;
            this.width = PARASITE_DRAW_SIZE;
            this.height = PARASITE_DRAW_SIZE;
            this.groundY = typeof spawn.groundY === 'number' ? spawn.groundY : game.GROUND_Y;
            this.walkableTop = typeof spawn.walkableTop === 'number' ? spawn.walkableTop : this.groundY;
            this.walkableBottom = typeof spawn.walkableBottom === 'number' ? spawn.walkableBottom : this.groundY;
            this.phaseLength = typeof spawn.phaseLength === 'number' ? spawn.phaseLength : 2400;
            this.x = typeof spawn.x === 'number' ? spawn.x : 0;
            this.feetY = clamp(typeof spawn.feetY === 'number' ? spawn.feetY : this.groundY, this.walkableTop, this.walkableBottom);
            this.y = this.feetY - this.height;
            this.maxHealth = spawn.health || balance.maxHealth;
            this.health = this.maxHealth;
            this.speed = spawn.speed || balance.moveSpeed;
            this.depthSpeed = this.speed * 0.7;
            this.state = 'move';
            this.previousState = 'move';
            this.alive = true;
            this.removed = false;
            this.facing = 'left';
            this.direction = -1;
            this.effects = effects;
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.animationFinished = false;
            this.hitFlashUntil = 0;
            this.damageInvulnerableUntil = 0;
            this.nextAttackAt = 0;
            this.damageAppliedThisAttack = false;
            this.velocityX = 0;
            this.velocityY = 0;
            this.isGrounded = true;
            this.jumpCooldown = this.rollJumpCooldown();
            this.lastMoveX = 0;
            this.lastMoveY = 0;
            this.jumpGroundFeetY = this.feetY;
        }

        rollJumpCooldown() {
            const balance = getCombatBalance().digitalParasite;

            // Cada Parasite sorteia seu proprio intervalo para nao saltarem em bloco.
            return randomRange(balance.jumpCooldownMin, balance.jumpCooldownMax);
        }

        getHitbox() {
            return {
                x: this.x + this.width * 0.12,
                y: this.y + this.height * 0.32,
                width: this.width * 0.76,
                height: this.height * 0.48
            };
        }

        getDepthY() {
            return this.feetY;
        }

        getImpactPoint() {
            const hitbox = this.getHitbox();

            return {
                x: hitbox.x + hitbox.width / 2,
                y: hitbox.y + hitbox.height / 2
            };
        }

        getAttackHitbox() {
            if (this.state !== 'attack' || this.currentFrame !== PARASITE_ACTIVE_ATTACK_FRAME) {
                return null;
            }

            const width = this.width * 0.42;

            // A mordida ativa so existe no terceiro frame e acompanha o espelhamento.
            return {
                x: this.facing === 'left' ? this.x : this.x + this.width - width,
                y: this.y + this.height * 0.30,
                width: width,
                height: this.height * 0.42
            };
        }

        takeDamage(amount) {
            const now = getNow();

            if (!this.alive || this.state === 'death' || now < this.damageInvulnerableUntil) {
                return false;
            }

            this.health = Math.max(0, this.health - amount);
            this.hitFlashUntil = now + 130;
            this.damageInvulnerableUntil = now + getCombatBalance().digitalParasite.hitInvulnerabilityDuration * 1000;

            if (this.health <= 0) {
                this.startDeath();
                return true;
            }

            this.previousState = this.state === 'jump' && !this.isGrounded ? 'jump' : this.resolveMovementState();
            this.enterState('hit', true);
            return false;
        }

        startDeath() {
            if (this.state === 'death') {
                return;
            }

            // A morte cancela salto e ataque; a remocao espera o ultimo frame.
            this.alive = false;
            this.damageAppliedThisAttack = true;
            this.velocityX = 0;
            this.velocityY = 0;
            this.isGrounded = true;
            this.syncGroundVisualY();
            this.enterState('death', true);
            this.effects.addSpark(this.x + this.width / 2, this.feetY - this.height * 0.42, '#00e5ff');
        }

        enterState(nextState, restart) {
            const currentPriority = PARASITE_STATE_PRIORITY[this.state] || 0;
            const nextPriority = PARASITE_STATE_PRIORITY[nextState] || 0;

            if (this.state === 'death' && nextState !== 'death') {
                return;
            }

            if (nextPriority < currentPriority && !this.animationFinished) {
                return;
            }

            if (restart || this.state !== nextState) {
                this.state = nextState;
                this.currentFrame = 0;
                this.frameTimer = 0;
                this.animationFinished = false;

                if (nextState === 'attack') {
                    this.damageAppliedThisAttack = false;
                }
            }
        }

        resolveMovementState() {
            return Math.hypot(this.lastMoveX || 0, this.lastMoveY || 0) > 0.45 ? 'move' : 'idle';
        }

        syncGroundVisualY() {
            this.feetY = clamp(this.feetY, this.walkableTop, this.walkableBottom);
            this.y = this.feetY - this.height;
        }

        update(player, deltaTime, now, effects, cameraX, canvasWidth, enemies) {
            if (this.removed) {
                return;
            }

            this.updateFacing(player);

            if (this.state === 'death') {
                this.updateAnimation(deltaTime);

                if (this.animationFinished) {
                    this.removed = true;
                }

                return;
            }

            if (this.state === 'hit') {
                if (!this.isGrounded) {
                    this.updateJumpPhysics(player, deltaTime, now, enemies || [], false);
                }

                this.updateAnimation(deltaTime);

                if (this.animationFinished) {
                    this.enterState(this.isGrounded ? this.resolveMovementState() : 'jump', true);
                }

                return;
            }

            if (this.state === 'attack') {
                this.updateAnimation(deltaTime);
                this.applyAttackDamage(player, now, effects);

                if (this.animationFinished) {
                    this.enterState(this.canAttack(player, now, enemies || []) ? 'idle' : 'move', true);
                }

                return;
            }

            if (this.state === 'jump' || !this.isGrounded) {
                this.updateJumpPhysics(player, deltaTime, now, enemies || [], true);
                return;
            }

            this.updateGroundLogic(player, deltaTime, now, enemies || []);
        }

        updateGroundLogic(player, deltaTime, now, enemies) {
            const delta = deltaTime / 1000;

            this.syncGroundVisualY();
            this.jumpCooldown = Math.max(0, this.jumpCooldown - delta);

            if (this.shouldStartJump(player)) {
                this.startJump(player);
                return;
            }

            if (this.canAttack(player, now, enemies)) {
                this.nextAttackAt = now + getCombatBalance().digitalParasite.attackCooldown * 1000;
                this.enterState('attack', true);
                this.updateAnimation(deltaTime);
                return;
            }

            this.updateMovement(player, deltaTime, enemies);
            this.enterState(this.resolveMovementState(), false);
            this.updateAnimation(deltaTime);
        }

        updateFacing(player) {
            const playerHitbox = player && player.getBodyHitbox ? player.getBodyHitbox() : { x: player.x, width: 0 };
            const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
            const parasiteCenterX = this.x + this.width / 2;

            this.facing = playerCenterX < parasiteCenterX ? 'left' : 'right';
            this.direction = this.facing === 'left' ? -1 : 1;
        }

        shouldStartJump(player) {
            if (!this.isGrounded || this.jumpCooldown > 0 || this.state === 'hit' || this.state === 'attack' || this.state === 'death' || !player || player.isDead) {
                return false;
            }

            const distance = this.getHorizontalGap(player.getBodyHitbox(), this.getHitbox());

            return distance >= 170 && distance <= 430;
        }

        startJump(player) {
            const balance = getCombatBalance().digitalParasite;
            const playerHitbox = player.getBodyHitbox();
            const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
            const parasiteCenterX = this.x + this.width / 2;
            const directionToTrix = playerCenterX < parasiteCenterX ? -1 : 1;

            // Salto fisico real: velocidade horizontal e vertical evoluem via deltaTime.
            this.velocityX = directionToTrix * balance.jumpSpeedX;
            this.velocityY = -balance.jumpSpeedY;
            this.jumpGroundFeetY = this.feetY;
            this.isGrounded = false;
            this.enterState('jump', true);
        }

        updateJumpPhysics(player, deltaTime, now, enemies, allowLandingAttack) {
            const delta = deltaTime / 1000;
            const balance = getCombatBalance().digitalParasite;
            const separation = this.calculateSeparation(enemies);

            this.velocityY += balance.gravity * delta;
            this.x += (this.velocityX + separation.x * this.speed * 0.5) * delta;
            this.y += this.velocityY * delta;
            this.x = clamp(this.x, 30, this.phaseLength - this.width);
            this.currentFrame = this.velocityY < -balance.jumpSpeedY * 0.25 ? 0 : 1;

            if (this.y >= this.jumpGroundFeetY - this.height) {
                // Pouso travado exatamente na faixa de profundidade de onde saltou.
                this.feetY = clamp(this.jumpGroundFeetY, this.walkableTop, this.walkableBottom);
                this.syncGroundVisualY();
                this.velocityX = 0;
                this.velocityY = 0;
                this.isGrounded = true;
                this.jumpCooldown = this.rollJumpCooldown();
                this.animationFinished = true;

                if (allowLandingAttack && this.canAttack(player, now, enemies)) {
                    this.nextAttackAt = now + balance.attackCooldown * 1000;
                    this.enterState('attack', true);
                    return;
                }

                this.enterState(this.resolveMovementState(), true);
            }
        }

        updateMovement(player, deltaTime, enemies) {
            const delta = deltaTime / 1000;
            const balance = getCombatBalance().digitalParasite;
            const playerHitbox = player.getBodyHitbox();
            const parasiteHitbox = this.getHitbox();
            const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
            const parasiteCenterX = parasiteHitbox.x + parasiteHitbox.width / 2;
            const horizontalGap = this.getHorizontalGap(playerHitbox, parasiteHitbox);
            const trixFeetY = getPlayerGroundFeetY(player);
            const hasAttackSlot = this.hasAttackSlot(player, enemies);
            const desiredGap = hasAttackSlot ? balance.attackRange : PARASITE_ATTACK_SLOT_DISTANCE;
            const separation = this.calculateSeparation(enemies);
            const previousX = this.x;
            const previousFeetY = this.feetY;
            let targetX = this.x;
            const targetFeetY = trixFeetY;
            let dx = 0;
            let dy = 0;
            let distance = 0;

            if (horizontalGap > desiredGap) {
                targetX = this.x + Math.sign(playerCenterX - parasiteCenterX) * horizontalGap;
            } else if (!hasAttackSlot && horizontalGap < desiredGap - 12) {
                targetX = this.x - Math.sign(playerCenterX - parasiteCenterX) * (desiredGap - horizontalGap);
            }

            dx = targetX - this.x;
            dy = Math.abs(targetFeetY - this.feetY) > PARASITE_VERTICAL_DEAD_ZONE ? targetFeetY - this.feetY : 0;
            distance = Math.hypot(dx, dy);

            if (distance > 0) {
                this.velocityX = dx / distance * this.speed + separation.x * this.speed * PARASITE_SEPARATION_FORCE * 10;
                this.velocityY = dy / distance * this.depthSpeed + separation.y * this.depthSpeed * PARASITE_SEPARATION_FORCE * 10;
            } else {
                this.velocityX = separation.x * this.speed * PARASITE_SEPARATION_FORCE * 10;
                this.velocityY = separation.y * this.depthSpeed * PARASITE_SEPARATION_FORCE * 10;
            }

            // A separacao abre espaco sem cancelar a corrida em direcao a Trix.
            this.x += this.velocityX * delta;
            this.x = clamp(this.x, 30, this.phaseLength - this.width);
            this.feetY = clamp(this.feetY + this.velocityY * delta, this.walkableTop, this.walkableBottom);
            this.syncGroundVisualY();
            this.lastMoveX = this.x - previousX;
            this.lastMoveY = this.feetY - previousFeetY;
        }

        calculateSeparation(enemies) {
            let separationX = 0;
            let separationY = 0;

            enemies.forEach((other) => {
                if (other === this || other.removed || !other.alive || other.enemyType === ENEMY_TYPE.DRONE) {
                    return;
                }

                const otherWidth = other.width || this.width;
                const requiredDistance = other.enemyType === ENEMY_TYPE.FRAGMENT ? Math.max(PARASITE_SEPARATION_DISTANCE, (this.width + otherWidth) * 0.34) : PARASITE_SEPARATION_DISTANCE;
                const dx = this.x - other.x;
                const otherFeetY = typeof other.feetY === 'number' ? other.feetY : other.getDepthY ? other.getDepthY() : other.y;
                const dy = this.feetY - otherFeetY;
                const distance = Math.hypot(dx, dy);

                if (distance > 0 && distance < requiredDistance) {
                    const strength = (requiredDistance - distance) / requiredDistance;

                    separationX += dx / distance * strength;
                    separationY += dy / distance * strength;
                } else if (distance === 0) {
                    separationX += this.parasiteIndex % 2 === 0 ? 1 : -1;
                    separationY += this.parasiteIndex % 3 - 1;
                }
            });

            return {
                x: clamp(separationX, -1.4, 1.4),
                y: clamp(separationY, -1.4, 1.4)
            };
        }

        getHorizontalGap(a, b) {
            if (a.x + a.width < b.x) {
                return b.x - (a.x + a.width);
            }

            if (b.x + b.width < a.x) {
                return a.x - (b.x + b.width);
            }

            return 0;
        }

        canAttack(player, now, enemies) {
            if (!this.alive || !this.isGrounded || now < this.nextAttackAt || !player || !player.getBodyHitbox || !this.hasAttackSlot(player, enemies || [])) {
                return false;
            }

            const playerHitbox = player.getBodyHitbox();
            const parasiteHitbox = this.getHitbox();
            const verticalGap = Math.abs(getPlayerGroundFeetY(player) - this.feetY);

            return verticalGap <= FRAGMENT_VERTICAL_ATTACK_TOLERANCE &&
                this.getHorizontalGap(playerHitbox, parasiteHitbox) <= getCombatBalance().digitalParasite.attackRange;
        }

        hasAttackSlot(player, enemies) {
            const playerCenterX = player.getBodyHitbox().x + player.getBodyHitbox().width / 2;
            const side = this.x + this.width / 2 < playerCenterX ? 'left' : 'right';

            return !enemies.some((other) => {
                if (other === this || other.enemyType !== ENEMY_TYPE.PARASITE || other.removed || other.state !== 'attack') {
                    return false;
                }

                const otherSide = other.x + other.width / 2 < playerCenterX ? 'left' : 'right';

                return otherSide === side;
            });
        }

        applyAttackDamage(player, now, effects) {
            const attackHitbox = this.getAttackHitbox();

            if (!attackHitbox || this.damageAppliedThisAttack || !player || !player.getBodyHitbox) {
                return;
            }

            const playerHitbox = player.getBodyHitbox();
            const verticalGap = Math.abs(getPlayerGroundFeetY(player) - this.feetY);

            if (rectsOverlap(attackHitbox, playerHitbox) && verticalGap <= FRAGMENT_VERTICAL_ATTACK_TOLERANCE) {
                this.damageAppliedThisAttack = true;
                player.takeDamage(getCombatBalance().digitalParasite.meleeDamage, now);

                if (effects && effects.addSpark) {
                    effects.addSpark(player.x + 48, player.getFeetY() - 50, '#00e5ff');
                }
            }
        }

        updateAnimation(deltaTime) {
            if (this.state === 'jump') {
                return;
            }

            const animation = PARASITE_ANIMATIONS[this.state] || PARASITE_ANIMATIONS.idle;
            const frameDuration = 1000 / animation.fps;

            this.frameTimer += deltaTime;

            while (this.frameTimer >= frameDuration) {
                this.frameTimer -= frameDuration;

                if (this.currentFrame < animation.frames.length - 1) {
                    this.currentFrame++;
                    continue;
                }

                if (animation.loop) {
                    this.currentFrame = 0;
                } else {
                    this.animationFinished = true;
                }
            }
        }

        render(ctx, cameraX, debugPlayer) {
            if (this.removed || !parasiteVisualsReady()) {
                return;
            }

            const animation = PARASITE_ANIMATIONS[this.state] || PARASITE_ANIMATIONS.idle;
            const frame = animation.frames[Math.max(0, Math.min(this.currentFrame, animation.frames.length - 1))];
            const sourceX = frame.col * PARASITE_FRAME_WIDTH;
            const sourceY = frame.row * PARASITE_FRAME_HEIGHT;
            const screenX = this.x - cameraX;
            const now = getNow();

            ctx.save();
            ctx.globalAlpha = now < this.hitFlashUntil ? 0.72 : 1;

            if (this.facing === 'right') {
                ctx.translate(screenX + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(parasiteSpritesheetSource, sourceX, sourceY, PARASITE_FRAME_WIDTH, PARASITE_FRAME_HEIGHT, 0, 0, this.width, this.height);
            } else {
                ctx.drawImage(parasiteSpritesheetSource, sourceX, sourceY, PARASITE_FRAME_WIDTH, PARASITE_FRAME_HEIGHT, screenX, this.y, this.width, this.height);
            }

            ctx.restore();
            this.drawHealthBar(ctx, screenX);
            this.drawDebugHitboxes(ctx, cameraX, debugPlayer);
        }

        drawHealthBar(ctx, screenX) {
            if (!this.alive) {
                return;
            }

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenX + 36, this.y + 22, 76, 5);
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(screenX + 36, this.y + 22, 76 * Math.max(0, this.health / this.maxHealth), 5);
            ctx.restore();
        }

        drawDebugHitboxes(ctx, cameraX, player) {
            if (!DEBUG_COMBAT_HITBOXES) {
                return;
            }

            const bodyHitbox = this.getHitbox();
            const attackHitbox = this.getAttackHitbox();

            ctx.save();
            ctx.lineWidth = 2;
            ctx.font = '11px monospace';
            ctx.strokeStyle = 'rgba(255, 238, 0, 0.9)';
            ctx.strokeRect(bodyHitbox.x - cameraX, bodyHitbox.y, bodyHitbox.width, bodyHitbox.height);

            if (attackHitbox) {
                ctx.strokeStyle = 'rgba(255, 46, 46, 0.95)';
                ctx.strokeRect(attackHitbox.x - cameraX, attackHitbox.y, attackHitbox.width, attackHitbox.height);
            }

            if (player && player.getBodyHitbox) {
                const playerHitbox = player.getBodyHitbox();
                const playerFeetY = getPlayerGroundFeetY(player);
                const verticalGap = Math.abs(playerFeetY - this.feetY);

                ctx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
                ctx.beginPath();
                ctx.moveTo(playerHitbox.x - cameraX - 10, playerFeetY);
                ctx.lineTo(playerHitbox.x - cameraX + playerHitbox.width + 10, playerFeetY);
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.fillText('vgap ' + Math.round(verticalGap), this.x - cameraX + 28, this.y + 10);
            }

            ctx.strokeStyle = 'rgba(255, 238, 0, 0.92)';
            ctx.beginPath();
            ctx.moveTo(this.x - cameraX + this.width * 0.25, this.feetY);
            ctx.lineTo(this.x - cameraX + this.width * 0.75, this.feetY);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.state, this.x - cameraX + 28, this.y - 8);
            ctx.restore();
        }
    }

    class EnemySystem {
        constructor(effects) {
            this.effects = effects;
            this.enemies = [];
            this.waveDefinitions = [];
            this.waveCursor = 0;
            this.waveEntryQueue = [];
            this.currentWave = 0;
            this.totalEnemiesInPhase = 0;
            this.defeatedEnemies = 0;
            this.chargeableDefeats = 0;
            this.pendingWaveClearRewards = 0;
            this.lastRewardedWave = 0;
            this.waitingForNextWave = false;
            this.waveDelayTimer = 0;
            this.preloadPromise = null;
            this.cameraX = 0;
            this.canvasWidth = 900;
            this.visualsReady = false;
            this.fragmentVisualsReady = false;
            this.parasiteVisualsReady = false;
            this.phaseLength = 2400;
            this.groundY = game.GROUND_Y;
            this.walkableTop = game.GROUND_Y;
            this.walkableBottom = game.GROUND_Y;
            this.debugPlayer = null;
            this.soloEncounter = this.createSoloEncounterState();
        }

        loadEnemies(source) {
            const phase = Array.isArray(source) ? { enemies: source } : source || {};

            // Reinicia completamente o controlador de ondas ao carregar/reiniciar fase.
            this.enemies = [];
            this.waveDefinitions = normalizeWaveDefinitions(source);
            this.waveCursor = 0;
            this.waveEntryQueue = [];
            this.currentWave = 0;
            this.totalEnemiesInPhase = countWaveEnemies(this.waveDefinitions);
            this.defeatedEnemies = 0;
            this.chargeableDefeats = 0;
            this.pendingWaveClearRewards = 0;
            this.lastRewardedWave = 0;
            this.waitingForNextWave = false;
            this.waveDelayTimer = 0;
            this.soloEncounter = this.createSoloEncounterState();
            this.phaseLength = typeof phase.length === 'number' ? phase.length : 2400;
            this.groundY = typeof phase.groundY === 'number' ? phase.groundY : game.GROUND_Y;
            this.walkableTop = getWalkableTop(phase);
            this.walkableBottom = getWalkableBottom(phase);
            this.visualsReady = false;
            this.fragmentVisualsReady = false;
            this.parasiteVisualsReady = false;
            this.preloadPromise = Promise.all([preloadDroneFrames(), preloadFragmentFrames(), preloadParasiteFrames()]).then((ready) => {
                this.visualsReady = ready[0];
                this.fragmentVisualsReady = ready[1];
                this.parasiteVisualsReady = ready[2];
                return this.visualsReady;
            });
        }

        preloadEnemyVisuals() {
            this.preloadPromise = Promise.all([preloadDroneFrames(), preloadFragmentFrames(), preloadParasiteFrames()]).then((ready) => {
                this.visualsReady = ready[0];
                this.fragmentVisualsReady = ready[1];
                this.parasiteVisualsReady = ready[2];
                return this.visualsReady;
            });
            return this.preloadPromise;
        }

        whenVisualsReady() {
            return this.preloadPromise || this.preloadEnemyVisuals();
        }

        setViewport(cameraX, canvasWidth) {
            this.cameraX = cameraX;
            this.canvasWidth = canvasWidth;
        }

        update(player, deltaTime, now) {
            if (!this.visualsReady || !droneVisualsReady()) {
                return;
            }

            this.debugPlayer = player;
            this.updateWaveController(deltaTime, player);

            this.enemies.forEach((enemy) => {
                if (this.updateSpawnEntry(enemy, deltaTime)) {
                    return;
                }

                if (this.isSoloEnemyPaused(enemy)) {
                    return;
                }

                if (this.updateStunnedEnemy(enemy, deltaTime, now)) {
                    return;
                }

                enemy.update(player, deltaTime, now, this.effects, this.cameraX, this.canvasWidth, this.enemies);
            });

            const beforeFilter = this.enemies.length;
            const removedEnemies = this.enemies.filter(function (enemy) {
                return enemy.removed;
            });

            this.enemies = this.enemies.filter(function (enemy) {
                return !enemy.removed;
            });

            this.defeatedEnemies += beforeFilter - this.enemies.length;
            this.chargeableDefeats += removedEnemies.filter(function (enemy) {
                return !enemy.defeatedByUltimate;
            }).length;

            if (!this.soloEncounter.active) {
                this.updateWaveController(deltaTime, player);
            }
        }

        updateWaveController(deltaTime, player) {
            this.updateSoloEncounter(deltaTime, player);

            if (this.soloEncounter.active) {
                return;
            }

            if (this.waveEntryQueue.length > 0) {
                this.updateWaveEntryQueue(deltaTime);
                return;
            }

            if (this.enemies.length === 0 &&
                this.currentWave > 0 &&
                this.lastRewardedWave !== this.currentWave) {
                this.pendingWaveClearRewards++;
                this.lastRewardedWave = this.currentWave;
            }

            if (this.enemies.length > 0 || this.waveCursor >= this.waveDefinitions.length) {
                return;
            }

            if (this.currentWave === 0 && !this.waitingForNextWave) {
                this.queueNextWave(player);
                return;
            }

            if (!this.waitingForNextWave) {
                if (this.tryStartSoloEncounter(player)) {
                    return;
                }

                this.waitingForNextWave = true;
                this.waveDelayTimer = WAVE_DELAY;
            }

            this.waveDelayTimer -= deltaTime / 1000;

            if (this.waveDelayTimer <= 0) {
                this.waitingForNextWave = false;
                this.queueNextWave(player);
            }
        }

        createSoloEncounterState() {
            return {
                active: false,
                enemy: null,
                enemyType: null,
                state: SOLO_ENCOUNTER_STATE.IDLE,
                completed: false,
                nextCheckTimer: 0,
                presentTimer: 0,
                finishTimer: 0,
                targetX: 0,
                lastType: null,
                lastWave: -999,
                count: 0,
                rolledForWave: 0,
                side: 1
            };
        }

        updateSoloEncounter(deltaTime, player) {
            const solo = this.soloEncounter;
            const delta = deltaTime / 1000;

            if (solo.nextCheckTimer > 0) {
                solo.nextCheckTimer = Math.max(0, solo.nextCheckTimer - delta);
            }

            if (!solo.active) {
                return;
            }

            if (!player || player.isDead) {
                solo.active = false;
                solo.enemy = null;
                solo.state = SOLO_ENCOUNTER_STATE.IDLE;
                return;
            }

            if (solo.enemy && solo.enemy.removed) {
                solo.enemy = null;
            }

            if (!solo.enemy && solo.state !== SOLO_ENCOUNTER_STATE.FINISHING) {
                solo.state = SOLO_ENCOUNTER_STATE.FINISHING;
                solo.finishTimer = randomRange(SOLO_ENCOUNTER_FINISH_MIN_DELAY, SOLO_ENCOUNTER_FINISH_MAX_DELAY);
                solo.completed = true;
            }

            if (solo.enemy &&
                (solo.state === SOLO_ENCOUNTER_STATE.SPAWNING || solo.state === SOLO_ENCOUNTER_STATE.INTRO)) {
                solo.enemy.damageInvulnerableUntil = Math.max(solo.enemy.damageInvulnerableUntil || 0, getNow() + 120);
            }

            if (solo.state === SOLO_ENCOUNTER_STATE.SPAWNING && solo.enemy) {
                this.updateSoloEnemyEntry(solo.enemy, solo, delta);

                if (Math.abs(this.getSoloEnemyEntryPosition(solo.enemy) - solo.targetX) <= 4) {
                    this.setSoloEnemyEntryPosition(solo.enemy, solo.targetX);
                    solo.state = SOLO_ENCOUNTER_STATE.INTRO;
                    solo.enemy.soloIntroState = SOLO_ENCOUNTER_STATE.INTRO;
                    solo.presentTimer = SOLO_ENCOUNTER_PRESENT_DURATION;
                }

                return;
            }

            if (solo.state === SOLO_ENCOUNTER_STATE.INTRO) {
                solo.presentTimer = Math.max(0, solo.presentTimer - delta);

                if (solo.presentTimer <= 0) {
                    solo.state = SOLO_ENCOUNTER_STATE.COMBAT;
                    if (solo.enemy) {
                        solo.enemy.soloIntroState = SOLO_ENCOUNTER_STATE.COMBAT;
                    }
                }

                return;
            }

            if (solo.state === SOLO_ENCOUNTER_STATE.FINISHING) {
                solo.finishTimer = Math.max(0, solo.finishTimer - delta);

                if (solo.finishTimer <= 0) {
                    solo.active = false;
                    solo.state = SOLO_ENCOUNTER_STATE.IDLE;
                    solo.nextCheckTimer = SOLO_ENCOUNTER_MIN_INTERVAL;
                    this.waitingForNextWave = true;
                    this.waveDelayTimer = 0;
                }
            }
        }

        tryStartSoloEncounter(player) {
            if (!player || player.isDead || this.waveCursor >= this.waveDefinitions.length) {
                return false;
            }

            if (this.currentWave <= 0 ||
                this.soloEncounter.active ||
                this.soloEncounter.rolledForWave === this.currentWave ||
                this.soloEncounter.nextCheckTimer > 0 ||
                this.soloEncounter.count >= SOLO_ENCOUNTER_MAX_PER_PHASE ||
                this.soloEncounter.lastWave === this.currentWave - 1) {
                return false;
            }

            this.soloEncounter.rolledForWave = this.currentWave;

            if (Math.random() > SOLO_ENCOUNTER_CHANCE) {
                return false;
            }

            return this.startSoloEncounter(player);
        }

        startSoloEncounter(player) {
            const type = this.chooseSoloEnemyType();

            if (!type) {
                return false;
            }

            const side = 1;
            const spawn = this.prepareSoloSpawn(type, side, player);
            const enemy = this.createEnemy(spawn, 9000 + this.soloEncounter.count);

            if (!enemy) {
                return false;
            }

            enemy.maxHealth = Math.ceil(enemy.maxHealth * SOLO_ENCOUNTER_HEALTH_MULTIPLIER);
            enemy.health = enemy.maxHealth;
            enemy.isSoloEncounter = true;

            this.enemies.push(enemy);
            this.totalEnemiesInPhase++;
            this.soloEncounter.active = true;
            this.soloEncounter.enemy = enemy;
            this.soloEncounter.enemyType = type;
            this.soloEncounter.state = SOLO_ENCOUNTER_STATE.SPAWNING;
            this.soloEncounter.completed = false;
            this.soloEncounter.targetX = spawn.targetX;
            this.soloEncounter.side = side;
            this.soloEncounter.lastType = type;
            this.soloEncounter.lastWave = this.currentWave;
            this.soloEncounter.count++;
            enemy.soloIntroState = SOLO_ENCOUNTER_STATE.SPAWNING;
            return true;
        }

        chooseSoloEnemyType() {
            const unlocked = [
                { type: ENEMY_TYPE.DRONE, weight: 45 }
            ];

            if (this.currentWave >= 3) {
                unlocked.push({ type: ENEMY_TYPE.FRAGMENT, weight: 35 });
            }

            if (this.currentWave >= 4) {
                unlocked.push({ type: ENEMY_TYPE.PARASITE, weight: 20 });
            }

            if (unlocked.length <= 0) {
                return null;
            }

            let chosen = this.pickWeightedEnemyType(unlocked);

            if (chosen === this.soloEncounter.lastType && unlocked.length > 1) {
                const retry = this.pickWeightedEnemyType(unlocked);

                if (retry !== chosen) {
                    chosen = retry;
                }
            }

            return chosen;
        }

        pickWeightedEnemyType(options) {
            const totalWeight = options.reduce(function (total, option) {
                return total + option.weight;
            }, 0);
            let roll = Math.random() * totalWeight;

            for (let index = 0; index < options.length; index++) {
                roll -= options[index].weight;

                if (roll <= 0) {
                    return options[index].type;
                }
            }

            return options[options.length - 1].type;
        }

        prepareSoloSpawn(type, side, player) {
            const plan = this.getRightEntryPlan(type, player, 0);
            const spawn = {
                type: type,
                x: plan.startX,
                y: type === ENEMY_TYPE.DRONE ? this.groundY - 118 : undefined,
                feetY: clamp(getPlayerGroundFeetY(player), this.walkableTop, this.walkableBottom)
            };

            if (type === ENEMY_TYPE.DRONE) {
                spawn.centerX = plan.startX;
                spawn.y = clamp(this.groundY - 128, this.walkableTop - 120, this.groundY - 70);
            }

            spawn.phaseLength = this.phaseLength;
            spawn.groundY = this.groundY;
            spawn.walkableTop = this.walkableTop;
            spawn.walkableBottom = this.walkableBottom;
            spawn.targetX = plan.targetX;
            return spawn;
        }

        getEnemyEntryWidth(type) {
            if (type === ENEMY_TYPE.DRONE) return DRONE_DRAW_SIZE;
            if (type === ENEMY_TYPE.FRAGMENT) return FRAGMENT_DRAW_SIZE;
            if (type === ENEMY_TYPE.PARASITE) return PARASITE_DRAW_SIZE;
            return DRONE_DRAW_SIZE;
        }

        getRightEntryPlan(type, player, slotIndex) {
            const width = this.getEnemyEntryWidth(type);
            const trixX = player && typeof player.x === 'number' ? player.x : this.cameraX + this.canvasWidth * 0.45;
            const visibleRight = this.cameraX + this.canvasWidth;
            const spacing = Math.max(0, slotIndex || 0) * RIGHT_SPAWN_SEPARATION;
            const startX = Math.max(
                visibleRight + RIGHT_SPAWN_MARGIN + spacing + (type === ENEMY_TYPE.DRONE ? width / 2 : 0),
                trixX + SOLO_ENCOUNTER_SAFE_DISTANCE + spacing
            );
            const idealTarget = type === ENEMY_TYPE.DRONE ?
                visibleRight - width / 2 - RIGHT_SPAWN_TARGET_PADDING :
                visibleRight - width - RIGHT_SPAWN_TARGET_PADDING;
            const minTarget = trixX + SOLO_ENCOUNTER_SAFE_DISTANCE;
            const maxTarget = type === ENEMY_TYPE.DRONE ? this.phaseLength - width / 2 : this.phaseLength - width;
            const targetX = clamp(Math.max(idealTarget, minTarget), 30, Math.max(30, maxTarget));

            return {
                startX: startX,
                targetX: targetX
            };
        }

        getEntryFeetY(slotIndex) {
            if (this.walkableBottom <= this.walkableTop) {
                return this.groundY;
            }

            const lanes = [0.22, 0.58, 0.84, 0.38, 0.72];
            const lane = lanes[Math.abs(slotIndex || 0) % lanes.length];

            return clamp(this.walkableTop + (this.walkableBottom - this.walkableTop) * lane, this.walkableTop, this.walkableBottom);
        }

        updateSoloEnemyEntry(enemy, solo, delta) {
            const safeDeltaTime = Math.min(delta, 0.05);
            const currentX = this.getSoloEnemyEntryPosition(enemy);
            const direction = solo.targetX >= currentX ? 1 : -1;
            const nextX = currentX + direction * SOLO_ENCOUNTER_ENTRY_SPEED * safeDeltaTime;

            if (direction > 0) {
                this.setSoloEnemyEntryPosition(enemy, Math.min(nextX, solo.targetX));
            } else {
                this.setSoloEnemyEntryPosition(enemy, Math.max(nextX, solo.targetX));
            }
        }

        getSoloEnemyEntryPosition(enemy) {
            return enemy.enemyType === ENEMY_TYPE.DRONE ? enemy.x : enemy.x;
        }

        setSoloEnemyEntryPosition(enemy, x) {
            enemy.x = x;
        }

        isSoloEnemyPaused(enemy) {
            return this.soloEncounter.active &&
                this.soloEncounter.enemy === enemy &&
                enemy.alive &&
                (this.soloEncounter.state === SOLO_ENCOUNTER_STATE.SPAWNING ||
                    this.soloEncounter.state === SOLO_ENCOUNTER_STATE.INTRO);
        }

        configureSpawnEntry(enemy, spawn) {
            if (!enemy || typeof spawn.entryTargetX !== 'number') {
                return enemy;
            }

            enemy.spawnEntryActive = true;
            enemy.spawnEntryTargetX = spawn.entryTargetX;
            enemy.spawnEntrySpeed = spawn.entrySpeed || SOLO_ENCOUNTER_ENTRY_SPEED;
            enemy.soloIntroState = SOLO_ENCOUNTER_STATE.SPAWNING;
            enemy.damageInvulnerableUntil = Math.max(enemy.damageInvulnerableUntil || 0, getNow() + 120);
            return enemy;
        }

        updateSpawnEntry(enemy, deltaTime) {
            if (!enemy || !enemy.spawnEntryActive || enemy.removed || !enemy.alive) {
                return false;
            }

            const safeDeltaTime = Math.min(deltaTime / 1000, 0.05);
            const currentX = this.getSoloEnemyEntryPosition(enemy);
            const targetX = enemy.spawnEntryTargetX;
            const direction = targetX >= currentX ? 1 : -1;
            const nextX = currentX + direction * (enemy.spawnEntrySpeed || SOLO_ENCOUNTER_ENTRY_SPEED) * safeDeltaTime;

            if (direction > 0) {
                this.setSoloEnemyEntryPosition(enemy, Math.min(nextX, targetX));
            } else {
                this.setSoloEnemyEntryPosition(enemy, Math.max(nextX, targetX));
            }

            enemy.velocityX = 0;
            enemy.velocityY = 0;
            enemy.damageInvulnerableUntil = Math.max(enemy.damageInvulnerableUntil || 0, getNow() + 120);

            if (typeof enemy.updateAnimation === 'function') {
                enemy.updateAnimation(deltaTime);
            }

            if (Math.abs(this.getSoloEnemyEntryPosition(enemy) - targetX) <= 2) {
                this.setSoloEnemyEntryPosition(enemy, targetX);
                enemy.spawnEntryActive = false;
                enemy.soloIntroState = SOLO_ENCOUNTER_STATE.COMBAT;
            }

            return true;
        }

        updateStunnedEnemy(enemy, deltaTime, now) {
            if (!enemy || !enemy.stunnedUntil || now >= enemy.stunnedUntil || enemy.removed || !enemy.alive) {
                return false;
            }

            enemy.velocityX = 0;
            enemy.velocityY = 0;

            if (typeof enemy.updateAnimation === 'function') {
                enemy.updateAnimation(deltaTime);
            }

            return true;
        }

        stunEnemy(enemy, duration, now) {
            if (!enemy || !enemy.alive || enemy.removed) {
                return;
            }

            enemy.stunnedUntil = Math.max(enemy.stunnedUntil || 0, now + duration);
            enemy.velocityX = 0;
            enemy.velocityY = 0;
        }

        getUltimateTargets(cameraX, canvasWidth) {
            return this.getTargetableEnemies(cameraX, canvasWidth);
        }

        consumeChargeableDefeats() {
            const count = this.chargeableDefeats || 0;

            this.chargeableDefeats = 0;
            return count;
        }

        consumeWaveClearRewards() {
            const count = this.pendingWaveClearRewards || 0;

            this.pendingWaveClearRewards = 0;
            return count;
        }

        getTargetableEnemies(cameraX, canvasWidth) {
            const viewX = typeof cameraX === 'number' ? cameraX : this.cameraX;
            const viewWidth = typeof canvasWidth === 'number' ? canvasWidth : this.canvasWidth;

            return this.enemies.filter((enemy) => this.isTargetableEnemy(enemy, viewX, viewWidth));
        }

        isTargetableEnemy(enemy, cameraX, canvasWidth) {
            if (!enemyInSelectableState(enemy)) {
                return false;
            }

            const viewX = typeof cameraX === 'number' ? cameraX : this.cameraX;
            const viewWidth = typeof canvasWidth === 'number' ? canvasWidth : this.canvasWidth;
            const bounds = getEnemyVisualBounds(enemy);

            if (!bounds) {
                return false;
            }

            return bounds.x + bounds.width >= viewX &&
                bounds.x <= viewX + viewWidth;
        }

        getEnemyByTargetId(targetId) {
            if (!targetId) {
                return null;
            }

            return this.enemies.find(function (enemy) {
                return getEnemyTargetId(enemy) === targetId;
            }) || null;
        }

        getValidTargetById(targetId, cameraX, canvasWidth) {
            const enemy = this.getEnemyByTargetId(targetId);

            return this.isTargetableEnemy(enemy, cameraX, canvasWidth) ? enemy : null;
        }

        selectTargetAt(canvasX, canvasY, cameraX, canvasWidth) {
            const candidates = this.getTargetableEnemies(cameraX, canvasWidth).filter(function (enemy) {
                const bounds = getEnemyVisualBounds(enemy);

                return bounds &&
                    canvasX >= bounds.x - cameraX &&
                    canvasX <= bounds.x - cameraX + bounds.width &&
                    canvasY >= bounds.y &&
                    canvasY <= bounds.y + bounds.height;
            });

            if (candidates.length <= 0) {
                return null;
            }

            candidates.sort(function (a, b) {
                const depthA = a.getDepthY ? a.getDepthY() : a.y;
                const depthB = b.getDepthY ? b.getDepthY() : b.y;

                if (depthA !== depthB) {
                    return depthB - depthA;
                }

                const centerA = getEnemyDrawCenter(a);
                const centerB = getEnemyDrawCenter(b);
                const distanceA = Math.hypot(centerA.x - (canvasX + cameraX), centerA.y - canvasY);
                const distanceB = Math.hypot(centerB.x - (canvasX + cameraX), centerB.y - canvasY);

                return distanceA - distanceB;
            });

            return getEnemyTargetId(candidates[0]);
        }

        cycleTarget(currentTargetId, cameraX, canvasWidth) {
            const candidates = this.getTargetableEnemies(cameraX, canvasWidth).sort(function (a, b) {
                const depthA = a.getDepthY ? a.getDepthY() : a.y;
                const depthB = b.getDepthY ? b.getDepthY() : b.y;

                if (a.x !== b.x) {
                    return a.x - b.x;
                }

                return depthA - depthB;
            });

            if (candidates.length <= 0) {
                return null;
            }

            const currentIndex = candidates.findIndex(function (enemy) {
                return getEnemyTargetId(enemy) === currentTargetId;
            });
            const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % candidates.length;

            return getEnemyTargetId(candidates[nextIndex]);
        }

        getDefaultTargetId(player, cameraX, canvasWidth) {
            const candidates = this.getTargetableEnemies(cameraX, canvasWidth);

            if (candidates.length <= 0) {
                return null;
            }

            const origin = player && player.getMuzzlePoint ? player.getMuzzlePoint() : {
                x: player ? player.x : cameraX + canvasWidth / 2,
                y: player ? player.y : this.groundY
            };
            const aimDirection = player && player.direction < 0 ? -1 : 1;
            let best = null;
            let bestScore = Infinity;

            candidates.forEach(function (enemy) {
                const bounds = getEnemyVisualBounds(enemy);
                const center = getRectCenter(bounds);
                const dx = center.x - origin.x;
                const dy = center.y - origin.y;
                const distance = Math.hypot(dx, dy);
                const behindPenalty = distance > 0 && dx / distance * aimDirection < 0 ? 900 : 0;
                const score = distance + behindPenalty + Math.abs(dy) * 0.35;

                if (score < bestScore) {
                    best = enemy;
                    bestScore = score;
                }
            });

            return getEnemyTargetId(best);
        }

        updateWaveEntryQueue(deltaTime) {
            this.waveEntryQueue.forEach(function (entry) {
                entry.delay -= deltaTime / 1000;
            });

            const readyEntries = this.waveEntryQueue.filter(function (entry) {
                return entry.delay <= 0;
            });

            this.waveEntryQueue = this.waveEntryQueue.filter(function (entry) {
                return entry.delay > 0;
            });

            readyEntries.forEach((entry) => {
                const enemy = this.createEnemy(entry.spawn, entry.index);

                if (enemy) {
                    this.enemies.push(enemy);
                } else {
                    this.defeatedEnemies++;
                }
            });
        }

        queueNextWave(player) {
            const wave = this.waveDefinitions[this.waveCursor] || [];
            const isFinalWave = this.waveCursor === this.waveDefinitions.length - 1;
            const entryStagger = isFinalWave ? FINAL_WAVE_ENTRY_STAGGER : WAVE_ENTRY_STAGGER;

            if (wave.length <= 0) {
                this.waveCursor++;
                return;
            }

            this.currentWave++;
            this.waveCursor++;

            let fragmentCount = 0;
            let parasiteCount = 0;

            for (let index = 0; index < wave.length; index++) {
                const spawn = this.prepareWaveSpawn(wave[index], index, fragmentCount, parasiteCount, player);
                const globalIndex = this.currentWave * 100 + index;
                let delay = index * entryStagger;

                if (spawn.type === ENEMY_TYPE.FRAGMENT) {
                    delay = Math.max(delay, 0.5 + fragmentCount * FRAGMENT_ENTRY_STAGGER);
                    fragmentCount++;
                } else if (spawn.type === ENEMY_TYPE.PARASITE) {
                    delay = Math.max(delay, 0.8 + parasiteCount * PARASITE_ENTRY_STAGGER);
                    parasiteCount++;
                }

                // Cada entrada usa deltaTime no controlador, sem temporizadores externos.
                this.waveEntryQueue.push({
                    spawn: spawn,
                    index: globalIndex,
                    delay: delay
                });
            }
        }

        prepareWaveSpawn(sourceSpawn, index, fragmentIndex, parasiteIndex, player) {
            const spawn = cloneSpawn(sourceSpawn, ENEMY_TYPE.DRONE);
            const entryPlan = this.getRightEntryPlan(spawn.type, player, index);

            spawn.phaseLength = this.phaseLength;
            spawn.groundY = this.groundY;
            spawn.walkableTop = this.walkableTop;
            spawn.walkableBottom = this.walkableBottom;
            spawn.feetY = clamp(typeof spawn.feetY === 'number' ? spawn.feetY : this.groundY, this.walkableTop, this.walkableBottom);
            spawn.entryTargetX = entryPlan.targetX;
            spawn.entrySpeed = SOLO_ENCOUNTER_ENTRY_SPEED;

            if (spawn.type === ENEMY_TYPE.FRAGMENT) {
                spawn.x = entryPlan.startX;
                spawn.feetY = this.getEntryFeetY(fragmentIndex);
                return spawn;
            }

            if (spawn.type === ENEMY_TYPE.PARASITE) {
                spawn.x = entryPlan.startX;
                spawn.feetY = this.getEntryFeetY(parasiteIndex + 2);
                return spawn;
            }

            spawn.centerX = entryPlan.startX;
            spawn.x = entryPlan.startX - 360;
            spawn.y += index % 2 === 0 ? -42 : 72;
            return spawn;
        }

        createEnemy(spawn, index) {
            if (spawn.type === ENEMY_TYPE.FRAGMENT) {
                if (!this.fragmentVisualsReady || !fragmentVisualsReady()) {
                    console.warn('Corrupted Fragment nao criado porque a spritesheet nao carregou:', FRAGMENT_SPRITESHEET_SRC);
                    return null;
                }

                return this.configureSpawnEntry(new CorruptedFragment(spawn, this.effects, index), spawn);
            }

            if (spawn.type === ENEMY_TYPE.PARASITE) {
                if (!this.parasiteVisualsReady || !parasiteVisualsReady()) {
                    console.warn('Digital Parasite nao criado porque a spritesheet nao carregou:', PARASITE_SPRITESHEET_SRC);
                    return null;
                }

                return this.configureSpawnEntry(new DigitalParasite(spawn, this.effects, index), spawn);
            }

            return this.configureSpawnEntry(new Enemy(spawn, this.effects, index), spawn);
        }

        render(ctx, cameraX) {
            if (!this.visualsReady || !droneVisualsReady()) {
                return;
            }

            const debugPlayer = this.debugPlayer;

            this.enemies.slice().sort(function (a, b) {
                const depthA = a.getDepthY ? a.getDepthY() : a.y;
                const depthB = b.getDepthY ? b.getDepthY() : b.y;

                return depthA - depthB;
            }).forEach(function (enemy) {
                enemy.render(ctx, cameraX, debugPlayer);
            });

            this.renderSoloEncounter(ctx, cameraX);
        }

        renderSoloEncounter(ctx, cameraX) {
            const solo = this.soloEncounter;

            if (!solo.active || !solo.enemy || solo.state !== SOLO_ENCOUNTER_STATE.INTRO) {
                return;
            }

            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = '13px monospace';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
            ctx.fillRect(this.canvasWidth / 2 - 150, 94, 300, 54);
            ctx.fillStyle = '#ff2eb4';
            ctx.fillText('AMEAÇA DETECTADA', this.canvasWidth / 2, 114);
            ctx.fillStyle = '#ffffff';
            ctx.font = '15px monospace';
            ctx.fillText(getEnemyDisplayName(solo.enemyType), this.canvasWidth / 2, 136);
            ctx.restore();
        }

        getAliveEnemies() {
            return this.enemies.filter(function (enemy) {
                return !enemy.removed;
            });
        }

        getEnemiesLeftCount() {
            return this.totalEnemiesInPhase - this.defeatedEnemies;
        }

        isCleared() {
            return this.waveCursor >= this.waveDefinitions.length &&
                this.waveEntryQueue.length === 0 &&
                this.getAliveEnemies().length === 0;
        }
    }

    game.rectsOverlap = rectsOverlap;
    game.DRONE_SENTINEL_VISUAL = DRONE_ANIMATIONS;
    game.CORRUPTED_FRAGMENT_VISUAL = FRAGMENT_ANIMATIONS;
    game.DIGITAL_PARASITE_VISUAL = PARASITE_ANIMATIONS;
    game.ENEMY_VISUAL = DRONE_ANIMATIONS;
    game.ENEMY_TYPE = ENEMY_TYPE;
    game.getEnemyTargetId = getEnemyTargetId;
    game.isEnemySelectableTarget = enemyInSelectableState;
    game.Enemy = Enemy;
    game.CorruptedFragment = CorruptedFragment;
    game.DigitalParasite = DigitalParasite;
    game.EnemySystem = EnemySystem;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
