import React, { useState } from 'react';
import { FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CCTNSDataService } from '@/services/cctnsData';
import { useToast } from '@/hooks/use-toast';
import VoiceInterface from './VoiceInterface';

interface ComplaintIntakeProps {
  lang: 'en' | 'te';
  onComplaintFiled: (complaint: any) => void;
}

const ComplaintIntake: React.FC<ComplaintIntakeProps> = ({ lang, onComplaintFiled }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    location: '',
    contactNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const translations = {
    en: {
      title: "File New Complaint",
      category: "Complaint Category",
      description: "Description",
      location: "Location",
      contact: "Contact Number",
      submit: "File Complaint",
      submitting: "Filing...",
      descriptionPlaceholder: "Describe your complaint in detail...",
      locationPlaceholder: "Enter location where incident occurred",
      contactPlaceholder: "Your 10-digit mobile number",
      categories: {
        'Theft': 'Theft',
        'Missing Person': 'Missing Person',
        'Harassment': 'Harassment',
        'Noise Complaint': 'Noise Complaint',
        'Traffic': 'Traffic Issue',
        'Other': 'Other'
      }
    },
    te: {
      title: "కొత్త ఫిర్యాదు దాఖలు చేయండి",
      category: "ఫిర్యాదు వర్గం",
      description: "వివరణ",
      location: "స్థానం",
      contact: "సంప్రదింపు నంబర్",
      submit: "ఫిర్యాదు దాఖలు చేయండి",
      submitting: "దాఖలు చేస్తోంది...",
      descriptionPlaceholder: "మీ ఫిర్యాదును వివరంగా వర్ణించండి...",
      locationPlaceholder: "సంఘటన జరిగిన స్థానాన్ని నమోదు చేయండి",
      contactPlaceholder: "మీ 10-అంకెల మొబైల్ నంబర్",
      categories: {
        'Theft': 'దొంగతనం',
        'Missing Person': 'తప్పిపోయిన వ్యక్తి',
        'Harassment': 'వేధింపులు',
        'Noise Complaint': 'శబ్దం ఫిర్యాదు',
        'Traffic': 'ట్రాఫిక్ సమస్య',
        'Other': 'ఇతర'
      }
    }
  };

  const t = translations[lang];

  const handleVoiceTranscript = (transcript: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description + (prev.description ? ' ' : '') + transcript
    }));
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in category and description fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const complaint = CCTNSDataService.addComplaint({
        category: formData.category as any,
        description: formData.description,
        location: formData.location,
        contactNumber: formData.contactNumber
      });

      toast({
        title: "Complaint Filed Successfully",
        description: `Complaint ID: ${complaint.id}`,
      });

      onComplaintFiled(complaint);
      
      // Reset form
      setFormData({
        category: '',
        description: '',
        location: '',
        contactNumber: ''
      });
      
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>{t.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t.category}</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t.categories).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center justify-between">
            {t.description}
            <VoiceInterface 
              onTranscript={handleVoiceTranscript}
              currentLang={lang}
            />
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t.descriptionPlaceholder}
            rows={4}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t.location}</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={t.locationPlaceholder}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t.contact}</label>
            <Input
              value={formData.contactNumber}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) 
              }))}
              placeholder={t.contactPlaceholder}
            />
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? t.submitting : t.submit}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComplaintIntake;
