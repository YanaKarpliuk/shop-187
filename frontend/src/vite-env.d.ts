/// <reference types="vite/client" />

// Vite's ambient declarations. Without this file, TypeScript has no type for
// the non-TS things Vite lets you import — `import './index.css'` in main.tsx
// is a module it cannot resolve (TS2882), and `import.meta.env` is untyped.
//
// Vite itself never needed it: the CSS import is handled by the bundler, so
// the app built and ran regardless. Only the type checker was missing the
// declaration, and only a strict enough one complained.
