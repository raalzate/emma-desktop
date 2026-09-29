/**
 * Oraciones naturales por palabra y por banda (short/medium/long) para los
 * pares mínimos de `SOUND_CONTRASTS` (`@/lib/phonetics-data`). Datos puros
 * consumidos por `@/domain/phonetics/minimal-pair-sentences` — igual que
 * `phonetics-data.ts`, viven en `@/lib/*-data` para que el dominio los
 * importe sin dejar de ser puro (Artículo 2, `except` de `@/lib/*-data`).
 *
 * Cada frase contiene la palabra objetivo EXACTA (sin inflexión) como token
 * propio, para que `checkTargetWordInSentence` (dictado por ASR) siempre la
 * encuentre. Palabras que son errores típicos de pronunciación hispana
 * («escript», «estack», «ru-nin-gue»…) se oracionan citándolas como el error
 * que un hispanohablante comete, no como plantilla genérica.
 */

export type SentenceBand = "short" | "medium" | "long";

export const AUTHORED_SENTENCES: Record<string, Record<SentenceBand, string>> = {
  // --- ya autoradas como ejemplo de referencia (H8 original) ---
  bit: {
    short: "Wait a bit.",
    medium: "Can you wait a bit before the deploy?",
    long: "Can you please wait a bit longer before you trigger the production deploy?",
  },
  beat: {
    short: "Our team beat the deadline.",
    medium: "Our whole team beat the deadline again this sprint.",
    long: "Somehow our whole engineering team beat the tight deadline again this sprint.",
  },
  live: {
    short: "It's live now.",
    medium: "The new feature is finally live in production.",
    long: "After weeks of testing, the new feature is finally live in production for every user.",
  },
  leave: {
    short: "I have to leave.",
    medium: "Can I leave the stand-up a bit early today?",
    long: "I'm sorry, but I have to leave the meeting early to catch a client call.",
  },
  stack: {
    short: "The stack is broken.",
    medium: "The whole stack is broken after that last merge.",
    long: "The whole stack has been broken since someone merged that change without running the tests.",
  },
  stuck: {
    short: "It's stuck again.",
    medium: "The deploy pipeline is stuck again this morning.",
    long: "The deploy pipeline has been stuck again this morning, and nobody can figure out why.",
  },
  ship: {
    short: "We ship on Friday.",
    medium: "We plan to ship this feature on Friday.",
    long: "We're planning to ship this whole feature to production on Friday afternoon.",
  },
  chip: {
    short: "Check the chip specs.",
    medium: "Can you check the chip specs before we order it?",
    long: "Can you please check the chip specs one more time before we place the hardware order?",
  },

  // --- i-vs-ii ---
  fill: {
    short: "Please fill the form.",
    medium: "Can you fill this form before lunch?",
    long: "Could you please fill out this whole registration form before the deadline tomorrow?",
  },
  feel: {
    short: "I feel great today.",
    medium: "I feel much better about this release.",
    long: "Honestly, I feel much more confident about this release than I did yesterday.",
  },
  sit: {
    short: "Please sit down now.",
    medium: "Can you sit here during the meeting?",
    long: "Would you mind if I just sit here quietly during the whole meeting today?",
  },
  seat: {
    short: "Take a seat please.",
    medium: "Please take a seat before the standup starts.",
    long: "Please take a seat near the window before the whole team meeting begins.",
  },
  hit: {
    short: "That was a cache hit.",
    medium: "That query was a clean cache hit.",
    long: "Every single request this morning turned out to be a clean cache hit.",
  },
  heat: {
    short: "The server has heat issues.",
    medium: "The old server room has serious heat issues.",
    long: "The old server room has had serious heat issues since last summer.",
  },
  since: {
    short: "It's broken since Monday.",
    medium: "It's been broken since early Monday morning.",
    long: "The whole pipeline has been broken since early Monday morning and nobody noticed.",
  },
  scene: {
    short: "Set the scene first.",
    medium: "Let's set the scene before the demo starts.",
    long: "Let's quickly set the scene before we start the client demo today.",
  },
  it: {
    short: "Did it work?",
    medium: "Did it really work this time around?",
    long: "I honestly can't believe it actually worked this time around without any errors.",
  },
  eat: {
    short: "Let's eat lunch now.",
    medium: "Let's eat lunch before the meeting starts.",
    long: "Let's grab something to eat before the afternoon meeting with the client starts.",
  },
  grid: {
    short: "Check the layout grid.",
    medium: "Check the layout grid before you commit.",
    long: "Please check the layout grid carefully before you commit this change tonight.",
  },
  greed: {
    short: "Greed slows the team.",
    medium: "Greed slows the whole team down eventually.",
    long: "Greed slows the whole team down eventually, even when it feels rewarding today.",
  },
  slip: {
    short: "Don't let it slip.",
    medium: "Don't let the deadline slip again please.",
    long: "Please don't let the release deadline slip again like it did last sprint.",
  },
  sleep: {
    short: "I need more sleep.",
    medium: "I really need much more sleep tonight.",
    long: "Honestly, I really need much more sleep before tomorrow's big release.",
  },
  still: {
    short: "It's still failing.",
    medium: "The build is still failing this morning.",
    long: "The nightly build is still failing this morning and nobody knows why yet.",
  },
  steal: {
    short: "Don't steal my idea.",
    medium: "Please don't steal my idea again today.",
    long: "Please don't steal my idea again, I already presented it to the team.",
  },
  list: {
    short: "Check the task list.",
    medium: "Check the task list before lunch today.",
    long: "Please check the whole task list again before you leave the office today.",
  },
  least: {
    short: "At least it works.",
    medium: "At least the build works fine now.",
    long: "At least the build works fine now, even though the tests still fail.",
  },
  rich: {
    short: "This log is rich.",
    medium: "This error log is really quite rich.",
    long: "This error log is really quite rich, so read it carefully before you reply.",
  },
  reach: {
    short: "Reach out to them.",
    medium: "Please reach out to the client today.",
    long: "Please reach out to the client again before the end of the day.",
  },

  // --- ae-e-uh ---
  bad: {
    short: "That's a bad sign.",
    medium: "That's a really bad sign this morning.",
    long: "That's a really bad sign, we should check the logs before the release.",
  },
  bed: {
    short: "Go to bed now.",
    medium: "Please go to bed a bit earlier tonight.",
    long: "Please go to bed a bit earlier tonight, tomorrow's release starts very early.",
  },
  bud: {
    short: "Nice work, bud.",
    medium: "Nice work today, bud, thanks a lot.",
    long: "Nice work today, bud, thanks a lot for covering the shift for me.",
  },
  match: {
    short: "Run the test match.",
    medium: "Run the test match before you merge.",
    long: "Please run the full test match again before you merge this branch.",
  },
  mesh: {
    short: "Check the service mesh.",
    medium: "Please check the service mesh configuration again.",
    long: "Please check the service mesh configuration again before you deploy to production.",
  },
  much: {
    short: "That's too much work.",
    medium: "That's really too much work for today.",
    long: "Honestly, that's really too much work for one single person to finish today.",
  },
  track: {
    short: "Keep track of it.",
    medium: "Please keep close track of your hours.",
    long: "Please keep close track of your hours before you submit the weekly report.",
  },
  trek: {
    short: "It felt like a trek.",
    medium: "This migration felt like a long trek.",
    long: "This whole migration honestly felt like a long, exhausting trek through old code.",
  },
  truck: {
    short: "The delivery truck arrived.",
    medium: "The delivery truck arrived a bit late.",
    long: "The delivery truck arrived a bit late, so the demo had to wait.",
  },
  batch: {
    short: "Run the next batch.",
    medium: "Run the next batch of tests now.",
    long: "Please run the next batch of tests before you push this new change.",
  },
  butch: {
    short: "Butch reviewed the code.",
    medium: "Butch carefully reviewed the whole pull request.",
    long: "Butch carefully reviewed the whole pull request before approving it this morning.",
  },
  cash: {
    short: "Pay with cash please.",
    medium: "Please pay with cash at the counter.",
    long: "Please pay with cash at the counter, the card reader is broken again.",
  },
  cush: {
    short: "That's a cush job.",
    medium: "That's honestly a really cush job for him.",
    long: "That's honestly a really cush job for him, he barely does anything all day.",
  },
  ran: {
    short: "The script ran fine.",
    medium: "The whole script ran just fine again.",
    long: "The whole script ran just fine again once we fixed that last small bug.",
  },
  wren: {
    short: "Wren joined the team.",
    medium: "Wren just joined the backend team today.",
    long: "Wren just joined the backend team today and already fixed two bugs.",
  },
  run: {
    short: "Let's run the tests.",
    medium: "Let's run the tests one more time.",
    long: "Let's run the whole test suite one more time before we ship this.",
  },
  flash: {
    short: "Check the flash drive.",
    medium: "Please check the flash drive for backups.",
    long: "Please check the flash drive for backups before you wipe the old laptop.",
  },
  flesh: {
    short: "Let's flesh this out.",
    medium: "Let's flesh this whole idea out more.",
    long: "Let's flesh this whole idea out more before we present it to the client.",
  },
  flush: {
    short: "Please flush the cache.",
    medium: "Please flush the whole cache before testing.",
    long: "Please flush the whole cache before testing this again on the staging server.",
  },

  // --- b-vs-v ---
  base: {
    short: "Check the code base.",
    medium: "Please check the whole code base again.",
    long: "Please check the whole code base again before you merge this large change.",
  },
  vase: {
    short: "She broke the vase.",
    medium: "She accidentally broke the old glass vase.",
    long: "She accidentally broke the old glass vase while cleaning the office this morning.",
  },
  boat: {
    short: "We missed the boat.",
    medium: "We almost missed the very last boat.",
    long: "We almost missed the very last boat back after the offsite meeting today.",
  },
  vote: {
    short: "Let's vote on it.",
    medium: "Let's quickly vote on the new plan.",
    long: "Let's quickly vote on the new plan before the meeting runs out of time.",
  },
  berry: {
    short: "Pick a ripe berry.",
    medium: "Please pick a ripe red berry today.",
    long: "Please pick a ripe red berry today, the rest still need more time.",
  },
  very: {
    short: "That's very fast now.",
    medium: "That's honestly a very fast fix today.",
    long: "That's honestly a very fast fix, thank you for turning it around today.",
  },
  bug: {
    short: "I found a bug.",
    medium: "I just found a small bug today.",
    long: "I just found a small bug in the login flow this morning.",
  },
  best: {
    short: "That's our best guess.",
    medium: "That's honestly our very best guess yet.",
    long: "That's honestly our very best guess yet, based on all the data we have.",
  },
  vest: {
    short: "Wear a safety vest.",
    medium: "Please wear a bright safety vest inside.",
    long: "Please wear a bright safety vest inside the warehouse at all times please.",
  },
  curb: {
    short: "Park near the curb.",
    medium: "Please park the car near the curb.",
    long: "Please park the car near the curb before the delivery truck gets here.",
  },
  curve: {
    short: "Watch the growth curve.",
    medium: "Please watch the growth curve this week.",
    long: "Please watch the growth curve this week before we decide on the budget.",
  },
  rebel: {
    short: "He tends to rebel.",
    medium: "He often tends to rebel against change.",
    long: "He often tends to rebel against change, even when the change helps everyone.",
  },
  revel: {
    short: "They revel in chaos.",
    medium: "They always seem to revel in chaos.",
    long: "They always seem to revel in chaos, even during the most stressful releases.",
  },

  // --- s-inicial ---
  script: {
    short: "Run the deploy script.",
    medium: "Run the deploy script one more time.",
    long: "Please run the deploy script one more time before the release goes out.",
  },
  escript: {
    short: "Some learners say escript wrong.",
    medium: "Some learners still say escript instead of script.",
    long: "Some Spanish speakers still say escript instead of script, adding an extra vowel.",
  },
  estack: {
    short: "Don't say estack there.",
    medium: "Some learners still mistakenly say estack instead.",
    long: "Some Spanish speakers still mistakenly say estack instead of stack during interviews.",
  },
  string: {
    short: "Parse the input string.",
    medium: "Please parse the whole input string first.",
    long: "Please parse the whole input string first before you pass it to the function.",
  },
  estring: {
    short: "Don't say estring here.",
    medium: "Some learners still mistakenly say estring instead.",
    long: "Some Spanish speakers still mistakenly say estring instead of string in reviews.",
  },
  state: {
    short: "Check the button state.",
    medium: "Please check the whole component state again.",
    long: "Please check the whole component state again before you close this old ticket.",
  },
  estate: {
    short: "That's real estate now.",
    medium: "They just bought a new estate downtown.",
    long: "They just bought a new estate downtown after months of searching for a house.",
  },
  stream: {
    short: "Watch the video stream.",
    medium: "Please watch the live video stream now.",
    long: "Please watch the live video stream now before the demo starts without you.",
  },
  estream: {
    short: "Don't say estream aloud.",
    medium: "Some learners still mistakenly say estream instead.",
    long: "Some Spanish speakers still mistakenly say estream instead of stream in class.",
  },
  schema: {
    short: "Update the database schema.",
    medium: "Please update the database schema this week.",
    long: "Please update the database schema this week before the migration script runs again.",
  },
  esquema: {
    short: "Don't say esquema here.",
    medium: "Some learners still mistakenly say esquema instead.",
    long: "Some Spanish speakers still mistakenly say esquema instead of schema in interviews.",
  },
  scale: {
    short: "We need to scale.",
    medium: "We really need to scale this service.",
    long: "We really need to scale this service before traffic grows again next quarter.",
  },
  escale: {
    short: "Don't say escale wrong.",
    medium: "Some learners still mistakenly say escale instead.",
    long: "Some Spanish speakers still mistakenly say escale instead of scale during reviews.",
  },
  spike: {
    short: "There's a traffic spike.",
    medium: "There's a sudden new traffic spike now.",
    long: "There's a sudden new traffic spike now, so let's check the dashboards together.",
  },
  espike: {
    short: "Don't say espike here.",
    medium: "Some learners still mistakenly say espike instead.",
    long: "Some Spanish speakers still mistakenly say espike instead of spike during standups.",
  },
  sprint: {
    short: "This sprint ends Friday.",
    medium: "This whole sprint finally ends this Friday.",
    long: "This whole sprint finally ends this Friday, and we still have three tasks left.",
  },
  esprint: {
    short: "Don't say esprint here.",
    medium: "Some learners still mistakenly say esprint instead.",
    long: "Some Spanish speakers still mistakenly say esprint instead of sprint during planning.",
  },
  stage: {
    short: "Deploy it to stage.",
    medium: "Please deploy it to stage right now.",
    long: "Please deploy it to stage right now before we test it on production.",
  },
  estage: {
    short: "Don't say estage here.",
    medium: "Some learners still mistakenly say estage instead.",
    long: "Some Spanish speakers still mistakenly say estage instead of stage during demos.",
  },
  standard: {
    short: "Follow the coding standard.",
    medium: "Please follow the team coding standard always.",
    long: "Please follow the team coding standard always, even when nobody is reviewing it.",
  },
  estandard: {
    short: "Don't say estandard here.",
    medium: "Some learners still mistakenly say estandard instead.",
    long: "Some Spanish speakers still mistakenly say estandard instead of standard during talks.",
  },
  storage: {
    short: "Check the cloud storage.",
    medium: "Please check the cloud storage quota today.",
    long: "Please check the cloud storage quota today before we run out of space.",
  },
  estorage: {
    short: "Don't say estorage here.",
    medium: "Some learners still mistakenly say estorage instead.",
    long: "Some Spanish speakers still mistakenly say estorage instead of storage during interviews.",
  },

  // --- th-sordo-sonoro ---
  tread: {
    short: "Check the tire tread.",
    medium: "Please check the tire tread depth today.",
    long: "Please check the tire tread depth today before you drive to the client site.",
  },
  thread: {
    short: "Check the message thread.",
    medium: "Please check the whole message thread first.",
    long: "Please check the whole message thread first before you reply to the client.",
  },
  tanks: {
    short: "The water tanks are full.",
    medium: "The two water tanks are finally full.",
    long: "The two water tanks are finally full again after the long dry season.",
  },
  thanks: {
    short: "Thanks for the help.",
    medium: "Thanks so much for the quick review.",
    long: "Thanks so much for the quick review, it really helped us ship on time.",
  },
  pat: {
    short: "Give him a pat.",
    medium: "Please give him a friendly pat today.",
    long: "Please give him a friendly pat today, he really earned it this sprint.",
  },
  path: {
    short: "Check the file path.",
    medium: "Please check the file path carefully first.",
    long: "Please check the file path carefully first before you run the import script.",
  },
  dis: {
    short: "Don't dis the intern.",
    medium: "Please don't dis the intern in meetings.",
    long: "Please don't dis the intern in meetings, it really hurts team morale a lot.",
  },
  this: {
    short: "Fix this bug now.",
    medium: "Please quickly fix this small bug today.",
    long: "Please quickly fix this small bug today before the client notices it too.",
  },
  lent: {
    short: "He lent me his laptop.",
    medium: "He kindly lent me his old laptop.",
    long: "He kindly lent me his old laptop while mine was getting repaired last week.",
  },
  length: {
    short: "Check the string length.",
    medium: "Please check the array length first today.",
    long: "Please check the array length first today before you loop through the whole list.",
  },

  // --- z-sonora ---
  race: {
    short: "We're in a race.",
    medium: "We're really in a tight race now.",
    long: "We're really in a tight race now to ship before the competitor does.",
  },
  raise: {
    short: "Please raise the ticket.",
    medium: "Please raise the ticket right away today.",
    long: "Please raise the ticket right away today so support can start working on it.",
  },
  loose: {
    short: "That cable feels loose.",
    medium: "That cable feels really loose right now.",
    long: "That cable feels really loose right now, so let's replace it before the demo.",
  },
  lose: {
    short: "Don't lose the changes.",
    medium: "Please don't lose the changes you made.",
    long: "Please don't lose the changes you made, save the file before you close it.",
  },
  price: {
    short: "Check the final price.",
    medium: "Please check the final price again today.",
    long: "Please check the final price again today before you send the quote to the client.",
  },
  prize: {
    short: "She won the prize.",
    medium: "She finally won the big team prize.",
    long: "She finally won the big team prize after months of hard work on this project.",
  },
  use: {
    short: "Please use this branch.",
    medium: "Please use this new branch for now.",
    long: "Please use this new branch for now until the main one is fixed again.",
  },
  close: {
    short: "Please close the ticket.",
    medium: "Please close the old ticket right now.",
    long: "Please close the old ticket right now, since we already shipped the fix.",
  },

  // --- sh-vs-ch ---
  share: {
    short: "Please share the screen.",
    medium: "Please share the screen with everyone now.",
    long: "Please share the screen with everyone now so we can review the design together.",
  },
  chair: {
    short: "Take the empty chair.",
    medium: "Please take the empty chair over there.",
    long: "Please take the empty chair over there while we wait for the meeting to start.",
  },
  wash: {
    short: "Please wash your hands.",
    medium: "Please wash your hands before lunch today.",
    long: "Please wash your hands before lunch today, especially before the team meeting starts.",
  },
  watch: {
    short: "Let's watch the demo.",
    medium: "Let's watch the whole demo together now.",
    long: "Let's watch the whole demo together now before we send feedback to the team.",
  },
  catch: {
    short: "Nice catch on that.",
    medium: "That was a nice catch today, thanks.",
    long: "That was a really nice catch today, thanks for reviewing the code so carefully.",
  },

  // --- j-vs-y ---
  java: {
    short: "Deploy the java service.",
    medium: "Please deploy the new java service today.",
    long: "Please deploy the new java service today before the client demo this afternoon.",
  },
  yes: {
    short: "Just say yes already.",
    medium: "Just say yes to the new offer.",
    long: "Just say yes to the new offer before someone else takes the position.",
  },
  json: {
    short: "Parse the json file.",
    medium: "Please parse the whole json file now.",
    long: "Please parse the whole json file now before you send it to the client.",
  },
  yield: {
    short: "The loop must yield.",
    medium: "The loop must yield control quite often.",
    long: "The loop must yield control quite often, otherwise the whole thread will freeze.",
  },
  engine: {
    short: "Restart the search engine.",
    medium: "Please restart the search engine right now.",
    long: "Please restart the search engine right now before the index finishes building again.",
  },
  user: {
    short: "Add a new user.",
    medium: "Please add a new user right now.",
    long: "Please add a new user right now before the client starts the walkthrough.",
  },
  package: {
    short: "Install the new package.",
    medium: "Please install the new package right now.",
    long: "Please install the new package right now before you restart the whole build.",
  },
  unit: {
    short: "Write a unit test.",
    medium: "Please write a quick unit test now.",
    long: "Please write a quick unit test now before you merge this pull request.",
  },
  merge: {
    short: "Please merge this branch.",
    medium: "Please merge this whole branch right now.",
    long: "Please merge this whole branch right now before the release freeze starts tonight.",
  },
  ui: {
    short: "Update the whole ui.",
    medium: "Please update the whole ui design today.",
    long: "Please update the whole ui design today before the client reviews the prototype.",
  },
  major: {
    short: "This is a major bug.",
    medium: "This is honestly a major bug today.",
    long: "This is honestly a major bug today, we should fix it before the release.",
  },
  url: {
    short: "Copy the shared url.",
    medium: "Please copy the shared url right now.",
    long: "Please copy the shared url right now before the link expires this evening.",
  },
  manage: {
    short: "Please manage the backlog.",
    medium: "Please manage the whole backlog this week.",
    long: "Please manage the whole backlog this week before the sprint planning meeting starts.",
  },

  // --- h-aspirada ---
  host: {
    short: "Check the server host.",
    medium: "Please check the server host address now.",
    long: "Please check the server host address now before you restart the whole connection.",
  },
  hour: {
    short: "Wait about one hour.",
    medium: "Please wait about one more hour today.",
    long: "Please wait about one more hour today before you escalate this ticket further.",
  },
  hash: {
    short: "Check the commit hash.",
    medium: "Please check the commit hash again today.",
    long: "Please check the commit hash again today before you deploy the new release.",
  },
  honest: {
    short: "Please be honest here.",
    medium: "Please be really honest about the delay.",
    long: "Please be really honest about the delay so we can plan around it together.",
  },
  header: {
    short: "Check the request header.",
    medium: "Please check the request header again today.",
    long: "Please check the request header again today before you send this to the client.",
  },
  heir: {
    short: "He's the rightful heir.",
    medium: "He's actually the rightful heir here now.",
    long: "He's actually the rightful heir here now, even though nobody expected that at all.",
  },

  // --- ng-final ---
  running: {
    short: "The build is running.",
    medium: "The nightly build is still running now.",
    long: "The nightly build is still running now, even though it started an hour ago.",
  },
  "ru-nin-gue": {
    short: "Don't say ru-nin-gue here.",
    medium: "Some learners still mistakenly say ru-nin-gue instead.",
    long: "Some Spanish speakers still mistakenly say ru-nin-gue instead of running during practice.",
  },
  "es-trin-gue": {
    short: "Don't say es-trin-gue here.",
    medium: "Some learners still mistakenly say es-trin-gue instead.",
    long: "Some Spanish speakers still mistakenly say es-trin-gue instead of string during practice.",
  },
  long: {
    short: "This meeting felt long.",
    medium: "This whole meeting really felt too long.",
    long: "This whole meeting really felt too long, even though the agenda was short.",
  },
  wrong: {
    short: "That answer looks wrong.",
    medium: "That final answer still looks wrong somehow.",
    long: "That final answer still looks wrong somehow, let's trace through the logic again.",
  },

  // --- r-l ---
  error: {
    short: "Check the error log.",
    medium: "Please check the error log again today.",
    long: "Please check the error log again today before you push this change to production.",
  },
  null: {
    short: "That field is null.",
    medium: "That whole field is still null somehow.",
    long: "That whole field is still null somehow, even after we set the default value.",
  },
  router: {
    short: "Restart the wifi router.",
    medium: "Please restart the wifi router right now.",
    long: "Please restart the wifi router right now before the video call starts again.",
  },
  full: {
    short: "The disk is full.",
    medium: "The whole disk is nearly full again.",
    long: "The whole disk is nearly full again, so let's clean up the old logs.",
  },
  refactor: {
    short: "Let's refactor this module.",
    medium: "Let's carefully refactor this whole module today.",
    long: "Let's carefully refactor this whole module today before it grows even more complex.",
  },
  pull: {
    short: "Please pull the latest.",
    medium: "Please pull the latest changes right now.",
    long: "Please pull the latest changes right now before you start working on this feature.",
  },
  parameter: {
    short: "Check that function parameter.",
    medium: "Please check that function parameter again today.",
    long: "Please check that function parameter again today before you deploy this new version.",
  },
  call: {
    short: "Please join the call.",
    medium: "Please join the client call right now.",
    long: "Please join the client call right now before they ask where the team is.",
  },
  framework: {
    short: "Update the testing framework.",
    medium: "Please update the whole testing framework soon.",
    long: "Please update the whole testing framework soon before the next major release ships.",
  },
  tool: {
    short: "That's a useful tool.",
    medium: "That's honestly a really useful tool today.",
    long: "That's honestly a really useful tool today, it saved us hours of manual work.",
  },
  library: {
    short: "Update the shared library.",
    medium: "Please update the shared library right now.",
    long: "Please update the shared library right now before the build breaks for everyone.",
  },
  model: {
    short: "Train the new model.",
    medium: "Please train the new model again today.",
    long: "Please train the new model again today before we evaluate it on real data.",
  },
  array: {
    short: "Sort the whole array.",
    medium: "Please sort the whole array first today.",
    long: "Please sort the whole array first today before you loop through every element.",
  },
  level: {
    short: "Raise the logging level.",
    medium: "Please raise the logging level for now.",
    long: "Please raise the logging level for now until we find the root cause.",
  },
  worker: {
    short: "Restart the background worker.",
    medium: "Please restart the background worker right now.",
    long: "Please restart the background worker right now before the queue gets even bigger.",
  },
  kernel: {
    short: "Update the linux kernel.",
    medium: "Please update the linux kernel version now.",
    long: "Please update the linux kernel version now before you deploy to the production servers.",
  },
};
