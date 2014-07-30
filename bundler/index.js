var rimraf = require('rimraf')
  , browserify = require('browserify')
  , path = require('path')
  , fs = require('fs')
  , insertGlobals = require('insert-module-globals')

var bundleDir = path.join(__dirname, 'bundle')
  , bundleJsDir = path.join(bundleDir, 'js')
  , nativeDir = path.join(bundleJsDir, 'build')

function createBrowserify() {
  var opts = {
    // equivalent to --bare, with custom built-ins
    commondir: false,
    detectGlobals: false,
    insertGlobalVars: {
      __filename: insertGlobals.__filename,
      __dirname: insertGlobals.__dirname
    },
    builtins: {
      ws: require.resolve('ws') // ensure we don't try and bundle the browser version of ws
    },
    // ignore missing modules to counteract stuff like ws that expects to fail some require's
    ignoreMissing: true,
    // TODO(tec27): utilize the 'missing' event from module_deps (submit PR to browserify to expose
    // it?) to find missing modules that are actually .node modules and copy them up to the build
    // dir, then write a shim module to load them
  }

  var b = browserify(opts)
  return b
}

function packageFilter(info, pkgdir) {
  var filter = filters[path.basename(pkgdir)]
  return filter ? filter(info) : info
}

var binaries = [
    ['../node-bw/Release/bw.node', path.join(nativeDir, 'bw.node')],
    ['../node-psi/Release/psi.node', path.join(nativeDir, 'psi.node')],
    ['../forge/Release/forge.node',  path.join(nativeDir, 'forge.node')],
    ['../Release/psi.exe', path.join(bundleDir, 'psi.exe')],
    ['../Release/psi-emitter.exe', path.join(bundleDir, 'psi-emitter.exe')],
    ['../Release/shieldbattery.dll', path.join(bundleDir, 'shieldbattery.dll')],
    ['../Release/shieldbat.snp', path.join(bundleDir, 'shieldbat.snp')]
]

function checkPrereqs() {
  console.log('Checking prerequisites...')
  binaries.forEach(function(prereq) {
    try {
      require.resolve(prereq[0])
    } catch (err) {
      console.log('Error resolving prerequisite: ' + prereq[0])
      console.log('Please run vcbuild.bat before bundling')
      throw err
    }
  })

  console.log('Done!\n')
  removePrevious()
}

function removePrevious() {
  console.log('Removing previous bundle...')
  rimraf(bundleDir, function(err) {
    if (err) throw err

    console.log('Done!\n')
    console.log('Creating bundle directory...')
    fs.mkdir(bundleDir, dirCreated)
  })
}

function dirCreated(err) {
  if (err) throw err

  console.log('Done!\n')
  console.log('Creating js directory...')
  fs.mkdir(bundleJsDir, jsDirCreated)
}

function jsDirCreated(err) {
  if (err) throw err

  console.log('Done!\n')
  console.log('Bundling JS...')

  var sbDone = false
    , psiDone = false

  var sb = createBrowserify()
  sb.add(require.resolve('../js/shieldbattery-entry.js'))
  sb.bundle().pipe(fs.createWriteStream(path.join(bundleJsDir, 'shieldbattery-entry.js')))
    .on('finish', function() {
      console.log('shieldbattery bundle written!')
      sbDone = true
      maybeDone()
    })

  var psi = createBrowserify()
  psi.add(require.resolve('../js/psi-entry.js'))
  psi.bundle().pipe(fs.createWriteStream(path.join(bundleJsDir, 'psi-entry.js')))
    .on('finish', function() {
      console.log('psi bundle written!')
      psiDone = true
      maybeDone()
    })

  function maybeDone() {
    if (!sbDone || !psiDone) return

    console.log('Done!\n')
    console.log('Creating native module dir...')
    fs.mkdir(nativeDir, nativeDirCreated)
  }
}

function nativeDirCreated(err) {
  if (err) throw err

  console.log('Done!\n')
  copyBinaries()
}

function copyBinaries() {
  console.log('Copying binaries...')

  var copying = Object.create(null)
  binaries.forEach(function(binary) {
    var input = binary[0]
      , output = binary[1]

    fs.createReadStream(input).pipe(fs.createWriteStream(output))
      .on('finish', function() {
        console.log(input + ' => ' + output)
        delete copying[input]
        maybeDone()
      })
    copying[input] = true
  })

  function maybeDone() {
    if (Object.keys(copying).length) return

    console.log('Done!\n')
  }
}

checkPrereqs()
