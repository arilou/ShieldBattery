import { app } from 'electron'
import fs from 'fs'
import net from 'net'
import os from 'os'
import path from 'path'
import sanitize from 'sanitize-filename'

export default function () {
  // OS X doesn't have a single instance issue
  if (process.platform === 'darwin') {
    return
  }

  let getMainWindow
  const socket =
    process.platform === 'win32'
      ? `\\\\.\\pipe\\${sanitize(os.userInfo().username ?? 'username')}-${app.name}-singleInstance`
      : path.join(os.tempdir(), app.name + '.sock')

  const client = net
    .connect(socket, () => {
      // This will only be executed by the second instance of the app (because it will
      // successfully connect to the running server). Just send some data to the server, which is
      // running on the first instance, so the main window can be focused there and quit this
      // instance.
      client.write('focus first instance')
      app.quit()
    })
    .on('error', err => {
      if (err.code !== 'ENOENT') throw err
      if (process.platform === 'win32') {
        try {
          fs.unlinkSync(socket)
        } catch (e) {
          if (e.code !== 'ENOENT') {
            throw e
          }
        }
      }

      // This will only be executed by the first instance, because it will try to connect to a
      // socket on a server which is not running yet.
      getMainWindow = require('./app').getMainWindow
      net
        .createServer(connection => {
          connection.on('data', () => {
            const mainWindow = getMainWindow()
            if (mainWindow) {
              if (!mainWindow.isVisible()) {
                mainWindow.show()
                return
              }
              if (mainWindow.isMinimized()) {
                mainWindow.restore()
              }
              mainWindow.focus()
            }
          })
        })
        .on('error', () => app.quit())
        .listen(socket)
    })
}
