const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const source = fs.readFileSync('plain.js', 'utf8');
const obfuscated = JavaScriptObfuscator.obfuscate(source, {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  disableConsoleOutput: false,
  forceCompact: true,
  numbersToExpressions: true,
  optionsPreset: 'high-obfuscation',
  renameGlobals: false,
  selfDefending: true,
  splitStrings: true,
  splitStringsChunkLength: 2,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  target: 'browser',
  transform: true,
  unicodeEscapeSequence: true
});
console.log('Obfuscating...');
fs.writeFileSync('obfuscated.js', obfuscated.getObfuscatedCode());
console.log('Done: obfuscated.js');
