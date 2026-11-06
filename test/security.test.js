import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Build bundle contains zero private API keys or secrets', () => {
  const distDir = path.resolve('dist/client');
  assert.ok(fs.existsSync(distDir), 'dist/client must exist');

  function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkDir(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Assert no real secret keys or test keys prefixed with whop_live_ or whop_test_
        assert.ok(!content.includes('whop_live_'), `File ${file} leaked whop_live_ credential!`);
        assert.ok(!content.includes('whop_test_'), `File ${file} leaked whop_test_ credential!`);
      }
    }
  }

  checkDir(distDir);
});
