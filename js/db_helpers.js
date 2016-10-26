(function() {

  module.exports.connect_to_db = function() {
    sequelize = new Sequelize(settings.db.name, settings.db.username, settings.db.password, {
      host: 'localhost',
      dialect: 'sqlite',
      storage: __dataDir + "/" + settings.db.filename,
      logging: false
    });
    return sequelize;
  }

  module.exports.define_data_schema = function() {
    return sequelize.define('data', {
      key: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      value: {
        type: Sequelize.STRING,
        get: function() {
          return JSON.parse(this.getDataValue('value'));
        },
        set: function(data) {
          this.setDataValue('value', JSON.stringify(data));
        }
      }
    }, {
      freezeTableName: true,
    });
  }

  module.exports.define_track_schema = function() {
    return sequelize.define('track', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING
      },
      added_on: {
        type: Sequelize.DATE
      },
      have_listened: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sc_id: {
        type: Sequelize.INTEGER,
        unique: true
      },
      username: {
        type: Sequelize.STRING
      },
      genre: {
        type: Sequelize.STRING
      },
      playback_count: {
        type: Sequelize.INTEGER
      },
      permalink: {
        type: Sequelize.STRING
      },
      artwork: {
        type: Sequelize.STRING
      },
      duration: {
        type: Sequelize.INTEGER
      }
    }, {
      freezeTableName: true,
      timestamps: true,
      underscored: true,
    });
  }
}());
