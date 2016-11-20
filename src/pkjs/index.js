
var OPENWEATHER_APIKEY = "a06e04c571698b278c625d94db0812f6";

Pebble.on('message', function(event) {
  // Get the message that was passed
  var message = event.data;

  if (message.fetch) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      var url = 'http://api.openweathermap.org/data/2.5/weather' +
              '?lat=' + pos.coords.latitude +
              '&lon=' + pos.coords.longitude +
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
    }, function(err) {
      console.error('Error getting location');
    },
    { timeout: 15000, maximumAge: 60000 });
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
  //console.log(msg);
}