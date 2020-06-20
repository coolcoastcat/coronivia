const fs = require('fs');
const QUESTION_FILE = 'opentdb_questions.json';

/*
    Questions are parsed into an allQuestions object into categories which contain an array of questions.
    the allQuestions.categoryArray is a sparse array containg the following categories
    9 (General Knowledge)
    10 (Entertainment)
    15 (Video Games)
    17 (Science)
    20 (Art &amp; Mythology)
    21 (Sports)
    22 (Geography)
    23 (History)
    24 (Politics)
    31 (Animation &amp; Manga)
*/

// read in all of the questions
const questionBuffer = fs.readFileSync(QUESTION_FILE);
const questionsObj = JSON.parse(questionBuffer.toString());
let allQuestions = {categories: {  
                                    9: {'any':[],'easy':[], 'medium':[] ,'hard':[] }, 
                                    10: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    15: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    17: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    20: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    21: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    22: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    23: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    24: {'any':[],'easy':[], 'medium':[] ,'hard':[] },
                                    31: {'any':[],'easy':[], 'medium':[] ,'hard':[] } 
                        }
                    };


console.log("Read in file and the parsed "+questionsObj.questions.length+" questions");
questionsObj.questions.forEach(question =>{ 
        // console.log('Attempting to add question with category id: '+question.category_id + " that has type: "+typeof(question.category_id));
        allQuestions.categories[question.category_id]['any'].push(question);
        allQuestions.categories[question.category_id][question.difficulty].push(question);
});

let randomId = Math.floor(Math.random() * 50) + 1;
/*
console.log("Getting a random sports question: %o",allQuestions.categories[21]['any'][randomId]);
console.log("Getting a random entertainment question: %o",allQuestions.categories[10]['any'][randomId]);
console.log("Getting a random science question: %o",allQuestions.categories[17]['any'][randomId]);
console.log("Getting the first easy politics question: %o",allQuestions.categories[24]['easy'][0]);
*/

/* takes an Array and shuffles the order 
  @param Array to shuffle
  @return Shuffled array
*/
function shuffle(array) {
    if(!array || array.length === 0) { return [];}
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

/* The main API for the database. Takes a list of categories and returns an array of randomized quetions from those categories
    If there aren't enough questions available with the selected option, just return as many as there are. Calling code
    should check for array length.

    @param categoryArray The array of categories from which to return a random selection of questions
    @param questionCount The number of questions to retrieve
    @param difficulty The difficulty of question to return

    @return an array of questions 
*/
exports.getTriviaQuestions = function (categoryArray,questionCount,difficulty){
    console.log("Requested "+questionCount+" questions of "+difficulty+" for categories: "+categoryArray);
    let questions = [];
    categoryArray = shuffle(categoryArray); // shuffle to avoid prioritizing early categories

    let questionsPerCategory = Math.floor(questionCount / categoryArray.length);
    let remainderQuestions = questionCount % categoryArray.length;
    
    let count = 0;

    // iterate over each category and get some randomized questions
    categoryArray.forEach((category)=>{
        let questionsToRetrieve = questionsPerCategory;
        // on the first pass, boost the number of questions to retrieve with the remainder from above
        if(count++ === 0){
            questionsToRetrieve += remainderQuestions;
        }

        // Randomize the questions 
        allQuestions.categories[category][difficulty] = shuffle(allQuestions.categories[category][difficulty]);
        let i = 0;
        for(i;i<questionsToRetrieve;i++){
            questions.push(allQuestions.categories[category][difficulty][i]);
        }

    });
    console.log("put "+questions.length+ " questions into return array which should match requested questions: "+questionCount);
    return questions;
}

// let questions = getQuestions([9,10,17],4,'any');
// console.log('questions: \n %o',questions);