/**
 * npm post installation script
 */
const os = require('node:os');

console.log('npm-postinstall script started');
const arch = os.arch();
const platform = os.platform();

console.log(`installation running on ${platform} / ${arch}`);
if (arch !== 'arm'){
    console.log(`NO additonal installation required`);
    process.exit(0);
}
console.log(`starting installation of additional packages, please stand by...`);
