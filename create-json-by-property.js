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
    describe: 'Tailwind category to filter (e.g., grid-cols, gap, m, p)',
    type: 'string',
    demandOption: true
  })
  .help()
  .argv;

// Función para extraer el valor de una clase Tailwind
function extractValue(className, category) {
  const prefix = new RegExp(`^-?${category}-`);
  return className.replace(prefix, '');
}

// Función para determinar si una clase pertenece a la categoría especificada
function belongsToCategory(className, category) {
  const regex = new RegExp(`^-?${category}-`);
  return regex.test(className) && !className.includes(':');
}

// Función para determinar si un valor es una fracción
function isFraction(value) {
  return value.includes('/');
}

// Función para determinar si un valor es un número (entero o decimal)
function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// Función para comparar valores y ordenarlos
function compareValues(a, b) {
  const isNumA = isNumber(a);
  const isNumB = isNumber(b);
  const isFracA = isFraction(a);
  const isFracB = isFraction(b);

  // Si ambos son números, compararlos numéricamente
  if (isNumA && isNumB) {
    return parseFloat(a) - parseFloat(b);
  }

  // Si uno es número y el otro no, el número va primero
  if (isNumA) return -1;
  if (isNumB) return 1;

  // Si ambos son fracciones, compararlos como fracciones
  if (isFracA && isFracB) {
    const [numA, denA] = a.split('/').map(Number);
    const [numB, denB] = b.split('/').map(Number);
    return (numA/denA) - (numB/denB);
  }

  // Si uno es fracción y el otro no, la fracción va primero
  if (isFracA) return -1;
  if (isFracB) return 1;

  // Para todo lo demás, comparar alfabéticamente
  return a.localeCompare(b);
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
    let values = new Set();

    // Parsear el CSS resultante
    postcss.parse(result.css).walkRules(rule => {
      if (!rule.selector.startsWith('.')) return; // Ignorar selectores que no son clases

      const className = rule.selector.replace('.', '').replace(/\\/g, '');
      if (belongsToCategory(className, argv.category)) {
        const value = extractValue(className, argv.category);
        values.add(value);
      }
    });

    // Convertir Set a Array y ordenar
    const sortedValues = Array.from(values).sort(compareValues);

    // Crear el archivo JSON de salida
    const outputPath = path.join(__dirname, 'PropertyValues.json');
    fs.writeFileSync(outputPath, JSON.stringify(sortedValues, null, 2));
    console.log(`Archivo JSON para la categoría ${argv.category} generado en: ${outputPath}`);
  })
  .catch(error => {
    console.error('Error al generar el archivo JSON:', error);
  });
