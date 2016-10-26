(function() {
  var settings = module.exports = {};

  // SOUNDCLOUD SETTINGS
  settings.soundcloud = {};
  settings.soundcloud.client_id = "";
  settings.soundcloud.client_secret = "";
  settings.soundcloud.get_limit = 200;

  // APP SETTINGS
  settings.feed_start_date = moment().subtract(1, "years")
  settings.mix_duration = 15 * 60 * 1000 // 15 minutes
  settings.items_per_page = 20;

  // DB SETTINGS
  settings.db = {};
  settings.db.name = 'inbox';
  settings.db.username = 'inbox';
  settings.db.password = 'inbox';
  settings.db.filename = 'inbox.db';

  // DB DATA TABLE
  settings.db.data_field = {};
  settings.db.data_field.soundcloud_credentials = 1;
  settings.db.data_field.followings = 2;
}());
