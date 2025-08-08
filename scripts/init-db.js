const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Initializing database...');
  execSync('npx ts-node lib/init-db.ts', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('Database initialized successfully!');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}
