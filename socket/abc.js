// finding if there is a name of person in the sentence
        let people = content.people();

        // if a name is found
        if (people.length !== 0) {

            // check if the name is in the database
            let nor = people[0];
            return name_database_pre_processing(nor, usr, message, callback);

        } else {

            // check sentence for nouns 
            let sent_terms = content.terms;
            let nouns = _.filter(sent_terms, (data) => {
                if (data.pos.Noun && !data.pos.Pronoun) {
                    return true;
                }
                return false;
            });

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

            // find the edge ("I") and avoid it
            if (people[0].text === 'I') {
                people[0] = people[1];
            }

            // there is a recognizable name in the sentence now 
            if (people.length !== 0) {
                let nor = people[0]
                return name_database_pre_processing(nor, usr, message, callback);
            } else {

                message.content = "I need your name to authticate you.";
                callback(message, false);
            }
        }