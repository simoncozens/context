describe('GlyphCanvas onMouseMove', () => {
    let canvas;

    beforeEach(() => {
        document.body.innerHTML = '<div id="test-container"></div>';
        canvas = new GlyphCanvas('test-container');
        // Set up mock state
        canvas.selectedGlyphIndex = 0;
        canvas.shapedGlyphs = [{ ax: 1000, dx: 0, dy: 0, g: 0 }];
        canvas.layerData = {
            shapes: [
                { Component: { transform: [1, 0, 0, 1, 0, 0] } },
                { nodes: [[0, 0, 'l']] }
            ],
            anchors: [{ x: 0, y: 0 }]
        };
        canvas.selectedComponents = [0];
        canvas.selectedPoints = [{ contourIndex: 1, nodeIndex: 0 }];
        canvas.selectedAnchors = [0];
        canvas.viewportManager = new ViewportManager(1, 0, 0);
        canvas.lastGlyphX = null;
        canvas.lastGlyphY = null;
    });

    test('handles component dragging correctly', () => {
        canvas.isDraggingComponent = true;
        // First move sets the initial position, delta is 0
        canvas.onMouseMove({ clientX: 10, clientY: 20 });
        expect(canvas.layerData.shapes[0].Component.transform[4]).toBe(0);
        expect(canvas.layerData.shapes[0].Component.transform[5]).toBe(0);

        // Second move performs the drag
        canvas.onMouseMove({ clientX: 25, clientY: 15 });
        // deltaX = 25 - 10 = 15
        // deltaY = -15 - (-20) = 5
        expect(canvas.layerData.shapes[0].Component.transform[4]).toBe(15);
        expect(canvas.layerData.shapes[0].Component.transform[5]).toBe(5);
    });

    test('handles anchor dragging correctly', () => {
        canvas.isDraggingAnchor = true;
        canvas.onMouseMove({ clientX: 10, clientY: 20 });
        canvas.onMouseMove({ clientX: 25, clientY: 15 });
        expect(canvas.layerData.anchors[0].x).toBe(15);
        expect(canvas.layerData.anchors[0].y).toBe(5);
    });

    test('handles point dragging correctly', () => {
        canvas.isDraggingPoint = true;
        canvas.onMouseMove({ clientX: 10, clientY: 20 });
        canvas.onMouseMove({ clientX: 25, clientY: 15 });
        expect(canvas.layerData.shapes[1].nodes[0][0]).toBe(15);
        expect(canvas.layerData.shapes[1].nodes[0][1]).toBe(5);
    });
});
