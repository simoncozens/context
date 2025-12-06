// webapp/js/glyph-canvas/viewport.js

class ViewportManager {
    constructor(initialScale, panX = 0, panY = 0) {
        this.scale = initialScale;
        this.panX = panX;
        this.panY = panY;
        this.accumulatedVerticalBounds = null; // {minY, maxY} in font space - used by panToGlyph
    }

    getTransformMatrix() {
        // Return a transformation matrix for converting font coordinates to canvas coordinates
        return {
            a: this.scale,
            b: 0,
            c: 0,
            d: -this.scale, // Flip Y axis (font coordinates have Y going up)
            e: this.panX,
            f: this.panY
        };
    }

    /**
     * Transforms canvas-space coordinates to font-space coordinates.
     * @param {number} canvasX - The x-coordinate in canvas space.
     * @param {number} canvasY - The y-coordinate in canvas space.
     * @returns {{x: number, y: number}} The coordinates in font space.
     */
    getFontSpaceCoordinates(canvasX, canvasY) {
        const transform = this.getTransformMatrix();
        const det = transform.a * transform.d - transform.b * transform.c;

        const fontX =
            (transform.d * (canvasX - transform.e) -
                transform.c * (canvasY - transform.f)) /
            det;
        const fontY =
            (transform.a * (canvasY - transform.f) -
                transform.b * (canvasX - transform.e)) /
            det;

        return { x: fontX, y: fontY };
    }

    /**
     * Transforms canvas-space coordinates to the local coordinate system of a specific glyph within the shaped text run.
     * @param {number} canvasX - The x-coordinate in canvas space.
     * @param {number} canvasY - The y-coordinate in canvas space.
     * @param {Array} shapedGlyphs - The array of shaped glyphs from HarfBuzz.
     * @param {number} selectedGlyphIndex - The index of the glyph whose local space we want.
     * @returns {{glyphX: number, glyphY: number}} The coordinates in the glyph's local space.
     */
    getGlyphLocalCoordinates(
        canvasX,
        canvasY,
        shapedGlyphs,
        selectedGlyphIndex
    ) {
        let { x: glyphX, y: glyphY } = this.getFontSpaceCoordinates(
            canvasX,
            canvasY
        );

        if (
            selectedGlyphIndex < 0 ||
            !shapedGlyphs ||
            selectedGlyphIndex >= shapedGlyphs.length
        ) {
            return { glyphX, glyphY };
        }

        // Adjust for the selected glyph's position in the run
        let xPosition = 0;
        for (let i = 0; i < selectedGlyphIndex; i++) {
            xPosition += shapedGlyphs[i].ax || 0;
        }
        const glyph = shapedGlyphs[selectedGlyphIndex];
        const xOffset = glyph.dx || 0;
        const yOffset = glyph.dy || 0;

        glyphX -= xPosition + xOffset;
        glyphY -= yOffset;

        return { glyphX, glyphY };
    }

    /**
     * Zooms the viewport towards a specific point.
     * @param {number} zoomFactor - The factor to zoom by (e.g., 1.1 for zoom in, 0.9 for zoom out).
     * @param {number} mouseX - The canvas x-coordinate to zoom towards.
     * @param {number} mouseY - The canvas y-coordinate to zoom towards.
     * @returns {boolean} - True if zoom happened, false otherwise.
     */
    zoom(zoomFactor, mouseX, mouseY) {
        const newScale = this.scale * zoomFactor;

        // Limit zoom range
        if (newScale < 0.01 || newScale > 100) return false;

        // Adjust pan to zoom toward mouse position
        this.panX = mouseX - (mouseX - this.panX) * zoomFactor;
        this.panY = mouseY - (mouseY - this.panY) * zoomFactor;

        this.scale = newScale;
        return true;
    }

    /**
     * Pans the viewport.
     * @param {number} dx - The change in x.
     * @param {number} dy - The change in y.
     */
    pan(dx, dy) {
        this.panX += dx;
        this.panY += dy;
    }

    animateZoomAndPan(targetScale, targetPanX, targetPanY, renderCallback) {
        // Animate zoom and pan together
        const startScale = this.scale;
        const startPanX = this.panX;
        const startPanY = this.panY;
        const frames = 10;
        let currentFrame = 0;

        const animate = () => {
            currentFrame++;
            const progress = Math.min(currentFrame / frames, 1.0);

            // Ease-out cubic for smooth deceleration
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            // Interpolate scale and pan values
            this.scale =
                startScale + (targetScale - startScale) * easedProgress;
            this.panX = startPanX + (targetPanX - startPanX) * easedProgress;
            this.panY = startPanY + (targetPanY - startPanY) * easedProgress;

            renderCallback();

            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                // Ensure we end exactly at target
                this.scale = targetScale;
                this.panX = targetPanX;
                this.panY = targetPanY;
                renderCallback();
            }
        };

        animate();
    }

    animatePan(targetPanX, targetPanY, renderCallback) {
        // Set up animation state
        const startPanX = this.panX;
        const startPanY = this.panY;
        const frames = 10;
        let currentFrame = 0;

        const animate = () => {
            currentFrame++;
            const progress = Math.min(currentFrame / frames, 1.0);

            // Ease-out cubic for smooth deceleration
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            // Interpolate pan values
            this.panX = startPanX + (targetPanX - startPanX) * easedProgress;
            this.panY = startPanY + (targetPanY - startPanY) * easedProgress;

            renderCallback();

            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                // Ensure we end exactly at target
                this.panX = targetPanX;
                this.panY = targetPanY;
                renderCallback();
            }
        };

        animate();
    }

    /**
     * Frame a glyph to fit within the viewport with margin.
     * Uses animated camera movement (10 frames).
     * @param {Object} bounds - The glyph bounding box {minX, maxX, minY, maxY, width, height}
     * @param {Object} glyphPosition - Glyph position in text run {xPosition, xOffset, yOffset}
     * @param {DOMRect} canvasRect - The canvas bounding rectangle
     * @param {Function} renderCallback - Callback to render after each frame
     * @param {number} margin - Canvas margin in pixels (defaults to CANVAS_MARGIN setting)
     */
    frameGlyph(bounds, glyphPosition, canvasRect, renderCallback, margin = null) {
        // Use setting if no margin specified
        if (margin === null) {
            margin = APP_SETTINGS.OUTLINE_EDITOR.CANVAS_MARGIN;
        }

        // Reset accumulated vertical bounds on frame operation
        this.accumulatedVerticalBounds = null;

        // Calculate center of the bounding box in glyph-local space
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        // Convert bbox center to font space
        const fontSpaceCenterX = glyphPosition.xPosition + glyphPosition.xOffset + centerX;
        const fontSpaceCenterY = glyphPosition.yOffset + centerY;

        // Calculate the scale needed to fit the bounding box with margin
        const scaleX = (canvasRect.width - margin * 2) / bounds.width;
        const scaleY = (canvasRect.height - margin * 2) / bounds.height;
        const targetScale = Math.min(scaleX, scaleY);

        // Clamp scale to reasonable limits (max zoom from settings to avoid over-zooming small glyphs)
        const clampedScale = Math.max(
            0.01,
            Math.min(
                APP_SETTINGS.OUTLINE_EDITOR.MAX_ZOOM_FOR_CMD_ZERO,
                targetScale
            )
        );

        // Calculate pan to center the glyph both horizontally and vertically
        const targetPanX = canvasRect.width / 2 - fontSpaceCenterX * clampedScale;
        // Note: Y is flipped in canvas, so we negate fontSpaceCenterY
        const targetPanY = canvasRect.height / 2 - -fontSpaceCenterY * clampedScale;

        // Animate to target
        this.animateZoomAndPan(
            clampedScale,
            targetPanX,
            targetPanY,
            renderCallback
        );
    }

    /**
     * Pan to show a specific glyph (used when switching glyphs with keyboard shortcuts).
     * Uses accumulated vertical bounds to maintain consistent vertical view.
     * @param {Object} bounds - The glyph bounding box {minX, maxX, minY, maxY, width, height}
     * @param {Object} glyphPosition - Glyph position in text run {xPosition, xOffset, yOffset}
     * @param {DOMRect} canvasRect - The canvas bounding rectangle
     * @param {Function} renderCallback - Callback to render after each frame
     * @param {number} margin - Canvas margin in pixels (defaults to CANVAS_MARGIN setting)
     */
    panToGlyph(bounds, glyphPosition, canvasRect, renderCallback, margin = null) {
        // Use setting if no margin specified
        if (margin === null) {
            margin = APP_SETTINGS.OUTLINE_EDITOR.CANVAS_MARGIN;
        }

        console.log('ViewportManager.panToGlyph: calculated bounds', bounds);

        // Calculate the full bounding box in font space
        const fontSpaceMinX = glyphPosition.xPosition + glyphPosition.xOffset + bounds.minX;
        const fontSpaceMaxX = glyphPosition.xPosition + glyphPosition.xOffset + bounds.maxX;
        const fontSpaceMinY = glyphPosition.yOffset + bounds.minY;
        const fontSpaceMaxY = glyphPosition.yOffset + bounds.maxY;

        // Update accumulated vertical bounds
        if (!this.accumulatedVerticalBounds) {
            this.accumulatedVerticalBounds = {
                minY: fontSpaceMinY,
                maxY: fontSpaceMaxY
            };
        } else {
            this.accumulatedVerticalBounds.minY = Math.min(
                this.accumulatedVerticalBounds.minY,
                fontSpaceMinY
            );
            this.accumulatedVerticalBounds.maxY = Math.max(
                this.accumulatedVerticalBounds.maxY,
                fontSpaceMaxY
            );
        }

        const accumulatedHeight =
            this.accumulatedVerticalBounds.maxY -
            this.accumulatedVerticalBounds.minY;
        const accumulatedCenterY =
            (this.accumulatedVerticalBounds.minY +
                this.accumulatedVerticalBounds.maxY) /
            2;

        console.log('ViewportManager.panToGlyph: accumulated vertical bounds', {
            minY: this.accumulatedVerticalBounds.minY,
            maxY: this.accumulatedVerticalBounds.maxY,
            height: accumulatedHeight,
            centerY: accumulatedCenterY
        });

        const currentScale = this.scale;
        const availableWidth = canvasRect.width - margin * 2;
        const availableHeight = canvasRect.height - margin * 2;

        let targetScale = currentScale;
        let targetPanX = this.panX;
        let targetPanY = this.panY;

        // Check if current glyph fits within the viewport at current scale
        const currentScreenLeft = fontSpaceMinX * currentScale + this.panX;
        const currentScreenRight = fontSpaceMaxX * currentScale + this.panX;
        const currentScreenTop = -fontSpaceMaxY * currentScale + this.panY;
        const currentScreenBottom = -fontSpaceMinY * currentScale + this.panY;

        const fitsHorizontally =
            currentScreenLeft >= margin &&
            currentScreenRight <= canvasRect.width - margin;
        const fitsVertically =
            currentScreenTop >= margin &&
            currentScreenBottom <= canvasRect.height - margin;

        // Only adjust viewport if glyph doesn't fit comfortably
        if (!fitsHorizontally || !fitsVertically) {
            // Calculate scale to fit accumulated vertical height (zoom out only if needed)
            const scaleY = availableHeight / accumulatedHeight;
            const scaleX = availableWidth / bounds.width;
            targetScale = Math.min(scaleY, scaleX, currentScale); // Don't zoom in, only out
            // Clamp to reasonable limits
            targetScale = Math.max(0.01, Math.min(100, targetScale));

            // If scale changed, we need to adjust panX to maintain horizontal position
            // When zooming, content shifts relative to viewport center
            if (targetScale !== currentScale) {
                const scaleFactor = targetScale / currentScale;
                const centerX = canvasRect.width / 2;
                // Adjust panX to keep the horizontal center point stable during zoom
                targetPanX =
                    centerX -
                    (centerX - this.panX) * scaleFactor;
            }

            // Center vertically on the accumulated bounds
            // Note: Y is flipped in canvas, so we negate accumulatedCenterY
            targetPanY = canvasRect.height / 2 - -accumulatedCenterY * targetScale;

            console.log(
                'ViewportManager.panToGlyph: centering vertically on accumulated bounds',
                {
                    accumulatedCenterY,
                    targetPanY,
                    targetScale,
                    scaleFactor: targetScale / currentScale
                }
            );

            // Pan horizontally: only move if glyph is outside the viewport margins
            // IMPORTANT: Calculate screen position with the NEW scale and adjusted panX
            const screenLeftAfterZoom = fontSpaceMinX * targetScale + targetPanX;
            const screenRightAfterZoom = fontSpaceMaxX * targetScale + targetPanX;

            // Calculate how far outside the viewport the glyph extends
            const leftOverhang = margin - screenLeftAfterZoom; // Positive if glyph is off left edge
            const rightOverhang = screenRightAfterZoom - (canvasRect.width - margin); // Positive if glyph is off right edge

            if (leftOverhang > 0) {
                // Glyph extends past left edge - pan right just enough to bring it to margin
                targetPanX = targetPanX + leftOverhang;
            } else if (rightOverhang > 0) {
                // Glyph extends past right edge - pan left just enough to bring it to margin
                targetPanX = targetPanX - rightOverhang;
            }
            // If glyph is within margins horizontally, don't change targetPanX (keep adjusted pan)

            console.log('ViewportManager.panToGlyph: panning to', {
                targetScale,
                targetPanX,
                targetPanY,
                scaleChanged: targetScale !== currentScale
            });

            // Animate to target (zoom and pan together if scale changed, otherwise just pan)
            if (targetScale !== currentScale) {
                this.animateZoomAndPan(
                    targetScale,
                    targetPanX,
                    targetPanY,
                    renderCallback
                );
            } else {
                this.animatePan(
                    targetPanX,
                    targetPanY,
                    renderCallback
                );
            }
        } else {
            console.log(
                'ViewportManager.panToGlyph: glyph fits comfortably, no viewport adjustment needed'
            );
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ViewportManager };
}
