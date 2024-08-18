const fs = require('fs');
const path = require('path');
const tailwind = require('tailwindcss');
const postcss = require('postcss');

// Función para convertir una regla CSS al formato JSON deseado
function convertRule(selector, declarations) {
  const className = selector.replace('.', '').replace(/\\/g, '');
  const props = declarations.map(d => `${d.prop}: ${d.value} !important`).join('; ');
  const value = `html body * ["ƒ__${className}"] { ${props} }`;
  return [className, value];
}

// Función para determinar la categoría de una clase
function getCategory(className) {
  const categories = {
    // Layout
    'container': 'layout-container',
    'box-': 'layout-box-sizing',
    'float-': 'layout-float',
    'clear-': 'layout-clear',
    'object-': 'layout-object-fit',
    'overflow-': 'layout-overflow',
    'overscroll-': 'layout-overscroll',
    'position-': 'layout-position',
    'top-': 'layout-top-right-bottom-left',
    'right-': 'layout-top-right-bottom-left',
    'bottom-': 'layout-top-right-bottom-left',
    'left-': 'layout-top-right-bottom-left',
    'visible': 'layout-visibility',
    'invisible': 'layout-visibility',
    'z-': 'layout-z-index',

    // Flexbox & Grid
    'flex': 'flexbox-flex',
    'flex-': 'flexbox-flex',
    'grid-': 'grid',
    'grid': 'grid',
    'gap-': 'flexbox-grid-gap',
    'justify-': 'flexbox-grid-justify',
    'content-': 'flexbox-grid-align',
    'items-': 'flexbox-grid-align',
    'self-': 'flexbox-grid-align',
    'place-': 'flexbox-grid-place',
    'order-': 'flexbox-grid-order',

    // Spacing
    'm-': 'spacing-margin',
    'mx-': 'spacing-margin',
    'my-': 'spacing-margin',
    'mt-': 'spacing-margin',
    'mr-': 'spacing-margin',
    'mb-': 'spacing-margin',
    'ml-': 'spacing-margin',
    'p-': 'spacing-padding',
    'px-': 'spacing-padding',
    'py-': 'spacing-padding',
    'pt-': 'spacing-padding',
    'pr-': 'spacing-padding',
    'pb-': 'spacing-padding',
    'pl-': 'spacing-padding',
    'space-': 'spacing-space',

    // Sizing
    'w-': 'sizing-width',
    'min-w-': 'sizing-width',
    'max-w-': 'sizing-width',
    'h-': 'sizing-height',
    'min-h-': 'sizing-height',
    'max-h-': 'sizing-height',

    // Typography
    'font-': 'typography-font',
    'text-': 'typography-text',
    'tracking-': 'typography-letter-spacing',
    'leading-': 'typography-line-height',
    'list-': 'typography-lists',
    'placeholder-': 'typography-placeholder',

    // Backgrounds
    'bg-': 'backgrounds',

    // Borders
    'border': 'borders',
    'border-': 'borders',
    'rounded': 'borders-border-radius',
    'rounded-': 'borders-border-radius',

    // Effects
    'shadow': 'effects-box-shadow',
    'shadow-': 'effects-box-shadow',
    'opacity-': 'effects-opacity',
    'mix-blend-': 'effects-mix-blend',
    'bg-blend-': 'effects-background-blend',

    // Filters
    'filter': 'filters',
    'blur-': 'filters',
    'brightness-': 'filters',
    'contrast-': 'filters',
    'drop-shadow-': 'filters',
    'grayscale-': 'filters',
    'hue-rotate-': 'filters',
    'invert-': 'filters',
    'saturate-': 'filters',
    'sepia-': 'filters',

    // Tables
    'table-': 'tables',

    // Transitions & Animation
    'transition': 'transitions-and-animation',
    'transition-': 'transitions-and-animation',
    'duration-': 'transitions-and-animation',
    'ease-': 'transitions-and-animation',
    'delay-': 'transitions-and-animation',
    'animate-': 'transitions-and-animation',

    // Transforms
    'scale-': 'transforms',
    'rotate-': 'transforms',
    'translate-': 'transforms',
    'skew-': 'transforms',
    'transform': 'transforms',

    // Interactivity
    'accent-': 'interactivity',
    'appearance-': 'interactivity',
    'cursor-': 'interactivity',
    'outline-': 'interactivity',
    'pointer-events-': 'interactivity',
    'resize-': 'interactivity',
    'scroll-': 'interactivity',
    'snap-': 'interactivity',
    'touch-': 'interactivity',
    'select-': 'interactivity',
    'will-change-': 'interactivity',

    // SVG
    'fill-': 'svg',
    'stroke-': 'svg',

    // Accessibility
    'sr-': 'accessibility',

    // Official Tailwind Plugins
    'aspect-': 'aspect-ratio',
    'line-clamp-': 'line-clamp',
  };

  // Check for responsive and state variants
  const variants = ['sm:'];

  for (const variant of variants) {
    if (className.startsWith(variant)) {
      return `variants-${variant.slice(0, -1)}`;
    }
  }

  for (const [prefix, category] of Object.entries(categories)) {
    if (className.startsWith(prefix) || className.startsWith(`-${prefix}`)) {
      return category;
    }
  }

  return 'uncategorized';
}

// Configuración de Tailwind
const tailwindConfig = {
  content: [{
    raw: String.raw`
      <div class="-inset-* -m-* -p-* -top-* -right-* -bottom-* -left-*"></div>
    `,
  }],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/aspect-ratio')
  ],
  safelist: [{pattern: /.*/}],
};

// Contenido CSS mínimo para activar todas las clases de Tailwind
const inputCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

// Procesar el CSS con Tailwind
postcss([
  tailwind(tailwindConfig),
])
  .process(inputCSS, {from: undefined})
  .then(result => {
    let categories = {};

    // Parsear el CSS resultante
    postcss.parse(result.css).walkRules(rule => {
      if (!rule.selector.startsWith('.')) return; // Ignorar selectores que no son clases

      const [className, value] = convertRule(rule.selector, rule.nodes);
      const category = getCategory(className);

      if (!categories[category]) {
        categories[category] = {};
      }
      categories[category][className] = value;
    });

    // Crear carpeta para los archivos JSON
    const outputDir = path.join(__dirname, 'tailwind-classes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Escribir cada categoría en un archivo JSON separado
    for (const [category, classes] of Object.entries(categories)) {
      const outputPath = path.join(outputDir, `tw-${category}.css`);
      fs.writeFileSync(outputPath, Object.values(classes).join("\n"));
      console.log(`Archivo JSON para ${category} generado en: ${outputPath}`);
    }

    console.log(`Todos los archivos JSON han sido generados en: ${outputDir}`);
  })
  .catch(error => {
    console.error('Error al generar los archivos JSON:', error);
  });
