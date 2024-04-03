const http = require('http');
const url = require('url');
const fs = require('fs');


http.createServer(function (request, response) {

    // 
    const addr = request.url;
    const q = new url.URL(addr, `http://${request.headers.host}`);

    // log request url and timestamp
    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (error) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Added to log.');
        }
    });

    // Determine the file path based on the request URL pathname
    let filePath;
    if (q.pathname.includes('Documentation')) {
        filePath = (__dirname + `/Documentation.html`);
    } else {
        filePath = (__dirname + '/index.html');
    }

    // Reads file and serves it
    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404, { 'Content-Type': 'text/html' });
            response.end('404 not found');
        } else {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(content);
        }
    });


}).listen(8080);

console.log('Server running at http://127.0.0.1:8080/');



