var xml2js = require('xml2js');
var Spotify = require('spotify-web');
var s = require('spotify');
var lame = require('lame');
var Speaker = require('speaker');
var util = require('util');
var commander = require('commander');
var ansi = require('ansi');

var username, password;
commander.version('0.0.1');

commander.prompt('Username: ', function(name){
  username = name;

  commander.password('password: ', function(pw){
    password = pw;
    prompt();
  });
});

var prompt = function(){
  reset();

  commander.prompt('Search for a song: ', function(song){
    //search with spotify lib
    s.search({ type: 'track', query: song }, function(err, data) {
        if ( err ) {
            console.log('Error occurred: ' + err);
            return;
        }

        data.tracks = data.tracks.slice(0, 20);
        var tracks = [];
        data.tracks.forEach(function(track){
          tracks.push(track.name + ' - ' + track.artists[0].name);
        });

        //console.log(data);
        console.log("Choose a result:");
        commander.choose(tracks, function(i){

          //Play with spotify-web.
          Spotify.login(username, password, function (err, spotify) {
            if (err) throw err;

            // first get a "Track" instance from the track URI
            spotify.get(data.tracks[i].href, function (err, track) {
              reset();
              if (err) throw err;

              console.log('Playing: %s - %s', track.artist[0].name, track.name);
              //sw();
              track.play()
              .pipe(new lame.Decoder())
              .pipe(new Speaker())
              .on('finish', function () {
                spotify.disconnect();
                prompt();
              });


            });
          });
        });


    });

  });
}

// clear screen and move cursor
function reset(){
  process.title = "Juke";
  function lf(){return '\n'}
  ansi(process.stdout)
              .write(Array.apply(null, Array(process.stdout.getWindowSize()[1])).map(lf).join(''))
              .eraseData(2)
              .goto(1, 1)
}
