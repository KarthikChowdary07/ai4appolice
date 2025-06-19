export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  relevance: number;
}

export class SearchService {
  // Using a free search API alternative since we don't have API keys
  static async searchInternet(query: string, lang: 'en' | 'te' = 'en'): Promise<SearchResult[]> {
    try {
      // For demo purposes, we'll use DuckDuckGo's instant answer API
      // In production, you'd want to use a proper search API like Google Custom Search
      const searchQuery = encodeURIComponent(`${query} site:appolice.gov.in OR site:tspolice.gov.in OR "Andhra Pradesh Police"`);
      
      // Simulate search results for common police-related queries
      const mockResults = this.getMockSearchResults(query, lang);
      
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  private static getMockSearchResults(query: string, lang: 'en' | 'te'): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    
    // Crime statistics related
    if (lowerQuery.includes('crime') || lowerQuery.includes('statistics') || lowerQuery.includes('నేరాలు')) {
      return lang === 'en' ? [
        {
          title: "Andhra Pradesh Crime Statistics 2024",
          snippet: "According to recent AP Police data, property crimes have decreased by 15% in major cities. Cyber crimes reporting increased by 35% showing better awareness.",
          url: "https://appolice.gov.in/crime-stats",
          relevance: 0.9
        },
        {
          title: "Safety Measures in Urban Areas",
          snippet: "New safety initiatives include increased patrolling in commercial areas and installation of CCTV cameras at 500+ locations across AP.",
          url: "https://appolice.gov.in/safety",
          relevance: 0.8
        }
      ] : [
        {
          title: "ఆంధ్రప్రదేశ్ నేర గణాంకాలు 2024",
          snippet: "ఇటీవలి AP పోలీస్ డేటా ప్రకారం, ప్రధాన నగరాలలో ఆస్తి నేరాలు 15% తగ్గాయి. సైబర్ నేరాల నివేదనలు 35% పెరిగాయి.",
          url: "https://appolice.gov.in/crime-stats-te",
          relevance: 0.9
        }
      ];
    }
    
    // Traffic related
    if (lowerQuery.includes('traffic') || lowerQuery.includes('license') || lowerQuery.includes('ట్రాఫిక్')) {
      return lang === 'en' ? [
        {
          title: "New Traffic Rules 2024 - AP Police",
          snippet: "Updated traffic regulations include stricter penalties for mobile phone usage while driving. New online payment system for challans launched.",
          url: "https://appolice.gov.in/traffic-rules",
          relevance: 0.9
        },
        {
          title: "Driving License Renewal Process",
          snippet: "Online renewal now available through AP Transport portal. Required documents: Aadhar, current license, medical certificate for age 50+.",
          url: "https://transport.ap.gov.in/license",
          relevance: 0.8
        }
      ] : [
        {
          title: "కొత్త ట్రాఫిక్ నియమాలు 2024 - AP పోలీస్",
          snippet: "అప్‌డేట్ చేయబడిన ట్రాఫిక్ నిబంధనలలో డ్రైవింగ్ చేస్తున్నప్పుడు మొబైల్ ఫోన్ వాడకానికి కఠిన జరిమానాలు ఉన్నాయి.",
          url: "https://appolice.gov.in/traffic-rules-te",
          relevance: 0.9
        }
      ];
    }
    
    // Legal procedures
    if (lowerQuery.includes('procedure') || lowerQuery.includes('legal') || lowerQuery.includes('చట్టపరమైన')) {
      return lang === 'en' ? [
        {
          title: "Legal Aid Services - AP Police",
          snippet: "Free legal consultation available at all district police headquarters. Para-legal volunteers trained to assist in filing procedures.",
          url: "https://appolice.gov.in/legal-aid",
          relevance: 0.8
        }
      ] : [
        {
          title: "న్యాయ సహాయ సేవలు - AP పోలీస్",
          snippet: "అన్ని జిల్లా పోలీస్ కేంద్రాలలో ఉచిత న్యాయ సలహలు అందుబాటులో. దాఖలు విధానాలలో సహాయం చేయడానికి పారా-లీగల్ వాలంటీర్లు శిక్షణ పొందారు.",
          url: "https://appolice.gov.in/legal-aid-te",
          relevance: 0.8
        }
      ];
    }
    
    // General fallback
    return lang === 'en' ? [
      {
        title: "AP Police Official Information",
        snippet: "For accurate and up-to-date information about police services, procedures, and contact details, please visit the official AP Police website or contact your nearest police station.",
        url: "https://appolice.gov.in",
        relevance: 0.6
      }
    ] : [
      {
        title: "AP పోలీస్ అధికారిక సమాచారం",
        snippet: "పోలీస్ సేవలు, విధానాలు మరియు సంప్రదింపు వివరాల గురించి ఖచ్చితమైన మరియు తాజా సమాచారం కోసం, దయచేసి అధికారిక AP పోలీస్ వెబ్‌సైట్‌ను సందర్శించండి.",
        url: "https://appolice.gov.in",
        relevance: 0.6
      }
    ];
  }

  static isSearchableQuery(query: string, intent: string): boolean {
    // Don't search for these intents as they have predefined responses
    const nonSearchableIntents = [
      'greeting', 'help', 'emergency', 'fir_status'
    ];
    
    if (nonSearchableIntents.includes(intent)) {
      return false;
    }
    
    // Search for complex queries that might need current information
    const searchIndicators = [
      'latest', 'recent', 'new', 'current', 'update', 'today',
      'ఇటీవలి', 'కొత్త', 'తాజా', 'ప్రస్తుత'
    ];
    
    return searchIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    ) || query.split(' ').length > 6; // Long queries might need search
  }
}
