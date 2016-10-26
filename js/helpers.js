(function() {

  if (!Array.prototype.last) {
      Array.prototype.last = function(){
          return this[this.length - 1];
      };
  };

  module.exports.first_run = function(Data) {
    return new Promise(function(fulfill) {
      Data.find({
        where: {
          key: settings.db.data_field.soundcloud_credentials
        }
      }).then(function(instance) {
        if(instance && instance.value) {
          sc_helpers.setup_soundcloud(instance.value.username, instance.value.password).then(function() {
            fulfill({first_run: false});
          })
        } else {
          $("#overlay").show();
          $("body").addClass("modal-open");
          $("#sc-prompt").css('display', 'inline-block');

          $("#submit-button").on('click', function() {
            var sc_obj = {
              username: $("#sc-username").val(),
              password: $("#sc-password").val()
            }

            sc_helpers.setup_soundcloud(sc_obj.username, sc_obj.password).then(function(success) {
              if(success) {
                $("#submit-button").prop("disabled", true);
                Data.upsert({
                  key: settings.db.data_field.soundcloud_credentials,
                  value: sc_obj
                }).then(function() {
                  $("#overlay").hide();
                  $("body").removeClass("modal-open");
                  $("#sc-prompt").hide();
                  fulfill({first_run: true});
                });
              } else {
                $("#incorrect-up").show();
              }
            });
          });
        }
      });
    });
  };

  module.exports.loader_show = function() {
    $("#overlay").show();
    $("body").addClass("modal-open");
    $("#loader-container").show();
  };

  module.exports.loader_change_message = function(message) {
    $("#loader-message").html(message);
  };

  module.exports.loader_hide = function(message) {
    $("body").removeClass("modal-open");
    $("#loader-container").hide();
    $("#loader-message").html("");
    $("#overlay").hide();
  };

  // https://gist.github.com/olvado/1048628
  module.exports.getAverageRGB = function(imgEl) {
    var blockSize = 5, // only visit every 5 pixels
      defaultRGB = "rgb(230, 233, 238)",
      canvas = document.createElement('canvas'),
      context = canvas.getContext && canvas.getContext('2d'),
      data, width, height,
      i = -4,
      length,
      rgb = {r:0,g:0,b:0},
      count = 0;

      if (!context) {
        return defaultRGB;
      }

      height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
      width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

      context.drawImage(imgEl, 0, 0);

      try {
        data = context.getImageData(0, 0, width, height);
      } catch(e) {
        return defaultRGB;
      }

      length = data.data.length;

      while ( (i += blockSize * 4) < length ) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
      }

      // ~~ used to floor values
      rgb.r = ~~(rgb.r/count);
      rgb.g = ~~(rgb.g/count);
      rgb.b = ~~(rgb.b/count);

      return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  }

  module.exports.titleCase = function(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

}());
