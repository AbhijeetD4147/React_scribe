import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayIcon, PauseIcon, VolumeXIcon, MoreVerticalIcon, RefreshCwIcon, UndoIcon, DownloadIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export function AudioTranscriptPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalTime = 29.52; // 29:52 in minutes

  const transcriptData = [
    {
      speaker: "Speaker A",
      time: "0:00",
      text: "Okay, so for Jeffrey, he normally wears glasses, but it's kind of on and off depending on how, like, how bad he's seeing is how he was saying it. Right now his uncorrected vision seems a little bit worse. Near versus distance is what he was saying. It looks a little bit more off compared to what we had before. And then for whatever reason, the OPD was saying stuff that was similar, like minus 2ish range. So he's in 2. Whenever you're ready. But yeah. Thank you. So last time we had NGD telangiectasia. Hypertensive Retinopathy. Insurance is eye Med and Blue Cross Bushido. Blue Cross Bushido is non covered. So looks like we're doing a desktop. I'll get a drink here real quick. Sure, Doc. Should I add in the ocular hypertension or. No, not ocular hypertension. In his retina, he's had hypertensive changes to his vessels. So that would be hypertensive retinopathy. Okay. Which I would add if he had that before, because I'm sure that looks the same. That doesn't go away. Yes, Doc. His blood pressure was fine today. 114 over 70. His medications include"
    }
  ];

  return (
    <div className="w-80 bg-white border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="h-[88px] p-4 border-b border-border flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-medical-text-primary">Pt: Manish 813</h3>
          <span className="text-sm text-medical-text-secondary">08/13/2025</span>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="patient-consent" />
          <label htmlFor="patient-consent" className="text-sm text-medical-text-primary cursor-pointer hover:text-medical-blue transition-colors duration-200">
            Patient Consent received?
          </label>
        </div>
      </div>

      {/* Audio Player */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-medical-gray-light/30 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 p-0 hover-scale transition-all duration-200 hover:border-medical-blue hover:bg-medical-blue/10"
          >
            {isPlaying ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </Button>
          <div className="flex-1">
            <div className="text-xs text-medical-text-secondary mb-1 font-medium">
              {Math.floor(currentTime)}:{(currentTime % 1 * 60).toFixed(0).padStart(2, '0')} / 29:52
            </div>
            <Slider
              value={[currentTime]}
              max={totalTime}
              step={0.1}
              onValueChange={(value) => setCurrentTime(value[0])}
              className="w-full"
            />
          </div>
          <Button size="sm" variant="outline" className="w-8 h-8 p-0 hover-scale transition-all duration-200 hover:border-medical-blue">
            <VolumeXIcon className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" className="w-8 h-8 p-0 hover-scale transition-all duration-200 hover:border-medical-blue">
            <MoreVerticalIcon className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="flex-1 hover-scale transition-all duration-200 hover:border-medical-blue">
            <RefreshCwIcon className="w-3 h-3 mr-2" />
            Sync
          </Button>
          <Button size="sm" variant="outline" className="flex-1 hover-scale transition-all duration-200 hover:border-medical-blue">
            <UndoIcon className="w-3 h-3 mr-2" />
            Undo
          </Button>
          <Button size="sm" variant="outline" className="w-8 h-8 p-0 hover-scale transition-all duration-200 hover:border-medical-blue">
            <DownloadIcon className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {transcriptData.map((entry, index) => (
              <div key={index} className="mb-4 animate-fade-in hover:bg-medical-gray-light/20 rounded-lg p-3 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-medical-blue text-sm">
                    {entry.speaker}:
                  </span>
                  <span className="text-xs text-medical-text-secondary bg-medical-gray-light/50 px-2 py-1 rounded">
                    {entry.time}
                  </span>
                </div>
                <p className="text-sm text-medical-text-primary leading-relaxed">
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}