import type { AnyNode, ChildNode } from './types';

/*
 * TypeScript's JSX support needs type declarations in addition to the runtime
 * functions exported from `@jsx-runtime/jsx-runtime` and
 * `@jsx-runtime/jsx-dev-runtime`.
 *
 * This file teaches the language server that this project's JSX produces our
 * own Workbook node tree rather than, for instance, React elements.
 *
 * It also intentionally rejects intrinsic tags like `<div />` by leaving
 * `IntrinsicElements` empty, which keeps the DSL limited to the components
 * exported by this library.
 */
type JSXNode = AnyNode;

declare global {
  namespace JSX {
    type Element = JSXNode;

    interface ElementChildrenAttribute {
      children: ChildNode;
    }

    interface IntrinsicAttributes {
      key?: string | number;
    }

    interface IntrinsicElements {}
  }
}

declare module '@jsx-runtime/jsx-runtime' {
  export namespace JSX {
    type Element = globalThis.JSX.Element;
    interface ElementChildrenAttribute extends globalThis.JSX.ElementChildrenAttribute {}
    interface IntrinsicAttributes extends globalThis.JSX.IntrinsicAttributes {}
    interface IntrinsicElements extends globalThis.JSX.IntrinsicElements {}
  }
}

declare module '@jsx-runtime/jsx-dev-runtime' {
  export namespace JSX {
    type Element = globalThis.JSX.Element;
    interface ElementChildrenAttribute extends globalThis.JSX.ElementChildrenAttribute {}
    interface IntrinsicAttributes extends globalThis.JSX.IntrinsicAttributes {}
    interface IntrinsicElements extends globalThis.JSX.IntrinsicElements {}
  }
}
