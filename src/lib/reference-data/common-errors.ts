/**
 * Apéndice E — Los 50 errores más frecuentes del hispanohablante.
 * Transcripción fiel del libro fuente. Ids 1–50; categoryEs por bloque:
 * E.1 estructura de la oración · E.2 verbos y tiempos · E.3 modales e
 * infinitivos · E.4 preposiciones y artículos · E.5 vocabulario y registro.
 */
import type { CommonError } from "@/domain/reference/reference";

const E1 = "E.1 · Estructura de la oración";
const E2 = "E.2 · Verbos y tiempos";
const E3 = "E.3 · Modales e infinitivos";
const E4 = "E.4 · Preposiciones y artículos";
const E5 = "E.5 · Vocabulario y registro";

export const COMMON_ERRORS: CommonError[] = [
  { id: 1, wrong: "Is a bug.", right: "It's a bug.", categoryEs: E1 },
  { id: 2, wrong: "Is important to test.", right: "It's important to test.", categoryEs: E1 },
  { id: 3, wrong: "There is many errors.", right: "There are many errors.", categoryEs: E1 },
  { id: 4, wrong: "Depends of the load.", right: "It depends on the load.", categoryEs: E1 },
  { id: 5, wrong: "I am agree.", right: "I agree.", categoryEs: E1 },
  { id: 6, wrong: "I have 30 years.", right: "I am 30.", categoryEs: E1 },
  { id: 7, wrong: "I have hungry / cold / right.", right: "I am hungry / cold / right.", categoryEs: E1 },
  { id: 8, wrong: "We are 5 in the team.", right: "There are 5 of us on the team.", categoryEs: E1 },
  { id: 9, wrong: "Also it failed.", right: "It also failed.", categoryEs: E1 },
  { id: 10, wrong: "Always I check the logs.", right: "I always check the logs.", categoryEs: E1 },

  { id: 11, wrong: "I work here since 2020.", right: "I've worked here since 2020.", categoryEs: E2 },
  { id: 12, wrong: "I am working here for 3 years.", right: "I've been working here for 3 years.", categoryEs: E2 },
  { id: 13, wrong: "Did you finish already?", right: "Have you finished yet?", categoryEs: E2 },
  { id: 14, wrong: "I have seen it yesterday.", right: "I saw it yesterday.", categoryEs: E2 },
  { id: 15, wrong: "When I will finish, I'll tell you.", right: "When I finish, I'll tell you.", categoryEs: E2 },
  { id: 16, wrong: "If it will fail, we roll back.", right: "If it fails, we'll roll back.", categoryEs: E2 },
  { id: 17, wrong: "If we would have tested…", right: "If we had tested…", categoryEs: E2 },
  { id: 18, wrong: "I use to work from home.", right: "I usually work from home.", categoryEs: E2 },
  { id: 19, wrong: "He is agree with the plan.", right: "He agrees with the plan.", categoryEs: E2 },
  { id: 20, wrong: "It's depending on the config.", right: "It depends on the config.", categoryEs: E2 },

  { id: 21, wrong: "We must to decide.", right: "We must decide.", categoryEs: E3 },
  { id: 22, wrong: "I will can do it.", right: "I'll be able to do it.", categoryEs: E3 },
  { id: 23, wrong: "Let me to explain.", right: "Let me explain.", categoryEs: E3 },
  { id: 24, wrong: "should of / could of", right: "should have / could have", categoryEs: E3 },
  { id: 25, wrong: "I need that you review it.", right: "I need you to review it.", categoryEs: E3 },
  { id: 26, wrong: "I want that he comes.", right: "I want him to come.", categoryEs: E3 },
  { id: 27, wrong: "Help me to understand.", right: "Help me understand (o to understand, ambas válidas)", categoryEs: E3 },
  { id: 28, wrong: "I recommend you to use X.", right: "I recommend using X / that you use X.", categoryEs: E3 },
  { id: 29, wrong: "He suggested me to try it.", right: "He suggested that I try it.", categoryEs: E3 },
  { id: 30, wrong: "Thanks for help me.", right: "Thanks for helping me.", categoryEs: E3 },

  { id: 31, wrong: "Explain me the error.", right: "Explain the error to me.", categoryEs: E4 },
  { id: 32, wrong: "He said me that…", right: "He told me that…", categoryEs: E4 },
  { id: 33, wrong: "responsible of", right: "responsible for", categoryEs: E4 },
  { id: 34, wrong: "interested of", right: "interested in", categoryEs: E4 },
  { id: 35, wrong: "arrive to the office", right: "arrive at the office", categoryEs: E4 },
  { id: 36, wrong: "in the next slide", right: "on the next slide", categoryEs: E4 },
  { id: 37, wrong: "during 20 minutes", right: "for 20 minutes", categoryEs: E4 },
  { id: 38, wrong: "in Monday", right: "on Monday", categoryEs: E4 },
  { id: 39, wrong: "working as developer", right: "as a developer", categoryEs: E4 },
  { id: 40, wrong: "an user / an URL", right: "a user / a URL (sonido /j/)", categoryEs: E4 },

  { id: 41, wrong: "I have a doubt.", right: "I have a question.", categoryEs: E5 },
  { id: 42, wrong: "In my actual company…", right: "In my current company…", categoryEs: E5 },
  { id: 43, wrong: "Actually I'm working on X.", right: "Currently I'm working on X.", categoryEs: E5 },
  { id: 44, wrong: "Eventually we'll fix it. (= quizá)", right: "Possibly we'll fix it.", categoryEs: E5 },
  { id: 45, wrong: "I assist to the meeting.", right: "I attend the meeting.", categoryEs: E5 },
  { id: 46, wrong: "a feedback / an advice / an information", right: "some feedback / advice / information", categoryEs: E5 },
  { id: 47, wrong: "I remain at your disposal.", right: "Let me know if you need anything else.", categoryEs: E5 },
  { id: 48, wrong: "Sorry for the inconvenients.", right: "Sorry for the inconvenience.", categoryEs: E5 },
  { id: 49, wrong: "Please advise.", right: "Let me know what you'd like me to do.", categoryEs: E5 },
  { id: 50, wrong: "Sorry for my bad English.", right: "(elimínalo por completo)", categoryEs: E5 },
];
