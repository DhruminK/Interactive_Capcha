// server.js

// IMPORTING NECESSAY PACKAGES =======================
const express    = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const morgan     = require('morgan');
const path       = require('path');
const app        = express();

const configDB   = require('./config/configDB.js');
const port       = process.env.PORT || 8080;
const server     = require('http').createServer(app);

// CONFIGURATION ======================================

mongoose.connect(configDB.URL);			// Configuration of the database

// SETTING UP OUR EXPRESS APPLICATION
app.use('/public', express.static(path.resolve(path.join(__dirname, '/public'))));
app.use('/assets', express.static(path.resolve(path.join(__dirname, '/assets'))));
app.use(morgan('dev'));					// logging requests 
app.use(bodyParser.json());				// send information via JSON
app.use(bodyParser.urlencoded({ extended: false })); // send information via forms

// ROUTES =============================================

require('./app/routes.js')(app);

// LAUNCH ==============================================

server.listen(port, function(){
	console.log(`MAGIC HAPPENS ON PORT: ${port}`);
});

require('./socket/websocket.js')(server, app);


