import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo, useRef } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { STAGES, initRiderState, simulateStage, formatGCTime } from './data.js';

const html = htm.bind(h);

function App() {
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStageId, setCurrentStageId] = useState(0); // 0 means race hasn't started yet
  const [selectedStageId, setSelectedStageId] = useState(1);
  
  // Database State
  const [riders, setRiders] = useState(() => initRiderState());

  // User Authentication & Session States
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('tdf2026_auth_token'));

  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null);
      return;
    }
    const fetchMe = async () => {
      try {
        const apiHost = window.location.port === '5000' || window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
        const res = await fetch(`${apiHost}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          setAuthToken(null);
          localStorage.removeItem('tdf2026_auth_token');
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      }
    };
    fetchMe();
  }, [authToken]);
  
  // Filter for GC Chart
  const [selectedGCRiders, setSelectedGCRiders] = useState({});

  // Live Sync States
  const [liveSync, setLiveSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Poll server for live scraped data if sync is enabled
  useEffect(() => {
    if (!liveSync) return;

    const fetchLiveData = async () => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const apiHost = window.location.port === '5000' || window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
        const res = await fetch(`${apiHost}/api/results`);
        if (!res.ok) throw new Error('API server returned error');
        const data = await res.json();
        
        // Merge API data
        if (data.riders && data.riders.length > 0) {
          // Map incoming API riders to full client-side state
          const updated = initRiderState().map(initialRider => {
            const liveMatch = data.riders.find(lr => lr.name.toLowerCase() === initialRider.name.toLowerCase() || 
                                                     initialRider.name.toLowerCase().includes(lr.name.toLowerCase()) || 
                                                     lr.name.toLowerCase().includes(initialRider.name.toLowerCase()));
            if (liveMatch) {
              return {
                ...initialRider,
                gcTime: liveMatch.gcTime || 0,
                points: liveMatch.points || 0,
                mountainPoints: liveMatch.mountainPoints || 0,
                status: liveMatch.status || 'Active',
                abandonStage: liveMatch.abandonStage || null,
                abandonReason: liveMatch.abandonReason || null,
                gcHistory: liveMatch.gcHistory || initialRider.gcHistory,
                rankHistory: liveMatch.rankHistory || initialRider.rankHistory,
                stageGapsHistory: liveMatch.stageGapsHistory || initialRider.stageGapsHistory,
                pointsHistory: liveMatch.pointsHistory || initialRider.pointsHistory,
                mountainPointsHistory: liveMatch.mountainPointsHistory || initialRider.mountainPointsHistory
              };
            }
            return initialRider;
          });
          setRiders(updated);
        }
        if (typeof data.currentStage === 'number') {
          setCurrentStageId(data.currentStage);
        }
      } catch (err) {
        console.error(err);
        setSyncError('Failed to connect to Codespace API server (http://localhost:3001)');
      } finally {
        setIsSyncing(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [liveSync]);

  // Theme Toggle Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Set default selected stage to current active stage
  useEffect(() => {
    if (currentStageId > 0 && currentStageId <= 21) {
      setSelectedStageId(currentStageId);
    }
  }, [currentStageId]);

  // Handle manual simulation step
  const handleSimulateStage = () => {
    if (currentStageId >= 21) return;
    const nextStage = currentStageId + 1;
    
    // Simulate
    const updatedRiders = simulateStage(nextStage, [...riders]);
    setRiders(updatedRiders);
    setCurrentStageId(nextStage);
  };

  // Reset simulation
  const handleReset = () => {
    setRiders(initRiderState());
    setCurrentStageId(0);
    setSelectedStageId(1);
    setLiveSync(false);
    setSyncError(null);
  };

  // Derived Leaders
  const leaders = useMemo(() => {
    const active = riders.filter(r => r.status === 'Active');
    if (active.length === 0) return {};

    // Yellow: Lowest gcTime
    const yellow = [...active].sort((a, b) => a.gcTime - b.gcTime)[0];
    
    // Green: Highest sprint points
    const green = [...active].sort((a, b) => b.points - a.points)[0];
    
    // Polka: Highest mountain points
    const polka = [...active].sort((a, b) => b.mountainPoints - a.mountainPoints)[0];
    
    // White: Best young rider (isYoung = true)
    const youngRiders = active.filter(r => r.isYoung);
    const white = youngRiders.length > 0 ? [...youngRiders].sort((a, b) => a.gcTime - b.gcTime)[0] : null;

    return { yellow, green, polka, white };
  }, [riders]);

  // Top 20 GC Riders for GC chart and selection list
  const top20GC = useMemo(() => {
    const active = riders.filter(r => r.status === 'Active');
    return [...active].sort((a, b) => a.gcTime - b.gcTime).slice(0, 20);
  }, [riders]);

  // Initialize GC Chart Selection with top 5 riders
  useEffect(() => {
    if (top20GC.length > 0 && Object.keys(selectedGCRiders).length === 0) {
      const initial = {};
      top20GC.slice(0, 5).forEach(r => {
        initial[r.name] = true;
      });
      setSelectedGCRiders(initial);
    }
  }, [top20GC]);

  const toggleRiderGCFilter = (name) => {
    setSelectedGCRiders(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Render Theme Toggle Icon
  const themeIcon = theme === 'light' 
    ? html`<i class="lucide-moon"></i>` 
    : html`<i class="lucide-sun"></i>`;

  return html`
    <div class="app-container">
      
      <header class="header">
        <div class="logo-container">
          <div class="logo-badge">TDF</div>
          <span class="logo-text">Tour de France <span class="logo-year">2026</span></span>
        </div>
        <nav class="nav-links">
          <button class="nav-tab ${activeTab === 'overview' ? 'active' : ''}" onClick=${() => setActiveTab('overview')}>
            <i class="lucide-activity"></i> Overview
          </button>
          <button class="nav-tab ${activeTab === 'stages' ? 'active' : ''}" onClick=${() => setActiveTab('stages')}>
            <i class="lucide-milestone"></i> Stages
          </button>
          <button class="nav-tab ${activeTab === 'riders' ? 'active' : ''}" onClick=${() => setActiveTab('riders')}>
            <i class="lucide-users"></i> Riders & Teams
          </button>
          <button class="nav-tab ${activeTab === 'breakaway' ? 'active' : ''}" onClick=${() => setActiveTab('breakaway')}>
            <i class="lucide-flame"></i> Breakaway
          </button>
          <button class="nav-tab ${activeTab === 'visuals' ? 'active' : ''}" onClick=${() => setActiveTab('visuals')}>
            <i class="lucide-trending-up"></i> Visualizations
          </button>
          <button class="nav-tab ${activeTab === 'fantasy' ? 'active' : ''}" onClick=${() => setActiveTab('fantasy')}>
            <i class="lucide-trophy"></i> Fantasy TDF
          </button>
        </nav>
        <div class="nav-controls">
          <button class="theme-toggle-btn" onClick=${() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            ${themeIcon}
          </button>
        </div>
      </header>

      
      <main class="main-content">
        
        <div class="simulator-banner">
          <div class="sim-info">
            <h2>Stage Control Panel ${currentStageId > 0 ? html`<span class="sim-badge">Race Active</span>` : html`<span class="sim-badge">Pre-Race</span>`}</h2>
            <p>
              ${currentStageId === 0 
                ? "The Tour hasn't started. The Grand Départ kicks off in Barcelona!" 
                : currentStageId === 21 
                  ? "The Tour has finished in Paris!" 
                  : `Currently completed Stage ${currentStageId} of 21. Next up: ${STAGES[currentStageId]?.name || 'Finished'}`}
            </p>
          </div>
          <div class="sim-controls" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            
            <button 
              class="btn-reset" 
              style=${liveSync ? "background-color: var(--jersey-green); border-color: var(--jersey-green); color: #FFFFFF;" : ""}
              onClick=${() => setLiveSync(!liveSync)}
            >
              <i class="lucide-refresh-cw"></i> ${liveSync ? (isSyncing ? "Syncing..." : "Live Sync: ON") : "Enable Codespace Live Sync"}
            </button>

            ${!liveSync && currentStageId < 21 && html`
              <button class="btn-sim" onClick=${handleSimulateStage}>
                <i class="lucide-play"></i> Simulate Next Stage
              </button>
            `}
            ${currentStageId > 0 && html`
              <button class="btn-reset" onClick=${handleReset}>
                Reset Race
              </button>
            `}
          </div>
        </div>

        
        ${liveSync && syncError && html`
          <div style="background-color: rgba(239, 68, 68, 0.15); border: 1px solid var(--jersey-polka); border-radius: 8px; color: var(--jersey-polka); padding: 0.75rem 1.25rem; margin-bottom: 2rem; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
            <i class="lucide-alert-triangle"></i>
            <span>${syncError}</span>
          </div>
        `}

        
        ${activeTab === 'overview' && html`<${OverviewTab} currentStageId=${currentStageId} leaders=${leaders} riders=${riders} setActiveTab=${setActiveTab} setSelectedStageId=${setSelectedStageId} />`}
        ${activeTab === 'stages' && html`<${StagesTab} currentStageId=${currentStageId} selectedStageId=${selectedStageId} setSelectedStageId=${setSelectedStageId} />`}
        ${activeTab === 'riders' && html`<${RidersTab} riders=${riders} leaders=${leaders} />`}
        ${activeTab === 'breakaway' && html`<${BreakawayTab} riders=${riders} />`}
        ${activeTab === 'visuals' && html`
          <${VisualsTab} 
            riders=${riders} 
            top20GC=${top20GC} 
            selectedGCRiders=${selectedGCRiders} 
            toggleRiderGCFilter=${toggleRiderGCFilter} 
            currentStageId=${currentStageId}
          />
        `}
        ${activeTab === 'fantasy' && html`
          <${FantasyTab} 
            currentStageId=${currentStageId} 
            riders=${riders} 
            leaders=${leaders} 
            currentUser=${currentUser}
            setCurrentUser=${setCurrentUser}
            authToken=${authToken}
            setAuthToken=${setAuthToken}
          />
        `}
      </main>

      <footer class="footer">
        <p>© 2026 Tour de France Simulator Tracker. Designed for maximum elegance & stats tracking.</p>
      </footer>
    </div>
  `;
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

// OVERVIEW TAB
function OverviewTab({ currentStageId, leaders, riders, setActiveTab, setSelectedStageId }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Stats
  const activeCount = riders.filter(r => r.status === 'Active').length;
  const abandonedCount = riders.filter(r => r.status === 'Abandoned').length;

  const getPoints = () => {
    return STAGES.map(s => {
      const x = 150 + (s.mapboxCoords.start[0] + 1) * 75;
      const y = 350 - (s.mapboxCoords.start[1] - 40) * 35;
      return { x, y, stage: s.id, name: s.name, stageObj: s };
    });
  };

  const handleMouseMove = (e) => {
    if (!mapContainer.current) return;
    const rect = mapContainer.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 800;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 400;

    const points = getPoints();
    let found = null;
    for (const pt of points) {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist < 15) {
        found = pt.stageObj;
        break;
      }
    }
    setHoveredStage(found);
    if (found) {
      // Calculate tooltip position clamped inside bounds
      const tipWidth = 260;
      const tipHeight = 150;
      let xPos = e.clientX - rect.left + 15;
      let yPos = e.clientY - rect.top - 180;
      
      if (xPos + tipWidth > rect.width) {
        xPos = e.clientX - rect.left - tipWidth - 15;
      }
      if (yPos < 0) {
        yPos = e.clientY - rect.top + 15;
      }
      
      setTooltipPos({ x: xPos, y: yPos });
    }
  };

  const handleMouseLeave = () => {
    setHoveredStage(null);
  };

  const handleMapClick = () => {
    if (hoveredStage) {
      setSelectedStageId(hoveredStage.id);
      setActiveTab('stages');
    }
  };

  const miniElevationY = (x, type, name) => {
    const i = (x / 200) * 10;
    let y = 45;
    if (type === "Mountain") {
      y = 45 - Math.sin((i / 10) * Math.PI) * 25 - (Math.floor(i) % 3 === 0 ? 8 : 0);
    } else if (type === "Hilly") {
      y = 45 - Math.sin((i / 10) * Math.PI) * 15 - (Math.floor(i) % 2 === 0 ? 4 : 0);
    } else if (type === "Flat") {
      y = 45 - Math.sin((i / 10) * Math.PI) * 4;
    }
    if (name.toLowerCase().includes("summit") && x > 170) {
      y = 12;
    } else if (name.toLowerCase().includes("alpe d'huez") && x > 170) {
      y = 12;
    }
    return y;
  };

  const drawMiniElevation = (stage) => {
    let points = [];
    points.push("M 0 50");
    for (let x = 0; x <= 200; x += 10) {
      points.push(`L ${x} ${miniElevationY(x, stage.type, stage.name)}`);
    }
    const pathData = points.join(" ");
    const areaData = pathData + " L 200 50 L 0 50 Z";
    return html`
      <svg viewBox="0 0 200 50" style="width: 100%; height: 50px; overflow: visible; margin-top: 0.25rem;">
        <defs>
          <linearGradient id="miniElevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--tdf-yellow)" stop-opacity="0.6" />
            <stop offset="100%" stop-color="var(--tdf-yellow)" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        <path d=${areaData} fill="url(#miniElevGrad)" />
        <path d=${pathData} fill="none" stroke="var(--tdf-yellow)" stroke-width="2" />
      </svg>
    `;
  };

  const [mapboxToken, setMapboxToken] = useState(() => localStorage.getItem('tdf2026_mapbox_token') || '');
  const [pitch, setPitch] = useState(50);
  const [bearing, setBearing] = useState(-20);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    if (typeof window.mapboxgl === 'undefined') {
      console.warn("Mapbox GL JS is not available.");
      return;
    }

    try {
      window.mapboxgl.accessToken = mapboxToken;
      const map = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [2.5, 46.5],
        zoom: 5,
        pitch: pitch,
        bearing: bearing
      });

      mapRef.current = map;

      // Add navigation controls
      map.addControl(new window.mapboxgl.NavigationControl(), 'top-left');
      map.addControl(new window.mapboxgl.FullscreenControl(), 'top-left');

      map.on('style.load', () => {
        // Add DEM source for terrain extrusion
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });

        // Add visual Sky layer
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // Add 3D GeoJSON Route Lines
        STAGES.forEach(s => {
          const isCompleted = s.id <= currentStageId;
          const isActive = s.id === currentStageId + 1;
          const color = isActive ? '#FFE500' : (isCompleted ? '#10B981' : '#9CA3AF');
          const opacity = isActive ? 1.0 : (isCompleted ? 0.75 : 0.35);
          const width = isActive ? 6 : (isCompleted ? 4 : 3);

          map.addSource(`route-${s.id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [s.mapboxCoords.start, s.mapboxCoords.finish]
              }
            }
          });

          map.addLayer({
            id: `route-layer-${s.id}`,
            type: 'line',
            source: `route-${s.id}`,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': color,
              'line-width': width,
              'line-opacity': opacity
            }
          });
        });
      });

      // Add Markers
      STAGES.forEach(s => {
        const isCompleted = s.id <= currentStageId;
        const isActive = s.id === currentStageId + 1;

        const el = document.createElement('div');
        el.className = 'stage-marker';
        el.style.width = isActive ? '14px' : '8px';
        el.style.height = isActive ? '14px' : '8px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = isActive ? '#FFE500' : (isCompleted ? '#10B981' : '#9CA3AF');
        el.style.border = '2px solid #FFFFFF';
        el.style.cursor = 'pointer';
        el.style.boxShadow = isActive ? '0 0 10px #FFE500' : '0 2px 4px rgba(0,0,0,0.3)';

        // Bind interactive tooltips
        el.addEventListener('mouseenter', () => {
          setHoveredStage(s);
          const pos = map.project(s.mapboxCoords.start);
          setTooltipPos({
            x: pos.x + 15,
            y: pos.y - 120
          });
        });

        el.addEventListener('mouseleave', () => {
          setHoveredStage(null);
        });

        el.addEventListener('mousemove', () => {
          const pos = map.project(s.mapboxCoords.start);
          setTooltipPos({
            x: pos.x + 15,
            y: pos.y - 120
          });
        });

        el.addEventListener('click', () => {
          setSelectedStageId(s.id);
          setActiveTab('stages');
        });

        new window.mapboxgl.Marker(el)
          .setLngLat(s.mapboxCoords.start)
          .addTo(map);
      });

      // Zoom focus to active stage
      const activeStage = STAGES.find(s => s.id === currentStageId + 1) || STAGES[0];
      if (activeStage) {
        map.flyTo({
          center: activeStage.mapboxCoords.start,
          zoom: 5.5,
          pitch: pitch,
          bearing: bearing,
          essential: true
        });
      }

      return () => {
        map.remove();
      };
    } catch (err) {
      console.error("Mapbox init failed:", err);
    }
  }, [mapboxToken, currentStageId]);

  // Sync range slider settings
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setPitch(pitch);
    }
  }, [pitch]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setBearing(bearing);
    }
  }, [bearing]);

  const setMapPreset = (p, b) => {
    setPitch(p);
    setBearing(b);
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: p,
        bearing: b,
        duration: 1000
      });
    }
  };

  const handleTokenChange = (e) => {
    const newToken = e.target.value.trim();
    setMapboxToken(newToken);
    localStorage.setItem('tdf2026_mapbox_token', newToken);
  };

  return html`
    <div>
      
      <div class="jerseys-container">
        
        <div class="dashboard-card jersey-hero-card yellow-hero" style="--jersey-yellow: 1;">
          <svg class="jersey-floating-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 40 10 Q 50 20 60 10 L 65 15 Q 50 30 35 15 Z" fill="#111" />
            <path d="M 35 15 L 20 25 L 25 40 L 32 35 L 32 90 L 68 90 L 68 35 L 75 40 L 80 25 L 65 15 Q 50 25 35 15 Z" fill="var(--jersey-yellow)" stroke="#111" stroke-width="2" />
            <line x1="50" y1="22" x2="50" y2="90" stroke="#111" stroke-width="1.5" stroke-dasharray="2 2" />
          </svg>
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot yellow active-holder"></span> Maillot Jaune</span>
            <span class="badge-jersey-holder badge-yellow">GC Leader</span>
          </div>
          <h3 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display); line-height: 1.2;">${leaders.yellow?.name || 'No Leader Yet'}</h3>
          <div>
            <p class="mt-2" style="font-size: 0.85rem; color: var(--text-secondary);">
              Team: <strong>${leaders.yellow?.teamName || '-'}</strong>
            </p>
            <p class="mt-2" style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">
              Time: ${leaders.yellow ? formatGCTime(leaders.yellow.gcTime) : '-'}
            </p>
          </div>
        </div>

        
        <div class="dashboard-card jersey-hero-card green-hero" style="--jersey-green: 1;">
          <svg class="jersey-floating-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 40 10 Q 50 20 60 10 L 65 15 Q 50 30 35 15 Z" fill="#111" />
            <path d="M 35 15 L 20 25 L 25 40 L 32 35 L 32 90 L 68 90 L 68 35 L 75 40 L 80 25 L 65 15 Q 50 25 35 15 Z" fill="var(--jersey-green)" stroke="#111" stroke-width="2" />
            <line x1="50" y1="22" x2="50" y2="90" stroke="#111" stroke-width="1.5" stroke-dasharray="2 2" />
          </svg>
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot green active-holder"></span> Maillot Vert</span>
            <span class="badge-jersey-holder badge-green">Points</span>
          </div>
          <h3 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display); line-height: 1.2;">${leaders.green?.name || 'No Leader Yet'}</h3>
          <div>
            <p class="mt-2" style="font-size: 0.85rem; color: var(--text-secondary);">
              Team: <strong>${leaders.green?.teamName || '-'}</strong>
            </p>
            <p class="mt-2" style="font-size: 1.1rem; font-weight: 800; color: var(--jersey-green);">
              Points: ${leaders.green?.points || 0} pts
            </p>
          </div>
        </div>

        
        <div class="dashboard-card jersey-hero-card polka-hero" style="--jersey-polka: 1;">
          <svg class="jersey-floating-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 40 10 Q 50 20 60 10 L 65 15 Q 50 30 35 15 Z" fill="#111" />
            <path d="M 35 15 L 20 25 L 25 40 L 32 35 L 32 90 L 68 90 L 68 35 L 75 40 L 80 25 L 65 15 Q 50 25 35 15 Z" fill="#FFFFFF" stroke="#111" stroke-width="2" />
            <circle cx="35" cy="30" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="50" cy="30" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="65" cy="30" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="42" cy="45" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="58" cy="45" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="35" cy="60" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="50" cy="60" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="65" cy="60" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="42" cy="75" r="3.5" fill="var(--jersey-polka)" />
            <circle cx="58" cy="75" r="3.5" fill="var(--jersey-polka)" />
            <line x1="50" y1="22" x2="50" y2="90" stroke="#111" stroke-width="1.5" stroke-dasharray="2 2" />
          </svg>
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot polka active-holder"></span> Maillot à Pois</span>
            <span class="badge-jersey-holder badge-polka">Mountains</span>
          </div>
          <h3 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display); line-height: 1.2;">${leaders.polka?.name || 'No Leader Yet'}</h3>
          <div>
            <p class="mt-2" style="font-size: 0.85rem; color: var(--text-secondary);">
              Team: <strong>${leaders.polka?.teamName || '-'}</strong>
            </p>
            <p class="mt-2" style="font-size: 1.1rem; font-weight: 800; color: var(--jersey-polka);">
              Points: ${leaders.polka?.mountainPoints || 0} pts
            </p>
          </div>
        </div>

        
        <div class="dashboard-card jersey-hero-card white-hero">
          <svg class="jersey-floating-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 40 10 Q 50 20 60 10 L 65 15 Q 50 30 35 15 Z" fill="#111" />
            <path d="M 35 15 L 20 25 L 25 40 L 32 35 L 32 90 L 68 90 L 68 35 L 75 40 L 80 25 L 65 15 Q 50 25 35 15 Z" fill="#FFFFFF" stroke="var(--jersey-white-border)" stroke-width="2" />
            <line x1="50" y1="22" x2="50" y2="90" stroke="#ccc" stroke-width="1.5" stroke-dasharray="2 2" />
          </svg>
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot white active-holder"></span> Maillot Blanc</span>
            <span class="badge-jersey-holder badge-white">Young Rider</span>
          </div>
          <h3 style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-display); line-height: 1.2;">${leaders.white?.name || 'No Leader Yet'}</h3>
          <div>
            <p class="mt-2" style="font-size: 0.85rem; color: var(--text-secondary);">
              Team: <strong>${leaders.white?.teamName || '-'}</strong>
            </p>
            <p class="mt-2" style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">
              Time: ${leaders.white ? formatGCTime(leaders.white.gcTime) : '-'}
            </p>
          </div>
        </div>
      </div>

      
      <div class="stages-wrapper">
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="dashboard-card">
            <h3>Race Status</h3>
            <div class="mt-4" style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span>Riders Started:</span>
              <strong>60</strong>
            </div>
            <div class="mt-2" style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span>Riders Active:</span>
              <span style="color: var(--jersey-green); font-weight: 700;">${activeCount}</span>
            </div>
            <div class="mt-2" style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span>Riders Abandoned:</span>
              <span style="color: var(--jersey-polka); font-weight: 700;">${abandonedCount}</span>
            </div>
          </div>

          <div class="dashboard-card">
            <h3>TDF 2026 Route Facts</h3>
            <p class="mt-2" style="font-size: 0.9rem; color: var(--text-secondary)">
              Grand Départ starting in <strong>Barcelona, Spain</strong>. The race features 8 high mountain stages, including summit finishes on Puy de Dôme and Alpe d'Huez.
            </p>
            <div class="mt-4" style="background-color: var(--bg-tertiary); padding: 0.75rem; border-radius: 6px; font-size: 0.85rem;">
              <strong>Stage 1 Route:</strong> Barcelona Team Time Trial (19.7 km)
            </div>
          </div>
        </div>

        <div class="dashboard-card" style="padding: 1rem;">
          <div class="card-header" style="margin-bottom: 0.5rem; border-bottom: none; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="card-title"><i class="lucide-map"></i> 2026 Interactive Stage Route Map (3D Terrain)</h3>
          </div>
          
          <div class="mapbox-container">
            
            <div ref=${mapContainer} class="map-viewport"></div>
            
            ${!mapboxToken && html`
              <div class="map-placeholder-text" style="width: 80%; max-width: 500px;">
                <h4 style="color: var(--jersey-polka); font-family: var(--font-display);"><i class="lucide-alert-triangle"></i> 3D Mapbox Activation Required</h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem; line-height: 1.4;">
                  A public Mapbox access token is required to load the high-fidelity 3D satellite and roads map of Europe. 
                </p>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem; line-height: 1.4;">
                  Please paste a Mapbox access token into the input field at the top-right of this card (e.g. starting with <code>pk.eyJ1...</code>). It will be saved securely in your browser's local cache.
                </p>
              </div>
            `}
            
            
            <div class="mapbox-token-prompt">
              <span>Token:</span>
              <input 
                type="text" 
                class="mapbox-token-input" 
                value=${mapboxToken} 
                onChange=${handleTokenChange} 
                placeholder="Paste Mapbox Token..." 
                title="Input your public Mapbox Token"
              />
            </div>

            
            <div class="map-controls-toolbar">
              <div class="map-control-group">
                <label>Tilt Angle:</label>
                <input 
                  type="range" 
                  class="map-slider" 
                  min="0" 
                  max="80" 
                  value=${pitch} 
                  onInput=${(e) => setPitch(parseInt(e.target.value))} 
                />
                <span style="font-weight: 700; font-size: 0.75rem;">${pitch}°</span>
              </div>
              
              <div class="map-control-group">
                <label>Pivot Direction:</label>
                <input 
                  type="range" 
                  class="map-slider" 
                  min="-180" 
                  max="180" 
                  value=${bearing} 
                  onInput=${(e) => setBearing(parseInt(e.target.value))} 
                />
                <span style="font-weight: 700; font-size: 0.75rem;">${bearing}°</span>
              </div>

              <div class="map-control-group" style="gap: 0.25rem;">
                <button class="btn-map-preset" onClick=${() => setMapPreset(60, -45)}>
                  3D Alps Preset
                </button>
                <button class="btn-map-preset" onClick=${() => setMapPreset(0, 0)}>
                  Flat 2D View
                </button>
              </div>
            </div>

            
            ${hoveredStage && html`
              <div class="map-tooltip visible" style="left: ${tooltipPos.x}px; top: ${tooltipPos.y}px;">
                <div style="font-weight: 800; font-size: 0.85rem; font-family: var(--font-display);">
                  Stage ${hoveredStage.id}: ${hoveredStage.name}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
                  <span>Type: <strong>${hoveredStage.type}</strong></span>
                  <span>Dist: <strong>${hoveredStage.distance} km</strong></span>
                </div>
                ${drawMiniElevation(hoveredStage)}
                <div style="font-size: 0.7rem; color: var(--tdf-yellow); font-weight: 600; text-align: center; margin-top: 0.25rem;">
                  Click to view full Stage Details
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

// STAGES TAB
function StagesTab({ currentStageId, selectedStageId, setSelectedStageId }) {
  const [hoveredClimbIndex, setHoveredClimbIndex] = useState(null);

  const selectedStage = useMemo(() => {
    return STAGES.find(s => s.id === selectedStageId) || STAGES[0];
  }, [selectedStageId]);

  // Elevation Profile coordinate helper
  const getElevationY = (x, type, name) => {
    const i = (x / 500) * 10;
    let y = 120;
    if (type === "Mountain") {
      y = 120 - Math.sin((i / 10) * Math.PI) * 80 - (Math.floor(i) % 3 === 0 ? 30 : 0);
    } else if (type === "Hilly") {
      y = 120 - Math.sin((i / 10) * Math.PI) * 40 - (Math.floor(i) % 2 === 0 ? 15 : 0);
    } else if (type === "Flat") {
      y = 120 - Math.sin((i / 10) * Math.PI) * 10;
    }
    
    // Final climb height adjustment for summit finishes
    if (name.toLowerCase().includes("summit") && x > 440) {
      y = 20;
    } else if (name.toLowerCase().includes("alpe d'huez") && x > 440) {
      y = 20;
    }
    return y;
  };

  return html`
    <div class="stages-wrapper">
      
      <div class="stages-list">
        <h3 class="mb-4" style="padding: 0 0.5rem;">21 Stages</h3>
        ${STAGES.map(s => {
          let statusLabel = "";
          let className = "stage-list-item";
          if (s.id === currentStageId + 1) {
            className += " current";
            statusLabel = "Next Up";
          } else if (s.id <= currentStageId) {
            className += " completed";
            statusLabel = "Completed";
          } else {
            statusLabel = "Upcoming";
          }

          if (s.id === selectedStageId) {
            className += " selected";
          }

          return html`
            <div class=${className} onClick=${() => setSelectedStageId(s.id)}>
              <div>
                <span class="stage-badge-small mr-2">St. ${s.id}</span>
                <strong style="margin-left: 0.5rem;">${s.type}</strong>
              </div>
              <div style="font-size: 0.8rem; text-align: right;">
                <div>${s.distance} km</div>
                <div style="color: var(--text-secondary);">${statusLabel}</div>
              </div>
            </div>
          `;
        })}
      </div>

      
      <div class="stage-profile-detail">
        <div>
          <h2>Stage ${selectedStage.id}: ${selectedStage.name}</h2>
          <p class="mt-2" style="color: var(--text-secondary); font-size: 1rem;">
            ${selectedStage.description}
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 8px;">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Distance</span>
            <h3 style="font-size: 1.5rem;">${selectedStage.distance} km</h3>
          </div>
          <div style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 8px;">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Total Elevation Gain</span>
            <h3 style="font-size: 1.5rem;">${selectedStage.elevation} m</h3>
          </div>
          <div style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 8px;">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Breakaway Success Chance</span>
            <h3 style="font-size: 1.5rem; color: var(--tdf-yellow-hover);">${selectedStage.breakawayRating}/10</h3>
          </div>
        </div>

        
        <div>
          <h3>Elevation Profile</h3>
          <div class="elevation-chart-container" style="display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <svg viewBox="0 0 500 150" style="width: 100%; height: 100%; overflow: visible;">
              
              <defs>
                <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--tdf-yellow)" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="var(--tdf-yellow)" stop-opacity="0.0" />
                </linearGradient>
              </defs>
              
              
              ${(() => {
                let points = [];
                points.push("M 0 130");
                for(let i=1; i<=10; i++) {
                  const x = (500 / 10) * i;
                  const y = getElevationY(x, selectedStage.type, selectedStage.name);
                  points.push(`L ${x} ${y}`);
                }
                const pathData = points.join(" ");
                const areaData = pathData + " L 500 150 L 0 150 Z";

                return html`
                  <path d=${areaData} fill="url(#elevationGrad)" />
                  <path d=${pathData} fill="none" stroke="var(--tdf-yellow)" stroke-width="3" />
                `;
              })()}

              
              ${selectedStage.climbs.map((climb, idx) => {
                const totalClimbs = selectedStage.climbs.length;
                // Distribute climbs across middle X axis (e.g. 20% to 90%)
                const x = 80 + (idx / Math.max(1, totalClimbs - 1)) * 340;
                const pathY = getElevationY(x, selectedStage.type, selectedStage.name);
                // Flag height goes upward
                const flagTopY = pathY - 35;
                const isHovered = hoveredClimbIndex === idx;

                let badgeColor = "#10B981"; // default green
                if (climb.category === "hc") badgeColor = "#000000";
                else if (climb.category === "c1") badgeColor = "#EF4444";
                else if (climb.category === "c2") badgeColor = "#F59E0B";
                else if (climb.category === "c3") badgeColor = "#3B82F6";

                return html`
                  <g 
                    onMouseEnter=${() => setHoveredClimbIndex(idx)}
                    onMouseLeave=${() => setHoveredClimbIndex(null)}
                    style="cursor: pointer;"
                  >
                    
                    <line 
                      x1=${x} 
                      y1=${pathY} 
                      x2=${x} 
                      y2=${flagTopY} 
                      stroke=${isHovered ? "var(--tdf-yellow)" : "var(--text-secondary)"} 
                      stroke-width=${isHovered ? 2 : 1} 
                    />
                    
                    
                    <circle 
                      cx=${x} 
                      cy=${flagTopY} 
                      r="10" 
                      fill=${badgeColor} 
                      stroke=${isHovered ? "var(--text-primary)" : "var(--bg-secondary)"}
                      stroke-width="1.5"
                    />
                    <text 
                      x=${x} 
                      y=${flagTopY + 3} 
                      text-anchor="middle" 
                      fill="#FFFFFF" 
                      font-size="8" 
                      font-weight="bold"
                    >
                      ${climb.category.toUpperCase()}
                    </text>

                    
                    ${isHovered && html`
                      <g transform="translate(${x - 60}, ${flagTopY - 40})">
                        <rect width="120" height="32" rx="4" fill="var(--tdf-charcoal)" opacity="0.95" />
                        <text x="60" y="12" text-anchor="middle" fill="#FFFFFF" font-size="8" font-weight="bold">
                          ${climb.name}
                        </text>
                        <text x="60" y="24" text-anchor="middle" fill="#CCCCCC" font-size="7">
                          ${climb.length}km @ ${climb.grade}%
                        </text>
                      </g>
                    `}
                  </g>
                `;
              })}

              
              <line x1="0" y1="130" x2="500" y2="130" stroke="var(--border-color)" stroke-width="2" />
            </svg>
          </div>
        </div>

        
        <div>
          <h3 class="mb-2">Key Mountain Passes (${selectedStage.climbs.length})</h3>
          <div class="climbs-grid">
            ${selectedStage.climbs.map((climb, idx) => {
              const isHovered = hoveredClimbIndex === idx;
              return html`
                <div 
                  class="climb-card" 
                  style=${isHovered ? "border-color: var(--tdf-yellow); background-color: var(--tdf-yellow-light);" : ""}
                  onMouseEnter=${() => setHoveredClimbIndex(idx)}
                  onMouseLeave=${() => setHoveredClimbIndex(null)}
                >
                  <span class="climb-cat ${climb.category}">${climb.category.toUpperCase()}</span>
                  <h4>${climb.name}</h4>
                  <div class="mt-2" style="font-size: 0.8rem; color: var(--text-secondary)">
                    <div>Length: <strong>${climb.length} km</strong></div>
                    <div>Avg Gradient: <strong>${climb.grade}%</strong></div>
                  </div>
                </div>
              `;
            })}
            ${selectedStage.climbs.length === 0 && html`
              <div style="color: var(--text-secondary); font-size: 0.9rem;">
                No categorized climbs on this stage.
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

// RIDERS & TEAMS TAB
function RidersTab({ riders, leaders }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);

  // Group riders by team and apply filter query
  const teamsMap = useMemo(() => {
    const teams = {};
    const query = searchQuery.toLowerCase().trim();

    riders.forEach(r => {
      const matchesSearch = !query || 
        r.name.toLowerCase().includes(query) || 
        r.teamName.toLowerCase().includes(query) || 
        r.teamShort.toLowerCase().includes(query) || 
        r.type.toLowerCase().includes(query) ||
        r.nationality.toLowerCase().includes(query);

      if (matchesSearch) {
        if (!teams[r.teamName]) {
          teams[r.teamName] = {
            name: r.teamName,
            short: r.teamShort,
            riders: []
          };
        }
        teams[r.teamName].riders.push(r);
      }
    });
    return Object.values(teams);
  }, [riders, searchQuery]);

  const abandonedRiders = useMemo(() => {
    return riders
      .filter(r => r.status === 'Abandoned')
      .sort((a, b) => a.abandonStage - b.abandonStage);
  }, [riders]);

  const getJerseyDotClass = (rider) => {
    if (leaders.yellow?.name === rider.name) return "jersey-dot yellow active-holder";
    if (leaders.green?.name === rider.name) return "jersey-dot green active-holder";
    if (leaders.polka?.name === rider.name) return "jersey-dot polka active-holder";
    if (leaders.white?.name === rider.name) return "jersey-dot white active-holder";
    return "";
  };

  return html`
    <div>
      <h2 class="mb-4">Teams & Roster Status</h2>
      <p class="mb-4" style="color: var(--text-secondary); font-size: 0.95rem;">
        Search for riders, teams, nationalities, or specialties. Click on any rider to view their stage-by-stage placing history modal!
      </p>

      
      <div class="search-container">
        <i class="lucide-search search-icon"></i>
        <input 
          type="text" 
          placeholder="Search riders, teams, specialties, nationalities..." 
          class="search-input"
          value=${searchQuery}
          onInput=${(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div class="teams-container">
        ${teamsMap.map(team => html`
          <div class="team-card">
            <h3 class="team-name">${team.name}</h3>
            <ul class="rider-list">
              ${team.riders.map(rider => html`
                <li class="rider-item" onClick=${() => setSelectedRider(rider)}>
                  <div class="rider-name-box">
                    ${getJerseyDotClass(rider) && html`<span class=${getJerseyDotClass(rider)}></span>`}
                    <span style="font-weight: 500; font-size: 0.9rem;">${rider.name}</span>
                  </div>
                  <span class="rider-status ${rider.status === 'Active' ? 'status-active' : 'status-abandoned'}">
                    ${rider.status === 'Active' ? 'Active' : 'DNF'}
                  </span>

                  
                  <div class="rider-tooltip">
                    <div class="tooltip-header">
                      <span>${rider.name}</span>
                      <span style="font-size: 0.75rem; color: var(--text-secondary);">${rider.teamShort}</span>
                    </div>
                    <div class="tooltip-stat">
                      <span>Status:</span>
                      <span style=${rider.status === 'Abandoned' ? 'color: var(--jersey-polka)' : ''}>
                        ${rider.status === 'Active' ? 'Active' : 'Abandoned'}
                      </span>
                    </div>
                    ${rider.status === 'Abandoned' && html`
                      <div class="tooltip-stat" style="flex-direction: column; align-items: flex-start; gap: 2px;">
                        <span style="font-size: 0.75rem;">Reason (Stage ${rider.abandonStage}):</span>
                        <span style="font-size: 0.75rem; font-style: italic; font-weight: normal; color: var(--jersey-polka)">
                          ${rider.abandonReason}
                        </span>
                      </div>
                    `}
                    ${rider.status === 'Active' && html`
                      <div class="tooltip-stat">
                        <span>Gap to Yellow:</span>
                        <span>${formatGCTime(rider.gcTime)}</span>
                      </div>
                      <div class="tooltip-stat">
                        <span>Sprint Points:</span>
                        <span>${rider.points} pts</span>
                      </div>
                      <div class="tooltip-stat">
                        <span>Mountain Points:</span>
                        <span>${rider.mountainPoints} pts</span>
                      </div>
                      <div class="tooltip-stat">
                        <span>Age:</span>
                        <span>${rider.age} ${rider.isYoung ? ' (Young Rider)' : ''}</span>
                      </div>
                      <div style="font-size: 0.65rem; color: var(--tdf-yellow-hover); margin-top: 4px; text-align: center;">Click to view stats details</div>
                    `}
                  </div>
                </li>
              `)}
            </ul>
          </div>
        `)}
      </div>

      
      ${selectedRider && html`
        <div class="modal-overlay" onClick=${() => setSelectedRider(null)}>
          <div class="modal-content" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div>
                <h2 style="display: flex; align-items: center; gap: 0.5rem;">
                  ${getJerseyDotClass(selectedRider) && html`<span class=${getJerseyDotClass(selectedRider)}></span>`}
                  ${selectedRider.name}
                </h2>
                <p style="color: var(--text-secondary); margin-top: 0.25rem;">
                  ${selectedRider.teamName} (${selectedRider.teamShort})
                </p>
              </div>
              <button class="modal-close" onClick=${() => setSelectedRider(null)}>
                <i class="lucide-x"></i>
              </button>
            </div>
            
            <div class="modal-body">
              <div class="modal-grid">
                
                <div>
                  <h3 class="mb-4"><i class="lucide-user"></i> Rider Profile</h3>
                  <div style="display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--tdf-yellow);">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--text-secondary);">Age:</span>
                      <strong>${selectedRider.age} yrs ${selectedRider.isYoung ? ' (Young Rider Eligibility)' : ''}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--text-secondary);">Nationality:</span>
                      <strong>${selectedRider.nationality}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--text-secondary);">Specialization:</span>
                      <strong style="text-transform: capitalize;">${selectedRider.type}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--text-secondary);">Roster Status:</span>
                      <span style="font-weight: bold; color: ${selectedRider.status === 'Active' ? 'var(--jersey-green)' : 'var(--jersey-polka)'}">
                        ${selectedRider.status === 'Active' ? 'Active Contestant' : `DNF (Retired on Stage ${selectedRider.abandonStage})`}
                      </span>
                    </div>
                    ${selectedRider.status === 'Abandoned' && html`
                      <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Reason:</span>
                        <div style="font-size: 0.8rem; font-style: italic; color: var(--jersey-polka); margin-top: 0.2rem;">
                          ${selectedRider.abandonReason}
                        </div>
                      </div>
                    `}
                  </div>

                  <h3 class="mt-4 mb-2"><i class="lucide-medal"></i> Cumulative Standings</h3>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                      <span>Sprint Contest Points:</span>
                      <strong>${selectedRider.points} pts</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                      <span>Mountain Passes Climbed:</span>
                      <strong>${selectedRider.mountainPoints} pts</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                      <span>Combative Breakaway Kms:</span>
                      <strong>${selectedRider.combativeKms} km (${selectedRider.stagesInBreak || 0} stages)</strong>
                    </div>
                  </div>
                </div>

                
                <div>
                  <h3 class="mb-2"><i class="lucide-trending-up"></i> GC Standing Progress</h3>
                  <p class="mb-4" style="font-size: 0.8rem; color: var(--text-secondary);">Position over stages (lower is better).</p>
                  
                  ${(() => {
                    const cleanHistory = selectedRider.rankHistory.filter(h => h !== null);
                    if (cleanHistory.length < 2) {
                      return html`
                        <div style="text-align: center; padding: 2rem; background: var(--bg-tertiary); border-radius: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                          No stage data simulated yet.
                        </div>
                      `;
                    }

                    // Map history points to SVG coordinates (width=280, height=140)
                    const xLen = cleanHistory.length;
                    const maxRank = Math.max(...cleanHistory, 10);
                    const coords = cleanHistory.map((rank, idx) => {
                      const x = 20 + (idx / (xLen - 1)) * 240;
                      // invert rank representation: rank 1 is at top (y=15), max rank at bottom (y=120)
                      const y = 15 + ((rank - 1) / (maxRank - 1)) * 105;
                      return `${x},${y}`;
                    });

                    return html`
                      <svg viewBox="0 0 280 150" style="border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-tertiary); width: 100%;">
                        
                        <line x1="20" y1="15" x2="260" y2="15" stroke="var(--border-color)" stroke-dasharray="2,2" />
                        <line x1="20" y1="120" x2="260" y2="120" stroke="var(--border-color)" stroke-dasharray="2,2" />
                        
                        
                        <text x="25" y="27" fill="var(--text-secondary)" font-size="8">Rank 1</text>
                        <text x="25" y="115" fill="var(--text-secondary)" font-size="8">Rank ${maxRank}</text>

                        
                        <path d="M ${coords.join(' L ')}" fill="none" stroke="var(--tdf-yellow)" stroke-width="2.5" />
                        
                        
                        ${coords.map((c, idx) => {
                          const [x, y] = c.split(',');
                          return html`
                            <circle cx=${x} cy=${y} r="3" fill="var(--tdf-charcoal)" stroke="var(--tdf-yellow)" stroke-width="1.5" />
                          `;
                        })}
                      </svg>
                    `;
                  })()}

                  <div class="mt-4">
                    <h4 style="font-size: 0.85rem;" class="mb-2">Stage Gaps Log</h4>
                    <div style="max-height: 100px; overflow-y: auto; font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px;">
                      ${selectedRider.stageGapsHistory.map((gap, sIdx) => {
                        if (sIdx === 0) return null;
                        return html`
                          <div style="display: flex; justify-content: space-between; padding: 2px 4px; background: var(--bg-tertiary); border-radius: 4px;">
                            <span>Stage ${sIdx} placing gap:</span>
                            <strong>${gap === 0 ? 'Same time' : `+${gap}s`}</strong>
                          </div>
                        `;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `}
      
      <div class="dashboard-card" style="margin-top: 3rem; border-top: 4px solid var(--jersey-polka)">
        <div class="card-header" style="border-bottom: none; margin-bottom: 0.5rem;">
          <h3 class="card-title" style="color: var(--jersey-polka);"><i class="lucide-heart-off"></i> Chronological DNF Wall (Abandonments)</h3>
        </div>
        <p class="mb-4" style="color: var(--text-secondary); font-size: 0.85rem; padding: 0 0.25rem;">
          Track riders who have withdrawn from the 2026 Tour de France, along with the stage number and specific reason for their abandonment.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${abandonedRiders.map(r => html`
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background-color: var(--bg-tertiary); border-radius: 8px; border-left: 4px solid var(--jersey-polka); flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong>${r.name}</strong> (${r.teamShort}) — <span style="font-size: 0.85rem; color: var(--text-secondary);">${r.teamName}</span>
              </div>
              <div style="text-align: right; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <span class="stage-badge-small" style="background-color: var(--jersey-polka); color: #FFFFFF;">Stage ${r.abandonStage}</span>
                <span style="font-size: 0.85rem; font-style: italic; color: var(--text-secondary);">${r.abandonReason}</span>
              </div>
            </div>
          `)}
          ${abandonedRiders.length === 0 && html`
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary); font-size: 0.9rem;">
              No abandonments recorded yet. All riders are actively competing!
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// BREAKAWAY TAB
function BreakawayTab({ riders }) {
  const [hoveredFlow, setHoveredFlow] = useState(null);

  // Sort riders by combativeKms
  const combativeRiders = useMemo(() => {
    return [...riders].sort((a, b) => b.combativeKms - a.combativeKms).slice(0, 10);
  }, [riders]);

  // Find best breakaway stages
  const breakawayStages = useMemo(() => {
    return [...STAGES].sort((a, b) => b.breakawayRating - a.breakawayRating).slice(0, 5);
  }, []);

  // Compute dynamic Sankey flow data based on current simulated rider breakaway stats
  const stats = useMemo(() => {
    let sprinter = 0, climber = 0, gc = 0, specialist = 0;
    riders.forEach(r => {
      const breaks = r.stagesInBreak || 0;
      if (r.type === 'sprinter') sprinter += breaks;
      else if (r.type === 'clinger') climber += breaks;
      else if (r.type === 'gc') gc += breaks;
      else if (r.type === 'breakaway') specialist += breaks;
    });

    // Fallback counts for pre-race/starting views
    if (sprinter === 0 && climber === 0 && gc === 0 && specialist === 0) {
      sprinter = 6;
      climber = 12;
      gc = 8;
      specialist = 18;
    }

    const total = sprinter + climber + gc + specialist;

    // Split flows into stage outcomes
    const flows = {
      sprinter: {
        caught: Math.round(sprinter * 0.80),
        dropped: Math.round(sprinter * 0.15),
        contested: Math.round(sprinter * 0.05)
      },
      climber: {
        caught: Math.round(climber * 0.30),
        dropped: Math.round(climber * 0.20),
        contested: Math.round(climber * 0.50)
      },
      gc: {
        caught: Math.round(gc * 0.70),
        dropped: Math.round(gc * 0.05),
        contested: Math.round(gc * 0.25)
      },
      specialist: {
        caught: Math.round(specialist * 0.40),
        dropped: Math.round(specialist * 0.10),
        contested: Math.round(specialist * 0.50)
      }
    };

    const caughtTotal = flows.sprinter.caught + flows.climber.caught + flows.gc.caught + flows.specialist.caught;
    const droppedTotal = flows.sprinter.dropped + flows.climber.dropped + flows.gc.dropped + flows.specialist.dropped;
    const contestedTotal = flows.sprinter.contested + flows.climber.contested + flows.gc.contested + flows.specialist.contested;

    return {
      sprinter, climber, gc, specialist, total,
      caughtTotal, droppedTotal, contestedTotal,
      flows
    };
  }, [riders]);

  // Dynamic coordinates calculation to stack flows neatly at the center node
  const scale = 70 / (stats.total || 1);
  const yMidBase = 150 + (80 - stats.total * scale) / 2;

  const wSprinter = stats.sprinter * scale;
  const wClimber = stats.climber * scale;
  const wGc = stats.gc * scale;
  const wSpecialist = stats.specialist * scale;

  const ySprinterMid = yMidBase + wSprinter / 2;
  const yClimberMid = yMidBase + wSprinter + wClimber / 2;
  const yGcMid = yMidBase + wSprinter + wClimber + wGc / 2;
  const ySpecialistMid = yMidBase + wSprinter + wClimber + wGc + wSpecialist / 2;

  const wCaught = stats.caughtTotal * scale;
  const wDropped = stats.droppedTotal * scale;
  const wContested = stats.contestedTotal * scale;

  const yCaughtMid = yMidBase + wCaught / 2;
  const yDroppedMid = yMidBase + wCaught + wDropped / 2;
  const yContestedMid = yMidBase + wCaught + wDropped + wContested / 2;

  // Cubic Bezier curve path helper
  const drawSankeyPath = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1) / 2;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  return html`
    <div class="breakaway-grid">
      
      <div class="dashboard-card">
        <h3>Most Combative Riders</h3>
        <p class="mb-4" style="color: var(--text-secondary); font-size: 0.85rem;">
          Based on cumulative kilometers spent escaping in the breakaway during the 2026 stages.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          ${combativeRiders.map((r, idx) => html`
            <div class="combative-rider-row">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong style="width: 20px;">#${idx+1}</strong>
                <div>
                  <div style="font-weight: 600; font-size: 0.95rem;">${r.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">${r.teamName}</div>
                </div>
              </div>
              <div style="text-align: right; display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${r.stagesInBreak} breaks</div>
                <div>
                  <strong>${r.combativeKms} km</strong>
                  <div class="progress-bar-outer mt-1">
                     <div class="progress-bar-inner" style="width: ${Math.min(100, (r.combativeKms / 800) * 100)}%;"></div>
                  </div>
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>

      
      <div class="dashboard-card">
        <h3>Breakaway Friendly Stages</h3>
        <p class="mb-4" style="color: var(--text-secondary); font-size: 0.85rem;">
          Top stages graded by topography and GC gaps where a break has the highest chance of surviving to the line.
        </p>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${breakawayStages.map(s => html`
            <div style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--tdf-yellow)">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Stage ${s.id}: ${s.name}</strong>
                <span style="color: var(--tdf-yellow-hover); font-weight: 800;">Rating: ${s.breakawayRating}/10</span>
              </div>
              <p class="mt-2" style="font-size: 0.85rem; color: var(--text-secondary);">
                Type: <strong>${s.type}</strong> | Distance: <strong>${s.distance} km</strong> | Climbs: <strong>${s.climbs.length} categorized passes</strong>.
              </p>
            </div>
          `)}
        </div>
      </div>

      
      <div class="dashboard-card" style="grid-column: 1 / -1; margin-top: 1rem; min-height: 480px;">
        <div class="card-header" style="border-bottom: none; margin-bottom: 0;">
          <h3 class="card-title"><i class="lucide-shuffle"></i> Breakaway Composition Sankey Flow</h3>
        </div>
        <p class="mb-4" style="color: var(--text-secondary); font-size: 0.85rem;">
          Visualizing how riders of different specializations enter breakaways and their final outcomes (caught, contested, or dropped). Hover over paths for details.
        </p>

        <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 2rem;">
          <div style="position: relative;">
            <svg viewBox="0 0 800 380" style="width: 100%; height: auto; overflow: visible;">
              
              
              <defs>
                <linearGradient id="flow-sprinter" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="#FFE500" stop-opacity="0.3" />
                </linearGradient>
                <linearGradient id="flow-climber" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#EF4444" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="#FFE500" stop-opacity="0.3" />
                </linearGradient>
                <linearGradient id="flow-gc" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="#FFE500" stop-opacity="0.3" />
                </linearGradient>
                <linearGradient id="flow-spec" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#10B981" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="#FFE500" stop-opacity="0.3" />
                </linearGradient>

                <linearGradient id="flow-caught" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#FFE500" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#9CA3AF" stop-opacity="0.2" />
                </linearGradient>
                <linearGradient id="flow-dropped" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#FFE500" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#EF4444" stop-opacity="0.2" />
                </linearGradient>
                <linearGradient id="flow-contested" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#FFE500" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#10B981" stop-opacity="0.2" />
                </linearGradient>
              </defs>

              
              
              
              <path 
                d=${drawSankeyPath(190, 45, 330, ySprinterMid)} 
                fill="none" 
                stroke="url(#flow-sprinter)" 
                stroke-width=${Math.max(1.5, wSprinter)} 
                style="cursor: pointer; transition: stroke-opacity 0.2s;"
                stroke-opacity=${hoveredFlow === 'sprinter' ? 1.0 : 0.6}
                onMouseEnter=${() => setHoveredFlow('sprinter')}
                onMouseLeave=${() => setHoveredFlow(null)}
              />
              <path 
                d=${drawSankeyPath(190, 135, 330, yClimberMid)} 
                fill="none" 
                stroke="url(#flow-climber)" 
                stroke-width=${Math.max(1.5, wClimber)} 
                style="cursor: pointer; transition: stroke-opacity 0.2s;"
                stroke-opacity=${hoveredFlow === 'climber' ? 1.0 : 0.6}
                onMouseEnter=${() => setHoveredFlow('climber')}
                onMouseLeave=${() => setHoveredFlow(null)}
              />
              <path 
                d=${drawSankeyPath(190, 225, 330, yGcMid)} 
                fill="none" 
                stroke="url(#flow-gc)" 
                stroke-width=${Math.max(1.5, wGc)} 
                style="cursor: pointer; transition: stroke-opacity 0.2s;"
                stroke-opacity=${hoveredFlow === 'gc' ? 1.0 : 0.6}
                onMouseEnter=${() => setHoveredFlow('gc')}
                onMouseLeave=${() => setHoveredFlow(null)}
              />
              <path 
                d=${drawSankeyPath(190, 315, 330, ySpecialistMid)} 
                fill="none" 
                stroke="url(#flow-spec)" 
                stroke-width=${Math.max(1.5, wSpecialist)} 
                style="cursor: pointer; transition: stroke-opacity 0.2s;"
                stroke-opacity=${hoveredFlow === 'spec' ? 1.0 : 0.6}
                onMouseEnter=${() => setHoveredFlow('spec')}
                onMouseLeave=${() => setHoveredFlow(null)}
              />

              
              
              <path 
                d=${drawSankeyPath(470, yCaughtMid, 610, 70)} 
                fill="none" 
                stroke="url(#flow-caught)" 
                stroke-width=${Math.max(1.5, wCaught)} 
                style="cursor: pointer; transition: stroke-opacity 0.2s;"
                stroke-opacity=${hoveredFlow === 'caught' ? 1.0 : 0.6}
                onMouseEnter=${() => setHoveredFlow('caught')}
                onMouseLeave=${() => setHoveredFlow(null)}
              />
              <path 
                d=${drawSankeyPath(470, yDroppedMid, 610, 180)} 
                fill="none" 
                stroke="url(#flow-dropped)" 
                stroke-width=${Math.max(1.5, wDropped)} 
                style="cursor: pointer; transition: stroke-opacity 0.2s;"
                stroke-opacity=${hoveredFlow === 'dropped' ? 1.0 : 0.6}
                onMouseEnter=${() => setHoveredFlow('dropped')}
                onMouseLeave=${() => setHoveredFlow(null)}
              />
              <path 
                d=${drawSankeyPath(470, yContestedMid, 610, 290)} 
                fill="none" 
                stroke="url(#flow-contested)" 
                stroke-width=${Math.max(1.5, wContested)} 
                style="cursor: pointer; transition: stroke-opacity 0.2s;"
                stroke-opacity=${hoveredFlow === 'contested' ? 1.0 : 0.6}
                onMouseEnter=${() => setHoveredFlow('contested')}
                onMouseLeave=${() => setHoveredFlow(null)}
              />

              
              
              
              
              <g>
                <rect x="50" y="20" width="140" height="50" rx="8" fill="var(--bg-secondary)" stroke="#3B82F6" stroke-width="2" />
                <text x="120" y="44" text-anchor="middle" font-weight="700" font-size="12" fill="var(--text-primary)" font-family="var(--font-display)">Sprinters</text>
                <text x="120" y="58" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${stats.sprinter} breaks</text>
              </g>

              <g>
                <rect x="50" y="110" width="140" height="50" rx="8" fill="var(--bg-secondary)" stroke="#EF4444" stroke-width="2" />
                <text x="120" y="134" text-anchor="middle" font-weight="700" font-size="12" fill="var(--text-primary)" font-family="var(--font-display)">Climbers</text>
                <text x="120" y="148" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${stats.climber} breaks</text>
              </g>

              <g>
                <rect x="50" y="200" width="140" height="50" rx="8" fill="var(--bg-secondary)" stroke="#F59E0B" stroke-width="2" />
                <text x="120" y="224" text-anchor="middle" font-weight="700" font-size="12" fill="var(--text-primary)" font-family="var(--font-display)">GC Contenders</text>
                <text x="120" y="238" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${stats.gc} breaks</text>
              </g>

              <g>
                <rect x="50" y="290" width="140" height="50" rx="8" fill="var(--bg-secondary)" stroke="#10B981" stroke-width="2" />
                <text x="120" y="314" text-anchor="middle" font-weight="700" font-size="12" fill="var(--text-primary)" font-family="var(--font-display)">Breakaway Spec.</text>
                <text x="120" y="328" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${stats.specialist} breaks</text>
              </g>

              
              <g>
                <rect x="330" y="150" width="140" height="80" rx="12" fill="var(--bg-secondary)" stroke="var(--tdf-yellow)" stroke-width="3" style="filter: drop-shadow(0px 4px 10px rgba(255,229,0,0.15));" />
                <text x="400" y="185" text-anchor="middle" font-weight="800" font-size="14" fill="var(--text-primary)" font-family="var(--font-display)">Breakaway Group</text>
                <text x="400" y="205" text-anchor="middle" font-weight="700" font-size="12" fill="var(--tdf-yellow-hover)">${stats.total} total escapes</text>
              </g>

              
              <g>
                <rect x="610" y="40" width="140" height="60" rx="8" fill="var(--bg-secondary)" stroke="#9CA3AF" stroke-width="2" />
                <text x="680" y="68" text-anchor="middle" font-weight="700" font-size="12" fill="var(--text-primary)" font-family="var(--font-display)">Caught by Peloton</text>
                <text x="680" y="84" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${stats.caughtTotal} times (${Math.round((stats.caughtTotal / stats.total) * 100)}%)</text>
              </g>

              <g>
                <rect x="610" y="150" width="140" height="60" rx="8" fill="var(--bg-secondary)" stroke="#EF4444" stroke-width="2" />
                <text x="680" y="178" text-anchor="middle" font-weight="700" font-size="12" fill="var(--text-primary)" font-family="var(--font-display)">Dropped / Out</text>
                <text x="680" y="194" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${stats.droppedTotal} times (${Math.round((stats.droppedTotal / stats.total) * 100)}%)</text>
              </g>

              <g>
                <rect x="610" y="260" width="140" height="60" rx="8" fill="var(--bg-secondary)" stroke="#10B981" stroke-width="2" />
                <text x="680" y="288" text-anchor="middle" font-weight="700" font-size="12" fill="var(--text-primary)" font-family="var(--font-display)">Stage Contested</text>
                <text x="680" y="304" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${stats.contestedTotal} times (${Math.round((stats.contestedTotal / stats.total) * 100)}%)</text>
              </g>
            </svg>
          </div>

          
          <div style="background-color: var(--bg-tertiary); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: center; min-height: 250px;">
            <h4 style="font-family: var(--font-display); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 0.75rem;">
              <i class="lucide-info"></i> Flow Analytics
            </h4>
            
            ${!hoveredFlow ? html`
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
                Hover over any curve or path to isolate the breakaway flow trajectory and view classification breakdown statistics.
              </p>
            ` : hoveredFlow === 'sprinter' ? html`
              <div>
                <h5 style="color: #3B82F6; font-weight: 700; font-size: 1rem;">Sprinters Escapes</h5>
                <p class="mt-2" style="font-size: 0.85rem; line-height: 1.4;">
                  Sprinters escaped <strong>${stats.sprinter}</strong> times, typically hunting intermediate points before folding back:
                </p>
                <ul class="mt-2" style="font-size: 0.8rem; list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.25rem;">
                  <li>🐢 Re-absorbed: <strong>80%</strong> (${stats.flows.sprinter.caught} times)</li>
                  <li>💥 Dropped: <strong>15%</strong> (${stats.flows.sprinter.dropped} times)</li>
                  <li>🏆 Contested win: <strong>5%</strong> (${stats.flows.sprinter.contested} times)</li>
                </ul>
              </div>
            ` : hoveredFlow === 'climber' ? html`
              <div>
                <h5 style="color: #EF4444; font-weight: 700; font-size: 1rem;">Climbers Escapes</h5>
                <p class="mt-2" style="font-size: 0.85rem; line-height: 1.4;">
                  Mountain specialists escaped <strong>${stats.climber}</strong> times, heavily contesting summit finishes:
                </p>
                <ul class="mt-2" style="font-size: 0.8rem; list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.25rem;">
                  <li>🏆 Contested win: <strong>50%</strong> (${stats.flows.climber.contested} times)</li>
                  <li>🐢 Re-absorbed: <strong>30%</strong> (${stats.flows.climber.caught} times)</li>
                  <li>💥 Dropped: <strong>20%</strong> (${stats.flows.climber.dropped} times)</li>
                </ul>
              </div>
            ` : hoveredFlow === 'gc' ? html`
              <div>
                <h5 style="color: #F59E0B; font-weight: 700; font-size: 1rem;">GC Contenders Escapes</h5>
                <p class="mt-2" style="font-size: 0.85rem; line-height: 1.4;">
                  General Classification riders entered breakaways <strong>${stats.gc}</strong> times to force moves or pressure rivals:
                </p>
                <ul class="mt-2" style="font-size: 0.8rem; list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.25rem;">
                  <li>🐢 Re-absorbed: <strong>70%</strong> (${stats.flows.gc.caught} times)</li>
                  <li>🏆 Contested win: <strong>25%</strong> (${stats.flows.gc.contested} times)</li>
                  <li>💥 Dropped: <strong>5%</strong> (${stats.flows.gc.dropped} times)</li>
                </ul>
              </div>
            ` : hoveredFlow === 'spec' ? html`
              <div>
                <h5 style="color: #10B981; font-weight: 700; font-size: 1rem;">Specialist Escapes</h5>
                <p class="mt-2" style="font-size: 0.85rem; line-height: 1.4;">
                  Breakaway experts went up the road <strong>${stats.specialist}</strong> times, presenting the highest escape survival rating:
                </p>
                <ul class="mt-2" style="font-size: 0.8rem; list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.25rem;">
                  <li>🏆 Contested win: <strong>50%</strong> (${stats.flows.specialist.contested} times)</li>
                  <li>🐢 Re-absorbed: <strong>40%</strong> (${stats.flows.specialist.caught} times)</li>
                  <li>💥 Dropped: <strong>10%</strong> (${stats.flows.specialist.dropped} times)</li>
                </ul>
              </div>
            ` : hoveredFlow === 'caught' ? html`
              <div>
                <h5 style="color: #9CA3AF; font-weight: 700; font-size: 1rem;">Caught by Peloton</h5>
                <p class="mt-2" style="font-size: 0.85rem; line-height: 1.4;">
                  A total of <strong>${stats.caughtTotal}</strong> escapes were caught before the line. Highly organized sprinter teams and GC pacesetters re-absorbed these moves.
                </p>
              </div>
            ` : hoveredFlow === 'dropped' ? html`
              <div>
                <h5 style="color: #EF4444; font-weight: 700; font-size: 1rem;">Dropped from Break</h5>
                <p class="mt-2" style="font-size: 0.85rem; line-height: 1.4;">
                  A total of <strong>${stats.droppedTotal}</strong> riders were dropped from active breakaways, succumbing to the fierce pace on the mountain passes.
                </p>
              </div>
            ` : html`
              <div>
                <h5 style="color: #10B981; font-weight: 700; font-size: 1rem;">Contesting Stage Victory</h5>
                <p class="mt-2" style="font-size: 0.85rem; line-height: 1.4;">
                  A total of <strong>${stats.contestedTotal}</strong> escapes survived to contest the stage win in a final sprint or solo mountain victory!
                </p>
              </div>
            `}
          </div>
        </div>
      </div>

    </div>
  `;
}

// VISUALIZATIONS TAB
function VisualsTab({ riders, top20GC, selectedGCRiders, toggleRiderGCFilter, currentStageId }) {
  const [activeVisual, setActiveVisual] = useState('gc'); // 'gc', 'points', 'mountains', 'white', 'altitude', 'histogram', 'overlay', 'treemap', 'sankey', 'scatterplot', 'ribbon'
  const [selectedWhiteRiders, setSelectedWhiteRiders] = useState({});
  const [selectedAltitudeRiders, setSelectedAltitudeRiders] = useState({
    "Tadej Pogačar": true,
    "Jonas Vingegaard": true,
    "Mathieu van der Poel": true,
    "Jasper Philipsen": true
  });
  const [histogramStageId, setHistogramStageId] = useState(1);
  const [selectedClimbsOverlay, setSelectedClimbsOverlay] = useState({
    "Puy de Dôme": true,
    "Alpe d'Huez": true,
    "Plateau de Solaison": true,
    "Gavarnie-Gèdre": true,
    "Orcières-Merlette": true
  });
  const [hoveredSankeyLink, setHoveredSankeyLink] = useState(null);

  useEffect(() => {
    if (currentStageId > 0) {
      setHistogramStageId(currentStageId);
    }
  }, [currentStageId]);

  // Points (Green) Jersey Ranks
  const topPoints = useMemo(() => {
    return [...riders].filter(r => r.status === 'Active' && r.points > 0).sort((a, b) => b.points - a.points).slice(0, 10);
  }, [riders]);

  // Mountains (Polka Dot) Ranks
  const topMountains = useMemo(() => {
    return [...riders].filter(r => r.status === 'Active' && r.mountainPoints > 0).sort((a, b) => b.mountainPoints - a.mountainPoints).slice(0, 10);
  }, [riders]);

  // Young Riders (Maillot Blanc)
  const youngRiders = useMemo(() => {
    return riders.filter(r => r.isYoung && r.status === 'Active');
  }, [riders]);

  // Sorted list of young riders
  const sortedYoungRiders = useMemo(() => {
    return [...youngRiders].sort((a, b) => a.gcTime - b.gcTime);
  }, [youngRiders]);

  // White Jersey Leader absolute GC time at each stage
  const whiteLeaderTimes = useMemo(() => {
    const leaderTimes = [];
    for (let sIdx = 1; sIdx <= currentStageId; sIdx++) {
      let minTime = Infinity;
      youngRiders.forEach(r => {
        const time = r.gcHistory[sIdx];
        if (time !== null && time < minTime) {
          minTime = time;
        }
      });
      leaderTimes.push(minTime === Infinity ? 0 : minTime);
    }
    return leaderTimes;
  }, [youngRiders, currentStageId]);

  // Auto-initialize white jersey filters
  useEffect(() => {
    if (youngRiders.length > 0 && Object.keys(selectedWhiteRiders).length === 0) {
      const initial = {};
      sortedYoungRiders.slice(0, 5).forEach(r => {
        initial[r.name] = true;
      });
      setSelectedWhiteRiders(initial);
    }
  }, [youngRiders, sortedYoungRiders]);

  const toggleRiderWhiteFilter = (name) => {
    setSelectedWhiteRiders(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Color generator for Chart lines
  const getLineColor = (idx) => {
    const colors = [
      '#FFE500', // yellow
      '#EF4444', // red
      '#3B82F6', // blue
      '#10B981', // green
      '#8B5CF6', // purple
      '#F59E0B', // orange
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#14B8A6', // teal
      '#6366F1'  // indigo
    ];
    return colors[idx % colors.length];
  };

  return html`
    <div class="visuals-container">
      <div class="chart-wrapper">
        <div class="chart-header-controls">
          <div>
            <h3>Jersey Contests & Interactive Charts</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Compare standings, time gaps, and points accumulation dynamically.
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="nav-tab ${activeVisual === 'gc' ? 'active' : ''}" onClick=${() => setActiveVisual('gc')}>
              GC Time Gaps (Top 20)
            </button>
            <button class="nav-tab ${activeVisual === 'white' ? 'active' : ''}" onClick=${() => setActiveVisual('white')}>
              Young Rider Gaps
            </button>
            <button class="nav-tab ${activeVisual === 'altitude' ? 'active' : ''}" onClick=${() => setActiveVisual('altitude')}>
              Altitude vs Power
            </button>
            <button class="nav-tab ${activeVisual === 'histogram' ? 'active' : ''}" onClick=${() => setActiveVisual('histogram')}>
              Peloton Spread
            </button>
            <button class="nav-tab ${activeVisual === 'overlay' ? 'active' : ''}" onClick=${() => setActiveVisual('overlay')}>
              Summit Overlays
            </button>
            <button class="nav-tab ${activeVisual === 'treemap' ? 'active' : ''}" onClick=${() => setActiveVisual('treemap')}>
              Climb Treemap
            </button>
            <button class="nav-tab ${activeVisual === 'scatterplot' ? 'active' : ''}" onClick=${() => setActiveVisual('scatterplot')}>
              Team Budgets vs Standings
            </button>
            <button class="nav-tab ${activeVisual === 'sankey' ? 'active' : ''}" onClick=${() => setActiveVisual('sankey')}>
              Breakaway Flow
            </button>
            <button class="nav-tab ${activeVisual === 'ribbon' ? 'active' : ''}" onClick=${() => setActiveVisual('ribbon')}>
              Jersey Timeline
            </button>
            <button class="nav-tab ${activeVisual === 'points' ? 'active' : ''}" onClick=${() => setActiveVisual('points')}>
              Sprint points
            </button>
            <button class="nav-tab ${activeVisual === 'mountains' ? 'active' : ''}" onClick=${() => setActiveVisual('mountains')}>
              Mountain points
            </button>
          </div>
        </div>

        ${activeVisual === 'gc' && html`
          <div>
            <div class="mb-4">
              <h4>Filter GC Contenders</h4>
              <p class="mb-2" style="font-size: 0.8rem; color: var(--text-secondary);">Select riders below to show/hide them on the gap history chart.</p>
              <div class="chart-selectors">
                ${top20GC.map((r, idx) => html`
                  <span 
                    class="selector-tag ${selectedGCRiders[r.name] ? 'active' : ''}" 
                    onClick=${() => toggleRiderGCFilter(r.name)}
                  >
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${getLineColor(idx)}; display: inline-block;"></span>
                    ${r.name} (${formatGCTime(r.gcTime)})
                  </span>
                `)}
              </div>
            </div>

            
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                
                <line x1="50" y1="20" x2="50" y2="300" class="graph-axis" />
                <line x1="50" y1="300" x2="580" y2="300" class="graph-axis" />
                
                
                <line x1="50" y1="90" x2="580" y2="90" class="graph-grid-line" />
                <line x1="50" y1="160" x2="580" y2="160" class="graph-grid-line" />
                <line x1="50" y1="230" x2="580" y2="230" class="graph-grid-line" />
                
                
                <text x="10" y="25" fill="var(--text-secondary)" font-size="9">Leader (0s)</text>
                <text x="15" y="95" fill="var(--text-secondary)" font-size="9">+5m</text>
                <text x="10" y="165" fill="var(--text-secondary)" font-size="9">+15m</text>
                <text x="10" y="235" fill="var(--text-secondary)" font-size="9">+30m</text>
                <text x="10" y="305" fill="var(--text-secondary)" font-size="9">>60m</text>

                
                ${Array.from({ length: Math.max(1, currentStageId) }).map((_, idx) => {
                  const x = 50 + (idx / Math.max(1, currentStageId - 1)) * 500;
                  return html`
                    <text x=${x} y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">St. ${idx + 1}</text>
                  `;
                })}

                
                ${top20GC.map((r, idx) => {
                  if (!selectedGCRiders[r.name]) return null;
                  
                  // Generate coordinates mapping gcHistory to SVG coords
                  // Y mapping: 0 seconds = y=30, 3600 seconds (60 mins) = y=300
                  const coordinates = [];
                  r.gcHistory.forEach((timeGap, sIdx) => {
                    if (sIdx === 0 || timeGap === null) return;
                    const x = 50 + ((sIdx - 1) / Math.max(1, currentStageId - 1)) * 500;
                    
                    // Cap max visual time gap to 60 mins (3600s) to maintain chart scaling
                    const cappedGap = Math.min(3600, timeGap);
                    const y = 30 + (cappedGap / 3600) * 270;
                    coordinates.push(`${x},${y}`);
                  });

                  if (coordinates.length < 2) return null;

                  return html`
                    <path 
                      d="M ${coordinates.join(' L ')}" 
                      class="graph-line" 
                      stroke=${getLineColor(idx)} 
                    />
                  `;
                })}
              </svg>
              ${currentStageId === 0 && html`
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: var(--bg-secondary); padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                  <h4>No Data Simulated Yet</h4>
                  <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Simulate at least 1 stage to populate the gap chart.</p>
                </div>
              `}
            </div>
          </div>
        `}

        ${activeVisual === 'white' && html`
          <div>
            <div class="mb-4">
              <h4>Filter Young Rider (Maillot Blanc) Contenders</h4>
              <p class="mb-2" style="font-size: 0.8rem; color: var(--text-secondary);">Select riders below to show/hide them on the white jersey gap chart.</p>
              <div class="chart-selectors">
                ${sortedYoungRiders.map((r, idx) => html`
                  <span 
                    class="selector-tag ${selectedWhiteRiders[r.name] ? 'active' : ''}" 
                    onClick=${() => toggleRiderWhiteFilter(r.name)}
                  >
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${getLineColor(idx)}; display: inline-block;"></span>
                    ${r.name} (${formatGCTime(r.gcTime)})
                  </span>
                `)}
              </div>
            </div>

            
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                
                <line x1="50" y1="20" x2="50" y2="300" class="graph-axis" />
                <line x1="50" y1="300" x2="580" y2="300" class="graph-axis" />
                
                
                <line x1="50" y1="90" x2="580" y2="90" class="graph-grid-line" />
                <line x1="50" y1="160" x2="580" y2="160" class="graph-grid-line" />
                <line x1="50" y1="230" x2="580" y2="230" class="graph-grid-line" />
                
                
                <text x="10" y="25" fill="var(--text-secondary)" font-size="9">Leader (0s)</text>
                <text x="15" y="95" fill="var(--text-secondary)" font-size="9">+2m</text>
                <text x="15" y="165" fill="var(--text-secondary)" font-size="9">+5m</text>
                <text x="10" y="235" fill="var(--text-secondary)" font-size="9">+10m</text>
                <text x="10" y="305" fill="var(--text-secondary)" font-size="9">>20m</text>

                
                ${Array.from({ length: Math.max(1, currentStageId) }).map((_, idx) => {
                  const x = 50 + (idx / Math.max(1, currentStageId - 1)) * 500;
                  return html`
                    <text x=${x} y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">St. ${idx + 1}</text>
                  `;
                })}

                
                ${sortedYoungRiders.map((r, idx) => {
                  if (!selectedWhiteRiders[r.name]) return null;
                  
                  // Calculate points relative to the White Leader at each stage index
                  const coordinates = [];
                  r.gcHistory.forEach((timeGap, sIdx) => {
                    if (sIdx === 0 || timeGap === null) return;
                    const x = 50 + ((sIdx - 1) / Math.max(1, currentStageId - 1)) * 500;
                    
                    const leaderTime = whiteLeaderTimes[sIdx - 1] || 0;
                    const whiteGap = timeGap - leaderTime;
                    
                    // Cap max visual time gap to 20 mins (1200s) to keep white jersey zoom-in legible
                    const cappedGap = Math.min(1200, whiteGap);
                    const y = 30 + (cappedGap / 1200) * 270;
                    coordinates.push(`${x},${y}`);
                  });

                  if (coordinates.length < 2) return null;

                  return html`
                    <path 
                      d="M ${coordinates.join(' L ')}" 
                      class="graph-line" 
                      stroke=${getLineColor(idx)} 
                    />
                  `;
                })}
              </svg>
              ${currentStageId === 0 && html`
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: var(--bg-secondary); padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                  <h4>No Data Simulated Yet</h4>
                  <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Simulate at least 1 stage to populate the young rider gap chart.</p>
                </div>
              `}
            </div>
          </div>
        `}

        ${activeVisual === 'altitude' && html`
          <div>
            <div class="mb-4">
              <h4>Select Competitors to Compare Altitude Power Loss</h4>
              <p class="mb-2" style="font-size: 0.8rem; color: var(--text-secondary);">
                As the altitude increases, atmospheric pressure drops. Pure climbers (Clingers) preserve their power better than heavy sprinters.
              </p>
              <div class="chart-selectors">
                ${riders.filter(r => ["Tadej Pogačar", "Jonas Vingegaard", "Remco Evenepoel", "Richard Carapaz", "Sepp Kuss", "Mathieu van der Poel", "Jasper Philipsen", "Mads Pedersen"].includes(r.name)).map((r, idx) => html`
                  <span 
                    class="selector-tag ${selectedAltitudeRiders && selectedAltitudeRiders[r.name] ? 'active' : ''}" 
                    onClick=${() => {
                      setSelectedAltitudeRiders(prev => ({ ...prev, [r.name]: !prev[r.name] }));
                    }}
                  >
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${getLineColor(idx)}; display: inline-block;"></span>
                    ${r.name} (${r.type.toUpperCase()})
                  </span>
                `)}
              </div>
            </div>

            
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                
                <line x1="50" y1="20" x2="50" y2="300" class="graph-axis" />
                <line x1="50" y1="300" x2="580" y2="300" class="graph-axis" />
                
                
                <line x1="50" y1="30" x2="580" y2="30" class="graph-grid-line" />
                <line x1="50" y1="120" x2="580" y2="120" class="graph-grid-line" />
                <line x1="50" y1="210" x2="580" y2="210" class="graph-grid-line" />
                
                
                <text x="10" y="35" fill="var(--text-secondary)" font-size="9">100% (Sea)</text>
                <text x="15" y="125" fill="var(--text-secondary)" font-size="9">90%</text>
                <text x="15" y="215" fill="var(--text-secondary)" font-size="9">80%</text>
                <text x="15" y="305" fill="var(--text-secondary)" font-size="9">70%</text>

                
                <text x="50" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">0m</text>
                <text x="238" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">1000m</text>
                <text x="426" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">2000m</text>
                <text x="558" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">2700m (Galibier)</text>

                
                ${riders.filter(r => ["Tadej Pogačar", "Jonas Vingegaard", "Remco Evenepoel", "Richard Carapaz", "Sepp Kuss", "Mathieu van der Poel", "Jasper Philipsen", "Mads Pedersen"].includes(r.name)).map((r, idx) => {
                  if (selectedAltitudeRiders && !selectedAltitudeRiders[r.name]) return null;

                  const points = [];
                  for (let alt = 0; alt <= 2700; alt += 150) {
                    const x = 50 + (alt / 2700) * 500;
                    
                    // calculate power output
                    const altRatio = alt / 1000;
                    let loss = 0;
                    if (r.type === 'clinger') loss = altRatio * altRatio * 0.95;
                    else if (r.type === 'gc') loss = altRatio * altRatio * 1.35;
                    else if (r.type === 'breakaway') loss = altRatio * altRatio * 2.0;
                    else loss = altRatio * altRatio * 2.95; // sprinter / flat

                    const powerPct = Math.max(70, 100 - loss);
                    // Map 100% to y=30, 70% to y=300
                    const y = 30 + ((100 - powerPct) / 30) * 270;
                    points.push(`${x},${y}`);
                  }

                  return html`
                    <path 
                      d="M ${points.join(' L ')}" 
                      class="graph-line" 
                      stroke=${getLineColor(idx)} 
                    />
                  `;
                })}
              </svg>
            </div>
          </div>
        `}

        ${activeVisual === 'histogram' && html`
          <div>
            <div class="mb-4" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h4>Peloton Finish Time Gaps (Stage ${histogramStageId})</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                  Visualizing how the peloton split on the finish line. Mountain stages shatter the pack, while flat stages result in a massive bunch finish.
                </p>
              </div>
              <div>
                <label style="font-size: 0.85rem; font-weight: 600; margin-right: 0.5rem; color: var(--text-primary);">Select Stage:</label>
                <select 
                  value=${histogramStageId} 
                  onChange=${(e) => setHistogramStageId(parseInt(e.target.value))}
                  style="padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-secondary); color: var(--text-primary); font-weight: 600; outline: none; cursor: pointer;"
                >
                  ${Array.from({ length: currentStageId }).map((_, idx) => html`
                    <option value=${idx + 1}>Stage ${idx + 1}</option>
                  `)}
                </select>
              </div>
            </div>

            
            ${(() => {
              const activeRiders = riders.filter(r => r.status === 'Active');
              const stageGaps = activeRiders.map(r => r.stageGapsHistory[histogramStageId] || 0);

              // Setup 6 bins: Bunch (0-10s), Chase 1 (10s-1m), Chase 2 (1m-5m), Split (5m-15m), Gruppetto (15m-30m), Dropped (>30m)
              const bins = [
                { label: "Bunch (0-10s)", count: 0, color: "var(--tdf-yellow)" },
                { label: "Chase 1 (10s-1m)", count: 0, color: "#F59E0B" },
                { label: "Chase 2 (1m-5m)", count: 0, color: "#EF4444" },
                { label: "Split (5m-15m)", count: 0, color: "#8B5CF6" },
                { label: "Gruppetto (15m-30m)", count: 0, color: "#3B82F6" },
                { label: "Dropped (>30m)", count: 0, color: "#6B7280" }
              ];

              stageGaps.forEach(gap => {
                if (gap <= 10) bins[0].count++;
                else if (gap <= 60) bins[1].count++;
                else if (gap <= 300) bins[2].count++;
                else if (gap <= 900) bins[3].count++;
                else if (gap <= 1800) bins[4].count++;
                else bins[5].count++;
              });

              const maxCount = Math.max(1, ...bins.map(b => b.count));

              return html`
                <div style="position: relative;">
                  <svg viewBox="0 0 600 300" class="svg-graph">
                    
                    <line x1="50" y1="20" x2="50" y2="250" class="graph-axis" />
                    <line x1="50" y1="250" x2="580" y2="250" class="graph-axis" />

                    
                    <line x1="50" y1="96" x2="580" y2="96" class="graph-grid-line" />
                    <line x1="50" y1="173" x2="580" y2="173" class="graph-grid-line" />

                    
                    <text x="15" y="30" fill="var(--text-secondary)" font-size="9">Riders</text>
                    <text x="25" y="99" fill="var(--text-secondary)" font-size="9">${Math.round(maxCount * 0.66)}</text>
                    <text x="25" y="176" fill="var(--text-secondary)" font-size="9">${Math.round(maxCount * 0.33)}</text>
                    <text x="30" y="253" fill="var(--text-secondary)" font-size="9">0</text>

                    
                    ${bins.map((bin, idx) => {
                      const barWidth = 60;
                      const gapX = 22;
                      const x = 70 + idx * (barWidth + gapX);
                      // scale height relative to maxCount (mapping maxCount to height=210)
                      const barHeight = (bin.count / maxCount) * 210;
                      const y = 250 - barHeight;

                      return html`
                        <g>
                          
                          <rect 
                            x=${x} 
                            y=${y} 
                            width=${barWidth} 
                            height=${barHeight} 
                            fill=${bin.color} 
                            rx="4" 
                            opacity="0.85" 
                            style="transition: height 0.5s ease, y 0.5s ease;"
                          />
                          
                          ${bin.count > 0 && html`
                            <text 
                              x=${x + barWidth / 2} 
                              y=${y - 6} 
                              text-anchor="middle" 
                              fill="var(--text-primary)" 
                              font-size="10" 
                              font-weight="bold"
                            >
                              ${bin.count}
                            </text>
                          `}
                          
                          <text 
                            x=${x + barWidth / 2} 
                            y="270" 
                            text-anchor="middle" 
                            fill="var(--text-secondary)" 
                            font-size="8"
                          >
                            ${bin.label.split(" ")[0]}
                          </text>
                          <text 
                            x=${x + barWidth / 2} 
                            y="282" 
                            text-anchor="middle" 
                            fill="var(--text-secondary)" 
                            font-size="7"
                          >
                            ${bin.label.split(" ")[1] || ""}
                          </text>
                        </g>
                      `;
                    })}
                  </svg>
                  ${currentStageId === 0 && html`
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: var(--bg-secondary); padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                      <h4>No Data Simulated Yet</h4>
                      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Simulate at least 1 stage to view finish spreads.</p>
                    </div>
                  `}
                </div>
              `;
            })()}
        `}

        ${activeVisual === 'overlay' && html`
          <div>
            <div class="mb-4">
              <h4>Summit Finish Profile Overlay</h4>
              <p class="mb-2" style="font-size: 0.8rem; color: var(--text-secondary);">
                Directly compare the final climbs of the mountain stages. Steepness is mapped relative to distance. Select passes to show/hide.
              </p>
              <div class="chart-selectors">
                ${Object.keys(selectedClimbsOverlay).map((cName, idx) => html`
                  <span 
                    class="selector-tag ${selectedClimbsOverlay[cName] ? 'active' : ''}" 
                    onClick=${() => {
                      setSelectedClimbsOverlay(prev => ({ ...prev, [cName]: !prev[cName] }));
                    }}
                  >
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${getLineColor(idx)}; display: inline-block;"></span>
                    ${cName}
                  </span>
                `)}
              </div>
            </div>

            
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                
                <line x1="50" y1="20" x2="50" y2="250" class="graph-axis" />
                <line x1="50" y1="250" x2="580" y2="250" class="graph-axis" />
                
                
                <line x1="50" y1="30" x2="580" y2="30" class="graph-grid-line" />
                <line x1="50" y1="120" x2="580" y2="120" class="graph-grid-line" />
                <line x1="50" y1="210" x2="580" y2="210" class="graph-grid-line" />
                
                
                <text x="15" y="35" fill="var(--text-secondary)" font-size="9">1200m</text>
                <text x="15" y="125" fill="var(--text-secondary)" font-size="9">800m</text>
                <text x="15" y="215" fill="var(--text-secondary)" font-size="9">400m</text>
                <text x="20" y="305" fill="var(--text-secondary)" font-size="9">0m</text>

                
                <text x="50" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Start (0km)</text>
                <text x="226" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">5km</text>
                <text x="403" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">10km</text>
                <text x="580" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">15km</text>

                
                ${(() => {
                  const profiles = {
                    "Gavarnie-Gèdre": { length: 15.0, grade: 7.8, color: getLineColor(3), formula: (x) => (x / 15.0) * (x / 15.0) * 1170 },
                    "Puy de Dôme": { length: 13.3, grade: 7.7, color: getLineColor(0), formula: (x) => {
                      if (x < 9.0) return (x / 9.0) * 450;
                      return 450 + ((x - 9.0) / 4.3) * 574;
                    }},
                    "Plateau de Solaison": { length: 11.3, grade: 9.2, color: getLineColor(2), formula: (x) => (x / 11.3) * 1040 },
                    "Alpe d'Huez": { length: 13.8, grade: 8.1, color: getLineColor(1), formula: (x) => {
                      if (x < 2.0) return (x / 2.0) * 200;
                      return 200 + ((x - 2.0) / 11.8) * 918;
                    }},
                    "Orcières-Merlette": { length: 7.1, grade: 6.7, color: getLineColor(4), formula: (x) => (x / 7.1) * 475 }
                  };

                  return Object.keys(profiles).map(name => {
                    if (!selectedClimbsOverlay[name]) return null;
                    const p = profiles[name];
                    const pts = [];
                    // Draw 30 interpolation points along each climb path
                    for (let step = 0; step <= 30; step++) {
                      const dist = (step / 30) * p.length;
                      // map distance (0 to 15km) to X (50 to 580)
                      const svgX = 50 + (dist / 15.0) * 530;
                      const elev = p.formula(dist);
                      // map elevation (0 to 1200m) to Y (300 to 30)
                      const svgY = 250 - (elev / 1200) * 220;
                      pts.push(`${svgX},${svgY}`);
                    }

                    return html`
                      <g>
                        <path 
                          d="M ${pts.join(' L ')}" 
                          class="graph-line" 
                          stroke=${p.color} 
                          stroke-width="3"
                          fill="none"
                        />
                        
                        <text 
                          x=${50 + (p.length / 15.0) * 530 + 5} 
                          y=${250 - (p.formula(p.length) / 1200) * 220 + 3} 
                          fill=${p.color} 
                          font-size="8" 
                          font-weight="bold"
                        >
                          ${name}
                        </text>
                      </g>
                    `;
                  });
                })()}
              </svg>
            </div>
          </div>
        `}

        ${activeVisual === 'treemap' && html`
          <div>
            <div class="mb-4">
              <h4>Mountain Category Distribution Treemap</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Visualizing the distribution and weight of all categorized mountain passes in the 2026 Tour de France. Box sizes are proportional to the number of climbs in each category.
              </p>
            </div>

            
            ${(() => {
              // Aggregate all climbs across all 21 stages
              const categoryMap = {
                "hc": { label: "Hors Catégorie (HC)", count: 0, color: "var(--tdf-charcoal)", textColor: "#FFFFFF" },
                "c1": { label: "Category 1", count: 0, color: "#EF4444", textColor: "#FFFFFF" },
                "c2": { label: "Category 2", count: 0, color: "#F59E0B", textColor: "#FFFFFF" },
                "c3": { label: "Category 3", count: 0, color: "#3B82F6", textColor: "#FFFFFF" },
                "c4": { label: "Category 4", count: 0, color: "#10B981", textColor: "#FFFFFF" }
              };

              STAGES.forEach(s => {
                s.climbs.forEach(c => {
                  if (categoryMap[c.category]) {
                    categoryMap[c.category].count++;
                  }
                });
              });

              // Convert to sorted array descending
              const data = Object.keys(categoryMap).map(key => ({
                key,
                value: categoryMap[key].count,
                ...categoryMap[key]
              })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

              // Treemap layout slice-and-dice calculation (width=500, height=250)
              const totalValue = data.reduce((sum, item) => sum + item.value, 0);
              let x = 0, y = 0, w = 500, h = 250;
              const rects = [];

              data.forEach((item, idx) => {
                const ratio = item.value / (totalValue - data.slice(0, idx).reduce((s, i) => s + i.value, 0));
                if (idx % 2 === 0) { // slice vertically (left to right)
                  const sliceW = w * ratio;
                  rects.push({ ...item, x, y, w: sliceW, h: h });
                  x += sliceW;
                  w -= sliceW;
                } else { // slice horizontally (top to bottom)
                  const sliceH = h * ratio;
                  rects.push({ ...item, x, y, w: w, h: sliceH });
                  y += sliceH;
                  h -= sliceH;
                }
              });

              return html`
                <div style="display: flex; justify-content: center; padding: 1rem 0;">
                  <svg viewBox="0 0 500 250" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color);">
                    ${rects.map(r => html`
                      <g>
                        
                        <rect 
                          x=${r.x} 
                          y=${r.y} 
                          width=${r.w} 
                          height=${r.h} 
                          fill=${r.color} 
                          stroke="var(--bg-secondary)"
                          stroke-width="2"
                        />
                        
                        
                        ${r.w > 50 && r.h > 40 && html`
                          <g>
                            <text 
                              x=${r.x + 10} 
                              y=${r.y + 22} 
                              fill=${r.textColor} 
                              font-size="11" 
                              font-weight="bold"
                            >
                              ${r.key.toUpperCase()}
                            </text>
                            <text 
                              x=${r.x + 10} 
                              y=${r.y + 40} 
                              fill=${r.textColor} 
                              font-size="9"
                              opacity="0.85"
                            >
                              ${r.value} climbs
                            </text>
                            <text 
                              x=${r.x + 10} 
                              y=${r.y + r.h - 12} 
                              fill=${r.textColor} 
                              font-size="7" 
                              opacity="0.65"
                            >
                              ${r.label}
                            </text>
                          </g>
                        `}
                      </g>
                    `)}
                  </svg>
                </div>
              `;
            })()}
          </div>
        `}

        ${activeVisual === 'sankey' && html`
          <div>
            <div class="mb-4">
              <h4>Breakaway Flow Analysis</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Visualizing how different teams contribute to breakaways across stage types. The thickness of each bezier flow path is proportional to that team's total breakaway entries.
              </p>
            </div>

            
            ${(() => {
              const teamsList = [
                "Visma | Lease a Bike", "UAE Team Emirates", "Soudal - Quick Step", 
                "Red Bull - Bora - Hansgrohe", "INEOS Grenadiers", "Lidl - Trek", 
                "Alpecin - Deceuninck", "EF Education - EasyPost", 
                "Decathlon AG2R La Mondiale", "Groupama - FDJ"
              ];
              const shortNames = {
                "Visma | Lease a Bike": "TVL", "UAE Team Emirates": "UAD", "Soudal - Quick Step": "SOQ",
                "Red Bull - Bora - Hansgrohe": "RBH", "INEOS Grenadiers": "IGD", "Lidl - Trek": "LTK",
                "Alpecin - Deceuninck": "ADC", "EF Education - EasyPost": "EFE",
                "Decathlon AG2R La Mondiale": "DAT", "Groupama - FDJ": "GFC"
              };

              const activeRiders = riders.filter(r => r.status === 'Active');

              // Compute flows: Team -> StageType
              const flows = [];
              const teamTotals = {};
              const typeTotals = { "Hilly": 0, "Mountain": 0 };

              teamsList.forEach(team => {
                teamTotals[team] = 0;
                ["Hilly", "Mountain"].forEach(type => {
                  const count = activeRiders
                    .filter(r => r.teamName === team)
                    .reduce((sum, r) => {
                      const stagesCount = (r.breakStageIds || []).filter(id => {
                        const st = STAGES.find(s => s.id === id);
                        return st && st.type === type;
                      }).length;
                      return sum + stagesCount;
                    }, 0);

                  if (count > 0) {
                    flows.push({ team, type, count });
                    teamTotals[team] += count;
                    typeTotals[type] += count;
                  }
                });
              });

              // Coordinates mapping
              // Teams on Left (X=50 to X=150)
              // Types on Right (X=450 to X=550)
              const teamNodes = {};
              teamsList.forEach((team, idx) => {
                teamNodes[team] = { x: 50, y: 15 + idx * 24, h: 16, label: shortNames[team] || team };
              });

              const typeNodes = {
                "Hilly": { x: 450, y: 40, h: 60, label: "Hilly Stages" },
                "Mountain": { x: 450, y: 150, h: 60, label: "Mountain Stages" }
              };

              // Track running Y offsets on targets to stack link endpoints
              const targetOffsets = { "Hilly": 40, "Mountain": 150 };

              return html`
                <div style="position: relative;">
                  <svg viewBox="0 0 600 280" style="width: 100%; height: auto; border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-secondary);">
                    
                    
                    ${flows.map(f => {
                      const tNode = teamNodes[f.team];
                      const typeNode = typeNodes[f.type];
                      if (!tNode || !typeNode) return null;

                      // Y start is center of team node
                      const yStart = tNode.y + tNode.h / 2;
                      // Y end stack-offset
                      const yEnd = targetOffsets[f.type];
                      
                      // Scale path thickness
                      const strokeWidth = Math.max(1.5, f.count * 1.8);
                      targetOffsets[f.type] += strokeWidth + 2; // offset next link

                      const linkId = `${f.team}-${f.type}`;
                      const isHovered = hoveredSankeyLink === linkId;

                      return html`
                        <path 
                          d="M 150 ${yStart} C 300 ${yStart}, 300 ${yEnd}, 450 ${yEnd}" 
                          fill="none" 
                          stroke=${isHovered ? "var(--tdf-yellow)" : "rgba(100, 110, 120, 0.2)"} 
                          stroke-width=${strokeWidth} 
                          style="cursor: pointer; transition: stroke 0.2s ease, stroke-width 0.2s ease;"
                          onMouseEnter=${() => setHoveredSankeyLink(linkId)}
                          onMouseLeave=${() => setHoveredSankeyLink(null)}
                        />
                      `;
                    })}

                    
                    ${teamsList.map(team => {
                      const n = teamNodes[team];
                      const total = teamTotals[team] || 0;
                      return html`
                        <g>
                          <rect 
                            x=${n.x} 
                            y=${n.y} 
                            width="100" 
                            height=${n.h} 
                            fill="var(--bg-tertiary)" 
                            stroke="var(--border-color)" 
                            rx="3" 
                          />
                          <text x=${n.x + 8} y=${n.y + 11} fill="var(--text-primary)" font-size="8" font-weight="bold">
                            ${n.label}
                          </text>
                          <text x=${n.x + 92} y=${n.y + 11} text-anchor="end" fill="var(--text-secondary)" font-size="7">
                            ${total}
                          </text>
                        </g>
                      `;
                    })}

                    
                    ${Object.keys(typeNodes).map(type => {
                      const n = typeNodes[type];
                      const total = typeTotals[type] || 0;
                      return html`
                        <g>
                          <rect 
                            x=${n.x} 
                            y=${n.y} 
                            width="100" 
                            height=${n.h} 
                            fill="var(--tdf-charcoal)" 
                            rx="4" 
                          />
                          <text x=${n.x + 50} y=${n.y + 28} text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">
                            ${n.label}
                          </text>
                          <text x=${n.x + 50} y=${n.y + 44} text-anchor="middle" fill="var(--tdf-yellow)" font-size="8" font-weight="bold">
                            ${total} entries
                          </text>
                        </g>
                      `;
                    })}
                  </svg>
                  
                  
                  ${hoveredSankeyLink && html`
                    <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background-color: var(--tdf-charcoal); color: #FFFFFF; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; box-shadow: var(--shadow-md); font-weight: 600;">
                      ${(() => {
                        const [teamName, typeName] = hoveredSankeyLink.split("-");
                        const flow = flows.find(f => f.team === teamName && f.type === typeName);
                        return `${teamName} — ${flow ? flow.count : 0} breakaway entries on ${typeName} stages`;
                      })()}
                    </div>
                  `}

                  ${currentStageId === 0 && html`
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: var(--bg-secondary); padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                      <h4>No Data Simulated Yet</h4>
                      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Simulate stages to visualize team breakaway flow.</p>
                    </div>
                  `}
                </div>
              `;
            })()}
          </div>
        `}

        
        ${activeVisual === 'points' && html`
          <div>
            <h4 class="mb-4">Points Classification (Top 10)</h4>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${topPoints.map(r => {
                const maxPoints = topPoints[0]?.points || 1;
                const pct = (r.points / maxPoints) * 100;
                return html`
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem;">
                      <span><strong>${r.name}</strong> (${r.teamShort})</span>
                      <strong>${r.points} pts</strong>
                    </div>
                    <div style="background-color: var(--bg-tertiary); height: 16px; border-radius: 4px; overflow: hidden; width: 100%;">
                      <div style="background-color: var(--jersey-green); height: 100%; border-radius: 4px; width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              })}
              ${topPoints.length === 0 && html`
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                  No points accumulated. Simulate flat or hilly stages.
                </div>
              `}
            </div>
          </div>
        `}

        
        ${activeVisual === 'mountains' && html`
          <div>
            <h4 class="mb-4">Mountains Classification (Top 10)</h4>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${topMountains.map(r => {
                const maxMtnPoints = topMountains[0]?.mountainPoints || 1;
                const pct = (r.mountainPoints / maxMtnPoints) * 100;
                return html`
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem;">
                      <span><strong>${r.name}</strong> (${r.teamShort})</span>
                      <strong>${r.mountainPoints} pts</strong>
                    </div>
                    <div style="background-color: var(--bg-tertiary); height: 16px; border-radius: 4px; overflow: hidden; width: 100%;">
                      <div style="background-color: var(--jersey-polka); height: 100%; border-radius: 4px; width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              })}
              ${topMountains.length === 0 && html`
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                  No mountain points accumulated. Simulate mountain stages.
                </div>
              `}
            </div>
          </div>
        `}

        
        ${activeVisual === 'scatterplot' && html`
          <div>
            <div class="mb-4">
              <h4>Team Budgets vs. Current GC Standings</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Comparing estimated team budgets (X-axis, €M) against their cumulative GC standing positions (Y-axis, lower rank is better). 
                Ideally, top-left quadrant represents maximum budget efficiency.
              </p>
            </div>

            ${(() => {
              const teamBudgets = {
                "UAE Team Emirates": 60,
                "Visma | Lease a Bike": 55,
                "INEOS Grenadiers": 50,
                "Red Bull - Bora - Hansgrohe": 45,
                "Soudal - Quick Step": 30,
                "Lidl - Trek": 28,
                "Decathlon AG2R La Mondiale": 26,
                "EF Education - EasyPost": 20,
                "Groupama - FDJ": 19,
                "Alpecin - Deceuninck": 17
              };

              const teamColors = {
                "UAE Team Emirates": "#FFFFFF",
                "Visma | Lease a Bike": "var(--tdf-yellow)",
                "INEOS Grenadiers": "#E30613",
                "Red Bull - Bora - Hansgrohe": "#004B49",
                "Soudal - Quick Step": "#014494",
                "Lidl - Trek": "#005EA6",
                "Decathlon AG2R La Mondiale": "#009EE0",
                "EF Education - EasyPost": "#EE2A7B",
                "Groupama - FDJ": "#0055A5",
                "Alpecin - Deceuninck": "#002855"
              };

              // Calculate Team standing = sum of GC times of their top 3 active riders
              const teamsList = Object.keys(teamBudgets);
              const teamStandings = teamsList.map(tName => {
                const teamRiders = riders.filter(r => r.teamName === tName && r.status === 'Active');
                const sortedRiders = [...teamRiders].sort((a, b) => a.gcTime - b.gcTime);
                // Sum of top 3
                const top3Time = sortedRiders.slice(0, 3).reduce((sum, r) => sum + r.gcTime, 0);
                const hasRiders = sortedRiders.length >= 3;
                return {
                  name: tName,
                  short: sortedRiders[0]?.teamShort || tName.substring(0, 3).toUpperCase(),
                  top3Time: hasRiders ? top3Time : Infinity,
                  topRider: sortedRiders[0]?.name || "N/A",
                  budget: teamBudgets[tName],
                  color: teamColors[tName] || "#888888"
                };
              });

              // Rank teams by top3Time ascending
              teamStandings.sort((a, b) => a.top3Time - b.top3Time);
              const rankedStandings = teamStandings.map((t, idx) => ({
                ...t,
                rank: t.top3Time === Infinity ? 10 : idx + 1
              }));

              // Plot boundaries: X-axis (Budget 15M to 65M), Y-axis (Rank 1 to 10)
              // Width = 600, Height = 350
              // Padding: Left = 60, Right = 40, Top = 30, Bottom = 50
              return html`
                <div style="position: relative;">
                  <svg viewBox="0 0 600 350" class="svg-graph">
                    
                    <line x1="60" y1="30" x2="60" y2="300" class="graph-axis" />
                    <line x1="60" y1="300" x2="560" y2="300" class="graph-axis" />

                    
                    ${Array.from({ length: 10 }).map((_, idx) => {
                      const y = 30 + (idx / 9) * 250;
                      return html`
                        <line x1="60" y1=${y} x2="560" y2=${y} class="graph-grid-line" />
                        <text x="45" y=${y + 4} fill="var(--text-secondary)" font-size="9" text-anchor="end">Rank ${idx + 1}</text>
                      `;
                    })}

                    
                    ${[15, 25, 35, 45, 55, 65].map(bVal => {
                      const x = 60 + ((bVal - 15) / 50) * 480;
                      return html`
                        <line x1=${x} y1="300" x2=${x} y2="305" stroke="var(--text-secondary)" />
                        <text x=${x} y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">€${bVal}M</text>
                      `;
                    })}

                    <text x="310" y="340" text-anchor="middle" fill="var(--text-primary)" font-size="10" font-weight="bold">Estimated Budget (€ Millions)</text>

                    
                    ${rankedStandings.map(t => {
                      // Map budget to X: 15M to 65M maps to 60 to 540
                      const x = 60 + ((t.budget - 15) / 50) * 480;
                      // Map rank to Y: Rank 1 to 10 maps to 30 to 280
                      const y = 30 + ((t.rank - 1) / 9) * 250;

                      return html`
                        <g style="cursor: pointer;">
                          <circle 
                            cx=${x} 
                            cy=${y} 
                            r="10" 
                            fill=${t.color} 
                            stroke="var(--text-primary)" 
                            stroke-width="2"
                            style="transition: r 0.2s ease;"
                            onMouseEnter=${(e) => {
                              const tooltip = document.getElementById('scatter-tooltip');
                              if (tooltip) {
                                tooltip.style.display = 'block';
                                tooltip.style.left = `${e.clientX - 10}px`;
                                tooltip.style.top = `${e.clientY - 95}px`;
                                tooltip.innerHTML = `
                                  <strong>${t.name} (${t.short})</strong><br/>
                                  Budget: €${t.budget}M<br/>
                                  Standing: Team Rank #${t.rank}<br/>
                                  Leader: ${t.topRider}
                                `;
                              }
                            }}
                            onMouseLeave=${() => {
                              const tooltip = document.getElementById('scatter-tooltip');
                              if (tooltip) tooltip.style.display = 'none';
                            }}
                          />
                          <text 
                            x=${x} 
                            y=${y + 25} 
                            text-anchor="middle" 
                            fill="var(--text-primary)" 
                            font-size="9" 
                            font-weight="bold"
                            style="text-shadow: 0 1px 2px var(--bg-secondary);"
                          >
                            ${t.short}
                          </text>
                        </g>
                      `;
                    })}
                  </svg>
                  <div id="scatter-tooltip" class="graph-tooltip" style="position: fixed; pointer-events: none; display: none; background: rgba(17,17,17,0.95); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 6px; color: #fff; z-index: 9999;"></div>

                  ${currentStageId === 0 && html`
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: var(--bg-secondary); padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                      <h4>No Standings Recorded Yet</h4>
                      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Simulate at least 1 stage to see standings plotted against team budget.</p>
                    </div>
                  `}
                </div>
              `;
            })()}
          </div>
        `}

        
        ${activeVisual === 'ribbon' && html`
          <div>
            <div class="mb-4">
              <h4>Jersey Ownership Timeline Ribbon</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Historical progression of jersey holders (Yellow, Green, Polka, White) across all completed stages.
              </p>
            </div>

            ${(() => {
              if (currentStageId === 0) {
                return html`
                  <div style="text-align: center; padding: 3rem; background: var(--bg-tertiary); border-radius: 8px;">
                    <h4>No Data Simulated Yet</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Simulate stages to view the jersey ownership progression.</p>
                  </div>
                `;
              }

              // Compute jersey holders retrospectively per stage index from 1 to currentStageId
              const activeRiders = riders.filter(r => r.status === 'Active' || r.status === 'Abandoned');

              const timeline = [];
              for (let sId = 1; sId <= currentStageId; sId++) {
                // filter riders active in that stage (their gcHistory[sId] is not null)
                const activeInStage = activeRiders.filter(r => r.gcHistory[sId] !== null);
                if (activeInStage.length === 0) continue;

                // Yellow: lowest gcTime
                const yellow = [...activeInStage].sort((a, b) => a.gcHistory[sId] - b.gcHistory[sId])[0];

                // Green: highest points
                const green = [...activeInStage].sort((a, b) => b.pointsHistory[sId] - a.pointsHistory[sId])[0];

                // Polka: highest mountainPoints
                const polka = [...activeInStage].sort((a, b) => b.mountainPointsHistory[sId] - a.mountainPointsHistory[sId])[0];

                // White: best young rider
                const youngActive = activeInStage.filter(r => r.isYoung);
                const white = youngActive.length > 0 ? [...youngActive].sort((a, b) => a.gcHistory[sId] - b.gcHistory[sId])[0] : null;

                timeline.push({
                  stage: sId,
                  yellow: yellow?.name || 'N/A',
                  yellowShort: yellow?.teamShort || '',
                  green: green?.name || 'N/A',
                  greenShort: green?.teamShort || '',
                  polka: polka?.name || 'N/A',
                  polkaShort: polka?.teamShort || '',
                  white: white?.name || 'N/A',
                  whiteShort: white?.teamShort || ''
                });
              }

              const rows = [
                { type: "yellow", label: "Maillot Jaune", color: "var(--jersey-yellow)", textColor: "var(--tdf-charcoal)", key: "yellow", keyShort: "yellowShort" },
                { type: "green", label: "Maillot Vert", color: "var(--jersey-green)", textColor: "#FFFFFF", key: "green", keyShort: "greenShort" },
                { type: "polka", label: "Maillot à Pois", color: "var(--jersey-polka)", textColor: "#FFFFFF", key: "polka", keyShort: "polkaShort" },
                { type: "white", label: "Maillot Blanc", color: "var(--bg-secondary)", textColor: "var(--text-primary)", border: "1px solid var(--jersey-white-border)", key: "white", keyShort: "whiteShort" }
              ];

              return html`
                <div style="overflow-x: auto; padding: 1rem 0;">
                  <div style="min-width: 800px; display: flex; flex-direction: column; gap: 1rem;">
                    
                    <div style="display: grid; grid-template-columns: 140px repeat(${currentStageId}, 1fr); gap: 6px; text-align: center; font-weight: bold; font-size: 0.8rem;">
                      <div>Classification</div>
                      ${timeline.map(t => html`
                        <div style="padding: 0.25rem; background: var(--bg-tertiary); border-radius: 4px;">St. ${t.stage}</div>
                      `)}
                    </div>

                    
                    ${rows.map(row => html`
                      <div style="display: grid; grid-template-columns: 140px repeat(${currentStageId}, 1fr); gap: 6px; align-items: center; font-size: 0.75rem;">
                        <div style="font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                          <span class="jersey-dot ${row.type}"></span>
                          ${row.label}
                        </div>
                        ${timeline.map(t => {
                          const name = t[row.key];
                          const short = t[row.keyShort];
                          const lastName = name.split(' ').pop();
                          return html`
                            <div 
                              style="background-color: ${row.color}; color: ${row.textColor}; border: ${row.border || 'none'}; padding: 0.5rem 0.25rem; border-radius: 6px; text-align: center; font-weight: 600; box-shadow: var(--shadow-sm); cursor: help;"
                              title="${name} (${short})"
                            >
                              <div style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${lastName}</div>
                              <div style="font-size: 0.6rem; opacity: 0.75;">${short}</div>
                            </div>
                          `;
                        })}
                      </div>
                    `)}
                  </div>
                </div>
              `;
            })()}
          </div>
        `}
      </div>
    </div>
  `;
}

// ==========================================
// FANTASY TAB COMPONENT
// ==========================================

const getRiderPrice = (name) => {
  const prices = {
    "Tadej Pogačar": 40.0,
    "Jonas Vingegaard": 38.0,
    "Remco Evenepoel": 34.0,
    "Matteo Jorgenson": 22.0,
    "Richard Carapaz": 20.0,
    "Jasper Philipsen": 18.0,
    "Tim Merlier": 18.0,
    "Jonathan Milan": 18.0,
    "Mads Pedersen": 16.0,
    "Mathieu van der Poel": 15.0,
    "Sepp Kuss": 12.0,
    "Adam Yates": 12.0,
    "Isaac del Toro": 12.0,
    "Florian Lipowitz": 12.0,
    "Tom Pidcock": 10.0,
    "Ben Healy": 9.0
  };
  return prices[name] || 5.0;
};

const getRiderTier = (name) => {
  const price = getRiderPrice(name);
  if (price >= 30.0) return "Tier 1: Superstar";
  if (price >= 15.0) return "Tier 2: Contender";
  if (price >= 9.0) return "Tier 3: Specialist";
  return "Tier 4: Domestique";
};

const calculateFantasyPointsForStage = (riderName, stageId, riders, leaders) => {
  const rider = riders.find(r => r.name === riderName);
  if (!rider) return 0;

  if (rider.status === 'Abandoned' && rider.abandonStage === stageId) {
    return -20;
  }
  if (rider.status === 'Abandoned' && rider.abandonStage < stageId) {
    return 0;
  }

  let points = 0;

  // 1. Stage Placements
  const activeRiders = riders.filter(r => r.status === 'Active' || r.abandonStage === stageId);
  const stageResults = [...activeRiders].sort((a, b) => {
    const gapA = a.stageGapsHistory ? (a.stageGapsHistory[stageId] || 0) : 0;
    const gapB = b.stageGapsHistory ? (b.stageGapsHistory[stageId] || 0) : 0;
    return gapA - gapB;
  });

  const rank = stageResults.findIndex(r => r.name === riderName) + 1;
  if (rank === 1) points += 50;
  else if (rank === 2) points += 35;
  else if (rank === 3) points += 25;
  else if (rank === 4) points += 18;
  else if (rank === 5) points += 15;
  else if (rank >= 6 && rank <= 10) points += 10;
  else if (rank >= 11 && rank <= 15) points += 5;

  // 2. Jersey Holders
  if (leaders.yellow?.name === riderName) points += 15;
  if (leaders.green?.name === riderName) points += 10;
  if (leaders.polka?.name === riderName) points += 10;
  if (leaders.white?.name === riderName) points += 8;

  // 3. Breakaway specialists
  if (rider.type === 'breakaway' && rank <= 20) {
    points += 5;
  }

  return points;
};

function FantasyTab({ currentStageId, riders, leaders, currentUser, setCurrentUser, authToken, setAuthToken }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Market Filters
  const [marketSearch, setMarketSearch] = useState('');
  const [marketClass, setMarketClass] = useState('all');

  const apiHost = window.location.port === '5000' || window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;

  // Listen to stage updates and compute score history
  useEffect(() => {
    if (!currentUser || currentStageId === 0) return;

    const history = currentUser.fantasyState.pointsHistory || [];
    if (history.length < currentStageId) {
      let stagePoints = 0;
      currentUser.fantasyState.roster.forEach(riderName => {
        stagePoints += calculateFantasyPointsForStage(riderName, currentStageId, riders, leaders);
      });

      const updatedHistory = [...history];
      updatedHistory[currentStageId - 1] = stagePoints;
      const newTotal = updatedHistory.reduce((sum, p) => sum + (p || 0), 0);

      const updatedState = {
        ...currentUser.fantasyState,
        pointsHistory: updatedHistory,
        totalPoints: newTotal
      };

      setCurrentUser(prev => ({
        ...prev,
        fantasyState: updatedState
      }));

      // Sync to backend
      fetch(`${apiHost}/api/fantasy/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedState)
      }).catch(err => console.error("Roster score sync failed:", err));
    }
  }, [currentStageId, currentUser?.username]);

  // Auth Submit Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!username || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(`${apiHost}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('tdf2026_auth_token', data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setFormSuccess(isRegister ? 'Account created successfully!' : 'Logged in successfully!');
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tdf2026_auth_token');
    setAuthToken(null);
    setCurrentUser(null);
  };

  // Sync state wrapper
  const syncState = async (updatedState) => {
    try {
      const res = await fetch(`${apiHost}/api/fantasy/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedState)
      });
      if (!res.ok) throw new Error("Sync failed");
    } catch (err) {
      console.error(err);
    }
  };

  // Buy Rider Transaction
  const buyRider = (riderName) => {
    if (!currentUser) return;
    const roster = currentUser.fantasyState.roster || [];
    const budget = currentUser.fantasyState.budget;

    if (roster.includes(riderName)) return;
    if (roster.length >= 6) {
      alert("Roster is full (max 6 riders)");
      return;
    }

    const price = getRiderPrice(riderName);
    if (budget < price) {
      alert("Insufficient budget credits");
      return;
    }

    const updatedRoster = [...roster, riderName];
    const updatedBudget = Math.round((budget - price) * 10) / 10;

    const updatedState = {
      ...currentUser.fantasyState,
      roster: updatedRoster,
      budget: updatedBudget
    };

    setCurrentUser({
      ...currentUser,
      fantasyState: updatedState
    });

    syncState(updatedState);
  };

  // Sell Rider Transaction
  const sellRider = (riderName) => {
    if (!currentUser) return;
    const roster = currentUser.fantasyState.roster || [];
    const budget = currentUser.fantasyState.budget;

    if (!roster.includes(riderName)) return;

    const rider = riders.find(r => r.name === riderName);
    const refundPrice = (rider && rider.status === 'Abandoned') ? 0 : getRiderPrice(riderName);

    const updatedRoster = roster.filter(name => name !== riderName);
    const updatedBudget = Math.round((budget + refundPrice) * 10) / 10;

    const updatedState = {
      ...currentUser.fantasyState,
      roster: updatedRoster,
      budget: updatedBudget
    };

    setCurrentUser({
      ...currentUser,
      fantasyState: updatedState
    });

    syncState(updatedState);
  };

  // Filter riders for the Transfer portal market
  const marketRiders = useMemo(() => {
    return riders.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(marketSearch.toLowerCase()) || 
                          r.teamName.toLowerCase().includes(marketSearch.toLowerCase());
      const price = getRiderPrice(r.name);
      let matchClass = true;
      if (marketClass === 't1') matchClass = price >= 30.0;
      else if (marketClass === 't2') matchClass = price >= 15.0 && price < 30.0;
      else if (marketClass === 't3') matchClass = price >= 9.0 && price < 15.0;
      else if (marketClass === 't4') matchClass = price < 9.0;

      return matchSearch && matchClass;
    }).sort((a, b) => getRiderPrice(b.name) - getRiderPrice(a.name));
  }, [riders, marketSearch, marketClass]);

  // If user is NOT logged in, show auth form overlay
  if (!currentUser) {
    return html`
      <div class="auth-overlay">
        <div class="dashboard-card auth-card">
          <h2 style="text-align: center; margin-bottom: 1.5rem; font-family: var(--font-display);">
            ${isRegister ? 'Register Directeur Account' : 'Directeur Login'}
          </h2>
          
          ${formError && html`<div style="color: var(--jersey-polka); background: rgba(239, 68, 68, 0.1); padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; text-align: center; font-size: 0.85rem; font-weight: 500;">${formError}</div>`}
          ${formSuccess && html`<div style="color: var(--jersey-green); background: rgba(16, 185, 129, 0.1); padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; text-align: center; font-size: 0.85rem; font-weight: 500;">${formSuccess}</div>`}

          <form onSubmit=${handleAuthSubmit}>
            <div class="auth-form-group">
              <label>Username</label>
              <input type="text" class="auth-input" value=${username} onInput=${(e) => setUsername(e.target.value)} placeholder="e.g. DirecteurTadej" required />
            </div>
            
            <div class="auth-form-group">
              <label>Password</label>
              <input type="password" class="auth-input" value=${password} onInput=${(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            
            <button type="submit" class="btn-auth-submit">
              ${isRegister ? 'Create Account' : 'Log In'}
            </button>
          </form>

          <p class="auth-toggle-text">
            ${isRegister ? 'Already have an account?' : "Don't have an account?"}
            <span class="auth-toggle-link" onClick=${() => { setIsRegister(!isRegister); setFormError(''); setFormSuccess(''); }}>
              ${isRegister ? 'Log In' : 'Sign Up'}
            </span>
          </p>
        </div>
      </div>
    `;
  }

  // Logged-in state renders Directeur Cabin Dashboard
  const rosterList = currentUser.fantasyState.roster || [];
  const currentBudget = currentUser.fantasyState.budget;
  const totalPoints = currentUser.fantasyState.totalPoints;
  const historyList = currentUser.fantasyState.pointsHistory || [];

  return html`
    <div>
      
      <div class="auth-user-badge">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="lucide-user" style="color: var(--tdf-yellow);"></i>
          <span style="font-weight: 700;">Directeur: @${currentUser.username}</span>
        </div>
        <button class="btn-logout" onClick=${handleLogout}>
          <i class="lucide-log-out"></i> Logout
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2rem;">
        
        
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="dashboard-card" style="border-top: 4px solid var(--tdf-yellow);">
            <div class="card-header">
              <h3 class="card-title"><i class="lucide-trophy"></i> Roster Dashboard</h3>
              <span class="badge-jersey-holder badge-yellow">${rosterList.length} / 6 Riders</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
              <div style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 8px; text-align: center;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Roster Value</span>
                <h3 style="font-size: 1.5rem; font-weight: 800;">€${(Math.round((100.0 - currentBudget) * 10) / 10).toFixed(1)}M</h3>
              </div>
              <div style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 8px; text-align: center;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Credits Remaining</span>
                <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--jersey-green);">€${currentBudget.toFixed(1)}M</h3>
              </div>
              <div style="background-color: var(--bg-tertiary); padding: 1rem; border-radius: 8px; text-align: center;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Total Score</span>
                <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--tdf-yellow-hover);">${totalPoints} pts</h3>
              </div>
            </div>

            <h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; font-family: var(--font-display);">Roster Line-up</h4>
            ${rosterList.length === 0 ? html`
              <div style="text-align: center; padding: 2rem; color: var(--text-secondary); border: 2px dashed var(--border-color); border-radius: 8px; margin-top: 0.5rem;">
                <i class="lucide-users" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem; display: block;"></i>
                No riders drafted yet. Use the transfer portal below to build your roster!
              </div>
            ` : html`
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
                ${rosterList.map(name => {
                  const riderObj = riders.find(r => r.name === name);
                  const price = getRiderPrice(name);
                  const tier = getRiderTier(name);
                  const isDNF = riderObj && riderObj.status === 'Abandoned';

                  return html`
                    <div class="dashboard-card" style="padding: 1rem; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(8px); border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; ${isDNF ? 'opacity: 0.6; border-color: var(--jersey-polka);' : ''}">
                      <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 0.75rem;">
                          <span style="font-weight: 600; color: var(--text-secondary);">${tier}</span>
                          <span style="font-weight: 700; color: var(--jersey-green);">€${price.toFixed(1)}M</span>
                        </div>
                        <h4 style="margin-top: 0.5rem; font-size: 1rem; font-family: var(--font-display);">${name}</h4>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                          ${riderObj?.teamName || '-'}
                        </p>
                        ${isDNF && html`
                          <div style="color: var(--jersey-polka); font-size: 0.7rem; font-weight: 700; margin-top: 0.25rem;">
                            ⚠️ DNF (Stage ${riderObj.abandonStage}) - Value dropped to €0.0M
                          </div>
                        `}
                      </div>
                      
                      <button 
                        class="btn-logout" 
                        style="width: 100%; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" 
                        onClick=${() => sellRider(name)}
                      >
                        <i class="lucide-trash-2"></i> Sell Rider
                      </button>
                    </div>
                  `;
                })}
              </div>
            `}
          </div>

          
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title"><i class="lucide-shuffle"></i> Transfer Portal (Market List)</h3>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
              <div class="search-container" style="margin-bottom: 0; flex: 1;">
                <input 
                  type="text" 
                  class="search-input" 
                  value=${marketSearch} 
                  onInput=${(e) => setMarketSearch(e.target.value)} 
                  placeholder="Filter by Rider or Team..." 
                />
                <i class="lucide-search search-icon"></i>
              </div>
              
              <select 
                class="search-input" 
                style="max-width: 200px; padding-left: 1rem;" 
                value=${marketClass} 
                onChange=${(e) => setMarketClass(e.target.value)}
              >
                <option value="all">All Tiers</option>
                <option value="t1">Tier 1: Superstar (>= €30M)</option>
                <option value="t2">Tier 2: Contenders (>= €15M)</option>
                <option value="t3">Tier 3: Specialists (>= €9M)</option>
                <option value="t4">Tier 4: Domestiques (€5.0M)</option>
              </select>
            </div>

            <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                <thead>
                  <tr style="background-color: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">
                    <th style="padding: 0.75rem 1rem;">Rider</th>
                    <th style="padding: 0.75rem 1rem;">Team</th>
                    <th style="padding: 0.75rem 1rem;">Tier / Spec</th>
                    <th style="padding: 0.75rem 1rem; text-align: right;">Cost</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Status</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${marketRiders.map((r, idx) => {
                    const price = getRiderPrice(r.name);
                    const tier = getRiderTier(r.name);
                    const isDrafted = rosterList.includes(r.name);
                    const isFull = rosterList.length >= 6;
                    const canAfford = currentBudget >= price;
                    const isDNF = r.status === 'Abandoned';

                    return html`
                      <tr style="border-bottom: 1px solid var(--border-color); background-color: ${idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};">
                        <td style="padding: 0.75rem 1rem; font-weight: 600;">${r.name}</td>
                        <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">${r.teamName}</td>
                        <td style="padding: 0.75rem 1rem;">
                          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary);">${r.type || 'flat'}</span>
                          <span style="font-size: 0.7rem; color: var(--text-secondary); display: block;">${tier}</span>
                        </td>
                        <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--jersey-green);">€${price.toFixed(1)}M</td>
                        <td style="padding: 0.75rem 1rem; text-align: center;">
                          <span class="rider-status ${isDNF ? 'status-abandoned' : 'status-active'}">
                            ${r.status}
                          </span>
                        </td>
                        <td style="padding: 0.75rem 1rem; text-align: center;">
                          ${isDrafted ? html`
                            <button class="btn-logout" disabled style="background-color: transparent; border-color: var(--border-color); color: var(--text-secondary); cursor: not-allowed;">Drafted</button>
                          ` : html`
                            <button 
                              class="btn-auth-submit" 
                              style="font-size: 0.75rem; padding: 0.3rem 0.6rem; margin-top: 0;"
                              disabled=${isFull || !canAfford || isDNF}
                              onClick=${() => buyRider(r.name)}
                            >
                              Draft
                            </button>
                          `}
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="dashboard-card" style="border-top: 4px solid var(--jersey-green);">
            <div class="card-header">
              <h3 class="card-title"><i class="lucide-history"></i> Stage Points Recap</h3>
            </div>
            
            ${historyList.length === 0 ? html`
              <p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; padding: 1.5rem;">
                No completed stages simulated yet. Roster scores will accumulate as you advance stages in the Control Panel!
              </p>
            ` : html`
              <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 520px; overflow-y: auto; padding-right: 0.25rem;">
                ${historyList.map((pts, idx) => html`
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background-color: var(--bg-tertiary); border-radius: 6px;">
                    <span style="font-size: 0.85rem; font-weight: 600;">Stage ${idx + 1} Points:</span>
                    <strong style="color: var(--jersey-green); font-size: 0.95rem;">+${pts || 0} pts</strong>
                  </div>
                `)}
              </div>
            `}
          </div>
        </div>

      </div>
    </div>
  `;
}

// Render root Preact element
render(html`<${App} />`, document.getElementById('app'));
