import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayIcon, PauseIcon, VolumeXIcon, MoreVerticalIcon, RefreshCwIcon, UndoIcon, Download, PanelRightClose } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AudioTranscriptPanelProps {
  dictation: any;
  selectedPatient: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AudioTranscriptPanel({ dictation, selectedPatient, isCollapsed, onToggleCollapse }: AudioTranscriptPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalTime = 29.52; // 29:52 in minutes

  const parsedDictation = useMemo(() => {
    if (!dictation?.Table?.[0]?.DICTATION_TEXT) {
      return null;
    }

    const text = dictation.Table[0].DICTATION_TEXT;
    const speakerRegex = /(Speaker [A-Z]:)/g;
    const parts = text.split(speakerRegex);

    if (parts.length <= 1) {
      return [{ speaker: null, text }];
    }

    const result = [];
    for (let i = 1; i < parts.length; i += 2) {
      result.push({
        speaker: parts[i].replace(':', ''),
        text: parts[i + 1].trim(),
      });
    }
    return result;
  }, [dictation]);

  return (
    <div className={`${isCollapsed ? "w-0" : "w-[350px]"} bg-gray-50 flex flex-col rounded-lg overflow-hidden transition-all duration-300 ease-in-out audio-transcript-panel border-l border-plum-600`} style={{ height: 'calc(100vh - 88px)' }}>
      {isCollapsed ? null : (
        <>
          {/* Header */}
          <div className="p-4 bg-plum-500">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white">{dictation?.Table?.[0]?.DICTATION_NAME || 'Transcript'}</h3>
              <span className="text-xs text-white">{dictation?.Table?.[0] ? new Date(dictation.Table[0].CREATED_DATE).toLocaleDateString() : ''}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox id="patient-consent" />
              <label htmlFor="patient-consent" className="text-xs text-white">Patient Consent Received?</label>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
              >
                {isPlaying ? <PauseIcon className="w-4 h-4 text-plum-500" /> : <PlayIcon className="w-4 h-4 ml-0.5 text-plum-500" />}
              </Button>
              <span className="text-xs text-white">{Math.floor(currentTime)}:{(currentTime % 1 * 60).toFixed(0).padStart(2, '0')} / 29:52</span>
              <div className="flex-1 bg-white/30 rounded-full h-1.5">
                <div className="bg-white h-full rounded-full" style={{ width: `${(currentTime / totalTime) * 100}%` }} />
              </div>
              <VolumeXIcon className="w-4 h-4 text-white" />
              <MoreVerticalIcon className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Transcript */}
          <div className="flex-1 h-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {!dictation ? (
                  <div className="p-4 text-center">Loading...</div>
                ) : parsedDictation ? (
                  parsedDictation.map((entry, index) => (
                    <div key={index} className="mb-1 animate-fade-in hover:bg-medical-gray-light/20 rounded-lg p-3 transition-all duration-200 cursor-pointer">
                      {entry.speaker && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary text-base">
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
                  <p className="text-sm text-gray-500">No dictation available.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}