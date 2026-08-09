(function (game) {
    'use strict';

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function rectsOverlap(a, b) {
        const overlap = game.rectsOverlap || function (rectA, rectB) {
            return rectA.x < rectB.x + rectB.width &&
                rectA.x + rectA.width > rectB.x &&
                rectA.y < rectB.y + rectB.height &&
                rectA.y + rectA.height > rectB.y;
        };

        return overlap(a, b);
    }

    function getRectCenter(rect) {
        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
        };
    }

    function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    function imageReady(image) {
        return image && !image.failed && image.complete && image.naturalWidth > 0;
    }

    function getPlayerFeetY(player) {
        return player && typeof player.y === 'number' ? player.y : player && player.getFeetY ? player.getFeetY() : game.GROUND_Y;
    }

    function getAnimationFrameCount(animation) {
        return Array.isArray(animation.frames) ? animation.frames.length : animation.frames || 1;
    }

    const DEBUG_NULL_WARDEN = false;
    const DEBUG_NULL_WARDEN_DRAW = false;
    const DEBUG_NULL_WARDEN_WALK_FRAME = false;
    let nullWardenDrawsThisFrame = 0;

    function resetNullWardenDrawCounter() {
        nullWardenDrawsThisFrame = 0;
    }

    function countNullWardenBodyDraw() {
        nullWardenDrawsThisFrame++;

        if (nullWardenDrawsThisFrame > 1) {
            console.error('Null Warden desenhado mais de uma vez no mesmo frame');
            return false;
        }

        if (DEBUG_NULL_WARDEN_DRAW) {
            console.log('Null Warden draws this frame:', nullWardenDrawsThisFrame);
        }

        return true;
    }

    function getNullWardenDrawCount() {
        return nullWardenDrawsThisFrame;
    }

    const NULL_WARDEN_ASSET_SRC_PREFIX = 'images/void-runner/';
    const NULL_WARDEN_FRAMES_PATH = 'img-assets-vilo/null-warden-fixed-complete/null-warden-fixed/frames';
    const NULL_WARDEN_WALK_SHEET_PATH = `${NULL_WARDEN_FRAMES_PATH}/movement/preview-all-frames.png`;
    const NULL_WARDEN_WALK_SHEET_WIDTH = 2048;
    const NULL_WARDEN_WALK_SHEET_HEIGHT = 1536;
    const NULL_WARDEN_WALK_COLUMNS = 4;
    const NULL_WARDEN_WALK_FRAME_WIDTH = 512;
    const NULL_WARDEN_WALK_FRAME_HEIGHT = 512;
    const NULL_WARDEN_WALK_TOTAL_FRAMES = 12;
    const NULL_WARDEN_WALK_FRAME_DURATION = 0.11;
    const NULL_WARDEN_DRAW_WIDTH = 220;
    const NULL_WARDEN_DRAW_HEIGHT = 220;
    const NULL_WARDEN_MAX_HP = 600;
    const NULL_WARDEN_FLOW = {
        INACTIVE: 'INACTIVE',
        WARNING: 'BOSS_WARNING',
        ENTRANCE: 'BOSS_ENTRANCE',
        COMBAT: 'BOSS_COMBAT',
        DEFEATED: 'BOSS_DEFEATED',
        COMPLETE: 'BOSS_COMPLETE'
    };
    const NULL_WARDEN_STATE = {
        ENTERING_WALK: 'ENTERING_WALK',
        IDLE: 'IDLE',
        CHASE: 'CHASE',
        BLADE_WINDUP: 'BLADE_WINDUP',
        BLADE_ACTIVE: 'BLADE_ACTIVE',
        BLADE_RECOVERY: 'BLADE_RECOVERY',
        PROJECTILE_WINDUP: 'PROJECTILE_WINDUP',
        PROJECTILE_RELEASE: 'PROJECTILE_RELEASE',
        PROJECTILE_RECOVERY: 'PROJECTILE_RECOVERY',
        DASH_WINDUP: 'DASH_WINDUP',
        DASH_ACTIVE: 'DASH_ACTIVE',
        DASH_RECOVERY: 'DASH_RECOVERY',
        PHASE_TRANSITION: 'PHASE_TRANSITION',
        SPECIAL_WINDUP: 'SPECIAL_WINDUP',
        SPECIAL_ACTIVE: 'SPECIAL_ACTIVE',
        SPECIAL_RECOVERY: 'SPECIAL_RECOVERY',
        HIT: 'HIT',
        DEATH: 'DEATH'
    };
    const NULL_WARDEN_ATTACK = {
        BLADE: 'blade',
        PROJECTILE: 'projectile',
        DASH: 'dash',
        SPECIAL: 'special'
    };
    const NULL_WARDEN_CONFIG = {
        maxHp: NULL_WARDEN_MAX_HP,
        hp: NULL_WARDEN_MAX_HP,
        moveSpeed: 75,
        depthSpeed: 52,
        preferredCombatDistance: 118,
        entrySpeed: 110,
        entryMaximumDuration: 5,
        contactDamage: 12,
        blade: {
            damage: 16,
            windup: 0.22,
            active: 0.12,
            recovery: 0.38,
            cooldown: 1.2
        },
        projectile: {
            damage: 10,
            projectileSpeed: 240,
            turnSpeed: 2.35,
            windup: 0.36,
            release: 0.10,
            recovery: 0.34,
            cooldown: 1.8
        },
        dash: {
            damage: 18,
            dashSpeed: 360,
            windup: 0.30,
            active: 0.18,
            recovery: 0.45,
            cooldown: 2.2
        },
        special: {
            damage: 20,
            windup: 0.55,
            active: 0.16,
            recovery: 0.65,
            cooldown: 4.5
        }
    };
    const NULL_WARDEN_ANIMATIONS = {
        idle: { frames: 4, fps: 6, loop: true },
        walk: { frames: NULL_WARDEN_WALK_TOTAL_FRAMES, fps: 1 / NULL_WARDEN_WALK_FRAME_DURATION, loop: true },
        blade: { frames: 4, fps: 10, loop: false },
        projectile: { frames: 4, fps: 10, loop: false },
        dash: { frames: 4, fps: 10, loop: false },
        transformation: { frames: 4, fps: 5, loop: false },
        special: { frames: 4, fps: 9, loop: false },
        hit: { frames: 2, fps: 12, loop: false },
        death: { frames: 8, fps: 7, loop: false }
    };
    const NULL_WARDEN_FRAME_PATHS = {
        idle: [
            `${NULL_WARDEN_FRAMES_PATH}/movement/null-warden-movement-01.png`,
            `${NULL_WARDEN_FRAMES_PATH}/movement/null-warden-movement-02.png`,
            `${NULL_WARDEN_FRAMES_PATH}/movement/null-warden-movement-03.png`,
            `${NULL_WARDEN_FRAMES_PATH}/movement/null-warden-movement-04.png`
        ],
        walk: [],
        blade: [
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-01.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-02.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-03.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-04.png`
        ],
        projectile: [
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-05.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-06.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-07.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-08.png`
        ],
        dash: [
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-09.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-10.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-11.png`,
            `${NULL_WARDEN_FRAMES_PATH}/attacks/null-warden-attacks-12.png`
        ],
        transformation: [
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-01.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-02.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-03.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-04.png`
        ],
        special: [
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-05.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-06.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-07.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-08.png`
        ],
        hit: [
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-09.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-10.png`
        ],
        death: [
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-11.png`,
            `${NULL_WARDEN_FRAMES_PATH}/special/null-warden-special-12.png`,
            `${NULL_WARDEN_FRAMES_PATH}/death/null-warden-death-01.png`,
            `${NULL_WARDEN_FRAMES_PATH}/death/null-warden-death-02.png`,
            `${NULL_WARDEN_FRAMES_PATH}/death/null-warden-death-03.png`,
            `${NULL_WARDEN_FRAMES_PATH}/death/null-warden-death-04.png`,
            `${NULL_WARDEN_FRAMES_PATH}/death/null-warden-death-05.png`,
            `${NULL_WARDEN_FRAMES_PATH}/death/null-warden-death-06.png`
        ]
    };
    const nullWardenAnimations = {
        idle: [],
        walk: [],
        blade: [],
        projectile: [],
        dash: [],
        transformation: [],
        special: [],
        hit: [],
        death: []
    };
    let nullWardenPreloadPromise = null;
    let nullWardenFramesReady = false;
    let nullWardenFailedFramePaths = [];
    const nullWardenVideoWalkSheet = new Image();
    let nullWardenVideoWalkSheetLoadStarted = false;
    let nullWardenVideoWalkSheetReady = false;

    function getNullWardenFrameSrc(path) {
        return NULL_WARDEN_ASSET_SRC_PREFIX + path;
    }

    function preloadNullWardenFrames() {
        if (nullWardenPreloadPromise) {
            return nullWardenPreloadPromise;
        }

        const walkSheetPromise = new Promise(function (resolve) {
            const src = getNullWardenFrameSrc(NULL_WARDEN_WALK_SHEET_PATH);

            nullWardenVideoWalkSheet.failed = false;
            nullWardenVideoWalkSheet.nullWardenFrameSrc = src;
            nullWardenVideoWalkSheet.onload = function () {
                console.log('Null Warden video walk:', nullWardenVideoWalkSheet.naturalWidth, nullWardenVideoWalkSheet.naturalHeight);

                nullWardenVideoWalkSheetReady =
                    nullWardenVideoWalkSheet.naturalWidth === NULL_WARDEN_WALK_SHEET_WIDTH &&
                    nullWardenVideoWalkSheet.naturalHeight === NULL_WARDEN_WALK_SHEET_HEIGHT;

                if (!nullWardenVideoWalkSheetReady) {
                    console.error('Null Warden video walk com dimensoes invalidas:', src, nullWardenVideoWalkSheet.naturalWidth, nullWardenVideoWalkSheet.naturalHeight);
                }

                resolve(nullWardenVideoWalkSheetReady);
            };
            nullWardenVideoWalkSheet.onerror = function () {
                nullWardenVideoWalkSheet.failed = true;
                nullWardenVideoWalkSheetReady = false;
                console.error('Null Warden video walk nao carregou:', src);
                resolve(false);
            };

            if (!nullWardenVideoWalkSheetLoadStarted) {
                nullWardenVideoWalkSheetLoadStarted = true;
                nullWardenVideoWalkSheet.src = src;
            } else {
                resolve(nullWardenVideoWalkSheetReady);
            }
        });

        const frameGroupsPromise = Promise.all(Object.keys(NULL_WARDEN_FRAME_PATHS).map(function (key) {
            const paths = NULL_WARDEN_FRAME_PATHS[key];

            return Promise.all(paths.map(function (path) {
                const src = getNullWardenFrameSrc(path);

                return new Promise(function (resolve) {
                    const image = new Image();

                    image.failed = false;
                    image.nullWardenFrameSrc = src;
                    image.onload = function () {
                        if (image.naturalWidth !== 512 || image.naturalHeight !== 512) {
                            console.warn('Frame do Null Warden com dimensoes inesperadas:', src, image.naturalWidth, image.naturalHeight);
                        }

                        resolve({ key: key, image: image, ok: imageReady(image), src: src });
                    };
                    image.onerror = function () {
                        image.failed = true;
                        console.error('Frame do Null Warden nao carregou:', src);
                        resolve({ key: key, image: image, ok: false, src: src });
                    };
                    image.src = src;
                });
            })).then(function (results) {
                nullWardenAnimations[key] = results.map(function (result) {
                    return result.image;
                });

                return results.every(function (result) {
                    return result.ok;
                });
            });
        }));

        nullWardenPreloadPromise = Promise.all([frameGroupsPromise, walkSheetPromise]).then(function (results) {
            const groupsReady = results[0];
            const walkSheetReady = results[1];

            nullWardenFailedFramePaths = [];

            Object.keys(NULL_WARDEN_FRAME_PATHS).forEach(function (key) {
                nullWardenAnimations[key].forEach(function (image) {
                    if (!imageReady(image)) {
                        nullWardenFailedFramePaths.push(image.nullWardenFrameSrc || image.src);
                    }
                });
            });

            if (!walkSheetReady) {
                nullWardenFailedFramePaths.push(nullWardenVideoWalkSheet.nullWardenFrameSrc || getNullWardenFrameSrc(NULL_WARDEN_WALK_SHEET_PATH));
            }

            nullWardenFramesReady = walkSheetReady &&
                groupsReady.every(Boolean) &&
                Object.keys(NULL_WARDEN_FRAME_PATHS).every(function (key) {
                    return nullWardenAnimations[key].length === NULL_WARDEN_FRAME_PATHS[key].length &&
                        nullWardenAnimations[key].every(imageReady);
                });

            if (!nullWardenFramesReady) {
                console.error('Null Warden nao sera iniciado. Frames ausentes ou invalidos:', nullWardenFailedFramePaths);
            }

            return nullWardenFramesReady;
        });

        return nullWardenPreloadPromise;
    }

    function nullWardenVisualsReady() {
        return nullWardenFramesReady &&
            nullWardenVideoWalkSheetReady &&
            imageReady(nullWardenVideoWalkSheet) &&
            Object.keys(NULL_WARDEN_FRAME_PATHS).every(function (key) {
                return nullWardenAnimations[key].every(imageReady);
            });
    }

    class NullWardenProjectile {
        constructor(x, y, direction, target) {
            const speed = NULL_WARDEN_CONFIG.projectile.projectileSpeed;
            const targetCenter = target && target.getBodyHitbox ? getRectCenter(target.getBodyHitbox()) : { x: x + direction, y: y };
            const dx = targetCenter.x - x;
            const dy = targetCenter.y - y;
            const distance = Math.hypot(dx, dy) || 1;

            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 24;
            this.speed = speed;
            this.turnSpeed = NULL_WARDEN_CONFIG.projectile.turnSpeed;
            this.velocityX = dx / distance * speed;
            this.velocityY = dy / distance * speed;
            this.direction = direction;
            this.damage = NULL_WARDEN_CONFIG.projectile.damage;
            this.age = 0;
            this.lifetime = 4.4;
            this.alive = true;
            this.hasHit = false;
        }

        update(player, deltaTime, cameraX, canvasWidth, phaseLength, now) {
            if (!this.alive) {
                return;
            }

            const delta = deltaTime / 1000;

            this.age += delta;

            if (this.age >= this.lifetime || !player || player.isDead) {
                this.alive = false;
                return;
            }

            this.updateHoming(player, delta);
            this.x += this.velocityX * delta;
            this.y += this.velocityY * delta;
            this.direction = this.velocityX >= 0 ? 1 : -1;

            if (!this.hasHit && rectsOverlap(this.getHitbox(), player.getBodyHitbox())) {
                this.hasHit = true;
                this.alive = false;
                player.takeDamage(this.damage, now);
            }

            if (this.x < cameraX - 180 ||
                this.x > cameraX + canvasWidth + 180 ||
                this.x < -140 ||
                this.x > phaseLength + 140 ||
                this.y < -120 ||
                this.y > 620) {
                this.alive = false;
            }
        }

        updateHoming(player, delta) {
            const targetCenter = getRectCenter(player.getBodyHitbox());
            const projectileCenter = getRectCenter(this.getHitbox());
            const dx = targetCenter.x - projectileCenter.x;
            const dy = targetCenter.y - projectileCenter.y;
            const distance = Math.hypot(dx, dy);

            if (distance <= 0) {
                return;
            }

            const desiredAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.velocityY, this.velocityX);
            const angleDifference = normalizeAngle(desiredAngle - currentAngle);
            const newAngle = currentAngle + clamp(angleDifference, -this.turnSpeed * delta, this.turnSpeed * delta);

            this.velocityX = Math.cos(newAngle) * this.speed;
            this.velocityY = Math.sin(newAngle) * this.speed;
        }

        getHitbox() {
            return {
                x: this.x - this.width / 2,
                y: this.y - this.height / 2,
                width: this.width,
                height: this.height
            };
        }

        render(ctx, cameraX) {
            if (!this.alive) {
                return;
            }

            const angle = Math.atan2(this.velocityY, this.velocityX);
            const alpha = clamp(1 - Math.max(0, this.age - 3.6) / 0.8, 0, 1);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(this.x - cameraX, this.y);
            ctx.rotate(angle);
            ctx.fillStyle = '#8a2be2';
            ctx.shadowColor = '#ff2eb4';
            ctx.shadowBlur = 12;
            ctx.fillRect(-16, -7, 32, 14);
            ctx.fillStyle = '#ff2eb4';
            ctx.fillRect(4, -4, 14, 8);
            ctx.restore();
        }
    }

    class NullWardenBoss {
        constructor(spawn) {
            this.enemyType = 'nullWardenBoss';
            this.targetId = 'boss-null-warden';
            this.name = 'NULL WARDEN';
            this.subtitle = 'GUARDIAO DA ANOMALIA';
            this.width = NULL_WARDEN_DRAW_WIDTH;
            this.height = NULL_WARDEN_DRAW_HEIGHT;
            this.drawWidth = this.width;
            this.drawHeight = this.height;
            this.maxHealth = NULL_WARDEN_CONFIG.maxHp;
            this.health = NULL_WARDEN_CONFIG.hp;
            this.displayedHealth = this.health;
            this.moveSpeed = NULL_WARDEN_CONFIG.moveSpeed;
            this.depthSpeed = NULL_WARDEN_CONFIG.depthSpeed;
            this.phase = 1;
            this.phaseTransitionCompleted = false;
            this.pendingPhaseTransition = false;
            this.phaseLength = spawn.phaseLength;
            this.walkableTop = spawn.walkableTop;
            this.walkableBottom = spawn.walkableBottom;
            this.x = spawn.startX;
            this.feetY = clamp(spawn.feetY, this.walkableTop, this.walkableBottom);
            this.entryTargetX = spawn.targetX;
            this.entrySpeed = NULL_WARDEN_CONFIG.entrySpeed;
            this.entryTimer = 0;
            this.entryMaximumDuration = NULL_WARDEN_CONFIG.entryMaximumDuration;
            this.y = this.feetY - this.height;
            this.direction = -1;
            this.state = NULL_WARDEN_STATE.ENTERING_WALK;
            this.alive = true;
            this.removed = false;
            this.invulnerable = true;
            this.damageInvulnerableUntil = 0;
            this.hitFlashUntil = 0;
            this.hitResistUntil = 0;
            this.currentFrame = 0;
            this.animationFrame = 0;
            this.frameTimer = 0;
            this.animationTimer = 0;
            this.animationFinished = false;
            this.walkFrame = 0;
            this.walkTimer = 0;
            this.walkAnimationActive = true;
            this.lastLoggedWalkFrame = -1;
            this.stateTimer = 0;
            this.idleTimer = 0;
            this.globalCooldown = 0.7;
            this.attackCooldown = 0.4;
            this.projectileCooldown = 1.0;
            this.dashCooldown = 0;
            this.specialCooldown = 1.2;
            this.cooldowns = {
                blade: this.attackCooldown,
                projectile: this.projectileCooldown,
                dash: this.dashCooldown,
                special: this.specialCooldown
            };
            this.lastAttack = null;
            this.repeatAttackCount = 0;
            this.repeatedAttackCount = 0;
            this.attackHasHit = false;
            this.projectileReleased = false;
            this.attackDirection = -1;
            this.dashTargetFeetY = this.feetY;
            this.specialArea = null;
            this.specialHasHit = false;
            this.deathComplete = false;
            this.deathHoldTimer = 0;
            this.deathFadeTimer = 0;
            this.deathAlpha = 1;
            this.screenShakeTimer = 0;
        }

        getDepthY() {
            return this.feetY;
        }

        getBodyBounds() {
            return {
                x: this.x - this.width / 2,
                y: this.feetY - this.height,
                width: this.width,
                height: this.height
            };
        }

        getVisualBounds() {
            const bounds = this.getBodyBounds();

            return {
                x: bounds.x + this.width * 0.12,
                y: bounds.y + this.height * 0.08,
                width: this.width * 0.76,
                height: this.height * 0.88
            };
        }

        getHitbox() {
            return {
                x: this.x - this.width * 0.25,
                y: this.feetY - this.height * 0.80,
                width: this.width * 0.50,
                height: this.height * 0.72
            };
        }

        getImpactPoint() {
            const hitbox = this.getHitbox();

            return {
                x: hitbox.x + hitbox.width / 2,
                y: hitbox.y + hitbox.height * 0.45
            };
        }

        isTargetable() {
            return this.alive &&
                !this.removed &&
                this.health > 0 &&
                this.state !== NULL_WARDEN_STATE.ENTERING_WALK &&
                this.state !== NULL_WARDEN_STATE.PHASE_TRANSITION &&
                this.state !== NULL_WARDEN_STATE.DEATH;
        }

        canTakeDamage() {
            return this.isTargetable() &&
                !this.invulnerable &&
                this.state !== NULL_WARDEN_STATE.PHASE_TRANSITION;
        }

        takeDamage(amount, options) {
            const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
            const source = options && options.source;

            if (this.state === NULL_WARDEN_STATE.DEATH || this.deathComplete) {
                return false;
            }

            if (source === 'trixUltimate') {
                if (this.state === NULL_WARDEN_STATE.PHASE_TRANSITION) {
                    return false;
                }

                this.health = Math.max(1, this.health - Math.max(0, amount));
                this.hitFlashUntil = now + 180;
                this.checkPhaseTransition();
                return false;
            }

            if (!this.canTakeDamage() || now < this.damageInvulnerableUntil) {
                return false;
            }

            this.health = Math.max(0, this.health - Math.max(0, amount));
            this.hitFlashUntil = now + 160;
            this.damageInvulnerableUntil = now + 110;

            if (this.health <= 0) {
                this.startDeath();
                return true;
            }

            this.checkPhaseTransition();

            if (amount >= 18 && now >= this.hitResistUntil && !this.isOffensiveState()) {
                this.hitResistUntil = now + 850;
                this.changeState(NULL_WARDEN_STATE.HIT, true);
            }

            return false;
        }

        checkPhaseTransition() {
            if (!this.phaseTransitionCompleted && this.health <= this.maxHealth * 0.5 && this.health > 0) {
                this.pendingPhaseTransition = true;
            }
        }

        startDeath() {
            if (this.state === NULL_WARDEN_STATE.DEATH) {
                return;
            }

            this.health = 0;
            this.alive = false;
            this.invulnerable = true;
            this.pendingPhaseTransition = false;
            this.specialArea = null;
            this.attackHasHit = true;
            this.specialHasHit = true;
            this.projectileReleased = true;
            this.changeState(NULL_WARDEN_STATE.DEATH, true);
        }

        update(player, deltaTime, now, projectiles) {
            if (this.removed) {
                return;
            }

            const delta = deltaTime / 1000;

            this.displayedHealth += (this.health - this.displayedHealth) * Math.min(1, delta * 7);
            this.globalCooldown = Math.max(0, this.globalCooldown - delta);
            this.attackCooldown = Math.max(0, this.attackCooldown - delta);
            this.projectileCooldown = Math.max(0, this.projectileCooldown - delta);
            this.dashCooldown = Math.max(0, this.dashCooldown - delta);
            this.specialCooldown = Math.max(0, this.specialCooldown - delta);
            Object.keys(this.cooldowns).forEach((key) => {
                this.cooldowns[key] = Math.max(0, this.cooldowns[key] - delta);
            });
            this.cooldowns.blade = this.attackCooldown;
            this.cooldowns.projectile = this.projectileCooldown;
            this.cooldowns.dash = this.dashCooldown;
            this.cooldowns.special = this.specialCooldown;

            if ((!Number.isFinite(this.x) || !Number.isFinite(this.feetY)) && !this.reportedInvalidPosition) {
                this.reportedInvalidPosition = true;
                console.error('Posicao invalida do Null Warden', this);
            }

            if (this.state === NULL_WARDEN_STATE.DEATH) {
                this.updateDeath(deltaTime);
                return;
            }

            if (!player || player.isDead) {
                this.updateAnimation(deltaTime);
                return;
            }

            this.updateFacing(player);

            if (this.state === NULL_WARDEN_STATE.ENTERING_WALK) {
                this.walkAnimationActive = true;
                this.updateEntrance(deltaTime);
                return;
            }

            if (this.pendingPhaseTransition && !this.isOffensiveState()) {
                this.startPhaseTransition();
                return;
            }

            if (this.state === NULL_WARDEN_STATE.PHASE_TRANSITION) {
                this.updatePhaseTransition(deltaTime);
                return;
            }

            if (this.state === NULL_WARDEN_STATE.HIT) {
                this.updateAnimation(deltaTime);

                if (this.animationFinished) {
                    this.changeState(NULL_WARDEN_STATE.CHASE, true);
                }

                return;
            }

            if (this.updateAttack(player, deltaTime, now, projectiles)) {
                return;
            }

            this.updateChaseAndDecision(player, deltaTime);
        }

        updateEntrance(deltaTime) {
            const delta = deltaTime / 1000;

            this.invulnerable = true;
            this.entryTimer += delta;
            this.x -= this.entrySpeed * delta;
            this.syncY();
            this.updateAnimation('walk', deltaTime);

            if (this.x <= this.entryTargetX || this.entryTimer >= this.entryMaximumDuration) {
                this.x = this.entryTargetX;
                this.invulnerable = false;
                this.changeState(NULL_WARDEN_STATE.CHASE, true);
            }
        }

        updatePhaseTransition(deltaTime) {
            this.invulnerable = true;
            this.screenShakeTimer = Math.max(this.screenShakeTimer, 0.18);
            this.updateAnimation(deltaTime);

            if (this.animationFinished) {
                this.phase = 2;
                this.phaseTransitionCompleted = true;
                this.pendingPhaseTransition = false;
                this.invulnerable = false;
                this.globalCooldown = 0.65;
                this.changeState(NULL_WARDEN_STATE.CHASE, true);
            }
        }

        startPhaseTransition() {
            this.pendingPhaseTransition = false;
            this.invulnerable = true;
            this.specialArea = null;
            this.attackHasHit = true;
            this.specialHasHit = true;
            this.projectileReleased = true;
            this.screenShakeTimer = 0.75;
            this.changeState(NULL_WARDEN_STATE.PHASE_TRANSITION, true);
        }

        updateAttack(player, deltaTime, now, projectiles) {
            const delta = deltaTime / 1000;

            if (this.state === NULL_WARDEN_STATE.BLADE_WINDUP) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 0;

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.BLADE_ACTIVE, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.BLADE_ACTIVE) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 2;
                this.tryDamagePlayer(player, this.getBladeHitbox(), NULL_WARDEN_CONFIG.blade.damage, now, 'blade');

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.BLADE_RECOVERY, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.BLADE_RECOVERY) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 3;

                if (this.stateTimer <= 0) {
                    this.finishAttack(NULL_WARDEN_ATTACK.BLADE);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.PROJECTILE_WINDUP) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = this.stateTimer < NULL_WARDEN_CONFIG.projectile.windup * 0.45 ? 1 : 0;

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.PROJECTILE_RELEASE, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.PROJECTILE_RELEASE) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 2;

                if (!this.projectileReleased) {
                    this.projectileReleased = true;
                    this.releaseProjectile(player, projectiles);
                }

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.PROJECTILE_RECOVERY, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.PROJECTILE_RECOVERY) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 3;

                if (this.stateTimer <= 0) {
                    this.finishAttack(NULL_WARDEN_ATTACK.PROJECTILE);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.DASH_WINDUP) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 0;

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.DASH_ACTIVE, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.DASH_ACTIVE) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 2;
                this.x += this.attackDirection * NULL_WARDEN_CONFIG.dash.dashSpeed * delta;
                this.feetY += clamp(this.dashTargetFeetY - this.feetY, -this.depthSpeed * 0.45 * delta, this.depthSpeed * 0.45 * delta);
                this.x = clamp(this.x, this.width * 0.42, this.phaseLength - this.width * 0.42);
                this.syncY();
                this.tryDamagePlayer(player, this.getDashHitbox(), NULL_WARDEN_CONFIG.dash.damage, now, 'dash');

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.DASH_RECOVERY, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.DASH_RECOVERY) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 3;

                if (this.stateTimer <= 0) {
                    this.finishAttack(NULL_WARDEN_ATTACK.DASH);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.SPECIAL_WINDUP) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = this.stateTimer < NULL_WARDEN_CONFIG.special.windup * 0.45 ? 1 : 0;

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.SPECIAL_ACTIVE, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.SPECIAL_ACTIVE) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 2;
                this.trySpecialDamage(player, now);

                if (this.stateTimer <= 0) {
                    this.changeState(NULL_WARDEN_STATE.SPECIAL_RECOVERY, true);
                }

                return true;
            }

            if (this.state === NULL_WARDEN_STATE.SPECIAL_RECOVERY) {
                this.stateTimer = Math.max(0, this.stateTimer - delta);
                this.currentFrame = 3;

                if (this.stateTimer <= 0) {
                    this.specialArea = null;
                    this.finishAttack(NULL_WARDEN_ATTACK.SPECIAL);
                }

                return true;
            }

            return false;
        }

        updateChaseAndDecision(player, deltaTime) {
            const delta = deltaTime / 1000;
            const playerHitbox = player.getBodyHitbox();
            const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
            const dx = playerCenterX - this.x;
            const targetFeetY = clamp(getPlayerFeetY(player), this.walkableTop, this.walkableBottom);
            const dy = targetFeetY - this.feetY;
            const distance = Math.hypot(dx, dy);
            const distanceX = Math.abs(dx);
            const distanceY = Math.abs(dy);
            const desiredGap = NULL_WARDEN_CONFIG.preferredCombatDistance;
            const previousX = this.x;
            const previousFeetY = this.feetY;
            const wasWalking = this.walkAnimationActive;

            if (this.globalCooldown <= 0) {
                const attack = this.chooseAttack(distanceX, distanceY);

                if (attack) {
                    this.startAttack(attack, player);
                    return;
                }
            }

            if (distance > desiredGap && distance > 0) {
                this.x += dx / distance * this.moveSpeed * delta;
                this.feetY += dy / distance * this.depthSpeed * delta;
            }

            this.x = clamp(this.x, this.width * 0.42, this.phaseLength - this.width * 0.42);
            this.syncY();
            const moved = Math.hypot(this.x - previousX, this.feetY - previousFeetY) > 0.05;

            if (moved) {
                this.idleTimer = 0;
                this.walkAnimationActive = true;
                if (!wasWalking) {
                    this.resetNullWardenWalkAnimation();
                }
                this.changeState(NULL_WARDEN_STATE.CHASE, false);
                this.updateAnimation('walk', deltaTime);
            } else {
                this.idleTimer += delta;
                this.walkAnimationActive = false;
                this.changeState(this.idleTimer <= 0.25 ? NULL_WARDEN_STATE.IDLE : NULL_WARDEN_STATE.CHASE, false);
                this.updateAnimation('idle', deltaTime);
            }
        }

        chooseAttack(distanceX, distanceY) {
            const aligned = distanceY <= 38;
            const candidates = [];

            if (aligned && distanceX <= 150 && this.cooldowns.blade <= 0) {
                candidates.push(NULL_WARDEN_ATTACK.BLADE);
            }

            if (distanceX > 135 && distanceX <= 420 && this.cooldowns.projectile <= 0) {
                candidates.push(NULL_WARDEN_ATTACK.PROJECTILE);
            }

            if (this.phase >= 2 && distanceX > 260 && this.cooldowns.dash <= 0) {
                candidates.push(NULL_WARDEN_ATTACK.DASH);
            }

            if (this.phase >= 2 && this.cooldowns.special <= 0 && distanceX <= 360) {
                candidates.push(NULL_WARDEN_ATTACK.SPECIAL);
            }

            if (candidates.length <= 0) {
                return null;
            }

            const filtered = candidates.filter((attack) => !(attack === this.lastAttack && this.repeatAttackCount >= 2));
            const pool = filtered.length > 0 ? filtered : candidates;

            if (pool.indexOf(NULL_WARDEN_ATTACK.SPECIAL) !== -1 && this.phase >= 2) {
                return NULL_WARDEN_ATTACK.SPECIAL;
            }

            if (pool.indexOf(NULL_WARDEN_ATTACK.BLADE) !== -1) {
                return NULL_WARDEN_ATTACK.BLADE;
            }

            if (pool.indexOf(NULL_WARDEN_ATTACK.DASH) !== -1) {
                return NULL_WARDEN_ATTACK.DASH;
            }

            return pool[0];
        }

        startAttack(attack, player) {
            this.attackHasHit = false;
            this.projectileReleased = false;
            this.specialHasHit = false;
            this.updateFacing(player);
            this.attackDirection = this.direction;
            this.dashTargetFeetY = clamp(getPlayerFeetY(player), this.walkableTop, this.walkableBottom);

            if (attack === NULL_WARDEN_ATTACK.BLADE) {
                this.changeState(NULL_WARDEN_STATE.BLADE_WINDUP, true);
            } else if (attack === NULL_WARDEN_ATTACK.PROJECTILE) {
                this.changeState(NULL_WARDEN_STATE.PROJECTILE_WINDUP, true);
            } else if (attack === NULL_WARDEN_ATTACK.DASH) {
                this.changeState(NULL_WARDEN_STATE.DASH_WINDUP, true);
            } else if (attack === NULL_WARDEN_ATTACK.SPECIAL) {
                this.specialArea = this.createSpecialArea(player);
                this.changeState(NULL_WARDEN_STATE.SPECIAL_WINDUP, true);
            }
        }

        finishAttack(attack) {
            this.cooldowns[attack] = NULL_WARDEN_CONFIG[attack].cooldown;
            if (attack === NULL_WARDEN_ATTACK.BLADE) {
                this.attackCooldown = this.cooldowns[attack];
            } else if (attack === NULL_WARDEN_ATTACK.PROJECTILE) {
                this.projectileCooldown = this.cooldowns[attack];
            } else if (attack === NULL_WARDEN_ATTACK.DASH) {
                this.dashCooldown = this.cooldowns[attack];
            } else if (attack === NULL_WARDEN_ATTACK.SPECIAL) {
                this.specialCooldown = this.cooldowns[attack];
            }

            this.globalCooldown = 0.32;

            if (attack === this.lastAttack) {
                this.repeatAttackCount++;
            } else {
                this.lastAttack = attack;
                this.repeatAttackCount = 1;
            }
            this.repeatedAttackCount = this.repeatAttackCount;

            this.changeState(NULL_WARDEN_STATE.CHASE, true);
        }

        changeState(nextState, restart) {
            if (this.state === NULL_WARDEN_STATE.DEATH && nextState !== NULL_WARDEN_STATE.DEATH) {
                return;
            }

            if (!restart && this.state === nextState) {
                return;
            }

            const previousState = this.state;

            this.state = nextState;
            this.frameTimer = 0;
            this.animationTimer = 0;
            this.animationFinished = false;

            if (nextState === NULL_WARDEN_STATE.ENTERING_WALK ||
                nextState === NULL_WARDEN_STATE.CHASE && previousState !== NULL_WARDEN_STATE.CHASE) {
                this.resetNullWardenWalkAnimation();
            }

            if (DEBUG_NULL_WARDEN && previousState !== nextState) {
                console.log('[Null Warden] ' + previousState + ' -> ' + nextState);
            }

            if (nextState === NULL_WARDEN_STATE.ENTERING_WALK) {
                this.currentFrame = 0;
            } else if (nextState === NULL_WARDEN_STATE.BLADE_WINDUP) {
                this.stateTimer = NULL_WARDEN_CONFIG.blade.windup;
                this.currentFrame = 0;
            } else if (nextState === NULL_WARDEN_STATE.BLADE_ACTIVE) {
                this.stateTimer = NULL_WARDEN_CONFIG.blade.active;
                this.currentFrame = 2;
            } else if (nextState === NULL_WARDEN_STATE.BLADE_RECOVERY) {
                this.stateTimer = NULL_WARDEN_CONFIG.blade.recovery;
                this.currentFrame = 3;
            } else if (nextState === NULL_WARDEN_STATE.PROJECTILE_WINDUP) {
                this.stateTimer = NULL_WARDEN_CONFIG.projectile.windup;
                this.currentFrame = 0;
            } else if (nextState === NULL_WARDEN_STATE.PROJECTILE_RELEASE) {
                this.stateTimer = NULL_WARDEN_CONFIG.projectile.release;
                this.currentFrame = 2;
            } else if (nextState === NULL_WARDEN_STATE.PROJECTILE_RECOVERY) {
                this.stateTimer = NULL_WARDEN_CONFIG.projectile.recovery;
                this.currentFrame = 3;
            } else if (nextState === NULL_WARDEN_STATE.DASH_WINDUP) {
                this.stateTimer = NULL_WARDEN_CONFIG.dash.windup;
                this.currentFrame = 0;
            } else if (nextState === NULL_WARDEN_STATE.DASH_ACTIVE) {
                this.stateTimer = NULL_WARDEN_CONFIG.dash.active;
                this.currentFrame = 2;
            } else if (nextState === NULL_WARDEN_STATE.DASH_RECOVERY) {
                this.stateTimer = NULL_WARDEN_CONFIG.dash.recovery;
                this.currentFrame = 3;
            } else if (nextState === NULL_WARDEN_STATE.SPECIAL_WINDUP) {
                this.stateTimer = NULL_WARDEN_CONFIG.special.windup;
                this.currentFrame = 0;
            } else if (nextState === NULL_WARDEN_STATE.SPECIAL_ACTIVE) {
                this.stateTimer = NULL_WARDEN_CONFIG.special.active;
                this.currentFrame = 2;
            } else if (nextState === NULL_WARDEN_STATE.SPECIAL_RECOVERY) {
                this.stateTimer = NULL_WARDEN_CONFIG.special.recovery;
                this.currentFrame = 3;
            } else {
                this.currentFrame = 0;
            }

            this.animationFrame = this.currentFrame;
        }

        isOffensiveState() {
            return this.state === NULL_WARDEN_STATE.BLADE_WINDUP ||
                this.state === NULL_WARDEN_STATE.BLADE_ACTIVE ||
                this.state === NULL_WARDEN_STATE.BLADE_RECOVERY ||
                this.state === NULL_WARDEN_STATE.PROJECTILE_WINDUP ||
                this.state === NULL_WARDEN_STATE.PROJECTILE_RELEASE ||
                this.state === NULL_WARDEN_STATE.PROJECTILE_RECOVERY ||
                this.state === NULL_WARDEN_STATE.DASH_WINDUP ||
                this.state === NULL_WARDEN_STATE.DASH_ACTIVE ||
                this.state === NULL_WARDEN_STATE.DASH_RECOVERY ||
                this.state === NULL_WARDEN_STATE.SPECIAL_WINDUP ||
                this.state === NULL_WARDEN_STATE.SPECIAL_ACTIVE ||
                this.state === NULL_WARDEN_STATE.SPECIAL_RECOVERY;
        }

        getAnimationKey() {
            if (this.state === NULL_WARDEN_STATE.ENTERING_WALK) return 'walk';
            if (this.state === NULL_WARDEN_STATE.CHASE) return 'walk';
            if (this.state === NULL_WARDEN_STATE.BLADE_WINDUP || this.state === NULL_WARDEN_STATE.BLADE_ACTIVE || this.state === NULL_WARDEN_STATE.BLADE_RECOVERY) return 'blade';
            if (this.state === NULL_WARDEN_STATE.PROJECTILE_WINDUP || this.state === NULL_WARDEN_STATE.PROJECTILE_RELEASE || this.state === NULL_WARDEN_STATE.PROJECTILE_RECOVERY) return 'projectile';
            if (this.state === NULL_WARDEN_STATE.DASH_WINDUP || this.state === NULL_WARDEN_STATE.DASH_ACTIVE || this.state === NULL_WARDEN_STATE.DASH_RECOVERY) return 'dash';
            if (this.state === NULL_WARDEN_STATE.PHASE_TRANSITION) return 'transformation';
            if (this.state === NULL_WARDEN_STATE.SPECIAL_WINDUP || this.state === NULL_WARDEN_STATE.SPECIAL_ACTIVE || this.state === NULL_WARDEN_STATE.SPECIAL_RECOVERY) return 'special';
            if (this.state === NULL_WARDEN_STATE.HIT) return 'hit';
            if (this.state === NULL_WARDEN_STATE.DEATH) return 'death';
            return 'idle';
        }

        updateAnimation(animationKey, deltaTime) {
            if (typeof animationKey === 'number') {
                deltaTime = animationKey;
                animationKey = this.getAnimationKey();
            }

            if ((animationKey || this.getAnimationKey()) === 'walk') {
                this.updateNullWardenVideoWalk(deltaTime / 1000);
                return;
            }

            const animation = NULL_WARDEN_ANIMATIONS[animationKey || this.getAnimationKey()] || NULL_WARDEN_ANIMATIONS.idle;
            const frameDuration = 1000 / animation.fps;
            const frameCount = getAnimationFrameCount(animation);

            this.frameTimer += deltaTime;
            this.animationTimer = this.frameTimer;

            while (this.frameTimer >= frameDuration) {
                this.frameTimer -= frameDuration;
                this.animationTimer = this.frameTimer;

                if (this.currentFrame < frameCount - 1) {
                    this.currentFrame++;
                } else if (animation.loop) {
                    this.currentFrame = 0;
                } else {
                    this.animationFinished = true;
                }

                this.animationFrame = this.currentFrame;
            }
        }

        updateNullWardenVideoWalk(deltaTime) {
            this.walkTimer += deltaTime;

            while (this.walkTimer >= NULL_WARDEN_WALK_FRAME_DURATION) {
                this.walkTimer -= NULL_WARDEN_WALK_FRAME_DURATION;
                this.walkFrame = (this.walkFrame + 1) % NULL_WARDEN_WALK_TOTAL_FRAMES;
                this.currentFrame = this.walkFrame;
                this.animationFrame = this.walkFrame;
            }
        }

        resetNullWardenWalkAnimation() {
            this.walkFrame = 0;
            this.walkTimer = 0;
            this.lastLoggedWalkFrame = -1;
            this.currentFrame = 0;
            this.animationFrame = 0;
        }

        updateDeath(deltaTime) {
            if (!this.animationFinished) {
                this.updateAnimation(deltaTime);
                return;
            }

            if (this.deathHoldTimer < 0.6) {
                this.deathHoldTimer += deltaTime / 1000;
                return;
            }

            this.deathFadeTimer += deltaTime / 1000;
            this.deathAlpha = clamp(1 - this.deathFadeTimer / 0.7, 0, 1);

            if (this.deathFadeTimer >= 0.7) {
                this.deathComplete = true;
                this.removed = true;
            }
        }

        tryDamagePlayer(player, hitbox, damage, now, attackKey) {
            if (!hitbox || this.attackHasHit || !player || player.isDead) {
                return;
            }

            if (rectsOverlap(hitbox, player.getBodyHitbox())) {
                this.attackHasHit = true;
                player.takeDamage(damage, now);
            }
        }

        trySpecialDamage(player, now) {
            if (!this.specialArea || this.specialHasHit || !player || player.isDead) {
                return;
            }

            const body = player.getBodyHitbox();
            const playerFeetY = getPlayerFeetY(player);
            const inDepth = playerFeetY >= this.specialArea.y && playerFeetY <= this.specialArea.y + this.specialArea.height;

            if (inDepth && rectsOverlap(body, this.specialArea)) {
                this.specialHasHit = true;
                player.takeDamage(NULL_WARDEN_CONFIG.special.damage, now);
            }
        }

        getBladeHitbox() {
            if (this.state !== NULL_WARDEN_STATE.BLADE_ACTIVE || this.currentFrame !== 2) {
                return null;
            }

            return {
                x: this.attackDirection > 0 ? this.x + this.width * 0.02 : this.x - this.width * 0.44,
                y: this.feetY - this.height * 0.64,
                width: this.width * 0.42,
                height: this.height * 0.42
            };
        }

        getDashHitbox() {
            if (this.state !== NULL_WARDEN_STATE.DASH_ACTIVE || this.currentFrame !== 2) {
                return null;
            }

            return {
                x: this.attackDirection > 0 ? this.x - this.width * 0.08 : this.x - this.width * 0.48,
                y: this.feetY - this.height * 0.66,
                width: this.width * 0.56,
                height: this.height * 0.48
            };
        }

        createSpecialArea(player) {
            const body = player.getBodyHitbox();
            const centerX = body.x + body.width / 2;
            const feetY = getPlayerFeetY(player);

            return {
                x: clamp(centerX - 92, 30, this.phaseLength - 184),
                y: clamp(feetY - 34, this.walkableTop - 20, this.walkableBottom - 28),
                width: 184,
                height: 68
            };
        }

        releaseProjectile(player, projectiles) {
            const muzzleX = this.x + this.attackDirection * this.width * 0.26;
            const muzzleY = this.feetY - this.height * 0.57;

            projectiles.push(new NullWardenProjectile(muzzleX, muzzleY, this.attackDirection, player));
        }

        updateFacing(player) {
            const body = player && player.getBodyHitbox ? player.getBodyHitbox() : { x: this.x, width: 0 };
            const playerCenterX = body.x + body.width / 2;

            this.direction = playerCenterX >= this.x ? 1 : -1;
        }

        syncY() {
            this.feetY = clamp(this.feetY, this.walkableTop, this.walkableBottom);
            this.y = this.feetY - this.height;
        }

        render(ctx, cameraX) {
            if (this.deathComplete || !nullWardenVisualsReady()) {
                return;
            }

            this.renderSpecialWarning(ctx, cameraX);
            this.renderSprite(ctx, cameraX);
        }

        renderSpecialWarning(ctx, cameraX) {
            if (!this.specialArea || this.state === NULL_WARDEN_STATE.SPECIAL_ACTIVE || this.state === NULL_WARDEN_STATE.SPECIAL_RECOVERY) {
                return;
            }

            const area = this.specialArea;

            ctx.save();
            ctx.globalAlpha = 0.46;
            ctx.strokeStyle = '#ff2eb4';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff2eb4';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(area.x - cameraX + 8, area.y + area.height * 0.62);
            ctx.lineTo(area.x - cameraX + area.width * 0.24, area.y + area.height * 0.38);
            ctx.lineTo(area.x - cameraX + area.width * 0.48, area.y + area.height * 0.66);
            ctx.lineTo(area.x - cameraX + area.width * 0.74, area.y + area.height * 0.42);
            ctx.lineTo(area.x - cameraX + area.width - 8, area.y + area.height * 0.60);
            ctx.stroke();
            ctx.restore();
        }

        renderSprite(ctx, cameraX) {
            if (!countNullWardenBodyDraw()) {
                return;
            }

            const animationKey = this.getAnimationKey();
            if (animationKey === 'walk' && this.shouldUseWalkSheet()) {
                this.renderWalkSheetFrame(ctx, cameraX);
                return;
            }

            const drawAnimationKey = animationKey === 'walk' ? 'idle' : animationKey;
            const animation = NULL_WARDEN_ANIMATIONS[drawAnimationKey] || NULL_WARDEN_ANIMATIONS.idle;
            const frames = nullWardenAnimations[drawAnimationKey] || nullWardenAnimations.idle;
            const frameCount = getAnimationFrameCount(animation);
            const frameIndex = Math.max(0, Math.min(this.currentFrame, frameCount - 1));
            const currentFrameImage = frames[frameIndex];
            const drawX = this.x - cameraX - this.drawWidth / 2;
            const drawY = this.feetY - this.drawHeight;
            const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

            if (!imageReady(currentFrameImage)) {
                return;
            }

            ctx.save();
            ctx.globalAlpha = Math.min(this.deathAlpha, now < this.hitFlashUntil ? 0.68 : 1);

            if (this.direction > 0) {
                ctx.translate(drawX + this.drawWidth, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(currentFrameImage, 0, 0, this.drawWidth, this.drawHeight);
            } else {
                ctx.drawImage(currentFrameImage, drawX, drawY, this.drawWidth, this.drawHeight);
            }

            ctx.restore();
        }

        shouldUseWalkSheet() {
            return nullWardenVideoWalkSheetReady &&
                imageReady(nullWardenVideoWalkSheet) &&
                (this.state === NULL_WARDEN_STATE.ENTERING_WALK ||
                    this.state === NULL_WARDEN_STATE.CHASE && this.walkAnimationActive);
        }

        renderWalkSheetFrame(ctx, cameraX) {
            const column = this.walkFrame % NULL_WARDEN_WALK_COLUMNS;
            const row = Math.floor(this.walkFrame / NULL_WARDEN_WALK_COLUMNS);
            const sourceX = column * NULL_WARDEN_WALK_FRAME_WIDTH;
            const sourceY = row * NULL_WARDEN_WALK_FRAME_HEIGHT;
            const drawX = this.x - cameraX - this.drawWidth / 2;
            const drawY = this.feetY - this.drawHeight;
            const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

            if (DEBUG_NULL_WARDEN_WALK_FRAME && this.walkFrame !== this.lastLoggedWalkFrame) {
                this.lastLoggedWalkFrame = this.walkFrame;
                console.log('[Null Warden walk]', this.walkFrame + 1, sourceX, sourceY);
            }

            ctx.save();
            ctx.globalAlpha = Math.min(this.deathAlpha, now < this.hitFlashUntil ? 0.68 : 1);

            if (this.direction > 0) {
                ctx.translate(drawX + this.drawWidth, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    nullWardenVideoWalkSheet,
                    sourceX,
                    sourceY,
                    NULL_WARDEN_WALK_FRAME_WIDTH,
                    NULL_WARDEN_WALK_FRAME_HEIGHT,
                    0,
                    0,
                    this.drawWidth,
                    this.drawHeight
                );
            } else {
                ctx.drawImage(
                    nullWardenVideoWalkSheet,
                    sourceX,
                    sourceY,
                    NULL_WARDEN_WALK_FRAME_WIDTH,
                    NULL_WARDEN_WALK_FRAME_HEIGHT,
                    drawX,
                    drawY,
                    this.drawWidth,
                    this.drawHeight
                );
            }

            ctx.restore();
        }

    }

    class BossSystem {
        constructor(effects) {
            this.effects = effects;
            this.currentBoss = null;
            this.bossActive = false;
            this.bossDefeated = false;
            this.bossWarningActive = false;
            this.bossProjectiles = [];
            this.phaseTransitionCompleted = false;
            this.flow = NULL_WARDEN_FLOW.INACTIVE;
            this.phaseBossConfig = null;
            this.warningTimer = 0;
            this.victoryDelayTimer = 0;
            this.finalMessageActive = false;
            this.comingSoonTimer = 0;
            this.started = false;
            this.cameraX = 0;
            this.canvasWidth = 900;
            this.phaseLength = 2400;
        }

        prepareBoss(config) {
            this.reset();
            this.phaseBossConfig = config || null;

            if (this.phaseBossConfig && this.phaseBossConfig.type === 'nullWarden') {
                preloadNullWardenFrames();
            }
        }

        reset() {
            this.currentBoss = null;
            this.bossActive = false;
            this.bossDefeated = false;
            this.bossWarningActive = false;
            this.bossProjectiles.length = 0;
            this.phaseTransitionCompleted = false;
            this.flow = NULL_WARDEN_FLOW.INACTIVE;
            this.warningTimer = 0;
            this.victoryDelayTimer = 0;
            this.finalMessageActive = false;
            this.comingSoonTimer = 0;
            this.started = false;
        }

        whenVisualsReady() {
            if (!this.phaseBossConfig || this.phaseBossConfig.type !== 'nullWarden') {
                return Promise.resolve(true);
            }

            return preloadNullWardenFrames();
        }

        hasPhaseBoss() {
            return !!(this.phaseBossConfig && this.phaseBossConfig.type === 'nullWarden');
        }

        isPhaseBossComplete() {
            return !this.hasPhaseBoss() || this.finalMessageActive;
        }

        tryStartAfterWaves(phase, enemySystem, player, cameraX, canvasWidth) {
            if (!this.hasPhaseBoss() ||
                this.started ||
                !enemySystem ||
                !enemySystem.isCleared() ||
                enemySystem.soloEncounter && enemySystem.soloEncounter.active ||
                !nullWardenVisualsReady() ||
                !player ||
                player.isDead) {
                return;
            }

            this.started = true;
            this.flow = NULL_WARDEN_FLOW.WARNING;
            this.bossWarningActive = true;
            this.warningTimer = 2;
            this.cameraX = cameraX;
            this.canvasWidth = canvasWidth;
            this.phaseLength = typeof phase.length === 'number' ? phase.length : 2400;
        }

        update(player, deltaTime, now, phase, cameraX, canvasWidth) {
            const delta = deltaTime / 1000;

            this.cameraX = cameraX;
            this.canvasWidth = canvasWidth;
            this.phaseLength = phase && typeof phase.length === 'number' ? phase.length : this.phaseLength;

            if (this.comingSoonTimer > 0) {
                this.comingSoonTimer = Math.max(0, this.comingSoonTimer - delta);
            }

            this.updateProjectiles(player, deltaTime, now);

            if (this.flow === NULL_WARDEN_FLOW.WARNING) {
                this.warningTimer = Math.max(0, this.warningTimer - delta);

                if (this.warningTimer <= 0 && player && !player.isDead) {
                    this.spawnNullWarden(player, phase, cameraX, canvasWidth);
                }

                return;
            }

            if (!this.currentBoss) {
                return;
            }

            this.currentBoss.update(player, deltaTime, now, this.bossProjectiles);
            this.phaseTransitionCompleted = this.currentBoss.phaseTransitionCompleted;

            if (this.flow === NULL_WARDEN_FLOW.ENTRANCE && this.currentBoss.state !== NULL_WARDEN_STATE.ENTERING_WALK) {
                this.flow = NULL_WARDEN_FLOW.COMBAT;
            }

            if (this.currentBoss.state === NULL_WARDEN_STATE.DEATH) {
                this.bossProjectiles.length = 0;
            }

            if (this.currentBoss.deathComplete && this.flow !== NULL_WARDEN_FLOW.COMPLETE) {
                if (this.flow !== NULL_WARDEN_FLOW.DEFEATED) {
                    this.flow = NULL_WARDEN_FLOW.DEFEATED;
                    this.victoryDelayTimer = 1.5;
                    this.bossDefeated = true;
                    this.bossActive = false;
                    return;
                }

                this.victoryDelayTimer = Math.max(0, this.victoryDelayTimer - delta);

                if (this.victoryDelayTimer <= 0) {
                    this.flow = NULL_WARDEN_FLOW.COMPLETE;
                    this.finalMessageActive = true;
                }
            }
        }

        spawnNullWarden(player, phase, cameraX, canvasWidth) {
            const walkableTop = typeof phase.playAreaTop === 'number' ? phase.playAreaTop : typeof phase.streetTop === 'number' ? phase.streetTop : phase.groundY;
            const walkableBottom = typeof phase.playAreaBottom === 'number' ? phase.playAreaBottom : typeof phase.streetBottom === 'number' ? phase.streetBottom : phase.groundY;
            const visibleRight = cameraX + canvasWidth;
            const maxCenterX = phase.length - NULL_WARDEN_DRAW_WIDTH * 0.42;
            const desiredTargetX = Math.max(player.x + 220, visibleRight - 180);
            const targetX = clamp(desiredTargetX, NULL_WARDEN_DRAW_WIDTH * 0.42, maxCenterX);
            const startX = Math.max(visibleRight + NULL_WARDEN_DRAW_WIDTH / 2, targetX + 1);
            const feetY = clamp(getPlayerFeetY(player) + 8, walkableTop, walkableBottom);

            this.currentBoss = new NullWardenBoss({
                startX: startX,
                targetX: targetX,
                feetY: feetY,
                phaseLength: phase.length,
                walkableTop: walkableTop,
                walkableBottom: walkableBottom
            });
            this.flow = NULL_WARDEN_FLOW.ENTRANCE;
            this.bossWarningActive = false;
            this.bossActive = true;
        }

        updateProjectiles(player, deltaTime, now) {
            this.bossProjectiles.forEach((projectile) => {
                projectile.update(player, deltaTime, this.cameraX, this.canvasWidth, this.phaseLength, now);
            });

            this.bossProjectiles = this.bossProjectiles.filter(function (projectile) {
                return projectile.alive;
            });
        }

        getCombatTarget(cameraX, canvasWidth) {
            const boss = this.currentBoss;

            if (!boss || !boss.isTargetable()) {
                return null;
            }

            const bounds = boss.getVisualBounds();
            const viewX = typeof cameraX === 'number' ? cameraX : this.cameraX;
            const viewWidth = typeof canvasWidth === 'number' ? canvasWidth : this.canvasWidth;

            if (bounds.x + bounds.width < viewX || bounds.x > viewX + viewWidth) {
                return null;
            }

            return boss;
        }

        getTargetableBoss(cameraX, canvasWidth) {
            const boss = this.getCombatTarget(cameraX, canvasWidth);

            return boss ? [boss] : [];
        }

        getBossByTargetId(targetId, cameraX, canvasWidth) {
            const boss = this.getCombatTarget(cameraX, canvasWidth);

            return boss && boss.targetId === targetId ? boss : null;
        }

        selectTargetAt(canvasX, canvasY, cameraX, canvasWidth) {
            const boss = this.getCombatTarget(cameraX, canvasWidth);

            if (!boss) {
                return null;
            }

            const bounds = boss.getVisualBounds();

            if (canvasX >= bounds.x - cameraX &&
                canvasX <= bounds.x - cameraX + bounds.width &&
                canvasY >= bounds.y &&
                canvasY <= bounds.y + bounds.height) {
                return boss.targetId;
            }

            return null;
        }

        applyUltimateDamage(maxFraction) {
            const boss = this.currentBoss;

            if (!boss || !boss.isTargetable() || boss.state === NULL_WARDEN_STATE.DEATH || boss.state === NULL_WARDEN_STATE.PHASE_TRANSITION || boss.health <= 1) {
                return false;
            }

            const damage = boss.maxHealth * maxFraction;
            boss.takeDamage(Math.min(damage, boss.health - 1), { source: 'trixUltimate' });
            return true;
        }

        clearHostileProjectiles() {
            this.bossProjectiles.length = 0;
        }

        showComingSoon() {
            this.comingSoonTimer = 1.5;
        }

        getScreenShakeOffset() {
            const boss = this.currentBoss;

            if (!boss || boss.screenShakeTimer <= 0) {
                return { x: 0, y: 0 };
            }

            boss.screenShakeTimer = Math.max(0, boss.screenShakeTimer - 0.016);
            const strength = 4 * clamp(boss.screenShakeTimer / 0.75, 0, 1);
            const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

            return {
                x: Math.sin(now * 0.07) * strength,
                y: Math.cos(now * 0.09) * strength * 0.55
            };
        }

        render(ctx, cameraX) {
            // O corpo do Null Warden e desenhado junto dos atores terrestres em
            // CyberVoidActionGame.renderCombatActors(), para preservar profundidade.
        }

        renderProjectiles(ctx, cameraX) {
            this.bossProjectiles.forEach(function (projectile) {
                projectile.render(ctx, cameraX);
            });
        }

        renderWarning(ctx, canvasWidth) {
            if (!this.bossWarningActive) {
                return;
            }

            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
            ctx.fillRect(canvasWidth / 2 - 178, 132, 356, 72);
            ctx.fillStyle = '#ff2eb4';
            ctx.font = '14px monospace';
            ctx.fillText('ANOMALIA CRITICA DETECTADA', canvasWidth / 2, 158);
            ctx.fillStyle = '#ffffff';
            ctx.font = '22px monospace';
            ctx.fillText('NULL WARDEN', canvasWidth / 2, 186);
            ctx.restore();
        }

        renderBossHud(ctx, canvasWidth) {
            const boss = this.currentBoss;

            if (!boss || !this.started || this.finalMessageActive) {
                return;
            }

            const width = 360;
            const x = canvasWidth / 2 - width / 2;
            const y = 14;
            const ratio = clamp(boss.displayedHealth / boss.maxHealth, 0, 1);

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.74)';
            ctx.fillRect(x, y, width, 58);
            ctx.strokeStyle = '#8a2be2';
            ctx.strokeRect(x + 0.5, y + 0.5, width - 1, 57);
            ctx.fillStyle = '#ff2eb4';
            ctx.font = '15px monospace';
            ctx.fillText('NULL WARDEN', x + 14, y + 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText('GUARDIAO DA ANOMALIA', x + 14, y + 36);
            ctx.fillStyle = '#190b20';
            ctx.fillRect(x + 14, y + 43, width - 28, 8);
            ctx.fillStyle = '#8a2be2';
            ctx.fillRect(x + 14, y + 43, (width - 28) * ratio, 8);
            ctx.fillStyle = '#ff2eb4';
            ctx.fillRect(x + 14, y + 43, Math.max(0, (width - 28) * ratio - 5), 8);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(Math.ceil(Math.max(0, boss.health)) + ' / ' + boss.maxHealth, x + width - 14, y + 36);
            ctx.restore();
        }

        renderVictoryOverlay(ctx, canvasWidth, canvasHeight) {
            if (!this.finalMessageActive) {
                return;
            }

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff2eb4';
            ctx.font = '34px monospace';
            ctx.fillText('FASE 1 CONCLUIDA', canvasWidth / 2, 164);
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px monospace';
            ctx.fillText('ANOMALIA CONTIDA', canvasWidth / 2, 198);

            if (this.comingSoonTimer > 0) {
                ctx.fillStyle = '#00e5ff';
                ctx.font = '15px monospace';
                ctx.fillText('EM BREVE', canvasWidth / 2, 286);
            }

            ctx.restore();
        }
    }

    game.NULL_WARDEN_FRAMES_PATH = NULL_WARDEN_FRAMES_PATH;
    game.NULL_WARDEN_FRAME_PATHS = NULL_WARDEN_FRAME_PATHS;
    game.resetNullWardenDrawCounter = resetNullWardenDrawCounter;
    game.getNullWardenDrawCount = getNullWardenDrawCount;
    game.NULL_WARDEN_STATE = NULL_WARDEN_STATE;
    game.NULL_WARDEN_ANIMATIONS = NULL_WARDEN_ANIMATIONS;
    game.NullWardenBoss = NullWardenBoss;
    game.BossSystem = BossSystem;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
