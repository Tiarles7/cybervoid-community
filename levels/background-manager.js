(function (game) {
    'use strict';

    function imageReady(image) {
        return image && !image.failed && image.complete && image.naturalWidth > 0;
    }

    class BackgroundManager {
        constructor() {
            this.layers = [];
            this.decorations = {
                aerial: [],
                ground: []
            };
        }

        loadPhase(phase) {
            const background = phase.background || {};
            const decorations = phase.decorations || {};

            // Cada fase declara suas camadas. O manager apenas carrega imagens
            // e guarda metadados de parallax, posicao e repeticao.
            this.layers = (background.layers || []).map(function (layer) {
                const image = new Image();

                image.failed = false;
                image.onerror = function () {
                    image.failed = true;
                    console.warn('Background nao carregou:', layer.src);
                };
                image.src = layer.src;

                return {
                    name: layer.name,
                    type: layer.type,
                    src: layer.src,
                    image: image,
                    parallax: layer.parallax,
                    y: layer.y,
                    width: layer.width,
                    height: layer.height,
                    sourceX: layer.sourceX,
                    sourceY: layer.sourceY,
                    sourceWidth: layer.sourceWidth,
                    sourceHeight: layer.sourceHeight,
                    alpha: layer.alpha || 1,
                    repeat: layer.repeat !== false
                };
            });

            this.decorations = {
                aerial: (decorations.aerial || []).map((decoration) => this.loadDecoration(decoration)),
                ground: (decorations.ground || []).map((decoration) => this.loadDecoration(decoration))
            };
        }

        loadDecoration(decoration) {
            const image = new Image();

            image.failed = false;
            image.onerror = function () {
                image.failed = true;
                console.warn('Decoracao nao carregou:', decoration.src);
            };
            image.src = decoration.src;

            return {
                name: decoration.name,
                src: decoration.src,
                image: image,
                x: decoration.x,
                y: decoration.y,
                width: decoration.width,
                height: decoration.height,
                sourceX: decoration.sourceX,
                sourceY: decoration.sourceY,
                sourceWidth: decoration.sourceWidth,
                sourceHeight: decoration.sourceHeight,
                parallax: decoration.parallax,
                speedX: decoration.speedX || 0,
                cycleWidth: decoration.cycleWidth,
                alpha: decoration.alpha || 1
            };
        }

        render(ctx, cameraX, canvas) {
            // Cenario novo baseado em assets: o canvas ja foi limpo pelo loop principal.
            // Sistema antigo removido: sem gradiente, faixa de rua ou grid desenhados por codigo.
            const now = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
            let aerialRendered = false;
            let groundRendered = false;

            this.layers.forEach((layer) => {
                this.drawLayer(ctx, cameraX, canvas, layer);

                if (!aerialRendered && layer.type === 'midground') {
                    this.drawDecorations(ctx, cameraX, canvas, this.decorations.aerial, now);
                    aerialRendered = true;
                }

                if (!groundRendered && layer.type === 'ground') {
                    this.drawDecorations(ctx, cameraX, canvas, this.decorations.ground, now);
                    groundRendered = true;
                }
            });

            if (!aerialRendered) {
                this.drawDecorations(ctx, cameraX, canvas, this.decorations.aerial, now);
            }

            if (!groundRendered) {
                this.drawDecorations(ctx, cameraX, canvas, this.decorations.ground, now);
            }
        }

        drawLayer(ctx, cameraX, canvas, layer) {
            if (!imageReady(layer.image)) {
                return;
            }

            // Cenario novo baseado em assets: cada camada usa um PNG real da fase.
            // O recorte permite usar o asset de chao apenas como area jogavel,
            // sem reintroduzir rua, faixa ou plataforma desenhada por codigo.
            const sourceX = typeof layer.sourceX === 'number' ? layer.sourceX : 0;
            const sourceY = typeof layer.sourceY === 'number' ? layer.sourceY : 0;
            const sourceWidth = typeof layer.sourceWidth === 'number' ? layer.sourceWidth : layer.image.naturalWidth;
            const sourceHeight = typeof layer.sourceHeight === 'number' ? layer.sourceHeight : layer.image.naturalHeight;
            const layerHeight = typeof layer.height === 'number' ? layer.height : canvas.height;
            const layerY = typeof layer.y === 'number' ? layer.y : canvas.height - layerHeight;
            const drawWidth = typeof layer.width === 'number' ? layer.width : layerHeight * (sourceWidth / sourceHeight);
            // Nao existe velocidade automatica de runner. O cenario so muda
            // quando cameraX muda, e cameraX segue a posicao da Trix.
            const offset = (cameraX * layer.parallax) % drawWidth;

            ctx.save();
            ctx.globalAlpha = layer.alpha;

            if (layer.repeat) {
                // Repeticao lateral cobre a extensao da fase sem iniciar loop proprio.
                for (let x = -drawWidth - offset; x < canvas.width + drawWidth; x += drawWidth) {
                    ctx.drawImage(layer.image, sourceX, sourceY, sourceWidth, sourceHeight, x, layerY, drawWidth, layerHeight);
                }
            } else {
                ctx.drawImage(layer.image, sourceX, sourceY, sourceWidth, sourceHeight, -cameraX * layer.parallax, layerY, drawWidth, layerHeight);
            }

            ctx.restore();
        }

        drawDecorations(ctx, cameraX, canvas, decorations, now) {
            decorations.forEach((decoration) => {
                this.drawDecoration(ctx, cameraX, canvas, decoration, now);
            });
        }

        drawDecoration(ctx, cameraX, canvas, decoration, now) {
            if (!imageReady(decoration.image)) {
                return;
            }

            const sourceX = typeof decoration.sourceX === 'number' ? decoration.sourceX : 0;
            const sourceY = typeof decoration.sourceY === 'number' ? decoration.sourceY : 0;
            const sourceWidth = typeof decoration.sourceWidth === 'number' ? decoration.sourceWidth : decoration.image.naturalWidth;
            const sourceHeight = typeof decoration.sourceHeight === 'number' ? decoration.sourceHeight : decoration.image.naturalHeight;
            const width = typeof decoration.width === 'number' ? decoration.width : sourceWidth;
            const height = typeof decoration.height === 'number' ? decoration.height : sourceHeight;
            const parallax = typeof decoration.parallax === 'number' ? decoration.parallax : 1;
            const driftX = decoration.speedX ? now / 1000 * decoration.speedX : 0;
            const cycleWidth = typeof decoration.cycleWidth === 'number' ? decoration.cycleWidth : 0;
            let screenX = decoration.x - cameraX * parallax + driftX;

            if (cycleWidth > 0) {
                screenX = ((screenX + width) % cycleWidth + cycleWidth) % cycleWidth - width;
            }

            ctx.save();
            ctx.globalAlpha = decoration.alpha;
            ctx.drawImage(decoration.image, sourceX, sourceY, sourceWidth, sourceHeight, screenX, decoration.y - height, width, height);
            ctx.restore();
        }
    }

    game.BackgroundManager = BackgroundManager;
}(window.CyberVoidAction = window.CyberVoidAction || {}));
