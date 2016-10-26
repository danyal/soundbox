require('app-module-path').addPath(__dirname + "/js");

// Third Party Modules
const electron = require('electron');
const shell = require('electron').shell;
const remote = require('electron').remote;
const Sequelize = require('sequelize');
const soundcloud = require('soundcloud-nodejs-api-wrapper');
const $ = require('jquery');
const jetpack = require('fs-jetpack');
const Mustache = require('mustache');
const moment = require('moment');
const fs = require('fs');
const NumAbbr = require('number-abbreviate')
const isDev = require('electron-is-dev');

// Local Modules
const app_handlers = require('handlers');
const render_page = require('render_page');
const helpers = require('helpers');
const db_helpers = require('db_helpers');
const sc_helpers = require('sc_helpers');
const settings = require('settings');

require("moment-duration-format");

var sequelize,
  __first_run = true,
  app = remote.app,
  __appDir,
  __dataDir = app.getPath("appData") + "/" + app.getName();

// Check if the app is packaged (production)
if(isDev) {
  __appDir = jetpack.cwd();
} else {
  __appDir = app.getAppPath();
}

if (!fs.existsSync(__dataDir)) {
  fs.mkdirSync(__dataDir);
}

document.addEventListener('DOMContentLoaded', function() {
  var Track, Data;

  sequelize = db_helpers.connect_to_db();
  Track = db_helpers.define_track_schema();
  Data = db_helpers.define_data_schema();

  sequelize.sync().then(function() {
    helpers.first_run(Data).then(function(init_vals) {
      var sc_obj = init_vals.sc_obj;
      __first_run = init_vals.first_run;
      helpers.loader_show();
    }).then(function() {
      if(__first_run) {
        helpers.loader_change_message("This may take a couple minutes.<br>Hang tight...");
        return new Promise(function (fulfill) {
          setTimeout(function() {
            fulfill();
          }, 5000)
        })
      }
    }).then(function() {
      helpers.loader_change_message("Updating feed...");
      return sc_helpers.get_new_feed_tracks(Track);
    }).then(function() {
      helpers.loader_change_message("Updating playcounts...");
      return sc_helpers.update_playcounts(Track);
    }).then(function() {
      helpers.loader_change_message("Updating followings...");
      return sc_helpers.update_followings(Track, Data);
    }).then(function() {
      helpers.loader_hide();
      render_page.render_tracks(Track);
      app_handlers.bind_sc_widget(Track);
      app_handlers.bind_ui(Track);
      render_page.render_stats(Track);
    })
  });
});
