const fs = require('fs')
const { execSync } = require('child_process')

module.exports = function(context) {
  console.log('\x1b[33m%s\x1b[0m', 'Updating `www` files.')

  execSync('npm run clear')
  execSync('npm run build')
  execSync('npm run move')
}
