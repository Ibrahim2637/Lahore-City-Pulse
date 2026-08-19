// Client-side chatbot engine for Lahore Civic Data

export function generateChatbotResponse(userMessage, civicData) {
  const query = userMessage.toLowerCase().trim();
  
  if (!civicData || !civicData.categories) {
    return "I'm still loading the civic nervous system data. Please try again in a moment!";
  }

  // Common greetings
  if (query.match(/\b(hi|hello|hey|greetings|salaam|aoa|hola)\b/)) {
    return "Assalamu Alaikum! Welcome to the Lahore Civic Data Nervous System. 🌟 I can help you find live data about Air Quality (AQI), Weather, Petrol/Diesel prices, Gold/Dollar rates, Crypto, Macro-Economy, and Lahore's Demographics. Ask me something like: 'What is the petrol price?' or 'How is the AQI today?'";
  }

  if (query.includes("who are you") || query.includes("what is this") || query.includes("about this website")) {
    return "I am the Lahore Civic Pulse Assistant. This platform functions as a 'digital nervous system' for Lahore, connecting key public indicators from the Census, PMD, Markets, and financial exchanges into one live dashboard. Data is fetched directly from our public Google Sheet and refreshes every 24 hours.";
  }

  if (query.includes("help") || query.includes("what can you do") || query.includes("topics")) {
    return "I can retrieve live data for Lahore across five major topics:\n1. **Environment & Weather** (AQI, Rain, Temp, UV index)\n2. **Fuel & Energy** (Petrol, Diesel, LPG, CNG)\n3. **Markets & Crypto** (Gold, Dollar, Bitcoin, Ethereum)\n4. **Macro-Economy** (GDP growth, Unemployment, Household consumption)\n5. **Demographics & Civic Health** (Literacy, Vaccine coverage, School enrollment, Internet access)\n\nSimply ask about any of these metrics!";
  }

  // Let's gather all metrics into a flat list for quick scanning
  const allItems = [];
  const categoryKeys = Object.keys(civicData.categories);
  
  for (const catKey of categoryKeys) {
    const cat = civicData.categories[catKey];
    for (const item of cat.items) {
      allItems.push({
        ...item,
        categoryTitle: cat.title,
        categoryKey: catKey
      });
    }
  }

  // Look for exact/partial metric matches
  const matches = [];
  
  for (const item of allItems) {
    const labelLower = item.label.toLowerCase();
    const idLower = item.id.toLowerCase();
    const descLower = item.description.toLowerCase();
    
    // Check if the user query contains the key words
    let isMatch = false;
    
    // Custom match rules for standard terms
    if (idLower === "aqi" && (query.includes("aqi") || query.includes("air quality") || query.includes("smog") || query.includes("pollution"))) {
      isMatch = true;
    } else if (idLower === "dollar_rate_pkr" && (query.includes("dollar") || query.includes("usd") || query.includes("exchange rate"))) {
      isMatch = true;
    } else if (idLower === "temperature_c" && (query.includes("temp") || query.includes("temperature") || query.includes("weather") || query.includes("how hot") || query.includes("how cold"))) {
      isMatch = true;
    } else if (idLower.includes("gold") && query.includes("gold")) {
      isMatch = true;
    } else if (idLower === "silver_per_tola" && query.includes("silver")) {
      isMatch = true;
    } else if (idLower.includes("petrol") && (query.includes("petrol") || query.includes("fuel"))) {
      isMatch = true;
    } else if (idLower.includes("diesel") && (query.includes("diesel") || query.includes("fuel"))) {
      isMatch = true;
    } else if (idLower.includes("cng") && query.includes("cng")) {
      isMatch = true;
    } else if (idLower.includes("lpg") && query.includes("lpg")) {
      isMatch = true;
    } else if (idLower.includes("bitcoin") && (query.includes("bitcoin") || query.includes("btc"))) {
      isMatch = true;
    } else if (idLower.includes("ethereum") && (query.includes("ethereum") || query.includes("eth"))) {
      isMatch = true;
    } else if (idLower.includes("unemployment") && query.includes("unemploy")) {
      isMatch = true;
    } else if (idLower.includes("gdp") && query.includes("gdp")) {
      isMatch = true;
    } else if (idLower.includes("literacy") && (query.includes("literacy") || query.includes("education") || query.includes("study") || query.includes("read"))) {
      isMatch = true;
    } else if (idLower.includes("school") && (query.includes("school") || query.includes("children") || query.includes("education"))) {
      isMatch = true;
    } else if (idLower.includes("immunized") && (query.includes("immuniz") || query.includes("vaccin") || query.includes("polio") || query.includes("child health"))) {
      isMatch = true;
    } else if (idLower.includes("internet") && (query.includes("internet") || query.includes("wifi") || query.includes("web"))) {
      isMatch = true;
    } else if (idLower.includes("smartphone") && (query.includes("mobile") || query.includes("phone") || query.includes("smartphone"))) {
      isMatch = true;
    } else if (idLower.includes("electricity") && (query.includes("electricity") || query.includes("wapda") || query.includes("lesco") || query.includes("light") || query.includes("power"))) {
      isMatch = true;
    } else if (idLower.includes("gas") && (query.includes("gas") || query.includes("sui gas") || query.includes("sngpl"))) {
      isMatch = true;
    } else if (idLower.includes("population") && (query.includes("population") || query.includes("people") || query.includes("crowd") || query.includes("lahore size"))) {
      isMatch = true;
    } else if (idLower.includes("wage") && (query.includes("wage") || query.includes("salary") || query.includes("pay"))) {
      isMatch = true;
    } else if (idLower.includes("precipitation") && (query.includes("rain") || query.includes("precipitation") || query.includes("monsoon") || query.includes("cloud"))) {
      isMatch = true;
    } else if (idLower.includes("uv_index") && query.includes("uv")) {
      isMatch = true;
    } else if ((idLower.includes("sunrise") || idLower.includes("sunset")) && (query.includes("sun") || query.includes("sunrise") || query.includes("sunset"))) {
      isMatch = true;
    }
    
    // Generic contains query fallback
    if (!isMatch) {
      const words = query.split(/\s+/);
      const matchedWord = words.find(w => w.length > 3 && (labelLower.includes(w) || idLower.includes(w)));
      if (matchedWord) {
        isMatch = true;
      }
    }

    if (isMatch) {
      matches.push(item);
    }
  }

  // If we found matches, compile them into a response
  if (matches.length > 0) {
    // Deduplicate matches to keep the response clean
    const uniqueMatches = [];
    const seenIds = new Set();
    for (const match of matches) {
      if (!seenIds.has(match.id)) {
        seenIds.add(match.id);
        uniqueMatches.push(match);
      }
    }

    let response = `Here are the metrics matching your query:\n\n`;
    uniqueMatches.slice(0, 4).forEach(m => {
      response += `🔹 **${m.label}**: **${m.value}**\n*Category: ${m.categoryTitle} | ${m.description}*\n\n`;
    });

    if (uniqueMatches.length > 4) {
      response += `_And ${uniqueMatches.length - 4} more metrics found. Try being more specific!_`;
    }
    
    return response;
  }

  // Check if they asked for a general category
  if (query.includes("weather") || query.includes("environment") || query.includes("rain") || query.includes("air")) {
    const items = civicData.categories.environment.items;
    return `Here is a summary of **Environment & Weather** indicators for Lahore:\n\n` + 
      `🟢 **AQI**: ${items.find(i=>i.id==="aqi").value}\n` + 
      `🌡️ **Temperature**: ${items.find(i=>i.id==="temperature_c").value} (Feels like ${items.find(i=>i.id==="feels_like_c").value})\n` +
      `💧 **Humidity**: ${items.find(i=>i.id==="humidity_percent").value}\n` +
      `🌧️ **Rain Today**: ${items.find(i=>i.id==="today_precipitation_sum_mm").value} (${items.find(i=>i.id==="today_precipitation_probability_pct").value} probability)\n` +
      `☀️ **Sunrise/Sunset**: ${items.find(i=>i.id==="sunrise").value} / ${items.find(i=>i.id==="sunset").value}\n\n` +
      `You can scroll down in the Environment drawer for full details!`;
  }

  if (query.includes("fuel") || query.includes("petrol") || query.includes("diesel") || query.includes("cng") || query.includes("energy")) {
    const items = civicData.categories.fuel.items;
    return `Here are the latest **Fuel & Energy Rates** (Effective ${items.find(i=>i.id==="effective_date").value}):\n\n` +
      `⛽ **Petrol**: ${items.find(i=>i.id==="petrol_per_litre").value}\n` +
      `⛽ **High Speed Diesel**: ${items.find(i=>i.id==="high_speed_diesel_per_litre").value}\n` +
      `⚡ **High Octane**: ${items.find(i=>i.id==="high_octane_per_litre").value}\n` +
      `🛢️ **Kerosene**: ${items.find(i=>i.id==="kerosene_per_litre").value}\n` +
      `🔥 **LPG**: ${items.find(i=>i.id==="lpg_per_kg").value}\n` +
      `🚕 **CNG Region 2 (Punjab)**: ${items.find(i=>i.id==="cng_region2_per_kg").value}`;
  }

  if (query.includes("gold") || query.includes("silver") || query.includes("crypto") || query.includes("dollar") || query.includes("usd") || query.includes("bitcoin") || query.includes("ethereum") || query.includes("exchange")) {
    const items = civicData.categories.markets.items;
    return `Here are the latest **Markets & Crypto Rates**:\n\n` +
      `🏆 **Gold 24K**: ${items.find(i=>i.id==="gold_24K_per_tola").value}\n` +
      `💵 **USD to PKR**: ${items.find(i=>i.id==="dollar_rate_pkr").value}\n` +
      `🪙 **Bitcoin (USD)**: ${items.find(i=>i.id==="bitcoin_usd").value}\n` +
      `🪙 **Bitcoin (PKR)**: ${items.find(i=>i.id==="bitcoin_pkr").value}\n` +
      `💠 **Ethereum (USD)**: ${items.find(i=>i.id==="ethereum_usd").value}\n\n` +
      `Select the Markets menu for details on 22K/21K/18K Gold and Silver.`;
  }

  if (query.includes("economy") || query.includes("gdp") || query.includes("unemployment") || query.includes("wage") || query.includes("income") || query.includes("consumption")) {
    const items = civicData.categories.economy.items;
    return `Here is the **Macro-Economy** overview for Lahore / Punjab:\n\n` +
      `📈 **GDP Growth Rate**: ${items.find(i=>i.id==="annual_gdp_growth_rate").value}\n` +
      `👥 **Unemployment**: ${items.find(i=>i.id==="unemployment_rate").value}\n` +
      `🏭 **LSM Growth**: ${items.find(i=>i.id==="large_scale_manufacturing_growth").value}\n` +
      `💼 **Monthly Household Income**: ${items.find(i=>i.id==="average_monthly_household_income").value}\n` +
      `🛒 **Monthly Household Consumption**: ${items.find(i=>i.id==="average_monthly_household_consumption").value}\n\n` +
      `_Note: Some indicators like Total Population and Per Capita Income are currently being updated in the master database._`;
  }

  if (query.includes("demographic") || query.includes("school") || query.includes("literacy") || query.includes("immuniz") || query.includes("internet") || query.includes("utility") || query.includes("gas") || query.includes("electricity") || query.includes("health")) {
    const items = civicData.categories.demographics.items;
    return `Here is a summary of Lahore's **Demographics & Civic Health**:\n\n` +
      `🎓 **Literacy Rate**: ${items.find(i=>i.id==="literacy_rate").value}\n` +
      `🎒 **Out of School Children**: ${items.find(i=>i.id==="out_of_school_children").value}\n` +
      `💉 **Fully Immunized Children**: ${items.find(i=>i.id==="fully_immunized_children").value}\n` +
      `📱 **Smartphone Ownership**: ${items.find(i=>i.id==="mobile_smartphone_ownership").value}\n` +
      `🌐 **Internet Usage (Households)**: ${items.find(i=>i.id==="household_internet_usage").value}\n` +
      `🔥 **Gas Connection**: ${items.find(i=>i.id==="household_with_gas").value}\n` +
      `⚡ **Electricity Connection**: ${items.find(i=>i.id==="household_with_electricity").value}`;
  }

  return "I'm sorry, I couldn't find a direct match for that query in our Lahore civic dataset. Try asking about a specific term like 'AQI', 'Gold rate', 'Petrol price', 'GDP', 'Literacy rate', or 'Rainfall'. You can also type 'help' to see what topics I support!";
}
