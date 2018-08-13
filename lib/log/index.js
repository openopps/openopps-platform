const blueox = require('blue-ox');

// configure logging
blueox.beGlobal();
blueox.useColor = process.env.COLOR_LOG || false;
blueox.level('info');

module.exports = ( source ) => { 
  return blueox(source);
}


