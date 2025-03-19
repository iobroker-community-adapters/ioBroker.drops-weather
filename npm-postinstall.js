/**
 * npm post installation script
 */
const os = require('node:os');

const additionalPackages = {
    arm: ['chromium-browser'],
};

console.log('NPM POSTINSTALL script started');
const arch = os.arch();
const platform = os.platform();

console.log(`installation running on ${platform} / ${arch}`);

if (!additionalPackages[arch]) {
    console.log(`NO additonal installation required`);
    process.exit(0);
}

console.log(`starting installation of additional packages, please stand by...`);
const packages = additionalPackages[arch];
for (const pkg in packages){
    console.log(`installing ${pkg}...`);
}