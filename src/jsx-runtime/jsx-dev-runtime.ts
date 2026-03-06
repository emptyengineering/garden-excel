/**
 * Development-time JSX factory used by TypeScript's dev transform.
 *
 * It mirrors the production runtime because this project does not need React's
 * extra dev metadata.
 */
function jsxDEV(type: any, props: any) {
  if (typeof type === 'function') {
    return type(props);
  }
  return { type, props };
}

export { jsxDEV };
