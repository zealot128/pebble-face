var rocky = require('rocky');

var Config = {
  hourHand: {
    width: 3,
    length: 0.5,
    distanceFromCenter: 0.05,
    color: "white"
  },
  minuteHand: {
    width: 2,
    length: 0.85,
    distanceFromCenter: 0.05,
    color: "white"
  }
};

function fractionToRadian(fraction) {
  return fraction * 2 * Math.PI;
}

function drawHand(ctx, angle, config) {
  // Find the end points
  var x2 = Config.cx + Math.sin(angle) * config.length * Config.maxLength;
  var y2 = Config.cy - Math.cos(angle) * config.length * Config.maxLength;

  var x1 = Config.cx + Math.sin(angle) * (config.distanceFromCenter * Config.maxLength);
  var y1 = Config.cy - Math.cos(angle) * (config.distanceFromCenter * Config.maxLength);
  drawLine(ctx, x1, y1, x2, y2, config.width, config.color);
}

rocky.on('draw', function(event) {

  var ctx = event.context;
  var d = new Date();

  // Clear the screen
  ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

  // Determine the width and height of the display
  var w = ctx.canvas.unobstructedWidth;
  var h = ctx.canvas.unobstructedHeight;

  // Determine the center point of the display
  // and the max size of watch hands
  Config.cx = w / 2;
  Config.cy = h / 2;

  // -20 so we're inset 10px on each side
  Config.maxLength = (Math.min(w, h) - 20) / 2;
  
  drawHands(ctx, d);

  
  for(var i=0; i < 12; i++) {
    drawHourMark(ctx, i);
  }

  var dateString = formatDate(d);
  ctx.fillStyle = 'white';
  ctx.font = '14px Gothic';
  // Center align the text
  ctx.textAlign = 'center';
  // Display the time, in the middle of the screen
  ctx.fillText(dateString, Config.cx + w / 4, h - 20, (w / 2) - 5);
  //drawDate(ctx, d);
});

function formatDate(d) {
  // TODO d.toLocaleString is broken in emulator, so manual
  var m = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" ][d.getMonth()];
  var day = d.getDate();
  var w = [null, "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][d.getDay()];
  return w + ", " + day + ". " + m;
}

function drawHands(ctx, d) {
  // Calculate the minute hand angle
  var minuteFraction = (d.getMinutes()) / 60;
  var minuteAngle = fractionToRadian(minuteFraction);
  drawHand(ctx, minuteAngle, Config.minuteHand);

  // Calculate the hour hand angle
  var hourFraction = (d.getHours() % 12 + minuteFraction) / 12;
  var hourAngle = fractionToRadian(hourFraction);
  drawHand(ctx, hourAngle, Config.hourHand);
  drawHand(ctx, hourAngle, {
    width: 1,
    length: 0.48,
    distanceFromCenter: 0.05,
    color: "darkgray"
  });
}


function drawHourMark(ctx, i) {
  var pos = i / 12;
  var angle = fractionToRadian(pos);
  var length, width;
  if (i % 3 === 0) {
    length = 2;
    width = 2;
  } else {    
    length = 1;
    width = 1;
  }
  var x1 = Config.cx + Math.sin(angle) * Config.maxLength;
  var y1 = Config.cy - Math.cos(angle) * Config.maxLength;
  var x2 = Config.cx + Math.sin(angle) *  (Config.maxLength + length );
  var y2 = Config.cy - Math.cos(angle) *  (Config.maxLength + length );
  drawLine(ctx, x1, y1, x2, y2, width, "lightgray");

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
