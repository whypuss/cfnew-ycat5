const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const source = fs.readFileSync('plain.js', 'utf8');
const obfuscated = JavaScriptObfuscator.obfuscate(source, {
  compact: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 1.0,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: false,
  stringArrayWrappersParametersMaxCount: 3,
  renameGlobals: true,
  identifierNamesGenerator: 'mangled-shuffled',
  splitStrings: true,
  splitStringsChunkLength: 1,
  disableConsoleOutput: true,
  unicodeEscapeSequence: true,
  // Disabled - not worth the cost
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  numbersToExpressions: false,
  simplify: false,
  transformObjectKeys: false
});
fs.writeFileSync('obfuscated.js', obfuscated.getObfuscatedCode());
console.log('Done: obfuscated.js');
