import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayIcon, PauseIcon, VolumeXIcon, MoreVerticalIcon, RefreshCwIcon, UndoIcon, Download, PanelRightClose, VolumeIcon, Volume2, Volume1 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo, useEffect, useRef } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { useAudioResponseStore } from "@/services/audioUploadApi";

interface AudioTranscriptPanelProps {
  dictation?: any;
  selectedPatient?: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  liveTranscription?: string;
}

export function AudioTranscriptPanel({
  dictation,
  selectedPatient,
  isCollapsed,
  onToggleCollapse,
  liveTranscription = ""
}: AudioTranscriptPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Get data from the store
  const { response, audioUrl, audioFile, isLoading } = useAudioResponseStore();

  // Use store data or fallback to props  
  const transcriptData = response?.transcript || response?.text || dictation;
  const isLiveMode = liveTranscription.length > 0;

  // Auto-scroll to bottom when new transcription comes in
  useEffect(() => {
    if (isLiveMode && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [liveTranscription, isLiveMode]);

  // Setup audio element when audioUrl changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Format time display
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isLiveMode || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Calculate time from mouse position
  const getTimeFromMousePosition = (e: MouseEvent | React.MouseEvent) => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    return percentage * duration;
  };

  // Handle progress bar mouse down
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLiveMode || !audioRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    const newTime = getTimeFromMousePosition(e);
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  // Handle mouse move during drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isLiveMode || !audioRef.current) return;
    e.preventDefault();
    const newTime = getTimeFromMousePosition(e);
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  // Handle mouse up to end drag
  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    setIsMuted(newVolume[0] === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100;
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  // Handle playback speed change
  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Handle download
  const handleDownload = () => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = audioFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const parsedDictation = useMemo(() => {
    let textToParse = '';
    
    // Use store transcript data first, then fallback to dictation prop
    if (transcriptData) {
      if (typeof transcriptData === 'string') {
        textToParse = transcriptData;
      } else if (transcriptData?.Table?.[0]?.DICTATION_TEXT) {
        textToParse = transcriptData.Table[0].DICTATION_TEXT;
      }
    }

    if (!textToParse) {
      return null;
    }

    const speakerRegex = /(Speaker [A-Z]:)/g;
    const parts = textToParse.split(speakerRegex);

    if (parts.length <= 1) {
      return [{ speaker: null, text: textToParse }];
    }

    const result = [];
    for (let i = 1; i < parts.length; i += 2) {
      result.push({
        speaker: parts[i].replace(':', ''),
        text: parts[i + 1].trim(),
      });
    }
    return result;
  }, [transcriptData]);

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className={`${isCollapsed ? "w-0" : "w-[350px]"} bg-gray-50 flex flex-col rounded-sm overflow-hidden transition-all duration-300 ease-in-out audio-transcript-panel border-l border-plum-600`}>
      {isCollapsed ? null : (
        <>
          {/* Header */}
          <div className="p-4 bg-[#b80e74]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white text-xl">
                {isLiveMode ? 'Live Transcription' : ( dictation?.Table?.[0].PATIENT_NAME || 'Transcript')}
              </h3>
              <span className="text-md text-white">
                {isLiveMode ? new Date().toLocaleDateString() : (dictation?.Table?.[0]?.CREATED_DATE ? new Date(dictation.Table[0].CREATED_DATE).toLocaleDateString() : new Date().toLocaleDateString())}
              </span>
            </div>

            {/* Patient Consent */}
            <div className="flex items-center gap-2 mb-3">
              <Checkbox id="patient-consent" />
              <label htmlFor="patient-consent" className="text-md text-white">Patient Consent Received?</label>
            </div>

            {/* Enhanced Audio Player */}
            <div className="flex items-center gap-3 bg-white rounded-full px-3 py-2">
              {/* Play/Pause Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayPause}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-none hover:bg-gray-100"
                disabled={isLiveMode || !audioUrl}
              >
                {isPlaying ? (
                  <PauseIcon className="w-4 h-4 text-black fill-black" />
                ) : (
                  <PlayIcon className="w-4 h-4 ml-0.5 text-black fill-black" />
                )}
              </Button>

              {/* Time Display */}
              <span className="text-xs text-black font-mono min-w-[60px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Interactive Progress Bar */}
              <div
                ref={progressBarRef}
                className={`flex-1 bg-gray-200 rounded-full h-2 relative group ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'} ${!audioUrl ? 'opacity-50' : ''}`}
                onMouseDown={handleProgressMouseDown}
              >
                <div
                  className="bg-black h-full rounded-full transition-all duration-75 relative"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div 
                    className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full transition-opacity ${
                      isDragging || progressBarRef.current?.matches(':hover') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`} 
                  />
                </div>
              </div>

              {/* Volume Control */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 hover:bg-gray-100 rounded-full"
                  onClick={handleMuteToggle}
                >
                  {isMuted || volume[0] === 0 ? (
                    <VolumeXIcon className="w-4 h-4 text-black" />
                  ) : volume[0] < 20 ? (
                    <VolumeIcon className="w-4 h-4 text-black" />
                  ) : volume[0] < 50 ? (
                    <Volume1 className="w-4 h-4 text-black" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-black" />
                  )}
                </Button>
                
                {/* Invisible bridge to prevent hover gap */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-full h-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"></div>
                
                {/* Volume Slider - Shows on Hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                  <div className="bg-white rounded-lg shadow-lg border p-3 min-w-[120px]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-600">Volume</span>
                      <Slider
                        value={isMuted ? [0] : volume}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="w-full"
                        orientation="horizontal"
                      />
                      <span className="text-xs text-gray-500">{isMuted ? 0 : volume[0]}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* More Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVerticalIcon className="w-4 h-4 text-black" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleDownload} disabled={!audioFile}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="mr-1 ml-0" viewBox="0 0 28 28" id="Playback-Speed--Streamline-Solar-Broken" height="20" width="20">
                          <desc>
                            Playback Speed Streamline Icon: https://streamlinehq.com
                          </desc>
                          <g id="Playback Speed--playback speed-play-button-start-video-audio-player-multimedia-streaming">
                            <path id="Vector" stroke="#000000" stroke-linecap="round" d="M12 22c5.5228 0 10 -4.4772 10 -10 0 -5.52285 -4.4772 -10 -10 -10" stroke-width="1.5"></path>
                            <path id="Vector_2" stroke="#000000" d="M15.4137 10.941c0.7817 0.4616 0.7817 1.6564 0 2.118l-4.7202 2.7868C9.93371 16.2944 9 15.7105 9 14.7868V9.21316c0 -0.92369 0.93371 -1.50755 1.6935 -1.05897z" stroke-width="1.5"></path>
                            <path id="Vector_3" stroke="#000000" stroke-linecap="round" d="M12 22c-0.8107 0 -1.5989 -0.0965 -2.35376 -0.2786M12 2c-0.8107 0 -1.5989 0.09648 -2.35376 0.27859M6.7858 20.5347c-1.32097 -0.8088 -2.43966 -1.9156 -3.2625 -3.227M6.7858 3.46532c-1.32097 0.80876 -2.43966 1.9156 -3.2625 3.22694M2.2738 9.66618C2.09479 10.4149 2 11.1964 2 12s0.09479 1.5851 0.2738 2.3338" stroke-width="1.5"></path>
                          </g>
                        </svg> Playback Speed
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {playbackSpeeds.map((speed) => (
                        <DropdownMenuItem
                          key={speed}
                          onClick={() => handlePlaybackSpeedChange(speed)}
                          className={playbackSpeed === speed ? "bg-gray-100" : ""}
                        >
                          {speed}x {speed === 1 ? "(Normal)" : ""}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Transcript */}
          <div className="flex-1 h-0 bg-[#F2F1ED]">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="p-4">
                {isLoading ? (
                  <div className="p-4 text-center">Processing audio...</div>
                ) : isLiveMode ? (
                  // Live transcription display
                  <div className="mb-1 animate-fade-in hover:bg-medical-gray-light/20 rounded-lg p-3 transition-all duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-plum-500 text-base">
                        Live:
                      </span>
                    </div>
                    <p className="text-base text-medical-text-primary leading-relaxed">
                      {liveTranscription}
                    </p>
                  </div>
                ) : !transcriptData && !parsedDictation ? (
                  <div className="p-4 text-center text-gray-500">No transcript available. Upload an audio file to get started.</div>
                ) : parsedDictation ? (
                  parsedDictation.map((entry, index) => (
                    <div key={index} className="mb-1 animate-fade-in hover:bg-medical-gray-light/20 rounded-lg p-3 transition-all duration-200 cursor-pointer">
                      {entry.speaker && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-plum-500 text-base">
                            {entry.speaker}:
                          </span>
                        </div>
                      )}
                      <p className="text-base text-medical-text-primary leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No transcript available.</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Audio element */}
          <audio
            ref={audioRef}
            style={{ display: 'none' }}
            onTimeUpdate={(e) => {
              const audio = e.target as HTMLAudioElement;
              setCurrentTime(audio.currentTime);
            }}
            onLoadedMetadata={(e) => {
              const audio = e.target as HTMLAudioElement;
              setDuration(audio.duration);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </>
      )}
    </div>
  );
}