declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Side-effect imports of plain stylesheets (e.g. `import './globals.scss'`).
// TypeScript 6 (TS2882) requires a declaration for side-effect imports of
// otherwise-untyped modules.
declare module '*.scss';
