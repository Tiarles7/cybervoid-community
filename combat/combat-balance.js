(function (game) {
    'use strict';

    // Fonte oficial dos valores de vida, dano e invulnerabilidade do CyberVoid Action.
    const COMBAT_BALANCE = {
        trix: {
            maxHealth: 100,
            invulnerabilityDuration: 0.65
        },
        droneSentinel: {
            maxHealth: 72,
            hitInvulnerabilityDuration: 0.10,
            contactDamage: 12,
            contactDamageCooldown: 1.0
        },
        corruptedFragment: {
            maxHealth: 96,
            meleeDamage: 14,
            moveSpeed: 135,
            attackEnterGap: 95,
            attackExitGap: 180,
            windupDuration: 0.18,
            lungeDuration: 0.16,
            activeDuration: 0.10,
            recoveryDuration: 0.32,
            lungeSpeed: 330,
            attackRange: 105,
            attackCooldown: 1.25,
            hitInvulnerabilityDuration: 0.10
        },
        digitalParasite: {
            maxHealth: 48,
            meleeDamage: 10,
            moveSpeed: 225,
            jumpSpeedX: 285,
            jumpSpeedY: 480,
            gravity: 1100,
            attackRange: 80,
            attackCooldown: 1.0,
            jumpCooldownMin: 2.2,
            jumpCooldownMax: 3.6,
            hitInvulnerabilityDuration: 0.08
        },
        trixDamage: {
            basicProjectile: 12,
            strongPower: 24,
            meleeAttack: 18
        },
        enemyDamage: {
            basicProjectile: 8
        }
    };

    game.COMBAT_BALANCE = COMBAT_BALANCE;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
