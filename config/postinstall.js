const fs = require('fs')

const destDir = 'node_modules/react-scripts-ts/config'
const originalFileNamePrefix = '_'

const absoluteDestDir = `${__dirname}/../${destDir}`

const copyFileIfNeeded = file => {
  const absoluteFile = `${__dirname}/${file}`
  if (absoluteFile === __filename) {
    console.debug(`${file}: ignoring non config file`)
    return
  }

  const absoluteDestFile = `${absoluteDestDir}/${file}`
  const destFile = `${destDir}/${file}`
  if (!fs.existsSync(absoluteDestFile)) {
    console.error(`${file}: missing original config file required for renaming within node_modules/react-scripts-ts/config, aborting`)
    process.exit(1)
    return
  }

  const absoluteOriginalFileCopied = `${absoluteDestDir}/${originalFileNamePrefix}${file}`
  const originalFileCopied = `${destDir}/${originalFileNamePrefix}${file}`
  if (fs.existsSync(absoluteOriginalFileCopied)) {
    console.log(`${file}: renamed (original) config file exists, seem to be installed previously, ignoring`)
    return
  }

  console.log(`${file}: backing up original config file from ${destFile} to ${originalFileCopied}`)
  fs.copyFileSync(absoluteDestFile, absoluteOriginalFileCopied)

  console.log(`${file}: overwriting ${destFile} with local version`)
  fs.copyFileSync(absoluteFile, absoluteDestFile)
}

fs.readdirSync(__dirname).forEach(copyFileIfNeeded)