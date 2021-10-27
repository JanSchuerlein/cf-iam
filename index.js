const http = require('http');
const https = require('https');
const os = require('os');

const connectionLimit = 500;

const zone = 'YOUR-CLOUDFLARE-ZONE-ID';
const token = 'YOUR-CREATED-API-TOKEN';

function checkConnections() {

  const options = {
    hostname: '127.0.0.1',
    port: 80,
    path: '/nginx_status',
    method: 'GET'
  }

  const req = http.request(options, res => {

    let responseData = '';

    res.on('data', chunk => {
      responseData += chunk;
    });

    res.on('end', () => {
    
      responseData = responseData.split(os.EOL);
      connections = responseData[0].split('Active connections: ')[1];
      
      console.log('Current NGINX connections: ' + connections);
      
      if(connections > connectionLimit) {
        console.log('Current active connections are exceeding limit, enabling Cloudflare IAM-Mode...');
        activateIAMMode();
      }

    });
    
  });

  req.on('error', error => {
    console.error(error);
  })

  req.end();

}

function activateIAMMode() {

  let postData = JSON.stringify({ value: 'under_attack' });

  const options = {
    hostname: 'api.cloudflare.com',
    port: 443,
    path: '/client/v4/zones/' + zone + '/settings/security_level',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization' : 'Bearer ' + token,
      'Content-Length': postData.length
    }
  }
  
  const req = https.request(options, res => {
    console.log(`Cloudflare IAM-Mode Request HTTP-Status: ${res.statusCode}`)
  });
  
  req.on('error', error => {
    console.error(error);
  })
  
  req.write(postData);
  req.end();

}

checkConnections();