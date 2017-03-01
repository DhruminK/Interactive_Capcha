// app/models/User.js

// IMPORTING THE NECESSARY PACKAGES ==============
const mongoose = require('mongoose');
const Questions = require('./Questions.js');


// Define our schema 
let UserSchema = mongoose.Schema({
	local: {
		first_name      :'String',
		last_name       :'String',
		middle_name     :'String',
		full_name       :'String'
	},
	qs: { type: mongoose.Schema.Types.ObjectId }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);