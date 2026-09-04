/**
 * Minimal type declarations for `d3-org-chart` v3 (the package ships no types).
 * Only the surface this app uses is described; everything else is permissive.
 * Upstream API reference: https://github.com/bumbeishvili/org-chart
 */
declare module 'd3-org-chart' {
  export interface OrgChartNode<D = unknown> {
    data: D
    children?: OrgChartNode<D>[]
    parent?: OrgChartNode<D> | null
    depth: number
    height: number
    // d3-org-chart stamps runtime flags onto node / node.data:
    _expanded?: boolean
    [key: string]: unknown
  }

  export type Accessor<T, D = unknown> = (node: OrgChartNode<D>) => T

  // The library is a fluent builder: every setter returns `this`. Typing each
  // setter as an overload that returns the chart keeps chaining ergonomic
  // without enumerating the (large) option surface exhaustively.
  export class OrgChart<D = Record<string, unknown>> {
    constructor()

    container(value: string | HTMLElement): this
    data(value: D[] | null): this
    data(): D[] | null

    svgWidth(value: number): this
    svgHeight(value: number): this
    nodeWidth(value: Accessor<number, D>): this
    nodeHeight(value: Accessor<number, D>): this
    childrenMargin(value: Accessor<number, D>): this
    siblingsMargin(value: Accessor<number, D>): this
    neighbourMargin(value: (a: OrgChartNode<D>, b: OrgChartNode<D>) => number): this
    compactMarginBetween(value: Accessor<number, D>): this
    compactMarginPair(value: Accessor<number, D>): this
    compact(value: boolean): this
    layout(value: 'top' | 'bottom' | 'left' | 'right'): this
    rootMargin(value: number): this
    initialZoom(value: number): this
    initialExpandLevel(value: number): this
    scaleExtent(value: [number, number]): this
    duration(value: number): this
    // nodeId / parentNodeId receive the RAW datum (used during d3.stratify),
    // not a hierarchy node.
    nodeId(value: (datum: D) => string): this
    parentNodeId(value: (datum: D) => string | null | undefined): this
    nodeContent(value: (node: OrgChartNode<D>, index: number, nodes: OrgChartNode<D>[], state: unknown) => string): this
    buttonContent(value: (params: { node: OrgChartNode<D>; state: unknown }) => string): this
    nodeUpdate(value: (this: SVGGElement, node: OrgChartNode<D>, index: number, nodes: SVGGElement[]) => void): this
    linkUpdate(value: (this: SVGPathElement, node: OrgChartNode<D>, index: number, nodes: SVGPathElement[]) => void): this
    onNodeClick(value: (node: OrgChartNode<D>) => void): this
    onExpandOrCollapse(value: (node: OrgChartNode<D>) => void): this
    nodeButtonWidth(value: Accessor<number, D>): this
    nodeButtonHeight(value: Accessor<number, D>): this

    render(): this
    fit(params?: { animate?: boolean; nodes?: OrgChartNode<D>[]; scale?: boolean }): this
    expandAll(): this
    collapseAll(): this
    setExpanded(id: string, flag?: boolean): this
    setCentered(id: string): this
    setHighlighted(id: string): this
    setUpToTheRootHighlighted(id: string): this
    clearHighlighting(): this
    addNode(node: D): this
    removeNode(id: string): this
    zoomIn(): this
    zoomOut(): this
    exportImg(params?: {
      full?: boolean
      scale?: number
      save?: boolean
      backgroundColor?: string
      onLoad?: (base64: string) => void
    }): this
    exportSvg(): this
    getChartState(): Record<string, unknown>
    fullscreen(el?: HTMLElement): this
  }
}
