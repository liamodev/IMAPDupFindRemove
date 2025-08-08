const fs = require('fs');
const path = require('path');

const envContent = `# Database Configuration
DB_HOST=ep-lucky-violet-afx8c606-pooler.c-2.us-west-2.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_DR2rFcJNXk8u

# Next.js Configuration
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
`;

const envPath = path.join(__dirname, '..', '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('\n🔐 Database connection configured for Neon PostgreSQL');
  console.log('⚠️  Please update NEXTAUTH_SECRET with a secure random string');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  console.log('\n📝 Please manually create a .env.local file in the project root with the following content:');
  console.log('\n' + envContent);
}
