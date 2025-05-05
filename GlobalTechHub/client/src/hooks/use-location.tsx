import { useState, useEffect } from "react";

interface LocationInfo {
  country: string;
  countryCode: string;
  isVpn: boolean;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    country: "",
    countryCode: "",
    isVpn: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Simulate a location detection API call
        // In a real application, this would call a geolocation API
        const delay = Math.floor(Math.random() * 500) + 500;
        
        // Example countries (for demonstration only)
        const countries = [
          { country: "United States", countryCode: "us" },
          { country: "United Kingdom", countryCode: "gb" },
          { country: "Canada", countryCode: "ca" },
          { country: "Australia", countryCode: "au" },
          { country: "Germany", countryCode: "de" },
          { country: "Japan", countryCode: "jp" },
          { country: "Brazil", countryCode: "br" },
          { country: "India", countryCode: "in" },
        ];
        
        // Simulate VPN detection (5% chance)
        const isVpn = Math.random() < 0.05;
        
        // Select a random country
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        setLocationInfo({
          country: isVpn ? "Unknown" : randomCountry.country,
          countryCode: isVpn ? "xx" : randomCountry.countryCode,
          isVpn,
          loading: false,
          error: null,
        });
      } catch (error) {
        setLocationInfo({
          country: "Unknown",
          countryCode: "xx",
          isVpn: false,
          loading: false,
          error: (error as Error).message,
        });
      }
    };

    fetchLocation();
  }, []);

  return locationInfo;
}
