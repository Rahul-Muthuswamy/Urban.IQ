import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar.jsx";

// This Next.js page renders your HTML-based map UI inside the app/maps/page.tsx
// It loads Azure Maps SDK and your config.js (which should expose window.CONFIG = { AZURE_MAPS_KEY: '...' })
// Place `config.js` file at the project public root (public/config.js) or adjust the path in the Script tag.

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
    if (!scriptsLoaded) return;
    if (!mapRef.current) return;

    // guard: require window.CONFIG.AZURE_MAPS_KEY
    const cfg = window.CONFIG;
    if (!cfg || !cfg.AZURE_MAPS_KEY) {
      showToast('Azure Maps key not found. Make sure public/config.js sets window.CONFIG = { AZURE_MAPS_KEY: "..." }', 'error');
      return;
    }

    const atlasGlobal = window.atlas;
    if (!atlasGlobal || !atlasGlobal.Map) {
      showToast('Azure Maps SDK not available or Map constructor not found', 'error');
      console.error('Atlas global object:', atlasGlobal);
      return;
    }

    console.log('Atlas available, Map constructor:', typeof atlasGlobal.Map);
    console.log('Map container element:', mapRef.current);
    console.log('Config:', cfg);

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
        subscriptionKey: cfg.AZURE_MAPS_KEY
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

    // cleanup
    return () => {
      try { 
        if (mapInstance.current && mapInstance.current.dispose) {
          mapInstance.current.dispose(); 
        }
      } catch (e) {
        console.warn('Error disposing map:', e);
      }
    };
  }, [scriptsLoaded]);

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
        await loadScript('https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js');
        await loadScript('https://atlas.microsoft.com/sdk/javascript/service/2/atlas-service.min.js');
        
        // Try to load config, but don't fail if it's missing
        try {
          await loadScript('/config.js');
        } catch (configError) {
          console.warn('Config.js not found, using default configuration');
          // Set a default config if config.js is missing
          window.CONFIG = {
            AZURE_MAPS_KEY: '3ieWM5eQAvishfw1JHifWN77CAuTLQlctJbvHqObOYxBVy04YOx2JQQJ99BKACYeBjFgGbFxAAAgAZMP3NO0' // User needs to replace this
          };
        }
        
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

          <button className="route-button bg-gradient-to-br from-primary to-accent p-2 rounded-lg mt-1" onClick={() => window.calculateRoute && window.calculateRoute()}>
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

// import { useEffect, useRef, useState } from "react";
// import Navbar from "../../components/Navbar.jsx";

// // Azure Maps API Key (same as backend)
// const AZURE_MAPS_KEY = "3ieWM5eQAvishfw1JHifWN77CAuTLQlctJbvHqObOYxBVy04YOx2JQQJ99BKACYeBjFgGbFxAAAgAZMP3NO0";

// export default function MapsPage() {
//   const mapContainerRef = useRef(null);
//   const mapRef = useRef(null);
//   const datasourceRef = useRef(null);
//   const routeURLRef = useRef(null);
//   const searchURLRef = useRef(null);
  
//   const [startLocation, setStartLocation] = useState("");
//   const [endLocation, setEndLocation] = useState("");
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [distance, setDistance] = useState(null);
//   const [duration, setDuration] = useState(null);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);

//   // Load Azure Maps SDK - exactly like backend
//   useEffect(() => {
//     if (window.atlas) {
//       initializeMap();
//       return;
//     }

//     // Load CSS
//     const link = document.createElement("link");
//     link.rel = "stylesheet";
//     link.href = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css";
//     document.head.appendChild(link);

//     // Load JavaScript
//     const script1 = document.createElement("script");
//     script1.src = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js";
//     script1.onload = () => {
//       const script2 = document.createElement("script");
//       script2.src = "https://atlas.microsoft.com/sdk/javascript/service/2/atlas-service.min.js";
//       script2.onload = initializeMap;
//       document.body.appendChild(script2);
//     };
//     document.body.appendChild(script1);

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.dispose();
//       }
//     };
//   }, []);

//   const initializeMap = () => {
//     if (!window.atlas || !mapContainerRef.current) return;

//     const { atlas } = window;

//     // Initialize map - same as backend
//     const map = new atlas.Map(mapContainerRef.current, {
//       center: [80.2707, 13.0827], // Chennai, India (updated from NYC)
//       zoom: 12,
//       authOptions: {
//         authType: "subscriptionKey",
//         subscriptionKey: AZURE_MAPS_KEY,
//       },
//     });

//     map.events.add("ready", () => {
//       const datasource = new atlas.source.DataSource();
//       map.sources.add(datasource);
//       datasourceRef.current = datasource;

//       // Add route line layer - same as backend
//       map.layers.add(
//         new atlas.layer.LineLayer(datasource, null, {
//           strokeColor: "#667eea", // Changed from 'blue' to match UI
//           strokeWidth: 6,
//         })
//       );

//       // Add symbol layer for markers
//       map.layers.add(new atlas.layer.SymbolLayer(datasource));

//       // Initialize services - same as backend
//       const pipeline = atlas.service.MapsURL.newPipeline(
//         new atlas.service.MapControlCredential(map)
//       );

//       routeURLRef.current = new atlas.service.RouteURL(pipeline);
//       searchURLRef.current = new atlas.service.SearchURL(pipeline);
//     });

//     mapRef.current = map;
//   };

//   // parseCoord - Enhanced with better validation
//   const parseCoord = (str) => {
//     if (!str || typeof str !== 'string') return null;
//     const trimmed = str.trim();
//     if (!trimmed.includes(",")) return null;
    
//     const parts = trimmed.split(",").map(s => s.trim());
//     if (parts.length !== 2) return null;
    
//     const a = parseFloat(parts[0]);
//     const b = parseFloat(parts[1]);
    
//     // Validate that both are valid numbers
//     if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) {
//       return null;
//     }
    
//     // Validate coordinate ranges
//     // Longitude: -180 to 180, Latitude: -90 to 90
//     // If abs(a) > 90, assume it's lon,lat, else assume lat,lon
//     const [lon, lat] = Math.abs(a) > 90 ? [a, b] : [b, a];
    
//     // Final validation - ensure coordinates are in valid ranges
//     if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
//       return null;
//     }
    
//     return [lon, lat];
//   };

//   // geocode - Enhanced with validation
//   const geocode = async (input) => {
//     if (!input || typeof input !== 'string' || !input.trim()) {
//       throw new Error("Location input cannot be empty");
//     }

//     // Try parsing as coordinates first
//     const coords = parseCoord(input);
//     if (coords && Array.isArray(coords) && coords.length === 2) {
//       const [lon, lat] = coords;
//       // Double-check coordinates are valid numbers
//       if (typeof lon === 'number' && typeof lat === 'number' && 
//           isFinite(lon) && isFinite(lat) &&
//           lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
//         return [lon, lat];
//       }
//     }

//     // If not coordinates, try geocoding as address
//     if (!window.atlas || !searchURLRef.current) {
//       throw new Error("Map services are not ready.");
//     }

//     const { atlas } = window;
//     const r = await searchURLRef.current.searchAddress(
//       atlas.service.Aborter.timeout(4000),
//       input.trim(),
//       { limit: 1 }
//     );

//     if (!r || !r.results || r.results.length === 0) {
//       throw new Error("Unable to geocode: " + input);
//     }

//     const position = r.results[0].position;
//     if (!position || 
//         typeof position.lon !== 'number' || typeof position.lat !== 'number' ||
//         isNaN(position.lon) || isNaN(position.lat) ||
//         !isFinite(position.lon) || !isFinite(position.lat)) {
//       throw new Error("Invalid coordinates received from geocoding service");
//     }

//     const lon = position.lon;
//     const lat = position.lat;

//     // Validate coordinate ranges
//     if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
//       throw new Error("Coordinates out of valid range");
//     }

//     return [lon, lat];
//   };

//   // formatDistance - EXACT copy from backend (line 577-583)
//   const formatDistance = (meters) => {
//     if (!meters) return "--";
//     if (meters < 1000) {
//       return Math.round(meters) + " m";
//     } else {
//       return (meters / 1000).toFixed(1) + " km";
//     }
//   };

//   // formatDuration - EXACT copy from backend (line 586-595)
//   const formatDuration = (seconds) => {
//     if (!seconds) return "--";
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
    
//     if (hours > 0) {
//       return `${hours}h ${minutes}m`;
//     } else {
//       return `${minutes}m`;
//     }
//   };

//   // showError - Toast notification (simplified for React)
//   const showErrorToast = (message) => {
//     setError(message);
//     setTimeout(() => setError(null), 4000);
//   };

//   // showSuccess - Toast notification (simplified for React)
//   const showSuccessToast = (message) => {
//     setSuccess(message);
//     setTimeout(() => setSuccess(null), 3000);
//   };

//   // calculateRoute - EXACT copy from backend (line 604-675)
//   const calculateRoute = async () => {
//     const start = startLocation.trim();
//     const end = endLocation.trim();

//     if (!start || !end) {
//       showErrorToast("Please enter both starting location and destination");
//       return;
//     }

//     if (!window.atlas || !routeURLRef.current || !datasourceRef.current || !mapRef.current) {
//       showErrorToast("Map is not ready. Please wait for the map to load.");
//       return;
//     }

//     setIsCalculating(true);
//     setError(null);
//     setSuccess(null);
//     setDistance(null);
//     setDuration(null);

//     try {
//       const { atlas } = window;
//       const datasource = datasourceRef.current;
      
//       datasource.clear();
//       showSuccessToast("Finding optimal route...");

//       // Get coordinates - EXACTLY as backend
//       // geocode() returns [lon, lat] arrays, NOT Position objects
//       const startPoint = await geocode(start); // Returns [lon, lat]
//       const endPoint = await geocode(end);     // Returns [lon, lat]

//       // Validate coordinates are arrays
//       if (!Array.isArray(startPoint) || startPoint.length !== 2 ||
//           !Array.isArray(endPoint) || endPoint.length !== 2) {
//         throw new Error("Invalid coordinates received from geocoding");
//       }

//       const [startLon, startLat] = startPoint;
//       const [endLon, endLat] = endPoint;

//       // Final validation - ensure all coordinates are valid numbers
//       if (typeof startLon !== 'number' || typeof startLat !== 'number' ||
//           typeof endLon !== 'number' || typeof endLat !== 'number' ||
//           isNaN(startLon) || isNaN(startLat) || isNaN(endLon) || isNaN(endLat) ||
//           !isFinite(startLon) || !isFinite(startLat) || !isFinite(endLon) || !isFinite(endLat)) {
//         throw new Error("Invalid coordinates: one or more values are not valid numbers");
//       }

//       // Log for debugging
//       console.log("[Route] Start coords:", startPoint);
//       console.log("[Route] End coords:", endPoint);

//       // CRITICAL FIX: Backend uses waypoints as SECOND parameter (array of [lon,lat] arrays)
//       // and options as THIRD parameter (object with sectionType as STRING, not array)
//       // This matches routing.html line 627-636
//       const waypointsArray = [startPoint, endPoint];
      
//       // Validate waypoints array
//       if (!Array.isArray(waypointsArray) || waypointsArray.length !== 2) {
//         throw new Error("Waypoints must be an array with 2 elements");
//       }

//       // Route options - sectionType is a STRING in backend, not an array!
//       const routeOptions = {
//         travelMode: "car",
//         sectionType: "traffic",  // STRING, not array!
//         routeType: "fastest",
//         traffic: true,
//       };

//       // Debug logging
//       console.log("[Route] Waypoints array:", waypointsArray);
//       console.log("[Route] Waypoints is array:", Array.isArray(waypointsArray));
//       console.log("[Route] Route options:", routeOptions);
//       console.log("[Route] sectionType type:", typeof routeOptions.sectionType);
//       console.log("[Route] sectionType value:", routeOptions.sectionType);

//       // API CALL - EXACT match to backend routing.html line 627-636
//       // Signature: calculateRouteDirections(aborter, waypoints[], options{})
//       const result = await routeURLRef.current.calculateRouteDirections(
//         atlas.service.Aborter.timeout(10000),
//         waypointsArray,  // SECOND parameter: array of [lon,lat] arrays
//         routeOptions      // THIRD parameter: options object
//       );

//       const geojson = result.geojson.getFeatures();
//       const route = geojson.features[0];
//       const summary = result.routes[0].summary;

//       // Add route and markers - EXACTLY as backend (line 643-655)
//       // startPoint and endPoint are [lon, lat] arrays, not Position objects
//       datasource.add([
//         route,
//         new atlas.data.Feature(new atlas.data.Point(startPoint), {  // Can take [lon,lat] array
//           title: "Start",
//           iconImage: "pin-blue",
//           color: "#27ae60",
//         }),
//         new atlas.data.Feature(new atlas.data.Point(endPoint), {  // Can take [lon,lat] array
//           title: "End",
//           iconImage: "pin-red",
//           color: "#e74c3c",
//         }),
//       ]);

//       // Update map camera - with robust bbox validation to prevent matrix inversion errors
//       try {
//         // Validate bbox before using it
//         let useBbox = false;
//         if (geojson.bbox && Array.isArray(geojson.bbox) && geojson.bbox.length === 4) {
//           const [minLon, minLat, maxLon, maxLat] = geojson.bbox;
          
//           // Check all values are valid numbers
//           const allValid = [minLon, minLat, maxLon, maxLat].every(
//             val => typeof val === 'number' && isFinite(val) && !isNaN(val)
//           );
          
//           // Check bbox has non-zero width and height (prevents matrix inversion error)
//           const hasWidth = Math.abs(maxLon - minLon) > 0.0001; // At least ~11 meters
//           const hasHeight = Math.abs(maxLat - minLat) > 0.0001; // At least ~11 meters
          
//           // Check bbox is in valid coordinate ranges
//           const inRange = 
//             minLon >= -180 && maxLon <= 180 && minLon < maxLon &&
//             minLat >= -90 && maxLat <= 90 && minLat < maxLat;
          
//           useBbox = allValid && hasWidth && hasHeight && inRange;
          
//           if (useBbox) {
//             console.log("[Camera] Using bbox:", geojson.bbox);
//             mapRef.current.setCamera({
//               bounds: geojson.bbox,
//               padding: { top: 100, bottom: 200, left: 420, right: 50 },
//             });
//           } else {
//             console.log("[Camera] Bbox invalid, using center fallback. Bbox:", geojson.bbox);
//             throw new Error("Invalid bbox, using center fallback");
//           }
//         } else {
//           throw new Error("No bbox available, using center fallback");
//         }
//       } catch (cameraError) {
//         // Fallback: center between points with calculated zoom
//         console.log("[Camera] Fallback to center/zoom:", cameraError.message);
//         const centerLon = (startPoint[0] + endPoint[0]) / 2;
//         const centerLat = (startPoint[1] + endPoint[1]) / 2;
        
//         // Calculate distance to determine appropriate zoom level
//         const deltaLon = Math.abs(endPoint[0] - startPoint[0]);
//         const deltaLat = Math.abs(endPoint[1] - startPoint[1]);
//         const maxDelta = Math.max(deltaLon, deltaLat);
        
//         // Determine zoom level based on distance
//         let zoom = 12;
//         if (maxDelta > 1) zoom = 6;        // Very far (>100km)
//         else if (maxDelta > 0.5) zoom = 8;  // Far (>50km)
//         else if (maxDelta > 0.1) zoom = 10; // Medium (>10km)
//         else if (maxDelta > 0.05) zoom = 12; // Close (>5km)
//         else if (maxDelta > 0.01) zoom = 14; // Very close (>1km)
//         else zoom = 16;                      // Extremely close
        
//         mapRef.current.setCamera({
//           center: [centerLon, centerLat],
//           zoom: zoom,
//         });
//       }

//       // Update results
//       setDistance(summary.lengthInMeters);
//       setDuration(summary.travelTimeInSeconds);
//       showSuccessToast("Route calculated successfully!");

//     } catch (e) {
//       console.error("Route calculation error:", e);
//       const errorMsg = e.message || "Failed to calculate route. Check your inputs and try again.";
//       showErrorToast(errorMsg);
//     } finally {
//       setIsCalculating(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white relative overflow-hidden">
//       <Navbar />

//       {/* Map Container */}
//       <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ top: 0, left: 0 }} />

//       {/* Route Planning Panel - styled like backend */}
//       <div className="absolute top-20 left-5 z-50 w-[380px] max-w-[calc(100vw-40px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
//         <div className="p-5 border-b border-gray-200">
//           <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//             Plan Your Route
//           </h2>
//           <p className="text-sm text-gray-600">Enter your starting point and destination</p>
//         </div>

//         <div className="p-5 space-y-5">
//           {/* Start Location */}
//           <div>
//             <label htmlFor="startInput" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
//               <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
//               </svg>
//               Starting Location
//             </label>
//             <input
//               id="startInput"
//               type="text"
//               value={startLocation}
//               onChange={(e) => setStartLocation(e.target.value)}
//               placeholder="e.g. 40.7128,-74.0060 or 'Times Square NYC'"
//               className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base font-sans bg-white/80 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
//               onKeyPress={(e) => e.key === "Enter" && calculateRoute()}
//             />
//           </div>

//           {/* End Location */}
//           <div>
//             <label htmlFor="endInput" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
//               <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//               </svg>
//               Destination
//             </label>
//             <input
//               id="endInput"
//               type="text"
//               value={endLocation}
//               onChange={(e) => setEndLocation(e.target.value)}
//               placeholder="e.g. 40.555,-73.99 or polling center address"
//               className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base font-sans bg-white/80 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
//               onKeyPress={(e) => e.key === "Enter" && calculateRoute()}
//             />
//           </div>

//           {/* Calculate Button */}
//           <button
//             onClick={calculateRoute}
//             disabled={isCalculating || !startLocation.trim() || !endLocation.trim()}
//             className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 relative overflow-hidden"
//           >
//             {isCalculating ? (
//               <>
//                 <div className="w-[18px] h-[18px] border-2 border-white/30 rounded-full border-t-white animate-spin"></div>
//               </>
//             ) : (
//               <>
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
//                 </svg>
//                 <span>Calculate Route</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Route Results Panel - styled like backend */}
//       {(distance !== null || duration !== null) && (
//         <div className="absolute bottom-5 left-5 right-5 max-w-[400px] z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-5">
//           <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
//             <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             Route Information
//           </h3>
//           <div className="grid grid-cols-2 gap-5">
//             <div className="text-center p-3 bg-white/60 rounded-lg">
//               <div className="text-lg font-bold text-gray-800 mb-1">{formatDistance(distance)}</div>
//               <div className="text-sm text-gray-600 font-medium">Distance</div>
//             </div>
//             <div className="text-center p-3 bg-white/60 rounded-lg">
//               <div className="text-lg font-bold text-gray-800 mb-1">{formatDuration(duration)}</div>
//               <div className="text-sm text-gray-600 font-medium">Duration</div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Success Toast */}
//       {success && (
//         <div className="fixed top-20 right-5 z-[60] bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-4 rounded-lg shadow-xl flex items-center gap-2">
//           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//           </svg>
//           <span className="font-medium">{success}</span>
//         </div>
//       )}

//       {/* Error Toast */}
//       {error && (
//         <div className="fixed top-20 right-5 z-[60] bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-4 rounded-lg shadow-xl flex items-center gap-2">
//           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//             />
//           </svg>
//           <span className="font-medium">{error}</span>
//           <button
//             onClick={() => setError(null)}
//             className="ml-4 hover:bg-red-700 rounded p-1 transition-colors"
//           >
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
