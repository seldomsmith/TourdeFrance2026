// Tour De France 2026 Dataset and Simulator Logic

export const STAGES = [
  {
    id: 1,
    name: "Barcelona – Barcelona (TTT)",
    type: "TTT",
    distance: 19.6,
    elevation: 180,
    breakawayRating: 1,
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
    distance: 168.5,
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
    name: "Granollers – Les Angles",
    type: "Mountain",
    distance: 195.9,
    elevation: 3800,
    breakawayRating: 5,
    description: "The first mountain test of the Tour crossing from Granollers up into the Pyrenees, finishing in Les Angles.",
    climbs: [
      { name: "Col de Creu", category: "c1", length: 9.2, grade: 6.2 },
      { name: "Les Angles summit", category: "c1", length: 8.5, grade: 7.1 }
    ],
    mapboxCoords: { start: [2.2868, 41.5999], finish: [2.0722, 42.5802] }
  },
  {
    id: 4,
    name: "Carcassonne – Foix",
    type: "Hilly",
    distance: 181.9,
    elevation: 2400,
    breakawayRating: 8,
    description: "Aggregation of mid-mountain climbs from Carcassonne through Ariège. High probability of breakaway success.",
    climbs: [
      { name: "Col de Port", category: "c2", length: 12.4, grade: 4.9 }
    ],
    mapboxCoords: { start: [2.3522, 43.2122], finish: [1.6063, 42.9639] }
  },
  {
    id: 5,
    name: "Lannemezan – Pau",
    type: "Flat",
    distance: 158.3,
    elevation: 1100,
    breakawayRating: 3,
    description: "Traditional transition stage heading towards the Pyrenean gateway city of Pau. Expected sprint finish.",
    climbs: [
      { name: "Côte de Capvern", category: "c4", length: 2.2, grade: 4.8 }
    ],
    mapboxCoords: { start: [0.3849, 43.1256], finish: [-0.3686, 43.2951] }
  },
  {
    id: 6,
    name: "Pau – Gavarnie-Gèdre",
    type: "Mountain",
    distance: 186.2,
    elevation: 4300,
    breakawayRating: 4,
    description: "High mountain stage heading deep into the Pyrenees with a brutal summit finish at Gavarnie-Gèdre.",
    climbs: [
      { name: "Col du Tourmalet", category: "hc", length: 19.0, grade: 7.4 },
      { name: "Gavarnie-Gèdre summit", category: "hc", length: 15.0, grade: 7.8 }
    ],
    mapboxCoords: { start: [-0.3686, 43.2951], finish: [-0.0199, 42.7878] }
  },
  {
    id: 7,
    name: "Hagetmau – Bordeaux",
    type: "Flat",
    distance: 175.1,
    elevation: 850,
    breakawayRating: 2,
    description: "Fast run through the Landes forest, finishing on the wide quays of Bordeaux for the sprinters.",
    climbs: [],
    mapboxCoords: { start: [-0.5925, 43.6934], finish: [-0.5792, 44.8378] }
  },
  {
    id: 8,
    name: "Périgueux – Bergerac",
    type: "Flat",
    distance: 180.4,
    elevation: 1000,
    breakawayRating: 3,
    description: "Rolling routes through the Dordogne department. A sprint finish is highly anticipated.",
    climbs: [
      { name: "Côte de Monbazillac", category: "c4", length: 2.1, grade: 5.2 }
    ],
    mapboxCoords: { start: [0.7208, 45.1839], finish: [0.4833, 44.8507] }
  },
  {
    id: 9,
    name: "Malemort – Ussel",
    type: "Hilly",
    distance: 185.5,
    elevation: 2600,
    breakawayRating: 8,
    description: "A nervous, bumpy stage through the Limousin plateau, perfect for strong attackers.",
    climbs: [
      { name: "Côte de Meymac", category: "c3", length: 4.5, grade: 5.6 }
    ],
    mapboxCoords: { start: [1.5644, 45.1703], finish: [2.3085, 45.5484] }
  },
  {
    id: 10,
    name: "Aurillac – Le Lioran",
    type: "Mountain",
    distance: 166.6,
    elevation: 3600,
    breakawayRating: 7,
    description: "Tough mountain stage in the Massif Central, traversing steep volcanic passes before Le Lioran resort.",
    climbs: [
      { name: "Col de Peyrol", category: "c1", length: 5.4, grade: 8.1 },
      { name: "Col de Perthus", category: "c2", length: 4.4, grade: 7.9 },
      { name: "Col de Cère", category: "c3", length: 3.3, grade: 5.9 }
    ],
    mapboxCoords: { start: [2.4411, 44.9264], finish: [2.7533, 45.0833] }
  },
  {
    id: 11,
    name: "Vichy – Nevers",
    type: "Flat",
    distance: 161.3,
    elevation: 900,
    breakawayRating: 3,
    description: "A flat stage traversing central France, finishing on the banks of the Loire river.",
    climbs: [],
    mapboxCoords: { start: [3.4219, 46.1275], finish: [3.1590, 46.9908] }
  },
  {
    id: 12,
    name: "Circuit de Nevers Magny-Cours – Chalon-sur-Saône",
    type: "Flat",
    distance: 179.1,
    elevation: 1100,
    breakawayRating: 3,
    description: "Starting from the famous race track and rolling eastwards to Chalon-sur-Saône.",
    climbs: [
      { name: "Côte de Culles-les-Roches", category: "c4", length: 1.8, grade: 5.0 }
    ],
    mapboxCoords: { start: [3.1633, 46.8631], finish: [4.8530, 46.7808] }
  },
  {
    id: 13,
    name: "Dole – Belfort",
    type: "Hilly",
    distance: 205.8,
    elevation: 2500,
    breakawayRating: 8,
    description: "Long hilly run towards the Vosges gateway. Ideal for the classics specialists and breakaways.",
    climbs: [
      { name: "Col de la Croix", category: "c3", length: 6.2, grade: 4.7 }
    ],
    mapboxCoords: { start: [5.4908, 47.0925], finish: [6.8485, 47.6397] }
  },
  {
    id: 14,
    name: "Mulhouse – Le Markstein Fellering",
    type: "Mountain",
    distance: 155.3,
    elevation: 3800,
    breakawayRating: 6,
    description: "Brutal stage in the Vosges Mountains traversing the Grand Ballon and ending at Le Markstein.",
    climbs: [
      { name: "Petit Ballon", category: "c1", length: 9.3, grade: 8.1 },
      { name: "Col du Platzerwasel", category: "c1", length: 7.1, grade: 8.4 }
    ],
    mapboxCoords: { start: [7.3359, 47.7508], finish: [7.0278, 47.9228] }
  },
  {
    id: 15,
    name: "Champagnole – Plateau de Solaison",
    type: "Mountain",
    distance: 183.9,
    elevation: 4600,
    breakawayRating: 4,
    description: "Brutal summit finish in the Alps at the steep Plateau de Solaison.",
    climbs: [
      { name: "Col de la Colombière", category: "c1", length: 11.7, grade: 5.8 },
      { name: "Plateau de Solaison", category: "hc", length: 11.3, grade: 9.2 }
    ],
    mapboxCoords: { start: [5.9122, 46.7456], finish: [6.4522, 46.0025] }
  },
  {
    id: 16,
    name: "Évian-les-Bains – Thonon-les-Bains (ITT)",
    type: "ITT",
    distance: 26.1,
    elevation: 380,
    breakawayRating: 1,
    description: "A rolling individual time trial along the banks of Lake Geneva.",
    climbs: [],
    mapboxCoords: { start: [6.5861, 46.4014], finish: [6.4797, 46.3725] }
  },
  {
    id: 17,
    name: "Chambéry – Voiron",
    type: "Flat",
    distance: 174.7,
    elevation: 1200,
    breakawayRating: 4,
    description: "Fast transit stage through the Isère Valley, giving sprinters their last opportunity before the high Alps.",
    climbs: [],
    mapboxCoords: { start: [5.9178, 45.5647], finish: [5.5906, 45.3628] }
  },
  {
    id: 18,
    name: "Voiron – Orcières-Merlette",
    type: "Mountain",
    distance: 185.2,
    elevation: 3900,
    breakawayRating: 5,
    description: "Alpine mountain stage culminating in the high-altitude resort finish at Orcières-Merlette.",
    climbs: [
      { name: "Col de Manse", category: "c2", length: 9.5, grade: 5.2 },
      { name: "Orcières-Merlette summit", category: "c1", length: 7.2, grade: 6.7 }
    ],
    mapboxCoords: { start: [5.5906, 45.3628], finish: [6.3248, 44.6738] }
  },
  {
    id: 19,
    name: "Gap – Alpe d'Huez",
    type: "Mountain",
    distance: 127.9,
    elevation: 4000,
    breakawayRating: 5,
    description: "The first of two stages tackling the iconic 21 hairpins of Alpe d'Huez.",
    climbs: [
      { name: "Col du Lautaret", category: "c2", length: 15.5, grade: 4.1 },
      { name: "Alpe d'Huez", category: "hc", length: 13.8, grade: 7.9 }
    ],
    mapboxCoords: { start: [6.0798, 44.5596], finish: [6.0772, 45.0926] }
  },
  {
    id: 20,
    name: "Le Bourg-d'Oisans – Alpe d'Huez",
    type: "Mountain",
    distance: 170.9,
    elevation: 5100,
    breakawayRating: 4,
    description: "The Queen stage of the 2026 Tour, crossing the Col du Glandon and Col de la Croix de Fer before finishing again at Alpe d'Huez.",
    climbs: [
      { name: "Col du Glandon", category: "hc", length: 19.7, grade: 7.2 },
      { name: "Col de la Croix de Fer", category: "hc", length: 22.7, grade: 6.9 },
      { name: "Alpe d'Huez", category: "hc", length: 13.8, grade: 7.9 }
    ],
    mapboxCoords: { start: [6.0305, 45.0537], finish: [6.0772, 45.0926] }
  },
  {
    id: 21,
    name: "Thoiry – Paris (Champs-Élysées)",
    type: "Flat",
    distance: 133.0,
    elevation: 450,
    breakawayRating: 2,
    description: "The traditional celebratory parade and final bunch sprint on the cobblestones of the Champs-Élysées.",
    climbs: [],
    mapboxCoords: { start: [1.7944, 48.8653], finish: [2.3018, 48.8738] }
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
      { name: "Victor Campenaerts", age: 34, nationality: "BEL", type: "breakaway", isYoung: false },
      { name: "Bruno Armirail", age: 32, nationality: "FRA", type: "clinger", isYoung: false },
      { name: "Davide Piganzoli", age: 23, nationality: "ITA", type: "gc", isYoung: true }
    ]
  },
  {
    id: 2,
    name: "UAE Team Emirates XRG",
    shortName: "UAD",
    riders: [
      { name: "Tadej Pogačar", age: 27, nationality: "SLO", type: "gc", isYoung: false },
      { name: "Isaac del Toro", age: 22, nationality: "MEX", type: "gc", isYoung: true },
      { name: "Brandon McNulty", age: 28, nationality: "USA", type: "gc", isYoung: false },
      { name: "Tim Wellens", age: 35, nationality: "BEL", type: "breakaway", isYoung: false },
      { name: "Marc Soler", age: 32, nationality: "ESP", type: "clinger", isYoung: false },
      { name: "Nils Politt", age: 32, nationality: "GER", type: "flat", isYoung: false }
    ]
  },
  {
    id: 3,
    name: "Soudal–Quick-Step",
    shortName: "SOQ",
    riders: [
      { name: "Tim Merlier", age: 33, nationality: "BEL", type: "sprinter", isYoung: false },
      { name: "Mikel Landa", age: 36, nationality: "ESP", type: "clinger", isYoung: false },
      { name: "Valentin Paret-Peintre", age: 25, nationality: "FRA", type: "clinger", isYoung: true },
      { name: "Ilan Van Wilder", age: 25, nationality: "BEL", type: "gc", isYoung: true },
      { name: "Jasper Stuyven", age: 34, nationality: "BEL", type: "sprinter", isYoung: false },
      { name: "Lennert Van Eetvelt", age: 24, nationality: "BEL", type: "gc", isYoung: true }
    ]
  },
  {
    id: 4,
    name: "Red Bull–Bora–Hansgrohe",
    shortName: "RBH",
    riders: [
      { name: "Remco Evenepoel", age: 26, nationality: "BEL", type: "gc", isYoung: false },
      { name: "Florian Lipowitz", age: 25, nationality: "GER", type: "gc", isYoung: true },
      { name: "Jai Hindley", age: 30, nationality: "AUS", type: "gc", isYoung: false },
      { name: "Nico Denz", age: 32, nationality: "GER", type: "breakaway", isYoung: false },
      { name: "Jan Tratnik", age: 36, nationality: "SLO", type: "breakaway", isYoung: false },
      { name: "Maxim Van Gils", age: 26, nationality: "BEL", type: "breakaway", isYoung: false }
    ]
  },
  {
    id: 5,
    name: "Netcompany INEOS",
    shortName: "IGD",
    riders: [
      { name: "Carlos Rodríguez", age: 25, nationality: "ESP", type: "gc", isYoung: true },
      { name: "Geraint Thomas", age: 40, nationality: "GBR", type: "gc", isYoung: false },
      { name: "Egan Bernal", age: 29, nationality: "COL", type: "gc", isYoung: false },
      { name: "Michał Kwiatkowski", age: 36, nationality: "POL", type: "breakaway", isYoung: false },
      { name: "Laurens De Plus", age: 30, nationality: "BEL", type: "clinger", isYoung: false },
      { name: "Josh Tarling", age: 22, nationality: "GBR", type: "flat", isYoung: true }
    ]
  },
  {
    id: 6,
    name: "Lidl–Trek",
    shortName: "LTK",
    riders: [
      { name: "Mads Pedersen", age: 30, nationality: "DEN", type: "sprinter", isYoung: false },
      { name: "Mattias Skjelmose", age: 25, nationality: "DEN", type: "gc", isYoung: true },
      { name: "Tao Geoghegan Hart", age: 31, nationality: "GBR", type: "gc", isYoung: false },
      { name: "Juan Ayuso", age: 23, nationality: "ESP", type: "gc", isYoung: true },
      { name: "Toms Skujiņš", age: 34, nationality: "LAT", type: "breakaway", isYoung: false },
      { name: "Mathias Vacek", age: 24, nationality: "CZE", type: "flat", isYoung: true }
    ]
  },
  {
    id: 7,
    name: "Decathlon CMA CGM",
    shortName: "DAT",
    riders: [
      { name: "Ben O'Connor", age: 30, nationality: "AUS", type: "gc", isYoung: false },
      { name: "Felix Gall", age: 28, nationality: "AUT", type: "gc", isYoung: false },
      { name: "Paul Seixas", age: 22, nationality: "FRA", type: "gc", isYoung: true },
      { name: "Sam Bennett", age: 35, nationality: "IRL", type: "sprinter", isYoung: false },
      { name: "Victor Lafay", age: 30, nationality: "FRA", type: "breakaway", isYoung: false },
      { name: "Dorian Godon", age: 30, nationality: "FRA", type: "breakaway", isYoung: false }
    ]
  },
  {
    id: 8,
    name: "EF Education–EasyPost",
    shortName: "EFE",
    riders: [
      { name: "Richard Carapaz", age: 33, nationality: "ECU", type: "gc", isYoung: false },
      { name: "Ben Healy", age: 25, nationality: "IRL", type: "breakaway", isYoung: true },
      { name: "Neilson Powless", age: 29, nationality: "USA", type: "breakaway", isYoung: false },
      { name: "Alex Baudin", age: 25, nationality: "FRA", type: "gc", isYoung: true },
      { name: "Rui Costa", age: 39, nationality: "POR", type: "breakaway", isYoung: false },
      { name: "Stefan Bissegger", age: 27, nationality: "SUI", type: "flat", isYoung: false }
    ]
  },
  {
    id: 9,
    name: "Caja Rural–Seguros RGA",
    shortName: "CJR",
    riders: [
      { name: "Alex Molenaar", age: 26, nationality: "NED", type: "breakaway", isYoung: false },
      { name: "Jefferson Cepeda", age: 28, nationality: "ECU", type: "clinger", isYoung: false },
      { name: "Orluis Aular", age: 29, nationality: "VEN", type: "sprinter", isYoung: false },
      { name: "Joel Nicolau", age: 28, nationality: "ESP", type: "breakaway", isYoung: false },
      { name: "Abel Balderstone", age: 25, nationality: "ESP", type: "clinger", isYoung: true },
      { name: "Julen Amezqueta", age: 32, nationality: "ESP", type: "clinger", isYoung: false }
    ]
  },
  {
    id: 10,
    name: "Pinarello–Q36.5 Pro Cycling Team",
    shortName: "Q36",
    riders: [
      { name: "Tom Pidcock", age: 26, nationality: "GBR", type: "gc", isYoung: false },
      { name: "Jannik Steimle", age: 30, nationality: "GER", type: "flat", isYoung: false },
      { name: "Matteo Badilatti", age: 33, nationality: "SUI", type: "clinger", isYoung: false },
      { name: "Mark Donovan", age: 27, nationality: "GBR", type: "breakaway", isYoung: false },
      { name: "David de la Cruz", age: 37, nationality: "ESP", type: "clinger", isYoung: false },
      { name: "Gianluca Brambilla", age: 38, nationality: "ITA", type: "breakaway", isYoung: false }
    ]
  }
];

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
        status: "Active",
        abandonStage: null,
        abandonReason: null,
        
        gcTime: 0,
        points: 0,
        mountainPoints: 0,
        combativeKms: 0,
        stagesInBreak: 0,
        
        gcHistory: [0],
        rankHistory: [1],
        stageGapsHistory: [0],
        pointsHistory: [0],
        mountainPointsHistory: [0],
        breakStageIds: []
      });
    });
  });
  return riders;
}

export function simulateStage(stageId, riders) {
  // If Stage 1 or 2, inject exact Wikipedia values
  if (stageId === 1) {
    // Stage 1 (TTT Barcelona - Visma wins, Vingegaard takes Lead)
    // Team classification times: UAE (+6"), Red Bull (+15"), EF (+20"), Lidl (+25"), Visma (0), INEOS (+21")
    return riders.map(r => {
      let gap = 0;
      if (r.teamShort === "UAD") gap = 6;
      else if (r.teamShort === "RBH") gap = 15;
      else if (r.teamShort === "EFE") gap = 20;
      else if (r.teamShort === "LTK") gap = 25;
      else if (r.teamShort === "IGD") gap = 21;
      else if (r.teamShort === "DAT") gap = 30;
      else if (r.teamShort === "CJR") gap = 45;
      else if (r.teamShort === "Q36") gap = 40;
      else if (r.teamShort === "SOQ") gap = 15;
      
      const copy = { ...r };
      copy.gcTime = gap;
      copy.gcHistory[1] = gap;
      copy.stageGapsHistory[1] = gap;
      copy.pointsHistory[1] = 0;
      copy.mountainPointsHistory[1] = 0;
      return copy;
    });
  }
  
  if (stageId === 2) {
    // Stage 2 (Tarragona -> Barcelona, Hilly, Isaac del Toro wins)
    // Standings GC after Stage 2:
    // 1. Jonas Vingegaard (Visma) 4h 01' 48"
    // 2. Tadej Pogačar (UAE) +6"
    // 3. Remco Evenepoel (Red Bull) +15"
    // 4. Isaac del Toro (UAE) +16"
    // 5. Juan Ayuso (Lidl-Trek) +19"
    // 6. Paul Seixas (Decathlon) +42"
    // 7. Florian Lipowitz (Red Bull) +45"
    // 8. Tom Pidcock (Q36) +1' 00"
    // Let's set the exact values for these key riders, and approximate others
    const exactGC = {
      "Jonas Vingegaard": 0,
      "Tadej Pogačar": 6,
      "Remco Evenepoel": 15,
      "Isaac del Toro": 16,
      "Juan Ayuso": 19,
      "Paul Seixas": 42,
      "Florian Lipowitz": 45,
      "Tom Pidcock": 60
    };
    
    const exactPoints = {
      "Isaac del Toro": 30,
      "Alex Molenaar": 25,
      "Tadej Pogačar": 25,
      "Remco Evenepoel": 22,
      "Jonas Vingegaard": 19,
      "Mattias Skjelmose": 17,
      "Tobias Johannessen": 15
    };
    
    const exactMountains = {
      "Alex Molenaar": 5,
      "Brandon McNulty": 4,
      "Tadej Pogačar": 1,
      "Richard Carapaz": 1,
      "Matteo Jorgenson": 1,
      "Josh Tarling": 1
    };
    
    return riders.map(r => {
      const copy = { ...r };
      
      // GC Time
      if (exactGC[r.name] !== undefined) {
        copy.gcTime = exactGC[r.name];
      } else {
        // Safe fallback
        if (r.teamShort === "UAD") copy.gcTime = 30;
        else if (r.teamShort === "TVL") copy.gcTime = 90;
        else copy.gcTime = 120 + Math.floor(Math.random() * 60);
      }
      copy.gcHistory[2] = copy.gcTime;
      
      // Points
      copy.points = exactPoints[r.name] || 0;
      copy.pointsHistory[2] = copy.points;
      
      // Mountains
      copy.mountainPoints = exactMountains[r.name] || 0;
      copy.mountainPointsHistory[2] = copy.mountainPoints;
      
      return copy;
    });
  }

  // Stage 3 onwards: standard simulation
  const stage = STAGES.find(s => s.id === stageId);
  if (!stage) return riders;

  const currentActive = riders.filter(r => r.status === "Active");

  // Generate performance scores
  const performanceList = currentActive.map(r => {
    let basePower = Math.random() * 100;
    if (stage.type === "Flat") {
      if (r.type === "sprinter") basePower += 80;
      if (r.type === "flat") basePower += 30;
    } else if (stage.type === "Mountain") {
      if (r.type === "gc") basePower += 80;
      if (r.type === "clinger") basePower += 50;
      if (r.type === "sprinter") basePower -= 60;
    } else if (stage.type === "Hilly") {
      if (r.type === "breakaway") basePower += 70;
      if (r.type === "gc") basePower += 50;
    } else if (stage.type === "ITT") {
      if (r.type === "gc") basePower += 60;
      if (r.type === "flat") basePower += 40;
    } else if (stage.type === "TTT") {
      const teamStrength = {
        "TVL": 95, "UAD": 90, "RBH": 85, "IGD": 80, "LTK": 78, "DAT": 70, "EFE": 72, "SOQ": 75, "CJR": 50, "Q36": 55
      };
      basePower = teamStrength[r.teamShort] || 50;
      basePower += Math.random() * 10;
    }

    if (r.name === "Tadej Pogačar" || r.name === "Jonas Vingegaard") {
      if (stage.type === "Mountain" || stage.type === "ITT" || stage.type === "Hilly") {
        basePower += 25;
      }
    }
    return { rider: r, power: basePower };
  });

  performanceList.sort((a, b) => b.power - a.power);

  // Time gaps calculation
  const winnerPower = performanceList[0].power;
  performanceList.forEach((perf, index) => {
    let secondsLost = 0;
    if (stage.type === "Mountain") {
      secondsLost = Math.floor((winnerPower - perf.power) * 8);
    } else if (stage.type === "Hilly") {
      secondsLost = Math.floor((winnerPower - perf.power) * 4);
    } else if (stage.type === "Flat") {
      secondsLost = index > 15 ? Math.floor((winnerPower - perf.power) * 1.5) : 0;
    } else if (stage.type === "ITT") {
      secondsLost = Math.floor((winnerPower - perf.power) * 3);
    }
    if (secondsLost < 0) secondsLost = 0;
    perf.rider.gcTime += secondsLost;
    perf.rider.stageGapsHistory[stageId] = secondsLost;
  });

  // Award Points
  if (stage.type === "Flat") {
    const pts = [50, 30, 20, 18, 16, 14, 12, 10, 8, 7];
    performanceList.slice(0, 10).forEach((perf, idx) => {
      perf.rider.points += pts[idx];
    });
  } else {
    const pts = [30, 25, 22, 19, 17, 15, 13, 11, 9, 7];
    performanceList.slice(0, 10).forEach((perf, idx) => {
      perf.rider.points += pts[idx];
    });
  }

  // Award Mountain Points
  if (stage.climbs && stage.climbs.length > 0) {
    stage.climbs.forEach(climb => {
      let pts = [1];
      if (climb.category === "hc") pts = [20, 15, 12, 10, 8, 6, 4, 2];
      else if (climb.category === "c1") pts = [10, 8, 6, 4, 2, 1];
      else if (climb.category === "c2") pts = [5, 3, 2, 1];
      else if (climb.category === "c3") pts = [2, 1];

      // Distribute to top active climbing specialists
      const climbers = performanceList
        .filter(p => p.rider.type === "gc" || p.rider.type === "clinger" || p.rider.type === "breakaway")
        .slice(0, pts.length);
      climbers.forEach((perf, idx) => {
        perf.rider.mountainPoints += pts[idx];
      });
    });
  }

  // Update history tracks
  riders.forEach(r => {
    if (r.status === "Active") {
      r.gcHistory[stageId] = r.gcTime;
      r.pointsHistory[stageId] = r.points;
      r.mountainPointsHistory[stageId] = r.mountainPoints;
    } else {
      r.gcHistory[stageId] = r.gcHistory[stageId - 1];
      r.pointsHistory[stageId] = r.pointsHistory[stageId - 1];
      r.mountainPointsHistory[stageId] = r.mountainPointsHistory[stageId - 1];
    }
  });

  // Re-calculate ranks
  const sortedActive = [...riders]
    .filter(r => r.status === "Active")
    .sort((a, b) => a.gcTime - b.gcTime);
  sortedActive.forEach((r, idx) => {
    r.rankHistory[stageId] = idx + 1;
  });

  return riders;
}
