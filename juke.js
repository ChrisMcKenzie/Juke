var xml2js = require('xml2js');
var Spotify = require('spotify-web');
var s = require('spotify');
var lame = require('lame');
var Speaker = require('speaker');
var util = require('util');
var commander = require('commander');
var ansi = require('ansi');
var creds = require('./cred.json');
var username, password;

commander.version('0.0.1');

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
          tracks.push(' > '+track.name+' - '+track.artists[0].name+' ('+track.album.name+', '+track.album.label+', '+track.album.released+') ['+prettyPopularity(track.popularity, 10)+'] ');
        });

        //console.log(data);
        console.log("Select a Song:");
        commander.choose(tracks, function(i){

          //Play with spotify-web.
          Spotify.login(username, password, function (err, spotify) {
            if (err) throw err;

            // first get a "Track" instance from the track URI
            spotify.get(data.tracks[i].href, function (err, track) {
              reset();
              if (err) throw err;

              play(track, function(){
                prompt();
              });
            });
          });
        });


    });

  });
}

function play(track, fn){
  var speaker = new Speaker();
  var stream = track.play();
  var rawstream = stream.pipe(new lame.Decoder());
  var trackDuration = track.duration;

  rawstream.pipe(speaker);

  console.log(' > '+track.name+' - '+track.artist[0].name+' ('+track.album.name+', '+track.album.label+', '+track.album.date.year+') ['+prettyPopularity(track.popularity, 10)+'] ');

  setTimeout(function () {
    fn();
  }, track.duration);
}

function prettyPopularity(popularity, width) {
  var output = "";
  var fill = "#";
  var unfill = "-";
  var ratio = popularity/100;
  for (var i = 0; i < width; i++) {
    if (i < ratio*width) {
      output += fill;
    } else {
      output += unfill;
    }
  }
  return output;
}

function timeFormat(duration){
  var time = ~~(duration / 1000);
  var minutes = Math.floor(time / 60);
  time -= minutes * 60;
  var seconds = parseInt(time % 60, 10);

  return trackLength = minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
}

// clear screen and move cursor
function reset(){
  function lf(){return '\n'}
  ansi(process.stdout)
              .eraseData(2)
              .goto(1, 1)
}

reset();
if(creds.username === undefined || creds.password === undefined){
  commander.prompt('Spotify Username: ', function(name){
    username = name;

    commander.password('Spotify Password: ', function(pw){
      password = pw;
      prompt();
    });
  });
} else {
  username = creds.username;
  password = creds.password;
  prompt();
}
