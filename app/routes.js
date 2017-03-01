// app/routes.js

// IMPORTING THE NECESSARY PACKAGES ==================
const path      = require('path');
const _         = require('lodash');
const pos       = require('pos');
const nlp       = require('nlp_compromise');
const User      = require('./models/User.js');
const Questions = require('./models/Questions.js');

module.exports = function(app){

	// HOME PAGE(with login links)
	app.get('/', function(req, res){
		res.sendFile(path.resolve(path.join(__dirname, '../public/html/index.html')));
	});

	// FOR TESTING PURPOSES
	app.post('/test', function(req, res){
		
		let text = req.body.text;
		let lexicon = nlp.lexicon();
		lexicon["student"] = "Actor";
		let sent = nlp.sentence(text, {lexicon: lexicon});
		//lexicon["teacher"] = "Actor";
		return res.send(sent);

		


	});

};