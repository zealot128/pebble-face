var rocky = require('rocky');

var Config = {
  hourTicks: {
    width: 2,
    length: 6,
    widthQuarter: 2,
    lengthQuarter: 6
  },
  hourHand: {
    width: 3,
    length: 0.5,
    distanceFromCenter: 0.05
  },
  minuteHand: {
    width: 3,
    length: 0.80,
    distanceFromCenter: 0.05
  },
  weather: {
    windArrow: {
      length: 9,
      tipAngle: 35,
      tipLength: 3
    }
  }, 
  theme: {
    light: {
      hourHand: "black",
      minuteHand: "black",
      centerCircle: "darkgray",
      background: "white",
      textColor: "black",
      windArrow: "darkgray",
      hourMarks: "darkgray",
      font: "14px Gothic"
    },
    dark: {
      hourHand: "white",
      minuteHand: "white",
      centerCircle: "lightgray",
      background: "black",
      textColor: "white",
      windArrow: "white",
      hourMarks: "lightgray",
      font: "14px Gothic"
    }
  }
};
var State = {
  weather: null,
  currentTheme: 'light',
  weatherAge: 0,
  // center of screen
  cx: null,
  cy: null
};


var Theme = function(key) {
  return Config.theme[State.currentTheme][key];
};
function fractionToRadian(fraction) {
  return fraction * 2 * Math.PI;
}
function degree2rad(degree) {
  return degree * Math.PI / 180;
}

rocky.on('draw', function(event) {

  var ctx = event.context;
  var d = new Date();
  
  if (State.weather && State.weather.sunrise) {
    var now = d.getTime() / 1000;
    var sunrise = State.weather.sunrise + 30 * 60;
    var sunset = State.weather.sunset + 30 * 60;
    if (sunrise < now) {
      sunrise += 86400;
    }
    if (sunset < now) {
      sunset += 86400;
    }
    console.log("Sunrise=" + sunrise + ", Sunset=" + sunset + ", now=" + now);
    if (sunrise < sunset) { // Aufgang vor Untergang == Nachts
      State.currentTheme = 'dark';
    } else {
      State.currentTheme = 'light';
    }
  }

  // Clear the screen

  ctx.fillStyle = Theme("background");
  ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);


  // Determine the width and height of the display
  var w = ctx.canvas.unobstructedWidth;
  var h = ctx.canvas.unobstructedHeight;

  State.cx = w / 2;
  State.cy = h / 2;
  Config.maxLength = (Math.min(w, h) - 10) / 2;
  
  drawHands(ctx, d);
  drawCenter(ctx);
  for(var i=0; i < 12; i++) {
    drawHourMark(ctx, i);
  }
  drawDate(ctx, formatDate(d));

  // draw weather if not older than 2 hours
  if(State.weather && State.weatherAge > (d.getTime() / 1000 - 7200)){
    drawWeather(ctx, State.weather);
  }
  
  drawTimeText(ctx, d);
  
  function drawTimeText(ctx, d) {
    var minuteFraction = d.getMinutes();
    var hourFraction = d.getHours() % 12;
    var blocked = [];
    console.log(hourFraction + " ; " + minuteFraction);
    if (0 <= hourFraction && hourFraction <= 3) {
      blocked.push('topright');
    } 
    if (3 < hourFraction && hourFraction <= 6) {
      blocked.push('bottomright');
    }
    if (6 < hourFraction && hourFraction <= 9) {
      blocked.push('bottomleft');
    }
    if (9 < hourFraction && hourFraction <= 12) {
      blocked.push('topleft');
    }
    if (0 <= minuteFraction && minuteFraction <= 15) {
      blocked.push('topright');
    } 
    if (15 < minuteFraction && minuteFraction <= 30) {
      blocked.push('bottomright');
    }
    if (30 < minuteFraction && minuteFraction <= 45) {
      blocked.push('bottomleft');
    }
    if (45 < minuteFraction && minuteFraction <= 60) {
      blocked.push('topleft');
    }
    console.log(blocked.join(" "));
    var position = [ 0, 0];
    if (blocked.indexOf("topleft") === -1) {
      position = [ -15, -15];
    }
    if (blocked.indexOf("topright") === -1) {
      position = [ 15, -15];
    }
    if (blocked.indexOf("bottomright") === -1) {
      position = [ 15, 15];
    }
    if (blocked.indexOf("bottomleft") === -1) {
      position = [ -15, 15];
    }
    var hour = d.toLocaleTimeString(undefined, { hour: "2-digit"});
    var min = d.toLocaleTimeString(undefined, { minute: "2-digit"});
    ctx.textAlign = 'center';
  // Display the time, in the middle of the screen
    ctx.fillText(hour + ":" + min, State.cx + position[0], State.cy + position[1], State.cx);
  }

});

function drawCenter(ctx) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = Theme('centerCircle');
  ctx.beginPath();
  ctx.arc(State.cx, State.cy, 3, 0, 2 * Math.PI, false);
  ctx.stroke(); 
}

function drawDate(ctx, dateString) {
  ctx.fillStyle = Theme('textColor');
  ctx.font = Theme('font');
  // Center align the text
  ctx.textAlign = 'right';
  // Display the time, in the middle of the screen
  ctx.fillText(dateString, State.cx * 2 - 5, (State.cy * 2) - 20, State.cx - 5);
}

function drawHand(ctx, angle, config, color) {
  // Find the end points
  var x2 = State.cx + Math.sin(angle) * config.length * Config.maxLength;
  var y2 = State.cy - Math.cos(angle) * config.length * Config.maxLength;

  var x1 = State.cx + Math.sin(angle) * (config.distanceFromCenter * Config.maxLength);
  var y1 = State.cy - Math.cos(angle) * (config.distanceFromCenter * Config.maxLength);
  drawLine(ctx, x1, y1, x2, y2, config.width, color);
}

function drawWeather(ctx, weather) {
  ctx.fillStyle =  Theme('textColor');
  ctx.font = Theme('font');
  ctx.textAlign = 'left';
  var string = "" + weather.temp + "°C " + weather.desc + " H " + weather.humidity + "%";
  ctx.fillText(string, 5, 2, (State.cx * 2 - 10));  
  ctx.textAlign = 'right';

  
  var deg = weather.windDeg - 90; // Offset; Wind rose 0 degree is north, while math 0 degree is x axis
  if(deg < 0) {
    deg = deg + 360;
  }
  var windAngle = degree2rad(deg);
  var arrowLength = Config.weather.windArrow.length;
  
  var dx = arrowLength * Math.cos(windAngle);
  var dy = arrowLength * Math.sin(windAngle);
  var x1 = 10;
  var y1 = round(State.cy * 2 - 10);
  var x2 = round(x1 + dx);
  var y2 = round(y1 + dy);
  
  var ymin = Math.max(y1, y2);
  var deltaYmin = State.cy * 2 - 5 - ymin;
  y1 += deltaYmin;
  y2 += deltaYmin;
  
  var xmax = Math.max(x1, x2);
  var deltaXmax = 20 - 5 - xmax;
  x1 += deltaXmax;
  x2 += deltaXmax;

  drawLine(ctx, x1, y1, x2, y2, 1, Theme("windArrow"));  
 
  function drawArrowTip(ctx, x1, x2, tipAngle) {
    var C = Config.weather.windArrow;
    var arrowDegree = degree2rad(tipAngle);
    var arrowX = Math.cos(arrowDegree) * C.tipLength;
    var arrowY = Math.sin(arrowDegree) * C.tipLength;
    var x3 = round(x2 + arrowX);
    var y3 = round(y2 + arrowY);
    drawLine(ctx, x2, y2, x3, y3, 1, Theme("windArrow"));     
  }
  drawArrowTip(ctx, x1, x2, deg + 180 - Config.weather.windArrow.tipAngle);
  drawArrowTip(ctx, x1, x2, deg + 180 + Config.weather.windArrow.tipAngle);
  ctx.textAlign = 'left';
  ctx.fillText("" + weather.windSpeed + "km/h", 20, (State.cy * 2) - 20, (State.cx - 10));
}

function round(number) {
  return Math.round(number * 10) / 10;
}


function formatDate(d) {
  // TODO d.toLocaleString is broken in emulator, so manual
  var m = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" ][d.getMonth()];
  var day = d.getDate();
  var w = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][d.getDay()];
  return w + ", " + day + ". " + m;
}

function drawHands(ctx, d) {
  // Calculate the minute hand angle
  var minuteFraction = (d.getMinutes()) / 60;
  var minuteAngle = fractionToRadian(minuteFraction);
  drawHand(ctx, minuteAngle, Config.minuteHand, Theme('hourHand'));

  // Calculate the hour hand angle
  var hourFraction = (d.getHours() % 12 + minuteFraction) / 12;
  var hourAngle = fractionToRadian(hourFraction);
  drawHand(ctx, hourAngle, Config.hourHand, 'minuteHand');
}


function drawHourMark(ctx, i) {
  var pos = i / 12;
  var angle = fractionToRadian(pos);
  var length, width;
  if (i % 3 === 0) {
    length = Config.hourTicks.lengthQuarter;
    width = Config.hourTicks.widthQuarter;
  } else {    
    width = Config.hourTicks.width;
    length = Config.hourTicks.length;
  }
  var radius = Config.maxLength * 0.9;
  var x1 = State.cx + Math.sin(angle) * radius;
  var y1 = State.cy - Math.cos(angle) * radius;
  var x2 = State.cx + Math.sin(angle) *  (radius + length );
  var y2 = State.cy - Math.cos(angle) *  (radius + length );
  drawLine(ctx, x1, y1, x2, y2, width, Theme('hourMarks'));

}

function drawLine(ctx, x1, y1, x2, y2, lineWidth, color) {
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

rocky.on('minutechange', function(event) {
  // Request the screen to be redrawn on next pass
  rocky.requestDraw();
});

rocky.on("hourchange", function(event) {
  rocky.postMessage({'fetch': true});
});

rocky.on('message', function(event) {
  var message = event.data;
  if (message.weather) { 
    State.weather = message.weather;
    State.weatherAge = new Date().getTime() / 1000;
    rocky.requestDraw();
  }
});
