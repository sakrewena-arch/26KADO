const fs = require('fs'); const path = require('path'); const pages = {}; pages['test'] = 'hi'; fs.writeFileSync('test.txt', 'hello'); console.log('ok');  
