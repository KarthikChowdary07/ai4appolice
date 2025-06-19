import React, { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CCTNSDataService } from '@/services/cctnsData';
import { useToast } from '@/hooks/use-toast';

interface FIRVerificationProps {
  firNumber: string;
  onVerified: (fir: any) => void;
  onCancel: () => void;
  lang: 'en' | 'te';
}

const FIRVerification: React.FC<FIRVerificationProps> = ({ 
  firNumber, 
  onVerified, 
  onCancel, 
  lang 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const translations = {
    en: {
      title: "Verify FIR Access",
      subtitle: "For security, please verify your identity",
      firLabel: "FIR Number",
      phoneLabel: "Registered Phone Number",
      phonePlaceholder: "Enter your 10-digit phone number",
      verify: "Verify & Access",
      cancel: "Cancel",
      verifying: "Verifying...",
      error: "Invalid phone number or FIR not accessible with this number",
      success: "Verification successful!"
    },
    te: {
      title: "ఎఫ్‌ఐఆర్ యాక్సెస్ ధృవీకరించండి",
      subtitle: "భద్రత కోసం, దయచేసి మీ గుర్తింపును ధృవీకరించండి",
      firLabel: "ఎఫ్‌ఐఆర్ నంబర్",
      phoneLabel: "నమోదిత ఫోన్ నంబర్",
      phonePlaceholder: "మీ 10-అంకెల ఫోన్ నంబర్ నమోదు చేయండి",
      verify: "ధృవీకరించండి & యాక్సెస్ చేయండి",
      cancel: "రద్దు చేయండి",
      verifying: "ధృవీకరిస్తోంది...",
      error: "చెల్లని ఫోన్ నంబర్ లేదా ఈ నంబర్‌తో ఎఫ్‌ఐఆర్ యాక్సెస్ చేయలేరు",
      success: "ధృవీకరణ విజయవంతమైంది!"
    }
  };

  const t = translations[lang];

  const handleVerify = async () => {
    if (phoneNumber.length !== 10) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    // Simulate verification delay
    setTimeout(() => {
      const isValid = CCTNSDataService.verifyFIRAccess(firNumber, phoneNumber);
      
      if (isValid) {
        const fir = CCTNSDataService.getFIRByNumber(firNumber);
        toast({
          title: t.success,
          description: "You now have access to FIR details.",
        });
        onVerified(fir);
      } else {
        toast({
          title: "Verification Failed",
          description: t.error,
          variant: "destructive"
        });
      }
      
      setIsVerifying(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">{t.title}</CardTitle>
          <p className="text-sm text-gray-600">{t.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t.firLabel}</label>
            <Input
              value={firNumber}
              disabled
              className="bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t.phoneLabel}</label>
            <div className="relative">
              <Input
                type={showPhone ? "text" : "password"}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={t.phonePlaceholder}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPhone(!showPhone)}
              >
                {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
              disabled={isVerifying}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleVerify}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isVerifying || phoneNumber.length !== 10}
            >
              {isVerifying ? t.verifying : t.verify}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FIRVerification;
