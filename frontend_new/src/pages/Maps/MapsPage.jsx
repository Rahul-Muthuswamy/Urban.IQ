import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar.jsx";

// Azure Maps API Key (same as backend)
const AZURE_MAPS_KEY = "3ieWM5eQAvishfw1JHifWN77CAuTLQlctJbvHqObOYxBVy04YOx2JQQJ99BKACYeBjFgGbFxAAAgAZMP3NO0";

export default function MapsPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const datasourceRef = useRef(null);
  const routeURLRef = useRef(null);
  const searchURLRef = useRef(null);
  
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load Azure Maps SDK - exactly like backend
  useEffect(() => {
    if (window.atlas) {
      initializeMap();
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css";
    document.head.appendChild(link);

    // Load JavaScript
    const script1 = document.createElement("script");
    script1.src = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js";
    script1.onload = () => {
      const script2 = document.createElement("script");
      script2.src = "https://atlas.microsoft.com/sdk/javascript/service/2/atlas-service.min.js";
      script2.onload = initializeMap;
      document.body.appendChild(script2);
    };
    document.body.appendChild(script1);

    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.atlas || !mapContainerRef.current) return;

    const { atlas } = window;

    // Initialize map - same as backend
    const map = new atlas.Map(mapContainerRef.current, {
      center: [80.2707, 13.0827], // Chennai, India (updated from NYC)
      zoom: 12,
      authOptions: {
        authType: "subscriptionKey",
        subscriptionKey: AZURE_MAPS_KEY,
      },
    });

    map.events.add("ready", () => {
      const datasource = new atlas.source.DataSource();
      map.sources.add(datasource);
      datasourceRef.current = datasource;

      // Add route line layer - same as backend
      map.layers.add(
        new atlas.layer.LineLayer(datasource, null, {
          strokeColor: "#667eea", // Changed from 'blue' to match UI
          strokeWidth: 6,
        })
      );

      // Add symbol layer for markers
      map.layers.add(new atlas.layer.SymbolLayer(datasource));

      // Initialize services - same as backend
      const pipeline = atlas.service.MapsURL.newPipeline(
        new atlas.service.MapControlCredential(map)
      );

      routeURLRef.current = new atlas.service.RouteURL(pipeline);
      searchURLRef.current = new atlas.service.SearchURL(pipeline);
    });

    mapRef.current = map;
  };

  // parseCoord - Enhanced with better validation
  const parseCoord = (str) => {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed.includes(",")) return null;
    
    const parts = trimmed.split(",").map(s => s.trim());
    if (parts.length !== 2) return null;
    
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    
    // Validate that both are valid numbers
    if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) {
      return null;
    }
    
    // Validate coordinate ranges
    // Longitude: -180 to 180, Latitude: -90 to 90
    // If abs(a) > 90, assume it's lon,lat, else assume lat,lon
    const [lon, lat] = Math.abs(a) > 90 ? [a, b] : [b, a];
    
    // Final validation - ensure coordinates are in valid ranges
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return null;
    }
    
    return [lon, lat];
  };

  // geocode - Enhanced with validation
  const geocode = async (input) => {
    if (!input || typeof input !== 'string' || !input.trim()) {
      throw new Error("Location input cannot be empty");
    }

    // Try parsing as coordinates first
    const coords = parseCoord(input);
    if (coords && Array.isArray(coords) && coords.length === 2) {
      const [lon, lat] = coords;
      // Double-check coordinates are valid numbers
      if (typeof lon === 'number' && typeof lat === 'number' && 
          isFinite(lon) && isFinite(lat) &&
          lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
        return [lon, lat];
      }
    }

    // If not coordinates, try geocoding as address
    if (!window.atlas || !searchURLRef.current) {
      throw new Error("Map services are not ready.");
    }

    const { atlas } = window;
    const r = await searchURLRef.current.searchAddress(
      atlas.service.Aborter.timeout(4000),
      input.trim(),
      { limit: 1 }
    );

    if (!r || !r.results || r.results.length === 0) {
      throw new Error("Unable to geocode: " + input);
    }

    const position = r.results[0].position;
    if (!position || 
        typeof position.lon !== 'number' || typeof position.lat !== 'number' ||
        isNaN(position.lon) || isNaN(position.lat) ||
        !isFinite(position.lon) || !isFinite(position.lat)) {
      throw new Error("Invalid coordinates received from geocoding service");
    }

    const lon = position.lon;
    const lat = position.lat;

    // Validate coordinate ranges
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      throw new Error("Coordinates out of valid range");
    }

    return [lon, lat];
  };

  // formatDistance - EXACT copy from backend (line 577-583)
  const formatDistance = (meters) => {
    if (!meters) return "--";
    if (meters < 1000) {
      return Math.round(meters) + " m";
    } else {
      return (meters / 1000).toFixed(1) + " km";
    }
  };

  // formatDuration - EXACT copy from backend (line 586-595)
  const formatDuration = (seconds) => {
    if (!seconds) return "--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // showError - Toast notification (simplified for React)
  const showErrorToast = (message) => {
    setError(message);
    setTimeout(() => setError(null), 4000);
  };

  // showSuccess - Toast notification (simplified for React)
  const showSuccessToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // calculateRoute - EXACT copy from backend (line 604-675)
  const calculateRoute = async () => {
    const start = startLocation.trim();
    const end = endLocation.trim();

    if (!start || !end) {
      showErrorToast("Please enter both starting location and destination");
      return;
    }

    if (!window.atlas || !routeURLRef.current || !datasourceRef.current || !mapRef.current) {
      showErrorToast("Map is not ready. Please wait for the map to load.");
      return;
    }

    setIsCalculating(true);
    setError(null);
    setSuccess(null);
    setDistance(null);
    setDuration(null);

    try {
      const { atlas } = window;
      const datasource = datasourceRef.current;
      
      datasource.clear();
      showSuccessToast("Finding optimal route...");

      // Get coordinates - EXACTLY as backend
      // geocode() returns [lon, lat] arrays, NOT Position objects
      const startPoint = await geocode(start); // Returns [lon, lat]
      const endPoint = await geocode(end);     // Returns [lon, lat]

      // Validate coordinates are arrays
      if (!Array.isArray(startPoint) || startPoint.length !== 2 ||
          !Array.isArray(endPoint) || endPoint.length !== 2) {
        throw new Error("Invalid coordinates received from geocoding");
      }

      const [startLon, startLat] = startPoint;
      const [endLon, endLat] = endPoint;

      // Final validation - ensure all coordinates are valid numbers
      if (typeof startLon !== 'number' || typeof startLat !== 'number' ||
          typeof endLon !== 'number' || typeof endLat !== 'number' ||
          isNaN(startLon) || isNaN(startLat) || isNaN(endLon) || isNaN(endLat) ||
          !isFinite(startLon) || !isFinite(startLat) || !isFinite(endLon) || !isFinite(endLat)) {
        throw new Error("Invalid coordinates: one or more values are not valid numbers");
      }

      // Log for debugging
      console.log("[Route] Start coords:", startPoint);
      console.log("[Route] End coords:", endPoint);

      // CRITICAL FIX: Backend uses waypoints as SECOND parameter (array of [lon,lat] arrays)
      // and options as THIRD parameter (object with sectionType as STRING, not array)
      // This matches routing.html line 627-636
      const waypointsArray = [startPoint, endPoint];
      
      // Validate waypoints array
      if (!Array.isArray(waypointsArray) || waypointsArray.length !== 2) {
        throw new Error("Waypoints must be an array with 2 elements");
      }

      // Route options - sectionType is a STRING in backend, not an array!
      const routeOptions = {
        travelMode: "car",
        sectionType: "traffic",  // STRING, not array!
        routeType: "fastest",
        traffic: true,
      };

      // Debug logging
      console.log("[Route] Waypoints array:", waypointsArray);
      console.log("[Route] Waypoints is array:", Array.isArray(waypointsArray));
      console.log("[Route] Route options:", routeOptions);
      console.log("[Route] sectionType type:", typeof routeOptions.sectionType);
      console.log("[Route] sectionType value:", routeOptions.sectionType);

      // API CALL - EXACT match to backend routing.html line 627-636
      // Signature: calculateRouteDirections(aborter, waypoints[], options{})
      const result = await routeURLRef.current.calculateRouteDirections(
        atlas.service.Aborter.timeout(10000),
        waypointsArray,  // SECOND parameter: array of [lon,lat] arrays
        routeOptions      // THIRD parameter: options object
      );

      const geojson = result.geojson.getFeatures();
      const route = geojson.features[0];
      const summary = result.routes[0].summary;

      // Add route and markers - EXACTLY as backend (line 643-655)
      // startPoint and endPoint are [lon, lat] arrays, not Position objects
      datasource.add([
        route,
        new atlas.data.Feature(new atlas.data.Point(startPoint), {  // Can take [lon,lat] array
          title: "Start",
          iconImage: "pin-blue",
          color: "#27ae60",
        }),
        new atlas.data.Feature(new atlas.data.Point(endPoint), {  // Can take [lon,lat] array
          title: "End",
          iconImage: "pin-red",
          color: "#e74c3c",
        }),
      ]);

      // Update map camera - with robust bbox validation to prevent matrix inversion errors
      try {
        // Validate bbox before using it
        let useBbox = false;
        if (geojson.bbox && Array.isArray(geojson.bbox) && geojson.bbox.length === 4) {
          const [minLon, minLat, maxLon, maxLat] = geojson.bbox;
          
          // Check all values are valid numbers
          const allValid = [minLon, minLat, maxLon, maxLat].every(
            val => typeof val === 'number' && isFinite(val) && !isNaN(val)
          );
          
          // Check bbox has non-zero width and height (prevents matrix inversion error)
          const hasWidth = Math.abs(maxLon - minLon) > 0.0001; // At least ~11 meters
          const hasHeight = Math.abs(maxLat - minLat) > 0.0001; // At least ~11 meters
          
          // Check bbox is in valid coordinate ranges
          const inRange = 
            minLon >= -180 && maxLon <= 180 && minLon < maxLon &&
            minLat >= -90 && maxLat <= 90 && minLat < maxLat;
          
          useBbox = allValid && hasWidth && hasHeight && inRange;
          
          if (useBbox) {
            console.log("[Camera] Using bbox:", geojson.bbox);
            mapRef.current.setCamera({
              bounds: geojson.bbox,
              padding: { top: 100, bottom: 200, left: 420, right: 50 },
            });
          } else {
            console.log("[Camera] Bbox invalid, using center fallback. Bbox:", geojson.bbox);
            throw new Error("Invalid bbox, using center fallback");
          }
        } else {
          throw new Error("No bbox available, using center fallback");
        }
      } catch (cameraError) {
        // Fallback: center between points with calculated zoom
        console.log("[Camera] Fallback to center/zoom:", cameraError.message);
        const centerLon = (startPoint[0] + endPoint[0]) / 2;
        const centerLat = (startPoint[1] + endPoint[1]) / 2;
        
        // Calculate distance to determine appropriate zoom level
        const deltaLon = Math.abs(endPoint[0] - startPoint[0]);
        const deltaLat = Math.abs(endPoint[1] - startPoint[1]);
        const maxDelta = Math.max(deltaLon, deltaLat);
        
        // Determine zoom level based on distance
        let zoom = 12;
        if (maxDelta > 1) zoom = 6;        // Very far (>100km)
        else if (maxDelta > 0.5) zoom = 8;  // Far (>50km)
        else if (maxDelta > 0.1) zoom = 10; // Medium (>10km)
        else if (maxDelta > 0.05) zoom = 12; // Close (>5km)
        else if (maxDelta > 0.01) zoom = 14; // Very close (>1km)
        else zoom = 16;                      // Extremely close
        
        mapRef.current.setCamera({
          center: [centerLon, centerLat],
          zoom: zoom,
        });
      }

      // Update results
      setDistance(summary.lengthInMeters);
      setDuration(summary.travelTimeInSeconds);
      showSuccessToast("Route calculated successfully!");

    } catch (e) {
      console.error("Route calculation error:", e);
      const errorMsg = e.message || "Failed to calculate route. Check your inputs and try again.";
      showErrorToast(errorMsg);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Navbar />

      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ top: 0, left: 0 }} />

      {/* Route Planning Panel - styled like backend */}
      <div className="absolute top-20 left-5 z-50 w-[380px] max-w-[calc(100vw-40px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Plan Your Route
          </h2>
          <p className="text-sm text-gray-600">Enter your starting point and destination</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Start Location */}
          <div>
            <label htmlFor="startInput" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Starting Location
            </label>
            <input
              id="startInput"
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              placeholder="e.g. 40.7128,-74.0060 or 'Times Square NYC'"
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base font-sans bg-white/80 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              onKeyPress={(e) => e.key === "Enter" && calculateRoute()}
            />
          </div>

          {/* End Location */}
          <div>
            <label htmlFor="endInput" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Destination
            </label>
            <input
              id="endInput"
              type="text"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              placeholder="e.g. 40.555,-73.99 or polling center address"
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base font-sans bg-white/80 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              onKeyPress={(e) => e.key === "Enter" && calculateRoute()}
            />
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateRoute}
            disabled={isCalculating || !startLocation.trim() || !endLocation.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {isCalculating ? (
              <>
                <div className="w-[18px] h-[18px] border-2 border-white/30 rounded-full border-t-white animate-spin"></div>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Calculate Route</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Route Results Panel - styled like backend */}
      {(distance !== null || duration !== null) && (
        <div className="absolute bottom-5 left-5 right-5 max-w-[400px] z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Route Information
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-lg font-bold text-gray-800 mb-1">{formatDistance(distance)}</div>
              <div className="text-sm text-gray-600 font-medium">Distance</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-lg font-bold text-gray-800 mb-1">{formatDuration(duration)}</div>
              <div className="text-sm text-gray-600 font-medium">Duration</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed top-20 right-5 z-[60] bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-4 rounded-lg shadow-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 right-5 z-[60] bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-4 rounded-lg shadow-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 hover:bg-red-700 rounded p-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
