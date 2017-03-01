// socket/websocket.js

// IMPORTING THE NECESSARY PACKAGES =====================
const _ = require('lodash');
const soc = require('socket.io');
const nlp = require('nlp_compromise');
const User = require('../app/models/User.js');
const Questions = require('../app/models/Questions.js');
const Qs_gen = require('./Qs_gen.js');
const senti = require('sentiment');

// nlp lexicon
let lexicon = nlp.lexicon();

// function to check if the query contains name of user or not
function name_checker(data, usr, message, callback) {

    // detokenize the sentence and gives Parts-of-Speech tagging
    let content = nlp.sentence(data.content, { lexicon: lexicon });

    // finding if the sentence is declaritive or not
    let qs = content.sentence_type();
    // If the sentence is not declarative
    if (qs !== 'declarative') {

        // Send the message that content not found
        message.content = "I need your name to authticate you.";
        callback(message);
    } else {

        message = find_people(data, content, message);
        if (message.foundPeople) {
            let nor = message.people;

            return name_database_pre_processing(nor, usr, message, callback);
        } else {
            message.content = "I need your name to authticate you";
            callback(message);
        }
    }
}

// Function to find people
function find_people(data, content, message) {
    // finding if there is a name of person in the sentence
    let people = content.people();

    // if a name is found and it is 'I' then filter it out
    people = _.filter(people, data => {
        if(data.normal === 'i'){
            return false;
        }
        return true;
    });
    
    if (people.length !== 0) {
        // check if the name is in the database
        console.log('People found');
        let nor = people[0];
        message.foundPeople = true;
        message.people = nor;
        return message;

    } else {

        // check sentence for nouns 
        let sent_terms = content.terms;
        console.log('People not found');
        let nouns = _.filter(sent_terms, (data) => {
            if (data.pos.Noun && !data.pos.Pronoun) {
                return true;
            }
            return false;
        });

        console.log(nouns);

        if(nouns.length === 0) {
            message.foundPeople = false;
            return message;
        }
        // if there are nouns in the sentence then they are probably names(hopefully)
        let name_terms = nouns[0].normal.split(' ');
        if (name_terms.length === 1) {

            // add the names for future references
            lexicon[name_terms[0]] = 'Person';
        } else if (name_terms.length === 2) {
            lexicon[name_terms[0]] = 'Person';
        } else if (name_terms.length === 3) {
            lexicon[name_terms[0]] = 'Person';
            lexicon[name_terms[1]] = 'Person';
        }

        content = nlp.sentence(data.content, { lexicon: lexicon });
        let people = content.people();

        // find the edge case("I") and avoid it
        if (people[0].text === 'I') {
            people[0] = people[1];
        }

        // there is a recognizable name in the sentence now 
        if (people.length !== 0) {
            let nor = people[0]
            message.foundPeople = true;
            message.people = nor;
            return message;
        } else {

            message.content = "I need your name to authticate you.";
            message.foundPeople = false;
            return message;
        }
    }
}



// Function to store the usernames found into usr variable 
function name_database_pre_processing(norm, usr, message, callback) {
    let nor = norm.normal;
    let firstName = null;
    let lastName = null;
    let middleName = null;
    let n = nor.split(" ");
    if (n.length === 3) {
        firstName = norm.firstName;
        middleName = norm.middleName;
        lastName = norm.lastName;
    } else if (n.length === 2) {
        if (usr.firstName !== null) {
            firstName = usr.firstName;
            middleName = n[0];
            lastName = n[1];
        } else {
            firstName = norm.firstName;
            lastName = norm.lastName;
        }
    } else {
        if (usr.firstName !== null && usr.lastName !== null) {
            firstName = usr.firstName;
            lastName = usr.lastName;
            middleName = nor;
        } else if (usr.firstName !== null) {
            firstName = usr.firstName;
            lastName = nor;
        } else {
            firstName = nor;
        }
    }

    if (usr.firstName === null) {
        usr.firstName = firstName.toLowerCase();
    }

    if (usr.middleName === null && middleName) {
        usr.middleName = middleName.toLowerCase();
    }
    if (usr.lastName === null && lastName) {
        usr.lastName = lastName.toLowerCase();
    }
    name_database_checker(norm, usr, message, callback);

}

// function to search the database
function name_database_checker(norm, usr, message, callback) {
    if ((usr.lastName) === null && (usr.middleName) === null) {

        User.find({ 'local.first_name': usr.firstName }, function(err, docs) {

            // If an error occurs then throw an error
            if (err) {
                throw err;
            }

            // If the name is not found in the database
            if (docs.length === 0) {
                message.content = 'No User found whose name is ' + norm.text;
            }

            callback(message, usr, norm, docs);

        });

    } else if ((usr.middleName) === null) {
        User.find({ $and: [{ 'local.first_name': usr.firstName }, { 'local.last_name': usr.lastName }] }, function(err, docs) {

            // If an error occurs then throw an error
            if (err) {
                throw err;
            }

            // If the name is not found in the database
            if (docs.length === 0) {
                message.content = 'No User found whose name is ' + norm.text;
            }

            callback(message, usr, norm, docs);

        });
    } else {
        User.find({ $and: [{ 'local.first_name': usr.firstName }, { 'local.last_name': usr.lastName }, { 'local.middle_name': usr.middleName }] }, function(err, docs) {

            // If an error occurs then throw an error
            if (err) {
                throw err;
            }
            // If the name is not found in the database
            if (docs.length === 0) {
                message.content = 'No User found whose name is ' + norm.text;
            }

            callback(message, usr, norm, docs);

        });
    }

}



// exposing our socket configuration to rest of our app
module.exports = function(server, app) {
    // listen to our port 8080
    const io = soc.listen(server);


    io.on('connection', function(socket) {

        let message = {};
        // To find the user
        let usr = {};
        usr.firstName = null;
        usr.middleName = null;
        usr.lastName = null;
        usr.User = {};
        usr.foundUser = false;


        // Setting User as "Bot", and content of the message to be send to user
        message.user = 'Bot';
        message.content = 'May I know your name ?';

        // to keep track of wrong answer
        let wrongAnsCount = 0;

        socket.emit('message', message);

        socket.on('message', (data) => {
            name_checker(data, usr, message, (result, us, norm, docs) => {

                if(!docs){
                    console.log('Here');
                    return socket.emit('message', result);
                }


                if ((usr.firstName) === null) {
                    usr.firstName = us.firstName;
                }
                if ((usr.middleName) === null) {
                    usr.middleName = us.middleName;
                }
                if ((usr.lastName) === null) {
                    usr.lastName = us.lastName;
                }
                if (docs && docs.length !== 0) {

                    // If there are more than one user with the name provided, in database
                    if (docs.length > 1) {
                        if (usr.lastName === null) {
                            message.content = 'Multiple Users found, please provide your last name';
                        } else if (usr.middleName === null) {
                            message.content = 'Multiple Users found, please provide your middle name';
                        }
                    }
                    // If there is exactly one user with the name provided
                    else {
                        message.content = 'User found with the same username ';
                        usr.User = docs;
                    }

                    return socket.emit('message', message);

                }
                if (docs.length === 0) {
                    message.content = result.content + ', would you like to signUp as new user';
                    return socket.emit('message:newUser', message)
                }

                return socket.emit('message', result)


            })
        });

        socket.on('message:newUser', (msg) => {
            let scr = senti(msg.content).score;
            message.sentiment = scr;
            if (scr == 0) {
                message.content = 'It seems you have answered the question with a neutral statement, please try again';
            }
            else if(scr < 0) {
                message.content = 'Okay then, please try to enter your name again';
            }
            else {
                message.content = 'Okay then, let me redirect you to the signUp page';
            }
            socket.emit('message:newUser:follow', message);

        })

        socket.on('message:newUser:Yes', () => {
            ms = signupUser(usr, message, socket);
            if (ms && ms.unFinished) {
                socket.emit('message:newUser:Yes:follow', ms);
            }
        });

        socket.on('message:newUser:Yes:follow', (msg) => {

            // detokenize the sentence and gives Parts-of-Speech tagging
            let content = nlp.sentence(msg.content, { lexicon: lexicon });

            let ms = find_people(msg, content, message);
            if (ms.foundPeople) {
                let n = ms.people.normal.split(" ");
                if (n.length === 3) {
                    usr.middleName = n[1];
                    usr.lastName = n[2];
                } else if (n.length === 2) {

                    usr.middleName = n[0];
                    usr.lastName = n[1];
                } else {
                    if (usr.lastName === null) {
                        usr.lastName = n[0];
                    } else {
                        usr.middleName = n[0];
                    }
                }
                ms = signupUser(usr, message, socket);
                if (ms && ms.unFinished) {
                    socket.emit('message:newUser:Yes:follow', ms);
                }
            } else {
                message.content = "No name detected";
                socket.emit('message:newUser:Yes:follow', message);
            }
        });

    });
};

function Question_Gen_Signup(usr, message, socket){
    let Qs = new Questions();
    Qs.save((err) => {
        if(err){
            throw err;
        }

        // If everything is fine
        message.content =  "User successfully registered now, we would ask you a series of question to authenticate you";
        socket.emit('message:question', message);
        obj = Qs_gen(usr, socket, message, Qs, null, null);

        socket.on('message:question:follow', (msg) => {
            let q = {
                question: obj.question,
                answers: msg.content
            };
            q.summary = null;
            Qs.qs.push(q);
            Qs.save((err) => {
                if(err){
                    throw err;
                }
                console.log(obj.count);
                obj = Qs_gen(usr, socket, message, Qs, obj.count, obj.done);
            });
        });

    });

}


function signupUser(usr, message, socket) {

    let ur = new User();
    ur.local.first_name = usr.firstName;

    if (usr.lastName === null) {
        message.content = "Can you give your last name";
        message.unFinished = true;
        return message;
    }
    ur.local.last_name = usr.lastName;
    if (usr.middleName === null) {
        message.content = "Can you give your middle name";
        message.unFinished = true;
        return message;

    }
    ur.local.middle_name = usr.middleName;
    ur.local.full_name = usr.firstName + " " + usr.middleName + " " + usr.lastName;

    ur.save((err) => {
        if (err) {
            throw err;
        }
        Question_Gen_Signup(ur, message, socket);
    });

}
