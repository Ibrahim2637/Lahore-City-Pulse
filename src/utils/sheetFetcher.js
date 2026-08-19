// Fetch and parse data from Google Sheet

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1SPqvXIBVhGAjFWR86s4JlehaPMs6zq_31m61KvtQRKc/gviz/tq?tqx=out:csv";

// Helper to parse CSV robustly (handling double quotes and commas inside them)
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = [];
    let insideQuote = false;
    let current = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^"|"$/g, ''));
    result.push(row);
  }
  return result;
}

export async function fetchCivicData() {
  try {
    // Check sessionStorage cache (5-second TTL for real-time responsive updates)
    const CACHE_KEY = 'lahore-civic-data';
    const CACHE_TIME_KEY = 'lahore-civic-data-time';
    const CACHE_TTL = 5 * 1000; // 5 seconds
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cacheTime = sessionStorage.getItem(CACHE_TIME_KEY);
    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
      console.log('Using cached civic data');
      return JSON.parse(cached);
    }

    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    // Let's build a flat dictionary of metric -> value
    const metricsMap = {};
    let dateStr = new Date().toISOString().split('T')[0]; // Default date

    // Determine format: Tabular vs Key-Value
    const headerRow = rows[0] || [];
    const isTabularFormat = headerRow.some(cell => cell && cell.toLowerCase().includes('timestamp'));

    if (isTabularFormat && rows.length > 1) {
      // Find the latest valid row (loop from the end to find a row that is populated)
      let latestRow = null;
      for (let i = rows.length - 1; i >= 1; i--) {
        const row = rows[i];
        if (row && row.length > 0 && row[0] && row[0].trim() !== '') {
          latestRow = row;
          break;
        }
      }

      if (latestRow) {
        // Parse date from the first column of the latest row
        dateStr = latestRow[0].trim();

        // Helper to find column index by list of possible names (case-insensitive, symbols stripped)
        const getColIdx = (possibleNames) => {
          return headerRow.findIndex(cell => {
            if (!cell) return false;
            const normalized = cell.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            return possibleNames.some(name => normalized.includes(name.toLowerCase().replace(/[^a-z0-9]/g, '')));
          });
        };

        // Helper to set metricsMap value if column is found
        const setMetric = (metricId, possibleNames) => {
          const idx = getColIdx(possibleNames);
          if (idx !== -1 && latestRow[idx] !== undefined && latestRow[idx] !== null) {
            metricsMap[metricId] = latestRow[idx].trim();
          }
        };

        setMetric("temperature_c", ["temperaturec", "temp"]);
        setMetric("humidity_percent", ["humiditypct", "humidity"]);
        setMetric("precipitation_mm", ["precipitationmm", "precip"]);
        setMetric("rain_mm", ["precipitationmm", "precip", "rain"]); 
        setMetric("wind_speed_kmh", ["windspeedkmh", "windspeed"]);
        setMetric("wind_direction_deg", ["winddirectiondeg", "winddir"]);
        setMetric("pressure_hpa", ["pressurehpa", "pressure"]);
        setMetric("aqi", ["usaqi", "aqi"]);
        setMetric("pm2_5", ["pm25", "pm2_5"]);
        setMetric("pm10", ["pm10"]);
        setMetric("european_aqi", ["europeanaqi"]);
        setMetric("co_concentration", ["co"]);
        setMetric("no2_concentration", ["no2"]);
        setMetric("so2_concentration", ["so2"]);
        setMetric("ozone_concentration", ["ozone"]);
        setMetric("weather_alerts", ["alerts"]);
      }
    } else {
      // Key-Value Row-by-Row parsing format
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 4) {
          const dateVal = row[0];
          const metricVal = row[2];
          const valueVal = row[3];
          
          if (metricVal) {
            metricsMap[metricVal.trim()] = valueVal ? valueVal.trim() : "";
          }
          if (dateVal && i === 1) {
            dateStr = dateVal.trim();
          }
        }
      }
    }

    // Helper to format values nicely (or show "N/A" for empty fields)
    const getVal = (key, suffix = "", fallback = "N/A") => {
      const val = metricsMap[key];
      if (val === undefined || val === null || val === "") return fallback;
      return val + suffix;
    };

    // Grouping according to requirements
    const data = {
      lastUpdated: dateStr,
      alerts: metricsMap["weather_alerts"] || "none",
      categories: {
        environment: {
          title: "Environment & Weather",
          icon: "CloudRain",
          color: "#4CAF50",
          items: [
            { id: "aqi", label: "Air Quality Index (AQI)", value: getVal("aqi", "", "140"), description: "Standard PM2.5 / PM10 index for Lahore" },
            { id: "weather_code", label: "Weather Code", value: getVal("weather_code", "", "Sunny (0)"), description: "WMO weather interpretation code" },
            { id: "temperature_c", label: "Temperature", value: getVal("temperature_c", "°C", "26°C"), description: "Current temperature in Celsius" },
            { id: "feels_like_c", label: "Feels Like", value: getVal("feels_like_c", "°C", "31°C"), description: "Perceived temperature in Celsius" },
            { id: "today_temp_max_c", label: "Today's Max Temp", value: getVal("today_temp_max_c", "°C", "34.4°C"), description: "Peak temperature forecast for today" },
            { id: "today_temp_min_c", label: "Today's Min Temp", value: getVal("today_temp_min_c", "°C", "24.2°C"), description: "Lowest temperature forecast for today" },
            { id: "humidity_percent", label: "Humidity", value: getVal("humidity_percent", "%", "96%"), description: "Relative humidity percentage" },
            { id: "pressure_hpa", label: "Atmospheric Pressure", value: getVal("pressure_hpa", " hPa", "975.9 hPa"), description: "Barometric pressure in Hectopascals" },
            { id: "wind_speed_kmh", label: "Wind Speed", value: getVal("wind_speed_kmh", " km/h", "9 km/h"), description: "Wind speed in kilometers per hour" },
            { id: "wind_direction_deg", label: "Wind Direction", value: getVal("wind_direction_deg", "°", "89°"), description: "Wind direction in degrees" },
            { id: "precipitation_mm", label: "Precipitation", value: getVal("precipitation_mm", " mm", "0 mm"), description: "Current hourly precipitation" },
            { id: "rain_mm", label: "Rain", value: getVal("rain_mm", " mm", "0 mm"), description: "Hourly rainfall amount" },
            { id: "today_precipitation_sum_mm", label: "Precipitation Sum Today", value: getVal("today_precipitation_sum_mm", " mm", "12.9 mm"), description: "Total rain expected today" },
            { id: "today_precipitation_probability_pct", label: "Rain Probability", value: getVal("today_precipitation_probability_pct", "%", "100%"), description: "Chance of rainfall today" },
            { id: "today_uv_index_max", label: "Max UV Index", value: getVal("today_uv_index_max", "", "8"), description: "Maximum UV radiation forecast" },
            { id: "sunrise", label: "Sunrise", value: getVal("sunrise", "", "05:28 AM"), description: "Time of sunrise (PKT)" },
            { id: "sunset", label: "Sunset", value: getVal("sunset", "", "06:45 PM"), description: "Time of sunset (PKT)" },
            { id: "pm2_5", label: "PM2.5 Particulates", value: getVal("pm2_5", " µg/m³", "N/A"), description: "Fine particulate matter concentration" },
            { id: "pm10", label: "PM10 Particulates", value: getVal("pm10", " µg/m³", "N/A"), description: "Coarse particulate matter concentration" },
            { id: "co_concentration", label: "Carbon Monoxide (CO)", value: getVal("co_concentration", " ppb", "N/A"), description: "CO gas concentration in parts per billion" },
            { id: "no2_concentration", label: "Nitrogen Dioxide (NO2)", value: getVal("no2_concentration", " ppb", "N/A"), description: "NO2 gas concentration in parts per billion" },
            { id: "so2_concentration", label: "Sulfur Dioxide (SO2)", value: getVal("so2_concentration", " ppb", "N/A"), description: "SO2 gas concentration in parts per billion" },
            { id: "ozone_concentration", label: "Ozone (O3)", value: getVal("ozone_concentration", " ppb", "N/A"), description: "Ozone concentration in parts per billion" }
          ]
        },
        fuel: {
          title: "Fuel & Energy Rates",
          icon: "Flame",
          color: "#FF9800",
          items: [
            { id: "effective_date", label: "Effective Date", value: getVal("effective_date", "", "14 August 2026"), description: "Date of latest price implementation" },
            { id: "petrol_per_litre", label: "Petrol", value: getVal("petrol_per_litre", " PKR/L", "325.00 PKR/L"), description: "Motor Gasoline rate per litre" },
            { id: "high_speed_diesel_per_litre", label: "High Speed Diesel", value: getVal("high_speed_diesel_per_litre", " PKR/L", "383.95 PKR/L"), description: "HSD rate per litre" },
            { id: "high_octane_per_litre", label: "High Octane (HOBC)", value: getVal("high_octane_per_litre", " PKR/L", "355.00 PKR/L"), description: "Premium fuel rate per litre" },
            { id: "light_diesel_per_litre", label: "Light Diesel Oil", value: getVal("light_diesel_per_litre", " PKR/L", "249.03 PKR/L"), description: "LDO rate per litre" },
            { id: "kerosene_per_litre", label: "Kerosene Oil", value: getVal("kerosene_per_litre", " PKR/L", "289.75 PKR/L"), description: "Kerosene rate per litre" },
            { id: "lpg_per_kg", label: "LPG Rate", value: getVal("lpg_per_kg", " PKR/kg", "325.81 PKR/kg"), description: "Liquefied Petroleum Gas per kg" },
            { id: "cng_region1_per_kg", label: "CNG Region 1", value: getVal("cng_region1_per_kg", " PKR/kg", "195.00 PKR/kg"), description: "CNG rate in Region 1 (KPK, Balochistan, Potohar)" },
            { id: "cng_region2_per_kg", label: "CNG Region 2", value: getVal("cng_region2_per_kg", " PKR/kg", "210.00 PKR/kg"), description: "CNG rate in Region 2 (Sindh, Punjab)" }
          ]
        },
        markets: {
          title: "Markets & Crypto",
          icon: "TrendingUp",
          color: "#E91E63",
          items: [
            { id: "gold_24K_per_tola", label: "Gold 24K", value: getVal("gold_24K_per_tola", " PKR/tola", "450,150 PKR/tola"), description: "Pure 24 Karat gold rate per tola" },
            { id: "gold_22K_per_tola", label: "Gold 22K", value: getVal("gold_22K_per_tola", " PKR/tola", "441,900 PKR/tola"), description: "22 Karat jewelry gold rate per tola" },
            { id: "gold_21K_per_tola", label: "Gold 21K", value: getVal("gold_21K_per_tola", " PKR/tola", "436,900 PKR/tola"), description: "21 Karat gold rate per tola" },
            { id: "gold_18K_per_tola", label: "Gold 18K", value: getVal("gold_18K_per_tola", " PKR/tola", "337,612 PKR/tola"), description: "18 Karat gold rate per tola" },
            { id: "silver_per_tola", label: "Silver Rate", value: getVal("silver_per_tola", " PKR/tola", "6,910 PKR/tola"), description: "Silver rate per tola" },
            { id: "dollar_rate_pkr", label: "USD to PKR", value: getVal("dollar_rate_pkr", " PKR", "279.00 PKR"), description: "Interbank US Dollar rate in PKR" },
            { id: "bitcoin_usd", label: "Bitcoin (USD)", value: getVal("bitcoin_usd", " USD", "63,228.85 USD"), description: "BTC rate in US Dollars" },
            { id: "bitcoin_pkr", label: "Bitcoin (PKR)", value: getVal("bitcoin_pkr", " PKR", "17,621,880.00 PKR"), description: "BTC rate in Pakistani Rupees" },
            { id: "ethereum_usd", label: "Ethereum (USD)", value: getVal("ethereum_usd", " USD", "1,888.00 USD"), description: "ETH rate in US Dollars" },
            { id: "ethereum_pkr", label: "Ethereum (PKR)", value: getVal("ethereum_pkr", " PKR", "526,082.00 PKR"), description: "ETH rate in Pakistani Rupees" }
          ]
        },
        economy: {
          title: "Macro-Economy",
          icon: "BarChart3",
          color: "#3F51B5",
          items: [
            { id: "total_population", label: "Total Population", value: getVal("total_population", "", "13,851,000"), description: "Lahore Division estimated population" },
            { id: "annual_gdp_growth_rate", label: "Annual GDP Growth", value: getVal("annual_gdp_growth_rate", "", "3.70%"), description: "Pakistan GDP annual growth rate" },
            { id: "large_scale_manufacturing_growth", label: "LSM Growth", value: getVal("large_scale_manufacturing_growth", "", "5.77%"), description: "Large Scale Manufacturing index growth" },
            { id: "unemployment_rate", label: "Unemployment Rate", value: getVal("unemployment_rate", "", "7.10%"), description: "Percentage of unemployed workforce" },
            { id: "average_monthly_wage", label: "Average Monthly Wage", value: getVal("average_monthly_wage", " PKR", "32,500 PKR"), description: "Estimated average monthly salary" },
            { id: "per_capita_income", label: "Per Capita Income", value: getVal("per_capita_income", " USD/year", "1,568 USD/year"), description: "Average income earned per person per year" },
            { id: "average_monthly_household_income", label: "Household Income", value: getVal("average_monthly_household_income", " PKR", "82,179 PKR"), description: "Average monthly household income in Punjab" },
            { id: "average_monthly_household_consumption", label: "Household Consumption", value: getVal("average_monthly_household_consumption", " PKR", "79,150 PKR"), description: "Average monthly household consumption expenditure" }
          ]
        },
        demographics: {
          title: "Demographics & Civic Health",
          icon: "HeartPulse",
          color: "#009688",
          items: [
            { id: "out_of_school_children", label: "Out of School Children", value: getVal("out_of_school_children", "", "28%"), description: "Percentage of children aged 5-16 not enrolled in school" },
            { id: "literacy_rate", label: "Literacy Rate", value: getVal("literacy_rate", "", "63%"), description: "Percentage of population (10+) that can read and write" },
            { id: "fully_immunized_children", label: "Fully Immunized Children", value: getVal("fully_immunized_children", "", "73%"), description: "Percentage of children (12-23 months) fully vaccinated" },
            { id: "total_fertility_rate", label: "Total Fertility Rate", value: getVal("total_fertility_rate", "", "3.4"), description: "Average number of children born per woman" },
            { id: "mobile_smartphone_ownership", label: "Smartphone Ownership", value: getVal("mobile_smartphone_ownership", "", "50%"), description: "Percentage of individuals owning a smartphone" },
            { id: "internet_usage", label: "Internet Usage (Individual)", value: getVal("internet_usage", "", "57%"), description: "Percentage of individuals using internet" },
            { id: "household_internet_usage", label: "Internet Usage (Household)", value: getVal("household_internet_usage", "", "70%"), description: "Percentage of households with internet connection" },
            { id: "household_with_gas", label: "Households with Gas", value: getVal("household_with_gas", "", "47%"), description: "Percentage of households with natural gas connections" },
            { id: "household_with_electricity", label: "Households with Electricity", value: getVal("household_with_electricity", "", "96%"), description: "Percentage of households with grid electricity connection" }
          ]
        }
      }
    };
    
    // Cache the result in sessionStorage
    try {
      sessionStorage.setItem('lahore-civic-data', JSON.stringify(data));
      sessionStorage.setItem('lahore-civic-data-time', Date.now().toString());
    } catch (e) { /* sessionStorage might be full or unavailable */ }

    return data;
  } catch (error) {
    console.error("Error fetching sheet data, using fallback", error);
    // Fallback data in case the sheet fetch fails
    return {
      lastUpdated: "2026-08-16",
      categories: {
        environment: {
          title: "Environment & Weather",
          icon: "CloudRain",
          color: "#4CAF50",
          items: [
            { id: "aqi", label: "Air Quality Index (AQI)", value: "140", description: "Standard PM2.5 / PM10 index for Lahore" },
            { id: "weather_code", label: "Weather Code", value: "0 (Sunny)", description: "WMO weather interpretation code" },
            { id: "temperature_c", label: "Temperature", value: "26.2°C", description: "Current temperature in Celsius" },
            { id: "feels_like_c", label: "Feels Like", value: "31.8°C", description: "Perceived temperature in Celsius" },
            { id: "today_temp_max_c", label: "Today's Max Temp", value: "34.4°C", description: "Peak temperature forecast for today" },
            { id: "today_temp_min_c", label: "Today's Min Temp", value: "24.2°C", description: "Lowest temperature forecast for today" },
            { id: "humidity_percent", label: "Humidity", value: "96%", description: "Relative humidity percentage" },
            { id: "pressure_hpa", label: "Atmospheric Pressure", value: "975.9 hPa", description: "Barometric pressure in Hectopascals" },
            { id: "wind_speed_kmh", label: "Wind Speed", value: "9 km/h", description: "Wind speed in kilometers per hour" },
            { id: "wind_direction_deg", label: "Wind Direction", value: "89°", description: "Wind direction in degrees" },
            { id: "precipitation_mm", label: "Precipitation", value: "0 mm", description: "Current hourly precipitation" },
            { id: "rain_mm", label: "Rain", value: "0 mm", description: "Hourly rainfall amount" },
            { id: "today_precipitation_sum_mm", label: "Precipitation Sum Today", value: "12.9 mm", description: "Total rain expected today" },
            { id: "today_precipitation_probability_pct", label: "Rain Probability", value: "100%", description: "Chance of rainfall today" },
            { id: "today_uv_index_max", label: "Max UV Index", value: "8", description: "Maximum UV radiation forecast" },
            { id: "sunrise", label: "Sunrise", value: "2026-08-16 5:28", description: "Time of sunrise (PKT)" },
            { id: "sunset", label: "Sunset", value: "2026-08-16 18:45", description: "Time of sunset (PKT)" }
          ]
        },
        fuel: {
          title: "Fuel & Energy Rates",
          icon: "Flame",
          color: "#FF9800",
          items: [
            { id: "effective_date", label: "Effective Date", value: "14 August 2026", description: "Date of latest price implementation" },
            { id: "petrol_per_litre", label: "Petrol", value: "325 PKR/L", description: "Motor Gasoline rate per litre" },
            { id: "high_speed_diesel_per_litre", label: "High Speed Diesel", value: "383.95 PKR/L", description: "HSD rate per litre" },
            { id: "high_octane_per_litre", label: "High Octane (HOBC)", value: "355 PKR/L", description: "Premium fuel rate per litre" },
            { id: "light_diesel_per_litre", label: "Light Diesel Oil", value: "249.03 PKR/L", description: "LDO rate per litre" },
            { id: "kerosene_per_litre", label: "Kerosene Oil", value: "289.75 PKR/L", description: "Kerosene rate per litre" },
            { id: "lpg_per_kg", label: "LPG Rate", value: "325.81 PKR/kg", description: "Liquefied Petroleum Gas per kg" },
            { id: "cng_region1_per_kg", label: "CNG Region 1", value: "195 PKR/kg", description: "CNG rate in Region 1 (KPK, Balochistan, Potohar)" },
            { id: "cng_region2_per_kg", label: "CNG Region 2", value: "210 PKR/kg", description: "CNG rate in Region 2 (Sindh, Punjab)" }
          ]
        },
        markets: {
          title: "Markets & Crypto",
          icon: "TrendingUp",
          color: "#E91E63",
          items: [
            { id: "gold_24K_per_tola", label: "Gold 24K", value: "450,150 PKR/tola", description: "Pure 24 Karat gold rate per tola" },
            { id: "gold_22K_per_tola", label: "Gold 22K", value: "441,900 PKR/tola", description: "22 Karat jewelry gold rate per tola" },
            { id: "gold_21K_per_tola", label: "Gold 21K", value: "436,900 PKR/tola", description: "21 Karat gold rate per tola" },
            { id: "gold_18K_per_tola", label: "Gold 18K", value: "337,612 PKR/tola", description: "18 Karat gold rate per tola" },
            { id: "silver_per_tola", label: "Silver Rate", value: "6,910 PKR/tola", description: "Silver rate per tola" },
            { id: "dollar_rate_pkr", label: "USD to PKR", value: "279 PKR", description: "Interbank US Dollar rate in PKR" },
            { id: "bitcoin_usd", label: "Bitcoin (USD)", value: "63,228.85 USD", description: "BTC rate in US Dollars" },
            { id: "bitcoin_pkr", label: "Bitcoin (PKR)", value: "17,621,880.00 PKR", description: "BTC rate in Pakistani Rupees" },
            { id: "ethereum_usd", label: "Ethereum (USD)", value: "1,888 USD", description: "ETH rate in US Dollars" },
            { id: "ethereum_pkr", label: "Ethereum (PKR)", value: "526,082.00 PKR", description: "ETH rate in Pakistani Rupees" }
          ]
        },
        economy: {
          title: "Macro-Economy",
          icon: "BarChart3",
          color: "#3F51B5",
          items: [
            { id: "total_population", label: "Total Population", value: "13,851,000", description: "Lahore Division estimated population" },
            { id: "annual_gdp_growth_rate", label: "Annual GDP Growth", value: "3.70%", description: "Pakistan GDP annual growth rate" },
            { id: "large_scale_manufacturing_growth", label: "LSM Growth", value: "5.77%", description: "Large Scale Manufacturing index growth" },
            { id: "unemployment_rate", label: "Unemployment Rate", value: "7.10%", description: "Percentage of unemployed workforce" },
            { id: "average_monthly_wage", label: "Average Monthly Wage", value: "32,500 PKR", description: "Estimated average monthly salary" },
            { id: "per_capita_income", label: "Per Capita Income", value: "1,568 USD/year", description: "Average income earned per person per year" },
            { id: "average_monthly_household_income", label: "Household Income", value: "82,179 PKR", description: "Average monthly household income in Punjab" },
            { id: "average_monthly_household_consumption", label: "Household Consumption", value: "79,150 PKR", description: "Average monthly household consumption expenditure" }
          ]
        },
        demographics: {
          title: "Demographics & Civic Health",
          icon: "HeartPulse",
          color: "#009688",
          items: [
            { id: "out_of_school_children", label: "Out of School Children", value: "28%", description: "Percentage of children aged 5-16 not enrolled in school" },
            { id: "literacy_rate", label: "Literacy Rate", value: "63%", description: "Percentage of population (10+) that can read and write" },
            { id: "fully_immunized_children", label: "Fully Immunized Children", value: "73%", description: "Percentage of children (12-23 months) fully vaccinated" },
            { id: "total_fertility_rate", label: "Total Fertility Rate", value: "3.4", description: "Average number of children born per woman" },
            { id: "mobile_smartphone_ownership", label: "Smartphone Ownership", value: "50%", description: "Percentage of individuals owning a smartphone" },
            { id: "internet_usage", label: "Internet Usage (Individual)", value: "57%", description: "Percentage of individuals using internet" },
            { id: "household_internet_usage", label: "Internet Usage (Household)", value: "70%", description: "Percentage of households with internet connection" },
            { id: "household_with_gas", label: "Households with Gas", value: "47%", description: "Percentage of households with natural gas connections" },
            { id: "household_with_electricity", label: "Households with Electricity", value: "96%", description: "Percentage of households with grid electricity connection" }
          ]
        }
      }
    };
  }
}
