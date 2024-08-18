const fs = require('fs');
const path = require('path');
const tailwind = require('tailwindcss');
const postcss = require('postcss');

// Función para convertir una regla CSS al formato deseado
function convertRule(selector, declarations) {
  const className = selector.replace('.', 'ƒ__').replace(/\\/, '');
  const props = declarations.map(d => `    ${d.prop}: ${d.value} !important;`).join('\n');
  return `html body * ["${className}"] {\n${props}\n}\n`;
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
  safelist: [{ pattern: /.*/ }],
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
  .process(inputCSS, { from: undefined })
  .then(result => {
    let output = '';

    // Parsear el CSS resultante
    postcss.parse(result.css).walkRules(rule => {
      if (!rule.selector.startsWith('.')) return; // Ignorar selectores que no son clases

      output += convertRule(rule.selector, rule.nodes);
    });

    // Escribir el resultado en un archivo
    const outputPath = path.join(__dirname, 'tailwind-classes.css');
    fs.writeFileSync(outputPath, output);
    console.log(`Archivo CSS generado con éxito en: ${outputPath}`);
  })
  .catch(error => {
    console.error('Error al generar el CSS:', error);
  });
