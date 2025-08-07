
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { translateMyanmarToEnglish } from "@/services/geminiService";
import { toast } from "sonner";
import { Languages, Loader2 } from "lucide-react";

interface MyanmarTranslateInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const MyanmarTranslateInput: React.FC<MyanmarTranslateInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  required = false
}) => {
  const [myanmarText, setMyanmarText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!myanmarText.trim()) {
      toast.error("Please enter Myanmar text to translate");
      return;
    }

    setIsTranslating(true);
    try {
      const englishText = await translateMyanmarToEnglish(myanmarText);
      onChange(englishText);
      toast.success("Translation completed!");
    } catch (error) {
      console.error('Translation error:', error);
      toast.error("Failed to translate. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </Label>
      
      {/* Myanmar Input */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">မြန်မာလိုရေးပါ (Write in Myanmar):</Label>
        <div className="flex gap-2">
          <Textarea
            placeholder="မြန်မာစကားဖြင့် ရေးပါ..."
            value={myanmarText}
            onChange={(e) => setMyanmarText(e.target.value)}
            className="flex-1 bg-background border-border text-foreground"
            rows={2}
          />
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !myanmarText.trim()}
            variant="outline"
            size="sm"
            className="h-fit px-3 py-2"
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* English Output */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">English Translation:</Label>
        <Textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="bg-accent/30 border-border text-foreground"
        />
      </div>
    </div>
  );
};

export default MyanmarTranslateInput;
