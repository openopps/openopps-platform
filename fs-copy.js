const fse = require('fs-extra');

/* Initialize arguments
  0 = node
  1 = install-theme.js
  2 = [SOURCE]
  3 = [DESTINATION]
*/
const SOURCE = process.argv[2];
const DESTINATION = process.argv[3];


// Copy source directory
fse.copy(SOURCE, DESTINATION).then(() => {
  console.log(SOURCE + ' copied to ' + DESTINATION);
}).catch(err => {
  console.error(err)
})
