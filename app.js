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
        const apiHost = window.location.port === '5000' || window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
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
        setSyncError('Failed to connect to Codespace API server (http://localhost:3000)');
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
      <!-- Header -->
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
        </nav>
        <div class="nav-controls">
          <button class="theme-toggle-btn" onClick=${() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            ${themeIcon}
          </button>
        </div>
      </header>

      <!-- Main Body -->
      <main class="main-content">
        <!-- Simulator Panel -->
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
            <!-- Live Sync Toggle -->
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

        <!-- Sync Server Error Banner -->
        ${liveSync && syncError && html`
          <div style="background-color: rgba(239, 68, 68, 0.15); border: 1px solid var(--jersey-polka); border-radius: 8px; color: var(--jersey-polka); padding: 0.75rem 1.25rem; margin-bottom: 2rem; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
            <i class="lucide-alert-triangle"></i>
            <span>${syncError}</span>
          </div>
        `}

        <!-- Tab Router -->
        ${activeTab === 'overview' && html`<${OverviewTab} currentStageId=${currentStageId} leaders=${leaders} riders=${riders} />`}
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
function OverviewTab({ currentStageId, leaders, riders }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  // Stats
  const activeCount = riders.filter(r => r.status === 'Active').length;
  const abandonedCount = riders.filter(r => r.status === 'Abandoned').length;

  useEffect(() => {
    if (!mapContainer.current) return;
    
    let animationFrameId;
    let pulseRadius = 10;
    let pulseDirection = 1;

    const renderMap = () => {
      if (!mapContainer.current) return;
      const ctx = mapContainer.current.getContext('2d');
      if (!ctx) return;

      // Clear Canvas
      ctx.clearRect(0, 0, mapContainer.current.width, mapContainer.current.height);
      
      // Draw Map grid
      ctx.strokeStyle = 'rgba(120, 120, 120, 0.08)';
      ctx.lineWidth = 1;
      for(let i=0; i<800; i+=40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
      }

      // Coordinates mapping for coordinates inside France (Simulated Projection)
      const points = STAGES.map(s => {
        const x = 150 + (s.mapboxCoords.start[0] + 1) * 75;
        const y = 350 - (s.mapboxCoords.start[1] - 40) * 35;
        return { x, y, stage: s.id, name: s.name };
      });

      // Draw general route line in light yellow
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 229, 0, 0.25)';
      ctx.lineWidth = 4;
      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Draw completed stages route overlay in solid green
      if (currentStageId > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 4;
        points.slice(0, currentStageId).forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      }

      // Draw Stage nodes
      points.forEach((pt, idx) => {
        ctx.beginPath();
        if (pt.stage === currentStageId + 1) {
          ctx.fillStyle = '#FFE500';
          ctx.arc(pt.x, pt.y, 8, 0, 2 * Math.PI);
        } else if (pt.stage <= currentStageId) {
          ctx.fillStyle = '#10B981';
          ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
        } else {
          ctx.fillStyle = '#9CA3AF';
          ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
        }
        ctx.fill();

        // Label key stages
        if (pt.stage === 1 || pt.stage === 4 || pt.stage === 10 || pt.stage === 14 || pt.stage === 21) {
          ctx.fillStyle = 'var(--text-primary)';
          ctx.font = 'bold 10px Outfit, sans-serif';
          ctx.fillText(`St. ${pt.stage}`, pt.x + 10, pt.y + 4);
        }
      });

      // Animate active cyclist indicator
      const activeIdx = Math.max(0, currentStageId - 1);
      const activePt = points[activeIdx];
      if (activePt) {
        pulseRadius += 0.2 * pulseDirection;
        if (pulseRadius > 18 || pulseRadius < 10) {
          pulseDirection *= -1;
        }

        // Pulse ring
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 229, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.arc(activePt.x, activePt.y, pulseRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Cyclist symbol offset slightly above node
        ctx.font = '16px Arial';
        ctx.fillText('🚴', activePt.x - 8, activePt.y - 12);
      }

      animationFrameId = requestAnimationFrame(renderMap);
    };

    renderMap();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };

  }, [currentStageId]);

  return html`
    <div>
      <!-- Cards Panel for Leaders -->
      <div class="dashboard-grid">
        <!-- Yellow Jersey Card -->
        <div class="dashboard-card" style="border-top: 4px solid var(--jersey-yellow)">
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot yellow active-holder"></span> Maillot Jaune</span>
            <span class="badge-jersey-holder badge-yellow">GC Leader</span>
          </div>
          <h3>${leaders.yellow?.name || 'No Leader Yet'}</h3>
          <p class="mt-2" style="font-size: 0.9rem; color: var(--text-secondary);">
            Team: <strong>${leaders.yellow?.teamName || '-'}</strong>
          </p>
          <p class="mt-4" style="font-weight: 700; color: var(--text-primary);">
            Time: ${leaders.yellow ? formatGCTime(leaders.yellow.gcTime) : '-'}
          </p>
        </div>

        <!-- Green Jersey Card -->
        <div class="dashboard-card" style="border-top: 4px solid var(--jersey-green)">
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot green active-holder"></span> Maillot Vert</span>
            <span class="badge-jersey-holder badge-green">Points</span>
          </div>
          <h3>${leaders.green?.name || 'No Leader Yet'}</h3>
          <p class="mt-2" style="font-size: 0.9rem; color: var(--text-secondary);">
            Team: <strong>${leaders.green?.teamName || '-'}</strong>
          </p>
          <p class="mt-4" style="font-weight: 700; color: var(--jersey-green);">
            Points: ${leaders.green?.points || 0} pts
          </p>
        </div>

        <!-- Polka Dot Jersey Card -->
        <div class="dashboard-card" style="border-top: 4px solid var(--jersey-polka)">
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot polka active-holder"></span> Maillot à Pois</span>
            <span class="badge-jersey-holder badge-polka">Mountains</span>
          </div>
          <h3>${leaders.polka?.name || 'No Leader Yet'}</h3>
          <p class="mt-2" style="font-size: 0.9rem; color: var(--text-secondary);">
            Team: <strong>${leaders.polka?.teamName || '-'}</strong>
          </p>
          <p class="mt-4" style="font-weight: 700; color: var(--jersey-polka);">
            Points: ${leaders.polka?.mountainPoints || 0} pts
          </p>
        </div>

        <!-- White Jersey Card -->
        <div class="dashboard-card" style="border-top: 4px solid var(--jersey-white-border)">
          <div class="card-header">
            <span class="card-title"><span class="jersey-dot white active-holder"></span> Maillot Blanc</span>
            <span class="badge-jersey-holder badge-white">Young Rider</span>
          </div>
          <h3>${leaders.white?.name || 'No Leader Yet'}</h3>
          <p class="mt-2" style="font-size: 0.9rem; color: var(--text-secondary);">
            Team: <strong>${leaders.white?.teamName || '-'}</strong>
          </p>
          <p class="mt-4" style="font-weight: 700; color: var(--text-primary);">
            Time: ${leaders.white ? formatGCTime(leaders.white.gcTime) : '-'}
          </p>
        </div>
      </div>

      <!-- Mapbox Representation and Overview stats -->
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
          <div class="card-header" style="margin-bottom: 0.5rem; border-bottom: none;">
            <h3 class="card-title"><i class="lucide-map"></i> 2026 Interactive Stage Route Map</h3>
          </div>
          <div class="mapbox-container">
            <canvas ref=${mapContainer} class="map-path-canvas" width="800" height="400"></canvas>
            <div class="map-placeholder-text">
              <h4>Map Route Visualizer</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Visualizing GPS tracks of the 21 stages across France. Barcelona 🇪🇸 to Paris 🇫🇷.
              </p>
            </div>
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
      <!-- Left Column (Stage List) -->
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

      <!-- Right Column (Profile Detail) -->
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

        <!-- Custom SVG Elevation Profile -->
        <div>
          <h3>Elevation Profile</h3>
          <div class="elevation-chart-container" style="display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <svg viewBox="0 0 500 150" style="width: 100%; height: 100%; overflow: visible;">
              <!-- Background gradient -->
              <defs>
                <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--tdf-yellow)" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="var(--tdf-yellow)" stop-opacity="0.0" />
                </linearGradient>
              </defs>
              
              <!-- Draw elevation path -->
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

              <!-- Draw Climb Flags -->
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
                    <!-- Flagpole line -->
                    <line 
                      x1=${x} 
                      y1=${pathY} 
                      x2=${x} 
                      y2=${flagTopY} 
                      stroke=${isHovered ? "var(--tdf-yellow)" : "var(--text-secondary)"} 
                      stroke-width=${isHovered ? 2 : 1} 
                    />
                    
                    <!-- Flag dot/label -->
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

                    <!-- Custom Tooltip directly inside SVG -->
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

              <!-- Grid bottom line -->
              <line x1="0" y1="130" x2="500" y2="130" stroke="var(--border-color)" stroke-width="2" />
            </svg>
          </div>
        </div>

        <!-- Climbs breakdown -->
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

      <!-- Search input container -->
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

                  <!-- Hover Tooltip -->
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

      <!-- Detail Modal Overlay -->
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
                <!-- Biography Details -->
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

                <!-- GC Ranking progression plot -->
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
                        <!-- Horizontal ticks -->
                        <line x1="20" y1="15" x2="260" y2="15" stroke="var(--border-color)" stroke-dasharray="2,2" />
                        <line x1="20" y1="120" x2="260" y2="120" stroke="var(--border-color)" stroke-dasharray="2,2" />
                        
                        <!-- Axis Labels -->
                        <text x="25" y="27" fill="var(--text-secondary)" font-size="8">Rank 1</text>
                        <text x="25" y="115" fill="var(--text-secondary)" font-size="8">Rank ${maxRank}</text>

                        <!-- Plot path -->
                        <path d="M ${coords.join(' L ')}" fill="none" stroke="var(--tdf-yellow)" stroke-width="2.5" />
                        
                        <!-- Vertex dots -->
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
    </div>
  `;
}

      <!-- Chronological DNF Wall -->
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
  // Sort riders by combativeKms
  const combativeRiders = useMemo(() => {
    return [...riders].sort((a, b) => b.combativeKms - a.combativeKms).slice(0, 10);
  }, [riders]);

  // Find best breakaway stages
  const breakawayStages = useMemo(() => {
    return [...STAGES].sort((a, b) => b.breakawayRating - a.breakawayRating).slice(0, 5);
  }, []);

  return html`
    <div class="breakaway-grid">
      <!-- Most Combative Leaderboard -->
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

      <!-- Breakaway Stages analysis -->
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

            <!-- SVG Time Gaps Graph -->
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                <!-- Grid lines -->
                <line x1="50" y1="20" x2="50" y2="300" class="graph-axis" />
                <line x1="50" y1="300" x2="580" y2="300" class="graph-axis" />
                
                <!-- Horizontal Grid Lines -->
                <line x1="50" y1="90" x2="580" y2="90" class="graph-grid-line" />
                <line x1="50" y1="160" x2="580" y2="160" class="graph-grid-line" />
                <line x1="50" y1="230" x2="580" y2="230" class="graph-grid-line" />
                
                <!-- Y-Axis Labels (Time behind) -->
                <text x="10" y="25" fill="var(--text-secondary)" font-size="9">Leader (0s)</text>
                <text x="15" y="95" fill="var(--text-secondary)" font-size="9">+5m</text>
                <text x="10" y="165" fill="var(--text-secondary)" font-size="9">+15m</text>
                <text x="10" y="235" fill="var(--text-secondary)" font-size="9">+30m</text>
                <text x="10" y="305" fill="var(--text-secondary)" font-size="9">>60m</text>

                <!-- X-Axis Labels (Stages) -->
                ${Array.from({ length: Math.max(1, currentStageId) }).map((_, idx) => {
                  const x = 50 + (idx / Math.max(1, currentStageId - 1)) * 500;
                  return html`
                    <text x=${x} y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">St. ${idx + 1}</text>
                  `;
                })}

                <!-- GC Lines -->
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

            <!-- SVG White Jersey Gaps Graph -->
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                <!-- Grid lines -->
                <line x1="50" y1="20" x2="50" y2="300" class="graph-axis" />
                <line x1="50" y1="300" x2="580" y2="300" class="graph-axis" />
                
                <!-- Horizontal Grid Lines -->
                <line x1="50" y1="90" x2="580" y2="90" class="graph-grid-line" />
                <line x1="50" y1="160" x2="580" y2="160" class="graph-grid-line" />
                <line x1="50" y1="230" x2="580" y2="230" class="graph-grid-line" />
                
                <!-- Y-Axis Labels (Time behind White Jersey Leader) -->
                <text x="10" y="25" fill="var(--text-secondary)" font-size="9">Leader (0s)</text>
                <text x="15" y="95" fill="var(--text-secondary)" font-size="9">+2m</text>
                <text x="15" y="165" fill="var(--text-secondary)" font-size="9">+5m</text>
                <text x="10" y="235" fill="var(--text-secondary)" font-size="9">+10m</text>
                <text x="10" y="305" fill="var(--text-secondary)" font-size="9">>20m</text>

                <!-- X-Axis Labels (Stages) -->
                ${Array.from({ length: Math.max(1, currentStageId) }).map((_, idx) => {
                  const x = 50 + (idx / Math.max(1, currentStageId - 1)) * 500;
                  return html`
                    <text x=${x} y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">St. ${idx + 1}</text>
                  `;
                })}

                <!-- White Jersey Lines -->
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

            <!-- SVG Altitude Gaps Graph -->
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                <!-- Grid lines -->
                <line x1="50" y1="20" x2="50" y2="300" class="graph-axis" />
                <line x1="50" y1="300" x2="580" y2="300" class="graph-axis" />
                
                <!-- Horizontal Grid Lines -->
                <line x1="50" y1="30" x2="580" y2="30" class="graph-grid-line" />
                <line x1="50" y1="120" x2="580" y2="120" class="graph-grid-line" />
                <line x1="50" y1="210" x2="580" y2="210" class="graph-grid-line" />
                
                <!-- Y-Axis Labels (Relative Power) -->
                <text x="10" y="35" fill="var(--text-secondary)" font-size="9">100% (Sea)</text>
                <text x="15" y="125" fill="var(--text-secondary)" font-size="9">90%</text>
                <text x="15" y="215" fill="var(--text-secondary)" font-size="9">80%</text>
                <text x="15" y="305" fill="var(--text-secondary)" font-size="9">70%</text>

                <!-- X-Axis Labels (Altitude in meters) -->
                <text x="50" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">0m</text>
                <text x="238" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">1000m</text>
                <text x="426" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">2000m</text>
                <text x="558" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">2700m (Galibier)</text>

                <!-- Altitude Curves -->
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

            <!-- Histogram Calculations -->
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
                    <!-- Axes -->
                    <line x1="50" y1="20" x2="50" y2="250" class="graph-axis" />
                    <line x1="50" y1="250" x2="580" y2="250" class="graph-axis" />

                    <!-- Horizontal Grid lines -->
                    <line x1="50" y1="96" x2="580" y2="96" class="graph-grid-line" />
                    <line x1="50" y1="173" x2="580" y2="173" class="graph-grid-line" />

                    <!-- Y-Axis labels (Rider Counts) -->
                    <text x="15" y="30" fill="var(--text-secondary)" font-size="9">Riders</text>
                    <text x="25" y="99" fill="var(--text-secondary)" font-size="9">${Math.round(maxCount * 0.66)}</text>
                    <text x="25" y="176" fill="var(--text-secondary)" font-size="9">${Math.round(maxCount * 0.33)}</text>
                    <text x="30" y="253" fill="var(--text-secondary)" font-size="9">0</text>

                    <!-- Histogram Bars -->
                    ${bins.map((bin, idx) => {
                      const barWidth = 60;
                      const gapX = 22;
                      const x = 70 + idx * (barWidth + gapX);
                      // scale height relative to maxCount (mapping maxCount to height=210)
                      const barHeight = (bin.count / maxCount) * 210;
                      const y = 250 - barHeight;

                      return html`
                        <g>
                          <!-- The Bar -->
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
                          <!-- Rider count on top -->
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
                          <!-- X-Axis Labels -->
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

            <!-- SVG Climb Overlay -->
            <div style="position: relative;">
              <svg viewBox="0 0 600 350" class="svg-graph">
                <!-- Axes -->
                <line x1="50" y1="20" x2="50" y2="250" class="graph-axis" />
                <line x1="50" y1="250" x2="580" y2="250" class="graph-axis" />
                
                <!-- Horizontal Grid Lines -->
                <line x1="50" y1="30" x2="580" y2="30" class="graph-grid-line" />
                <line x1="50" y1="120" x2="580" y2="120" class="graph-grid-line" />
                <line x1="50" y1="210" x2="580" y2="210" class="graph-grid-line" />
                
                <!-- Y-Axis Labels (Elevation gained) -->
                <text x="15" y="35" fill="var(--text-secondary)" font-size="9">1200m</text>
                <text x="15" y="125" fill="var(--text-secondary)" font-size="9">800m</text>
                <text x="15" y="215" fill="var(--text-secondary)" font-size="9">400m</text>
                <text x="20" y="305" fill="var(--text-secondary)" font-size="9">0m</text>

                <!-- X-Axis Labels (Distance along climb in km) -->
                <text x="50" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Start (0km)</text>
                <text x="226" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">5km</text>
                <text x="403" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">10km</text>
                <text x="580" y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">15km</text>

                <!-- Climb Overlay Paths -->
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
                        <!-- Label at end of line -->
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

            <!-- SVG Treemap Layout -->
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
                        <!-- Rectangle cell -->
                        <rect 
                          x=${r.x} 
                          y=${r.y} 
                          width=${r.w} 
                          height=${r.h} 
                          fill=${r.color} 
                          stroke="var(--bg-secondary)"
                          stroke-width="2"
                        />
                        
                        <!-- Text details -->
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

            <!-- SVG Sankey Diagram -->
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
                    
                    <!-- Flow Paths (Links) -->
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

                    <!-- Left Nodes (Teams) -->
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

                    <!-- Right Nodes (Stage Types) -->
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
                  
                  <!-- Hover tooltip -->
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

        <!-- Points Contest (Maillot Vert) Horizontal Bar Chart -->
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

        <!-- Mountains Contest (Maillot à Pois) Horizontal Bar Chart -->
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

        <!-- Team Value Scatterplot (Budget vs. Standing) -->
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
                    <!-- Axes -->
                    <line x1="60" y1="30" x2="60" y2="300" class="graph-axis" />
                    <line x1="60" y1="300" x2="560" y2="300" class="graph-axis" />

                    <!-- Horizontal Grid lines (Ranks 1 to 10) -->
                    ${Array.from({ length: 10 }).map((_, idx) => {
                      const y = 30 + (idx / 9) * 250;
                      return html`
                        <line x1="60" y1=${y} x2="560" y2=${y} class="graph-grid-line" />
                        <text x="45" y=${y + 4} fill="var(--text-secondary)" font-size="9" text-anchor="end">Rank ${idx + 1}</text>
                      `;
                    })}

                    <!-- X-Axis Labels (Budgets 15M to 65M) -->
                    ${[15, 25, 35, 45, 55, 65].map(bVal => {
                      const x = 60 + ((bVal - 15) / 50) * 480;
                      return html`
                        <line x1=${x} y1="300" x2=${x} y2="305" stroke="var(--text-secondary)" />
                        <text x=${x} y="320" text-anchor="middle" fill="var(--text-secondary)" font-size="9">€${bVal}M</text>
                      `;
                    })}

                    <text x="310" y="340" text-anchor="middle" fill="var(--text-primary)" font-size="10" font-weight="bold">Estimated Budget (€ Millions)</text>

                    <!-- Scatter Points -->
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

        <!-- Jersey Ownership Timeline Ribbon -->
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
                    <!-- Stage headers -->
                    <div style="display: grid; grid-template-columns: 140px repeat(${currentStageId}, 1fr); gap: 6px; text-align: center; font-weight: bold; font-size: 0.8rem;">
                      <div>Classification</div>
                      ${timeline.map(t => html`
                        <div style="padding: 0.25rem; background: var(--bg-tertiary); border-radius: 4px;">St. ${t.stage}</div>
                      `)}
                    </div>

                    <!-- Jersey Rows -->
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

// Render root Preact element
render(html`<${App} />`, document.getElementById('app'));
