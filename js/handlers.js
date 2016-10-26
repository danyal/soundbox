(function() {
  module.exports.bind_sc_widget = function(Track) {
    var widget = SC.Widget(document.getElementById('soundcloud-widget'));
    widget.bind(SC.Widget.Events.READY);

    $('body').on('click', '.play-button-container', function() {
      if($("#fixed-footer").is(":hidden")){
        $("#fixed-footer").slideDown();
      }
      $(this).children(".play-icon").addClass("listened");
      var track_elem = $(this).parents(".track");
      widget.load(track_elem.data("soundcloud-url"), {
        callback: function() {
          widget.play();
          Track.update({
            have_listened: true
          }, {
            where: {
              id: track_elem.data("track-id")
            }
          }).then(function() {
            render_page.render_stats(Track);
          });
        }
      });
    });
  }

  module.exports.bind_ui = function(Track) {
    $("#header .dropdown-container .dropdown-button").on('click', function(event) {
      var my_dropdown = $(this).siblings(".dropdown-menu");
      if(my_dropdown.is(":visible")) {
        my_dropdown.hide();
      } else {
        $(".dropdown-menu").not(my_dropdown).hide();
        my_dropdown.show();
      }
       event.stopPropagation();
    });

    $(".dropdown-item").on('click', function() {
      $(this).siblings().removeClass("selected");
      $(this).addClass("selected");
    });

    $(".dropdown-item").on('click', function() {
      var type = $(this).parents(".dropdown-menu").data("type"),
      param = $(this).data("param"),
      param_dict = {clear: true};

      if(type == "filter") {
        param_dict["sound_type_filter"] = param;
      } else if(type == "sort") {
        param_dict["sort_by"] = param;
      } else if(type == "listened") {
        param_dict["listened"] = param;
      }
      render_page.render_tracks(Track, param_dict);
    });

    $(window).on('click', function() {
      $(".dropdown-menu").hide();
    });

    $("body").on('click', '.like-action', function() {
      $(this).children().addClass("clicked");
      sc_helpers.track_action($(this).parents(".track").data("sc-id"), "like")
    });

    $("body").on('click', '.repost-action', function() {
      $(this).children().addClass("clicked");
      sc_helpers.track_action($(this).parents(".track").data("sc-id"), "repost")
    });

    $("body").on('click', '.click-out', function() {
      shell.openExternal($(this).parents(".track").data('soundcloud-permalink'));
    });

    $(window).on("scroll", function() {
    	var scrollHeight = $(document).height();
    	var scrollPosition = $(window).height() + $(window).scrollTop();
    	if ((scrollHeight - scrollPosition) / scrollHeight === 0) {
    	    render_page.render_tracks(Track);
    	}
    });
  }
}());
