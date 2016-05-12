// Example config file
// Fill in the correct values for your environment and rename to config.js
// NOTE: you will also need to configure your databases in database.json for db-migrate
import fs from 'fs'

const config = {}
config.canonicalHost = 'https://localhost' // main HTTPS url for the site
config.httpsPort = 443
config.httpPort = 80

config.sessionSecret = 'shhhhhhh'
config.sessionTtl = 1209600 // in seconds

config.db = {
  connString: JSON.parse(fs.readFileSync('./database.json')).dev
}

config.redis = {
  host: 'localhost',
  port: 6379
}

config.logLevels = {
  file: 'warn',
  console: 'debug'
}

// Uncomment and set your Google Analytics ID to enable analytics reporting
// config.analyticsId = 'UA-000000-01'

// Set a minimum required Psi version
// If the version is not specified, it defaults to no minimum version
config.minPsiVersion = '0.0.0'
// Uncomment to specify an installer URL, which will be given to clients if their Psi is detected
// to be out of date. If none is specified, no link will be given to clients.
// config.installerUrl = 'https://localhost/installer.msi'


// Uncommenting this block will enable HTTPS, which requires generating server certs & keys
// It's advisable to leave commented if you're doing local development
/*
config.https = {
  ca: [],
  key: fs.readFileSync(require.resolve('./certs/server.key'), 'utf8'),
  cert: fs.readFileSync(require.resolve('./certs/server.crt'), 'utf8')
}
*/
export default config
