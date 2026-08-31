/**
 * Datos de fonética — transcripción fiel de la PARTE 1 (El sistema de sonidos)
 * de `English-for-Software-Engineers-fuente.md` (secciones 1.2 a 1.12).
 *
 * Representación del atlas de vocales (1.2): cada vocal es un `MinimalPair`
 * donde `a` = símbolo IPA, `b` = palabras técnicas de ejemplo, `ipaA` = el
 * fonema y `noteEs` = ajuste físico + aproximación al español (o el
 * movimiento, en diptongos). Así una sola estructura cubre contrastes reales
 * y el atlas sin tipos adicionales.
 */

import type {
  MinimalPair,
  PhoneticChallenge,
  PronunciationRule,
  ShadowingPhase,
  SoundContrast,
} from "@/domain/phonetics/phonetics";

// ---------------------------------------------------------------------------
// 1.2 Atlas de vocales (representado como SoundContrast "vowel-atlas")
// ---------------------------------------------------------------------------

const VOWEL_ATLAS_PAIRS: MinimalPair[] = [
  // Vocales simples
  {
    a: "/iː/",
    b: "scene, release, delete, key, machine",
    ipaA: "iː",
    noteEs:
      "Ajuste físico: labios estirados como en sonrisa forzada, lengua muy alta y adelante, sonido largo. Aproximación ES: como la i de «mí» pero más larga y más tensa.",
  },
  {
    a: "/ɪ/",
    b: "commit, build, list, system, minute",
    ipaA: "ɪ",
    noteEs:
      "Ajuste físico: boca relajada, lengua un poco más baja, sonido corto. Aproximación ES: entre la i y la e españolas, floja y breve.",
  },
  {
    a: "/e/",
    b: "test, method, debt, header, merge",
    ipaA: "e",
    noteEs:
      "Ajuste físico: similar a la e española, algo más abierta. Aproximación ES: e de «mesa».",
  },
  {
    a: "/æ/",
    b: "stack, patch, class, batch, random",
    ipaA: "æ",
    noteEs:
      "Ajuste físico: mandíbula muy abierta, lengua baja y adelante. Aproximación ES: a de «casa» pero con la boca aún más abierta y sonrisa lateral.",
  },
  {
    a: "/ʌ/",
    b: "bug, null, run, function, trunk",
    ipaA: "ʌ",
    noteEs:
      "Ajuste físico: boca medio abierta, lengua central, sonido seco y corto. Aproximación ES: una a muy corta y apagada, casi e.",
  },
  {
    a: "/ɑː/",
    b: "job, log, object, mock, arg",
    ipaA: "ɑː",
    noteEs:
      "Ajuste físico: boca muy abierta, lengua atrás y baja, larga. Aproximación ES: a de «palo» pero más larga y posterior.",
  },
  {
    a: "/ɔː/",
    b: "call, default, false, port, source",
    ipaA: "ɔː",
    noteEs:
      "Ajuste físico: labios redondeados, lengua atrás, larga. Aproximación ES: entre o y a, con labios en o.",
  },
  {
    a: "/ʊ/",
    b: "push, pull, cook, look, could",
    ipaA: "ʊ",
    noteEs:
      "Ajuste físico: labios poco redondeados, lengua alta atrás, corta. Aproximación ES: u muy breve y relajada, casi o.",
  },
  {
    a: "/uː/",
    b: "loop, root, rule, module, tuple",
    ipaA: "uː",
    noteEs:
      "Ajuste físico: labios muy redondeados y adelantados, larga. Aproximación ES: u de «tú» pero más larga y con más protrusión.",
  },
  {
    a: "/ɝː/",
    b: "server, work, first, merge, return",
    ipaA: "ɝː",
    noteEs:
      "Ajuste físico: boca a media abertura + lengua curvada hacia atrás (r) simultáneamente. Aproximación ES: no existe en español; es una e con r americana encima.",
  },
  {
    a: "/ə/",
    b: "about, system, computer, data, pixel",
    ipaA: "ə",
    noteEs:
      "Ajuste físico: la vocal neutra; relaja completamente la boca y emite. Aproximación ES: e muy débil, casi inaudible.",
  },
  // Diptongos
  {
    a: "/eɪ/",
    b: "data, state, fail, update, migrate",
    ipaA: "eɪ",
    noteEs: "Diptongo. Movimiento: de e → i, deslizando.",
  },
  {
    a: "/aɪ/",
    b: "type, size, pipeline, client, while",
    ipaA: "aɪ",
    noteEs: "Diptongo. Movimiento: de a → i.",
  },
  {
    a: "/ɔɪ/",
    b: "deploy, void, join, destroy, point",
    ipaA: "ɔɪ",
    noteEs: "Diptongo. Movimiento: de o → i.",
  },
  {
    a: "/aʊ/",
    b: "count, mount, router [US], out, down",
    ipaA: "aʊ",
    noteEs: "Diptongo. Movimiento: de a → u.",
  },
  {
    a: "/oʊ/",
    b: "code, load, host, local, role",
    ipaA: "oʊ",
    noteEs:
      "Diptongo. Movimiento: de o → u; no es la o española simple. Error nº1 de vocales: «code» no es \"cod\", es \"coud\"; «load» es \"loud\" (con o inicial). Sin ese deslizamiento, code = cod (bacalao).",
  },
];

// ---------------------------------------------------------------------------
// 1.3 Pares mínimos con vocabulario técnico
// ---------------------------------------------------------------------------

export const SOUND_CONTRASTS: SoundContrast[] = [
  {
    id: "vowel-atlas",
    titleEs: "Atlas de vocales: 11 vocales simples + 5 diptongos",
    phonemes: [
      "iː", "ɪ", "e", "æ", "ʌ", "ɑː", "ɔː", "ʊ", "uː", "ɝː", "ə",
      "eɪ", "aɪ", "ɔɪ", "aʊ", "oʊ",
    ],
    explanationEs:
      "El español tiene 5 vocales estables; el inglés general americano tiene 11 vocales simples + 5 diptongos (más las vocales con color de r). Tu cerebro intenta encajar 16 sonidos en 5 casillas. Practica cada fila en voz alta cinco veces: el «ajuste físico» de la boca es más útil que cualquier aproximación al español. Cada entrada de esta lista es una vocal: a = fonema IPA, b = palabras técnicas de ejemplo, noteEs = ajuste físico y aproximación.",
    pairs: VOWEL_ATLAS_PAIRS,
  },
  {
    id: "i-vs-ii",
    titleEs: "/ɪ/ vs /iː/ — el par más rentable de tu carrera",
    phonemes: ["ɪ", "iː"],
    explanationEs:
      "/ɪ/ es corta y relajada; /iː/ es larga y tensa. Confundirlas cambia palabras: «live» (en producción) vs «leave» (irse). Trabaja así: (1) lee ambas en voz alta 3 veces; (2) grábate diciendo una al azar; (3) escucha la grabación un día después y comprueba si distingues cuál dijiste.",
    pairs: [
      { a: "live", b: "leave", ipaA: "lɪv", ipaB: "liːv", noteEs: "live = en producción, en vivo; leave = irse, dejar. Frase: «It's live.» vs «It's leave.»" },
      { a: "bit", b: "beat", ipaA: "bɪt", ipaB: "biːt", noteEs: "Frase: «a bit slow» vs «a beat»." },
      { a: "fill", b: "feel", ipaA: "fɪl", ipaB: "fiːl", noteEs: "Frase: «fill the array» vs «feel the array»." },
      { a: "sit", b: "seat", ipaA: "sɪt", ipaB: "siːt" },
      { a: "hit", b: "heat", ipaA: "hɪt", ipaB: "hiːt", noteEs: "hit = cache hit. Frase: «cache hit» vs «cache heat»." },
      { a: "since", b: "scene", ipaA: "sɪns", ipaB: "siːn" },
      { a: "it", b: "eat", ipaA: "ɪt", ipaB: "iːt", noteEs: "Frase: «Did it work?» vs «Did eat work?»" },
      { a: "grid", b: "greed", ipaA: "ɡrɪd", ipaB: "ɡriːd" },
      { a: "slip", b: "sleep", ipaA: "slɪp", ipaB: "sliːp" },
      { a: "still", b: "steal", ipaA: "stɪl", ipaB: "stiːl", noteEs: "Frase: «It's still failing»." },
      { a: "list", b: "least", ipaA: "lɪst", ipaB: "liːst", noteEs: "Frase: «the list» vs «at least»." },
      { a: "rich", b: "reach", ipaA: "rɪtʃ", ipaB: "riːtʃ", noteEs: "Frase: «reach out to them»." },
    ],
    practiceSentence: "It's live. / It's still failing. / Reach out to them.",
  },
  {
    id: "ae-e-uh",
    titleEs: "/æ/ vs /e/ vs /ʌ/",
    phonemes: ["æ", "e", "ʌ"],
    explanationEs:
      "Tres vocales que el oído hispano funde en una sola «a/e». Nota crítica: «stack» vs «stuck» aparece a diario — «The stack is broken» y «It's stuck» son frases distintas. Y «cache» se pronuncia igual que «cash» /kæʃ/ — nunca \"ca-ché\" ni \"cachi\". Cada trío de la fuente se descompone aquí en pares de dos.",
    pairs: [
      { a: "bad", b: "bed", ipaA: "bæd", ipaB: "bed" },
      { a: "bed", b: "bud", ipaA: "bed", ipaB: "bʌd" },
      { a: "match", b: "mesh", ipaA: "mætʃ", ipaB: "meʃ" },
      { a: "mesh", b: "much", ipaA: "meʃ", ipaB: "mʌtʃ" },
      { a: "track", b: "trek", ipaA: "træk", ipaB: "trek" },
      { a: "trek", b: "truck", ipaA: "trek", ipaB: "trʌk" },
      { a: "batch", b: "butch", ipaA: "bætʃ", noteEs: "/æ/ vs /ʌ/." },
      { a: "cash / cache", b: "cush", ipaA: "kæʃ", noteEs: "cash = cache /kæʃ/. /æ/ vs /ʌ/." },
      { a: "ran", b: "wren", ipaA: "ræn", noteEs: "/æ/ vs /e/." },
      { a: "ran", b: "run", ipaA: "ræn", ipaB: "rʌn" },
      { a: "stack", b: "stuck", ipaA: "stæk", ipaB: "stʌk", noteEs: "El contraste más frecuente del trabajo diario." },
      { a: "flash", b: "flesh", ipaA: "flæʃ", ipaB: "fleʃ" },
      { a: "flesh", b: "flush", ipaA: "fleʃ", ipaB: "flʌʃ" },
    ],
    practiceSentence: "The stack is broken. / It's stuck.",
  },
  {
    id: "b-vs-v",
    titleEs: "/b/ vs /v/ — el español no tiene /v/",
    phonemes: ["b", "v"],
    explanationEs:
      "En español, b y v son el mismo fonema; en inglés son distintos y confundirlos cambia palabras. /b/: los labios se cierran completamente y se abren de golpe. /v/: el labio inferior toca los dientes superiores y el aire pasa vibrando de forma continua — puedes sostener una /v/ tres segundos; una /b/ no. Palabras técnicas con /v/ que casi seguro pronuncias con /b/: variable, version, value, valid, server, service, review, override, involve, resolve, environment, developer.",
    pairs: [
      { a: "base", b: "vase", ipaA: "beɪs", ipaB: "veɪs" },
      { a: "boat", b: "vote", ipaA: "boʊt", ipaB: "voʊt" },
      { a: "berry", b: "very", ipaB: "ˈveri" },
      { a: "bug", b: "—", ipaA: "bʌɡ", noteEs: "Sin par con /v/; sirve para aislar la /b/ oclusiva." },
      { a: "best", b: "vest", ipaA: "best", ipaB: "vest" },
      { a: "curb", b: "curve", ipaB: "kɝːv" },
      { a: "rebel", b: "revel" },
    ],
    practiceSentence:
      "The developer resolved the version conflict in the dev environment.",
  },
  {
    id: "s-inicial",
    titleEs: "/s/ inicial: no añadas una \"e\"",
    phonemes: ["s"],
    explanationEs:
      "El español no permite palabras que empiecen por s + consonante (escuela, estructura), así que tu boca añadirá automáticamente una e. Es el marcador más audible de acento hispano y afecta a docenas de términos técnicos. Truco de entrenamiento: pronuncia primero la s sola y alargada, luego añade el resto: «ssssss-cript», «ssssss-tack». Repite hasta poder empezar en frío sin la e. En cada par: a = correcto, b = error típico.",
    pairs: [
      { a: "script", b: "escript", ipaA: "skrɪpt", noteEs: "b = error típico." },
      { a: "stack", b: "estack", ipaA: "stæk", noteEs: "b = error típico." },
      { a: "string", b: "estring", ipaA: "strɪŋ", noteEs: "b = error típico." },
      { a: "state", b: "estate", ipaA: "steɪt", noteEs: "¡«estate» existe y significa otra cosa!" },
      { a: "stream", b: "estream", ipaA: "striːm", noteEs: "b = error típico." },
      { a: "schema", b: "esquema", ipaA: "ˈskiːmə", noteEs: "b = error típico." },
      { a: "scale", b: "escale", ipaA: "skeɪl", noteEs: "b = error típico." },
      { a: "spike", b: "espike", ipaA: "spaɪk", noteEs: "b = error típico." },
      { a: "sprint", b: "esprint", ipaA: "sprɪnt", noteEs: "b = error típico." },
      { a: "stage", b: "estage", ipaA: "steɪdʒ", noteEs: "b = error típico." },
      { a: "standard", b: "estandard", ipaA: "ˈstændərd", noteEs: "b = error típico." },
      { a: "storage", b: "estorage", ipaA: "ˈstɔːrɪdʒ", noteEs: "b = error típico." },
    ],
    practiceSentence: "ssssss-cript, ssssss-tack",
  },
  {
    id: "th-sordo-sonoro",
    titleEs: "/θ/ y /ð/ — la lengua entre los dientes",
    phonemes: ["θ", "ð"],
    explanationEs:
      "Dos sonidos, misma posición: la punta de la lengua asoma ligeramente entre los dientes. /θ/ sordo (sin vibración de garganta): think, thread, throw, path, month, length, width, depth, both, math, truth, authentication. /ð/ sonoro (con vibración): this, that, these, those, the, then, than, they, there, other, whether, rather, algorithm. Test de comprobación: pon el dedo delante de la boca; en /θ/ notas aire saliendo de forma continua — si no notas aire, estás diciendo /t/ o /s/. En cada par: a = lo que NO debes decir, b = lo correcto.",
    pairs: [
      { a: "tread", b: "thread", ipaB: "θred", noteEs: "«tread» = pisar; no es «thread»." },
      { a: "tanks", b: "thanks", ipaB: "θæŋks" },
      { a: "pat", b: "path", ipaB: "pæθ" },
      { a: "dis", b: "this", ipaB: "ðɪs" },
      { a: "lent", b: "length", ipaB: "leŋθ" },
    ],
    practiceSentence: "I think this thread throws there.",
  },
  {
    id: "z-sonora",
    titleEs: "/z/ — existe y es sonoro",
    phonemes: ["s", "z"],
    explanationEs:
      "El español no tiene /z/: todas tus s son sordas. En inglés, /z/ es un fonema y aparece en plurales, tercera persona y muchísimo vocabulario técnico: design /dɪˈzaɪn/, resolve /rɪˈzɑːlv/, result /rɪˈzʌlt/, present, business /ˈbɪznəs/, easy, reason, visual, resource /ˈriːsɔːrs/ o /ˈriːzɔːrs/, has, is, was, does, zero, size /saɪz/, zone. Ojo: «size» tiene /s/ al principio y /z/ al final: /saɪz/ — practícalo lento.",
    pairs: [
      { a: "race", b: "raise", ipaA: "reɪs", ipaB: "reɪz" },
      { a: "loose", b: "lose", ipaA: "luːs", ipaB: "luːz" },
      { a: "price", b: "prize", ipaA: "praɪs", ipaB: "praɪz" },
      { a: "use (sust.)", b: "use (verbo)", ipaA: "juːs", ipaB: "juːz" },
      { a: "close (adj., cerca)", b: "close (verbo, cerrar)", ipaA: "kloʊs", ipaB: "kloʊz" },
    ],
    practiceSentence: "The design resolves easy business reasons: zero size zones.",
  },
  {
    id: "sh-vs-ch",
    titleEs: "/ʃ/ vs /tʃ/ — «ship» no es «chip»",
    phonemes: ["ʃ", "tʃ"],
    explanationEs:
      "/ʃ/: aire continuo, labios algo adelantados, como mandar callar: shhh → shell, ship, cache /kæʃ/, push, flush, machine, issue /ˈɪʃuː/, session, function /ˈfʌŋkʃən/. /tʃ/: hay un golpe de oclusión antes, el ch de «chico» → chip, check, branch, patch, match, launch, architecture /ˈɑːrkɪtektʃər/.",
    pairs: [
      { a: "ship", b: "chip", ipaA: "ʃɪp", ipaB: "tʃɪp", noteEs: "ship = enviar a producción." },
      { a: "share", b: "chair", ipaA: "ʃer", ipaB: "tʃer" },
      { a: "wash", b: "watch", ipaB: "wɑːtʃ" },
      { a: "cash / cache", b: "catch", ipaA: "kæʃ", ipaB: "kætʃ" },
    ],
    practiceSentence:
      "«We're shipping on Friday» (lanzamos el viernes) ≠ «We're chipping on Friday».",
  },
  {
    id: "j-vs-y",
    titleEs: "/dʒ/ vs /j/ — «Java» no es «Yava»",
    phonemes: ["dʒ", "j"],
    explanationEs:
      "/dʒ/: como la j inglesa de «John»; hay oclusión (d + ʒ) → Java /ˈdʒɑːvə/, job, JSON /ˈdʒeɪsən/, jump, manage, engine /ˈendʒɪn/, logic, general, digit, major, package /ˈpækɪdʒ/, storage, bridge, merge /mɝːdʒ/. /j/: es la y española de «hielo», suave → yes, yield, year, you, use /juːz/, UI /ˌjuːˈaɪ/, URL /ˌjuːɑːrˈel/, user /ˈjuːzər/, unit /ˈjuːnɪt/, uniform. Trampa: user, unit, UI, URL, unique, usable, universal empiezan por /j/, no por /u/ — se dice «a user» y «a URL», no «an user»: un error de gramática causado por un error de fonética. En cada par: a = ejemplo con /dʒ/, b = ejemplo con /j/.",
    pairs: [
      { a: "Java", b: "yes", ipaA: "ˈdʒɑːvə", noteEs: "«Java» no es «Yava»." },
      { a: "JSON", b: "yield", ipaA: "ˈdʒeɪsən" },
      { a: "engine", b: "user", ipaA: "ˈendʒɪn", ipaB: "ˈjuːzər" },
      { a: "package", b: "unit", ipaA: "ˈpækɪdʒ", ipaB: "ˈjuːnɪt" },
      { a: "merge", b: "UI", ipaA: "mɝːdʒ", ipaB: "ˌjuːˈaɪ" },
      { a: "major", b: "URL", ipaB: "ˌjuːɑːrˈel" },
      { a: "manage", b: "use (verbo)", ipaB: "juːz" },
    ],
    practiceSentence: "A user manages the Java engine, not an user.",
  },
  {
    id: "h-aspirada",
    titleEs: "/h/ — se pronuncia, y con fuerza",
    phonemes: ["h"],
    explanationEs:
      "La h española es muda; la inglesa es una exhalación audible: host /hoʊst/, hash /hæʃ/, header, hook, handle, hardware, heap, hide, high, hot, human, HTTP. Y al contrario: en «hour» /aʊr/, «honest» y «heir» la h es muda — son las excepciones; memorízalas como tal. En cada par: a = h audible, b = h muda (excepción).",
    pairs: [
      { a: "host", b: "hour", ipaA: "hoʊst", ipaB: "aʊr", noteEs: "En «hour» la h es muda." },
      { a: "hash", b: "honest", ipaA: "hæʃ", noteEs: "En «honest» la h es muda." },
      { a: "header", b: "heir", noteEs: "En «heir» la h es muda." },
    ],
    practiceSentence: "The host handles the hash header in an hour.",
  },
  {
    id: "ng-final",
    titleEs: "/ŋ/ — la ng final",
    phonemes: ["ŋ"],
    explanationEs:
      "En running, building, string, long, la parte final es un solo sonido nasal /ŋ/, no \"n + g\" separadas. La lengua toca el velo del paladar (atrás) y no se suelta con una /ɡ/. También: long /lɔːŋ/, wrong /rɔːŋ/, thing /θɪŋ/. En cada par: a = correcto, b = error típico.",
    pairs: [
      { a: "running", b: "ru-nin-gue", ipaA: "ˈrʌnɪŋ", noteEs: "b = error típico." },
      { a: "string", b: "es-trin-gue", ipaA: "strɪŋ", noteEs: "b = error típico (doble: e inicial + g final)." },
      { a: "long", b: "wrong", ipaA: "lɔːŋ", ipaB: "rɔːŋ", noteEs: "Ambas acaban en /ŋ/, sin /ɡ/ final." },
    ],
    practiceSentence: "The long string is still running.",
  },
  {
    id: "r-l",
    titleEs: "/r/ americana y la l oscura",
    phonemes: ["r", "l"],
    explanationEs:
      "/r/ americana: la lengua no toca nada; se curva hacia atrás (retroflexa) o se agrupa en el centro de la boca, y no vibra. Si tu r de «error» suena como la r española de «cara», es un tap /ɾ/ y suena a d para un oído inglés. L oscura (final o antes de consonante): la parte de atrás de la lengua sube; el sonido es más grave, casi una u — null /nʌl/, full, pull, call, well, file, while, tool, model, level, label, global, terminal, kernel. Un hispanohablante hace la l clara siempre; suena \"extranjero\" pero es inteligible: prioridad baja. En cada par: a = práctica de /r/, b = práctica de l oscura.",
    pairs: [
      { a: "error", b: "null", ipaA: "ˈerər", ipaB: "nʌl" },
      { a: "router", b: "full" },
      { a: "refactor", b: "pull", ipaA: "rɪˈfæktər" },
      { a: "parameter", b: "call", ipaA: "pəˈræmɪtər" },
      { a: "framework", b: "tool" },
      { a: "library", b: "model", ipaA: "ˈlaɪbreri" },
      { a: "array", b: "level", ipaA: "əˈreɪ" },
      { a: "worker", b: "kernel" },
    ],
    practiceSentence: "The worker refactors the error parameter in the null model.",
  },
];

// ---------------------------------------------------------------------------
// 1.4 Grupos consonánticos finales
// ---------------------------------------------------------------------------

export const FINAL_CLUSTERS: PronunciationRule = {
  id: "final-clusters",
  titleEs: "Grupos consonánticos finales",
  ruleEs:
    "El español casi no tiene sílabas terminadas en dos o más consonantes; el inglés técnico está lleno de ellas y tu boca querrá simplificarlas. Entrenamiento: dilo primero al revés en sílabas (ts-ks-et → texts), luego lento, luego a velocidad. No elimines consonantes; los nativos las reducen, pero tú debes poder producirlas antes de reducirlas.",
  examples: [
    { word: "tests", ipa: "tests", noteEs: "-s-t-s, tres consonantes seguidas." },
    { word: "texts", ipa: "teksts", noteEs: "-k-s-t-s, cuatro." },
    { word: "asked", ipa: "æskt", noteEs: "-s-k-t (no \"as-ked\")." },
    { word: "worked", ipa: "wɝːkt", noteEs: "Acaba en /kt/." },
    { word: "fixed", ipa: "fɪkst", noteEs: "Acaba en /kst/." },
    { word: "months", ipa: "mʌnθs", noteEs: "-n-θ-s." },
    { word: "lengths", ipa: "leŋθs", noteEs: "-ŋ-θ-s." },
    { word: "strengths", ipa: "streŋkθs", noteEs: "El más difícil del inglés." },
    { word: "helped", ipa: "helpt", noteEs: "-l-p-t." },
    { word: "clients", ipa: "ˈklaɪənts", noteEs: "-n-t-s." },
    { word: "twelfths", ipa: "twelfθs", noteEs: "Curiosidad, no lo necesitarás." },
  ],
};

// ---------------------------------------------------------------------------
// 1.5 La terminación -ed: tres pronunciaciones
// ---------------------------------------------------------------------------

export const ED_ENDINGS: PronunciationRule[] = [
  {
    id: "ed-id",
    titleEs: "-ed suena /ɪd/ (sílaba extra)",
    ruleEs:
      "Regla mecánica y sin excepciones; depende solo del último sonido (no letra) del verbo base. Si el verbo acaba en /t/ o /d/, -ed suena /ɪd/ y añade una sílaba extra. Si pronuncias /ˈdɪplɔɪɪd/ estás inventando una sílaba y el oyente pierde medio segundo procesándolo.",
    examples: [
      { word: "updated", ipa: "ˈʌpdeɪtɪd" },
      { word: "tested", ipa: "ˈtestɪd" },
      { word: "loaded", ipa: "ˈloʊdɪd" },
      { word: "needed" },
      { word: "started" },
      { word: "ended" },
    ],
  },
  {
    id: "ed-t",
    titleEs: "-ed suena /t/",
    ruleEs:
      "Si el verbo acaba en otro sonido sordo (/p, k, f, s, ʃ, tʃ, θ/), -ed suena /t/, sin sílaba extra. Si dices «I test it yesterday» comiéndote la /t/ final de «tested», tu interlocutor oye presente y no pasado: es el error de pronunciación con mayor coste gramatical.",
    examples: [
      { word: "pushed", ipa: "pʊʃt" },
      { word: "fixed", ipa: "fɪkst" },
      { word: "stopped", ipa: "stɑːpt" },
      { word: "worked", ipa: "wɝːkt" },
      { word: "checked", ipa: "tʃekt" },
      { word: "launched", ipa: "lɔːntʃt" },
    ],
  },
  {
    id: "ed-d",
    titleEs: "-ed suena /d/",
    ruleEs:
      "Si el verbo acaba en otro sonido sonoro (vocales y /b, ɡ, v, z, m, n, l, r, dʒ, ð/), -ed suena /d/, sin sílaba extra.",
    examples: [
      { word: "deployed", ipa: "dɪˈplɔɪd" },
      { word: "cloned", ipa: "kloʊnd" },
      { word: "merged", ipa: "mɝːdʒd" },
      { word: "resolved" },
      { word: "failed", ipa: "feɪld" },
      { word: "changed", ipa: "tʃeɪndʒd" },
      { word: "reviewed" },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1.6 La terminación -s: tres pronunciaciones
// ---------------------------------------------------------------------------

export const S_ENDINGS: PronunciationRule[] = [
  {
    id: "s-iz",
    titleEs: "-s suena /ɪz/ (sílaba extra)",
    ruleEs:
      "Idéntica lógica que -ed; afecta a plurales y a la tercera persona del singular. Si la palabra acaba en sibilante (/s, z, ʃ, ʒ, tʃ, dʒ/), -s suena /ɪz/ y añade una sílaba extra.",
    examples: [
      { word: "classes", ipa: "ˈklæsɪz" },
      { word: "branches" },
      { word: "patches" },
      { word: "caches" },
      { word: "packages" },
      { word: "pushes" },
      { word: "merges" },
      { word: "passes" },
    ],
  },
  {
    id: "s-s",
    titleEs: "-s suena /s/",
    ruleEs:
      "Si la palabra acaba en otro sonido sordo (/p, t, k, f, θ/), -s suena /s/.",
    examples: [
      { word: "scripts", ipa: "skrɪpts" },
      { word: "packets" },
      { word: "hits" },
      { word: "maps" },
    ],
  },
  {
    id: "s-z",
    titleEs: "-s suena /z/",
    ruleEs:
      "Si la palabra acaba en otro sonido sonoro (vocales, /b, d, ɡ, v, m, n, l, r, ð/), -s suena /z/. Nota: la mayoría de los plurales ingleses suenan /z/, no /s/; un hispanohablante los hace todos /s/. Cámbialo: «the bugs» = /ðə bʌɡz/.",
    examples: [
      { word: "bugs", ipa: "bʌɡz" },
      { word: "logs", ipa: "lɔːɡz" },
      { word: "files", ipa: "faɪlz" },
      { word: "values" },
      { word: "methods", ipa: "ˈmeθədz" },
      { word: "runs" },
      { word: "needs" },
      { word: "servers" },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1.7 Acento tonal (word stress)
// ---------------------------------------------------------------------------

export const WORD_STRESS_RULES: PronunciationRule[] = [
  {
    id: "stress-cognados",
    titleEs: "Cognados técnicos con acento distinto al español",
    ruleEs:
      "Cada palabra de más de una sílaba tiene UNA sílaba fuerte. Poner el acento en el sitio equivocado hace la palabra irreconocible, incluso más que un fonema mal pronunciado. Como muchos términos técnicos son cognados del español, tu instinto te llevará al acento español.",
    examples: [
      { word: "develop", ipa: "dɪˈveləp", noteEs: "Sílaba fuerte: ve. ES: desarrollar." },
      { word: "development", ipa: "dɪˈveləpmənt", noteEs: "Sílaba fuerte: ve. ES: desarroLLO." },
      { word: "developer", ipa: "dɪˈveləpər", noteEs: "Sílaba fuerte: ve. ES: desarrollaDOR." },
      { word: "parameter", ipa: "pəˈræmɪtər", noteEs: "Sílaba fuerte: ram. ES: paRÁmetro (coincide)." },
      { word: "architecture", ipa: "ˈɑːrkɪtektʃər", noteEs: "Sílaba fuerte: AR. ES: arquitecTUra." },
      { word: "algorithm", ipa: "ˈælɡərɪðəm", noteEs: "Sílaba fuerte: AL. ES: algoRITmo." },
      { word: "variable", ipa: "ˈveriəbəl", noteEs: "Sílaba fuerte: VA. ES: vaRIAble." },
      { word: "integer", ipa: "ˈɪntɪdʒər", noteEs: "Sílaba fuerte: IN. ES: enTEro." },
      { word: "interface", ipa: "ˈɪntərfeɪs", noteEs: "Sílaba fuerte: IN. ES: interFAZ." },
      { word: "database", ipa: "ˈdeɪtəbeɪs", noteEs: "Sílaba fuerte: DA. ES: base de DAtos." },
      { word: "category", ipa: "ˈkætəɡɔːri", noteEs: "Sílaba fuerte: CAT. ES: categoRÍa." },
      { word: "industry", ipa: "ˈɪndəstri", noteEs: "Sílaba fuerte: IN. ES: indusTRIA." },
      { word: "company", ipa: "ˈkʌmpəni", noteEs: "Sílaba fuerte: COM. ES: compaÑÍa." },
      { word: "percentage", ipa: "pərˈsentɪdʒ", noteEs: "Sílaba fuerte: cent. ES: porcenTAje." },
      { word: "available", ipa: "əˈveɪləbəl", noteEs: "Sílaba fuerte: vail. ES: dispoNIble." },
      { word: "comparable", ipa: "ˈkɑːmpərəbəl", noteEs: "Sílaba fuerte: COM. ES: compaRAble." },
      { word: "necessary", ipa: "ˈnesəseri", noteEs: "Sílaba fuerte: NE. ES: neceSArio." },
      { word: "device", ipa: "dɪˈvaɪs", noteEs: "Sílaba fuerte: vice. ES: dispositivo." },
      { word: "hierarchy", ipa: "ˈhaɪərɑːrki", noteEs: "Sílaba fuerte: HI. ES: jerarQUÍa." },
      { word: "capable", ipa: "ˈkeɪpəbəl", noteEs: "Sílaba fuerte: CAP. ES: caPAZ." },
    ],
  },
  {
    id: "stress-enganosas",
    titleEs: "Palabras técnicas que se pronuncian distinto de lo que parece",
    ruleEs:
      "Términos frecuentes cuya pronunciación real no se deduce de la escritura. Memoriza el IPA y la sílaba fuerte de cada uno.",
    examples: [
      { word: "cache", ipa: "kæʃ", noteEs: "Igual que «cash». Nunca \"ca-ché\"." },
      { word: "queue", ipa: "kjuː", noteEs: "Una sola sílaba: \"kiu\"." },
      { word: "suite", ipa: "swiːt", noteEs: "Igual que «sweet»." },
      { word: "schema", ipa: "ˈskiːmə", noteEs: "\"SKI-ma\"." },
      { word: "schedule", ipa: "ˈskedʒuːl", noteEs: "US /ˈskedʒuːl/ · UK /ˈʃedjuːl/." },
      { word: "tuple", ipa: "ˈtuːpəl", noteEs: "También /ˈtʌpəl/; ambas se oyen." },
      { word: "null", ipa: "nʌl", noteEs: "\"nal\", no \"nul\"." },
      { word: "char", ipa: "kɑːr", noteEs: "También /tʃɑːr/; ambas circulan." },
      { word: "regex", ipa: "ˈredʒeks", noteEs: "\"RE-yex\"." },
      { word: "async", ipa: "ˈeɪsɪŋk", noteEs: "\"EI-sink\"." },
      { word: "height", ipa: "haɪt", noteEs: "Rima con «light». No \"heigth\"." },
      { word: "width", ipa: "wɪdθ" },
      { word: "length", ipa: "leŋθ", noteEs: "No \"lenght\"." },
      { word: "route", ipa: "ruːt", noteEs: "US admite también /raʊt/; «router» suele /ˈraʊtər/." },
      { word: "daemon", ipa: "ˈdiːmən", noteEs: "\"DI-mon\"." },
      { word: "sudo", ipa: "ˈsuːduː", noteEs: "\"SU-du\"." },
      { word: "Linux", ipa: "ˈlɪnəks", noteEs: "\"LI-nax\"." },
      { word: "Apache", ipa: "əˈpætʃi", noteEs: "\"a-PA-chi\"." },
      { word: "Kubernetes", ipa: "ˌkuːbərˈnetiːz", noteEs: "\"ku-ber-NE-tis\"." },
      { word: "nginx", ipa: "ˈendʒɪn eks", noteEs: "Se lee \"engine-x\"." },
      { word: "SQL", ipa: "ˈsiːkwəl", noteEs: "\"sequel\" o /ˌesˌkjuːˈel/ \"es-kiu-EL\"." },
      { word: "GUI", ipa: "ˈɡuːi", noteEs: "\"GU-i\"." },
      { word: "façade", ipa: "fəˈsɑːd", noteEs: "\"fa-SAD\"." },
      { word: "idempotent", ipa: "aɪˈdempətənt", noteEs: "\"ai-DEM-po-tent\"." },
      { word: "latency", ipa: "ˈleɪtənsi", noteEs: "\"LEI-ten-si\"." },
      { word: "iterate", ipa: "ˈɪtəreɪt", noteEs: "\"I-te-reit\"." },
      { word: "issue", ipa: "ˈɪʃuː", noteEs: "\"I-shu\"." },
      { word: "debt", ipa: "det", noteEs: "La b es muda: technical debt." },
      { word: "image", ipa: "ˈɪmɪdʒ", noteEs: "\"I-mich\", no \"i-MEICH\"." },
      { word: "library", ipa: "ˈlaɪbreri", noteEs: "\"LAI-bre-ri\"." },
      { word: "mobile", ipa: "ˈmoʊbəl", noteEs: "US /ˈmoʊbəl/ · UK /ˈmoʊbaɪl/." },
      { word: "allow / a lot", ipa: "əˈlaʊ", noteEs: "Ojo: no \"alou\" con acento inicial." },
    ],
  },
  {
    id: "stress-sustantivo-verbo",
    titleEs: "Regla 1 — Sustantivo vs verbo (dos sílabas)",
    ruleEs:
      "El sustantivo acentúa la primera sílaba; el verbo, la segunda.",
    examples: [
      { word: "record", ipa: "ˈrekərd", noteEs: "a REcord (sust.) vs to reCORD /rɪˈkɔːrd/ (verbo)." },
      { word: "increase", noteEs: "an INcrease vs to inCREASE." },
      { word: "object", noteEs: "an OBject vs to obJECT." },
      { word: "process", noteEs: "a PROcess vs to proCESS." },
      { word: "attribute", ipa: "ˈætrɪbjuːt", noteEs: "an ATtribute vs to atTRIBute /əˈtrɪbjuːt/." },
    ],
  },
  {
    id: "stress-terminaciones-atraen",
    titleEs: "Regla 2 — Terminaciones que atraen el acento a la sílaba anterior",
    ruleEs:
      "-tion, -sion, -ic, -ity, -ical, -ial atraen el acento. Más precisamente: -tion/-sion → acento en la sílaba inmediatamente anterior; -ity → acento dos sílabas antes del final.",
    examples: [
      { word: "implementation", noteEs: "implemen-TA-tion." },
      { word: "version", noteEs: "VER-sion — cuidado." },
      { word: "statistic", noteEs: "sta-TIS-tic." },
      { word: "security", noteEs: "secur-I-ty." },
      { word: "technical", noteEs: "tech-NI-cal." },
      { word: "initial", noteEs: "ini-TIAL." },
      { word: "migration", noteEs: "mi-GRA-tion." },
      { word: "configuration", noteEs: "configu-RA-tion." },
      { word: "authentication", noteEs: "authenti-CA-tion." },
      { word: "scalability", noteEs: "sca-la-BI-li-ty." },
      { word: "availability", noteEs: "availa-BI-lity." },
      { word: "observability", noteEs: "ob-ser-VA-bi-li-ty." },
    ],
  },
  {
    id: "stress-terminaciones-neutras",
    titleEs: "Regla 3 — Terminaciones neutras (no mueven el acento)",
    ruleEs: "-ing, -ed, -er, -ly, -ness, -ment, -able no mueven el acento.",
    examples: [
      { word: "develop", noteEs: "de-VEL-op." },
      { word: "developing", noteEs: "de-VEL-oping." },
      { word: "development", noteEs: "de-VEL-opment." },
    ],
  },
  {
    id: "stress-compuestas",
    titleEs: "Regla 4 — Palabras compuestas: acento en la primera parte",
    ruleEs: "En palabras compuestas, el acento va en la PRIMERA parte.",
    examples: [
      { word: "database", noteEs: "DA-tabase." },
      { word: "keyboard", noteEs: "KEY-board." },
      { word: "software", noteEs: "SOFT-ware." },
      { word: "firewall", noteEs: "FIRE-wall." },
      { word: "backend", noteEs: "BACK-end." },
      { word: "load balancer", noteEs: "LOAD balancer." },
      { word: "pull request", noteEs: "PULL request." },
      { word: "code review", noteEs: "CODE review." },
      { word: "unit test", noteEs: "UNIT test." },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1.8 La vocal neutra /ə/ y la reducción (formas débiles)
// ---------------------------------------------------------------------------

export const SCHWA_WEAK_FORMS: PronunciationRule = {
  id: "schwa-weak-forms",
  titleEs: "La vocal neutra /ə/ y las formas débiles",
  ruleEs:
    "El inglés no es silábicamente isócrono; es acentualmente isócrono. En español cada sílaba dura aproximadamente lo mismo; en inglés solo las sílabas acentuadas son largas y claras y el resto se aplasta hacia /ə/: «computer» no es \"com-pu-ter\", es /kəmˈpjuːtər/ — una sílaba fuerte y dos aplastadas (igual: development → d'-VE-l'p-m'nt, configuration → k'n-fi-gy'-REI-sh'n, separate (adj) → SE-p'r't, comfortable → KUMF-t'r-b'l, interesting → IN-tr'st-ing, vegetable, temperature). En habla conectada, las palabras funcionales casi nunca se pronuncian en su forma fuerte. Consecuencia para tu comprensión: cuando oyes /ˈaɪkədəvˈtestɪdɪt/ y no entiendes nada, lo que se dijo es «I could have tested it». No es velocidad: es reducción. Entrenar tu oído en formas débiles hace más por tu listening que cien horas de podcast.",
  examples: [
    { word: "and", ipa: "ən", noteEs: "Forma fuerte /ænd/; débil /ən/ o /n/ → «bread'n butter»." },
    { word: "can", ipa: "kən", noteEs: "Forma fuerte /kæn/." },
    { word: "to", ipa: "tə", noteEs: "Forma fuerte /tuː/ → «I need t' check»." },
    { word: "for", ipa: "fər", noteEs: "Forma fuerte /fɔːr/." },
    { word: "of", ipa: "əv", noteEs: "Forma fuerte /ʌv/; también /ə/ → «a lot'a»." },
    { word: "the", ipa: "ðə", noteEs: "/ðə/ ante consonante, /ðiː/ ante vocal." },
    { word: "you", ipa: "jə", noteEs: "Forma fuerte /juː/ → «d'ya know»." },
    { word: "are", ipa: "ər", noteEs: "Forma fuerte /ɑːr/ → «they're»." },
    { word: "have", ipa: "əv", noteEs: "Forma fuerte /hæv/ → «I could've»." },
    { word: "at / that / than", ipa: "ət, ðət, ðən", noteEs: "Formas débiles habituales." },
  ],
};

// ---------------------------------------------------------------------------
// 1.9 Habla conectada: los cuatro procesos
// ---------------------------------------------------------------------------

export const CONNECTED_SPEECH: PronunciationRule[] = [
  {
    id: "cs-linking",
    titleEs: "Linking (enlace consonante–vocal)",
    ruleEs: "La consonante final se une a la vocal siguiente.",
    examples: [
      { word: "check it out", ipa: "ˈtʃekɪˈtaʊt", noteEs: "\"che-ki-taut\"." },
      { word: "pick up an issue", noteEs: "\"pi-ka-pa-nishu\"." },
      { word: "set up a call", noteEs: "\"se-ta-pa-col\"." },
    ],
  },
  {
    id: "cs-flapping",
    titleEs: "Flapping (la /t/ americana entre vocales)",
    ruleEs:
      "En inglés general americano, la /t/ entre dos vocales (con la primera acentuada) suena como una /d/ suave, casi la r española de «para».",
    examples: [
      { word: "data", noteEs: "\"DEI-ra\"." },
      { word: "updating", noteEs: "\"AP-dei-ring\"." },
      { word: "better", noteEs: "\"BE-rer\"." },
      { word: "getting", noteEs: "\"GE-ring\"." },
      { word: "later", noteEs: "\"LEI-rer\"." },
      { word: "shutting down", noteEs: "\"SHA-ring daun\"." },
      { word: "get it", noteEs: "\"GE-rit\"." },
      { word: "a lot of", noteEs: "\"a LO-rov\"." },
    ],
  },
  {
    id: "cs-elision",
    titleEs: "Elisión",
    ruleEs: "Sonidos que desaparecen en habla rápida.",
    examples: [
      { word: "next week", noteEs: "\"neks week\"." },
      { word: "most common", noteEs: "\"mos common\"." },
      { word: "should be", noteEs: "\"shud bi\"." },
      { word: "want to", noteEs: "\"wanna\"." },
      { word: "going to", noteEs: "\"gonna\"." },
      { word: "let me", noteEs: "\"lemme\"." },
      { word: "give me", noteEs: "\"gimme\"." },
    ],
  },
  {
    id: "cs-asimilacion",
    titleEs: "Asimilación",
    ruleEs: "Un sonido cambia por influencia del vecino.",
    examples: [
      { word: "did you", ipa: "ˈdɪdʒə", noteEs: "\"DI-ya\"." },
      { word: "would you", ipa: "ˈwʊdʒə" },
      { word: "don't you", ipa: "ˈdoʊntʃə" },
      { word: "what do you think", ipa: "ˌwʌdəjəˈθɪŋk", noteEs: "\"wa-de-ye-THINK\"." },
    ],
  },
  {
    id: "cs-frase-integral",
    titleEs: "Frase de entrenamiento integral",
    ruleEs:
      "Dila 10 veces, cada vez más rápido; combina los cuatro procesos del habla conectada.",
    examples: [
      {
        word: "Did you get a chance to look at the pull request I put up a couple of hours ago?",
        ipa: "ˈdɪdʒə ˌɡedə ˈtʃæns tə ˈlʊkət ðə ˈpʊl rɪkwest aɪ ˈpʊdəpə ˈkʌpləv ˈaʊərz əˈɡoʊ",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1.10 Entonación
// ---------------------------------------------------------------------------

export const INTONATION_PATTERNS: PronunciationRule[] = [
  {
    id: "int-descendente",
    titleEs: "Patrón descendente ↘",
    ruleEs:
      "Se usa en afirmaciones, preguntas con wh-, órdenes y certeza. El español usa un rango tonal más estrecho que el inglés: con la melodía española, el nativo percibe monotonía (desinterés) o descenso final tajante (hostilidad).",
    examples: [
      { word: "What's the status? ↘" },
      { word: "It's broken. ↘" },
    ],
  },
  {
    id: "int-ascendente",
    titleEs: "Patrón ascendente ↗",
    ruleEs: "Se usa en preguntas de sí/no, cortesía, duda y listas sin terminar.",
    examples: [
      { word: "Did you deploy it? ↗" },
      { word: "Could you take a look? ↗" },
    ],
  },
  {
    id: "int-discrepancia-cortes",
    titleEs: "Ascenso-descenso: discrepar sin ofender",
    ruleEs:
      "«That won't work.» ↘ plano y descendente suena a \"eres tonto\"; «Hmm, I'm ↗not ↘sure that would work...» suena a \"pensémoslo\". Estructura entonativa de la discrepancia cortés en 4 pasos (cada ejemplo es un paso).",
    examples: [
      { word: "Well... / Actually... / Hmm...", noteEs: "Paso 1: empieza alto con una partícula." },
      { word: "I'm not SUre ↗", noteEs: "Paso 2: sube en el elemento de duda." },
      { word: "(final suave)", noteEs: "Paso 3: baja suavemente al final, sin cerrar de golpe." },
      { word: "...does that make sense? ↗", noteEs: "Paso 4: termina con una apertura ascendente." },
    ],
  },
  {
    id: "int-sentence-stress",
    titleEs: "Sentence stress: la palabra fuerte cambia el significado",
    ruleEs:
      "En cada frase hay una palabra que lleva el pico tonal; cambiarla cambia el mensaje. Frase base: «I didn't say the deploy broke it.» Ejercicio: grábala seis veces, una por cada énfasis; si las seis suenan igual, tu entonación es plana y tu inglés sonará mecánico incluso con gramática perfecta.",
    examples: [
      { word: "I didn't say the deploy broke it.", noteEs: "Énfasis en «I»: lo dijo otro, no yo." },
      { word: "I DIDN'T say the deploy broke it.", noteEs: "Énfasis en «didn't»: lo niego rotundamente." },
      { word: "I didn't SAY the deploy broke it.", noteEs: "Énfasis en «say»: lo insinué, no lo dije." },
      { word: "I didn't say THE DEPLOY broke it.", noteEs: "Énfasis en «the deploy»: fue otra cosa la que lo rompió." },
      { word: "I didn't say the deploy BROKE it.", noteEs: "Énfasis en «broke»: no se rompió, hizo otra cosa." },
      { word: "I didn't say the deploy broke IT.", noteEs: "Énfasis en «it»: rompió otra cosa." },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1.11 Protocolo de shadowing (10 min/día, mismo fragmento toda la semana)
// ---------------------------------------------------------------------------

export const SHADOWING_PROTOCOL: ShadowingPhase[] = [
  {
    order: 1,
    nameEs: "Escucha ciega",
    actionEs: "Solo escuchar, sin texto, 2 veces. Anota qué no entiendes.",
    minutes: 1,
  },
  {
    order: 2,
    nameEs: "Lectura simultánea",
    actionEs: "Lees la transcripción en silencio mientras escuchas.",
    minutes: 1,
  },
  {
    order: 3,
    nameEs: "Marcado",
    actionEs: "En el texto, marca las sílabas fuertes con ● y las pausas con /.",
    minutes: 2,
  },
  {
    order: 4,
    nameEs: "Shadowing con texto",
    actionEs: "Hablas a la vez que el audio, leyendo. 4 pasadas.",
    minutes: 3,
  },
  {
    order: 5,
    nameEs: "Shadowing sin texto",
    actionEs: "Igual pero de memoria/oído. 3 pasadas.",
    minutes: 2,
  },
  {
    order: 6,
    nameEs: "Grabación y contraste",
    actionEs: "Te grabas solo y comparas con el original.",
    minutes: 1,
  },
];

// ---------------------------------------------------------------------------
// 1.12 Reto de la Parte 1
// ---------------------------------------------------------------------------

export const PART1_CHALLENGES: PhoneticChallenge[] = [
  {
    id: "A",
    instructionsEs:
      "Graba este texto. Antes, marca: todas las /iː/ vs /ɪ/, la sílaba fuerte de cada palabra polisílaba, y los tres puntos donde harás linking. Texto: «Before we ship this release, I'd like to check a couple of things. The cache invalidation still fails intermittently under load, and I haven't been able to reproduce it locally. If it's a race condition, we should be seeing it in the staging logs, so I'll add a bit more instrumentation and run the batch again.»",
  },
  {
    id: "B",
    instructionsEs:
      "Dicta ese mismo texto al reconocimiento de voz de tu teléfono en inglés. Cada palabra que la máquina transcriba mal es un objetivo concreto de práctica deliberada para esta semana. Anótalas en una tarjeta.",
  },
  {
    id: "C",
    instructionsEs:
      "Lista tus 20 términos técnicos más frecuentes en el trabajo. Busca cada uno en un diccionario con audio, anota su IPA y su sílaba fuerte, y comprueba cuántos pronunciabas mal. La media entre desarrolladores hispanohablantes es 12 de 20.",
  },
];
