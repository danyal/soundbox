(function() {
  var client_w_token;

  module.exports.setup_soundcloud = function(username, password) {
    var sc, client;
    sc = new soundcloud({
      client_id: settings.soundcloud.client_id,
      client_secret: settings.soundcloud.client_secret,
      username: username,
      password: password
    });
    client = sc.client();

    return new Promise(function (fulfill) {
      client.exchange_token(function(err, result) {
        if(err) {
          return fulfill(false);
        }
        var access_token;
        access_token = arguments[3].access_token;
        client_w_token = sc.client({access_token : access_token});
        fulfill(true);
      });
    });
  }

  // Updates the db with all new tracks in the feed from a certain date forward
  // full_refresh: sets update until date to the default (see settings)
  // limit_usernames: only updates user names in the array. Used for new follows
  module.exports.get_new_feed_tracks = function(Track, full_refresh, limit_usernames) {
    var insert_tracks;

    if(full_refresh == undefined) {
      full_refresh = false;
    }
    if(limit_usernames == undefined) {
      limit_usernames = [];
    }

    return get_update_until_date(Track, full_refresh).then(function(update_until) {
      return new Promise(function (fulfill) {

        var date_compare = function(collection) {
          if(collection.last().created_at > update_until) {
            return true;
          }
          return false;
        }

        get_soundcloud_objects_w_cursor(Track, "/me/activities", date_compare).then(function(update_list) {
          insert_tracks = assemble_tracks_for_insert(update_list, limit_usernames);

          Track.bulkCreate(insert_tracks, {ignoreDuplicates: true}).catch(function(error) {
            console.log(error);
          }).then(function() {
            fulfill();
          });
        });
      });
    });
  };

  // Updates tracks that were added to the feed in the last 30 days
  module.exports.update_playcounts = function(Track) {
    return new Promise(function (fulfill) {
      sequelize.query("SELECT *, julianday(updated_at) - julianday(added_on) as diff FROM `track` where diff < 30;",
      {type: sequelize.QueryTypes.SELECT, model: Track})
      .then(function(local_tracks) {
        var sc_ids = [], remote_tracks_dict = {}, updated = 0;;
        for(var i = 0; i < local_tracks.length; i++) {
          sc_ids.push(local_tracks[i].sc_id);
        }

        get_soundcloud_objects_w_arg(Track, "/tracks", "ids", sc_ids).then(function(remote_tracks) {
          for(var i = 0; i < remote_tracks.length; i++) {
            remote_tracks_dict[remote_tracks[i].id] = remote_tracks[i];
          }

          for(var i = 0; i < local_tracks.length; i++) {
            if(remote_tracks_dict[local_tracks[i].sc_id] == undefined) {
              // Error: Remote tracks doesn't have a track that we have locally.
              // Skip the track (playcount won't be updated)
              updated++;
              continue;
            }

            local_tracks[i].update({playback_count: remote_tracks_dict[local_tracks[i].sc_id].playback_count}).then(function() {
              if (++updated == local_tracks.length) {
                fulfill();
              }
            });
          }
        });
      });
    });
  }

  // Updates the feed based on new follows / unfollows
  module.exports.update_followings = function(Track, Data) {
    return new Promise(function (fulfill) {
      Data.find({
        where: {
          key: settings.db.data_field.followings
        }
      }).then(function(following_instance) {
        var following_list_db, new_follows, unfollows, true_noop, promises = [];

        if(__first_run || following_instance == undefined) {
          following_list_db = [];
        } else {
          following_list_db = following_instance.value;
        }

        true_noop = function(collection) {
          return true;
        }

        get_soundcloud_objects_w_cursor(Track, "/me/followings", true_noop).then(function(users) {
          var following_list_remote = [];
          for(var i = 0; i < users.length; i++) {
            following_list_remote.push(users[i].username);
          }
          Data.upsert({
            key: settings.db.data_field.followings,
            value: following_list_remote
          });

          if(!__first_run) {
            // If the api ever supports getting activity streams of a specific user,
            // loop through new_follows instead of doing a full update
            new_follows = $(following_list_remote).not(following_list_db).toArray();
            unfollows = $(following_list_db).not(following_list_remote).toArray();

            if(new_follows.length > 0) {
              promises.push(sc_helpers.get_new_feed_tracks(Track, true, new_follows));
            }

            if(unfollows.length > 0) {
              promises.push(
                Track.destroy({
                  where: {
                    username: unfollows
                  }
                })
              );
            }
          }
          Promise.all(promises).then(function() {
            fulfill();
          });
        });
      });
    });
  }

  // Likes or reposts a track
  // action: [like, repost]
  // remove: bool
  module.exports.track_action = function(track_id, action, remove) {
    var request_type = "put", base_url = "/e1/me/";
    if(remove) {
      request_type = "delete";
    }
    if(action == "like") {
      base_url = base_url + "track_likes/";
    } else if(action == "repost") {
      base_url = base_url + "track_reposts/";
    } else {
      console.log("Error: Function called incorrectly");
      return;
    }

    client_w_token[request_type](base_url + track_id, '{}', function(err, success) {
      if(err) {
        console.log(err);
      }
      // Sucess returns status 201 (created) or 200 (OK)
    });
  }

  var get_update_until_date = function(Track, full_refresh) {
    return new Promise(function (fulfill) {
      if(full_refresh) {
        fulfill(settings.feed_start_date);
      }
      Track.max('added_on').then(function(added_on) {
        var update_until = settings.feed_start_date;
        if(added_on) {
          update_until = added_on;
        }
        fulfill(update_until);
      });
    });
  }

  var assemble_tracks_for_insert = function(sc_obj_list, limit_usernames) {
    var track, sc_obj, prepared_list = [];

    for(var i = 0; i < sc_obj_list.length; i++) {
      sc_obj = sc_obj_list[i];
      track = sc_obj.origin;

      if(track == undefined ||
          sc_obj.type == "playlist" ||
          sc_obj.type == "playlist-repost" ||
          (limit_usernames.length > 0 && limit_usernames.indexOf(track.username) == -1)) {
        continue;
      }

      prepared_list.push({
        'name': track.title,
        'username': track.user.username,
        'added_on': sc_obj.created_at,
        'url': track.uri,
        'have_listened': false,
        'sc_id': track.id,
        'genre': track.genre,
        'playback_count': track.playback_count,
        'permalink': track.permalink_url,
        'artwork': (track.artwork_url || "").replace("large", "t500x500"),
        'duration': track.duration,
      });
    }
    return prepared_list;
  }

  var get_soundcloud_objects_w_cursor = function(Track, endpoint, callback) {
    var sc_api_args = {limit : settings.soundcloud.get_limit}, update_list = [];

    return new Promise(function (fulfill) {
      (function get_objects(cursor) {
        if (cursor) {
          sc_api_args.cursor = cursor;
        }
        client_w_token.get(endpoint, sc_api_args, function(err, result) {
          if (err) {
            console.error(err);
          }

          update_list = update_list.concat(result.collection);

          if(callback(result.collection) && result.next_href) {
            cursor = result.next_href.split('=').last();
            get_objects(cursor);
          } else {
            fulfill(update_list);
          }
        });
      })();
    });
  };

  var get_soundcloud_objects_w_arg = function(Track, endpoint, arg_name, arg_value) {
    var remote_tracks = [];
    return new Promise(function (fulfill) {
      (function get_tracks() {
        var pvalue_slice = arg_value.splice(0, 200),
        sc_api_args = {limit: settings.soundcloud.get_limit};

        sc_api_args[arg_name] = JSON.stringify(pvalue_slice);

        client_w_token.get(endpoint, sc_api_args, function(err, partial_tracks) {
          remote_tracks = remote_tracks.concat(partial_tracks);
          if(partial_tracks.length != pvalue_slice.length) {
            console.log("Error: Missing remote tracks");
          }

          if(arg_value.length > 0) {
            get_tracks();
          } else {
            fulfill(remote_tracks);
          }
        });
      })();
    });
  };

}());
