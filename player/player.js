(function (game) {
    'use strict';

    const ASSET_ROOT = 'images/void-runner/player_woman/';

    const PLAYER_STATE = {
        IDLE: 'idle',
        WALK: 'walk',
        RUN: 'run',
        JUMP: 'jump',
        ATTACK_MELEE: 'attackMelee',
        ATTACK_RANGE: 'attackRange',
        HURT: 'hurt',
        DEATH: 'death'
    };

    const PLAYER_ANIMATIONS = {
        idle: { src: ASSET_ROOT + 'Dream223-ezgif.com-gif-to-sprite-converter.png', columns: 5, rows: 4, totalFrames: 16, fps: 8 },
        walk: { src: ASSET_ROOT + 'Dream25-ezgif.com-gif-to-sprite-converter-Photoroom.png', columns: 5, rows: 2, totalFrames: 10, fps: 7 },
        run: { src: ASSET_ROOT + 'Dream25-ezgif.com-gif-to-sprite-converter-Photoroom.png', columns: 5, rows: 2, totalFrames: 10, fps: 12 },
        jump: { src: ASSET_ROOT + 'Dream25-ezgif.com-gif-to-sprite-converter-Photoroom.png', columns: 5, rows: 2, totalFrames: 5, fps: 10 },
        attackMelee: { src: ASSET_ROOT + 'Dream23-ezgif.com-gif-to-sprite-converter.png', columns: 5, rows: 2, totalFrames: 6, fps: 10 },
        attackRange: { src: ASSET_ROOT + 'Dream241-ezgif.com-gif-to-sprite-converter.png', columns: 5, rows: 2, totalFrames: 9, fps: 10 },
        hurt: { src: ASSET_ROOT + 'Dream223-ezgif.com-gif-to-sprite-converter.png', columns: 5, rows: 4, startFrame: 10, totalFrames: 5, fps: 10 },
        death: { src: ASSET_ROOT + 'Dream26-ezgif.com-gif-to-sprite-converter.png', columns: 5, rows: 5, totalFrames: 23, fps: 8 }
    };

    function imageReady(image) {
        return image && !image.failed && image.complete && image.naturalWidth > 0;
    }

    function getCombatBalance() {
        // A Trix usa a mesma fonte oficial de vida e invulnerabilidade do jogo.
        return game.COMBAT_BALANCE;
    }

    function resolveGroundY(phase) {
        return typeof phase.groundY === 'number' ? phase.groundY : game.GROUND_Y;
    }

    function resolvePlayAreaTop(phase) {
        if (typeof phase.playAreaTop === 'number') {
            return phase.playAreaTop;
        }

        return typeof phase.streetTop === 'number' ? phase.streetTop : resolveGroundY(phase);
    }

    function resolvePlayAreaBottom(phase) {
        if (typeof phase.playAreaBottom === 'number') {
            return phase.playAreaBottom;
        }

        return typeof phase.streetBottom === 'number' ? phase.streetBottom : resolveGroundY(phase);
    }

    function measureFrameFootOffsets(image, config, drawHeight) {
        if (!document.createElement) {
            return [];
        }

        try {
            const frameWidth = config.frameWidth;
            const frameHeight = config.frameHeight;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                return [];
            }

            canvas.width = frameWidth;
            canvas.height = frameHeight;

            return Array.from({ length: config.totalFrames }, function (_, frameIndex) {
                const frameNumber = (config.startFrame || 0) + frameIndex;
                const frameX = frameNumber % config.columns;
                const frameY = Math.floor(frameNumber / config.columns);

                ctx.clearRect(0, 0, frameWidth, frameHeight);
                ctx.drawImage(image, frameX * frameWidth, frameY * frameHeight, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);

                const pixels = ctx.getImageData(0, 0, frameWidth, frameHeight).data;

                for (let y = frameHeight - 1; y >= 0; y--) {
                    for (let x = 0; x < frameWidth; x++) {
                        if (pixels[(y * frameWidth + x) * 4 + 3] > 12) {
                            const transparentBottom = frameHeight - y - 1;
                            return transparentBottom * (drawHeight / frameHeight);
                        }
                    }
                }

                return 0;
            });
        } catch (error) {
            console.warn('Nao foi possivel medir o offset dos pes da Trix:', config.src);
            return [];
        }
    }

    class Player {
        constructor() {
            this.name = 'Trix';
            this.x = 90;
            this.y = game.GROUND_Y;
            this.width = 104;
            this.height = 126;
            this.offsetY = 0;
            this.groundY = game.GROUND_Y;
            this.walkSpeed = 150;
            this.runSpeed = 255;
            this.gravity = 1450;
            this.jumpSpeed = 520;
            this.direction = 1;
            this.state = PLAYER_STATE.IDLE;
            this.maxHealth = getCombatBalance().trix.maxHealth;
            this.health = this.maxHealth;
            this.frameIndex = 0;
            this.frameTimer = 0;
            this.isAttacking = false;
            this.isDead = false;
            this.jumpVelocity = 0;
            this.jumpOffset = 0;
            this.isGrounded = true;
            this.stateLockedUntil = 0;
            this.isInvulnerable = false;
            this.invulnerabilityTimer = 0;
            this.deathStartedAt = 0;
            this.images = {};
            this.loadAnimations();
        }

        loadAnimations() {
            Object.keys(PLAYER_ANIMATIONS).forEach((state) => {
                const config = PLAYER_ANIMATIONS[state];
                const image = new Image();
                const drawHeight = this.height;

                image.failed = false;
                image.onerror = function () {
                    image.failed = true;
                    console.warn('Sprite da Trix nao carregou:', config.src, 'Fallback: idle');
                };
                image.onload = function () {
                    config.frameWidth = image.naturalWidth / config.columns;
                    config.frameHeight = image.naturalHeight / config.rows;
                    // Mede a transparencia inferior de cada frame. Assim os pes
                    // ficam alinhados ao chao mesmo quando a sheet tem padding.
                    config.footOffsets = measureFrameFootOffsets(image, config, drawHeight);
                };
                image.src = config.src;
                this.images[state] = image;
            });
        }

        reset(phase) {
            this.x = 90;
            this.groundY = resolveGroundY(phase);
            this.y = this.groundY;
            this.direction = 1;
            this.state = PLAYER_STATE.IDLE;
            this.maxHealth = getCombatBalance().trix.maxHealth;
            this.health = this.maxHealth;
            this.frameIndex = 0;
            this.frameTimer = 0;
            this.isAttacking = false;
            this.isDead = false;
            this.jumpVelocity = 0;
            this.jumpOffset = 0;
            this.isGrounded = true;
            this.stateLockedUntil = 0;
            this.isInvulnerable = false;
            this.invulnerabilityTimer = 0;
            this.deathStartedAt = 0;
        }

        enterState(nextState, now, lockDuration) {
            // Unica porta de troca de estado. Ao entrar em RUN, HURT ou DEATH,
            // a animacao anterior e descartada e apenas o novo estado fica ativo.
            if (!PLAYER_ANIMATIONS[nextState] || this.state === PLAYER_STATE.DEATH && nextState !== PLAYER_STATE.DEATH) {
                return;
            }

            if (this.state !== nextState) {
                this.state = nextState;
                this.frameIndex = 0;
                this.frameTimer = 0;
            }

            this.isAttacking = nextState === PLAYER_STATE.ATTACK_MELEE || nextState === PLAYER_STATE.ATTACK_RANGE;
            this.stateLockedUntil = lockDuration ? now + lockDuration : 0;
        }

        isLocked(now) {
            return this.stateLockedUntil > now;
        }

        update(input, phase, deltaTime, now) {
            const delta = deltaTime / 1000;

            this.updateInvulnerability(delta);

            if (this.isDead) {
                this.enterState(PLAYER_STATE.DEATH, now, 0);
                this.updateAnimation(deltaTime);
                return;
            }

            let moveX = 0;
            let moveY = 0;

            this.groundY = resolveGroundY(phase);
            const playAreaTop = resolvePlayAreaTop(phase);
            const playAreaBottom = resolvePlayAreaBottom(phase);
            const moveSpeed = input.run ? this.runSpeed : this.walkSpeed;

            if (!this.isLocked(now)) {
                if (input.left) moveX -= 1;
                if (input.right) moveX += 1;
                if (input.up) moveY -= 1;
                if (input.down) moveY += 1;
            }

            if (moveX !== 0) {
                this.direction = moveX > 0 ? 1 : -1;
            }

            if (moveX !== 0 && moveY !== 0) {
                const diagonal = Math.SQRT1_2;
                moveX *= diagonal;
                moveY *= diagonal;
            }

            this.x += moveX * moveSpeed * delta;
            this.y += moveY * moveSpeed * 0.72 * delta;
            this.x = Math.max(30, Math.min(phase.length - 80, this.x));
            // this.y representa os pes no plano da rua 2.5D. playAreaTop e
            // playAreaBottom prendem a Trix dentro da faixa jogavel do PNG.
            this.y = Math.max(playAreaTop, Math.min(playAreaBottom, this.y));

            if (input.jumpPressed && this.isGrounded && !this.isLocked(now)) {
                this.jumpVelocity = this.jumpSpeed;
                this.isGrounded = false;
                this.enterState(PLAYER_STATE.JUMP, now, 0);
            }

            if (!this.isGrounded || this.jumpOffset > 0) {
                this.jumpOffset += this.jumpVelocity * delta;
                this.jumpVelocity -= this.gravity * delta;

                if (this.jumpOffset <= 0) {
                    // Colisao simples com o chao: nunca deixa a altura ficar negativa.
                    this.jumpOffset = 0;
                    this.jumpVelocity = 0;
                    this.isGrounded = true;
                }
            }

            this.updateStateFromMovement(input, now, phase);
            this.updateAnimation(deltaTime);
        }

        updateInvulnerability(delta) {
            if (!this.isInvulnerable) {
                return;
            }

            // O tempo de invulnerabilidade e governado pelo deltaTime do loop principal.
            this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - delta);

            if (this.invulnerabilityTimer <= 0.0001) {
                this.invulnerabilityTimer = 0;
                this.isInvulnerable = false;
            }
        }

        updateStateFromMovement(input, now, phase) {
            if (this.isLocked(now)) {
                return;
            }

            this.isAttacking = false;
            this.stateLockedUntil = 0;

            if (!this.isGrounded || this.jumpOffset > 1 || Math.abs(this.jumpVelocity) > 1) {
                this.enterState(PLAYER_STATE.JUMP, now, 0);
            } else if (input.left || input.right || input.up || input.down) {
                this.enterState(input.run ? PLAYER_STATE.RUN : PLAYER_STATE.WALK, now, 0);
            } else {
                this.enterState(PLAYER_STATE.IDLE, now, 0);
            }
        }

        updateAnimation(deltaTime) {
            const config = PLAYER_ANIMATIONS[this.state] || PLAYER_ANIMATIONS.idle;
            const frameDuration = 1000 / config.fps;

            this.frameTimer += deltaTime;

            while (this.frameTimer >= frameDuration) {
                this.frameTimer -= frameDuration;
                this.frameIndex++;

                if (this.frameIndex >= config.totalFrames) {
                    this.frameIndex = this.state === PLAYER_STATE.DEATH ? config.totalFrames - 1 : 0;
                }
            }
        }

        startMelee(now) {
            if (this.isDead || this.isLocked(now)) {
                return false;
            }

            this.enterState(PLAYER_STATE.ATTACK_MELEE, now, 260);
            return true;
        }

        startRange(now) {
            if (this.isDead || this.isLocked(now)) {
                return false;
            }

            this.enterState(PLAYER_STATE.ATTACK_RANGE, now, 240);
            return true;
        }

        takeDamage(amount, now) {
            if (this.isDead || this.isInvulnerable) {
                return;
            }

            const balance = getCombatBalance().trix;

            this.maxHealth = balance.maxHealth;
            this.health = Math.max(0, Math.min(this.maxHealth, this.health - amount));

            if (this.health <= 0) {
                this.isDead = true;
                this.isAttacking = false;
                this.isInvulnerable = false;
                this.invulnerabilityTimer = 0;
                this.jumpVelocity = 0;
                this.jumpOffset = 0;
                this.isGrounded = true;
                this.deathStartedAt = now;
                this.enterState(PLAYER_STATE.DEATH, now, 0);
            } else {
                this.isAttacking = false;
                this.isInvulnerable = true;
                this.invulnerabilityTimer = balance.invulnerabilityDuration;
                this.jumpVelocity = 0;
                this.enterState(PLAYER_STATE.HURT, now, 300);
            }
        }

        isDeathAnimationFinished(now) {
            const config = PLAYER_ANIMATIONS[PLAYER_STATE.DEATH];
            const frameDuration = 1000 / config.fps;
            const animationDuration = config.totalFrames * frameDuration;

            return this.state === PLAYER_STATE.DEATH &&
                this.deathStartedAt > 0 &&
                now - this.deathStartedAt >= animationDuration;
        }

        getFeetY() {
            return this.y - this.jumpOffset;
        }

        getFrameFootOffset(config, frameIndex) {
            if (Array.isArray(config.footOffsets) && typeof config.footOffsets[frameIndex] === 'number') {
                return config.footOffsets[frameIndex];
            }

            return 0;
        }

        getBodyHitbox() {
            const feetY = this.getFeetY();

            return { x: this.x + 34, y: feetY - 88, width: 38, height: 72 };
        }

        getMeleeHitbox() {
            return {
                x: this.direction > 0 ? this.x + 58 : this.x - 78,
                y: this.y - 36,
                width: 82,
                height: 72,
                centerY: this.y,
                depthRange: 42
            };
        }

        getMuzzlePoint() {
            return {
                x: this.direction > 0 ? this.x + 70 : this.x - 24,
                y: this.getFeetY() - 74
            };
        }

        draw(ctx, cameraX) {
            const config = PLAYER_ANIMATIONS[this.state] || PLAYER_ANIMATIONS.idle;
            const image = imageReady(this.images[this.state]) ? this.images[this.state] : this.state === PLAYER_STATE.DEATH ? null : this.images.idle;

            if (!imageReady(image)) {
                return;
            }

            const currentFrame = Math.min(this.frameIndex, config.totalFrames - 1);
            const frameNumber = (config.startFrame || 0) + currentFrame;
            const frameWidth = config.frameWidth || image.naturalWidth / config.columns;
            const frameHeight = config.frameHeight || image.naturalHeight / config.rows;
            // Sprite sheet: frameX/frameY localizam uma celula da grade.
            // sourceX/sourceY recortam essa celula para impedir desenhar a sheet inteira.
            const frameX = frameNumber % config.columns;
            const frameY = Math.floor(frameNumber / config.columns);
            const sourceX = frameX * frameWidth;
            const sourceY = frameY * frameHeight;
            const screenX = this.x - cameraX;
            const footOffsetY = this.getFrameFootOffset(config, currentFrame);
            // O desenho nasce da linha dos pes. footOffsetY compensa o espaco
            // transparente inferior do frame e offsetY e o ajuste fino por personagem.
            const screenY = this.getFeetY() - this.height + footOffsetY + this.offsetY;

            ctx.save();

            if (this.isInvulnerable && Math.floor(performance.now() / 80) % 2 === 0) {
                ctx.globalAlpha = 0.52;
            }

            const destinationX = this.direction < 0 ? 0 : screenX;
            const destinationY = this.direction < 0 ? 0 : screenY;

            if (this.direction < 0) {
                ctx.translate(screenX + this.width, screenY);
                ctx.scale(-1, 1);
            }

            ctx.drawImage(image, sourceX, sourceY, frameWidth, frameHeight, destinationX, destinationY, this.width, this.height);

            ctx.restore();
        }
    }

    game.PLAYER_STATE = PLAYER_STATE;
    game.PLAYER_ANIMATIONS = PLAYER_ANIMATIONS;
    game.Player = Player;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
