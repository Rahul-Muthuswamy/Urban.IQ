import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar.jsx";

// This React component renders Azure Maps route planning interface
// It loads Azure Maps SDK and uses environment variables for configuration (VITE_AZURE_MAPS_KEY)
// Set up your environment variables in .env file at the project root.

export default function Page() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const datasourceRef = useRef(null);
  const routeURLRef = useRef(null);
  const searchURLRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Helper utilities (converted from your HTML page)
  function parseCoord(str) {
    if (!str.includes(",")) return null;
    const [aStr, bStr] = str.split(",").map(s => s.trim());
    const a = Number(aStr);
    const b = Number(bStr);
    if (isNaN(a) || isNaN(b)) return null;
    // The original code assumed lat,lon ordering — keep same behavior
    return Math.abs(a) > 90 ? [a, b] : [b, a];
  }

  function formatDistance(meters) {
    if (meters < 1000) return Math.round(meters) + " m";
    return (meters / 1000).toFixed(1) + " km";
  }

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function showToast(message, type = "success") {
    const el = document.createElement("div");
    el.style.cssText = `position: fixed; top: 120px; right: 40px; background: ${type === "error" ? "linear-gradient(135deg,#e74c3c,#c0392b)" : "linear-gradient(135deg,#27ae60,#229954)"}; color: white; padding: 12px 16px; border-radius:8px; z-index:2000; box-shadow:0 10px 30px rgba(0,0,0,0.15); font-weight:500;`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); }, 3000);
  }

  // geocode using searchURLRef
  async function geocode(input) {
    const coords = parseCoord(input);
    if (coords) return coords;

    if (!searchURLRef.current) throw new Error("search service not ready");

    const r = await searchURLRef.current.searchAddress(
      atlas.service.Aborter.timeout(4000),
      input,
      { limit: 1 }
    );

    if (!r.results || r.results.length === 0) throw new Error("Unable to geocode: " + input);
    return [r.results[0].position.lon, r.results[0].position.lat];
  }

  // Calculate route function (exposed to UI via window to allow inline onclick)
  async function calculateRouteFromUI() {
    const startInput = document.getElementById("startInput").value.trim();
    const endInput = document.getElementById("endInput").value.trim();
    const button = document.querySelector(".route-button");

    if (!startInput || !endInput) {
      showToast("Please enter both starting location and destination", "error");
      return;
    }

    if (!routeURLRef.current) {
      showToast("Routing service is not ready yet", "error");
      return;
    }

    try {
      if (button) {
        button.classList.add("loading");
        button.disabled = true;
      }
      datasourceRef.current.clear();
      const resultsElement = document.getElementById('results');
      if (resultsElement) {
        resultsElement.style.display = 'none';
      }
      showToast("Finding optimal route...");

      const startPoint = await geocode(startInput);
      const endPoint = await geocode(endInput);

      const result = await routeURLRef.current.calculateRouteDirections(
        atlas.service.Aborter.timeout(10000),
        [startPoint, endPoint],
        { travelMode: "car", sectionType: "traffic", routeType: "fastest", traffic: true }
      );

      const geojson = result.geojson.getFeatures();
      const route = geojson.features[0];
      const summary = result.routes[0].summary;

      // Add to datasource with colored markers
      datasourceRef.current.add([
        route,
        new atlas.data.Feature(new atlas.data.Point(startPoint), { 
          title: "📍 Start", 
          markerType: "start",
          description: "Starting location"
        }),
        new atlas.data.Feature(new atlas.data.Point(endPoint), { 
          title: "🏁 End", 
          markerType: "end",
          description: "Destination"
        })
      ]);

      // Camera fit
      if (geojson.bbox) {
        mapInstance.current.setCamera({ bounds: geojson.bbox, padding: { top: 100, bottom: 200, left: 420, right: 50 } });
      }

      // Update UI
      const distanceEl = document.getElementById('distance');
      const durationEl = document.getElementById('duration');
      const resultsDisplayEl = document.getElementById('results');
      
      if (distanceEl) {
        distanceEl.textContent = formatDistance(summary.lengthInMeters);
      }
      if (durationEl) {
        durationEl.textContent = formatDuration(summary.travelTimeInSeconds);
      }
      if (resultsDisplayEl) {
        resultsDisplayEl.style.display = 'block';
      }

      showToast("Route calculated successfully!", "success");

    } catch (e) {
      console.error('Route calculation error:', e);
      let msg = 'Unable to calculate route. Please check your locations and try again.';
      if (e.message && e.message.toLowerCase().includes('geocode')) msg = 'Location not found. Please enter a valid address or coordinates.';
      if (e.message && e.message.toLowerCase().includes('timeout')) msg = 'Request timed out. Please check your connection and try again.';
      showToast(msg, 'error');
    } finally {
      const buttonEl = document.querySelector('.route-button');
      if (buttonEl) { 
        buttonEl.classList.remove('loading'); 
        buttonEl.disabled = false; 
      }
    }
  }

  useEffect(() => {
    // expose calculateRoute for inline onclick from JSX (keeps your original HTML's onclick behavior)
    window.calculateRoute = calculateRouteFromUI;
  }, []);

  // initialize map once the external scripts are loaded and DOM is ready
  useEffect(() => {
    if (!scriptsLoaded) {
      console.log('Scripts not loaded yet, waiting...');
      return;
    }
    if (!mapRef.current) {
      console.log('Map container not ready yet, waiting...');
      return;
    }
    if (mapInstance.current) {
      console.log('Map already initialized');
      return;
    }

    // Check if environment variable is available
    if (!import.meta.env.VITE_AZURE_MAPS_KEY) {
      console.error('VITE_AZURE_MAPS_KEY not found in environment');
      showToast('Azure Maps key not configured. Please check your .env file.', 'error');
      return;
    }

    // Add a small delay to ensure scripts are fully loaded
    setTimeout(() => {
      initializeMapSafely();
    }, 100);
  }, [scriptsLoaded]);

  const initializeMapSafely = () => {
    console.log('=== Starting map initialization ===');
    
    // Check environment variable directly first
    const envKey = import.meta.env.VITE_AZURE_MAPS_KEY;
    console.log('Environment key check:', { hasEnvKey: !!envKey, keyPreview: envKey?.slice(0, 8) + '...' });
    
    if (!envKey) {
      console.error('VITE_AZURE_MAPS_KEY not found in environment variables');
      showToast('Azure Maps key not configured. Please set VITE_AZURE_MAPS_KEY in .env file.', 'error');
      return;
    }

    // Check if CONFIG was set by loadAllScripts
    const cfg = window.CONFIG;
    console.log('Window CONFIG check:', { hasConfig: !!cfg, hasConfigKey: !!cfg?.AZURE_MAPS_KEY });
    
    if (!cfg || !cfg.AZURE_MAPS_KEY) {
      console.log('CONFIG not set yet, initializing from environment...');
      // Set CONFIG directly if not set
      window.CONFIG = {
        AZURE_MAPS_KEY: envKey
      };
      console.log('CONFIG initialized from environment');
    }

    const atlasGlobal = window.atlas;
    if (!atlasGlobal || !atlasGlobal.Map) {
      showToast('Azure Maps SDK not available. Scripts may still be loading...', 'error');
      console.error('Atlas global object:', atlasGlobal);
      return;
    }

    // Use the CONFIG that we've ensured exists
    const finalConfig = window.CONFIG;
    console.log('Atlas available, Map constructor:', typeof atlasGlobal.Map);
    console.log('Map container element:', mapRef.current);
    console.log('Final Config:', finalConfig);

    if (!mapRef.current) {
      showToast('Map container not ready', 'error');
      return;
    }

    try {
      // create map
      mapInstance.current = new atlasGlobal.Map(mapRef.current, {
      center: [-73.9, 40.82],
      zoom: 11,
      authOptions: {
        authType: 'subscriptionKey',
        subscriptionKey: finalConfig.AZURE_MAPS_KEY
      }
    });

    mapInstance.current.events.add('ready', () => {
      datasourceRef.current = new atlasGlobal.source.DataSource();
      mapInstance.current.sources.add(datasourceRef.current);

      // Add route line layer
      mapInstance.current.layers.add(new atlasGlobal.layer.LineLayer(datasourceRef.current, null, { strokeColor: 'blue', strokeWidth: 6 }));
      
      // Add symbol layer for start points (green)
      mapInstance.current.layers.add(new atlasGlobal.layer.SymbolLayer(datasourceRef.current, null, {
        filter: ['==', ['get', 'markerType'], 'start'],
        iconOptions: {
          image: 'pin-round-blue',
          size: 1.2,
          anchor: 'bottom'
        },
        textOptions: {
          textField: ['get', 'title'],
          color: '#27ae60',
          size: 12,
          font: ['StandardFont-Bold'],
          offset: [0, -2.5],
          haloColor: 'white',
          haloWidth: 1
        }
      }));
      
      // Add symbol layer for end points (red)
      mapInstance.current.layers.add(new atlasGlobal.layer.SymbolLayer(datasourceRef.current, null, {
        filter: ['==', ['get', 'markerType'], 'end'],
        iconOptions: {
          image: 'pin-round-red',
          size: 1.2,
          anchor: 'bottom'
        },
        textOptions: {
          textField: ['get', 'title'],
          color: '#e74c3c',
          size: 12,
          font: ['StandardFont-Bold'],
          offset: [0, -2.5],
          haloColor: 'white',
          haloWidth: 1
        }
      }));

      const pipeline = atlasGlobal.service.MapsURL.newPipeline(new atlasGlobal.service.MapControlCredential(mapInstance.current));
      routeURLRef.current = new atlasGlobal.service.RouteURL(pipeline);
      searchURLRef.current = new atlasGlobal.service.SearchURL(pipeline);
    });
    
    } catch (error) {
      console.error('Error initializing Azure Maps:', error);
      showToast('Failed to initialize map. Please refresh the page.', 'error');
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      try { 
        if (mapInstance.current && mapInstance.current.dispose) {
          mapInstance.current.dispose(); 
        }
      } catch (e) {
        console.warn('Error disposing map:', e);
      }
    };
  }, []);

  // Load external scripts
  useEffect(() => {
    // Set document title
    document.title = "Urban IQ - Smart Route Planning";
    
    // Add viewport meta tag if not present
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(viewport);
    }

    // Add Azure Maps CSS
    let atlasCSS = document.querySelector('link[href*="atlas.microsoft.com"]');
    if (!atlasCSS) {
      atlasCSS = document.createElement('link');
      atlasCSS.rel = 'stylesheet';
      atlasCSS.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';
      document.head.appendChild(atlasCSS);
    }

    // Load scripts sequentially
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadAllScripts = async () => {
      try {
        // Load Azure Maps scripts
        await loadScript('https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js');
        await loadScript('https://atlas.microsoft.com/sdk/javascript/service/2/atlas-service.min.js');
        
        // Set up configuration from environment variables
        const azureKey = import.meta.env.VITE_AZURE_MAPS_KEY;
        if (!azureKey) {
          console.error('Azure Maps key not found in environment variables');
          showToast('Azure Maps key not configured. Please set VITE_AZURE_MAPS_KEY in .env file.', 'error');
          return;
        }
        
        // Set global config
        window.CONFIG = {
          AZURE_MAPS_KEY: azureKey
        };
        
        console.log('Scripts loaded successfully, CONFIG set:', {
          hasKey: !!window.CONFIG.AZURE_MAPS_KEY,
          atlasAvailable: !!window.atlas,
          envKey: !!import.meta.env.VITE_AZURE_MAPS_KEY,
          actualKey: import.meta.env.VITE_AZURE_MAPS_KEY?.slice(0, 8) + '...'
        });
        
        setScriptsLoaded(true);
      } catch (error) {
        console.error('Failed to load scripts:', error);
        showToast('Failed to load map scripts. Please refresh the page.', 'error');
      }
    };

    loadAllScripts();
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
       <Navbar />
        <img src='/assets/7_remove_bg.png' alt='urban_iq' className='fixed top-0 left-20 md:left-0 z-[100] h-6 sm:h-6 md:h-8 lg:h-10 xl:h-12 object-contain pointer-events-auto mt-5 md:ml-5'></img>

      {/* Inline styles ported from your HTML file. You can move these to a CSS file if preferred. */}
      <style>{`
        :root { --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --light-bg: rgba(255,255,255,0.95); --border-radius:16px; --border-radius-small:8px; --spacing-md:20px; --spacing-sm:12px; --spacing-xs:8px; --font-size-md:16px; --font-size-sm:14px; }
        *{box-sizing:border-box}
        html,body,#__next{height:100%}
        body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:linear-gradient(135deg,#2c3e50 0%,#34495e 100%);}
        #map{position:absolute;top:0;left:0;width:100%;height:100%}
        .header{position: absolute; top:0; left:0; right:0; height:60px; background: var(--light-bg); backdrop-filter: blur(20px); display:flex; align-items:center; padding:0 var(--spacing-md); z-index:1000; border-bottom:1px solid rgba(255,255,255,0.2);}
        .header h1{margin:0;font-size:var(--font-size-md);font-weight:600; background:var(--primary-gradient); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; display:flex;align-items:center;gap:8px}
        #panel {
          position: absolute;
          top: 80px;
          left: var(--spacing-md);
          width: 380px;
          max-width: calc(100vw - 40px);

          /* 🔄 Replaced original styles with your .nav-bg styles */
          border-radius: 12.5px;
          border: 2px solid rgba(0, 0, 0, 0.10);
          background: rgba(255, 255, 255, 0.20);
          box-shadow: 0 8px 32px -10px rgba(0, 0, 0, 0.10);
          backdrop-filter: blur(25px);

          /* Keep original stack order */
          z-index: 100;
        }
        .panel-header{padding:var(--spacing-md) var(--spacing-md) var(--spacing-sm);}
        .panel-title{margin:0 0 var(--spacing-xs);font-size:var(--font-size-md);font-weight:600;color:#2c3e50;display:flex;align-items:center;gap:var(--spacing-xs)}
        .panel-subtitle{margin:0;font-size:var(--font-size-sm);color:#7f8c8d}
        .panel-content{padding:var(--spacing-md)}
        .input-group{position:relative;margin-bottom:var(--spacing-md)}
        .input-label{display:block;margin-bottom: 5px;font-size:var(--font-size-sm);font-weight:500;color:#34495e;display:flex;align-items:center;gap:var(--spacing-xs)}
        .input-field {
          width: 100%;
          padding: 10px 16px;
          border: 2px solid #e1e8ed;
          border-radius: 12px;
          font-size: var(--font-size-md);
          background: rgba(255, 255, 255, 0.8);
          outline: none;
        }
        .route-button.loading .loading-spinner{display:block}
        .loading-spinner{display:none;width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;border-top-color:white;animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .results-panel{
            position: absolute;
          width: 380px;
          max-width: calc(100vw - 40px);

          /* 🔄 Replaced original styles with your .nav-bg styles */
          border-radius: 12.5px;
          border: 2px solid rgba(0, 0, 0, 0.10);
          background: rgba(255, 255, 255, 0.20);
          box-shadow: 0 8px 32px -10px rgba(0, 0, 0, 0.10);
          backdrop-filter: blur(25px);

          /* Keep original stack order */
          z-index: 100;
            display:none;
        }
        .route-info{display:grid; grid-template-columns:1fr 1fr; gap:var(--spacing-md)}
        .info-item{text-align:center;}
      `}</style>

      <div className="">
        <h1><i className="fas fa-route"></i> Urban IQ - Smart Route Planning</h1>
      </div>

      <div id="panel" className="ml-10 mt-10 px-2">
        <div className="panel-header space-y-2">
          <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-3xl font-bold"><i className="fas fa-map-marker-alt"></i> Plan Your Route</h2>
          <p className="">Enter your starting point and destination</p>
        </div>

        <div className="panel-content">
          <div className="input-group ">
            <label className="input-label" htmlFor="startInput"><i className="fas fa-play-circle" style={{ color: '#27ae60' }}></i> Starting Location</label>
            <input id="startInput" className="input-field p-2" placeholder="e.g. 40.7128,-74.0060 or 'Times Square NYC'" autoComplete="off" />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="endInput"><i className="fas fa-flag-checkered" style={{ color: '#e74c3c' }}></i> Destination</label>
            <input id="endInput" className="input-field" placeholder="e.g. 40.555,-73.99 or polling center address" autoComplete="off" />
          </div>

          <button className="route-button flex items-center bg-gradient-to-br from-primary to-accent p-2 rounded-lg mt-1" onClick={() => window.calculateRoute && window.calculateRoute()}>
            <div className="loading-spinner" />
            <span className="bg-button py-2 px-3 text-black"><i className="fas fa-route"></i>Calculate Route</span>
          </button>
        </div>
          <p className="text-sm ml-5 mb-5 text-[#666]"><span className="font-medium">Note</span>: Find your polling route with this feature.</p>

      </div>

      <div id="results" className="results-panel bottom-16 p-5 left-10">
        <h3 className="results-title text-xl"><i className="fas fa-info-circle"></i> Route Information</h3>
        <div className="route-info">
          <div className="info-item mt-2 text-lg"><span className="info-label mr-1">Distance:</span><span className="info-value" id="distance">--</span></div>
          <div className="info-item mt-2 text-lg"><span className="info-label mr-1">Duration:</span><span className="info-value" id="duration">--</span></div>
        </div>
      </div>

      <div id="map" ref={mapRef} style={{ height: '100vh', width: '100%' }} />
    </div>
  );
}
