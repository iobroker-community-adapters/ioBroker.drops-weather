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
console.log('');

if (!additionalPackages[arch]) {
    console.log('NO additonal installation required');
    process.exit(0);
}

console.log('starting installation of additional packages, please stand by...');

const { spawnSync } = require('node:child_process');
const packages = additionalPackages[arch];
for (const pkg of packages) {
    console.log(`installing ${pkg}...\n`);

    const res = spawnSync('sh', ['-c', `sudo apt-get install -y ${pkg}`]);
    res.stdout && console.log(`${res.stdout}`);
    res.stderr && console.log(`${res.stderr}`);
    res.status && console.warn('installation failed with status ${res.status}');
    console.log('');
}