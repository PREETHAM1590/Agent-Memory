const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { homedir } = require('os');
const { join } = require('path');

const home = homedir();
const ides = [
  { name: 'Cursor', dirs: ['.cursor'], binary: 'cursor' },
  { name: 'Windsurf', dirs: ['.windsurf'], binary: 'windsurf' },
  { name: 'Claude Code', dirs: ['.claude'], binary: 'claude' },
  { name: 'Kilo', dirs: ['.kilo'], binary: 'kilo' },
  { name: 'Gemini', dirs: ['.gemini'], binary: 'gemini' },
  { name: 'Aider', dirs: ['.aider'], binary: 'aider' },
  { name: 'Continue', dirs: ['.continue'], binary: null },
  { name: 'Cline', dirs: ['.cline'], binary: null },
  { name: 'OpenCode', dirs: ['.opencode'], binary: 'opencode' }
];

console.log('\n📋 IDE Detection Results:\n');

for (const ide of ides) {
  let detected = false;
  let method = '';
  
  for (const dir of ide.dirs) {
    if (existsSync(join(home, dir))) {
      detected = true;
      method = 'config dir';
      break;
    }
  }
  
  if (!detected && ide.binary) {
    try {
      execSync('where ' + ide.binary, { stdio: 'pipe' });
      detected = true;
      method = 'binary';
    } catch {}
  }
  
  console.log(`  ${detected ? '✅' : '❌'} ${ide.name.padEnd(15)} ${detected ? '(' + method + ')' : ''}`);
}

console.log('\nHome dir:', home);
console.log('Checking dirs:', ides.flatMap(i => i.dirs).map(d => join(home, d)));
