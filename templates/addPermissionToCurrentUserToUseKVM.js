const fs = require('fs')
const { execSync } = require('child_process')

module.exports = function(context) {
  const currentUser = execSync('whoami').toString().trimEnd()

  console.log(
    '\x1b[33m%s\x1b[0m',
    'In order to enter `sudo` password only the first time use the same terminal window to run emulator.'
  )

  execSync(`sudo chown ${currentUser}:${currentUser} -R /dev/kvm`)
}
