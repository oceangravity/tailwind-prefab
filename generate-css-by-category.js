const fs = require('fs');
const path = require('path');
const tailwind = require('tailwindcss');
const postcss = require('postcss');

// Función para convertir una regla CSS al formato JSON deseado
function convertRule(selector, declarations) {
  const className = selector.replace('.', '').replace(/\\/g, '');
  const props = declarations.map(d => `${d.prop}: ${d.value} !important`).join('; ');
  const value = `html body * [ø="${className}"] { ${props} }`;
  return [className, value];
}

// Función para determinar la categoría de una clase
function getCategory(className) {
  const categories = {
    // Layout
    'inset-inline-start': 'output'
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
      const outputPath = path.join(outputDir, `tw-${category}.css`);
      fs.writeFileSync(outputPath, Object.values(classes).join("\n"));
      console.log(`Archivo JSON para ${category} generado en: ${outputPath}`);
    }

    console.log(`Todos los archivos JSON han sido generados en: ${outputDir}`);
  })
  .catch(error => {
    console.error('Error al generar los archivos JSON:', error);
  });
