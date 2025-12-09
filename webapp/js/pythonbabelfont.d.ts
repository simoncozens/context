export namespace PythonBabelfont {
    /**
     * A layer of a glyph in a font
     */
    export type Layer = {
        /**
         * The advance width of the layer
         */
        width: number;
        height?: number;
        vertWidth?: number;

        /**
         * The name of the layer
         */
        name?: string;

        /**
         * The ID of the layer
         */
        id?: string;

        /**
         * The relationship between this layer and a master, if any
         */
        _master?: string;

        /**
         * Guidelines in the layer
         */
        guides?: PythonBabelfont.Guide[];

        /**
         * Shapes (paths and components) in the layer
         */
        shapes?: PythonBabelfont.Shape[];

        /**
         * Anchors in the layer
         */
        anchors?: PythonBabelfont.Anchor[];

        /**
         * The color of the layer
         */
        color?: PythonBabelfont.Color;

        /**
         * The index of the layer in a color font
         */
        layerIndex?: number;

        /**
         * Whether this layer is a background layer
         */
        isBackground?: boolean;

        /**
         * The ID of the background layer for this layer, if any
         */
        background?: string;

        /**
         * The location of the layer in design space, if it is not at the default location for a master
         */
        location?: Record<string, number>;

        /**
         * Format-specific data for the layer
         */
        format_specific?: any;
    };
    export type Guide = {
        pos: PythonBabelfont.Position;
        name: string;
        color?: PythonBabelfont.Color;
    };
    export type Position = {
        x: number;
        y: number;
        angle: number;
    };
    export type Color = {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    export type Anchor = {
        name: string;
        x: number;
        y: number;
    };
    export type Shape = PythonBabelfont.Path | PythonBabelfont.Component;
    export type Path = {
        nodes: PythonBabelfont.Node[];
        closed: boolean;
        direction?: number;
    };
    export type Component = {
        ref: string;
        transform?: Transform;
    };
    export type Node = {
        x: number;
        y: number;
        type: 'o' | 'c' | 'q' | 'l' | 'cs' | 'qs';
    };
}
