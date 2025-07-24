//** This is like "npm run dev" for backend
//** Instead of browser at localhost:3000, we get API at localhost:3001

import http from 'http';

const server = http.createServer((req, res) => {
  //** Enable CORS (so frontend can talk to backend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  if (req.url === '/tasks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Backend is working!', 
      tasks: [
        { id: '1', title: 'Learn backend fundamentals', priority: 'high' }
      ]
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log('Try: http://localhost:3001/tasks');
});