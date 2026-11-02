#!/usr/bin/env node
// Waterlight is the single source of truth for the gallery. At deploy time this
// copies its gallery items, categories and images into the McKenzie site. Only
// the gallery changes, and updatedAt is left alone because the McKenzie admin
// polls that value to confirm its own saves went live.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(root, 'data', 'cms.json');
const targetPath = path.join(root, 'mckenzie', 'data', 'cms.json');

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

const items = source.gallery.items.map((item) => ({
    ...item,
    image_alt: (item.image_alt || '').replace(/Waterlight Studio/g, 'Suzanne Schwager McKenzie')
}));

let copied = 0;
const missing = [];
for (const item of items) {
    if (!item.image || !item.image.startsWith('/assets/img/')) continue;
    const from = path.join(root, item.image);
    const to = path.join(root, 'mckenzie', item.image);
    if (fs.existsSync(from)) {
        const same = fs.existsSync(to) && fs.readFileSync(from).equals(fs.readFileSync(to));
        if (!same) {
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.copyFileSync(from, to);
            copied += 1;
        }
    } else if (!fs.existsSync(to)) {
        missing.push(item.image);
    }
}

target.gallery = { ...target.gallery, categories: source.gallery.categories, items };
fs.writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n');

console.log(`Synced ${items.length} gallery items, copied ${copied} images.`);
if (missing.length) console.warn(`::warning::Gallery images missing from both sites: ${missing.join(', ')}`);
