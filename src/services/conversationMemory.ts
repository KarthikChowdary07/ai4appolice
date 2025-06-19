export interface ConversationContext {
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    intent?: string;
    entities?: any;
  }>;
  userProfile: {
    name?: string;
    location?: string;
    previousFIRs?: string[];
    preferredLanguage: 'en' | 'te';
    commonQueries: string[];
  };
  sessionData: {
    startTime: Date;
    lastActivity: Date;
    totalQueries: number;
    resolvedIssues: string[];
  };
}

export class ConversationMemoryService {
  private static context: ConversationContext = {
    messages: [],
    userProfile: {
      preferredLanguage: 'en',
      commonQueries: []
    },
    sessionData: {
      startTime: new Date(),
      lastActivity: new Date(),
      totalQueries: 0,
      resolvedIssues: []
    }
  };

  static addMessage(message: { id: string; text: string; sender: 'user' | 'bot'; timestamp: Date; intent?: string; entities?: any }) {
    this.context.messages.push(message);
    this.context.sessionData.lastActivity = new Date();
    
    if (message.sender === 'user') {
      this.context.sessionData.totalQueries++;
      
      // Extract user information from messages
      this.extractUserInfo(message.text);
      
      // Keep only last 20 messages for performance
      if (this.context.messages.length > 20) {
        this.context.messages = this.context.messages.slice(-20);
      }
    }
  }

  private static extractUserInfo(text: string) {
    const lowerText = text.toLowerCase();
    
    // Extract location mentions
    const locationPattern = /(guntur|vijayawada|tirupati|hyderabad|visakhapatnam|కుంటూర్|విజయవాడ|తిరుపతి)/i;
    const locationMatch = text.match(locationPattern);
    if (locationMatch && !this.context.userProfile.location) {
      this.context.userProfile.location = locationMatch[1];
    }

    // Extract FIR numbers
    const firPattern = /(?:fir|ఎఫ్‌ఐఆర్)[\s\/]*(\d+\/\d+\/\d+|\d+)/i;
    const firMatch = text.match(firPattern);
    if (firMatch) {
      if (!this.context.userProfile.previousFIRs) {
        this.context.userProfile.previousFIRs = [];
      }
      if (!this.context.userProfile.previousFIRs.includes(firMatch[1])) {
        this.context.userProfile.previousFIRs.push(firMatch[1]);
      }
    }

    // Track common query types
    if (lowerText.includes('crime') || lowerText.includes('safety') || lowerText.includes('నేరాలు')) {
      if (!this.context.userProfile.commonQueries.includes('crime_safety')) {
        this.context.userProfile.commonQueries.push('crime_safety');
      }
    }
  }

  static getContext(): ConversationContext {
    return { ...this.context };
  }

  static getRelevantHistory(currentQuery: string): string[] {
    const relevantMessages: string[] = [];
    const lowerQuery = currentQuery.toLowerCase();
    
    // Find messages with similar keywords or intent
    this.context.messages.forEach(msg => {
      if (msg.sender === 'bot' && msg.text.length > 50) {
        const msgLower = msg.text.toLowerCase();
        
        // Check for keyword overlap
        const queryWords = lowerQuery.split(' ').filter(w => w.length > 3);
        const hasRelevantKeywords = queryWords.some(word => msgLower.includes(word));
        
        if (hasRelevantKeywords) {
          relevantMessages.push(msg.text.substring(0, 200) + '...');
        }
      }
    });
    
    return relevantMessages.slice(-3); // Return last 3 relevant messages
  }

  static shouldReferToPrevious(currentQuery: string): boolean {
    const indicators = [
      'again', 'previous', 'earlier', 'before', 'same', 'that',
      'మళ్లీ', 'మునుపు', 'అదే', 'ముందు'
    ];
    
    return indicators.some(indicator => 
      currentQuery.toLowerCase().includes(indicator)
    );
  }

  static clearSession() {
    this.context = {
      messages: [],
      userProfile: {
        preferredLanguage: this.context.userProfile.preferredLanguage,
        commonQueries: []
      },
      sessionData: {
        startTime: new Date(),
        lastActivity: new Date(),
        totalQueries: 0,
        resolvedIssues: []
      }
    };
  }
}
