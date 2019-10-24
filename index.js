/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const questions = require('./questions');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const Main = require('main_template.json');
const GRYFFINDORJSON = require('gryffindor.json');
const SLYTHERINJSON = require('slytherin.json');
const HUFFLEPUFFJSON = require('hufflepuff.json');
const RAVENCLAWJSON = require('ravenclaw.json');
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GAME_LENGTH = 7;

function finalHouse(gryffindor, ravenclaw, hufflepuff, slytherin) {
  let arr = [];
  let house = ['GRYFFINDOR', 'RAVENCLAW', 'HUFFLEPUFF', 'SLYTHERIN'];
  arr.push(gryffindor);
  arr.push(ravenclaw);
  arr.push(hufflepuff);
  arr.push(slytherin);
  let i = arr.indexOf(Math.max(...arr));
  return house[i];
}

function randomForList(size) {
  let i = Math.floor(Math.random() * (+size - +0)) + +0;
  return i;
}

function populateGameQuestions(translatedQuestions) {
  //TO DO HANDLE RANDOM QUESTION HANDLING
  let first = [0,1,2];
  let second = [14,15,16,20];
  let third = [6,8,11,12,13];
  //let fourth = [10,26,27];
  let fourth = [10,27];
  let fifth = [21,24,25];
  //let sixth = [7,9,17,18,22,23];
  let sixth = [22,23]
  //let seventh = [19];
  let last = [3,4,5];
  let questions = [];
  console.log(questions);
  questions.push(first[randomForList(first.length)]);
  questions.push(second[randomForList(second.length)]);
  questions.push(third[randomForList(third.length)]);
  questions.push(fourth[randomForList(fourth.length)]);
  questions.push(fifth[randomForList(fifth.length)]);
  questions.push(sixth[randomForList(sixth.length)]);
  //questions.push(seventh[randomForList(seventh.length)]); //-> trop long
  questions.push(last[randomForList(last.length)]);
  console.log(questions);
  return questions;
}

function populateRoundAnswers(gameQuestions, index, translatedAnswers, translatedQuestion) {
  let key = Object.keys(translatedQuestion[gameQuestions[index]])[0]
  let answerList =  (translatedQuestion[gameQuestions[index]])[key];
  console.log(answerList);
  let answers = [];
  for (let i = 0; i < answerList.length; i++)
   {
     answers.push(translatedAnswers[answerList[i]]);
   }
  console.log(answers);
  return answers;
}

function isAnswerSlotValid(intent, answerCount) {
  if (intent.slots.Answer.resolutions.resolutionsPerAuthority[0].values == null) {
    return false;
  }
  let userResponse = intent.slots.Answer.resolutions.resolutionsPerAuthority[0].values[0].value.name
  userResponse = (userResponse.toString()).toUpperCase();
  const indexUser = alphabet.indexOf(userResponse);
  const answerSlotFilled = intent
    && intent.slots
    && intent.slots.Answer
    && intent.slots.Answer.value;
  const answerSlotIsInt = answerSlotFilled
    && indexUser != -1
  return answerSlotIsInt
    && indexUser < (answerCount)
    && indexUser >= 0;
}


function handleUserGuess(userGaveUp, handlerInput) {
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const { intent } = requestEnvelope.request;

  let speechOutput = '';
  let speechOutputAnalysis = '';

  const sessionAttributes = attributesManager.getSessionAttributes();
  const gameQuestions = sessionAttributes.questions;
  const oldAnswers = sessionAttributes.answers;
  let gryffindor = parseFloat(sessionAttributes.gryffindor);
  let ravenclaw = parseFloat(sessionAttributes.ravenclaw);
  let slytherin = parseFloat(sessionAttributes.slytherin);
  let hufflepuff = parseFloat(sessionAttributes.hufflepuff);
  let currentQuestionIndex = parseInt(sessionAttributes.currentQuestionIndex, 10);
  const requestAttributes = attributesManager.getRequestAttributes();
  const translatedQuestions = requestAttributes.t('QUESTIONS');
  const translatedAnswers = requestAttributes.t('ANSWERS');

  
  const answerSlotValid = isAnswerSlotValid(intent, oldAnswers.length);
  if (answerSlotValid)
 {
    let userResponse = intent.slots.Answer.resolutions.resolutionsPerAuthority[0].values[0].value.name
    userResponse = (userResponse.toString()).toUpperCase();
    const indexUser = alphabet.indexOf(userResponse);
    console.log("User said " + userResponse);
    let key = Object.keys(oldAnswers[indexUser])[0];
    gryffindor += parseFloat(oldAnswers[indexUser][key][0]);
    ravenclaw += parseFloat(oldAnswers[indexUser][key][1]);
    hufflepuff += parseFloat(oldAnswers[indexUser][key][2]);
    slytherin += parseFloat(oldAnswers[indexUser][key][3]);
  } else {
    if (!userGaveUp) {
      speechOutputAnalysis = requestAttributes.t('ANSWER_WRONG_MESSAGE');
    }
    if(!answerSlotValid) {
      console.log("User said " + intent.slots.Answer.value);
      console.log('ANSWER NOT VALID');
      console.log(oldAnswers);
      console.log('^^^ POSSIBLE ANSWERS ^^^');
      return responseBuilder
      .speak(requestAttributes.t('TRIVIA_UNHANDLED', alphabet[oldAnswers.length-1]))
      .reprompt(requestAttributes.t('TRIVIA_UNHANDLED', alphabet[oldAnswers.length-1]))
      .getResponse();
    }
  }

  // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
  if (sessionAttributes.currentQuestionIndex === GAME_LENGTH - 1) {
    let house = finalHouse(gryffindor, ravenclaw, hufflepuff, slytherin);
    console.log(house);
    speechOutput = '';
    speechOutput += speechOutputAnalysis + requestAttributes.t('SORTING_PHRASE', requestAttributes.t(house));
    let json;
    if (house === 'GRYFFINDOR') {
      json = GRYFFINDORJSON;
    }
    else if (house === 'SLYTHERIN'){
      json = SLYTHERINJSON
    }
    else if (house === 'RAVENCLAW') {
      json = RAVENCLAWJSON;
    }
    else {
      json = HUFFLEPUFFJSON;
    }
      
     if (supportsAPL(handlerInput)) {
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : json
        }).getResponse();
    } else {
      return handlerInput.responseBuilder
    .speak(speechOutput).getResponse();
    }
  }
  currentQuestionIndex += 1;
  const spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];
  const roundAnswers = populateRoundAnswers(
    gameQuestions,
    currentQuestionIndex,
    translatedAnswers,
    translatedQuestions
  );
  const questionIndexForSpeech = currentQuestionIndex + 1;
  let repromptText = requestAttributes.t(
    'TELL_QUESTION_MESSAGE',
    questionIndexForSpeech.toString(),
    spokenQuestion
  );

  let questionData = repromptText;
  let answerData = "";
  let answer = "";
  let letter = "";
  for (let i = 0; i < roundAnswers.length; i += 1) {
    answer = Object.keys(roundAnswers[i]);
    letter = alphabet[i];
    repromptText += `${letter}. ${answer} `;
    answerData += `${letter}. ${answer}<br>`;
  }
  
  speechOutput += "<prosody rate=\"85%\">" + repromptText +  "</prosody>";


  const translatedQuestion = translatedQuestions[gameQuestions[currentQuestionIndex]];

  Object.assign(sessionAttributes, {
      speechOutput: repromptText,
      repromptText,
      currentQuestionIndex,
      questions: gameQuestions,
      answers: roundAnswers,
      gryffindor: gryffindor,
      ravenclaw: ravenclaw,
      hufflepuff: hufflepuff,
      slytherin: slytherin,
  });
  
   if (supportsAPL(handlerInput)) {
     let fontSize = "17dp";
     let titleSize = "20dp"
     if (answerData.length < 100) {
       fontSize = "35dp";
     }
     if (questionData.length > 100) {
       titleSize = "16dp";
     }
     if (questionData.length > 200) {
       titleSize = "12dp";
     }
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptText)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : Main,
          datasources: {
            "bodyTemplate1Data": {
              "type": "object",
              "objectId": "bt1Sample",
              "question": questionData,
              "responses": answerData,
              "speak": "<speak>" + answerData.replace('<br>', '') + "</speak>",
              "fontSize": fontSize,
              "titleSize": titleSize
            }
          }
        })
        .getResponse();
    } else {
        return responseBuilder.speak(speechOutput)
          .reprompt(repromptText)
          .withSimpleCard(requestAttributes.t('GAME_NAME'), repromptText)
          .getResponse();
    }
}

function startGame(newGame, handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  let speechOutput = newGame
    ? requestAttributes.t('NEW_GAME_MESSAGE', requestAttributes.t('GAME_NAME'))
      + requestAttributes.t('WELCOME_MESSAGE', GAME_LENGTH.toString())
    : '';
  const gryffindor = 0;
  const ravenclaw = 0;
  const hufflepuff = 0;
  const slytherin = 0;
  const translatedQuestions = requestAttributes.t('QUESTIONS');
  const translatedAnswers = requestAttributes.t('ANSWERS');
  const gameQuestions = populateGameQuestions(translatedQuestions);
  const roundAnswers = populateRoundAnswers(
    gameQuestions,
    0,
    translatedAnswers,
    translatedQuestions
  );
  

  const currentQuestionIndex = 0;
  const spokenQuestion = Object.keys(translatedQuestions[gameQuestions[currentQuestionIndex]])[0];
  let repromptText = requestAttributes.t('TELL_QUESTION_MESSAGE', '1', spokenQuestion);
  
  let questionData = repromptText;
  let answerData = "";
  let answer = "";
  let letter = "";
  for (let i = 0; i < roundAnswers.length; i += 1) {
    answer = Object.keys(roundAnswers[i]);
    letter = alphabet[i];
    repromptText += `${letter}. ${answer} `;
    answerData += `${letter}. ${answer}<br> `;
  }
  
  speechOutput += "<prosody rate=\"85%\">" + repromptText +  "</prosody>";
  const sessionAttributes = {};

  const translatedQuestion = translatedQuestions[gameQuestions[currentQuestionIndex]];

  Object.assign(sessionAttributes, {
      speechOutput: repromptText,
      repromptText,
      currentQuestionIndex,
      questions: gameQuestions,
      answers: roundAnswers,
      gryffindor: gryffindor,
      ravenclaw: ravenclaw,
      hufflepuff: hufflepuff,
      slytherin: slytherin
  });

  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  if (supportsAPL(handlerInput)) {
    let fontSize = "17dp";
    let titleSize = "20dp";
     if (answerData.length < 100) {
       fontSize = "35dp";
     }
     if (questionData.length > 100) {
       titleSize = "16dp";
     }
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptText)
        .addDirective({
          type : 'Alexa.Presentation.APL.RenderDocument',
          document : Main,
          datasources: {
            "bodyTemplate1Data": {
              "type": "object",
              "objectId": "bt1Sample",
              "question": questionData,
              "responses": answerData,
              "fontSize": fontSize,
              "titleSize": titleSize
            }
          }
        })
        .getResponse();
    } else {
      return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), repromptText)
    .getResponse();
    }
}

function helpTheUser(newGame, handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const askMessage = newGame
    ? requestAttributes.t('ASK_MESSAGE_START')
    : requestAttributes.t('REPEAT_QUESTION_MESSAGE') + requestAttributes.t('STOP_MESSAGE');
  const speechOutput = requestAttributes.t('HELP_MESSAGE', GAME_LENGTH) + askMessage;
  const repromptText = requestAttributes.t('HELP_REPROMPT') + askMessage;

  return handlerInput.responseBuilder.speak(speechOutput).reprompt(repromptText).getResponse();
}

/* jshint -W101 */
const languageString = {
   'fr': {
    translation: {
      QUESTIONS: questions.QUESTIONS_FR,
      ANSWERS: questions.ANSWERS_FR,
      GAME_NAME: 'Quizz de répartition des maisons',
      HELP_MESSAGE: 'Je vais te poser %s questions a choix multiple. Réponds avec la lettre de la réponse. Dis par exemple A, B, C ou D. Tu peux relancer le jeu a tout moment. Dis tout simplement "Commencer".',
      REPEAT_QUESTION_MESSAGE: 'Si tu veux que je répète une question dit „Répète“. ',
      ASK_MESSAGE_START: 'Veux-tu commencer ?',
      HELP_REPROMPT: 'Quand tu veux répondre a une question dit simplement  la lettre correspondant à la réponse. ',
      STOP_MESSAGE: 'Veux-tu continuer ?',
      CANCEL_MESSAGE: 'OK, on joueras une autre fois.',
      NO_MESSAGE: 'OK, on joueras une autre fois.',
      TRIVIA_UNHANDLED: 'Dis une lettre entre A et %s.',
      HELP_UNHANDLED: 'Dis oui pour continuer ou non pour terminer le jeu.',
      START_UNHANDLED: 'Tu peux commencer un nouveau jeu en disant  „Commencer“.',
      NEW_GAME_MESSAGE: 'Bienvenue au %s. ',
      WELCOME_MESSAGE: 'Je vais te poser %s questions a choix multiple. Réponds avec  la lettre de la réponse. Allons-y ! ',
      TELL_QUESTION_MESSAGE: 'Question %s. %s ',
      SORTING_PHRASE: 'Tu fais parti de %s',
      GRYFFINDOR: 'Gryffondor',
      HUFFLEPUFF: 'Poufsouffle',
      RAVENCLAW: 'Serdaigle',
      SLYTHERIN: 'Serpentard',
      GAME_OVER_MESSAGE: 'Merci d\'avoir joué ! Si ce jeu t\'as plus n\'hesite pas a mettre 5 etoiles sur le store !',
      ERROR_MESSAGE: 'Désolé, je n\'ai pas compris la commande. Veuillez répéter.'
    }
  },
  'en': {
    translation: {
      QUESTIONS: questions.QUESTIONS_EN,
      ANSWERS: questions.ANSWERS_EN,
      GAME_NAME: 'Sorting Hat Ceremony',
      HELP_MESSAGE: 'I will ask you %s multiple choice questions. Respond with the letter of the answer. For example, say A, B, C or D. To start a new game at any time, say, start game. ',
      REPEAT_QUESTION_MESSAGE: 'To repeat the last question, say, repeat. ',
      ASK_MESSAGE_START: 'Would you like to start playing?',
      HELP_REPROMPT: 'To give an answer to a question, respond with the letter of the answer. ',
      STOP_MESSAGE: 'Would you like to keep playing?',
      CANCEL_MESSAGE: 'Ok, let\'s play again soon.',
      NO_MESSAGE: 'Ok, we\'ll play another time. Goodbye!',
      TRIVIA_UNHANDLED: 'Try saying a letter between A and %s',
      HELP_UNHANDLED: 'Say yes to continue, or no to end the game.',
      START_UNHANDLED: 'Say start to start a new game.',
      NEW_GAME_MESSAGE: 'Welcome to %s. ',
      WELCOME_MESSAGE: 'I will ask you %s questions. Just say the letter of the answer. Let\'s begin. ',
      TELL_QUESTION_MESSAGE: 'Question %s. %s ',
      SORTING_PHRASE: 'You belong to %s',
      GRYFFINDOR: 'GRYFFINDOR',
      HUFFLEPUFF: 'HUFFLEPUFF',
      RAVENCLAW: 'RAVENCLAW',
      SLYTHERIN: 'SLYTHERIN',
      GAME_OVER_MESSAGE: 'Thank you for playing!',
      ERROR_MESSAGE: 'Sorry, I can\'t understand the command. Please say again.'
    },
  },
};


const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageString,
      returnObjects: true
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    };
  },
};

const LaunchRequest = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    console.log("User is " + handlerInput.requestEnvelope.request.locale);
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.StartOverIntent');
  },
  handle(handlerInput) {
    return startGame(true, handlerInput);
  },
};


const HelpIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const newGame = !(sessionAttributes.questions);
    return helpTheUser(newGame, handlerInput);
  },
};

const UnhandledIntent = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    if (Object.keys(sessionAttributes).length === 0) {
      const speechOutput = requestAttributes.t('START_UNHANDLED');
      return handlerInput.attributesManager
        .speak(speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    } else if (sessionAttributes.questions) {
      const speechOutput = requestAttributes.t('TRIVIA_UNHANDLED', "0");
      return handlerInput.attributesManager
        .speak(speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    }
    const speechOutput = requestAttributes.t('HELP_UNHANDLED');
    return handlerInput.attributesManager.speak(speechOutput).reprompt(speechOutput).getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const AnswerIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'DontKnowIntent');
  },
  handle(handlerInput) {
    if (handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent') {
      return handleUserGuess(false, handlerInput);
    }
    return handleUserGuess(true, handlerInput);
  },
};

const RepeatIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.responseBuilder.speak(sessionAttributes.speechOutput)
      .reprompt(sessionAttributes.repromptText)
      .getResponse();
  },
};

const YesIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (sessionAttributes.questions) {
      return handlerInput.responseBuilder.speak(sessionAttributes.speechOutput)
        .reprompt(sessionAttributes.repromptText)
        .getResponse();
    }
    return startGame(false, handlerInput);
  },
};


const StopIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechOutput = requestAttributes.t('STOP_MESSAGE');

    return handlerInput.responseBuilder.speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const CancelIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechOutput = requestAttributes.t('CANCEL_MESSAGE');

    return handlerInput.responseBuilder.speak(speechOutput)
      .getResponse();
  },
};

const NoIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechOutput = requestAttributes.t('NO_MESSAGE');
    return handlerInput.responseBuilder.speak(speechOutput).getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`${error}`)

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechOutput = requestAttributes.t('ERROR_MESSAGE');
    return handlerInput.responseBuilder.speak(speechOutput).getResponse();
  },
};

function supportsAPL(handlerInput) {
    const supportedInterfaces = handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface != undefined;
}


const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    HelpIntent,
    AnswerIntent,
    RepeatIntent,
    YesIntent,
    StopIntent,
    CancelIntent,
    NoIntent,
    SessionEndedRequest,
    UnhandledIntent
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
