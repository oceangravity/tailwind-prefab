const fs = require('fs');
const path = require('path');
const tailwind = require('tailwindcss');
const postcss = require('postcss');

// Función para convertir una regla CSS al formato JSON deseado
function convertRule(selector, declarations) {
  const className = selector.replace('.', '').replace(/\\/, '');
  const props = declarations.map(d => `${d.prop}: ${d.value}!important`).join('; ');
  const value = `html body * [ƒ__${className}] { ${props} }`;
  return [className, value];
}

// Función para determinar la categoría de una clase
function getCategory(className) {
  const categories = {
    'p-': 'padding',
    'm-': 'margin',
    'w-': 'width',
    'h-': 'height',
    'text-': 'typography',
    'font-': 'typography',
    'bg-': 'background',
    'border-': 'border',
    'flex-': 'flexbox',
    'grid-': 'grid',
    'justify-': 'flexbox',
    'items-': 'flexbox',
    'space-': 'spacing',
    'rounded-': 'border',
    'shadow-': 'effects',
    'opacity-': 'effects',
    'z-': 'layout',
    'top-': 'position',
    'right-': 'position',
    'bottom-': 'position',
    'left-': 'position',
    'overflow-': 'layout',
    'container': 'layout',
    'transition-': 'transitions',
    'animate-': 'animations',
    'cursor-': 'interactivity',
    'focus:': 'interactivity',
    'hover:': 'interactivity',
    'active:': 'interactivity',
    'sm:': 'responsive',
    'md:': 'responsive',
    'lg:': 'responsive',
    'xl:': 'responsive',
    '2xl:': 'responsive'
  };

  for (const [prefix, category] of Object.entries(categories)) {
    if (className.startsWith(prefix)) {
      return category;
    }
  }

  return 'other';
}

// Configuración de Tailwind
const tailwindConfig = {
  content: [{
    raw: String.raw`
      <div class="
        sm:* md:* lg:* xl:* 2xl:*
        hover:* focus:* active:*
        disabled:* checked:* group-hover:*
        dark:* motion-safe:* motion-reduce:*
        first:* last:* odd:* even:*
        after:* before:*
        placeholder:*
      "></div>
    `,
  }],
  theme: {
    extend: {},
  },
  plugins: [],
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
      const outputPath = path.join(outputDir, `tw-${category}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(classes, null, 2));
      console.log(`Archivo JSON para ${category} generado en: ${outputPath}`);
    }

    console.log(`Todos los archivos JSON han sido generados en: ${outputDir}`);
  })
  .catch(error => {
    console.error('Error al generar los archivos JSON:', error);
  });
