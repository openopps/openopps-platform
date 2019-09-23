const fse = require('fs-extra');

/* Initialize arguments
  0 = node
  1 = import-theme.js
  2 = [SOURCE]
*/
const SOURCE = process.argv[2] || '_theme';

// True to include, False to exclude
const filterFunc = (src, dest) => {
  if(fileExclusions.includes(src)) return false;
  if(directoryExclusions.map((exclusion) => {
    return src.match(exclusion);
  }).reduce((a, b) => {
    return a || b;
  }, 0)) return false;
  return true;
};

var fileExclusions = [];
var directoryExclusions = [];

// Look for and read from exclude.txt
fse.readFile('exclude.txt').then((contents) => {
  var exclusions = contents.toString().split('\n');
  exclusions.map((exclusion) => {
    if(exclusion.endsWith('*'))
      directoryExclusions.push(exclusion);
    else
      fileExclusions.push(exclusion);
  });
}).catch((error) => {
  console.warn(error);
});

// Copy source directory
fse.copy(SOURCE, '.', { filter: filterFunc }).then(() => {
  console.log('Theme import succeeded.');
}).catch(err => {
  console.error(err);
});
