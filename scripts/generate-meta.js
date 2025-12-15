import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const meta = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
};

const metaPath = join(__dirname, '../public/meta.json');
writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log('✅ Generated meta.json:', meta);



