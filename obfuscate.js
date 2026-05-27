const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const source = fs.readFileSync('worker.js', 'utf8');
const obfuscated = JavaScriptObfuscator.obfuscate(source, {
  compact: true,

  // String Array — core protection, keep
  stringArray:              true,
  stringArrayEncoding:     ['base64'],
  stringArrayThreshold:    0.8,
  stringArrayRotate:       true,
  stringArrayShuffle:      true,
  stringArrayWrappersCount: 1,

  // Identifiers — only local, no global
  renameGlobals:            false,
  identifierNamesGenerator: 'mangled-shuffled',

  // Off — would exceed 1MB
  splitStrings:            false,
  unicodeEscapeSequence:   false,

  // Safe keep
  disableConsoleOutput:   true,

  // All disabled
  numbersToExpressions:    false,
  transformObjectKeys:      false,
  deadCodeInjection:       false,
  controlFlowFlattening:   false,
  selfDefending:          false,
  debugProtection:         false,
});
fs.writeFileSync('obfuscated.js', obfuscated.getObfuscatedCode());
console.log('Done: obfuscated.js');