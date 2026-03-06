/// <reference path="../jsx-types.d.ts" />

/**
 * Create a JSX element for this library's custom runtime.
 *
 * Component functions are invoked directly and intrinsic tags are left as raw
 * objects so TypeScript can reject them while the runtime stays minimal.
 */
function jsx(type: any, props: any) {
  if (typeof type === 'function') {
    return type(props);
  }

  return { type, props };
}

export { jsx, jsx as jsxs };

/**
 * Pass fragment children through unchanged.
 */
export const Fragment = ({ children }: { children: any }) => children;
