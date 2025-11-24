import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar.jsx";
import LocationDetails from "./LocationDetails.jsx";
import RoutePanel from "./RoutePanel.jsx";
import RouteResults from "./RouteResults.jsx";

// Azure Maps API Key - TODO: Move to environment variable
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
  const [routeData, setRouteData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load Azure Maps SDK
  useEffect(() => {
    // Check if Azure Maps is already loaded
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
      // Cleanup
      if (mapRef.current) {
        mapRef.current.dispose();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.atlas || !mapContainerRef.current) return;

    const { atlas } = window;

    // Initialize map
    const map = new atlas.Map(mapContainerRef.current, {
      center: [80.2707, 13.0827], // Chennai, India
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

      // Add route line layer
      map.layers.add(
        new atlas.layer.LineLayer(datasource, null, {
          strokeColor: "#84cc16",
          strokeWidth: 6,
          strokeOpacity: 0.8,
        })
      );

      // Add symbol layer for markers
      map.layers.add(new atlas.layer.SymbolLayer(datasource));

      // Initialize services
      const pipeline = atlas.service.MapsURL.newPipeline(
        new atlas.service.MapControlCredential(map)
      );

      routeURLRef.current = new atlas.service.RouteURL(pipeline);
      searchURLRef.current = new atlas.service.SearchURL(pipeline);

      // Enable click to get location details
      map.events.add("click", async (e) => {
        const position = [e.position[0], e.position[1]];
        const coordinates = map.pixelToCoordinates(position);
        
        // Reverse geocode to get address
        try {
          const result = await searchURLRef.current.reverseSearchAddress(
            atlas.service.Aborter.timeout(4000),
            coordinates
          );
          
          if (result.addresses && result.addresses.length > 0) {
            const address = result.addresses[0].address;
            setSelectedLocation({
              coordinates: [coordinates[0], coordinates[1]],
              address: address.freeformAddress || `${address.streetName || ""} ${address.municipality || ""}`.trim(),
              city: address.municipality || "",
              country: address.country || "",
            });
            
            // Fetch location details
            fetchLocationDetails(address.freeformAddress || address.municipality || "");
          }
        } catch (err) {
          console.error("Reverse geocode error:", err);
        }
      });
    });

    mapRef.current = map;
  };

  const parseCoordinates = (str) => {
    if (!str.includes(",")) return null;
    const parts = str.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    // Assume lat,lon format
    return Math.abs(parts[0]) > 90 ? [parts[1], parts[0]] : [parts[0], parts[1]];
  };

  const geocode = async (input) => {
    const coords = parseCoordinates(input);
    if (coords) return coords;

    const { atlas } = window;
    const result = await searchURLRef.current.searchAddress(
      atlas.service.Aborter.timeout(4000),
      input,
      { limit: 1 }
    );

    if (result.results.length === 0) {
      throw new Error(`Unable to find location: ${input}`);
    }

    const position = result.results[0].position;
    return [position.lon, position.lat];
  };

  const fetchLocationDetails = async (locationName) => {
    if (!locationName) return;

    try {
      // Use web search to get location details
      const searchQuery = `${locationName} information facts`;
      const searchResults = await web_search(searchQuery);
      
      setLocationDetails({
        name: locationName,
        description: searchResults.description || "",
        facts: searchResults.facts || [],
        images: searchResults.images || [],
      });
    } catch (error) {
      console.error("Error fetching location details:", error);
      setLocationDetails({
        name: locationName,
        description: "Location information not available.",
        facts: [],
        images: [],
      });
    }
  };

  const webSearch = async (query) => {
    // TODO: Implement web search API integration
    // For now, return mock data
    return {
      description: `Discover ${query.split(" ")[0]} - a vibrant location with rich culture and history.`,
      facts: [
        "Popular destination for tourists",
        "Well-connected transportation",
        "Rich cultural heritage",
      ],
      images: [],
    };
  };

  const calculateRoute = async () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      setError("Please enter both start and end locations");
      return;
    }

    setIsCalculating(true);
    setError(null);
    setSuccess(null);

    try {
      const { atlas } = window;
      const datasource = datasourceRef.current;
      
      datasource.clear();
      setRouteData(null);

      setSuccess("Finding optimal route...");

      const startPoint = await geocode(startLocation);
      const endPoint = await geocode(endLocation);

      const result = await routeURLRef.current.calculateRouteDirections(
        atlas.service.Aborter.timeout(10000),
        [startPoint, endPoint],
        {
          travelMode: "car",
          sectionType: "traffic",
          routeType: "fastest",
          traffic: true,
        }
      );

      const geojson = result.geojson.getFeatures();
      const route = geojson.features[0];
      const summary = result.routes[0].summary;

      // Add route and markers to map
      datasource.add([
        route,
        new atlas.data.Feature(new atlas.data.Point(startPoint), {
          title: "Start",
          iconImage: "pin-blue",
          color: "#84cc16",
        }),
        new atlas.data.Feature(new atlas.data.Point(endPoint), {
          title: "End",
          iconImage: "pin-red",
          color: "#10b981",
        }),
      ]);

      // Update map view
      mapRef.current.setCamera({
        bounds: geojson.bbox,
        padding: { top: 100, bottom: 200, left: 420, right: 50 },
      });

      // Update route data
      setRouteData({
        distance: summary.lengthInMeters,
        duration: summary.travelTimeInSeconds,
        startPoint,
        endPoint,
      });

      setSuccess("Route calculated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Route calculation error:", err);
      setError(err.message || "Failed to calculate route. Please check your locations.");
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return Math.round(meters) + " m";
    }
    return (meters / 1000).toFixed(1) + " km";
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Navbar />

      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ top: 0, left: 0 }} />

      {/* Route Planning Panel */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-24 left-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <RoutePanel
          startLocation={startLocation}
          endLocation={endLocation}
          onStartChange={setStartLocation}
          onEndChange={setEndLocation}
          onCalculate={calculateRoute}
          isCalculating={isCalculating}
        />
      </motion.div>

      {/* Route Results */}
      {routeData && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 right-4 z-50"
        >
          <RouteResults
            distance={formatDistance(routeData.distance)}
            duration={formatDuration(routeData.duration)}
          />
        </motion.div>
      )}

      {/* Location Details Panel */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 z-50 max-w-md"
        >
          <LocationDetails
            location={selectedLocation}
            details={locationDetails}
            onSetStart={(address) => setStartLocation(address)}
            onSetEnd={(address) => setEndLocation(address)}
            onClose={() => {
              setSelectedLocation(null);
              setLocationDetails(null);
            }}
          />
        </motion.div>
      )}

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-24 right-4 z-[60] bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-24 right-4 z-[60] bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 hover:bg-red-600 rounded p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

