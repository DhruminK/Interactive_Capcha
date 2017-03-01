// socket/qs_gen_2.js

// IMPORTING THE NECESSARY PACKAGES ----------------
const _ = require('lodash');
const qs = require('../app/models/Questions.js');
const nlp = require('nlp_compromise');

// Function to generate questions
function question_sent(usr, socket, message, Qs, lexicon) {

    lexicon["student"] = "Actor";
    message.content = "What is your occupation ?";
    let professions = false;
    socket.emit("message:question:follow", message);

    socket.on('message:question:follow', (msg) => {
        let content = nlp.sentence(data.content, { lexicon: lexicon })
        if (!professions) {
            let profession = _.filter(content.terms, (m) => {
                if (m.tag === "Actor") {
                    return true;
                }
                return false;
            });
            Qs.q_profession = profession[0];
            Qs.save((err) => {
                message.profession = profession[0].normal;
                if (profession[0].normal === "student") {
                    professions = true;
                    prof_student(usr, socket, message, Qs, lexicon);
                } else if (profession[0].normal === "teacher") {
                    professions = true;

                } else {

                }
            });
        }
    });


}

// Function to question users if the profession is student
function prof_student(usr, socket, message, Qs, lexicon) {

    message.content = "Which department do you study ?";
    socket.emit('message:question:follow:student', message);

    socket.on('message:question:follow:student', (msg) => {

        let content = nlp.sentence(msg.content, { lexicon: lexicon });
        if (!Qs.q_department) {

            let dept = _.filter(content.terms, (m) => {
                if (m.tag === "Organization") {
                    return true;
                }
                return false;
            });


            Qs.q_department = dept[0];
            Qs.save((err) => {
                message.content = "You are currently in which year ?";
                socket.emit("message:question:follow:student", message);
            });
        }
        else if(!Qs.q_year) {
        	let year = _.filter(content.terms, (m) => {
        		if(m.tag === "Date") {
        			return true;
        		}
        		return false;
        	});

        	Qs.q_year = year[0];
        	Qs.save((err) => {});
        }

    })
}
