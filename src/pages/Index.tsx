import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, FileText, Shield, Globe, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import VoiceInterface from '@/components/VoiceInterface';
import FIRVerification from '@/components/FIRVerification';
import ComplaintIntake from '@/components/ComplaintIntake';
import { AIService } from '@/services/aiService';
import { ConversationMemoryService } from '@/services/conversationMemory';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  lang: 'en' | 'te';
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'te'>('en');
  const [activeTab, setActiveTab] = useState<'chat' | 'report' | 'safety'>('chat');
  const [showFIRVerification, setShowFIRVerification] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const translations = {
    en: {
      title: "AP Police Buddy",
      subtitle: "Your AI Assistant for Police Services with Voice Support",
      chat: "Chat",
      report: "File Complaint",
      safety: "Safety Tips",
      typePlaceholder: "Type your question or use voice...",
      send: "Send",
      typing: "AP Police Buddy is typing...",
      welcome: "Hello! I'm AP Police Buddy, your AI assistant for police-related queries in Andhra Pradesh. You can speak naturally or type your questions. Try saying 'Check FIR status' or 'What crimes happened in Guntur last week?'",
      safetyTitle: "Safety Tips & Alerts",
      switchLang: "Switch to Telugu",
      downloadPDF: "Download PDF Report"
    },
    te: {
      title: "ఏపీ పోలీస్ బడ్డీ",
      subtitle: "వాయిస్ సపోర్ట్‌తో పోలీస్ సేవల కోసం మీ AI సహాయకుడు",
      chat: "చాట్",
      report: "ఫిర్యాదు దాఖలు చేయండి",
      safety: "భద్రతా చిట్కాలు",
      typePlaceholder: "మీ ప్రశ్న టైప్ చేయండి లేదా వాయిస్ ఉపయోగించండి...",
      send: "పంపు",
      typing: "ఏపీ పోలీస్ బడ్డీ టైప్ చేస్తోంది...",
      welcome: "నమస్కారం! నేను ఏపీ పోలీస్ బడ్డీ, ఆంధ్రప్రదేశ్‌లో పోలీస్ సంబంధిత ప్రశ్నలకు మీ AI సహాయకుడిని. మీరు సహజంగా మాట్లాడవచ్చు లేదా మీ ప్రశ్నలను టైప్ చేయవచ్చు. 'ఎఫ్‌ఐఆర్ స్థితి తనిఖీ చేయండి' లేదా 'గత వారం గుంటూర్‌లో ఏ నేరాలు జరిగాయి?' అని చెప్పడానికి ప్రయత్నించండి",
      safetyTitle: "భద్రతా చిట్కాలు & హెచ్చరికలు",
      switchLang: "ఇంగ్లీష్‌కు మారు",
      downloadPDF: "PDF రిపోర్ట్ డౌన్‌లోడ్ చేయండి"
    }
  };

  const safetyTips = {
    en: [
      "Always verify caller identity before sharing personal information",
      "Report suspicious cyber activities immediately to 1930",
      "Keep emergency contacts saved and easily accessible",
      "Avoid walking alone in isolated areas after dark",
      "Don't share OTPs or banking details with anyone",
      "Use official police helpline numbers for authentic information"
    ],
    te: [
      "వ్యక్తిగత సమాచారం పంచుకునే ముందు ఎల్లప్పుడూ కాలర్ గుర్తింపును ధృవీకరించండి",
      "అనుమానాస్పద సైబర్ కార్యకలాపాలను వెంటనే 1930కు నివేదించండి",
      "అత్యవసర సంప్రదింపులను సేవ్ చేసి సులభంగా అందుబాటులో ఉంచండి",
      "చీకటి పడిన తర్వాత ఒంటరిగా నిర్జన ప్రాంతాలలో నడవకండి",
      "OTPలు లేదా బ్యాంకింగ్ వివరాలను ఎవరితోనూ పంచుకోకండి",
      "ప్రామాణిక సమాచారం కోసం అధికారిక పోలీస్ హెల్ప్‌లైన్ నంబర్‌లను ఉపయోగించండి"
    ]
  };

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: translations[currentLang].welcome,
      sender: 'bot',
      timestamp: new Date(),
      lang: currentLang
    };
    setMessages([welcomeMessage]);
    
    // Initialize conversation memory
    ConversationMemoryService.addMessage({
      id: '1',
      text: translations[currentLang].welcome,
      sender: 'bot',
      timestamp: new Date()
    });
  }, [currentLang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      lang: currentLang
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Add to conversation memory
    ConversationMemoryService.addMessage({
      id: userMessage.id,
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    });

    // Parse user query with AI
    const parsedQuery = AIService.parseUserQuery(messageText, currentLang);
    
    // Handle FIR status with verification
    if (parsedQuery.intent === 'fir_status' && parsedQuery.entities.firNumber) {
      setShowFIRVerification(parsedQuery.entities.firNumber);
      setIsTyping(false);
      return;
    }

    // Generate AI response with memory and search
    try {
      const botResponse = await AIService.generateResponse(parsedQuery, currentLang, messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        lang: currentLang
      };
      
      // Add to conversation memory
      ConversationMemoryService.addMessage({
        id: botMessage.id,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        intent: parsedQuery.intent,
        entities: parsedQuery.entities
      });
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: currentLang === 'en' 
          ? "I apologize, but I'm having trouble processing your request right now. Please try again or contact emergency services if this is urgent."
          : "క్షమించండి, ప్రస్తుతం మీ అభ్యర్థనను ప్రాసెస్ చేయడంలో నాకు ఇబ్బంది ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి లేదా ఇది అత్యవసరమైతే అత్యవసర సేవలను సంప్రదించండి.",
        sender: 'bot',
        timestamp: new Date(),
        lang: currentLang
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputText(transcript);
    handleSendMessage(transcript);
  };

  const handleFIRVerified = (fir: any) => {
    setShowFIRVerification(null);
    
    const firDetails = currentLang === 'en' 
      ? `✅ FIR Details Verified:

📋 FIR Number: ${fir.firNumber}
📊 Status: ${fir.status}
🏢 Police Station: ${fir.policeStation}
👮 Officer: ${fir.officerName}
⚖️ Crime Type: ${fir.crimeType}
📍 Location: ${fir.location}
📅 Date: ${fir.dateReported}
📝 Description: ${fir.description}

For updates, contact the investigating officer or visit the police station.`
      : `✅ ఎఫ్‌ఐఆర్ వివరాలు ధృవీకరించబడ్డాయి:

📋 ఎఫ్‌ఐఆర్ నంబర్: ${fir.firNumber}
📊 స్థితి: ${fir.status}
🏢 పోలీస్ స్టేషన్: ${fir.policeStation}
👮 అధికారి: ${fir.officerName}
⚖️ నేర రకం: ${fir.crimeType}
📍 స్థానం: ${fir.location}
📅 తేదీ: ${fir.dateReported}
📝 వివరణ: ${fir.description}

అప్‌డేట్‌ల కోసం, పరిశోధన అధికారిని సంప్రదించండి లేదా పోలీస్ స్టేషన్‌ను సందర్శించండి.`;

    const botMessage: Message = {
      id: Date.now().toString(),
      text: firDetails,
      sender: 'bot',
      timestamp: new Date(),
      lang: currentLang
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  const handleComplaintFiled = (complaint: any) => {
    const successMessage = currentLang === 'en'
      ? `✅ Complaint Filed Successfully!

🆔 Complaint ID: ${complaint.id}
📂 Category: ${complaint.category}
📅 Date: ${complaint.dateReported}
📊 Status: ${complaint.status}

Your complaint has been registered. You will be contacted for further updates.`
      : `✅ ఫిర్యాదు విజయవంతంగా దాఖలు చేయబడింది!

🆔 ఫిర్యాదు ID: ${complaint.id}
📂 వర్గం: ${complaint.category}
📅 తేదీ: ${complaint.dateReported}
📊 స్థితి: ${complaint.status}

మీ ఫిర్యాదు నమోదు చేయబడింది. మరిన్ని అప్‌డేట్‌ల కోసం మి ్మల్ని సంప్రదిస్తారు.`;

    const botMessage: Message = {
      id: Date.now().toString(),
      text: successMessage,
      sender: 'bot',
      timestamp: new Date(),
      lang: currentLang
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  const t = translations[currentLang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t.title}</h1>
              <p className="text-blue-100">{t.subtitle}</p>
            </div>
          </div>
          <Button
            onClick={() => setCurrentLang(currentLang === 'en' ? 'te' : 'en')}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <Globe className="w-4 h-4 mr-2" />
            {t.switchLang}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          {[
            { key: 'chat', label: t.chat, icon: Bot },
            { key: 'report', label: t.report, icon: FileText },
            { key: 'safety', label: t.safety, icon: AlertTriangle }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 flex-1 px-4 py-3 rounded-md transition-all duration-200 ${
                activeTab === key 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <Card className="h-[600px] flex flex-col shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="flex items-center justify-between text-blue-800">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span>Chat with AP Police Buddy</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  🎤 Voice Enabled
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="whitespace-pre-line">{message.text}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex space-x-3">
                  <VoiceInterface 
                    onTranscript={handleVoiceTranscript}
                    currentLang={currentLang}
                  />
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t.typePlaceholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleSendMessage()} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!inputText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <ComplaintIntake 
            lang={currentLang}
            onComplaintFiled={handleComplaintFiled}
          />
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{t.safetyTitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {safetyTips[currentLang].map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-800">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-800">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: "Police", number: "100", color: "bg-blue-500" },
                    { name: "Fire", number: "101", color: "bg-red-500" },
                    { name: "Ambulance", number: "108", color: "bg-green-500" },
                    { name: "Women Helpline", number: "181", color: "bg-purple-500" },
                    { name: "Child Helpline", number: "1098", color: "bg-orange-500" },
                    { name: "Cyber Crime", number: "1930", color: "bg-indigo-500" }
                  ].map((contact) => (
                    <div key={contact.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${contact.color}`}></div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-lg">
                        {contact.number}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* FIR Verification Modal */}
      {showFIRVerification && (
        <FIRVerification
          firNumber={showFIRVerification}
          onVerified={handleFIRVerified}
          onCancel={() => setShowFIRVerification(null)}
          lang={currentLang}
        />
      )}
    </div>
  );
};

export default Index;
