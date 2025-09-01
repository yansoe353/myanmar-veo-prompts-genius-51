import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { SignupDialog } from "@/components/auth/SignupDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { ProfileDialog } from "@/components/auth/ProfileDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generatePrompt } from "@/services/geminiService";
import { toast } from "sonner";
import { Copy, Video, Sparkles, MessageSquare, HelpCircle, Zap, Users, MapPin, Mic, Play } from "lucide-react";
import { LogIn, UserPlus } from "lucide-react";
import MyanmarTranslateInput from "@/components/MyanmarTranslateInput";
import { Veo3BusinessDialog } from "@/components/Veo3BusinessDialog";

const Index = () => {
  const { user, canUsePrompts, incrementPromptUsage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showVeoDialog, setShowVeoDialog] = useState(false);
  const [showVeo3BusinessDialog, setShowVeo3BusinessDialog] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    character1: "",
    character2: "",
    dialogue1: "",
    dialogue2: "",
    promptType: "interview"
  });
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneratePrompt = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!canUsePrompts()) {
      toast.error("You've reached your prompt limit. Please upgrade your plan.");
      setShowProfileDialog(true);
      return;
    }

    if (!formData.location || !formData.character1 || !formData.dialogue1) {
      toast.error("Please fill in the required fields: Location, Character 1, and Dialogue 1");
      return;
    }

    setLoading(true);
    try {
      const prompt = await generatePrompt(formData);
      setGeneratedPrompt(prompt);
      incrementPromptUsage();
      toast.success("Prompt generated successfully!");
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error("Failed to generate prompt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedPrompt);
        toast.success("Prompt copied to clipboard!");
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = generatedPrompt;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            toast.success("Prompt copied to clipboard!");
          } else {
            throw new Error('Copy command failed');
          }
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast.error("Failed to copy prompt. Please select and copy manually.");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      toast.error("Failed to copy prompt. Please select and copy manually.");
    }
  };

  const handleVeo3RealTime = async () => {
    if (!generatedPrompt) {
      toast.error("Please generate a prompt first");
      return;
    }

    // Copy the prompt automatically
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedPrompt);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = generatedPrompt;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
      toast.success("Prompt copied! Opening Veo 3 Real-Time...");
    } catch (error) {
      console.error('Copy failed:', error);
      toast.warning("Opening Veo 3 Real-Time (copy manually if needed)");
    }

    // Open the Veo 3 Real-Time dialog
    setShowVeoDialog(true);
  };

  const createManualPrompt = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!canUsePrompts()) {
      toast.error("You've reached your prompt limit. Please upgrade your plan.");
      setShowProfileDialog(true);
      return;
    }

    let prompt = `✅ At ${formData.location}\n\n`;
    
    if (formData.character2) {
      // Two character prompt
      prompt += `✅ ${formData.character1} interviews ${formData.character2}.\n\n`;
      prompt += `✅ ${formData.character1.split(' ')[0]} asks *in a clear Burmese language* "${formData.dialogue1}"\n\n`;
      if (formData.dialogue2) {
        prompt += `✅ ${formData.character2.split(' ')[0]} replies *in clear Burmese language* "${formData.dialogue2}"\n\n`;
      }
    } else {
      // Single character prompt
      prompt += `✅ ${formData.character1}\n\n`;
      prompt += `✅ Speaking *in a clear Burmese language* "${formData.dialogue1}"\n\n`;
    }
    
    prompt += `✅ Note that output audio must be in burmese language.`;
    
    setGeneratedPrompt(prompt);
    incrementPromptUsage().then(() => {
      // Usage incremented successfully
    }).catch((error) => {
      console.error('Failed to increment usage:', error);
    });
    toast.success("Manual prompt created!");
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-neon-green/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-neon-cyan/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Auth buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {user ? (
                <UserMenu onOpenProfile={() => setShowProfileDialog(true)} />
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoginDialog(true)}
                    className="border-border/50 hover:border-neon-green/50"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowSignupDialog(true)}
                    className="bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple hover:from-neon-green/80 hover:via-neon-cyan/80 hover:to-neon-purple/80 text-black font-bold"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Video className="h-10 w-10 text-neon-green drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <div className="absolute inset-0 h-10 w-10 bg-neon-green/20 rounded-full blur animate-pulse"></div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple bg-clip-text text-transparent">
                VEO 3 Neural Engine
              </h1>
              <div className="relative">
                <Zap className="h-10 w-10 text-neon-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                <div className="absolute inset-0 h-10 w-10 bg-neon-cyan/20 rounded-full blur animate-pulse delay-300"></div>
              </div>
            </div>
            <p className="text-xl text-foreground/80 mb-3 font-medium">
              Next-Gen Myanmar AI Video Prompt Generator
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Advanced neural translation engine with real-time Myanmar to English processing for Google Veo 2 & 3
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="h-2 w-2 bg-neon-green rounded-full animate-pulse"></div>
              <span className="text-xs text-neon-green font-mono">SYSTEM ONLINE</span>
              <div className="h-2 w-2 bg-neon-green rounded-full animate-pulse"></div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-2xl border border-border/30 bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 via-transparent to-neon-cyan/5 pointer-events-none"></div>
            <CardHeader className="bg-gradient-to-r from-neon-green/90 via-neon-cyan/90 to-neon-purple/90 text-black rounded-t-lg relative">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Zap className="h-6 w-6" />
                Neural Input Matrix
              </CardTitle>
              <CardDescription className="text-black/80 font-medium">
                Configure AI parameters for Myanmar video synthesis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="promptType" className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <Users className="h-4 w-4 text-neon-purple" />
                    Generation Mode
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-neon-cyan transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>AI ထုတ်လုပ်မှုပုံစံကို ရွေးချယ်ပါ:</p>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        <li><strong>အင်တာဗျူး:</strong> ပုဂ္ဂိုလ်များအကြား မေးခွန်း-အဖြေပုံစံ</li>
                        <li><strong>စကားဝိုင်း:</strong> သဘာဝကျသော စကားပြောပုံစံ</li>
                        <li><strong>တစ်ဦးတည်း:</strong> လူတစ်ဦးတည်းပြောဆိုခြင်း</li>
                        <li><strong>မှတ်တမ်း:</strong> ဇာတ်ကြောင်းပြန်ကြားပုံစံ</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.promptType} onValueChange={(value) => handleInputChange("promptType", value)}>
                  <SelectTrigger className="mt-1 bg-background/80 border-border/50 hover:border-neon-green/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border/50">
                    <SelectItem value="interview">🎙️ Interview Mode</SelectItem>
                    <SelectItem value="conversation">💬 Conversation Flow</SelectItem>
                    <SelectItem value="monologue">🗣️ Single Speaker</SelectItem>
                    <SelectItem value="documentary">📺 Documentary Style</SelectItem>
                    <SelectItem value="news">📰 News Report</SelectItem>
                    <SelectItem value="tutorial">🎓 Tutorial/Educational</SelectItem>
                    <SelectItem value="storytelling">📖 Storytelling</SelectItem>
                    <SelectItem value="vlog">📱 Vlog Style</SelectItem>
                    <SelectItem value="testimonial">💭 Testimonial</SelectItem>
                    <SelectItem value="presentation">🗂️ Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-neon-green" />
                    Location Matrix
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-neon-cyan transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>ဗီဒီယိုထုတ်လုပ်ရန် ပတ်ဝန်းကျင်ကို သတ်မှတ်ပါ:</p>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        <li>ရိုးရာနေရာများ: "ရန်ကုန်၏ ဒေသစျေး"</li>
                        <li>ခေတ်မီဆောင်များ: "မန္တလေးမြို့လယ်ရှိ ခေတ်မီရုံးခန်း"</li>
                        <li>သဘာဝပတ်ဝန်းကျင်: "နေဝင်ချိန် ဧရာဝတီမြစ်ကမ်းစေး"</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <MyanmarTranslateInput
                  label=""
                  placeholder="e.g., a traditional tea shop in old Yangon, riverside pagoda"
                  value={formData.location}
                  onChange={(value) => handleInputChange("location", value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <Users className="h-4 w-4 text-neon-cyan" />
                    Primary Entity
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-neon-cyan transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>အဓိကဇာတ်ကောင်၏ အသွင်အပြင်နှင့် လက္ခဏာများကို သတ်မှတ်ပါ:</p>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        <li>အသက်: လူငယ်၊ အလယ်အလတ်၊ အရွယ်ကြီး</li>
                        <li>အဝတ်အစား: ရိုးရာလုံချည်၊ ခေတ်မီအဝတ်</li>
                        <li>အမူအရာ: ယုံကြည်မှုရှိသော၊ ဖော်ရွေသော၊ လေးနက်သော</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <MyanmarTranslateInput
                  label=""
                  placeholder="e.g., A confident young Burmese woman in traditional thanaka and elegant htamein"
                  value={formData.character1}
                  onChange={(value) => handleInputChange("character1", value)}
                  required
                />
              </div>

              {!['monologue', 'documentary', 'news', 'tutorial', 'storytelling', 'vlog', 'testimonial', 'presentation'].includes(formData.promptType) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                      <Users className="h-4 w-4 text-neon-purple" />
                      Secondary Entity
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-neon-cyan transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>စကားပြောမြင်ကွင်းများအတွက် ဒုတိယဇာတ်ကောင်:</p>
                        <ul className="list-disc list-inside mt-1 text-xs">
                          <li>တစ်ဦးတည်းပြောခြင်းအတွက် ရှင်းထားပါ</li>
                          <li>အင်တာဗျူး သို့မဟုတ် စကားဝိုင်းပုံစံအတွက် ထည့်ပါ</li>
                          <li>အသွင်အပြင်၊ အသက်၊ အဝတ်အစားများကို ဖော်ပြပါ</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <MyanmarTranslateInput
                    label=""
                    placeholder="e.g., A wise elderly man in traditional longyi and white shirt"
                    value={formData.character2}
                    onChange={(value) => handleInputChange("character2", value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <Mic className="h-4 w-4 text-neon-green" />
                    Neural Speech Input 1
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-neon-cyan transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>အဓိကစကားပြောဆိုမှု သို့မဟုတ် စကားလုံးများ:</p>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        <li>အထက်တွင် မြန်မာအက္ခရာဖြင့် ရိုက်ပါ အလိုအလျောက်ဘာသာပြန်ရန်</li>
                        <li>သို့မဟုတ် အင်္ဂလိပ်ဖြင့် တိုက်ရိုက်ရေးပါ</li>
                        <li>သဘာဝကျပြီး စကားပြောဆိုမှုပုံစံဖြင့် ထားပါ</li>
                        <li>AI က မြန်မာအသံထွက်ကို သေချာစေပါမည်</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <MyanmarTranslateInput
                  label=""
                  placeholder="Enter dialogue in English or translate from Myanmar above"
                  value={formData.dialogue1}
                  onChange={(value) => handleInputChange("dialogue1", value)}
                  required
                />
              </div>

              {!['monologue', 'documentary', 'news', 'tutorial', 'storytelling', 'vlog', 'testimonial', 'presentation'].includes(formData.promptType) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                      <Mic className="h-4 w-4 text-neon-purple" />
                      Neural Speech Input 2
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-neon-cyan transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>ဒုတိယဇာတ်ကောင်၏ တုံ့ပြန်မှု သို့မဟုတ် စကားများ:</p>
                        <ul className="list-disc list-inside mt-1 text-xs">
                          <li>ဇာတ်ကောင်များစွာပါသော မြင်ကွင်းများအတွက်သာ လိုအပ်</li>
                          <li>တစ်ဦးတည်းပြောခြင်းအတွက် ရှင်းထားပါ</li>
                          <li>ပထမစကားပြောချက်ကို သဘာဝကျစွာ တုံ့ပြန်သင့်သည်</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <MyanmarTranslateInput
                    label=""
                    placeholder="Character 2's response - leave empty for single speaker mode"
                    value={formData.dialogue2}
                    onChange={(value) => handleInputChange("dialogue2", value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleGeneratePrompt} 
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple hover:from-neon-green/80 hover:via-neon-cyan/80 hover:to-neon-purple/80 text-black font-bold shadow-lg hover:shadow-neon transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                          Neural Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI မြှင့်တင်ထားသော ပရမ့်ကို နြူရယ်မြှင့်တင်မှုဖြင့် ထုတ်လုပ်ပါ</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={createManualPrompt}
                      variant="outline"
                      className="flex-1 border-border/50 hover:border-neon-green/50 hover:bg-neon-green/5 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Manual Mode
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>အခြေခံပုံစံသုံးပြီး ပရမ့်ကို ဖန်တီးပါ</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Generated Prompt */}
          <Card className="shadow-2xl border border-border/30 bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-green/5 pointer-events-none"></div>
            <CardHeader className="bg-gradient-to-r from-neon-cyan/90 via-neon-green/90 to-neon-purple/90 text-black rounded-t-lg relative">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Sparkles className="h-6 w-6" />
                Neural Output Terminal
              </CardTitle>
              <CardDescription className="text-black/80 font-medium">
                Optimized for Google Veo 2 & 3 Neural Networks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              {generatedPrompt ? (
                <div className="space-y-4">
                  <div className="bg-background/50 p-4 rounded-lg border border-border/30 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-2 left-2 flex gap-1">
                      <div className="w-2 h-2 bg-destructive rounded-full"></div>
                      <div className="w-2 h-2 bg-neon-cyan rounded-full"></div>
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono mt-6 leading-relaxed">
                      {generatedPrompt}
                    </pre>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={copyToClipboard}
                          className="flex-1 bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple hover:from-neon-cyan/80 hover:via-neon-green/80 hover:to-neon-purple/80 text-black font-bold shadow-lg hover:shadow-neon transition-all duration-300"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Copy to Neural Interface</span>
                          <span className="sm:hidden">Copy Prompt</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Veo 3 ထည့်သွင်းရန်အတွက် ပရမ့်ကို ကလစ်ဘုတ်သို့ ကူးယူပါ</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          asChild
                          className="flex-1 bg-gradient-to-r from-neon-purple via-neon-green to-neon-cyan hover:from-neon-purple/80 hover:via-neon-green/80 hover:to-neon-cyan/80 text-black font-bold shadow-lg hover:shadow-neon transition-all duration-300"
                        >
                          <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                            <Video className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Create Video with Veo 3</span>
                            <span className="sm:hidden">Create Video</span>
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gemini Pro တွင် Veo 3 ဖြင့် ဗီဒီယို ဖန်တီးပါ</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={handleVeo3RealTime}
                          disabled={!generatedPrompt}
                          className="flex-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-400 hover:via-orange-400 hover:to-yellow-400 text-black font-bold shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Generate with Veo 3 Real-Time</span>
                          <span className="sm:hidden">Veo 3 RT</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Veo 3 Real-Time ဖြင့် တိုက်ရိုက် ဗီဒီယို ဖန်တီးပါ</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => setShowVeo3BusinessDialog(true)}
                          className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Veo 3 Business</span>
                          <span className="sm:hidden">Veo 3 Biz</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Professional Veo 3 video generation with KIE API</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="relative inline-block mb-6">
                    <Sparkles className="h-16 w-16 mx-auto opacity-30" />
                    <div className="absolute inset-0 h-16 w-16 bg-neon-cyan/10 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <p className="text-lg font-medium mb-2">Neural Output Standby</p>
                  <p className="text-sm">Configure input parameters and initiate generation</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="h-1 w-1 bg-neon-cyan rounded-full animate-ping"></div>
                    <div className="h-1 w-1 bg-neon-green rounded-full animate-ping delay-100"></div>
                    <div className="h-1 w-1 bg-neon-purple rounded-full animate-ping delay-200"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Auth Dialogs */}
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          onSwitchToSignup={() => {
            setShowLoginDialog(false);
            setShowSignupDialog(true);
          }}
        />
        
        <SignupDialog
          open={showSignupDialog}
          onOpenChange={setShowSignupDialog}
          onSwitchToLogin={() => {
            setShowSignupDialog(false);
            setShowLoginDialog(true);
          }}
        />
        
        <ProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
        />
        
        <Veo3BusinessDialog
          open={showVeo3BusinessDialog}
          onOpenChange={setShowVeo3BusinessDialog}
          initialPrompt={generatedPrompt}
        />

        {/* Instructions */}
        <Card className="mt-8 shadow-lg border-border/20 bg-gradient-to-r from-card via-card to-muted/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-neon-cyan flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Neural Interface Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p><strong className="text-neon-green">STEP 1:</strong> Location mapping - Define spatial coordinates</p>
                <p><strong className="text-neon-green">STEP 2:</strong> Character matrix - Configure entity parameters</p>
                <p><strong className="text-neon-cyan">NEURAL:</strong> Real-time Myanmar translation engine active</p>
              </div>
              <div className="space-y-2">
                <p><strong className="text-neon-purple">SYNC:</strong> Auto-translate Myanmar dialogue seamlessly</p>
                <p><strong className="text-destructive">LIMIT:</strong> Veo 3 processes English input only</p>
                <p><strong className="text-neon-green">OUTPUT:</strong> Burmese audio synthesis enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Veo 3 Real-Time Dialog */}
        <Dialog open={showVeoDialog} onOpenChange={setShowVeoDialog}>
          <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                <Play className="h-6 w-6 text-red-500" />
                Veo 3 Real-Time Generator
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-6 pt-2">
              <div className="w-full h-full rounded-lg overflow-hidden border border-border/30 bg-background/50">
                <script
                  type="module"
                  src="https://gradio.s3-us-west-2.amazonaws.com/5.34.2/gradio.js"
                ></script>
                <gradio-app 
                  src="https://heartsync-veo3-realtime.hf.space"
                  className="w-full h-full"
                ></gradio-app>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;