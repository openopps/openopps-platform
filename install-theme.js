const fse = require('fs-extra');
const clone = require('git-clone');

/* Initialize arguments
  0 = node
  1 = install-theme.js
  2 = [TARGET]
*/
const THEME = process.env.THEME;
const TARGET = process.argv[2] || "_theme";

if(!THEME) process.exit(0);

// Remove existing theme
fse.remove(TARGET).then(() => {
  // Clone theme
  clone(THEME, TARGET, {}, function(error) {
    if(error)
      console.error(error);
    else
      console.log('Theme ' + THEME + ' install succeeded.');
  });
}).catch(err => {
  console.error(err)
});
