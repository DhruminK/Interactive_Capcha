// socket/qs_gen.js

// IMPORTING THE NECESSARY PACKAGES 
const Questions = require('../app/models/Questions.js');
const _ = require('lodash');


// Questions Array to randomly pick a question
let questions_array = [
    "What is your philosophy in life?",
    "What is the one thing you would like to change about yourself?",
    "Are you religious or spiritual?",
    "Do you consider yourself an introvert or an extrovert?",
    "Which parent are you closer to and why?",
    "What was the best phase in your life?",
    "What was the worst phase in your life?",
    "Is what you’re doing now what you always wanted to do growing up?",
    "What makes you feel accomplished?",
    "Are you confrontational?"
];


// exporting this module to rest of our app
module.exports = question_sent;


// Function to pick a random question from question array and sending it to user
function question_sent(usr, socket, message, Qs, count, done) {
    
    // count: keeps the count of the question sent
    // If count is not defined, define it
    if (count === null) {
        count = 0;
    }

    // done: keeps the index number of question sent
    // If the done array is not defined, define
    if (done === null) {
        done = [];
    }

    // if count is equal to 5 user is done signing up
    if (count === 5) {
        console.log('Here');
        message.content = 'We are done Signing You Up';
        // Saving a reference of Questions document id in Users document,
        // for sign_in purpose
        usr.qs = Qs._id;
        usr.save((err) => {
            if (err) {
                throw err;
            }

            // if everything is okay sent a message to user
            socket.emit('message:question:follow', message);
        });
    } else {

        // generating a number randomly
        let number = 0;

        // loop finds if the question already being sent to user or not
        while (true) {
            number = _.random(questions_array.length - 1);
            let b = _.find(done, (value) => {
                if (value === number) {
                    return true;
                }
                return false;
            });
            if (b === undefined) {
                break;
            }
        }
        // if the question is not asked, then sent it to user
        done.push(number);
        count++;
        message.content = questions_array[number];
        socket.emit('message:question:follow', message);

        // returning the count, done, question
        return {
            count: count,
            done: done,
            question: questions_array[number]
        };
    }
}
