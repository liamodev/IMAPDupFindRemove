const Imap = require('imap');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

async function testIMAPConnection() {
  console.log('🔍 Testing IMAP connection...');
  
  // You'll need to provide these values for testing
  const config = {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    user: process.env.IMAP_USER || '',
    password: process.env.IMAP_PASSWORD || '',
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  };

  if (!config.user || !config.password) {
    console.log('❌ IMAP credentials not found in environment variables');
    console.log('💡 Please set IMAP_HOST, IMAP_PORT, IMAP_USER, and IMAP_PASSWORD in your .env.local file');
    console.log('   Example:');
    console.log('   IMAP_HOST=imap.gmail.com');
    console.log('   IMAP_PORT=993');
    console.log('   IMAP_USER=your-email@gmail.com');
    console.log('   IMAP_PASSWORD=your-app-password');
    return;
  }

  const imap = new Imap(config);

  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ IMAP connection successful!');
      
      imap.getBoxes((err, boxes) => {
        if (err) {
          console.error('❌ Error getting boxes:', err);
          reject(err);
          return;
        }

        console.log('\n📁 Found folders:');
        const folders = [];
        
        const traverse = (box, prefix = '') => {
          try {
            const name = prefix + (box.name || 'unknown');
            folders.push(name);
            console.log(`   - ${name}`);
            
            // Check if children exist and is an array
            if (box.children && Array.isArray(box.children)) {
              box.children.forEach(child => traverse(child, name + '/'));
            } else if (box.children && typeof box.children === 'object') {
              // Handle case where children might be an object instead of array
              Object.values(box.children).forEach(child => traverse(child, name + '/'));
            }
          } catch (error) {
            console.error('Error traversing folder:', error);
          }
        };

        try {
          Object.values(boxes).forEach(box => traverse(box));
        } catch (error) {
          console.error('Error processing boxes:', error);
          reject(error);
          return;
        }

        console.log(`\n📊 Total folders found: ${folders.length}`);
        imap.end();
        resolve(folders);
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP connection failed:', err.message);
      reject(err);
    });

    imap.connect();
  });
}

testIMAPConnection().catch(console.error);
