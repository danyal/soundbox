# Soundbox
Soundbox is a desktop app (built using Node & Electron) that allows you to keep track of what you've listened to in your Soundcloud feed. Every time the app is opened, it downloads and saves track metadata for all new tracks that have been added to your feed. When you play a track in the app, it's automatically marked as 'listened' and will be hidden the next time you open the app.

Features
- Filter by Tracks or Mixes (mixes are tracks that are longer than 15 minutes)
- Sort by play count
- Tracks from new follows are added to inbox from the point at which you open the app (after following) onwards

Todo
- Sync feed (from beginning of time) when user has new follows or unfollows
  - The code for this already exists (sc_helpers.js --> update_followings) however the Soundcloud API (/me/activities) doesn't provide the user who reposted the track. Lack of this data makes it impossible to filter by reposter for inserts or deletes.

## Prepackaged
OSX: [Download](http://www.soundbox.fyi)

## Development

 1. Install node (6.9.0 LTS)
 2. Clone the soundbox repository
 3. [Register a new app](http://soundcloud.com/you/apps/new) with Soundcloud and get your own app keys
 4. Fill in js/settings.js with your client_id and client_secret
 5. ```npm install```
 6. ```./node_modules/.bin/electron-rebuild```
 7. ```npm start```

### Additional Info
  - The database file will be written to /Users/[user]/Library/Application Support/Electron
    - Once the app is packaged the database file is written to /Users/[user]/Library/Application Support/Soundbox
  - To delete the database run ```npm run delete_db```

### Packaging the app for distribution
I used electron-packager to package the app: [electron-packager](https://github.com/maxogden/electron-packager).
```
npm install -g electron-packager@8.1.0
```

Run the following from the root directory.
```
electron-packager . soundbox --platform=darwin --arch=x64 --version=1.4.3 --overwrite --asar=true --app-version=0.1.0 --asar-unpack-dir=node_modules --icon 'img/soundcloud-inbox-large-logo.icns'
```

This will create a new directory called "soundbox-darwin-x64" where you will find soundbox.app
