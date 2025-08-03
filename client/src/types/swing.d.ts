declare module 'swing' {
  export interface SwingStackOptions {
    allowedDirections?: any[];
    throwOutConfidence?: (xOffset: number, yOffset: number, element: HTMLElement) => number;
    rotation?: (xOffset: number, yOffset: number, element: HTMLElement) => number;
    transform?: (element: HTMLElement, x: number, y: number, r: number) => void;
    throwOutDistance?: (xOffset: number, yOffset: number, element: HTMLElement) => number;
  }

  export interface ThrowOutEvent {
    target: HTMLElement;
    throwDirection: any;
  }

  export interface SwingStack {
    createCard(element: HTMLElement): any;
    on(event: string, handler: (eventObject: ThrowOutEvent) => void): void;
    off(event: string, handler?: Function): void;
    getCard(element: HTMLElement): any;
  }

  export interface SwingDirection {
    LEFT: any;
    RIGHT: any;
    UP: any;
    DOWN: any;
  }

  export const Direction: SwingDirection;
  export function Stack(options?: SwingStackOptions): SwingStack;
}