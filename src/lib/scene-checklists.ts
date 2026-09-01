/**
 * Objetivos de escena por escenario: qué tiene que sacar la persona en la
 * conversación, en orden.
 *
 * El "why": sin checklist la escena no tiene rumbo — deriva y termina cuando se
 * agota el presupuesto de turnos, no cuando el aprendiz ha producido lo que la
 * unidad del libro pretende practicar. Cada ítem lleva:
 *  - `ask`: lo que la persona debe preguntar cuando está pendiente;
 *  - `reaskMarkers`: señales de que la persona estaría repitiendo la pregunta;
 *  - `answerMarkers`: señales de que el mensaje del aprendiz contesta ESTE ítem
 *    (atribución por contenido, no por orden).
 *
 * Los tres primeros (stand-up, entrevista, vacaciones) se conservan verbatim del
 * dominio; el resto se derivó del escenario laboral de su unidad del libro.
 */

import type { ChecklistItem } from "@/domain/chat/scene-state";

/**
 * Turnos que merece cada objetivo en las escenas de fondo: uno para plantearlo
 * y otro para ir al detalle. Es lo que sostiene una entrevista o un postmortem
 * de doce turnos sin inventar relleno.
 *
 * Sólo se declara donde el guion la aguanta: una prueba del catálogo exige
 * `MIN_ITEMS_FOR_DEPTH` objetivos antes de permitirla, porque este mapa sería,
 * si no, la puerta por la que volvería el presupuesto declarado a dedo.
 */
export const MIN_ITEMS_FOR_DEPTH = 5;

export const SCENE_DEPTH: Record<string, number> = {
  code_review: 2,
  tech_interview: 2,
  incident_postmortem: 2,
  design_review: 2,
  // Los dos escenarios que además DECLARAN presupuesto largo a propósito (10)
  // en MAX_TURNS_BY_SCENARIO. El resto del catálogo no declara nada y cae al
  // default: ahí una escena de cinco turnos es la verdad, no un recorte.
  retrospective: 2,
  architecture_pitch: 2,
};

export const SCENE_CHECKLISTS: Record<string, readonly ChecklistItem[]> = {
  // ─── Unidad 6-7 · el stand-up ────────────────────────────────────────────
  daily_standup: [
    {
      id: "yesterday",
      ask: "what they worked on YESTERDAY",
      reaskMarkers: /\byesterday\b|\bwhat (did|have) you (do|done|worked)\b/i,
      // Trabajo cerrado: adverbio de pasado o verbo de logro terminado.
      answerMarkers:
        /\byesterday\b|\blast (night|week|sprint)\b|\bi (finished|completed|wrapped|fixed|merged|shipped|closed|pushed|deployed|reviewed|spent)\b|\bgot .*(merged|done|fixed)\b/i,
    },
    {
      id: "today",
      ask: "their plan for TODAY",
      reaskMarkers: /\btoday\b|next step|what'?s next|\bplan\b|\bprogress\b/i,
      // Presente o intención: en qué anda ahora o qué va a hacer.
      answerMarkers:
        /\btoday\b|\bi(?:'m| am) (?:currently )?working on\b|\bmy plan\b|\bi plan to\b|\bi(?:'m| am) going to\b|\bi will\b|\bright now\b|\bfocus(?:ing)? on\b/i,
    },
    {
      id: "blockers",
      ask: "whether anything is BLOCKING them",
      reaskMarkers: /\bblock(er|ing|ed)?s?\b|\bstuck\b|\bimped/i,
      answerMarkers:
        /\bblock(?:ed|er|ers|ing)\b|\bstuck\b|\bwaiting (?:on|for)\b|\bnothing (?:is )?block/i,
    },
  ],

  // ─── Unidad 10 / 22 · entrevista ─────────────────────────────────────────
  tech_interview: [
    {
      id: "experience",
      ask: "ONE concrete past example ('tell me about a time…')",
      reaskMarkers: /tell me about a time|past (project|experience)/i,
      answerMarkers:
        /\b(?:at|in) my (?:last|previous|current)\b|\bi (?:led|built|owned|migrated|designed|implemented|worked on)\b|\bproject\b|\byears?\b/i,
    },
    {
      id: "technical_depth",
      ask: "a technical decision they made and its trade-offs",
      reaskMarkers: /\btrade-?off\b|\bwhy did you (?:choose|pick)\b|\btechnical decision\b|\barchitecture\b/i,
      answerMarkers:
        /\b(?:i|we) (?:chose|picked|went with|decided)\b|\binstead of\b|\btrade-?off\b|\bbecause it\b|\bscal(?:e|ing|ability)\b|\bperformance\b/i,
    },
    {
      id: "teamwork",
      ask: "a real example of teamwork or conflict",
      reaskMarkers: /\bteam(work)?\b|\bconflict\b|\bdisagree/i,
      answerMarkers: /\bteam(mate|work)?\b|\bcolleague\b|\bconflict\b|\bdisagree|\bwe (?:agreed|decided|discussed)\b/i,
    },
    {
      id: "failure",
      ask: "something that went wrong and what they took from it",
      reaskMarkers: /\bwent wrong\b|\bfail(?:ed|ure)\b|\bmistake\b|\blearn(?:ed|t)\b/i,
      answerMarkers:
        /\bi learn(?:ed|t)\b|\bwent wrong\b|\bmistake\b|\bnext time\b|\bwe should have\b|\bit (?:failed|broke)\b|\bin hindsight\b/i,
    },
    {
      id: "motivation",
      ask: "why this role interests them",
      reaskMarkers: /\bwhy (?:this|our|us)\b|\binterested\b|\bwhat brings you\b|\bwhy do you want\b/i,
      answerMarkers:
        /\bi(?:'m| am) interested\b|\bi want to\b|\bwhat attracts me\b|\byour (?:team|company|product)\b|\bi(?:'m| am) looking for\b/i,
    },
    {
      id: "questions",
      ask: "what questions THEY have about the role or team",
      reaskMarkers: /questions? for (me|us)|anything you.*ask/i,
      answerMarkers: /\?|\bi(?:'d| would) like to know\b|\bcould you tell me\b|\bmy question\b/i,
    },
  ],

  // ─── Unidad 5 · pedir con cortesía ───────────────────────────────────────
  vacation_request: [
    {
      id: "dates",
      ask: "the exact dates they want off",
      reaskMarkers: /\bdates?\b|\bwhen\b.*\boff\b/i,
      answerMarkers:
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b|\b\d{1,2}(?:st|nd|rd|th)?\b|\bnext (?:week|month)\b|\bfrom .* to \b/i,
    },
    {
      id: "coverage",
      ask: "who covers their work while away",
      reaskMarkers: /\bcover(age)?\b|\bhandover\b|\bwho.*(take|cover)/i,
      answerMarkers: /\bcover(?:s|ing|age)?\b|\bhandover\b|\bhand over\b|\bwill (?:take|handle|pick)\b/i,
    },
    {
      id: "decision",
      ask: "nothing — decide now: approve or propose an alternative, with the reason",
      reaskMarkers: /approv|alternative/i,
    },
  ],

  // ─── Unidad 1 · presentarse ──────────────────────────────────────────────
  intro_yourself: [
    {
      id: "role",
      ask: "what they do and how long they have been doing it",
      reaskMarkers: /\bwhat do you do\b|\byour role\b|\bhow long\b/i,
      answerMarkers: /\bi(?:'m| am) an?\b|\bdeveloper\b|\bengineer\b|\bqa\b|\bdevops\b|\byears?\b/i,
    },
    {
      id: "stack",
      ask: "which stack or area they work with",
      reaskMarkers: /\bstack\b|\btech(nolog)?\b|\bwhat do you work with\b/i,
      answerMarkers: /\bjava\b|\bpython\b|\breact\b|\bnode\b|\bgo\b|\bkubernetes\b|\bbackend\b|\bfrontend\b|\bstack\b|\bdatabase\b/i,
    },
    {
      id: "location",
      ask: "where they are based and their working hours overlap",
      reaskMarkers: /\bbased\b|\bwhere are you\b|\btime ?zone\b|\bhours\b/i,
      answerMarkers: /\bbased in\b|\bi(?:'m| am) in\b|\bhours? (?:ahead|behind)\b|\bgmt\b|\butc\b|\bcity\b|\bcolombia\b|\bspain\b|\bmexico\b/i,
    },
  ],
  meeting_intro: [
    {
      id: "name_role",
      ask: "their name and role for the room",
      reaskMarkers: /\byour name\b|\byour role\b|\bintroduce\b/i,
      answerMarkers: /\bi(?:'m| am)\b.*\b(?:developer|engineer|qa|lead|analyst)\b|\bmy name\b/i,
    },
    {
      id: "why_here",
      ask: "why they are in this meeting / what they own",
      reaskMarkers: /\bwhy are you\b|\bwhat do you own\b|\byour part\b/i,
      answerMarkers: /\bi(?:'m| am) here (?:to|for|because)\b|\bi own\b|\bi(?:'m| am) responsible for\b|\bmy part\b/i,
    },
    {
      id: "expectation",
      ask: "what they hope to get out of the meeting",
      reaskMarkers: /\bhope to get\b|\bexpect\b|\bwhat do you need\b/i,
      answerMarkers: /\bi(?:'d| would) like\b|\bi hope\b|\bi need\b|\bi want to\b/i,
    },
  ],
  conference_intro: [
    {
      id: "who",
      ask: "who they are and what they work on",
      reaskMarkers: /\bwhat do you (?:do|work on)\b|\byour role\b/i,
      answerMarkers: /\bi(?:'m| am)\b.*\b(?:developer|engineer|working)\b|\bi work (?:on|at|with)\b/i,
    },
    {
      id: "talk",
      ask: "which talk or track brought them here",
      reaskMarkers: /\btalks?\b|\btrack\b|\bsession\b|\bwhy .* here\b/i,
      answerMarkers: /\btalk\b|\bsession\b|\bkeynote\b|\btrack\b|\bworkshop\b/i,
    },
    {
      id: "takeaway",
      ask: "what they are hoping to take away or who they want to meet",
      reaskMarkers: /\btake away\b|\blooking for\b|\bhoping\b/i,
      answerMarkers: /\bi(?:'m| am) (?:looking|hoping)\b|\bi want to\b|\bi(?:'d| would) like to\b/i,
    },
  ],
  morning_greeting: [
    {
      id: "status",
      ask: "how their morning is going",
      reaskMarkers: /\bhow(?:'s| is) (?:it|your morning)\b|\bhow are you\b/i,
      answerMarkers: /\bgoing\b|\bbusy\b|\bslow\b|\bfine\b|\btired\b|\bcoffee\b/i,
    },
    {
      id: "focus",
      ask: "what they are picking up first today",
      reaskMarkers: /\bfirst\b|\btoday\b|\bpicking up\b/i,
      answerMarkers: /\bi(?:'m| am) (?:starting|picking|working)\b|\bfirst i\b|\btoday\b|\bmy plan\b/i,
    },
  ],
  coffee_break: [
    {
      id: "small_talk",
      ask: "something light and safe (weekend, weather, commute)",
      reaskMarkers: /\bweekend\b|\bweather\b|\bcommute\b/i,
      answerMarkers: /\bweekend\b|\bweather\b|\bcommute\b|\bmovie\b|\bfootball\b|\bfamily\b|\btrip\b/i,
    },
    {
      id: "work_life",
      ask: "how their week at work is going",
      reaskMarkers: /\byour week\b|\bhow(?:'s| is) work\b/i,
      answerMarkers: /\bweek\b|\bsprint\b|\bbusy\b|\brelease\b|\bproject\b/i,
    },
    {
      id: "plans",
      ask: "what they are up to after work or next weekend",
      reaskMarkers: /\bafter work\b|\bplans\b|\bnext weekend\b/i,
      answerMarkers: /\bi(?:'m| am) going\b|\bi plan\b|\bmy plans?\b|\btonight\b|\bnext weekend\b/i,
    },
  ],
  lunch_chat: [
    {
      id: "day",
      ask: "how their day is going so far",
      reaskMarkers: /\byour day\b|\bhow(?:'s| is) it going\b/i,
      answerMarkers: /\bday\b|\bmorning\b|\bbusy\b|\bmeetings?\b|\bgoing (?:well|fine)\b/i,
    },
    {
      id: "background",
      ask: "how they got into software / their path",
      reaskMarkers: /\bhow did you (?:get|start)\b|\byour background\b/i,
      answerMarkers: /\bi studied\b|\bi started\b|\bbefore (?:this|that)\b|\buniversity\b|\bbootcamp\b|\bself.?taught\b/i,
    },
    {
      id: "interests",
      ask: "what they do outside work",
      reaskMarkers: /\boutside work\b|\bfree time\b|\bhobb/i,
      answerMarkers: /\bi (?:play|read|run|cook|travel|watch)\b|\bhobby\b|\bfree time\b|\bside project\b/i,
    },
  ],

  // ─── Unidad 3 · describir el entorno ─────────────────────────────────────
  system_walkthrough: [
    {
      id: "components",
      ask: "which main components or services exist",
      reaskMarkers: /\bcomponents?\b|\bservices?\b|\bwhat (?:is|are) there\b/i,
      answerMarkers: /\bthere (?:is|are)\b|\bservices?\b|\bapi\b|\bdatabase\b|\bqueue\b|\bworker\b|\bgateway\b/i,
    },
    {
      id: "data",
      ask: "where the data lives and how much traffic it takes",
      reaskMarkers: /\bdata\b|\bdatabase\b|\btraffic\b|\bhow much\b/i,
      answerMarkers: /\bpostgres\b|\bmysql\b|\bredis\b|\bs3\b|\brps\b|\brequests\b|\bstor(?:e|age)\b|\btraffic\b/i,
    },
    {
      id: "gaps",
      ask: "what is missing or weak (tests, docs, monitoring)",
      reaskMarkers: /\bmissing\b|\bweak\b|\btests?\b|\bdocs?\b|\bmonitor/i,
      answerMarkers: /\bnot much\b|\bfew\b|\blittle\b|\bno (?:tests|docs)\b|\bmissing\b|\bwe (?:don't|do not) have\b/i,
    },
  ],

  // ─── Unidad 4 / 26 · estado asíncrono y escritura ────────────────────────
  slack_thread: [
    {
      id: "current",
      ask: "what they are working on right now",
      reaskMarkers: /\bright now\b|\bworking on\b|\bcurrent\b/i,
      answerMarkers: /\bi(?:'m| am) working\b|\bi(?:'m| am) looking into\b|\bcurrently\b|\bright now\b/i,
    },
    {
      id: "eta",
      ask: "when they expect it to be done",
      reaskMarkers: /\beta\b|\bwhen\b|\bby (?:when|eod)\b/i,
      answerMarkers: /\bby (?:eod|tomorrow|friday|monday)\b|\beta\b|\bshould be\b|\bthis (?:afternoon|week)\b/i,
    },
    {
      id: "help",
      ask: "whether they need anything from the team",
      reaskMarkers: /\bneed anything\b|\bhelp\b|\bfrom the team\b/i,
      answerMarkers: /\bi need\b|\bcould (?:you|someone)\b|\bno,? (?:i(?:'m| am) )?(?:fine|good)\b|\bnothing for now\b/i,
    },
  ],
  slack_status_update: [
    {
      id: "done",
      ask: "what moved since the last update",
      reaskMarkers: /\bsince\b|\bmoved\b|\bdone\b|\bprogress\b/i,
      answerMarkers: /\bi (?:finished|shipped|merged|fixed|deployed)\b|\bdone\b|\bcompleted\b/i,
    },
    {
      id: "next",
      ask: "what comes next and by when",
      reaskMarkers: /\bnext\b|\bby when\b|\beta\b/i,
      answerMarkers: /\bnext\b|\bi(?:'ll| will)\b|\bby (?:eod|tomorrow|friday)\b|\bplan\b/i,
    },
    {
      id: "risk",
      ask: "any risk the team should know about",
      reaskMarkers: /\brisks?\b|\bconcerns?\b|\bwatch out\b/i,
      answerMarkers: /\brisk\b|\bmight\b|\bif\b.*\bthen\b|\bconcern\b|\bno risks?\b/i,
    },
  ],
  documentation_workshop: [
    {
      id: "purpose",
      ask: "what the document is for and who reads it",
      reaskMarkers: /\bwho reads\b|\bwhat(?:'s| is) it for\b|\baudience\b/i,
      answerMarkers: /\bit(?:'s| is) for\b|\breaders?\b|\baudience\b|\bso that\b|\bnew (?:devs|joiners)\b/i,
    },
    {
      id: "steps",
      ask: "the steps in order, in the imperative",
      reaskMarkers: /\bsteps?\b|\border\b|\bfirst\b.*\bthen\b/i,
      answerMarkers: /\bfirst\b|\bthen\b|\bfinally\b|\brun\b|\binstall\b|\bclone\b|\bset\b/i,
    },
    {
      id: "risks",
      ask: "what can go wrong and how to undo it",
      reaskMarkers: /\bgo wrong\b|\brollback\b|\bundo\b|\brisks?\b/i,
      answerMarkers: /\brollback\b|\brevert\b|\bif it fails\b|\bwarning\b|\bcaveat\b|\btroubleshoot/i,
    },
  ],
  meeting_recap: [
    {
      id: "decisions",
      ask: "what was decided in the meeting",
      reaskMarkers: /\bdecided\b|\bdecisions?\b|\bwhat came out\b/i,
      answerMarkers: /\bwe (?:decided|agreed)\b|\bit was decided\b|\bthe decision\b|\bthey (?:said|agreed)\b/i,
    },
    {
      id: "who_said",
      ask: "who said what — attribute the positions",
      reaskMarkers: /\bwho said\b|\bwho (?:wants|thinks)\b|\bpositions?\b/i,
      answerMarkers: /\b(?:he|she|they|maya|tom|priya)\s+(?:said|mentioned|argued|pointed|suggested|warned)\b|\baccording to\b/i,
    },
    {
      id: "actions",
      ask: "the action items and who owns them",
      reaskMarkers: /\baction items?\b|\bwho owns\b|\bnext steps?\b/i,
      answerMarkers: /\baction items?\b|\bwill (?:be|do|take|own)\b|\bis to\b|\bowner\b|\bby (?:friday|monday|next week)\b/i,
    },
  ],

  // ─── Unidad 5 · pedir ayuda ──────────────────────────────────────────────
  ask_for_help: [
    {
      id: "problem",
      ask: "what exactly is broken or blocked",
      reaskMarkers: /\bwhat(?:'s| is) (?:wrong|broken|the problem)\b|\bwhat do you need\b/i,
      answerMarkers: /\bi need\b|\bi(?:'m| am) (?:stuck|blocked)\b|\berror\b|\bfail(?:s|ing|ed)\b|\bcan(?:'t|not)\b/i,
    },
    {
      id: "tried",
      ask: "what they have already tried",
      reaskMarkers: /\balready tried\b|\bwhat have you tried\b|\bdid you try\b/i,
      answerMarkers: /\bi (?:tried|checked|looked|restarted|read)\b|\bi(?:'ve| have) (?:tried|checked)\b/i,
    },
    {
      id: "ask",
      ask: "what specific help they want and by when",
      reaskMarkers: /\bwhat do you want me\b|\bhow can i help\b|\bby when\b/i,
      answerMarkers: /\bcould you\b|\bwould you mind\b|\bcan you\b|\bi was wondering\b|\bby (?:eod|today|tomorrow)\b/i,
    },
  ],
  pair_programming: [
    {
      id: "goal",
      ask: "what they want to get done in this session",
      reaskMarkers: /\bwhat (?:do we|should we) (?:do|start)\b|\bgoal\b/i,
      answerMarkers: /\bwe (?:need|should|could)\b|\bi want to\b|\blet(?:'s| us)\b|\bthe goal\b/i,
    },
    {
      id: "approach",
      ask: "how they would approach it and why",
      reaskMarkers: /\bhow would you\b|\bapproach\b|\bwhy\b/i,
      answerMarkers: /\bi(?:'d| would)\b|\bbecause\b|\bfirst we\b|\bmy idea\b|\binstead of\b/i,
    },
    {
      id: "check",
      ask: "how they will know it works",
      reaskMarkers: /\bhow (?:do|will) (?:we|you) know\b|\btests?\b|\bverify\b/i,
      answerMarkers: /\btests?\b|\bwe can run\b|\bcheck\b|\bassert\b|\bverify\b/i,
    },
  ],
  mentor_junior: [
    {
      id: "symptom",
      ask: "what they are seeing — the symptom, not the guess",
      reaskMarkers: /\bwhat (?:are you seeing|happens)\b|\bsymptom\b/i,
      answerMarkers: /\bi (?:see|get)\b|\berror\b|\bit (?:fails|crashes|hangs|returns)\b|\bstack trace\b/i,
    },
    {
      id: "hypothesis",
      ask: "what they think is causing it",
      reaskMarkers: /\bwhat do you think\b|\bcaus(?:e|ing)\b|\bhypothes/i,
      answerMarkers: /\bi think\b|\bmaybe\b|\bit (?:might|could) be\b|\bmy guess\b|\bprobably\b/i,
    },
    {
      id: "next_step",
      ask: "what they will check next to confirm it",
      reaskMarkers: /\bnext\b|\bhow (?:would|will) you check\b|\bconfirm\b/i,
      answerMarkers: /\bi(?:'ll| will) (?:check|add|look|try)\b|\bnext i\b|\blogs?\b|\bbreakpoint\b/i,
    },
  ],

  // ─── Unidad 8-9 · comparar y estimar ─────────────────────────────────────
  tech_comparison: [
    {
      id: "options",
      ask: "which two options are on the table",
      reaskMarkers: /\boptions?\b|\balternatives?\b|\bwhich two\b/i,
      answerMarkers: /\bversus\b|\bvs\b|\bor\b.*\bor\b|\boption\b|\bcompar/i,
    },
    {
      id: "tradeoff",
      ask: "the concrete trade-off between them",
      reaskMarkers: /\btrade.?offs?\b|\bdownsides?\b|\bcost\b/i,
      answerMarkers: /\btrade.?off\b|\bfaster\b|\bslower\b|\bsimpler\b|\bmore\b|\bless\b|\bdownside\b|\bon the other hand\b/i,
    },
    {
      id: "recommendation",
      ask: "which one they would pick and when they would revisit it",
      reaskMarkers: /\bwhich (?:one )?would you\b|\brecommend\b|\brevisit\b/i,
      answerMarkers: /\bi(?:'d| would) (?:lean|pick|go|choose)\b|\bi recommend\b|\bmy choice\b|\brevisit\b/i,
    },
  ],
  task_estimation: [
    {
      id: "scope",
      ask: "what the task actually involves",
      reaskMarkers: /\bwhat (?:does it|is) involve\b|\bscope\b/i,
      answerMarkers: /\bwe need to\b|\bit involves\b|\bthe work is\b|\bincludes?\b/i,
    },
    {
      id: "estimate",
      ask: "a range, not a single number",
      reaskMarkers: /\bhow long\b|\bestimate\b|\brange\b/i,
      answerMarkers: /\bdays?\b|\bweeks?\b|\bhours?\b|\bthree to\b|\bbetween\b|\broughly\b|\baround\b/i,
    },
    {
      id: "risk",
      ask: "what could make it slip, and the condition",
      reaskMarkers: /\bslip\b|\brisks?\b|\bwhat if\b/i,
      answerMarkers: /\bif\b|\bunless\b|\bas long as\b|\brisk\b|\bassuming\b|\bdepends on\b/i,
    },
  ],

  // ─── Unidad 12-14 · incidentes ───────────────────────────────────────────
  bug_triage: [
    {
      id: "repro",
      ask: "the steps to reproduce it",
      reaskMarkers: /\breproduce\b|\bsteps?\b|\bhow do (?:i|we) see\b/i,
      answerMarkers: /\bwhen (?:you|i)\b|\bsteps?\b|\bfirst\b.*\bthen\b|\bit happens\b|\breproduc/i,
    },
    {
      id: "impact",
      ask: "who is affected and how badly",
      reaskMarkers: /\bimpact\b|\bwho(?:'s| is) affected\b|\bhow many\b/i,
      answerMarkers: /\busers?\b|\bcustomers?\b|\ball\b|\bsome\b|\bpercent\b|\brequests?\b|\bonly\b/i,
    },
    {
      id: "priority",
      ask: "what priority they would give it and why",
      reaskMarkers: /\bpriority\b|\bsev(?:erity)?\b|\bhow urgent\b/i,
      answerMarkers: /\bpriority\b|\bp[0-3]\b|\bcritical\b|\bhigh\b|\blow\b|\bblocker\b|\bcan wait\b/i,
    },
  ],
  incident_postmortem: [
    {
      id: "detection",
      ask: "how the problem was spotted, and how long that took",
      reaskMarkers: /\bhow did (?:you|we) (?:find|spot|detect|notice)\b|\bdetect(?:ion|ed)\b|\balert(?:ed|s)?\b/i,
      answerMarkers:
        /\bthe alert\b|\bwe noticed\b|\ba (?:customer|user) reported\b|\bmonitoring\b|\bdashboard\b|\bpaged?\b|\bminutes\b/i,
    },
    {
      id: "impact",
      ask: "who was affected and how badly",
      reaskMarkers: /\bimpact\b|\bwho was affected\b|\bhow many (?:users|customers)\b|\bhow bad\b/i,
      answerMarkers:
        /\busers?\b|\bcustomers?\b|\brequests?\b|\bdowntime\b|\bper ?cent\b|%|\baffected\b|\bno one\b|\berror rate\b/i,
    },
    {
      id: "timeline",
      ask: "the timeline — what was happening when it broke",
      reaskMarkers: /\btimeline\b|\bwhat was happening\b|\bwhen (?:did|it)\b/i,
      answerMarkers: /\bat \d{1,2}[:.]?\d{0,2}\b|\bwe were\b|\bwhile\b|\bby the time\b|\butc\b/i,
    },
    {
      id: "root_cause",
      ask: "the root cause, distinguishing it from the trigger",
      reaskMarkers: /\broot cause\b|\btrigger\b|\bwhy did it\b/i,
      answerMarkers: /\broot cause\b|\bthe trigger\b|\bbecause\b|\bcaused by\b|\bdue to\b|\bhad (?:not )?been\b/i,
    },
    {
      id: "mitigation",
      ask: "what stopped the bleeding on the day",
      reaskMarkers: /\bmitigat|\bhow did (?:you|we) stop\b|\brolled? back\b|\bhow was it fixed\b/i,
      answerMarkers:
        /\bwe (?:rolled back|restarted|disabled|reverted|scaled|deployed)\b|\bfail(?: |-)?over\b|\bmitigat|\bhot ?fix\b/i,
    },
    {
      id: "prevention",
      ask: "what will prevent it happening again",
      reaskMarkers: /\bprevent\b|\bagain\b|\baction items?\b/i,
      answerMarkers: /\bwe(?:'ll| will)\b|\baction items?\b|\balert\b|\bwe should have\b|\bto prevent\b/i,
    },
  ],
  oncall_handover: [
    {
      id: "open_issues",
      ask: "what is still open right now",
      reaskMarkers: /\bstill open\b|\banything (?:open|ongoing)\b|\bactive\b/i,
      answerMarkers: /\bopen\b|\bongoing\b|\bstill\b|\bnothing\b|\bwe have\b|\bthere(?:'s| is)\b/i,
    },
    {
      id: "watch",
      ask: "what to keep an eye on during the shift",
      reaskMarkers: /\bkeep an eye\b|\bwatch\b|\bmonitor\b/i,
      answerMarkers: /\bwatch\b|\bkeep an eye\b|\bif .* alerts?\b|\bmonitor\b|\bmight\b/i,
    },
    {
      id: "escalation",
      ask: "who to escalate to and when",
      reaskMarkers: /\bescalat/i,
      answerMarkers: /\bescalate\b|\bpage\b|\bcall\b|\bif it\b|\bafter \d+\b|\bcontact\b/i,
    },
  ],
  escalation_call: [
    {
      id: "situation",
      ask: "the situation in one line, no preamble",
      reaskMarkers: /\bwhat(?:'s| is) (?:the situation|going on)\b|\bstatus\b/i,
      answerMarkers: /\bwe (?:have|are)\b|\bcustomers?\b|\bdown\b|\bdegraded\b|\bsince\b/i,
    },
    {
      id: "impact_business",
      ask: "the business impact in numbers",
      reaskMarkers: /\bimpact\b|\bhow many\b|\bcost\b|\brevenue\b/i,
      answerMarkers: /\bpercent\b|\b\d+\b.*\b(?:users|customers|requests|orders)\b|\brevenue\b|\bsla\b/i,
    },
    {
      id: "ask_decision",
      ask: "what decision or resource they need from leadership",
      reaskMarkers: /\bwhat do you need\b|\bdecision\b|\bfrom (?:me|us)\b/i,
      answerMarkers: /\bwe need\b|\bi(?:'m| am) asking\b|\bapprove\b|\bdecision\b|\bmore (?:people|time)\b/i,
    },
  ],

  // ─── Unidad 13 / 16 · review y reuniones ─────────────────────────────────
  code_review: [
    {
      id: "intent",
      ask: "what the change is meant to do",
      reaskMarkers: /\bwhat does (?:it|this) do\b|\bintent\b|\bpurpose\b/i,
      answerMarkers: /\bit (?:adds|fixes|changes|removes|refactors)\b|\bthe (?:change|pr)\b|\bso that\b/i,
    },
    {
      id: "scope",
      ask: "how big the change is and what it touches",
      reaskMarkers: /\bhow big\b|\bscope\b|\bhow many files\b|\bwhat does it touch\b/i,
      answerMarkers:
        /\b(?:files?|lines?|modules?|packages?)\b|\bit touches\b|\bonly (?:the|in)\b|\bjust the\b|\bsmall\b|\bbig(?:ger)?\b/i,
    },
    {
      id: "concern",
      ask: "their view on the risky part the reviewer flags",
      reaskMarkers: /\bconcern\b|\brisky\b|\bwhat about\b|\bwhy did you\b/i,
      answerMarkers: /\bi did (?:that|it) (?:on purpose|because)\b|\bfair point\b|\bgood catch\b|\bi(?:'d| would) push back\b|\bbecause\b/i,
    },
    {
      id: "testing",
      ask: "how they tested the change",
      reaskMarkers: /\btest(?:s|ed|ing)?\b|\bcoverage\b|\bhow do you know it works\b/i,
      answerMarkers:
        /\bi (?:added|wrote|ran)\b|\b(?:unit|integration|e2e) tests?\b|\bmanually\b|\bcovered by\b|\bno tests?\b|\bin staging\b/i,
    },
    {
      id: "tradeoff",
      ask: "the trade-off they accepted and why",
      reaskMarkers: /\btrade-?off\b|\bwhy this way\b|\bother approach\b|\bdownside\b/i,
      answerMarkers:
        /\btrade-?off\b|\b(?:i|we) (?:chose|picked|went with)\b|\bsimpler\b|\bfaster\b|\bfor now\b|\bthe cost is\b|\binstead of\b/i,
    },
    {
      id: "next_action",
      ask: "what they will change before merging",
      reaskMarkers: /\bbefore (?:you )?merg\b|\bwhat will you change\b|\bnext\b/i,
      answerMarkers: /\bi(?:'ll| will) (?:add|change|fix|split|update)\b|\bi(?:'ve| have) addressed\b|\blet me\b/i,
    },
  ],
  design_review: [
    {
      id: "problem",
      ask: "the problem the design solves",
      reaskMarkers: /\bwhat problem\b|\bwhy\b|\bproblem\b/i,
      answerMarkers: /\bthe problem\b|\bbecause\b|\btoday we\b|\bwe (?:need|can't)\b/i,
    },
    {
      id: "constraints",
      ask: "the constraints the design has to live with",
      reaskMarkers: /\bconstraints?\b|\blimits?\b|\bbudget\b|\bdeadline\b|\bwhat are you stuck with\b/i,
      answerMarkers:
        /\bwe (?:only|can'?t|cannot|have to|must)\b|\bconstraint\b|\bdeadline\b|\bbudget\b|\blatency\b|\blegacy\b/i,
    },
    {
      id: "alternatives",
      ask: "which alternatives they considered and rejected",
      reaskMarkers: /\balternatives?\b|\bother options?\b|\bwhy not\b/i,
      answerMarkers: /\bwe considered\b|\binstead of\b|\bwe rejected\b|\banother option\b|\bif we (?:did|used)\b/i,
    },
    {
      id: "data_flow",
      ask: "how data moves through the design",
      reaskMarkers: /\bdata (?:flow|move)\b|\bhow does (?:the )?(?:data|request)\b|\bwalk me through\b/i,
      answerMarkers:
        /\bthe (?:request|event|message|payload)\b|\bgoes (?:to|through)\b|\bwrites? to\b|\breads? from\b|\bqueue\b|\bthen (?:it|we)\b/i,
    },
    {
      id: "failure_mode",
      ask: "how it fails and what they would do then",
      reaskMarkers: /\bfail(?:s|ure)\b|\bwhat if\b|\bfallback\b/i,
      answerMarkers: /\bif it fails\b|\bfailure mode\b|\bfall(?: |-)?back\b|\bwe(?:'d| would)\b|\bworst case\b/i,
    },
    {
      id: "rollout",
      ask: "how they would roll it out safely",
      reaskMarkers: /\broll ?out\b|\bmigrat|\bship it\b|\bdeploy\b|\bhow do we get there\b/i,
      answerMarkers:
        /\bfeature flag\b|\bwe(?:'d| would) roll\b|\bmigrat|\bin phases\b|\bcanary\b|\bgradual|\bbehind a flag\b/i,
    },
  ],
  architecture_pitch: [
    {
      id: "proposal",
      ask: "what exactly they are proposing, in one line",
      reaskMarkers: /\bwhat are you proposing\b|\bproposal\b/i,
      answerMarkers: /\bi(?:'m| am) proposing\b|\bwe should\b|\bmy proposal\b|\bwhat we(?:'re| are) proposing\b/i,
    },
    {
      id: "benefit",
      ask: "the concrete benefit, with a number if possible",
      reaskMarkers: /\bbenefit\b|\bwhy (?:is it )?better\b|\bgain\b/i,
      answerMarkers: /\bfaster\b|\bcheaper\b|\bpercent\b|\breduce\b|\bsave\b|\bimprove\b|\b\d+x\b/i,
    },
    {
      id: "cost",
      ask: "what it costs — effort, risk, or what they give up",
      reaskMarkers: /\bcost\b|\beffort\b|\bgive up\b|\brisks?\b/i,
      answerMarkers: /\bit (?:costs|takes)\b|\bweeks?\b|\bwe(?:'d| would) (?:lose|need)\b|\btrade.?off\b|\brisk\b/i,
    },
    {
      id: "objection",
      ask: "how they answer the strongest objection to it",
      reaskMarkers: /\bobjection\b|\bwhat if (?:i|we) said\b|\bpush ?back\b|\bconvince me\b|\bwhy not just\b/i,
      answerMarkers:
        /\bfair (?:point|enough)\b|\bi(?:'d| would) argue\b|\bthat(?:'s| is) true, but\b|\bthe difference is\b|\bwe already\b/i,
    },
    {
      id: "first_step",
      ask: "the smallest first step they want approved today",
      reaskMarkers: /\bfirst step\b|\bwhat do you need\b|\bstart (?:with|small)\b|\bwhat are you asking\b/i,
      answerMarkers:
        /\bstart (?:with|by)\b|\ba (?:spike|prototype|pilot|proof)\b|\bone (?:service|team|module)\b|\btwo weeks\b|\bi(?:'m| am) asking for\b/i,
    },
  ],
  multi_team_sync: [
    {
      id: "your_update",
      ask: "their team's status in two lines",
      reaskMarkers: /\byour (?:team|update)\b|\bwhere are you\b/i,
      answerMarkers: /\bwe (?:finished|shipped|are)\b|\bour team\b|\bon track\b|\bwe(?:'re| are) behind\b/i,
    },
    {
      id: "dependency",
      ask: "what they need from another team",
      reaskMarkers: /\bneed from\b|\bdependenc/i,
      answerMarkers: /\bwe need\b|\bwaiting (?:on|for)\b|\bdepends on\b|\bfrom (?:the )?\w+ team\b/i,
    },
    {
      id: "disagreement",
      ask: "for their position on the contested date or scope",
      reaskMarkers: /\bdisagree\b|\byour position\b|\bpush back\b/i,
      answerMarkers: /\bi(?:'d| would) push back\b|\bi disagree\b|\bi see it\b|\bactually\b|\bi(?:'m| am) not sure\b/i,
    },
  ],
  release_planning: [
    {
      id: "scope",
      ask: "what is in the release and what is out",
      reaskMarkers: /\bscope\b|\bwhat(?:'s| is) in\b|\bcut\b/i,
      answerMarkers: /\bin (?:the|this) release\b|\bwe(?:'re| are) (?:including|cutting)\b|\bout of scope\b|\bnot this time\b/i,
    },
    {
      id: "date",
      ask: "the date they can commit to and the condition",
      reaskMarkers: /\bdate\b|\bwhen\b|\bcommit\b/i,
      answerMarkers: /\bby \w+day\b|\bnext (?:week|sprint)\b|\bwe can\b|\bif\b|\bas long as\b/i,
    },
    {
      id: "rollback",
      ask: "the rollback plan if it goes wrong",
      reaskMarkers: /\brollback\b|\bif it goes wrong\b|\bplan b\b/i,
      answerMarkers: /\broll ?back\b|\bfeature flag\b|\bwe can revert\b|\bdisable\b/i,
    },
  ],
  retrospective: [
    {
      id: "went_well",
      ask: "what went well this sprint",
      reaskMarkers: /\bwent well\b|\bgood\b|\bpositive\b/i,
      answerMarkers: /\bwent well\b|\bwe (?:managed|shipped|improved)\b|\bgood (?:thing|part)\b|\bi liked\b/i,
    },
    {
      id: "went_badly",
      ask: "what did not work",
      reaskMarkers: /\bdidn(?:'t| not) (?:work|go)\b|\bwent (?:badly|wrong)\b|\bproblems?\b/i,
      answerMarkers: /\bdidn(?:'t| not) work\b|\bwe struggled\b|\bthe problem was\b|\btoo (?:many|much)\b|\bwent wrong\b/i,
    },
    {
      id: "cause",
      ask: "why they think it went that way",
      reaskMarkers: /\bwhy do you think\b|\bwhat caused\b|\breason\b|\bbehind (?:it|that)\b/i,
      answerMarkers:
        /\bbecause\b|\bthe reason\b|\bwe (?:under ?estimated|assumed|forgot)\b|\bit happened when\b|\bmostly\b/i,
    },
    {
      id: "own_part",
      ask: "their own part in it, not just the team's",
      reaskMarkers: /\byour (?:part|side)\b|\bwhat about you\b|\byou personally\b|\bfrom your side\b/i,
      answerMarkers:
        /\bi (?:should have|could have|didn'?t|took|missed|kept)\b|\bmy (?:part|side|fault)\b|\bon my end\b|\bpersonally\b/i,
    },
    {
      id: "action",
      ask: "one concrete change to try next sprint",
      reaskMarkers: /\bnext sprint\b|\bchange\b|\btry\b|\baction\b/i,
      answerMarkers: /\bnext sprint\b|\bwe (?:should|could|will)\b|\blet(?:'s| us) try\b|\bi suggest\b/i,
    },
  ],
  sprint_review: [
    {
      id: "demo",
      ask: "what they built and how it works",
      reaskMarkers: /\bshow (?:me|us)\b|\bwhat did you build\b|\bdemo\b/i,
      answerMarkers: /\bwe (?:built|added|shipped)\b|\bthis (?:feature|screen)\b|\bhere you can\b|\bit (?:lets|allows)\b/i,
    },
    {
      id: "value",
      ask: "who benefits and how",
      reaskMarkers: /\bwho benefits\b|\bvalue\b|\bwhy does it matter\b/i,
      answerMarkers: /\busers? can\b|\bcustomers?\b|\bthis (?:saves|helps|means)\b|\bso (?:they|users)\b/i,
    },
    {
      id: "not_done",
      ask: "what is not done yet",
      reaskMarkers: /\bnot done\b|\bleft\b|\bmissing\b|\bnext\b/i,
      answerMarkers: /\bnot (?:done|finished)\b|\bstill (?:need|missing)\b|\bnext sprint\b|\bwe haven(?:'t| not)\b/i,
    },
  ],
  tool_demo: [
    {
      id: "what_it_does",
      ask: "what the tool does and the problem it solves",
      reaskMarkers: /\bwhat does it do\b|\bwhat(?:'s| is) it for\b/i,
      answerMarkers: /\bit (?:does|lets|helps|solves)\b|\bthe problem\b|\bbefore (?:this|it)\b/i,
    },
    {
      id: "how_use",
      ask: "how they would use it day to day",
      reaskMarkers: /\bhow (?:do|would) (?:i|we|you) use\b|\bday to day\b/i,
      answerMarkers: /\byou (?:just|can)\b|\bfirst\b|\bthen\b|\bi run\b|\bin the terminal\b/i,
    },
    {
      id: "limits",
      ask: "where it falls short",
      reaskMarkers: /\bfalls? short\b|\blimits?\b|\bdownside\b|\bwhat(?:'s| is) missing\b/i,
      answerMarkers: /\bit (?:doesn(?:'t| not)|can(?:'t|not))\b|\blimitation\b|\bnot (?:great|good) (?:at|for)\b|\bdownside\b/i,
    },
  ],
  stakeholder_pres: [
    {
      id: "headline",
      ask: "the headline result, no technical detail",
      reaskMarkers: /\bheadline\b|\bbottom line\b|\bwhere are we\b/i,
      answerMarkers: /\bwe (?:cut|reduced|improved|shipped|increased)\b|\bpercent\b|\bnow\b.*\bvs\b|\bthe result\b/i,
    },
    {
      id: "numbers",
      ask: "the numbers behind it",
      reaskMarkers: /\bnumbers?\b|\bdata\b|\bmetrics?\b|\bhow much\b/i,
      answerMarkers: /\b\d+\b.*(?:percent|ms|minutes|users|%)|\bfrom\b.*\bto\b|\bp99\b|\baverage\b/i,
    },
    {
      id: "next_ask",
      ask: "what they want from the stakeholders",
      reaskMarkers: /\bwhat do you need\b|\bfrom us\b|\bnext steps?\b/i,
      answerMarkers: /\bwe need\b|\bi(?:'m| am) asking\b|\bapproval\b|\bbudget\b|\bnext (?:step|quarter)\b/i,
    },
  ],
  tech_strategy_pitch: [
    {
      id: "thesis",
      ask: "the single idea they want remembered",
      reaskMarkers: /\bone (?:idea|thing)\b|\bthesis\b|\bin one sentence\b/i,
      answerMarkers: /\bwhat matters is\b|\bit(?:'s| is)\b.*\bthat\b|\bmy point\b|\bthe key\b|\bwe should\b/i,
    },
    {
      id: "evidence",
      ask: "the evidence, and how confident they are",
      reaskMarkers: /\bevidence\b|\bhow (?:do you know|confident)\b|\bdata\b/i,
      answerMarkers: /\bbased on\b|\bthe (?:data|benchmarks?)\b|\bwe measured\b|\blikely\b|\bappears? to\b|\bi(?:'m| am) fairly\b/i,
    },
    {
      id: "risk_if_not",
      ask: "the cost of doing nothing",
      reaskMarkers: /\bdoing nothing\b|\bif we don(?:'t| not)\b|\brisk\b/i,
      answerMarkers: /\bif we don(?:'t| not)\b|\bwe(?:'ll| will) (?:lose|keep|end up)\b|\bthe risk is\b|\bcost of\b/i,
    },
  ],

  // ─── Unidad 20 / 23-24 · negociar, liderar ───────────────────────────────
  peer_feedback_1on1: [
    {
      id: "observation",
      ask: "the specific behaviour they observed, not a judgement",
      reaskMarkers: /\bwhat did you (?:see|notice)\b|\bobserv/i,
      answerMarkers: /\bi noticed\b|\bin the last\b|\bwhen you\b|\bthe last (?:few|three)\b|\byesterday\b/i,
    },
    {
      id: "impact",
      ask: "the impact it had",
      reaskMarkers: /\bimpact\b|\beffect\b|\bwhat happened\b/i,
      answerMarkers: /\bthe impact\b|\bit (?:meant|made|caused|slowed)\b|\bas a result\b|\bso (?:we|the team)\b/i,
    },
    {
      id: "agreement",
      ask: "what they agree to do differently",
      reaskMarkers: /\bdifferently\b|\bagree\b|\bgoing forward\b/i,
      answerMarkers: /\bi(?:'ll| will)\b|\bwe (?:agreed|could)\b|\bgoing forward\b|\bnext time\b|\blet(?:'s| us)\b/i,
    },
  ],
  salary_negotiation: [
    {
      id: "number",
      ask: "the number they were expecting, with justification",
      reaskMarkers: /\bwhat (?:number|were you expecting)\b|\bexpectations?\b/i,
      answerMarkers: /\b\d{2,3}(?:k|,\d{3})?\b|\bcloser to\b|\bexpecting\b|\bmarket\b|\bbased on\b/i,
    },
    {
      id: "priority",
      ask: "which part of the package matters most to them",
      reaskMarkers: /\bmatters most\b|\bpriorit/i,
      answerMarkers: /\bbase\b|\bmatters most\b|\bmost important\b|\bequity\b|\bbonus\b|\bremote\b|\bvacation\b/i,
    },
    {
      id: "conditional",
      ask: "what they would commit to if the offer moved",
      reaskMarkers: /\bif (?:we|i) (?:could|moved)\b|\bwould you\b/i,
      answerMarkers: /\bif you could\b|\bi(?:'d| would) sign\b|\bas long as\b|\bprovided\b|\bthen i\b/i,
    },
  ],
  talent_negotiation: [
    {
      id: "motivation",
      ask: "what they are looking for in the role",
      reaskMarkers: /\blooking for\b|\bwhat matters\b|\bmotivat/i,
      answerMarkers: /\bi(?:'m| am) looking for\b|\bi want\b|\bmatters to me\b|\bgrowth\b|\bimpact\b/i,
    },
    {
      id: "constraints",
      ask: "their constraints — timing, competing offers",
      reaskMarkers: /\btimeline\b|\bother offers?\b|\bconstraints?\b/i,
      answerMarkers: /\banother offer\b|\bi have\b.*\boffer\b|\bby \w+day\b|\btwo weeks\b|\bnotice period\b/i,
    },
    {
      id: "close",
      ask: "what it would take to close today",
      reaskMarkers: /\bclose\b|\bwhat would it take\b|\bsign\b/i,
      answerMarkers: /\bi(?:'d| would) (?:sign|accept)\b|\bif you\b|\bit would take\b|\bi need\b/i,
    },
  ],
  hiring_debrief: [
    {
      id: "signal",
      ask: "the strongest signal they saw",
      reaskMarkers: /\bsignal\b|\bstrong(?:est)?\b|\bwhat did you see\b/i,
      answerMarkers: /\bstrong\b|\bshe|he|they (?:handled|explained|showed)\b|\bthe best part\b|\bimpressed\b/i,
    },
    {
      id: "concern",
      ask: "the concern that gives them pause",
      reaskMarkers: /\bconcern\b|\bpause\b|\bworr/i,
      answerMarkers: /\bmy concern\b|\bi(?:'m| am) not sure\b|\bthe gap\b|\bhe|she|they (?:struggled|couldn't)\b/i,
    },
    {
      id: "decision",
      ask: "their hire / no-hire call and the reason",
      reaskMarkers: /\bhire\b|\bdecision\b|\byour call\b/i,
      answerMarkers: /\bi(?:'d| would) hire\b|\bno hire\b|\byes\b.*\bbecause\b|\bi(?:'m| am) a (?:yes|no)\b|\bleaning\b/i,
    },
  ],
  vendor_call: [
    {
      id: "need",
      ask: "what problem they are trying to solve",
      reaskMarkers: /\bwhat (?:problem|do you need)\b|\buse case\b/i,
      answerMarkers: /\bwe need\b|\bour problem\b|\bwe(?:'re| are) trying to\b|\bcurrently we\b/i,
    },
    {
      id: "constraints",
      ask: "their constraints — budget, timeline, compliance",
      reaskMarkers: /\bbudget\b|\btimeline\b|\bconstraints?\b|\bcomplian/i,
      answerMarkers: /\bbudget\b|\bby \w+\b|\bwe can(?:'t|not)\b|\bcompliance\b|\bgdpr\b|\bon.?prem\b/i,
    },
    {
      id: "next_step",
      ask: "the next step they want",
      reaskMarkers: /\bnext step\b|\bhow (?:do we|should we) proceed\b/i,
      answerMarkers: /\bwe(?:'d| would) like\b|\bsend (?:me|us)\b|\btrial\b|\bproof of concept\b|\bfollow up\b/i,
    },
  ],
  behavioral_qa: [
    {
      id: "situation",
      ask: "the situation and the task they owned",
      reaskMarkers: /\bsituation\b|\bcontext\b|\btell me about a time\b/i,
      answerMarkers: /\bfor context\b|\bat my (?:last|previous)\b|\bthe situation\b|\bwe (?:had|were)\b|\bmy (?:task|job)\b/i,
    },
    {
      id: "action",
      ask: "what THEY did, not the team",
      reaskMarkers: /\bwhat did you do\b|\byour (?:action|part)\b/i,
      answerMarkers: /\bi (?:did|built|led|proposed|talked|decided|wrote)\b|\bso what i did\b|\bmy part\b/i,
    },
    {
      id: "result",
      ask: "the measurable result and what they learned",
      reaskMarkers: /\bresult\b|\boutcome\b|\blearn/i,
      answerMarkers: /\bthe (?:result|outcome)\b|\bwe (?:cut|reduced|shipped)\b|\bpercent\b|\bi learned\b|\btook away\b/i,
    },
  ],
};
