/**
 * Guiones del banco de simulación (T4 de #323): 5 escenarios × 4 perfiles de
 * aprendiz. Cada perfil ejercita un riesgo distinto:
 *   - correct:   respuestas completas (latencia y avance del checklist);
 *   - terse:     respuestas mínimas (pedidos de elaboración, re-preguntas);
 *   - errors:    errores típicos A1-A2 (recast, sin desviar la escena);
 *   - asksBack:  el aprendiz pregunta de vuelta (SC-006: contestar primero).
 */

export const SCRIPTS = {
  daily_standup: {
    correct: [
      "Hi Sofia, good morning. I'm ready.",
      "Yesterday I finished the login page and the AWS Lambda integration.",
      "Today I will write the tests for the payment API.",
      "I'm blocked because the other team didn't send the API contract.",
      "I need the contract today. Can you talk with their lead?",
    ],
    terse: ["Hi.", "Login page.", "Tests.", "Yes, the API contract.", "The contract."],
    errors: [
      "Hi Sofia, I am ready for start.",
      "Yesterday I finish the login and new feature about aws lambda.",
      "Today I going to write tests for payment api.",
      "I am block because other team don't send the contract.",
      "I need that you talk with they lead today.",
    ],
    asksBack: [
      "Hi Sofia, good morning. How are you?",
      "Yesterday I finished the login page. And you, how was your day?",
      "Today I will write tests. Is the demo still at 2 PM?",
      "I'm blocked by the API contract. Do you know who owns it?",
      "Can you talk with their lead today?",
    ],
  },
  conference_intro: {
    correct: [
      "Hi, nice to meet you. I'm Raul, a backend developer.",
      "I work with Java and AWS Lambda at a fintech company.",
      "I came for the talk about serverless architectures.",
      "We moved our payments service to Lambda last year.",
      "It was great to meet you. Let's connect on LinkedIn.",
    ],
    terse: ["Hi, I'm Raul.", "Backend.", "Serverless.", "Lambda.", "Bye."],
    errors: [
      "Hi, nice to meet you, I am Raul, I am backend developer.",
      "I work in Java and AWS Lambda in a fintech company since two years.",
      "I come for the talk of serverless.",
      "We move our payments service to Lambda the last year.",
      "Was nice meet you. We connect in LinkedIn?",
    ],
    asksBack: [
      "Hi, nice to meet you. I'm Raul. What's your name?",
      "I work with Java at a fintech. And you, what do you do?",
      "I came for the serverless talk. What is your talk about?",
      "That sounds interesting. When is your talk?",
      "Great. Can I find your slides online?",
    ],
  },
  ask_for_help: {
    correct: [
      "Hi, do you have a minute? I need some help with a blocker.",
      "The integration tests fail on the CI pipeline but pass locally.",
      "I already cleared the cache and checked the environment variables.",
      "The error says the database connection times out after thirty seconds.",
      "Thanks, I will try that and let you know.",
    ],
    terse: ["Hi. Help?", "Tests fail.", "Cache.", "Timeout.", "Thanks."],
    errors: [
      "Hi, you have one minute? I need help with one blocker.",
      "The integration tests fails in the CI but in local pass.",
      "I already clean the cache and I check the variables.",
      "The error say the connection to database do timeout.",
      "Thanks, I go to try and I tell you.",
    ],
    asksBack: [
      "Hi, do you have a minute? Are you busy?",
      "The tests fail on CI but pass locally. Have you seen this before?",
      "I cleared the cache. What else should I check?",
      "The database connection times out. Could it be the network?",
      "Thanks. Can we pair on it later?",
    ],
  },
  code_review: {
    correct: [
      "Hi, thanks for reviewing my pull request.",
      "I refactored the user service to remove duplicated code.",
      "I added unit tests for the new validation rules.",
      "I agree, I will rename that variable to make it clearer.",
      "I'll push the changes this afternoon.",
    ],
    terse: ["Hi.", "Refactor.", "Tests.", "Okay.", "Later."],
    errors: [
      "Hi, thanks for review my pull request.",
      "I refactor the user service for remove the code duplicated.",
      "I add unit tests for the news validation rules.",
      "I am agree, I will change the name of variable.",
      "I push the changes in this afternoon.",
    ],
    asksBack: [
      "Hi, thanks for reviewing. Did you have time to look at it?",
      "I refactored the user service. Is the new structure clear?",
      "I added unit tests. Do you think we need integration tests too?",
      "Which variable name would you suggest?",
      "Should I merge after the CI passes?",
    ],
  },
  coffee_break: {
    correct: [
      "Hi! Are you getting coffee too?",
      "I'm good, a bit tired. We had a release last night.",
      "It went well, only one small bug in production.",
      "This weekend I want to go hiking with my family.",
      "Nice talking to you. See you at the meeting.",
    ],
    terse: ["Hi.", "Good.", "Fine.", "Hiking.", "Bye."],
    errors: [
      "Hi! You are taking coffee also?",
      "I am good, little tired. We have release the last night.",
      "It go well, only one small bug in production.",
      "This weekend I want go to hiking with my family.",
      "Nice talk with you. See you in the meeting.",
    ],
    asksBack: [
      "Hi! How was your morning?",
      "I'm a bit tired after the release. How about you?",
      "It went well. Did you hear about the bug?",
      "I'm going hiking this weekend. What are your plans?",
      "Nice. Do you want to grab lunch tomorrow?",
    ],
  },
};

export const PROFILES = ["correct", "terse", "errors", "asksBack"];
