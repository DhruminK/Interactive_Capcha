// app/models/Question.js

// IMPORTING THE NECESSARY PACKAGES ---------------
var mongoose = require('mongoose');
var User = require('./User.js');

let QuestionSchema = mongoose.Schema({
	q_id: Number,
	q_profession: String,
	q_department: String,
	q_year: String,
	qs: [{
		question: String,
		summary: String,
		answers: String
	}]
});

module.exports = mongoose.model('Questions', QuestionSchema);