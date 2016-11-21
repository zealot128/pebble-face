
var OPENWEATHER_APIKEY = "a06e04c571698b278c625d94db0812f6";
var State = {
  lat: null,
  lon: null,
  lastUpdate: 0
};

var postWeather = function()  {
  var url = 'http://api.openweathermap.org/data/2.5/weather' +
      '?lat=' + State.lat  +
      '&lon=' + State.lon  +
      '&units=metric&lang=de' +
      '&appid=' + OPENWEATHER_APIKEY;

  log("Weather url: " + url);

  request(url, 'GET', function(respText) {
    log("Response from weather API:");
    log(respText);
    var weatherData = JSON.parse(respText);
    Pebble.postMessage({
      'weather': {
        'windSpeed': Math.round(weatherData.wind.speed * 3.6),
        'windDeg': weatherData.wind.deg,
        'humidity': weatherData.main.humidity, // percent
        'tempMin': weatherData.main.temp_min,
        'tempMax': weatherData.main.temp_max,
        'sunrise': weatherData.sys.sunrise, // Unix epoch
        'sunset': weatherData.sys.sunset,
        'location': weatherData.name,
        'temp': Math.round(weatherData.main.temp),
        'visibility': weatherData.visibility / 1000, // Visibility in km
        'desc': weatherData.weather[0].description
      }
    });
  });
};

Pebble.on('message', function(event) {
  // Get the message that was passed
  var message = event.data;

  if (message.fetch) {
    log("Requesting weather");
    navigator.geolocation.getCurrentPosition(function(pos) {
       State.lat = pos.coords.latitude;
       State.lon = pos.coords.longitude;
       State.lastUpdate = new Date().getTime();
       postWeather();
    }, function(err) {
      console.error('Error getting location');
      console.error(err.message);
      var now = Date().toTime();
      // If last position info is not older than 30 min, reuse that coords
      if(State.lat !== null && State.lastUpdate > (now - 30 * 60 * 1000)) {
        log("Reusing last lat update");
        postWeather();
      }
    },
    { timeout: 60000, maximumAge: 600 * 1000 });
  }
});

function request(url, type, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.send();
}

function log(msg) {
  console.log(msg);
}