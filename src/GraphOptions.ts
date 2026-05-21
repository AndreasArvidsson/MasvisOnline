export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (...args: unknown[]) => unknown
        ? T[P]
        : T[P] extends readonly (infer U)[]
          ? U[]
          : T[P] extends object
            ? DeepPartial<T[P]>
            : T[P];
};

export type GraphData = ArrayLike<number>;
export type NullableNumber = number | null;
export type Formatter = (
    value: number,
    defaultFormatter: (value: number) => string,
) => string;
export type ValueFormatter = (value: number) => number;
export type Ticker = (min: number, max: number, count: number) => number[];

export interface GraphOptionsObject {
    debug: boolean;
    offset: string | number;
    interaction: InteractionOptions;
    title: TitleOptions;
    legend: LegendOptions;
    highlight: RangeOptions & { color: string };
    zoom: RangeOptions;
    graph: CurveOptions;
    axes: AxesOptions;
    border: BorderOptions;
    spinner: SpinnerOptions;
}

export type GraphOptions = DeepPartial<GraphOptionsObject>;

export interface InteractionOptions {
    resize: boolean;
    trackMouse: boolean;
    zoom: boolean;
    smoothing: boolean;
}

export interface TitleOptions {
    label: string;
    bold: boolean;
    size: number;
    offsetX: number;
    offsetY: number;
    padding: number;
    font: string;
    color: string;
    align: string;
}

export interface LegendOptions {
    location: "top" | "bottom" | "left" | "right";
    show: boolean;
    font: string;
    size: number;
    offsetX: number;
    offsetY: number;
    padding: number;
    align: string;
    newLine: boolean;
}

export interface RangeOptions {
    xMin: NullableNumber;
    xMax: NullableNumber;
    yMin: NullableNumber;
    yMax: NullableNumber;
}

export interface CurveOptions {
    dataX: GraphData[];
    dataY: GraphData[];
    colors: string[];
    names: string[];
    dashed: (boolean | number[])[];
    lineWidth: number;
    markerRadius: number;
    smoothing: number;
    simplify: number;
    simplifyBy: string;
    fill: boolean;
    compositeOperation: GlobalCompositeOperation;
}

export interface AxesOptions {
    tickMarkers: TickMarkerOptions;
    tickLabels: TickLabelOptions;
    labels: AxisLabelOptions;
    x: AxisOptions & { height: number };
    y: AxisOptions & { width: number };
}

export interface TickMarkerOptions {
    show: boolean;
    length: number;
    width: number;
    offset: number;
    color: string;
}

export interface TickLabelOptions {
    show: boolean;
    color: string;
    font: string;
    size: number;
    width: number;
    offset: number;
    padding: number;
}

export interface AxisLabelOptions {
    color: string;
    font: string;
    size: number;
    offset: number;
    padding: number;
}

export interface AxisOptions {
    show: boolean;
    inverted: boolean;
    log: boolean;
    label: string;
    numTicks: number;
    legendValueFormatter: Formatter | null;
    tickerValuePreFormatter: ValueFormatter | null;
    tickerValuePostFormatter: ValueFormatter | null;
    tickerLabelFormatter: Formatter | null;
    ticker: Ticker | null;
    valueFormatter: Formatter | null;
    grid: GridOptions;
    bounds: BoundsOptions;
}

export interface GridOptions {
    width: number;
    color: string;
}

export interface BoundsOptions {
    min: NullableNumber;
    max: NullableNumber;
}

export interface BorderOptions {
    style: string;
    color: string;
    width: string;
}

export interface SpinnerOptions {
    show: boolean;
    lines: number;
    length: number;
    width: number;
    radius: number;
    corners: number;
    rotate: number;
    direction: 1 | -1;
    color: string | string[];
    speed: number;
    trail: number;
    shadow: boolean;
    hwaccel: boolean;
    position: string;
    top: string;
    left: string;
}
