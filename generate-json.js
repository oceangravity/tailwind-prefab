const fs = require('fs');
const path = require('path');
const tailwind = require('tailwindcss');
const postcss = require('postcss');

// Función para convertir una regla CSS al formato JSON deseado
function convertRule(selector, declarations) {
  const className = selector.replace('.', '').replace(/\\/, '');
  const props = declarations.map(d => `${d.prop}: ${d.value} !important`).join('; ');
  const value = `html body * [ƒ__${className}] { ${props} }`;
  return [className, value];
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
    let output = {};

    // Parsear el CSS resultante
    postcss.parse(result.css).walkRules(rule => {
      if (!rule.selector.startsWith('.')) return; // Ignorar selectores que no son clases

      const [className, value] = convertRule(rule.selector, rule.nodes);
      output[className] = value;
    });

    // Escribir el resultado en un archivo JSON
    const outputPath = path.join(__dirname, 'tailwind-classes.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Archivo JSON generado con éxito en: ${outputPath}`);
  })
  .catch(error => {
    console.error('Error al generar el JSON:', error);
  });
