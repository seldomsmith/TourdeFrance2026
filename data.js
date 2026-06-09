// Tour De France 2026 Dataset and Simulator Logic

export const STAGES = [
  {
    id: 1,
    name: "Barcelona – Barcelona (TTT)",
    type: "TTT",
    distance: 19.7,
    elevation: 180,
    breakawayRating: 1, // Time Trial
    description: "A fast, technical team time trial starting in the heart of Barcelona and passing iconic landmarks before finishing near Montjuïc.",
    climbs: [
      { name: "Montjuïc Castle", category: "c4", length: 1.5, grade: 5.6 }
    ],
    mapboxCoords: { start: [2.1734, 41.3851], finish: [2.1528, 41.3686] }
  },
  {
    id: 2,
    name: "Tarragona – Barcelona",
    type: "Hilly",
    distance: 181.2,
    elevation: 2100,
    breakawayRating: 7,
    description: "Hilly stage traversing the Catalan coastal range. Perfect for punchy classic riders and a strong breakaway attempt.",
    climbs: [
      { name: "Coll de Lilla", category: "c3", length: 4.8, grade: 4.8 },
      { name: "Alt de Font-Rubí", category: "c3", length: 5.2, grade: 4.5 },
      { name: "Alt de la Conreria", category: "c4", length: 3.1, grade: 5.1 }
    ],
    mapboxCoords: { start: [1.2584, 41.1187], finish: [2.1734, 41.3851] }
  },
  {
    id: 3,
    name: "Girona – Figueres",
    type: "Flat",
    distance: 165.4,
    elevation: 850,
    breakawayRating: 3,
    description: "Flat run through Catalonia's cycling capital Girona to Dalí's birthplace, Figueres. Expected to end in a bunch sprint.",
    climbs: [
      { name: "Alt de Banyoles", category: "c4", length: 2.0, grade: 3.8 }
    ],
    mapboxCoords: { start: [2.8214, 41.9794], finish: [2.9622, 42.2665] }
  },
  {
    id: 4,
    name: "Figueres – Gavarnie-Gèdre (Pyrenees)",
    type: "Mountain",
    distance: 198.5,
    elevation: 4200,
    breakawayRating: 5,
    description: "First high-altitude mountain test. Crosses the border into France, culminating in the grueling summit finish at Gavarnie-Gèdre.",
    climbs: [
      { name: "Col du Portillon", category: "c1", length: 8.4, grade: 7.1 },
      { name: "Col de Peyresourde", category: "c1", length: 10.0, grade: 7.5 },
      { name: "Gavarnie-Gèdre Climb", category: "hc", length: 15.0, grade: 7.8 }
    ],
    mapboxCoords: { start: [2.9622, 42.2665], finish: [-0.0199, 42.7878] }
  },
  {
    id: 5,
    name: "Lourdes – Pau",
    type: "Hilly",
    distance: 145.0,
    elevation: 1600,
    breakawayRating: 8,
    description: "A short, nervous stage starting from the holy city of Lourdes. Features short steep walls in the foothills of the Pyrenees before Pau.",
    climbs: [
      { name: "Côte de Capvern", category: "c4", length: 2.5, grade: 5.0 },
      { name: "Côte de Larreule", category: "c3", length: 3.2, grade: 6.2 }
    ],
    mapboxCoords: { start: [-0.0456, 43.0963], finish: [-0.3686, 43.2951] }
  },
  {
    id: 6,
    name: "Pau – Auch",
    type: "Flat",
    distance: 172.5,
    elevation: 900,
    breakawayRating: 4,
    description: "Flat, rolling country stage through Gascony. Sprinters' teams will control, though crosswinds could break the peloton.",
    climbs: [
      { name: "Alt de Montesquiou", category: "c4", length: 1.8, grade: 4.2 }
    ],
    mapboxCoords: { start: [-0.3686, 43.2951], finish: [0.5859, 43.6465] }
  },
  {
    id: 7,
    name: "Auch – Cahors",
    type: "Flat",
    distance: 191.0,
    elevation: 1100,
    breakawayRating: 5,
    description: "Traversing picturesque vineyards. A rolling finish that may reward late attackers or strong sprinters.",
    climbs: [
      { name: "Côte de Luzech", category: "c4", length: 2.1, grade: 5.5 }
    ],
    mapboxCoords: { start: [0.5859, 43.6465], finish: [1.4429, 44.4475] }
  },
  {
    id: 8,
    name: "Cahors – Limoges",
    type: "Hilly",
    distance: 215.4,
    elevation: 2500,
    breakawayRating: 8,
    description: "A marathon hilly stage entering the Limousin region. Constantly up and down on heavy roads, highly favorable to breakaways.",
    climbs: [
      { name: "Côte de Saint-Yrieix", category: "c3", length: 5.0, grade: 4.8 },
      { name: "Côte de Condat", category: "c4", length: 2.8, grade: 5.6 }
    ],
    mapboxCoords: { start: [1.4429, 44.4475], finish: [1.2576, 45.8336] }
  },
  {
    id: 9,
    name: "Limoges – Guéret",
    type: "Hilly",
    distance: 148.0,
    elevation: 2200,
    breakawayRating: 9,
    description: "Short, aggressive loop in the Creuse department. The climbs are short and steep. A classic breakaway stage.",
    climbs: [
      { name: "Maupuy Hill", category: "c2", length: 3.5, grade: 7.2 },
      { name: "Côte des Trois Lacs", category: "c3", length: 4.1, grade: 6.0 }
    ],
    mapboxCoords: { start: [1.2576, 45.8336], finish: [1.8715, 46.1714] }
  },
  {
    id: 10,
    name: "Clermont-Ferrand – Puy de Dôme (Massif Central)",
    type: "Mountain",
    distance: 161.0,
    elevation: 3400,
    breakawayRating: 6,
    description: "Return to the legendary volcanic climb Puy de Dôme. The final 4 kilometers average over 11% gradient with no spectators allowed.",
    climbs: [
      { name: "Col de la Moreno", category: "c3", length: 4.8, grade: 5.0 },
      { name: "Col de Ceyssat", category: "c1", length: 10.2, grade: 6.1 },
      { name: "Puy de Dôme summit", category: "hc", length: 13.3, grade: 7.7 }
    ],
    mapboxCoords: { start: [3.0870, 45.7772], finish: [2.9642, 45.7723] }
  },
  {
    id: 11,
    name: "Montluçon – Nevers",
    type: "Flat",
    distance: 178.5,
    elevation: 800,
    breakawayRating: 3,
    description: "Flat stage heading north. Sprinters will get their first post-rest-day opportunity on wide, open boulevards.",
    climbs: [
      { name: "Côte de Saint-Parize", category: "c4", length: 1.5, grade: 4.5 }
    ],
    mapboxCoords: { start: [2.6028, 46.3389], finish: [3.1590, 46.9908] }
  },
  {
    id: 12,
    name: "Nevers – Roanne",
    type: "Hilly",
    distance: 190.5,
    elevation: 2000,
    breakawayRating: 7,
    description: "Rolling stage entering the Loire region. Ideal for medium-mountain breakaway riders as the GC contenders rest for the Alps.",
    climbs: [
      { name: "Col de la Croix de l'Homme", category: "c3", length: 6.1, grade: 5.2 },
      { name: "Côte de la Croix d'Azolette", category: "c2", length: 5.5, grade: 6.8 }
    ],
    mapboxCoords: { start: [3.1590, 46.9908], finish: [4.0735, 46.0368] }
  },
  {
    id: 13,
    name: "Lyon – Plateau de Solaison (Alps)",
    type: "Mountain",
    distance: 186.2,
    elevation: 4600,
    breakawayRating: 4,
    description: "The first brutal Alpine stage. Culminates at Plateau de Solaison, one of the steepest summit finishes in eastern France.",
    climbs: [
      { name: "Col de la Colombière", category: "c1", length: 11.7, grade: 5.8 },
      { name: "Plateau de Solaison", category: "hc", length: 11.3, grade: 9.2 }
    ],
    mapboxCoords: { start: [4.8357, 45.7640], finish: [6.4522, 46.0025] }
  },
  {
    id: 14,
    name: "Sallanches – Alpe d'Huez (Alps)",
    type: "Mountain",
    distance: 195.0,
    elevation: 5100,
    breakawayRating: 4,
    description: "Queen stage of the Alps. Takes riders over Col du Galibier before tackling the 21 legendary hairpin bends of Alpe d'Huez.",
    climbs: [
      { name: "Col des Saisies", category: "c1", length: 13.4, grade: 5.1 },
      { name: "Col du Galibier", category: "hc", length: 23.0, grade: 5.1 },
      { name: "Alpe d'Huez", category: "hc", length: 13.8, grade: 8.1 }
    ],
    mapboxCoords: { start: [6.6289, 45.9377], finish: [6.0772, 45.0926] }
  },
  {
    id: 15,
    name: "Alpe d'Huez – Alpe d'Huez (ITT)",
    type: "ITT",
    distance: 13.8,
    elevation: 1070,
    breakawayRating: 1, // Individual Time Trial
    description: "A mountain time trial matching the route of the hairpins. Every rider fights the clock up the legendary 21 hairpins.",
    climbs: [
      { name: "Alpe d'Huez (Hairpins)", category: "hc", length: 13.8, grade: 8.1 }
    ],
    mapboxCoords: { start: [6.0351, 45.0602], finish: [6.0772, 45.0926] }
  },
  {
    id: 16,
    name: "Grenoble – Orcières-Merlette",
    type: "Mountain",
    distance: 171.0,
    elevation: 3500,
    breakawayRating: 6,
    description: "Alpine stage entering the southern Alps, culminating in the mid-mountain resort finish at Orcières-Merlette.",
    climbs: [
      { name: "Col de Bayard", category: "c2", length: 7.6, grade: 6.7 },
      { name: "Orcières-Merlette", category: "c1", length: 7.1, grade: 6.7 }
    ],
    mapboxCoords: { start: [5.7245, 45.1885], finish: [6.3248, 44.6738] }
  },
  {
    id: 17,
    name: "Gap – Valence",
    type: "Flat",
    distance: 158.0,
    elevation: 1200,
    breakawayRating: 5,
    description: "Descending out of the Alps into the Rhône Valley. High chance of crosswinds disrupting sprinters' train plans.",
    climbs: [
      { name: "Col de Cabre", category: "c3", length: 9.1, grade: 4.6 }
    ],
    mapboxCoords: { start: [6.0798, 44.5596], finish: [4.8924, 44.9334] }
  },
  {
    id: 18,
    name: "Valence – Saint-Étienne",
    type: "Hilly",
    distance: 170.2,
    elevation: 2400,
    breakawayRating: 8,
    description: "Traversing the rugged roads of the Ardèche and Pilat. Up-and-down profile perfect for a long-range breakaway success.",
    climbs: [
      { name: "Col de la République", category: "c2", length: 12.1, grade: 4.8 },
      { name: "Côte de Saint-Victor", category: "c3", length: 3.5, grade: 6.5 }
    ],
    mapboxCoords: { start: [4.8924, 44.9334], finish: [4.3873, 45.4397] }
  },
  {
    id: 19,
    name: "Saint-Étienne – La Bresse Hohneck (Vosges)",
    type: "Mountain",
    distance: 202.0,
    elevation: 3800,
    breakawayRating: 7,
    description: "A long trek north into the Vosges mountains. Multiple short, highly punchy climbs testing overall stamina.",
    climbs: [
      { name: "Col de Grosse Pierre", category: "c2", length: 3.1, grade: 7.5 },
      { name: "Le Markstein", category: "c1", length: 10.8, grade: 5.4 }
    ],
    mapboxCoords: { start: [4.3873, 45.4397], finish: [6.8837, 48.0062] }
  },
  {
    id: 20,
    name: "Belfort – Markstein (Vosges)",
    type: "Mountain",
    distance: 133.5,
    elevation: 3600,
    breakawayRating: 5,
    description: "The final mountain battle. Short, intense Vosges stage designed for long-range GC attacks before the final transfer.",
    climbs: [
      { name: "Ballon d'Alsace", category: "c1", length: 11.5, grade: 5.2 },
      { name: "Col de la Schlucht", category: "c2", length: 8.0, grade: 5.4 },
      { name: "Petit Ballon", category: "c1", length: 9.3, grade: 8.1 },
      { name: "Col du Platzerwasel", category: "c1", length: 7.1, grade: 8.4 }
    ],
    mapboxCoords: { start: [6.8485, 47.6397], finish: [7.0278, 47.9228] }
  },
  {
    id: 21,
    name: "Rambouillet – Paris (Champs-Élysées)",
    type: "Flat",
    distance: 112.0,
    elevation: 400,
    breakawayRating: 2,
    description: "The traditional celebratory parade and sprint finish on the cobblestones of the Avenue des Champs-Élysées.",
    climbs: [
      { name: "Côte des Pavés du Garde", category: "c4", length: 1.3, grade: 6.5 }
    ],
    mapboxCoords: { start: [1.8292, 48.6449], finish: [2.3018, 48.8738] }
  }
];

export const INITIAL_TEAMS = [
  {
    id: 1,
    name: "Visma | Lease a Bike",
    shortName: "TVL",
    riders: [
      { name: "Jonas Vingegaard", age: 29, nationality: "DEN", type: "gc", isYoung: false },
      { name: "Matteo Jorgenson", age: 26, nationality: "USA", type: "gc", isYoung: false },
      { name: "Sepp Kuss", age: 31, nationality: "USA", type: "gc", isYoung: false },
      { name: "Christophe Laporte", age: 33, nationality: "FRA", type: "sprinter", isYoung: false },
      { name: "Tiesj Benoot", age: 32, nationality: "BEL", type: "breakaway", isYoung: false },
      { name: "Wilco Kelderman", age: 35, nationality: "NED", type: "clinger", isYoung: false }
    ]
  },
  {
    id: 2,
    name: "UAE Team Emirates",
    shortName: "UAD",
    riders: [
      { name: "Tadej Pogačar", age: 27, nationality: "SLO", type: "gc", isYoung: false },
      { name: "Adam Yates", age: 33, nationality: "GBR", type: "gc", isYoung: false },
      { name: "João Almeida", age: 27, nationality: "POR", type: "gc", isYoung: false },
      { name: "Juan Ayuso", age: 23, nationality: "ESP", type: "gc", isYoung: true },
      { name: "Marc Soler", age: 32, nationality: "ESP", type: "breakaway", isYoung: false },
      { name: "Pavel Sivakov", age: 28, nationality: "FRA", type: "clinger", isYoung: false }
    ]
  },
  {
    id: 3,
    name: "Soudal - Quick Step",
    shortName: "SOQ",
    riders: [
      { name: "Remco Evenepoel", age: 26, nationality: "BEL", type: "gc", isYoung: false }, // turn 26 in 2026, not eligible
      { name: "Mikel Landa", age: 36, nationality: "ESP", type: "clinger", isYoung: false },
      { name: "Ilan Van Wilder", age: 25, nationality: "BEL", type: "gc", isYoung: true },
      { name: "Yves Lampaert", age: 35, nationality: "BEL", type: "flat", isYoung: false },
      { name: "Gianni Moscon", age: 32, nationality: "ITA", type: "breakaway", isYoung: false },
      { name: "Louis Vervaeke", age: 32, nationality: "BEL", type: "clinger", isYoung: false }
    ]
  },
  {
    id: 4,
    name: "Red Bull - Bora - Hansgrohe",
    shortName: "RBH",
    riders: [
      { name: "Primož Roglič", age: 36, nationality: "SLO", type: "gc", isYoung: false },
      { name: "Jai Hindley", age: 30, nationality: "AUS", type: "gc", isYoung: false },
      { name: "Aleksandr Vlasov", age: 30, nationality: "RUS", type: "gc", isYoung: false },
      { name: "Daniel Martínez", age: 30, nationality: "COL", type: "gc", isYoung: false },
      { name: "Nico Denz", age: 32, nationality: "GER", type: "breakaway", isYoung: false },
      { name: "Danny van Poppel", age: 32, nationality: "NED", type: "sprinter", isYoung: false }
    ]
  },
  {
    id: 5,
    name: "INEOS Grenadiers",
    shortName: "IGD",
    riders: [
      { name: "Carlos Rodríguez", age: 25, nationality: "ESP", type: "gc", isYoung: true },
      { name: "Tom Pidcock", age: 26, nationality: "GBR", type: "breakaway", isYoung: false },
      { name: "Geraint Thomas", age: 40, nationality: "GBR", type: "gc", isYoung: false },
      { name: "Egan Bernal", age: 29, nationality: "COL", type: "gc", isYoung: false },
      { name: "Michał Kwiatkowski", age: 36, nationality: "POL", type: "breakaway", isYoung: false },
      { name: "Laurens De Plus", age: 30, nationality: "BEL", type: "clinger", isYoung: false }
    ]
  },
  {
    id: 6,
    name: "Lidl - Trek",
    shortName: "LTK",
    riders: [
      { name: "Mads Pedersen", age: 30, nationality: "DEN", type: "sprinter", isYoung: false },
      { name: "Mattias Skjelmose", age: 25, nationality: "DEN", type: "gc", isYoung: true },
      { name: "Tao Geoghegan Hart", age: 31, nationality: "GBR", type: "gc", isYoung: false },
      { name: "Giulio Ciccone", age: 31, nationality: "clinger", isYoung: false },
      { name: "Toms Skujiņš", age: 34, nationality: "LAT", type: "breakaway", isYoung: false },
      { name: "Jasper Stuyven", age: 34, nationality: "BEL", type: "sprinter", isYoung: false }
    ]
  },
  {
    id: 7,
    name: "Alpecin - Deceuninck",
    shortName: "ADC",
    riders: [
      { name: "Mathieu van der Poel", age: 31, nationality: "NED", type: "breakaway", isYoung: false },
      { name: "Jasper Philipsen", age: 28, nationality: "BEL", type: "sprinter", isYoung: false },
      { name: "Kaden Groves", age: 27, nationality: "AUS", type: "sprinter", isYoung: false },
      { name: "Quintin Hermans", age: 30, nationality: "BEL", type: "breakaway", isYoung: false },
      { name: "Silvan Dillier", age: 35, nationality: "SUI", type: "flat", isYoung: false },
      { name: "Axel Laurance", age: 25, nationality: "FRA", type: "breakaway", isYoung: true }
    ]
  },
  {
    id: 8,
    name: "EF Education - EasyPost",
    shortName: "EFE",
    riders: [
      { name: "Richard Carapaz", age: 33, nationality: "ECU", type: "gc", isYoung: false },
      { name: "Ben Healy", age: 25, nationality: "IRL", type: "breakaway", isYoung: true },
      { name: "Neilson Powless", age: 29, nationality: "USA", type: "breakaway", isYoung: false },
      { name: "Rui Costa", age: 39, nationality: "POR", type: "breakaway", isYoung: false },
      { name: "Marijn van den Berg", age: 26, nationality: "NED", type: "sprinter", isYoung: false },
      { name: "Stefan Bissegger", age: 27, nationality: "SUI", type: "flat", isYoung: false }
    ]
  },
  {
    id: 9,
    name: "Decathlon AG2R La Mondiale",
    shortName: "DAT",
    riders: [
      { name: "Ben O'Connor", age: 30, nationality: "AUS", type: "gc", isYoung: false },
      { name: "Felix Gall", age: 28, nationality: "AUT", type: "gc", isYoung: false },
      { name: "Lenny Martinez", age: 22, nationality: "FRA", type: "gc", isYoung: true },
      { name: "Sam Bennett", age: 35, nationality: "IRL", type: "sprinter", isYoung: false },
      { name: "Victor Lafay", age: 30, nationality: "FRA", type: "breakaway", isYoung: false },
      { name: "Nans Peters", age: 32, nationality: "FRA", type: "clinger", isYoung: false }
    ]
  },
  {
    id: 10,
    name: "Groupama - FDJ",
    shortName: "GFC",
    riders: [
      { name: "David Gaudu", age: 29, nationality: "FRA", type: "gc", isYoung: false },
      { name: "Valentin Madouas", age: 29, nationality: "FRA", type: "breakaway", isYoung: false },
      { name: "Romain Grégoire", age: 23, nationality: "FRA", type: "breakaway", isYoung: true },
      { name: "Stefan Küng", age: 32, nationality: "SUI", type: "flat", isYoung: false },
      { name: "Quentin Pacher", age: 34, nationality: "FRA", type: "clinger", isYoung: false },
      { name: "Laurence Pithie", age: 23, nationality: "NZL", type: "sprinter", isYoung: true }
    ]
  }
];

// Helper to init the complete database state
export function initRiderState() {
  const riders = [];
  INITIAL_TEAMS.forEach(team => {
    team.riders.forEach(r => {
      riders.push({
        name: r.name,
        teamName: team.name,
        teamShort: team.shortName,
        age: r.age,
        nationality: r.nationality,
        type: r.type,
        isYoung: r.isYoung,
        status: "Active", // "Active" or "Abandoned"
        abandonStage: null,
        abandonReason: null,
        
        // Cumulative Metrics
        gcTime: 0, // seconds relative to overall leader
        points: 0,
        mountainPoints: 0,
        combativeKms: 0,
        stagesInBreak: 0,
        
        // History track over stages: index matches stage ID
        gcHistory: [0], // gc time behind leader after stage X
        rankHistory: [0], // gc rank after stage X
        stageGapsHistory: [0], // time lost on stage X specifically
        pointsHistory: [0],
        mountainPointsHistory: [0],
        breakStageIds: [] // stage IDs where rider was in breakaway
      });
    });
  });
  return riders;
}

// Generate realistic simulated results for a stage based on rider statistics and profile
export function simulateStage(stageId, riders) {
  const stage = STAGES.find(s => s.id === stageId);
  if (!stage) return riders;

  // 1. Determine random abandonments (small realistic chance, higher in high mountains)
  const activeRiders = riders.filter(r => r.status === "Active");
  let abandonChance = 0.01;
  if (stage.type === "Mountain") abandonChance = 0.03;
  if (stage.type === "TTT" || stage.type === "ITT") abandonChance = 0.002;

  activeRiders.forEach(r => {
    if (Math.random() < abandonChance && stageId > 1) {
      const reasons = [
        "Involved in massive crash, broken collarbone",
        "Knee tendonitis inflammation",
        "Sickness and high fever",
        "Exceeded time limit on steep HC finishes",
        "Extreme exhaustion"
      ];
      r.status = "Abandoned";
      r.abandonStage = stageId;
      r.abandonReason = reasons[Math.floor(Math.random() * reasons.length)];
    }
  });

  // Re-filter active riders
  const currentActive = riders.filter(r => r.status === "Active");

  // 2. Generate stage performance scores for each active rider
  const performanceList = currentActive.map(r => {
    let basePower = Math.random() * 100;

    // Apply specialization bonuses depending on stage profile
    if (stage.type === "Flat") {
      if (r.type === "sprinter") basePower += 80;
      if (r.type === "flat") basePower += 30;
    } else if (stage.type === "Mountain") {
      if (r.type === "gc") basePower += 80;
      if (r.type === "clinger") basePower += 50;
      if (r.type === "sprinter") basePower -= 60; // sprinters struggle
    } else if (stage.type === "Hilly") {
      if (r.type === "breakaway") basePower += 70;
      if (r.type === "gc") basePower += 50;
    } else if (stage.type === "ITT") {
      if (r.type === "gc") basePower += 60;
      if (r.type === "flat") basePower += 40; // good TT engine
    } else if (stage.type === "TTT") {
      // TTT is team-based, group by team
      const teamStrength = {
        "TVL": 90, "UAD": 85, "SOQ": 80, "RBH": 78, "IGD": 75, "LTK": 70, "ADC": 60, "EFE": 65, "DAT": 55, "GFC": 58
      };
      basePower = teamStrength[r.teamShort] || 50;
      basePower += Math.random() * 10;
    }

    // Tadej Pogačar & Jonas Vingegaard superstars boost
    if (r.name === "Tadej Pogačar" || r.name === "Jonas Vingegaard") {
      if (stage.type === "Mountain" || stage.type === "ITT" || stage.type === "Hilly") {
        basePower += 25;
      }
    }

    return { rider: r, score: basePower };
  });

  // Sort performance to see who wins the stage
  performanceList.sort((a, b) => b.score - a.score);

  // 3. Update GC Times based on performance differences
  let winnerScore = performanceList[0].score;
  performanceList.forEach((perf, rank) => {
    let timeLost = 0; // seconds lost to stage winner
    if (stage.type === "Mountain") {
      // In mountains, time gaps are huge
      timeLost = Math.floor((winnerScore - perf.score) * 6);
      if (timeLost < 0) timeLost = 0;
    } else if (stage.type === "Hilly") {
      timeLost = Math.floor((winnerScore - perf.score) * 2.5);
    } else if (stage.type === "Flat") {
      // flat stages generally finish in same time, only minor splits for tail end
      if (rank > 15) timeLost = Math.floor((winnerScore - perf.score) * 0.4);
    } else if (stage.type === "ITT" || stage.type === "TTT") {
      timeLost = Math.floor((winnerScore - perf.score) * 3);
    }
    
    // Accumulate GC time
    perf.rider.gcTime += timeLost;
    perf.rider.tempStageGap = timeLost;
  });

  // 4. Distribute Sprint Points (Green Jersey)
  if (stage.type === "Flat") {
    // Heavy sprint points (50, 30, 20, 18, 16...)
    const pts = [50, 30, 20, 18, 16, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2];
    performanceList.slice(0, 15).forEach((perf, idx) => {
      perf.rider.points += pts[idx];
    });
  } else if (stage.type === "Hilly" || stage.type === "ITT") {
    const pts = [30, 25, 22, 19, 17, 15, 13, 11, 9, 7];
    performanceList.slice(0, 10).forEach((perf, idx) => {
      perf.rider.points += pts[idx];
    });
  } else if (stage.type === "Mountain") {
    const pts = [20, 17, 15, 13, 11, 9, 7, 5, 3, 1];
    performanceList.slice(0, 10).forEach((perf, idx) => {
      perf.rider.points += pts[idx];
    });
  }

  // 5. Distribute Mountain Points (Polka Dot)
  if (stage.climbs && stage.climbs.length > 0) {
    stage.climbs.forEach(climb => {
      // Higher categories reward more points
      let climbPoints = [];
      if (climb.category === "hc") climbPoints = [20, 15, 12, 10, 8, 6, 4, 2];
      else if (climb.category === "c1") climbPoints = [10, 8, 6, 4, 2, 1];
      else if (climb.category === "c2") climbPoints = [5, 3, 2, 1];
      else if (climb.category === "c3") climbPoints = [2, 1];
      else if (climb.category === "c4") climbPoints = [1];

      // Distribute to the top climbers of this stage (randomized subset of strong climbers)
      const climbers = currentActive.filter(r => r.type === "gc" || r.type === "clinger" || r.type === "breakaway");
      const climbPerformers = climbers.map(r => ({
        rider: r,
        climbScore: Math.random() * 50 + (r.type === "clinger" ? 30 : 0) + (r.name === "Tadej Pogačar" || r.name === "Jonas Vingegaard" ? 25 : 0)
      })).sort((a, b) => b.climbScore - a.climbScore);

      climbPoints.forEach((pts, idx) => {
        if (climbPerformers[idx]) {
          climbPerformers[idx].rider.mountainPoints += pts;
        }
      });
    });
  }

  // 6. Breakaway stats update
  if (stage.type === "Hilly" || stage.type === "Mountain") {
    // 5-10 riders go in the break
    const breakSize = 5 + Math.floor(Math.random() * 6);
    const breakEligible = currentActive.filter(r => r.type === "breakaway" || r.type === "clinger");
    const breakRiders = breakEligible.sort(() => 0.5 - Math.random()).slice(0, breakSize);

    breakRiders.forEach(r => {
      r.stagesInBreak += 1;
      r.combativeKms += Math.floor(stage.distance * (0.4 + Math.random() * 0.4)); // break covers 40%-80% of stage distance
      if (!r.breakStageIds) r.breakStageIds = [];
      r.breakStageIds.push(stageId);
    });
  }

  // 7. Calculate and normalize GC rankings relative to the absolute leader (leader GC = 0)
  const gcRanked = [...riders].filter(r => r.status === "Active").sort((a, b) => a.gcTime - b.gcTime);
  const leaderTime = gcRanked[0].gcTime;

  riders.forEach(r => {
    if (r.status === "Active") {
      r.gcTime = r.gcTime - leaderTime; // Leader gets 0, others get time gap
      
      // Save history for chart plotting
      r.gcHistory.push(r.gcTime);
      r.rankHistory.push(gcRanked.indexOf(r) + 1);
      r.stageGapsHistory.push(r.tempStageGap || 0);
      r.pointsHistory.push(r.points);
      r.mountainPointsHistory.push(r.mountainPoints);
      delete r.tempStageGap;
    } else {
      // If abandoned, pad history with nulls or copy last known state
      r.gcHistory.push(null);
      r.rankHistory.push(null);
      r.stageGapsHistory.push(null);
      r.pointsHistory.push(null);
      r.mountainPointsHistory.push(null);
    }
  });

  return riders;
}

// Convert seconds to readable time format (e.g. "+ 1h 24' 12\"")
export function formatGCTime(seconds) {
  if (seconds === 0) return "Yellow Jersey";
  const absSec = Math.abs(seconds);
  const hrs = Math.floor(absSec / 3600);
  const mins = Math.floor((absSec % 3600) / 60);
  const secs = absSec % 60;
  
  let result = "+ ";
  if (hrs > 0) result += `${hrs}h `;
  if (mins > 0 || hrs > 0) result += `${mins}' `;
  result += `${secs}"`;
  return result;
}
