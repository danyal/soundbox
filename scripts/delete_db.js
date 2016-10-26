'use strict';
const electron = require('electron');
const app = electron.app;  // Module to control application life.
const fs = require('fs');

const settings = require('../js/settings');


app.on('ready', function() {
  fs.unlink(app.getPath("appData") + "/" + app.getName() + "/" + settings.db.filename, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Database deleted.');
    }
  });
  app.quit();
});
