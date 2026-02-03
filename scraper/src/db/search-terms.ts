/**
 * Search terms expansion for automotive parts.
 * Expands abbreviations, adds synonyms, and common misspellings
 * to improve full-text search results.
 */

// Automotive abbreviation mappings (abbreviation -> expanded forms)
const ABBREVIATIONS: Record<string, string[]> = {
  // Position abbreviations
  FR: ["front", "forward"],
  RR: ["rear", "back"],
  LH: ["left", "left-hand", "lefthand", "driver"],
  RH: ["right", "right-hand", "righthand", "passenger"],
  CTR: ["center", "centre", "middle"],
  UPR: ["upper", "top"],
  LWR: ["lower", "bottom"],
  INR: ["inner", "inside", "interior"],
  INTR: ["interior", "inner", "inside"],
  OUTR: ["outer", "outside", "exterior"],
  FWD: ["forward", "front"],

  // Component abbreviations
  ENG: ["engine", "motor"],
  SUSP: ["suspension"],
  TRANS: ["transmission", "tranny", "gearbox"],
  "A/T": ["automatic", "auto", "automatic transmission"],
  "M/T": ["manual", "manual transmission", "stick"],
  "T/F": ["transfer", "transfer case"],
  BRKT: ["bracket", "mount"],
  MTG: ["mounting", "mount"],
  ASSY: ["assembly", "assy"],
  KIT: ["kit", "set"],

  // Electrical abbreviations
  BATT: ["battery"],
  ALT: ["alternator"],
  GEN: ["generator"],
  IGN: ["ignition"],
  DIST: ["distributor"],
  STRT: ["starter"],

  // Body/exterior abbreviations
  BUMPR: ["bumper"],
  FDR: ["fender", "wing", "quarter panel"],
  HDR: ["header"],
  WHL: ["wheel"],
  TIR: ["tire", "tyre"],
  GRLL: ["grille", "grill"],
  HOOD: ["hood", "bonnet"],
  TRUK: ["trunk", "boot"],

  // Interior abbreviations
  DASH: ["dashboard", "dash"],
  INST: ["instrument"],
  STRG: ["steering"],
  SEAT: ["seat"],

  // Misc abbreviations
  VENT: ["ventilator", "vent", "ventilation"],
  CLAMP: ["clamp", "clip"],
  PCV: ["pcv", "positive crankcase ventilation"],
  EGR: ["egr", "exhaust gas recirculation"],
  VAC: ["vacuum"],
  HOSE: ["hose", "tube", "line"],
  PIPE: ["pipe", "tube"],
  GSKT: ["gasket"],
  BRG: ["bearing"],
  SHF: ["shaft"],
  ARM: ["arm"],
  ROD: ["rod"],
  PIN: ["pin"],
  NUT: ["nut"],
  WSH: ["washer"],
  SCR: ["screw"],
  SPR: ["spring"],
  ABSORB: ["absorber", "shock"],
  DAMPR: ["damper"],
  STRUT: ["strut", "shock"],
  TORSN: ["torsion"],
  STABZR: ["stabilizer", "sway bar", "antiroll"],
  ANCHR: ["anchor"],
  CVR: ["cover"],
  CAP: ["cap"],
  PLG: ["plug"],
  SLV: ["sleeve"],
  BSHG: ["bushing"],
  INSUL: ["insulator", "insulation"],
  CUSH: ["cushion", "pad"],
  PROT: ["protector", "guard", "shield"],
  GRD: ["guard", "shield", "protector"],
  SHLD: ["shield", "guard", "protector"],
  SEAL: ["seal", "gasket"],
  "O-RING": ["o-ring", "oring", "o ring"],
  CLIP: ["clip", "clamp", "fastener"],
  RTANR: ["retainer"],
  RETR: ["retainer"],
  BKLT: ["backlight", "rear window"],
  WSHLD: ["windshield", "windscreen"],
  WNDW: ["window"],
  DR: ["door"],
  TLGATE: ["tailgate", "hatch", "liftgate"],
  HNGE: ["hinge"],
  LATCH: ["latch", "catch"],
  LCK: ["lock"],
  HANDL: ["handle"],
  KNOB: ["knob"],
  SWTCH: ["switch"],
  SNSR: ["sensor"],
  VLVE: ["valve"],
  ACTR: ["actuator"],
  MOTR: ["motor"],
  PUMP: ["pump"],
  COMPR: ["compressor"],
  COND: ["condenser", "condensator"],
  EVAP: ["evaporator"],
  RAD: ["radiator"],
  HEATR: ["heater"],
  BLWR: ["blower", "fan"],
  FAN: ["fan", "blower"],
  COOL: ["coolant", "cooling"],
  THRML: ["thermal"],
  THRMO: ["thermostat", "thermo"],
  TEMP: ["temperature"],
  PRSR: ["pressure"],
  OIL: ["oil"],
  FUEL: ["fuel", "gas", "petrol"],
  AIR: ["air"],
  INTK: ["intake", "inlet"],
  EXHST: ["exhaust"],
  CAT: ["catalytic", "catalyst"],
  MFLR: ["muffler", "silencer"],
  RSNTR: ["resonator"],
  MANFLD: ["manifold"],
  CARB: ["carburetor", "carburettor", "carb"],
  INJCTR: ["injector"],
  THRTL: ["throttle"],
  ACCL: ["accelerator", "gas pedal"],
  BRK: ["brake"],
  CALPR: ["caliper", "calliper"],
  DISC: ["disc", "disk", "rotor"],
  DRUM: ["drum"],
  PAD: ["pad"],
  SHOE: ["shoe"],
  CYLN: ["cylinder"],
  MASTR: ["master"],
  HYDR: ["hydraulic", "hydro"],
  EMRG: ["emergency", "parking"],
  PKG: ["parking"],
  CLU: ["clutch"],
  FLYWHEEL: ["flywheel"],
  CRKSHFT: ["crankshaft", "crank"],
  CAMSHFT: ["camshaft", "cam"],
  ROCKER: ["rocker"],
  VLVE: ["valve"],
  PSTN: ["piston"],
  RING: ["ring"],
  CONROD: ["connecting rod", "con rod"],
  HDGSK: ["head gasket"],
  TIMING: ["timing"],
  BELT: ["belt"],
  CHAIN: ["chain"],
  TENSN: ["tensioner", "tension"],
  IDLER: ["idler"],
  PULLEY: ["pulley"],
  WIPER: ["wiper"],
  LAMP: ["lamp", "light"],
  HDLMP: ["headlamp", "headlight"],
  TLMP: ["tail lamp", "tail light", "taillight"],
  TURN: ["turn", "indicator", "blinker"],
  SIG: ["signal"],
  FOGLT: ["fog light", "foglight"],
  BKUP: ["backup", "reverse"],
  HORN: ["horn"],
  MIRR: ["mirror"],
  ANTN: ["antenna", "aerial"],
  SPKR: ["speaker"],
  RADIO: ["radio", "stereo"],
  CLCK: ["clock"],
  GAUGE: ["gauge", "meter"],
  SPEEDO: ["speedometer"],
  TACH: ["tachometer"],
  ODOMETR: ["odometer"],
  FUSE: ["fuse"],
  RELAY: ["relay"],
  WIRE: ["wire", "wiring", "harness"],
  HRNSS: ["harness", "wiring"],
  CNCTR: ["connector"],
  TERMNL: ["terminal"],
  GRND: ["ground", "earth"],
  BATTRY: ["battery"],
  PWR: ["power"],
  ACC: ["accessory"],
};

// Synonym groups - words that mean similar things
const SYNONYMS: Record<string, string[]> = {
  gasket: ["seal", "sealing", "o-ring"],
  seal: ["gasket", "sealing", "o-ring"],
  bolt: ["screw", "fastener"],
  screw: ["bolt", "fastener"],
  nut: ["fastener"],
  washer: ["spacer"],
  hose: ["tube", "pipe", "line"],
  pipe: ["tube", "hose", "line"],
  tube: ["hose", "pipe", "line"],
  bracket: ["mount", "mounting", "support", "brace"],
  mount: ["bracket", "mounting", "support"],
  mounting: ["bracket", "mount", "support"],
  cover: ["cap", "lid", "shield"],
  cap: ["cover", "lid"],
  guard: ["shield", "protector", "cover"],
  shield: ["guard", "protector", "cover"],
  protector: ["guard", "shield", "cover"],
  clip: ["clamp", "fastener", "retainer"],
  clamp: ["clip", "fastener"],
  retainer: ["clip", "keeper", "holder"],
  bushing: ["bush", "bearing", "sleeve"],
  bearing: ["bushing", "bush"],
  cushion: ["pad", "rubber", "mount"],
  pad: ["cushion", "rubber"],
  insulator: ["insulation", "mount", "cushion"],
  spring: ["coil"],
  shock: ["absorber", "damper", "strut"],
  damper: ["shock", "absorber"],
  strut: ["shock", "absorber", "damper"],
  engine: ["motor"],
  motor: ["engine"],
  transmission: ["gearbox", "trans"],
  gearbox: ["transmission"],
  alternator: ["generator"],
  generator: ["alternator"],
  hood: ["bonnet"],
  bonnet: ["hood"],
  trunk: ["boot"],
  boot: ["trunk"],
  fender: ["wing", "quarter panel"],
  wing: ["fender"],
  windshield: ["windscreen"],
  windscreen: ["windshield"],
  tire: ["tyre", "wheel"],
  tyre: ["tire", "wheel"],
  grille: ["grill"],
  grill: ["grille"],
  lamp: ["light", "bulb"],
  light: ["lamp", "bulb"],
  headlight: ["headlamp"],
  headlamp: ["headlight"],
  taillight: ["tail light", "tail lamp"],
  indicator: ["turn signal", "blinker", "flasher"],
  blinker: ["turn signal", "indicator"],
  mirror: ["looking glass"],
  antenna: ["aerial"],
  aerial: ["antenna"],
  muffler: ["silencer", "exhaust"],
  silencer: ["muffler"],
  carburetor: ["carburettor", "carb"],
  carburettor: ["carburetor", "carb"],
  caliper: ["calliper", "brake caliper"],
  calliper: ["caliper"],
  disc: ["disk", "rotor"],
  disk: ["disc", "rotor"],
  rotor: ["disc", "disk"],
  cylinder: ["bore"],
  piston: ["bore"],
  crankshaft: ["crank"],
  camshaft: ["cam"],
  intake: ["inlet", "induction"],
  inlet: ["intake"],
  exhaust: ["emission", "outlet"],
  radiator: ["rad", "cooler"],
  thermostat: ["thermo", "stat"],
  fuel: ["gas", "petrol", "gasoline"],
  petrol: ["gas", "fuel", "gasoline"],
  gas: ["fuel", "petrol", "gasoline"],
  oil: ["lubricant", "lube"],
  coolant: ["antifreeze", "cooling"],
  brake: ["braking", "stop"],
  clutch: ["coupling"],
  steering: ["steer"],
  suspension: ["susp"],
  wiper: ["windshield wiper", "windscreen wiper"],
  sensor: ["detector", "sender"],
  switch: ["button"],
  relay: ["solenoid"],
  fuse: ["fusible"],
  harness: ["wiring", "loom"],
  wiring: ["harness", "loom", "wire"],
  connector: ["plug", "socket", "terminal"],
  assembly: ["assy", "unit", "complete"],
  kit: ["set", "package"],
  repair: ["fix", "service"],
  replace: ["replacement", "substitute"],
  original: ["oem", "genuine"],
  aftermarket: ["replacement", "generic"],
};

// Common misspellings mapping (misspelling -> correct)
const MISSPELLINGS: Record<string, string[]> = {
  // Common automotive misspellings
  alternater: ["alternator"],
  alternetor: ["alternator"],
  alternatr: ["alternator"],
  carburator: ["carburetor"],
  carbureator: ["carburetor"],
  carburettor: ["carburetor"],
  catilitic: ["catalytic"],
  catalitic: ["catalytic"],
  catylitic: ["catalytic"],
  exaust: ["exhaust"],
  exhuast: ["exhaust"],
  exhust: ["exhaust"],
  guage: ["gauge"],
  gage: ["gauge"],
  gaskit: ["gasket"],
  gascket: ["gasket"],
  headlite: ["headlight"],
  headlamp: ["headlight"],
  maniflod: ["manifold"],
  manafold: ["manifold"],
  manfold: ["manifold"],
  mufler: ["muffler"],
  muffeler: ["muffler"],
  radiater: ["radiator"],
  radaitor: ["radiator"],
  radietor: ["radiator"],
  sheilding: ["shielding"],
  sheild: ["shield"],
  shiield: ["shield"],
  stering: ["steering"],
  steiring: ["steering"],
  suspenion: ["suspension"],
  suspention: ["suspension"],
  suspenshun: ["suspension"],
  transmision: ["transmission"],
  transmisison: ["transmission"],
  transmisson: ["transmission"],
  thermastat: ["thermostat"],
  thermostate: ["thermostat"],
  thermistat: ["thermostat"],
  vaccum: ["vacuum"],
  vacume: ["vacuum"],
  vacuume: ["vacuum"],
  vehical: ["vehicle"],
  vehicel: ["vehicle"],
  wimdshield: ["windshield"],
  windshiled: ["windshield"],
  windsheld: ["windshield"],
  accelorator: ["accelerator"],
  accelerater: ["accelerator"],
  acclerator: ["accelerator"],
  breakpad: ["brake pad"],
  brakpad: ["brake pad"],
  calliper: ["caliper"],
  calaper: ["caliper"],
  cilindir: ["cylinder"],
  cylindar: ["cylinder"],
  cylindir: ["cylinder"],
  conecter: ["connector"],
  connecter: ["connector"],
  conector: ["connector"],
  distributer: ["distributor"],
  distributor: ["distributor"],
  distribtor: ["distributor"],
  filtar: ["filter"],
  filtir: ["filter"],
  filtyr: ["filter"],
  flywheal: ["flywheel"],
  flyweel: ["flywheel"],
  flywheeel: ["flywheel"],
  generetor: ["generator"],
  generater: ["generator"],
  genertor: ["generator"],
  indicater: ["indicator"],
  indicatar: ["indicator"],
  indictor: ["indicator"],
  injector: ["injector"],
  injecter: ["injector"],
  injectir: ["injector"],
  insulater: ["insulator"],
  insulatar: ["insulator"],
  insultor: ["insulator"],
  pumpe: ["pump"],
  pumpp: ["pump"],
  puump: ["pump"],
  sensir: ["sensor"],
  sensar: ["sensor"],
  senser: ["sensor"],
  tensionor: ["tensioner"],
  tensiner: ["tensioner"],
  tensionar: ["tensioner"],
  valv: ["valve"],
  valvie: ["valve"],
  valwe: ["valve"],
  wheele: ["wheel"],
  weel: ["wheel"],
  wheal: ["wheel"],
  bering: ["bearing"],
  berring: ["bearing"],
  bearng: ["bearing"],
  brakket: ["bracket"],
  brackit: ["bracket"],
  braket: ["bracket"],
  bushng: ["bushing"],
  bushin: ["bushing"],
  bushig: ["bushing"],
  cusion: ["cushion"],
  cushon: ["cushion"],
  cushun: ["cushion"],
  dampar: ["damper"],
  dampir: ["damper"],
  dampor: ["damper"],
  fendor: ["fender"],
  fendur: ["fender"],
  fendar: ["fender"],
  grile: ["grille"],
  gril: ["grille"],
  grilel: ["grille"],
  haness: ["harness"],
  harnes: ["harness"],
  harniss: ["harness"],
  houzing: ["housing"],
  housng: ["housing"],
  houseing: ["housing"],
  mirrer: ["mirror"],
  miror: ["mirror"],
  mirrar: ["mirror"],
  mountng: ["mounting"],
  moutning: ["mounting"],
  mountin: ["mounting"],
  pistun: ["piston"],
  pisten: ["piston"],
  pistan: ["piston"],
  pullye: ["pulley"],
  pullie: ["pulley"],
  puley: ["pulley"],
  relai: ["relay"],
  rellay: ["relay"],
  realy: ["relay"],
  retaner: ["retainer"],
  retainor: ["retainer"],
  retainar: ["retainer"],
  rezistor: ["resistor"],
  resistar: ["resistor"],
  resistir: ["resistor"],
  rotir: ["rotor"],
  rotar: ["rotor"],
  roter: ["rotor"],
  seale: ["seal"],
  seel: ["seal"],
  sael: ["seal"],
  sleve: ["sleeve"],
  sleave: ["sleeve"],
  sleev: ["sleeve"],
  sockit: ["socket"],
  socet: ["socket"],
  sockot: ["socket"],
  solonoid: ["solenoid"],
  solinoid: ["solenoid"],
  solanoid: ["solenoid"],
  spindel: ["spindle"],
  spindal: ["spindle"],
  spindul: ["spindle"],
  sprig: ["spring"],
  sprng: ["spring"],
  springe: ["spring"],
  stuter: ["strut"],
  strutt: ["strut"],
  struet: ["strut"],
  swicth: ["switch"],
  swich: ["switch"],
  switsh: ["switch"],
  termnal: ["terminal"],
  terminol: ["terminal"],
  termnial: ["terminal"],
  throtle: ["throttle"],
  throtl: ["throttle"],
  throtlle: ["throttle"],
  timng: ["timing"],
  tiiming: ["timing"],
  timeing: ["timing"],
  tranfer: ["transfer"],
  transfor: ["transfer"],
  transfir: ["transfer"],
  vacum: ["vacuum"],
  vacuam: ["vacuum"],
  vaccuum: ["vacuum"],
  wipor: ["wiper"],
  wiper: ["wiper"],
  wipir: ["wiper"],
};

/**
 * Generate expanded search terms from a part description.
 * Returns a space-separated string of additional search terms.
 */
export function generateSearchTerms(
  description: string | null | undefined,
  partNumber: string | null | undefined
): string {
  if (!description && !partNumber) {
    return "";
  }

  const terms = new Set<string>();

  // Process description
  if (description) {
    const descUpper = description.toUpperCase();
    const descLower = description.toLowerCase();

    // Split into words/tokens
    const tokens = description.split(/[\s,\/\-]+/).filter(Boolean);

    for (const token of tokens) {
      const upper = token.toUpperCase();
      const lower = token.toLowerCase();

      // Check abbreviation expansions
      if (ABBREVIATIONS[upper]) {
        for (const expansion of ABBREVIATIONS[upper]) {
          terms.add(expansion.toLowerCase());
        }
      }

      // Check synonyms
      if (SYNONYMS[lower]) {
        for (const synonym of SYNONYMS[lower]) {
          terms.add(synonym.toLowerCase());
        }
      }

      // Add the token itself in lowercase
      terms.add(lower);
    }

    // Also check for multi-word abbreviations
    for (const [abbrev, expansions] of Object.entries(ABBREVIATIONS)) {
      if (descUpper.includes(abbrev)) {
        for (const expansion of expansions) {
          terms.add(expansion.toLowerCase());
        }
      }
    }

    // Add misspelling reverse lookups (so searching for misspelling finds correct)
    for (const [misspelling, corrects] of Object.entries(MISSPELLINGS)) {
      for (const correct of corrects) {
        if (descLower.includes(correct)) {
          // Add the misspelling so it can be found
          terms.add(misspelling);
        }
      }
    }
  }

  // Process part number - add variations
  if (partNumber) {
    const pn = partNumber.toUpperCase();
    // Add with and without common prefixes
    terms.add(pn.toLowerCase());
    if (pn.startsWith("MD") || pn.startsWith("MR") || pn.startsWith("MF") || pn.startsWith("MS")) {
      terms.add(pn.substring(2).toLowerCase());
    }
  }

  // Remove very short terms (noise)
  const filtered = Array.from(terms).filter((t) => t.length >= 2);

  return filtered.join(" ");
}

/**
 * Add common misspellings of a search query to improve matching.
 * Returns an expanded query string.
 */
export function expandSearchQuery(query: string): string {
  const terms = new Set<string>();
  const queryLower = query.toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    const lower = token.toLowerCase();
    terms.add(lower);

    // Check if this is a misspelling
    if (MISSPELLINGS[lower]) {
      for (const correct of MISSPELLINGS[lower]) {
        terms.add(correct);
      }
    }

    // Check if any misspelling maps to this
    for (const [misspelling, corrects] of Object.entries(MISSPELLINGS)) {
      if (corrects.includes(lower)) {
        terms.add(misspelling);
      }
    }

    // Check synonyms
    if (SYNONYMS[lower]) {
      for (const syn of SYNONYMS[lower]) {
        terms.add(syn);
      }
    }

    // Check abbreviation reverse lookup
    for (const [abbrev, expansions] of Object.entries(ABBREVIATIONS)) {
      if (expansions.some((e) => e.toLowerCase() === lower)) {
        terms.add(abbrev.toLowerCase());
      }
      if (abbrev.toLowerCase() === lower) {
        for (const exp of expansions) {
          terms.add(exp.toLowerCase());
        }
      }
    }
  }

  // Build FTS5 OR query
  const termArray = Array.from(terms);
  if (termArray.length === 1) {
    return termArray[0];
  }
  return termArray.map((t) => `"${t}"`).join(" OR ");
}
