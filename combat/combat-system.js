(function (game) {
    'use strict';

    const ASSET_ROOT = 'images/void-runner/player_woman/';
    const ATTACK_TYPE = {
        NORMAL: 'normal',
        CHARGED: 'charged',
        SPECIAL: 'special'
    };
    const TRIX_PROJECTILE_SPEED = 620;
    const TRIX_PROJECTILE_TURN_SPEED = 5;
    const TRIX_PROJECTILE_LIFETIME = 3.5;
    const HOMING_MIN_AIM_DOT = 0.2;
    const ATTACK_ASSETS = {
        normal: {
            projectile: {
                src: ASSET_ROOT + 'Dream291-ezgif.com-gif-to-sprite-converter.png',
                columns: 5,
                rows: 1,
                totalFrames: 2,
                fps: 12,
                width: 92,
                height: 38
            },
            impact: {
                src: ASSET_ROOT + 'Dream301-ezgif.com-gif-to-sprite-converter.png',
                columns: 5,
                rows: 2,
                totalFrames: 6,
                fps: 14,
                width: 86,
                height: 70
            }
        },
        charged: null,
        special: null
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function imageReady(image) {
        return image && !image.failed && image.complete && image.naturalWidth > 0;
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

    function validProjectileTarget(enemy) {
        if (game.isEnemySelectableTarget) {
            return game.isEnemySelectableTarget(enemy);
        }

        return enemy && enemy.alive && !enemy.removed && enemy.state !== 'death' && enemy.state !== 'DEATH' && enemy.health > 0;
    }

    function getTargetId(enemy) {
        if (!enemy) {
            return null;
        }

        return game.getEnemyTargetId ? game.getEnemyTargetId(enemy) : enemy.targetId || enemy.droneIndex;
    }

    function getCombatBalance() {
        // Todos os ataques leem dano da tabela central de balanceamento.
        return game.COMBAT_BALANCE;
    }

    class CombatSystem {
        constructor(effects) {
            this.effects = effects;
            this.projectiles = [];
            this.meleeHitbox = null;
            this.meleeHitboxUntil = 0;
            this.nextMeleeAt = 0;
            this.nextRangeAt = 0;
            this.projectileSheets = {};
            this.preloadAttackAssets();
        }

        reset() {
            this.projectiles = [];
            this.meleeHitbox = null;
            this.meleeHitboxUntil = 0;
            this.nextMeleeAt = 0;
            this.nextRangeAt = 0;
        }

        tryMelee(player, enemies, now) {
            if (now < this.nextMeleeAt || !player.startMelee(now)) {
                return;
            }

            this.nextMeleeAt = now + 340;
            this.meleeHitbox = player.getMeleeHitbox();
            this.meleeHitboxUntil = now + 120;

            enemies.forEach((enemy) => {
                if (enemy.alive && this.meleeCanHit(this.meleeHitbox, enemy)) {
                    enemy.takeDamage(getCombatBalance().trixDamage.meleeAttack);
                    this.effects.addSpark(enemy.x, enemy.y - 44, '#ff2eb4');
                }
            });
        }

        meleeCanHit(hitbox, enemy) {
            const enemyHitbox = enemy.getHitbox();
            const closeOnX = game.rectsOverlap(hitbox, enemyHitbox);
            const enemyY = enemy.getDepthY ? enemy.getDepthY() : typeof enemy.y === 'number' ? enemy.y : enemyHitbox.y + enemyHitbox.height;
            const closeOnDepth = Math.abs(hitbox.centerY - enemyY) <= hitbox.depthRange;

            return closeOnX && closeOnDepth;
        }

        tryRange(player, now, enemies, selectedTargetId) {
            if (now < this.nextRangeAt || !player.startRange(now)) {
                return;
            }

            const attackType = ATTACK_TYPE.NORMAL;
            const attackConfig = ATTACK_ASSETS[attackType];
            const muzzle = player.getMuzzlePoint();
            const hitboxWidth = 54;
            const hitboxHeight = 24;
            const projectileX = player.direction > 0 ? muzzle.x + 10 : muzzle.x - hitboxWidth - 10;
            const projectileY = muzzle.y - hitboxHeight / 2;
            const target = this.resolveProjectileTarget(selectedTargetId, projectileX, projectileY, hitboxWidth, hitboxHeight, enemies || [], player.direction);
            const velocity = this.getInitialVelocity(projectileX, projectileY, hitboxWidth, hitboxHeight, target, player.direction, TRIX_PROJECTILE_SPEED);

            this.nextRangeAt = now + 420;
            this.projectiles.push({
                attackType: attackType,
                x: projectileX,
                y: projectileY,
                width: hitboxWidth,
                height: hitboxHeight,
                visualWidth: attackConfig.projectile.width,
                visualHeight: attackConfig.projectile.height,
                speed: TRIX_PROJECTILE_SPEED,
                velocityX: velocity.x,
                velocityY: velocity.y,
                direction: velocity.x >= 0 ? 1 : -1,
                target: target,
                targetId: getTargetId(target),
                turnSpeed: TRIX_PROJECTILE_TURN_SPEED,
                owner: 'trix',
                damage: getCombatBalance().trixDamage.basicProjectile,
                age: 0,
                lifetime: TRIX_PROJECTILE_LIFETIME,
                lostTargetAge: 0,
                lostTargetLifetime: 0.65,
                hasHit: false,
                alive: true
            });

            if (attackType === ATTACK_TYPE.NORMAL && game.playTrixBasicShotSfx) {
                game.playTrixBasicShotSfx();
            }
        }

        resolveProjectileTarget(selectedTargetId, projectileX, projectileY, width, height, enemies, aimDirection) {
            const manualTarget = this.findTargetById(selectedTargetId, enemies);

            if (manualTarget) {
                return manualTarget;
            }

            return this.findNearestTarget(projectileX, projectileY, width, height, enemies, aimDirection);
        }

        findTargetById(targetId, enemies) {
            if (!targetId) {
                return null;
            }

            return (enemies || []).find(function (enemy) {
                return validProjectileTarget(enemy) && getTargetId(enemy) === targetId;
            }) || null;
        }

        findNearestTarget(projectileX, projectileY, width, height, enemies, aimDirection) {
            const projectileCenter = getRectCenter({
                x: projectileX,
                y: projectileY,
                width: width,
                height: height
            });
            let nearest = null;
            let nearestDistance = Infinity;

            enemies.forEach(function (enemy) {
                if (!validProjectileTarget(enemy)) {
                    return;
                }

                const hitbox = enemy.getHitbox();
                const targetCenter = getRectCenter(hitbox);
                const dx = targetCenter.x - projectileCenter.x;
                const dy = targetCenter.y - projectileCenter.y;
                const distance = Math.hypot(dx, dy);

                if (distance <= 0) {
                    return;
                }

                // Respeita a direcao escolhida pelo jogador: nao mira em alvo atras da Trix.
                if (aimDirection && dx / distance * aimDirection < HOMING_MIN_AIM_DOT) {
                    return;
                }

                if (distance < nearestDistance) {
                    nearest = enemy;
                    nearestDistance = distance;
                }
            });

            return nearest;
        }

        getInitialVelocity(projectileX, projectileY, width, height, target, aimDirection, speed) {
            const projectileCenter = getRectCenter({
                x: projectileX,
                y: projectileY,
                width: width,
                height: height
            });

            if (validProjectileTarget(target)) {
                const targetCenter = getRectCenter(target.getHitbox());
                const dx = targetCenter.x - projectileCenter.x;
                const dy = targetCenter.y - projectileCenter.y;
                const distance = Math.hypot(dx, dy);

                if (distance > 0) {
                    return {
                        x: dx / distance * speed,
                        y: dy / distance * speed
                    };
                }
            }

            return {
                x: aimDirection * speed,
                y: 0
            };
        }

        update(deltaTime, cameraX, canvasWidth, enemies) {
            const delta = deltaTime / 1000;

            this.projectiles.forEach((projectile) => {
                projectile.age += deltaTime;

                if (projectile.age / 1000 >= projectile.lifetime) {
                    projectile.alive = false;
                    return;
                }

                if (!validProjectileTarget(projectile.target)) {
                    projectile.target = this.findTargetById(projectile.targetId, enemies);

                    if (!projectile.target) {
                        projectile.target = this.findNearestTarget(projectile.x, projectile.y, projectile.width, projectile.height, enemies, 0);
                        projectile.targetId = getTargetId(projectile.target);
                    }
                }

                if (validProjectileTarget(projectile.target)) {
                    projectile.lostTargetAge = 0;
                } else {
                    projectile.lostTargetAge += deltaTime / 1000;

                    if (projectile.lostTargetAge >= projectile.lostTargetLifetime) {
                        projectile.alive = false;
                        return;
                    }
                }

                this.updateHoming(projectile, delta);
                projectile.x += projectile.velocityX * delta;
                projectile.y += projectile.velocityY * delta;
                projectile.direction = projectile.velocityX >= 0 ? 1 : -1;

                enemies.forEach((enemy) => {
                    if (!validProjectileTarget(enemy) || !projectile.alive || projectile.hasHit) {
                        return;
                    }

                    if (game.rectsOverlap(projectile, enemy.getHitbox())) {
                        const wasAlive = enemy.alive && enemy.health > 0;
                        const healthBefore = typeof enemy.health === 'number' ? enemy.health : null;

                        projectile.hasHit = true;
                        projectile.alive = false;
                        enemy.takeDamage(projectile.damage);
                        this.playProjectileImpactSfx(projectile, enemy, wasAlive, healthBefore);
                        this.addImpact(projectile, enemy);
                    }
                });
            });

            this.projectiles = this.projectiles.filter(function (projectile) {
                return projectile.alive &&
                    projectile.x > cameraX - 160 &&
                    projectile.x < cameraX + canvasWidth + 160 &&
                    projectile.y > -160 &&
                    projectile.y < 680;
            });
        }

        updateHoming(projectile, delta) {
            if (!validProjectileTarget(projectile.target)) {
                return;
            }

            const projectileCenter = getRectCenter(projectile);
            const targetCenter = getRectCenter(projectile.target.getHitbox());
            const dx = targetCenter.x - projectileCenter.x;
            const dy = targetCenter.y - projectileCenter.y;
            const distance = Math.hypot(dx, dy);

            if (distance <= 0) {
                return;
            }

            const desiredAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(projectile.velocityY, projectile.velocityX);
            const angleDifference = normalizeAngle(desiredAngle - currentAngle);
            const maxTurn = projectile.turnSpeed * delta;
            const newAngle = currentAngle + clamp(angleDifference, -maxTurn, maxTurn);

            // A curva usa delta real do loop para ficar igual em FPS diferentes.
            projectile.velocityX = Math.cos(newAngle) * projectile.speed;
            projectile.velocityY = Math.sin(newAngle) * projectile.speed;
        }

        updateTimers(now) {
            if (this.meleeHitbox && now >= this.meleeHitboxUntil) {
                this.meleeHitbox = null;
            }
        }

        render(ctx, cameraX) {
            this.projectiles.forEach((projectile) => {
                const attackConfig = ATTACK_ASSETS[projectile.attackType] || ATTACK_ASSETS[ATTACK_TYPE.NORMAL];
                const sheet = this.getProjectileSheet(attackConfig.projectile);
                const frameIndex = Math.floor(projectile.age / (1000 / attackConfig.projectile.fps)) % attackConfig.projectile.totalFrames;
                const centerX = projectile.x + projectile.width / 2 + projectile.direction * 18 - cameraX;
                const centerY = projectile.y + projectile.height / 2;

                if (this.drawRotatedProjectile(ctx, sheet, frameIndex, centerX, centerY, projectile)) {
                    return;
                }

                ctx.save();
                ctx.fillStyle = '#00e5ff';
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 12;
                ctx.fillRect(projectile.x - cameraX, projectile.y, projectile.width, projectile.height);
                ctx.restore();
            });
        }

        drawRotatedProjectile(ctx, sheet, frameIndex, centerX, centerY, projectile) {
            if (!sheet || !imageReady(sheet.image)) {
                return false;
            }

            const safeFrameIndex = Math.max(0, Math.min(frameIndex || 0, sheet.totalFrames - 1));
            const frameNumber = sheet.startFrame + safeFrameIndex;
            const frameWidth = sheet.frameWidth || sheet.image.naturalWidth / sheet.columns;
            const frameHeight = sheet.frameHeight || sheet.image.naturalHeight / sheet.rows;
            const frameX = frameNumber % sheet.columns;
            const frameY = Math.floor(frameNumber / sheet.columns);
            const angle = Math.atan2(projectile.velocityY, projectile.velocityX);

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            ctx.drawImage(
                sheet.image,
                frameX * frameWidth,
                frameY * frameHeight,
                frameWidth,
                frameHeight,
                -projectile.visualWidth / 2,
                -projectile.visualHeight / 2,
                projectile.visualWidth,
                projectile.visualHeight
            );
            ctx.restore();
            return true;
        }

        getProjectileSheet(config) {
            if (!this.projectileSheets[config.src]) {
                this.projectileSheets[config.src] = game.createSpriteSheet(config);
            }

            return this.projectileSheets[config.src];
        }

        preloadAttackAssets() {
            const normalAttack = ATTACK_ASSETS[ATTACK_TYPE.NORMAL];

            this.getProjectileSheet(normalAttack.projectile);

            if (this.effects.getSpriteSheet) {
                this.effects.getSpriteSheet(normalAttack.impact);
            }
        }

        playProjectileImpactSfx(projectile, enemy, wasAlive, healthBefore) {
            if (!game.playEnemyImpactSfx ||
                !wasAlive ||
                projectile.damage <= 0 ||
                enemy.enemyType === 'nullWardenBoss' ||
                healthBefore === null ||
                !(enemy.health < healthBefore)) {
                return;
            }

            game.playEnemyImpactSfx();
        }

        addImpact(projectile, enemy) {
            const attackConfig = ATTACK_ASSETS[projectile.attackType] || ATTACK_ASSETS[ATTACK_TYPE.NORMAL];
            const impactPoint = enemy.getImpactPoint ? enemy.getImpactPoint() : {
                x: enemy.x + enemy.width / 2,
                y: enemy.y - enemy.height / 2
            };

            this.effects.addSpriteEffect({
                src: attackConfig.impact.src,
                columns: attackConfig.impact.columns,
                rows: attackConfig.impact.rows,
                totalFrames: attackConfig.impact.totalFrames,
                fps: attackConfig.impact.fps,
                x: impactPoint.x,
                y: impactPoint.y,
                width: attackConfig.impact.width,
                height: attackConfig.impact.height,
                direction: projectile.direction
            });
        }
    }

    game.ATTACK_TYPE = ATTACK_TYPE;
    game.CombatSystem = CombatSystem;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
