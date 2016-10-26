(function() {
  var page = 0, options = {},
  numAbbr = new NumAbbr();

  // options:
  //   sort_by: added_on, popularity
  //   sound_type_filter: mix-only, track-only, all
  //   listened: true, false
  //   clear: true, false (empty track container before render)
  module.exports.render_tracks = function(Track, local_options) {
    var tracks_view, tracks_html, where_clause, order_clause,
    tracks_template = jetpack.read(__appDir + '/templates/tracks.html');

    if(local_options && local_options.clear) {
      $("#tracks").empty();
      page = 0;
      delete local_options['clear'];
      $.extend(options, local_options);
    }
    
    where_clause = {
      have_listened: options.listened || false
    };

    if(options.sound_type_filter == "mix-only") {
      where_clause.duration = {
        $gte: settings.mix_duration
      }
    } else if(options.sound_type_filter == "track-only") {
      where_clause.duration = {
        $lt: settings.mix_duration
      }
    }

    if(options.sort_by == "popularity") {
      order_clause = [['playback_count', 'DESC']];
    } else {
      order_clause = [['added_on', 'DESC']];
    }

    Track.findAll({
      where: where_clause,
      order: order_clause,
      limit: settings.items_per_page,
      offset: page
    }).then(function(rows) {
      page = page + settings.items_per_page;
      tracks_view = $.extend({}, {"tracks": rows}, template_functions)

      tracks_html = Mustache.render(tracks_template, tracks_view);
      $("#tracks").append(tracks_html);
    }).then(function() {
      $(".artwork > img").not(".processed").each(function(index) {
        $(this).on('load', function() {
          $(this).addClass("processed");
          $(this).parent().siblings(".information").css('background-color', helpers.getAverageRGB($(this).get(0)));
        });
      });
    });
  }

  var template_functions = {
    relative_time: function() {
      return moment(this.added_on).fromNow();
    },
    artist: function() {
      if(this.name.split("-").length > 1) {
        return this.name.split("-")[0];
      } else {
        return this.username;
      }

    },
    title: function() {
      if(this.name.split("-").length > 1) {
        return this.name.split("-").slice(1).join("-");
      } else {
        return this.name;
      }
    },
    genre_processed: function() {
      if(this.genre == "") {
        return "";
      }
      return "#" + this.genre;
    },
    track_length: function() {
      var m_duration = moment.duration(this.duration, "milliseconds");

      if(m_duration.hours() > 0) {
        return m_duration.format('h:mm:ss');
      } else {
        return m_duration.format('m:ss');
      }
    },
    is_mix: function() {
      if(this.duration > settings.mix_duration) {
        return "mix";
      } else {
        return "not-mix";
      }
    },
    playcount_human: function() {
      return numAbbr.abbreviate(this.playback_count, 1);
    }
  };

  module.exports.render_stats = function(Track) {
    Track.count({
      group: ['have_listened']
    }).then(function(result) {
      if(result[0]) {
        $("#unlistened-stat").html(result[0].count);
      } else {
        $("#unlistened-stat").html(0);
      }

      if(result[1]) {
        $("#listened-stat").html(result[1].count);
      } else {
        $("#listened-stat").html(0);
      }
    });
  };

}());
