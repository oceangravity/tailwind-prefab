const fs = require('fs');
const path = require('path');
const tailwind = require('tailwindcss');
const postcss = require('postcss');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parsear los argumentos de la línea de comandos
const argv = yargs(hideBin(process.argv))
  .option('category', {
    alias: 'c',
    describe: 'Tailwind category to filter (e.g., gap, margin, padding)',
    type: 'string',
    demandOption: true
  })
  .help()
  .argv;

// Función para convertir una regla CSS al formato deseado
function convertRule(selector, declarations) {
  const className = selector.replace('.', '').replace(/\\/g, '');
  const props = declarations.map(d => `${d.prop}: ${d.value} !important`).join('; ');
  const value = `html body * [ø="${className}"] { ${props} }`;
  return [className, value];
}

// Función para determinar si una clase pertenece a la categoría especificada
function belongsToCategory(className, category) {
  const regex = new RegExp(`^-?${category}(-|$)`);
  return regex.test(className) && !className.includes(':');
}

// Configuración de Tailwind
const tailwindConfig = {
  content: [{
    raw: String.raw`<div class="*"></div>`,
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
    let classes = {};

    // Parsear el CSS resultante
    postcss.parse(result.css).walkRules(rule => {
      if (!rule.selector.startsWith('.')) return; // Ignorar selectores que no son clases

      const className = rule.selector.replace('.', '').replace(/\\/g, '');
      if (belongsToCategory(className, argv.category)) {
        const [, value] = convertRule(rule.selector, rule.nodes);
        classes[className] = value;
      }
    });

    // Crear el archivo CSS de salida
    const outputDir = path.join(__dirname, 'tailwind-classes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, `tw-${argv.category}.css`);
    fs.writeFileSync(outputPath, Object.values(classes).join("\n"));
    console.log(`Archivo CSS para la categoría ${argv.category} generado en: ${outputPath}`);
  })
  .catch(error => {
    console.error('Error al generar el archivo CSS:', error);
  });
