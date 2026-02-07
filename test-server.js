// Quick test to verify server can start
const http = require('http');

const testBackend = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5001/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✓ Backend server is running');
          console.log('  Response:', data);
          resolve(true);
        } else {
          reject(new Error(`Backend returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('✗ Backend server is not running');
        console.log('  Start it with: cd backend && npm run dev');
      } else {
        console.log('✗ Error connecting to backend:', err.message);
      }
      reject(err);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Connection timeout'));
    });
  });
};

testBackend()
  .then(() => {
    console.log('\n✓ All checks passed!');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n✗ Some checks failed');
    process.exit(1);
  });
