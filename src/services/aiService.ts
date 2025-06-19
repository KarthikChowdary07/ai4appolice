import { CCTNSDataService } from './cctnsData';
import { ConversationMemoryService } from './conversationMemory';
import { SearchService } from './searchService';

export type UserIntent = 
  | 'fir_status' 
  | 'crime_stats' 
  | 'file_complaint' 
  | 'general_query' 
  | 'file_fir'
  | 'emergency'
  | 'traffic_rules'
  | 'lost_documents'
  | 'greeting'
  | 'help'
  | 'police_contact'
  | 'legal_advice'
  | 'document_verification';

export interface ParsedQuery {
  intent: UserIntent;
  entities: {
    firNumber?: string;
    location?: string;
    crimeType?: string;
    phoneNumber?: string;
    timeframe?: string;
  };
  confidence: number;
}

export class AIService {
  static parseUserQuery(text: string, lang: 'en' | 'te'): ParsedQuery {
    const lowerText = text.toLowerCase();
    
    // Extract FIR number pattern
    const firPattern = /(?:fir|एफआईआर|ఎఫ్‌ఐఆర్)[\s\/]*(\d+|\d+\/\d+\/\d+)/i;
    const firMatch = text.match(firPattern);
    
    // Extract phone number pattern
    const phonePattern = /(\d{10})/;
    const phoneMatch = text.match(phonePattern);
    
    // Extract location patterns
    const locationPattern = /(guntur|vijayawada|tirupati|hyderabad|visakhapatnam|కుంటూర్|విజయవాడ|తిరుపతి)/i;
    const locationMatch = text.match(locationPattern);
    
    // Intent classification with better natural language understanding
    let intent: UserIntent = 'general_query';
    let confidence = 0.5;
    
    // Greeting patterns
    if (lowerText.match(/\b(hi|hello|hey|good morning|good afternoon|good evening|namaste|నమస్కారం|హలో)\b/)) {
      intent = 'greeting';
      confidence = 0.95;
    }
    
    // Help patterns
    else if (lowerText.match(/\b(help|assist|support|what can you do|how to use|guide|మదద్|సహాయం)\b/)) {
      intent = 'help';
      confidence = 0.9;
    }
    
    // FIR status queries - more natural patterns
    else if (lowerText.match(/\b(fir status|check fir|track fir|fir update|case status|my case|ఎఫ్‌ఐఆర్ స్థితి|కేసు స్థితి)\b/) || firMatch) {
      intent = 'fir_status';
      confidence = 0.9;
    }
    
    // Crime statistics queries - more natural patterns
    else if (lowerText.match(/\b(crime|crimes|criminal activity|incidents|safety|security|statistics|data|report|అపరాధాలు|నేరాలు|భద్రత)\b/)) {
      intent = 'crime_stats';
      confidence = 0.8;
    }
    
    // Complaint filing - more natural patterns
    else if (lowerText.match(/\b(file complaint|report|complain|issue|problem|lodge complaint|register complaint|ఫిర్యాదు|నివేదించు|సమస్య)\b/)) {
      intent = 'file_complaint';
      confidence = 0.85;
    }
    
    // FIR filing guide - more natural patterns
    else if (lowerText.match(/\b(file fir|register fir|how to file|fir process|first information report|ఎఫ్‌ఐఆర్ దాఖలు|ఎఫ్‌ఐఆర్ ఎలా)\b/)) {
      intent = 'file_fir';
      confidence = 0.9;
    }
    
    // Emergency - more natural patterns
    else if (lowerText.match(/\b(emergency|urgent|help me|911|100|immediate|crisis|danger|అత్యవసరం|ఆపద్)\b/)) {
      intent = 'emergency';
      confidence = 0.95;
    }
    
    // Traffic rules - more natural patterns
    else if (lowerText.match(/\b(traffic|driving|license|challan|fine|vehicle|road rules|ట్రాఫిక్|లైసెన్స్|జరిమానా)\b/)) {
      intent = 'traffic_rules';
      confidence = 0.8;
    }
    
    // Lost documents - more natural patterns
    else if (lowerText.match(/\b(lost|missing|stolen|documents|passport|license|id|aadhar|పోగొట్టుకున్న|తప్పిపోయిన|దస్తావేజులు)\b/)) {
      intent = 'lost_documents';
      confidence = 0.8;
    }
    
    // Police contact - more natural patterns
    else if (lowerText.match(/\b(police station|contact|phone number|address|location|officer|పోలీస్ స్టేషన్|సంప్రదింపు|అధికారి)\b/)) {
      intent = 'police_contact';
      confidence = 0.8;
    }

    return {
      intent,
      entities: {
        firNumber: firMatch ? firMatch[1] : undefined,
        location: locationMatch ? locationMatch[1] : undefined,
        phoneNumber: phoneMatch ? phoneMatch[1] : undefined,
        timeframe: lowerText.includes('last week') || lowerText.includes('గత వారం') ? 'week' : undefined
      },
      confidence
    };
  }

  static async generateResponse(parsedQuery: ParsedQuery, lang: 'en' | 'te', originalQuery: string): Promise<string> {
    const { intent, entities } = parsedQuery;
    
    // Check if user is referring to previous conversation
    const shouldReferToPrevious = ConversationMemoryService.shouldReferToPrevious(originalQuery);
    const relevantHistory = shouldReferToPrevious ? ConversationMemoryService.getRelevantHistory(originalQuery) : [];
    
    // Check if we should search the internet for additional information
    const shouldSearch = SearchService.isSearchableQuery(originalQuery, intent);
    let searchResults: any[] = [];
    
    if (shouldSearch) {
      searchResults = await SearchService.searchInternet(originalQuery, lang);
    }
    
    // Add context from previous conversations if relevant
    let contextPrefix = '';
    if (relevantHistory.length > 0) {
      contextPrefix = lang === 'en' 
        ? `Based on our previous discussion:\n${relevantHistory[0]}\n\n`
        : `మా మునుపటి చర్చ ఆధారంగా:\n${relevantHistory[0]}\n\n`;
    }
    
    // Get user context for personalization
    const userContext = ConversationMemoryService.getContext();
    
    switch (intent) {
      case 'greeting':
        let personalizedGreeting = '';
        if (userContext.sessionData.totalQueries > 0) {
          personalizedGreeting = lang === 'en' 
            ? `Welcome back! I see this is your ${userContext.sessionData.totalQueries + 1}${this.getOrdinalSuffix(userContext.sessionData.totalQueries + 1)} query today. `
            : `తిరిగి స్వాగతం! ఇది ఈ రోజు మీ ${userContext.sessionData.totalQueries + 1}వ ప్రశ్న అని నేను చూస్తున్నాను. `;
        }
        
        return personalizedGreeting + (lang === 'en' 
          ? `Hello! Welcome to AP Police Buddy. I'm here to help you with all your police-related queries in Andhra Pradesh. 

I can assist you with:
• 🔍 Checking FIR status
• 📊 Getting crime statistics
• 📝 Filing complaints
• 🚨 Emergency assistance
• 🚦 Traffic rules and regulations
• 📄 Lost document procedures
• 📞 Police station contacts

What would you like to know today?`
          : `నమస్కారం! AP పోలీస్ బడ్డీకి స్వాగతం. ఆంధ్రప్రదేశ్‌లో మీ పోలీస్ సంబంధిత అన్ని ప్రశ్నలకు నేను సహాయం చేస్తాను.

నేను మీకు ఇవి సహాయం చేయగలను:
• 🔍 ఎఫ్‌ఐఆర్ స్థితి తనిఖీ
• 📊 నేర గణాంకాలు పొందడం
• 📝 ఫిర్యాదులు దాఖలు చేయడం
• 🚨 అత్యవసర సహాయం
• 🚦 ట్రాఫిక్ నియమాలు
• 📄 పోయిన పత్రాల విధానాలు
• 📞 పోలీస్ స్టేషన్ సంప్రదింపులు

ఈ రోజు మీకు ఏమి తెలుసుకోవాలి?`);

      case 'help':
        return lang === 'en' 
          ? `I'm AP Police Buddy, your AI assistant for police services in Andhra Pradesh. Here's how I can help you:

🔍 **FIR Services:**
• Check FIR status: "What's the status of FIR/001/2024?"
• Learn how to file an FIR

📊 **Crime Information:**
• Get crime statistics: "Show me crimes in Guntur"
• Safety tips and alerts

📝 **Complaint Services:**
• File non-urgent complaints
• Track complaint status

🚨 **Emergency Help:**
• Get emergency contact numbers
• Immediate assistance guidance

🚦 **Traffic & Legal:**
• Traffic rules and regulations
• Document procedures

💬 **Natural Conversation:**
You can ask me questions naturally, like:
• "I lost my driving license, what should I do?"
• "Are there any recent crimes in my area?"
• "How do I contact the nearest police station?"

Just type or speak your question - I understand both English and Telugu!`
          : `నేను AP పోలీస్ బడ్డీ, ఆంధ్రప్రదేశ్‌లో పోలీస్ సేవలకు మీ AI సహాయకుడిని. నేను ఎలా సహాయం చేయగలను:

🔍 **ఎఫ్‌ఐఆర్ సేవలు:**
• ఎఫ్‌ఐఆర్ స్థితి తనిఖీ: "FIR/001/2024 స్థితి ఏమిటి?"
• ఎఫ్‌ఐఆర్ ఎలా దాఖలు చేయాలో తెలుసుకోండి

📊 **నేర సమాచారం:**
• నేర గణాంకాలు: "గుంటూర్‌లో నేరాలు చూపించు"
• భద్రతా చిట్కాలు మరియు హెచ్చరికలు

📝 **ఫిర్యాదు సేవలు:**
• అత్యవసరం కాని ఫిర్యాదులు దాఖలు చేయండి
• ఫిర్యాదు స్థితిని ట్రాక్ చేయండి

🚨 **అత్యవసర సహాయం:**
• అత్యవసర సంప్రదింపు నంబర్లు
• తక్షణ సహాయం మార్గదర్శకం

🚦 **ట్రాఫిక్ & చట్టపరమైన:**
• ట్రాఫిక్ నియమాలు
• పత్రాల విధానాలు

💬 **సహజ సంభాషణ:**
మీరు నన్ను సహజంగా ప్రశ్నలు అడగవచ్చు, ఉదాహరణకు:
• "నేను నా లైసెన్స్ పోగొట్టుకున్నాను, ఏమి చేయాలి?"
• "నా ప్రాంతంలో ఇటీవలి నేరాలు ఏవైనా ఉన్నాయా?"
• "సమీప పోలీస్ స్టేషన్‌ను ఎలా సంప్రదించాలి?"

మీ ప్రశ్న టైప్ చేయండి లేదా మాట్లాడండి - నేను ఇంగ్లీష్ మరియు తెలుగు రెండూ అర్థం చేసుకుంటాను!`;

      case 'fir_status':
        if (entities.firNumber) {
          const fir = CCTNSDataService.getFIRByNumber(entities.firNumber);
          if (fir) {
            return lang === 'en' 
              ? `I found your FIR! Here are the details for ${fir.firNumber}:

📋 **FIR Information:**
• Status: ${fir.status}
• Police Station: ${fir.policeStation}
• Investigating Officer: ${fir.officerName}
• Crime Type: ${fir.crimeType}
• Location: ${fir.location}
• Date Reported: ${fir.dateReported}

For verification and detailed updates, please provide your registered phone number. You can also contact the investigating officer directly at the police station.

Is there anything specific about this case you'd like to know more about?`
              : `మీ ఎఫ్‌ఐఆర్ దొరికింది! ${fir.firNumber} కోసం వివరాలు ఇవి:

📋 **ఎఫ్‌ఐఆర్ సమాచారం:**
• స్థితి: ${fir.status}
• పోలీస్ స్టేషన్: ${fir.policeStation}
• పరిశోధన అధికారి: ${fir.officerName}
• నేర రకం: ${fir.crimeType}
• స్థానం: ${fir.location}
• నివేదించిన తేదీ: ${fir.dateReported}

ధృవీకరణ మరియు వివరమైన అప్‌డేట్‌ల కోసం, దయచేసి మీ నమోదిత ఫోన్ నంబర్ ఇవ్వండి. మీరు పోలీస్ స్టేషన్‌లో పరిశోధన అధికారిని నేరుగా కూడా సంప్రదించవచ్చు.

ఈ కేసు గురించి మీరు మరింత తెలుసుకోవాలని అనుకుంటున్న ఏదైనా నిర్దిష్టమైనది ఉందా?`;
          } else {
            // Enhanced response with previous FIR context
            let previousFIRContext = '';
            if (userContext.userProfile.previousFIRs && userContext.userProfile.previousFIRs.length > 0) {
              const otherFIRs = userContext.userProfile.previousFIRs.filter(f => f !== entities.firNumber);
              if (otherFIRs.length > 0) {
                previousFIRContext = lang === 'en'
                  ? `\n\nI notice you've previously inquired about FIR ${otherFIRs[0]}. If you're looking for that case instead, please let me know.`
                  : `\n\nమీరు గతంలో ఎఫ్‌ఐఆర్ ${otherFIRs[0]} గురించి విచారించారని నేను గమనించాను. బదులుగా మీరు ఆ కేసు కోసం చూస్తున్నట్లయితే, దయచేసి నాకు తెలియజేయండి.`;
              }
            }
            
            return (lang === 'en' 
              ? `I couldn't find FIR number "${entities.firNumber}" in our records. This could be because:

• The FIR number might be typed incorrectly
• The case might be from a different district
• The FIR might be very recent and not yet updated in the system

Please double-check the FIR number format (usually FIR/XXX/YYYY) and try again. If you're still having trouble, you can:
• Contact the police station where you filed the FIR
• Visit the station with your FIR copy
• Call the investigating officer directly

Would you like me to help you find the contact details for a specific police station?`
              : `మా రికార్డులలో "${entities.firNumber}" ఎఫ్‌ఐఆర్ నంబర్ కనుగొనలేకపోయాను. ఇది ఈ కారణాలవల్ల కావచ్చు:

• ఎఫ్‌ఐఆర్ నంబర్ తప్పుగా టైప్ చేయబడి ఉండవచ్చు
• కేసు వేరే జిల్లాకు చెందినది కావచ్చు
• ఎఫ్‌ఐఆర్ చాలా ఇటీవలిది మరియు ఇంకా సిస్టమ్‌లో అప్‌డేట్ కాకపోవచ్చు

దయచేసి ఎఫ్‌ఐఆర్ నంబర్ ఫార్మాట్‌ను (సాధారణంగా FIR/XXX/YYYY) తనిఖీ చేసి మళ్లీ ప్రయత్నించండి. మీకు ఇంకా ఇబ్బంది అయితే, మీరు:
• ఎఫ్‌ఐఆర్ దాఖలు చేసిన పోలీస్ స్టేషన్‌ను సంప్రదించండి
• మీ ఎఫ్‌ఐఆర్ కాపీతో స్టేషన్‌ను సందర్శించండి
• పరిశోధన అధికారిని నేరుగా కాల్ చేయండి

నిర్దిష్ట పోలీస్ స్టేషన్ కోసం సంప్రదింపు వివరాలను కనుగొనడంలో నేను మీకు సహాయం చేయాలా?`) + previousFIRContext;
          }
        } else {
          return lang === 'en' 
            ? `I'd be happy to help you check your FIR status! To look up your case, I'll need your FIR number.

Please provide your FIR number in the format: **FIR/XXX/YYYY** (for example: FIR/001/2024)

You can find this number on:
• Your FIR copy receipt
• Any documents given by the police station
• SMS notifications sent to your registered mobile number

Once you provide the FIR number, I'll give you detailed information about your case status, investigating officer, and next steps.

Don't have your FIR number handy? I can also help you contact the police station where you filed the report.`
            : `మీ ఎఫ్‌ఐఆర్ స్థితిని తనిఖీ చేయడంలో నేను సంతోషంగా సహాయం చేస్తాను! మీ కేసును చూడటానికి, నాకు మీ ఎఫ్‌ఐఆర్ నంబర్ అవసరం.

దయచేసి మీ ఎఫ్‌ఐఆర్ నంబర్‌ను ఈ ఫార్మాట్‌లో ఇవ్వండి: **FIR/XXX/YYYY** (ఉదాహరణ: FIR/001/2024)

మీరు ఈ నంబర్‌ను ఇక్కడ కనుగొనవచ్చు:
• మీ ఎఫ్‌ఐఆర్ కాపీ రసీదు
• పోలీస్ స్టేషన్ ఇచ్చిన ఏదైనా పత్రాలు
• మీ నమోదిత మొబైల్ నంబర్‌కు పంపిన SMS నోటిఫికేషన్లు

మీరు ఎఫ్‌ఐఆర్ నంబర్ ఇచ్చిన తర్వాత, మీ కేసు స్థితి, పరిశోధన అధికారి మరియు తదుపరి దశల గురించి వివరమైన సమాచారం ఇస్తాను.

మీ ఎఫ్‌ఐఆర్ నంబర్ దగ్గర లేదా? మీరు రిపోర్ట్ దాఖలు చేసిన పోలీస్ స్టేషన్‌ను సంప్రదించడంలో నేను సహాయం చేయగలను.`;
        }
        
      case 'crime_stats':
        if (entities.location) {
          const stats = CCTNSDataService.getCrimeStatsByLocation(entities.location);
          if (stats.length > 0) {
            const statsText = stats.map(s => `• ${s.crimeType}: ${s.count} cases`).join('\n');
            
            // Add search results if available
            let additionalInfo = '';
            if (searchResults.length > 0) {
              additionalInfo = lang === 'en'
                ? `\n\n**Latest Updates:**\n${searchResults[0].snippet}`
                : `\n\n**తాజా అప్‌డేట్‌లు:**\n${searchResults[0].snippet}`;
            }
            
            return contextPrefix + (lang === 'en' 
              ? `Here are the recent crime statistics for ${entities.location} (Last 7 days):

📊 **Crime Report:**
${statsText}

**Safety Recommendations:**
${entities.location === 'Guntur' ? '• Be cautious of theft in parking areas\n• Avoid leaving valuables unattended' : '• Stay alert in crowded areas\n• Report suspicious activities immediately'}

• Emergency contact: 100
• Women's helpline: 181
• Cyber crime helpline: 1930

Would you like safety tips for a specific area or information about how to report suspicious activities?`
              : `${entities.location} కోసం ఇటీవలి నేర గణాంకాలు ఇవి (గత 7 రోజులు):

📊 **నేర నివేదిక:**
${statsText}

**భద్రతా సిఫార్సులు:**
${entities.location === 'గుంటూర్' ? '• పార్కింగ్ ప్రాంతాలలో దొంగతనం పట్ల జాగ్రత్త వహించండి\n• విలువైన వస్తువులను గమనించకుండా వదలకండి' : '• రద్దీ ఉన్న ప్రాంతాలలో అప్రమత్తంగా ఉండండి\n• అనుమానాస్పద కార్యకలాపాలను వెంటనే నివేదించండి'}

• అత్యవసర సంప్రదింపు: 100
• మహిళల హెల్ప్‌లైన్: 181
• సైబర్ క్రైమ్ హెల్ప్‌లైన్: 1930

నిర్దిష్ట ప్రాంతానికి భద్రతా చిట్కాలు లేదా అనుమానాస్పద కార్యకలాపాలను ఎలా నివేదించాలి అనే సమాచారం కావాలా?`) + additionalInfo;
          }
        }
        
        // Enhanced response with search results for unknown locations
        let searchInfo = '';
        if (searchResults.length > 0) {
          searchInfo = lang === 'en'
            ? `\n\n**Latest Information:**\n${searchResults[0].snippet}\n\nSource: ${searchResults[0].title}`
            : `\n\n**తాజా సమాచారం:**\n${searchResults[0].snippet}\n\nమూలం: ${searchResults[0].title}`;
        }
        
        return contextPrefix + (lang === 'en' 
          ? `I can provide you with current crime statistics for various locations in Andhra Pradesh. Please specify a city or area you're interested in, such as:

🏙️ **Major Cities:**
• Guntur
• Vijayawada  
• Tirupati
• Hyderabad
• Visakhapatnam

For example, you can ask:
• "Show me crime statistics for Guntur"
• "What's the safety situation in Vijayawada?"
• "Any recent incidents in Tirupati?"

I'll provide you with recent crime data, safety recommendations, and relevant contact information for that area.

Which location would you like information about?`
          : `నేను ఆంధ్రప్రదేశ్‌లోని వివిధ ప్రాంతాలకు ప్రస్తుత నేర గణాంకాలను అందించగలను. దయచేసి మీకు ఆసక్తి ఉన్న నగరం లేదా ప్రాంతాన్ని పేర్కొనండి:

🏙️ **ప్రధాన నగరాలు:**
• గుంటూర్
• విజయవాడ
• తిరుపతి
• హైదరాబాద్
• విశాఖపట్నం

ఉదాహరణకు, మీరు అడగవచ్చు:
• "గుంటూర్ కోసం నేర గణాంకాలు చూపించు"
• "విజయవాడలో భద్రతా పరిస్థితి ఏమిటి?"
• "తిరుపతిలో ఏదైనా ఇటీవలి సంఘటనలు?"

నేను మీకు ఇటీవలి నేర డేటా, భద్రతా సిఫార్సులు మరియు ఆ ప్రాంతానికి సంబంధించిన సంప్రదింపు సమాచారాన్ని అందిస్తాను.

మీకు ఏ ప్రాంతం గురించి సమాచారం కావాలి?`) + searchInfo;
        
      case 'file_fir':
        return lang === 'en' 
          ? `I'll guide you through the process of filing an FIR (First Information Report) in Andhra Pradesh:

📝 **How to File an FIR:**

**Step 1: Visit the Police Station**
• Go to the police station in whose jurisdiction the crime occurred
• You can file an FIR 24/7 - police stations never close
• Bring a valid ID proof

**Step 2: Provide Complete Information**
• Date, time, and exact location of the incident
• Detailed description of what happened
• Names and descriptions of accused persons (if known)
• List of witnesses (if any)
• Any evidence you have

**Step 3: Get Your FIR Copy**
• Police must give you a copy with the FIR number
• Keep this copy safe - you'll need it for follow-ups
• Note down the investigating officer's name and contact

**Step 4: Follow Up**
• Contact the investigating officer for updates
• Provide any additional evidence as needed

**💡 Online FIR Option:**
For certain non-serious crimes, you can file online through the AP Police website.

**🚨 Important Notes:**
• Filing a false FIR is a punishable offense
• FIR is free of cost
• Police cannot refuse to register an FIR for cognizable offenses

**Emergency:** For urgent cases, call 100 immediately.

Do you have a specific incident you need to report, or would you like more information about any of these steps?`
          : `ఆంధ్రప్రదేశ్‌లో ఎఫ్‌ఐఆర్ (మొదటి సమాచార నివేదిక) దాఖలు చేసే ప్రక్రియను నేను మీకు వివరిస్తాను:

📝 **ఎఫ్‌ఐఆర్ ఎలా దాఖలు చేయాలి:**

**దశ 1: పోలీస్ స్టేషన్‌ను సందర్శించండి**
• నేరం జరిగిన అధికార పరిధిలోని పోలీస్ స్టేషన్‌కు వెళ్లండి
• మీరు 24/7 ఎఫ్‌ఐఆర్ దాఖలు చేయవచ్చు - పోలీస్ స్టేషన్లు ఎప్పుడూ మూసివేయబడవు
• చెల్లుబాటు అయ్యే గుర్తింపు రుజువు తీసుకెళ్లండి

**దశ 2: పూర్తి సమాచారం అందించండి**
• సంఘటన తేదీ, సమయం మరియు ఖచ్చితమైన స్థానం
• ఏమి జరిగిందో వివరమైన వర్ణన
• నిందితుల పేర్లు మరియు వర్ణనలు (తెలిస్తే)
• సాక్షుల జాబితా (ఏదైనా ఉంటే)
• మీ వద్ద ఉన్న ఏదైనా సాక్ష్యం

**దశ 3: మీ ఎఫ్‌ఐఆర్ కాపీ పొందండి**
• పోలీస్ మీకు ఎఫ్‌ఐఆర్ నంబర్‌తో కాపీ ఇవ్వాలి
• ఈ కాపీని సురక్షితంగా ఉంచండి - ఫాలో-అప్‌ల కోసం మీకు అవసరం
• పరిశోధన అధికారి పేరు మరియు సంప్రదింపు గమనించండి

**దశ 4: ఫాలో అప్ చేయండి**
• అప్‌డేట్‌ల కోసం పరిశోధన అధికారిని సంప్రదించండి
• అవసరమైన ఏదైనా అదనపు సాక్ష్యాలను అందించండి

**💡 ఆన్‌లైన్ ఎఫ్‌ఐఆర్ ఎంపిక:**
కొన్ని తీవ్రమైన కాని నేరాలకు, మీరు AP పోలీస్ వెబ్‌సైట్ ద్వారా ఆన్‌లైన్‌లో దాఖలు చేయవచ్చు.

**🚨 ముఖ్యమైన గమనికలు:**
• తప్పుడు ఎఫ్‌ఐఆర్ దాఖలు చేయడం శిక్షార్హమైన నేరం
• ఎఫ్‌ఐఆర్ ఉచితం
• కాగ్నిజబుల్ నేరాలకు ఎఫ్‌ఐఆర్ నమోదు చేయడానికి పోలీస్ నిరాకరించలేరు

**అత్యవసరం:** అత్యవసర కేసుల కోసం, వెంటనే 100కు కాల్ చేయండి.

మీరు నివేదించాల్సిన నిర్దిష్ట సంఘటన ఉందా, లేదా ఈ దశలలో ఏదైనా గురించి మరింత సమాచారం కావాలా?`;

      case 'emergency':
        return lang === 'en' 
          ? `🚨 **EMERGENCY ASSISTANCE**

**Immediate Help - Call Now:**
• **Police Emergency: 100**
• **Fire Department: 101**
• **Medical Emergency: 108**
• **Women's Helpline: 181**
• **Child Helpline: 1098**

**For immediate police assistance:**
1. **Call 100** - This is the fastest way to get help
2. **Stay calm and speak clearly**
3. **Provide your exact location**
4. **Describe the emergency briefly**

**While waiting for help:**
• Stay in a safe location if possible
• Keep your phone charged and accessible
• Don't leave the scene unless it's unsafe
• If you see someone in danger, call for help immediately

**Cyber Crime Emergency: 1930**
**National Emergency: 112**

**Text-based emergency:** If you can't speak, you can send SMS to 100 with your location and emergency details.

Are you currently in an emergency situation? If so, please call 100 immediately while I provide additional guidance.

What type of emergency assistance do you need?`
          : `🚨 **అత్యవసర సహాయం**

**తక్షణ సహాయం - ఇప్పుడే కాల్ చేయండి:**
• **పోలీస్ అత్యవసరం: 100**
• **అగ్నిమాపక విభాగం: 101**
• **వైద్య అత్యవసరం: 108**
• **మహిళల హెల్ప్‌లైన్: 181**
• **పిల్లల హెల్ప్‌లైన్: 1098**

**తక్షణ పోలీస్ సహాయం కోసం:**
1. **100కు కాల్ చేయండి** - ఇది సహాయం పొందడానికి వేగవంతమైన మార్గం
2. **ప్రశాంతంగా ఉండి స్పష్టంగా మాట్లాడండి**
3. **మీ ఖచ్చితమైన స్థానాన్ని అందించండి**
4. **అత్యవసర పరిస్థితిని క్లుప్తంగా వివరించండి**

**సహాయం కోసం వేచి ఉండేటప్పుడు:**
• వీలైతే సురక్షితమైన ప్రదేశంలో ఉండండి
• మీ ఫోన్ చార్జ్ మరియు అందుబాటులో ఉంచండి
• అసురక్షితం కాకపోతే సన్నివేశాన్ని వదిలిపెట్టకండి
• మీరు ఎవరైనా ప్రమాదంలో చూస్తే, వెంటనే సహాయం కోసం కాల్ చేయండి

**సైబర్ క్రైమ్ అత్యవసరం: 1930**
**జాతీయ అత్యవసరం: 112**

**టెక్స్ట్ ఆధారిత అత్యవసరం:** మీరు మాట్లాడలేకపోతే, మీ స్థానం మరియు అత్యవసర వివరాలతో 100కు SMS పంపవచ్చు.

మీరు ప్రస్తుతం అత్యవసర పరిస్థితిలో ఉన్నారా? అలా అయితే, నేను అదనపు మార్గదర్శకత్వం అందిస్తున్నప్పుడు దయచేసి వెంటనే 100కు కాల్ చేయండి.

మీకు ఎలాంటి అత్యవసర సహాయం అవసరం?`;

      case 'police_contact':
        return lang === 'en' 
          ? `📞 **Police Station Contacts & Information**

**Major Police Stations in Andhra Pradesh:**

🏢 **Guntur District:**
• Guntur City Police Station: 0863-2323100
• Guntur Rural Police Station: 0863-2323200

🏢 **Krishna District:**
• Vijayawada Central Police Station: 0866-2470100
• Vijayawada Police Station: 0866-2470200

🏢 **Chittoor District:**
• Tirupati Police Station: 0877-2287100
• Tirupati Rural Police Station: 0877-2287200

**🚨 Emergency Numbers (24/7):**
• Police Emergency: **100**
• Control Room: **1930** (Cyber Crime)
• Women's Helpline: **181**
• Senior Citizen Helpline: **1291**

**📱 How to Find Your Nearest Police Station:**
1. Call 100 and ask for the nearest station
2. Use AP Police official app
3. Visit www.appolice.gov.in
4. Google "police station near me"

**🕐 Visit Timings:**
• Emergency: 24/7 available
• General complaints: 6 AM - 10 PM (most stations)
• FIR filing: Available 24/7

**📋 What to bring when visiting:**
• Valid ID proof (Aadhar/Driving License/Passport)
• Any documents related to your complaint
• Evidence if available (photos, videos)

Which specific area do you need police station information for? I can provide more detailed contact information.`
          : `📞 **పోలీస్ స్టేషన్ సంప్రదింపులు & సమాచారం**

**ఆంధ్రప్రదేశ్‌లోని ప్రధాన పోలీస్ స్టేషన్లు:**

🏢 **గుంటూర్ జిల్లా:**
• గుంటూర్ సిటీ పోలీస్ స్టేషన్: 0863-2323100
• గుంటూర్ రూరల్ పోలీస్ స్టేషన్: 0863-2323200

🏢 **కృష్ణా జిల్లా:**
• విజయవాడ సెంట్రల్ పోలీస్ స్టేషన్: 0866-2470100
• విజయవాడ పోలీస్ స్టేషన్: 0866-2470200

🏢 **చిత్తూర్ జిల్లా:**
• తిరుపతి పోలీస్ స్టేషన్: 0877-2287100
• తిరుపతి రూరల్ పోలీస్ స్టేషన్: 0877-2287200

**🚨 అత్యవసర నంబర్లు (24/7):**
• పోలీస్ అత్యవసరం: **100**
• కంట్రోల్ రూమ్: **1930** (సైబర్ క్రైమ్)
• మహిళల హెల్ప్‌లైన్: **181**
• సీనియర్ సిటిజన్ హెల్ప్‌లైన్: **1291**

**📱 మీ సమీప పోలీస్ స్టేషన్‌ను ఎలా కనుగొనాలి:**
1. 100కు కాల్ చేసి సమీప స్టేషన్‌ను అడగండి
2. AP పోలీస్ అధికారిక యాప్ ఉపయోగించండి
3. www.appolice.gov.in సందర్శించండి
4. "పోలీస్ స్టేషన్ నియర్ మీ" గూగుల్ చేయండి

**🕐 సందర్శన సమయాలు:**
• అత్యవసరం: 24/7 అందుబాటులో
• సాధారణ ఫిర్యాదులు: 6 AM - 10 PM (చాలా స్టేషన్లు)
• ఎఫ్‌ఐఆర్ దాఖలు: 24/7 అందుబాటులో

**📋 సందర్శించేటప్పుడు తీసుకెళ్లాల్సినవి:**
• చెల్లుబాటు అయ్యే గుర్తింపు రుజువు (ఆధార్/డ్రైవింగ్ లైసెన్స్/పాస్‌పోర్ట్)
• మీ ఫిర్యాదుకు సంబంధించిన ఏదైనా పత్రాలు
• అందుబాటులో ఉంటే సాక్ష్యం (ఫోటోలు, వీడియోలు)

మీకు ఏ నిర్దిష్ట ప్రాంతానికి పోలీస్ స్టేషన్ సమాచారం అవసరం? నేను మరింత వివరమైన సంప్రదింపు సమాచారాన్ని అందించగలను.`;

      default:
        // Enhanced default response with search results
        let responseText = '';
        
        if (searchResults.length > 0) {
          const topResult = searchResults[0];
          responseText = lang === 'en'
            ? `I found some relevant information about your query:

📖 **${topResult.title}**
${topResult.snippet}

${this.getDefaultResponse(lang)}`
            : `మీ ప్రశ్నకు సంబంధించిన కొంత సమాచారం నేను కనుగొన్నాను:

📖 **${topResult.title}**
${topResult.snippet}

${this.getDefaultResponse(lang)}`;
        } else {
          responseText = contextPrefix + this.getDefaultResponse(lang);
        }
        
        return responseText;
    }
  }
  
  private static getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
  }
  
  private static getDefaultResponse(lang: 'en' | 'te'): string {
    return lang === 'en' 
      ? `I understand you're looking for assistance with police services. I'm here to help you with a wide range of police-related queries in Andhra Pradesh.

Here are some things you can ask me about:

🔍 **Case Information:**
• "Check status of FIR/001/2024"
• "How do I track my complaint?"

📊 **Safety & Crime Data:**
• "Show me recent crimes in my area"
• "Is it safe to visit [location] at night?"

📝 **Procedures & Guidance:**
• "How do I file a complaint?"
• "What documents do I need for [procedure]?"
• "I lost my license, what should I do?"

🚨 **Emergency Help:**
• "I need immediate police assistance"
• "Someone is following me"

📞 **Contact Information:**
• "Police station near me"
• "Contact details for [specific station]"

You can ask your questions naturally - I understand both English and Telugu, and I can help with both text and voice queries.

What specific information are you looking for today?`
      : `మీరు పోలీస్ సేవలతో సహాయం అన్వేషిస్తున్నారని నేను అర్థం చేసుకున్నాను. ఆంధ్రప్రదేశ్‌లో పోలీస్ సంబంధిత విస్తృత శ్రేణి ప్రశ్నలతో నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను.

మీరు నన్ను ఇవి అడగవచ్చు:

🔍 **కేసు సమాచారం:**
• "FIR/001/2024 స్థితి తనిఖీ చేయండి"
• "నా ఫిర్యాదును ఎలా ట్రాక్ చేయాలి?"

📊 **భద్రత & నేర డేటా:**
• "నా ప్రాంతంలో ఇటీవలి నేరాలు చూపించు"
• "రాత్రి [స్థానం] సందర్శించడం సురక్షితమా?"

📝 **విధానాలు & మార్గదర్శకత్వం:**
• "ఫిర్యాదు ఎలా దాఖలు చేయాలి?"
• "[విధానం] కోసం నాకు ఏ పత్రాలు అవసరం?"
• "నేను నా లైసెన్స్ పోగొట్టుకున్నాను, ఏమి చేయాలి?"

🚨 **అత్యవసర సహాయం:**
• "నాకు తక్షణ పోలీస్ సహాయం అవసరం"
• "ఎవరో నన్ను అనుసరిస్తున్నారు"

📞 **సంప్రదింపు సమాచారం:**
• "నా దగ్గర పోలీస్ స్టేషన్"
• "[నిర్దిష్ట స్టేషన్] కోసం సంప్రదింపు వివరాలు"

మీరు మీ ప్రశ్నలను సహజంగా అడగవచ్చు - నేను ఇంగ్లీష్ మరియు తెలుగు రెండూ అర్థం చేసుకుంటాను, మరియు టెక్స్ట్ మరియు వాయిస్ ప్రశ్నలు రెండింటితో నేను సహాయం చేయగలను.

ఈ రోజు మీరు ఏ నిర్దిష్ట సమాచారం కోసం చూస్తున్నారు?`;
  }
}
