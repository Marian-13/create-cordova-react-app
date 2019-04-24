const fs = require('fs')
const { execSync } = require('child_process')
const convert = require('xml-js')
const randomstring = require('randomstring')

// -------------------------------------------------------------------------- //

CURRENT_WORKING_DIRECTORY = process.cwd()
THIS_SCRIPT_DIRECTORY = __dirname
XML_JS_CONFIG = { compact: false, spaces: 4 }
TEMP_DIRECTORY_NAME = randomstring.generate()

function help() {
  return process.argv[2] === '-h' || process.argv[2] === '--help'
}

function appName() {
  return process.argv[4] || path()
}

function appId() {
  return process.argv[3] || 'io.cordova.hellocordova'
}

function path() {
  return process.argv[2]
}

function appDirectory() {
  return `${CURRENT_WORKING_DIRECTORY}/${appName()}`;
}

function appDirectoryExists() {
  return fs.existsSync(appDirectory())
}

function tempDirectory() {
  return `${THIS_SCRIPT_DIRECTORY}/${TEMP_DIRECTORY_NAME}`
}

function tempCordovaAppDirectory() {
  return `${tempDirectory()}/temp-cordova-app`
}

function tempReactAppDirectory() {
  return `${tempDirectory()}/temp-react-app`
}

function templatesDirectory() {
  return `${THIS_SCRIPT_DIRECTORY}/templates`
}

function log(message) {
  console.log('\x1b[33m%s\x1b[0m', message)
}

function print(text) {
  process.stdout.write(text)
}

function printNewLine() {
  print('\n')
}

function logDone() {
  console.log('\x1b[32m%s\x1b[0m', 'Done!')
}

function exit(message) {
  if (message) console.log('\x1b[31m%s\x1b[0m', message)

  process.exit()
}

function tempDirectoryExists() {
  return fs.existsSync(tempDirectory())
}

function createTempDirectory() {
  fs.mkdirSync(tempDirectory())
}

function removeTempDirectory() {
  execSync(`rm -rf ${tempDirectory()}`)
}

function cdToCurrentWorkingDirectory() {
  process.chdir(CURRENT_WORKING_DIRECTORY)
}

function cdToTempDirectory() {
  process.chdir(tempDirectory())
}

function cdToTempReactAppDirectory() {
  process.chdir(tempReactAppDirectory())
}

function exec(command) {
  print(execSync(command))
}

function parseXML(text) {
  return convert.xml2js(text, XML_JS_CONFIG)
}

function stringifyXML(value) {
  return convert.js2xml(value, XML_JS_CONFIG)
}

function parseJSON(text) {
  return JSON.parse(text)
}

function stringifyJSON(value) {
  return JSON.stringify(value)
}

function readXMLFile(path) {
  return parseXML(fs.readFileSync(path))
}

function writeXMLFile(path, content) {
  return fs.writeFileSync(path, stringifyXML(content))
}

function readJSONFile(path) {
  return parseJSON(fs.readFileSync(path))
}

function writeJSONFile(path, content) {
  return fs.writeFileSync(path, stringifyJSON(content))
}

function getIndexOfFirstTagInXML(xml, tagName, attributes = {}) {
  return xml['elements'].findIndex(element => (
    element['name'] === tagName &&
      Object.entries(attributes).every(([attributeName, value]) => element['attributes'][attributeName] === value)
  ))
}

function getFirstTagInXML(xml, tagName, attributes) {
  const index = getIndexOfFirstTagInXML(xml, tagName, attributes)

  return xml['elements'][index]
}

function setFirstTagInXML(xml, tagName, ...rest) {
  const [attributes, tag] = rest.length === 2 ? rest : rest.length === 1 && [{}, rest[0]]

  const copy = { ...xml }

  const index = getIndexOfFirstTagInXML(copy, tagName, attributes)

  if (index >= 0) copy['elements'][index] = tag

  return copy
}

function addChildToXMLTag(tag, child) {
  const copy = { ...tag }

  copy['elements'].push(child)

  return copy
}

function inTempDirectory(func) {
  cdToTempDirectory()

  func()

  cdToCurrentWorkingDirectory()
}

function inTempReactAppDirectory(func) {
  cdToTempReactAppDirectory()

  func()

  cdToCurrentWorkingDirectory()
}

function createCordovaApp() {
  inTempDirectory(() => {
    exec(`cordova create ${tempCordovaAppDirectory()}`)

    logDone()
  })
}

function createReactApp() {
  inTempDirectory(() => {
    exec(`npx create-react-app ${tempReactAppDirectory()}`)

    logDone()
  })
}

function movePlatformsToReactApp() {
  exec(`mv ${tempCordovaAppDirectory()}/platforms ${tempReactAppDirectory()}`)

  logDone()
}

function movePluginsToReactApp() {
  exec(`mv ${tempCordovaAppDirectory()}/plugins ${tempReactAppDirectory()}`)

  logDone()
}

function moveConfigXMLToReactApp() {
  exec(`mv ${tempCordovaAppDirectory()}/config.xml ${tempReactAppDirectory()}`)

  logDone()
}

function generatePackageJSON() {
  const cordovaPackageJSON = readJSONFile(`${tempCordovaAppDirectory()}/package.json`)
  const reactPackageJSON = readJSONFile(`${tempReactAppDirectory()}/package.json`)

  delete cordovaPackageJSON['scripts']

  const packageJson = { ...reactPackageJSON, ...cordovaPackageJSON }

  packageJson['homepage']         = './'
  packageJson['scripts']['start'] = 'bash scripts/startDevServer.sh'
  packageJson['scripts']['move']  = 'mv build/* www/'
  packageJson['scripts']['clear'] = 'rm -rf www/*'

  writeJSONFile(`${tempReactAppDirectory()}/package.json`, packageJson)

  logDone()
}

function yarnLockExists() {
  return fs.existsSync(`${tempReactAppDirectory()}/yarn.lock`)
}

function removeYarnLock() {
  if (yarnLockExists()) exec(`rm ${tempReactAppDirectory()}/yarn.lock`)

  logDone()
}

function installDependencies() {
  inTempReactAppDirectory(() => {
    exec('npm install')

    logDone()
  })
}

function createWWW() {
  fs.mkdirSync(`${tempReactAppDirectory()}/www`)

  logDone()
}

function replaceIndexHTMLByTemplate() {
  exec(`cp ${templatesDirectory()}/index.html ${tempReactAppDirectory()}/public/index.html`)

  logDone()
}

function replaceIndexJSByTemplate() {
  exec(`cp ${templatesDirectory()}/index.js ${tempReactAppDirectory()}/src/index.js`)

  logDone()
}

function addBrowserPlatform() {
  inTempReactAppDirectory(() => {
    exec('cordova platform add browser')

    logDone()
  })
}

function addAndroidPlatform() {
  inTempReactAppDirectory(() => {
    exec('cordova platform add android')

    logDone()
  })
}

function createScripts() {
  fs.mkdirSync(`${tempReactAppDirectory()}/scripts`)

  logDone()
}

function generateBashScriptForStartingReactDevServerWithCordovaRelatedFiles() {
  exec(`cp ${templatesDirectory()}/startDevServer.sh ${tempReactAppDirectory()}/scripts/startDevServer.sh`)

  logDone()
}

function generateBeforePrepareHookForUpdatingWWWFiles() {
  exec(`cp ${templatesDirectory()}/updateWWWFiles.js ${tempReactAppDirectory()}/scripts/updateWWWFiles.js`)

  logDone()
}

function addBeforePrepareHookForUpdatingWWWFilesToConfigXML() {
  let configXML = readXMLFile(`${tempReactAppDirectory()}/config.xml`)
  let widget = getFirstTagInXML(configXML, 'widget')
  const hook = getFirstTagInXML(parseXML('<hook type="before_prepare" src="scripts/updateWWWFiles.js" />'), 'hook')

  widget = addChildToXMLTag(widget, hook)
  configXML = setFirstTagInXML(configXML, 'widget', widget)

  writeXMLFile(`${tempReactAppDirectory()}/config.xml`, configXML)

  logDone()
}

function generateBeforeDeployHookForAddingPermissionToCurrentUserToUseKVM() {
  exec(`cp ${templatesDirectory()}/addPermissionToCurrentUserToUseKVM.js ${tempReactAppDirectory()}/scripts/addPermissionToCurrentUserToUseKVM.js`)

  logDone()
}

function addBeforeDeployHookForAddingPermissionToCurrentUserToUseKVM() {
  let configXML = readXMLFile(`${tempReactAppDirectory()}/config.xml`)

  let widget = getFirstTagInXML(configXML, 'widget')
  let platform = getFirstTagInXML(widget, 'platform', { name: 'android' })

  const hook = getFirstTagInXML(
    parseXML('<hook type="before_deploy" src="scripts/addPermissionToCurrentUserToUseKVM.js" />'),
    'hook'
  )

  platform = addChildToXMLTag(platform, hook)

  widget = setFirstTagInXML(widget, 'platform', { name: 'android' }, platform)
  configXML = setFirstTagInXML(configXML, 'widget', widget)

  writeXMLFile(`${tempReactAppDirectory()}/config.xml`, configXML)

  logDone()
}

function createAppDirectory() {
  fs.mkdirSync(appDirectory())

  logDone()
}

function moveTempReactAppDirectoryContentToAppDirectory() {
  exec(`mv ${tempReactAppDirectory()}/* ${appDirectory()}`)

  logDone()
}

function printNextSteps() {
  print(
    `Success! Now you can cd to \`${appName()}\` and start development by:\n` +
    '  npm start\n' +
    '    Runs app in browser. ' +
    'Tries to do the same as `codrova run browser`, but with `create-react-app` features enabled, like hot reloading and source maps.\n' +
    '\n' +
    '  codrova run browser\n' +
    '    Also runs app in browser (Default Cordova way). ' +
    'As `npm start` was configured manually, it is NOT error-prone. ' +
    'So, everytime, when you feel you have issues with cordova api, to make sure it is really the case, run `codrova run browser`. ' +
    'Maybe it is something wrong with `npm start` internally.\n' +
    '\n' +
    '  codrova run android\n' +
    '    Runs app in android emulator (or in android device). ' +
    'To select another emulator, specify target option like so: `--target=test` ' +
    'To see the full list of installed targets, execute `cordova requirements`.\n' +
    '\n' +
    'To add or remove a dependency use:\n' +
    '  npm install <package-name>\n' +
    '\n' +
    '  npm uninstall <package-name>\n' +
    '\n' +
    'To add or remove a cordova plugin use:\n' +
    '  cordova plugin add <plugin-name>\n' +
    '\n' +
    '  cordova plugin remove <plugin-name>\n' +
    '\n' +
    'Do not forget to restart your app after changing dependencies or plugins.' +
    '\n'
  )
}

function printDescription() {
  print(
    'Creates a mix project of cordova application and `create-react-app` app. ' +
    'Accepts the first three arguments as `cordova create` command`.\n' +
    'Examples:\n' +
    '  create-cordova-react-app hi-cordova\n' +
    '  create-cordova-react-app hello-cordova io.cordova.hellocordova HelloCordova\n'
  )
}

// -------------------------------------------------------------------------- //

process.on('SIGINT', () => {
  if (tempDirectoryExists()) removeTempDirectory()
});

try {
  if (help()) {
    printDescription()

    exit()
  }

  if (!appName()) exit('No app name provided.')

  if (appDirectoryExists()) {
    exit(
      `Directory with name \`${appName()}\` already exists in the current folder. ` +
      `You can try to delete it or to choose another app name.`
    )
  }

  createTempDirectory()

  printNewLine()

  log('** Creating of Cordova app.')
  createCordovaApp()

  log('** Creating of `create-react-app`.')
  createReactApp()

  log('** NOT moving of Cordova `hooks`, because this folder is deprecated.')
  logDone()

  log('** Moving of Cordova `platforms`.')
  movePlatformsToReactApp()

  log('** Moving of Cordova `plugins`.')
  movePluginsToReactApp()

  log('** Creating of Cordova `www`.')
  createWWW()

  log('** Moving of Cordova `config.xml`.')
  moveConfigXMLToReactApp()

  log('** Generating of `package.json`.')
  generatePackageJSON()

  log('** Removing of `yarn.lock` (Cordova currently supports `npm` only).')
  removeYarnLock()

  log('** Installing of dependencies and generating of `package-lock.json`.')
  installDependencies()

  log('** Replacing of React `public/index.html`.')
  replaceIndexHTMLByTemplate()

  log('** Replacing of React `src/index.js`.')
  replaceIndexJSByTemplate()

  log('** Adding of Cordova `browser` platform.')
  addBrowserPlatform()

  log('** Adding of Cordova `android` platform.')
  addAndroidPlatform()

  log('** Creating of Cordova `scripts`')
  createScripts()

  log('** Generating of bash script for starting React dev server with Cordova related files by `npm start`')
  generateBashScriptForStartingReactDevServerWithCordovaRelatedFiles()

  log('** Generating of `before_prepare` hook for updating of `www` files.')
  generateBeforePrepareHookForUpdatingWWWFiles()

  log('** Adding of `before_prepare` hook for updating of `www` files to `config.xml`.')
  addBeforePrepareHookForUpdatingWWWFilesToConfigXML()

  log('** Generating of android `before_deploy` hook for adding current user a permission to use KVM.')
  generateBeforeDeployHookForAddingPermissionToCurrentUserToUseKVM()

  log('** Adding of android `before_deploy` hook for adding current user a permission to use KVM.')
  addBeforeDeployHookForAddingPermissionToCurrentUserToUseKVM()

  log(`** Creating of \`${appName()}\` in the current directory.`)
  createAppDirectory()

  log(`** Moving of contents of temp folders to \`${appName()}\`.`)
  moveTempReactAppDirectoryContentToAppDirectory()

  log(`** Removing of temp folders.`)
  removeTempDirectory()
  logDone()

  printNextSteps()
} finally {
  if (tempDirectoryExists()) removeTempDirectory()
}
