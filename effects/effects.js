(function (game) {
    'use strict';

    const SPRITE_ALPHA_THRESHOLD = 12;
    const SPRITE_FRAME_PADDING = 2;

    function imageReady(image) {
        return image && !image.failed && image.complete && image.naturalWidth > 0;
    }

    function measureFrameBounds(image, sheet) {
        if (!document.createElement) {
            return [];
        }

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const frameWidth = sheet.frameWidth;
            const frameHeight = sheet.frameHeight;

            if (!ctx) {
                return [];
            }

            canvas.width = frameWidth;
            canvas.height = frameHeight;

            return Array.from({ length: sheet.totalFrames }, function (_, frameIndex) {
                const frameNumber = (sheet.startFrame || 0) + frameIndex;
                const frameX = frameNumber % sheet.columns;
                const frameY = Math.floor(frameNumber / sheet.columns);
                let minX = frameWidth;
                let minY = frameHeight;
                let maxX = -1;
                let maxY = -1;

                ctx.clearRect(0, 0, frameWidth, frameHeight);
                ctx.drawImage(image, frameX * frameWidth, frameY * frameHeight, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);

                const pixels = ctx.getImageData(0, 0, frameWidth, frameHeight).data;

                for (let y = 0; y < frameHeight; y++) {
                    for (let x = 0; x < frameWidth; x++) {
                        if (pixels[(y * frameWidth + x) * 4 + 3] > SPRITE_ALPHA_THRESHOLD) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                if (maxX < minX || maxY < minY) {
                    return { x: 0, y: 0, width: frameWidth, height: frameHeight };
                }

                minX = Math.max(0, minX - SPRITE_FRAME_PADDING);
                minY = Math.max(0, minY - SPRITE_FRAME_PADDING);
                maxX = Math.min(frameWidth - 1, maxX + SPRITE_FRAME_PADDING);
                maxY = Math.min(frameHeight - 1, maxY + SPRITE_FRAME_PADDING);

                return {
                    x: minX,
                    y: minY,
                    width: maxX - minX + 1,
                    height: maxY - minY + 1
                };
            });
        } catch (error) {
            console.warn('Nao foi possivel medir frames do efeito:', sheet.src);
            return [];
        }
    }

    function createSpriteSheet(config) {
        const image = new Image();
        const sheet = {
            src: config.src,
            columns: config.columns,
            rows: config.rows,
            startFrame: config.startFrame || 0,
            totalFrames: config.totalFrames,
            fps: config.fps,
            image: image,
            frameWidth: 0,
            frameHeight: 0,
            frameBounds: []
        };

        image.failed = false;
        image.onerror = function () {
            image.failed = true;
            console.warn('Sprite de efeito nao carregou:', config.src);
        };
        image.onload = function () {
            sheet.frameWidth = image.naturalWidth / sheet.columns;
            sheet.frameHeight = image.naturalHeight / sheet.rows;
            sheet.frameBounds = measureFrameBounds(image, sheet);
        };
        image.src = config.src;

        return sheet;
    }

    function drawSpriteFrame(ctx, sheet, options) {
        if (!sheet || !imageReady(sheet.image)) {
            return false;
        }

        const frameIndex = Math.max(0, Math.min(options.frameIndex || 0, sheet.totalFrames - 1));
        const frameNumber = sheet.startFrame + frameIndex;
        const baseFrameWidth = sheet.frameWidth || sheet.image.naturalWidth / sheet.columns;
        const baseFrameHeight = sheet.frameHeight || sheet.image.naturalHeight / sheet.rows;
        const frameX = frameNumber % sheet.columns;
        const frameY = Math.floor(frameNumber / sheet.columns);
        const bounds = sheet.frameBounds[frameIndex] || { x: 0, y: 0, width: baseFrameWidth, height: baseFrameHeight };
        const sourceX = frameX * baseFrameWidth + bounds.x;
        const sourceY = frameY * baseFrameHeight + bounds.y;
        const direction = options.direction || 1;
        const drawWidth = options.width;
        const drawHeight = options.height;
        const drawX = -drawWidth / 2;
        const drawY = -drawHeight / 2;

        ctx.save();
        ctx.globalAlpha = typeof options.alpha === 'number' ? options.alpha : 1;
        ctx.translate(options.x, options.y);

        if (direction < 0) {
            ctx.scale(-1, 1);
        }

        ctx.drawImage(sheet.image, sourceX, sourceY, bounds.width, bounds.height, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        return true;
    }

    class EffectsSystem {
        constructor() {
            this.effects = [];
            this.spriteSheets = {};
        }

        reset() {
            this.effects = [];
        }

        addSpark(x, y, color) {
            this.effects.push({
                x: x,
                y: y,
                color: color || '#ff2eb4',
                age: 0,
                duration: 260
            });
        }

        getSpriteSheet(config) {
            if (!this.spriteSheets[config.src]) {
                this.spriteSheets[config.src] = createSpriteSheet(config);
            }

            return this.spriteSheets[config.src];
        }

        addSpriteEffect(config) {
            const duration = typeof config.duration === 'number' ? config.duration : config.totalFrames / config.fps * 1000;

            this.effects.push({
                type: 'sprite',
                x: config.x,
                y: config.y,
                width: config.width,
                height: config.height,
                direction: config.direction || 1,
                age: 0,
                duration: duration,
                sheet: this.getSpriteSheet(config)
            });
        }

        update(deltaTime) {
            this.effects.forEach(function (effect) {
                effect.age += deltaTime;
            });

            this.effects = this.effects.filter(function (effect) {
                return effect.age < effect.duration;
            });
        }

        render(ctx, cameraX) {
            this.effects.forEach(function (effect) {
                const progress = effect.age / effect.duration;

                if (effect.type === 'sprite') {
                    const frameIndex = Math.min(effect.sheet.totalFrames - 1, Math.floor(effect.age / (1000 / effect.sheet.fps)));

                    drawSpriteFrame(ctx, effect.sheet, {
                        frameIndex: frameIndex,
                        x: effect.x - cameraX,
                        y: effect.y,
                        width: effect.width,
                        height: effect.height,
                        direction: effect.direction,
                        alpha: 1 - Math.max(0, progress - 0.82) / 0.18
                    });
                    return;
                }

                ctx.save();
                ctx.globalAlpha = 1 - progress;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(effect.x - cameraX, effect.y, 12 + progress * 22, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });
        }
    }

    game.createSpriteSheet = createSpriteSheet;
    game.drawSpriteFrame = drawSpriteFrame;
    game.EffectsSystem = EffectsSystem;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
