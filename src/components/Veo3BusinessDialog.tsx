import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Veo3Client } from "@/services/veo3Service";
import { toast } from "sonner";
import { Video, Download, Clock, CheckCircle, XCircle, Loader2, Key, Zap, Play } from "lucide-react";

interface Veo3BusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
}

export const Veo3BusinessDialog: React.FC<Veo3BusinessDialogProps> = ({
  open,
  onOpenChange,
  initialPrompt = ""
}) => {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'processing' | 'completed' | 'failed'>('idle');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your KIE API key");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a video prompt");
      return;
    }

    setIsGenerating(true);
    setStatus('generating');
    setProgress(10);
    setStatusMessage('Initializing video generation...');

    try {
      const client = new Veo3Client(apiKey);
      
      // Start video generation
      const newTaskId = await client.generateVideo(prompt, { aspectRatio });
      setTaskId(newTaskId);
      setProgress(25);
      setStatus('processing');
      setStatusMessage('Video generation started. Processing...');
      
      toast.success(`Video generation started! Task ID: ${newTaskId}`);

      // Wait for completion with progress updates
      const urls = await client.waitForCompletion(newTaskId, 600000, (statusData) => {
        setStatusMessage(`Processing video... Status: ${statusData.successFlag}`);
        
        // Update progress based on status
        if (statusData.successFlag === 0) {
          setProgress(Math.min(progress + 5, 90)); // Gradually increase
        }
      });

      setVideoUrls(urls);
      setProgress(100);
      setStatus('completed');
      setStatusMessage('Video generation completed successfully!');
      toast.success('Video generated successfully!');

    } catch (error) {
      console.error('Video generation error:', error);
      setStatus('failed');
      setStatusMessage(`Error: ${(error as Error).message}`);
      toast.error(`Video generation failed: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `veo3-video-${taskId}-${index + 1}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  const resetGeneration = () => {
    setStatus('idle');
    setProgress(0);
    setTaskId('');
    setVideoUrls([]);
    setStatusMessage('');
    setIsGenerating(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Video className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'generating':
        return <Badge className="bg-blue-500"><Zap className="w-3 h-3 mr-1" />Generating</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">Ready</Badge>;
    }
  };

  React.useEffect(() => {
    if (initialPrompt && initialPrompt !== prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            <Video className="h-6 w-6 text-blue-500" />
            Veo 3 Business Generator
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* API Key Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5 text-yellow-500" />
                KIE API Configuration
              </CardTitle>
              <CardDescription>
                Enter your KIE API key to access Veo 3 Business features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="apiKey">KIE API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your KIE API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://kie.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">kie.ai</a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Video Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  Video Generation
                </div>
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                Generate high-quality videos using Veo 3 Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Video Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the video you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    16:9 supports 1080P HD generation, 9:16 optimized for mobile
                  </p>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Task ID</Label>
                  <Input
                    value={taskId || 'Not generated yet'}
                    readOnly
                    className="bg-muted font-mono text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !apiKey.trim() || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status and Progress */}
          {(status !== 'idle' || isGenerating) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon()}
                  Generation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-2">
                  <Label>Status Message</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {statusMessage || 'Ready to generate...'}
                  </p>
                </div>

                {taskId && (
                  <div className="space-y-2">
                    <Label>Task ID</Label>
                    <div className="flex gap-2">
                      <Input
                        value={taskId}
                        readOnly
                        className="bg-muted font-mono text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(taskId);
                          toast.success('Task ID copied to clipboard');
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                {status === 'failed' && (
                  <Button
                    onClick={resetGeneration}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generated Videos */}
          {videoUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Generated Videos
                </CardTitle>
                <CardDescription>
                  Your videos are ready for download and viewing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {videoUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">Video {index + 1}</p>
                        <p className="text-sm text-muted-foreground">Ready for download</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(url, index)}
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={resetGeneration}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Generate Another Video
                </Button>
              </CardContent>
            </Card>
          )}

          {/* API Information */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">About Veo 3 Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Veo 3 Business</strong> is a professional video generation service powered by Google's latest AI technology.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>High-quality video generation with advanced AI</li>
                <li>Multiple aspect ratios supported</li>
                <li>Fast processing times for business use</li>
                <li>Professional-grade output quality</li>
              </ul>
              <p className="text-xs">
                API provided by <a href="https://kie.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">KIE.ai</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};