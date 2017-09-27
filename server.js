var express = require('express'); // ExperssJS Framework
var app = express(); // Invoke express to variable for use in application
var port = process.env.PORT || 8080; // Set default port or assign a port in enviornment
var morgan = require('morgan'); // Import Morgan Package
var mongoose = require('mongoose'); // HTTP request logger middleware for Node.js
var bodyParser = require('body-parser'); // Node.js body parsing middleware. Parses incoming request bodies in a middleware before your handlers, available under req.body.
var router = express.Router(); // Invoke the Express Router
var appRoutes = require('./app/routes/api')(router); // Import the application end points/API
var path = require('path'); // Import path module
var passport = require('passport'); // Express-compatible authentication middleware for Node.js.
var social = require('./app/passport/passport')(app, passport); // Import passport.js End Points/API
var http = require('http');
//var client = require('twilio')('ACad00c64222181c5f5dca2dfc0a071c66')('b0d2ef8a0257c32b456b262ea29a811e')
//var client = require('twilio');
//Rahil Modi
//const config = require('./config/database');
app.use(morgan('dev')); // Morgan Middleware
app.use(bodyParser.json()); // Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/public')); // Allow front end to access public folder
app.use('/api', appRoutes); // Assign name to end points (e.g. '/api/users' ,etc. )



var server = http.createServer(app).listen(port, function(){
  console.log('Express server listening on port ' + port);
});
var map = [];

var io = require('socket.io')(server);
io.on('connection', function(socket){
  console.log("user connected");
  console.log(socket.id);
  //console.log(socket);
  socket.emit('notifications', "hello");
  socket.on('userLoggedIn',function(data){
      console.log(data);
      console.log('userLoggedIn');
      var json = {username:data,socket:socket};
      console.log(map);
      if(map.length == 0)
      {
          map.push(json);
          console.log(map);
      }
      else {
          map.forEach((user)=>{
              if(user.username == data){
                  console.log('user already exist..');
              }
              else {
                  map.push(json);
                  console.log(map);
              }
          });
      }
  });
 
  socket.on('disconnect', function(){
	  console.log("connection closed");
  });
});


// var accountSid = 'ACad00c64222181c5f5dca2dfc0a071c66';
// var authToken = 'b0d2ef8a0257c32b456b262ea29a811e';

// //require the Twilio module and create a REST client
// var client = require('twilio')(accountSid, authToken);
// client.messages.create({
//     to: "+15105857576",
//     from: "+15106835791",
//     body: "This is the ship that made the Kessel Run in fourteen parsecs?",
//     //mediaUrl: "https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg",
// }, function(err, message) {
//     console.log(message.sid);
// });

//
// <---------- REPLACE WITH YOUR MONGOOSE CONFIGURATION ---------->
//
//connecting database
//Rahil Modi
// mongoose.connect(config.database);
//
// //on connection
// mongoose.connection.on('connected',() => {
//     console.log('Successfully connected to database : ' +  config.database);
// });
//
// mongoose.connection.on('error',(err) => {
//     console.log('Error while connecting to database : ' + err);
// });

    // mongoose.connect('mongodb://akhilesh_272:cmpe272@ds127391.mlab.com:27391/cmpe272', (err)=>{
    //         if (err) {
    //             console.log('Not connected to the database: ' + err); // Log to console if unable to connect to database
    //         } else {
    //             console.log('Successfully connected to MongoDB'); // Log to console if able to connect to database
    //         }
    // });

var mongodbURL = 'mongodb://akhilesh_272:cmpe272@ds127391.mlab.com:27391/cmpe272';
// var mongodbURL = 'mongodb://root:password@ds027215.mlab.com:27215/gugui3z24'; //mongodbURl
var connection = mongoose.connect(mongodbURL);


// Set Application Static Layout
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/app/views/index.html')); // Set index.html as layout
});

// Start Server
// app.listen(port, function() {
//     console.log('Running the server on port ' + port); // Listen on configured port
// });

exports.io = io;
exports.map = map;
