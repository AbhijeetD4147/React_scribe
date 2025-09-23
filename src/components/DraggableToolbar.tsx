import { useState, useRef, useEffect } from "react";
import { Upload, Square, Expand, Minimize2, Mic, Pause, GripVertical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedicalInterface } from "./MedicalInterface";
import { toast } from "@/components/ui/sonner";
import { uploadAudioFile } from "@/services/audioUploadApi";

interface Position {
  x: number;
  y: number;
}

export function DraggableToolbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState<Position>({ x: window.innerWidth - 80, y: 20 });
  const [originalPosition, setOriginalPosition] = useState<Position>({ x: window.innerWidth - 80, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Add file input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return; // Don't allow dragging when animating
    
    e.preventDefault(); // Prevent text selection and other default behaviors
    setIsDragging(true);
    
    const rect = toolbarRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isAnimating) return;
  
    e.preventDefault();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
  
    // Simple bounds checking - keep it within screen with some padding
    const padding = 10;
    const toolbarWidth = 60;
    const toolbarHeight = 280;
    
    const maxX = window.innerWidth - toolbarWidth - padding;
    const maxY = window.innerHeight - toolbarHeight - padding;
  
    const newPosition = {
      x: Math.max(padding, Math.min(newX, maxX)),
      y: Math.max(padding, Math.min(newY, maxY)),
    };
  
    // Use requestAnimationFrame for ultra-smooth dragging
    requestAnimationFrame(() => {
      setPosition(newPosition);
      setOriginalPosition(newPosition);
    });
  };
  
  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mouseleave", handleMouseUp);
      
      // Disable text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      // Re-enable text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging]);
  
  const handleExpandToggle = () => {
    if (isAnimating) return; // Prevent multiple clicks during animation
    
    setIsAnimating(true);
    
    if (!isExpanded) {
      // When expanding, show medical interface with smooth animation
      setIsExpanded(true);
      setTimeout(() => setIsAnimating(false), 500); // Back to original timing
    } else {
      // When collapsing, hide medical interface with smooth animation
      setIsExpanded(false);
      setTimeout(() => setIsAnimating(false), 500); // Back to original timing
    }
  };
  
  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      console.log("Starting recording...");
      // Start the timer
      setRecordingTime(0);
      setIsPaused(false);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      // Add your recording start logic here
    } else {
      console.log("Stopping recording...");
      // Stop the timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
      setIsPaused(false);
      // Add your recording stop logic here
    }
  };
  
  const handlePauseToggle = () => {
    if (!isRecording) return; // Can't pause if not recording
    
    setIsPaused(!isPaused);
    
    if (!isPaused) {
      console.log("Pausing recording...");
      // Pause the timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      // Add your recording pause logic here
    } else {
      console.log("Resuming recording...");
      // Resume the timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      // Add your recording resume logic here
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);
  {/* Add file input reference */}
        
          // Add file upload handler
          const handleFileUpload = () => {
            fileInputRef.current?.click();
          };
          
          const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;
            
            const file = files[0];
            // 200MB = 200 * 1024 * 1024 bytes
            const maxSize = 200 * 1024 * 1024;
            
            if (file.size > maxSize) {
              toast.error("File size exceeds the 200MB limit. Please select a smaller file.");
              // Reset the input
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
              return;
            }
            
            console.log("File selected:", file.name, "Size:", (file.size / (1024 * 1024)).toFixed(2), "MB");
            
            try {
              toast.info("Uploading file...");
              const response = await uploadAudioFile(file);
              console.log("Upload response:", response);
              toast.success("File uploaded successfully!");
            } catch (error) {
              console.error("Error uploading file:", error);
              toast.error("Failed to upload file. Please try again.");
            }
            
            // Reset the input to allow selecting the same file again
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          };
  
  // Toolbar stays in its current position
  const toolbarPosition = position;
  
  // Calculate popup position based on toolbar position
  const popupWidth = Math.min(window.innerWidth * 0.8, 1200);
  const popupHeight = Math.min(window.innerHeight * 0.8, 800);
  
  // Position popup to the left of toolbar with some spacing
  const popupLeft = Math.max(20, Math.min(position.x - popupWidth - 20, window.innerWidth - popupWidth - 20));
  const popupTop = Math.max(20, Math.min(position.y, window.innerHeight - popupHeight - 20));
  
  // When expanded, position toolbar at the right edge of popup (outside)
  const expandedToolbarPosition = {
    x: popupLeft + popupWidth + 10, // Outside the right edge of popup
    y: popupTop + 10                // Aligned with popup top
  };
  
  // Get the expand button position for animation origin
  const expandButtonPosition = toolbarRef.current?.getBoundingClientRect();
  const expandButtonCenter = expandButtonPosition ? {
    x: expandButtonPosition.left + expandButtonPosition.width / 2,
    y: expandButtonPosition.top + expandButtonPosition.height / 2
  } : { x: 0, y: 0 };
  
  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="*/*" // You can specify accepted file types here
      />
      
      {/* Medical Interface - popup window positioned relative to toolbar's current position */}
      <div
        className={`fixed z-40 ${isDragging ? '' : 'transition-all duration-500 ease-in-out'} ${
          isExpanded
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-0 pointer-events-none'
        }`}
        style={{
          left: `${popupLeft}px`,
          top: `${popupTop}px`,
          transformOrigin: `${popupWidth}px 0px`, // Scale from top-right corner (where toolbar will be)
          width: `${popupWidth}px`,
          height: `${popupHeight}px`,
          willChange: isDragging ? 'transform' : 'auto', // Optimize for dragging performance
        }}
      >
        <div className={`h-full w-full bg-white border-2 border-primary/40 rounded-lg shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <MedicalInterface />
        </div>
      </div>
  
      {/* Draggable Toolbar - moves to popup's top-right corner when expanded but remains draggable */}
      <div
        ref={toolbarRef}
        className={`fixed z-50 select-none ${isDragging ? '' : 'transition-all duration-500 ease-in-out'}`}
        style={{
          left: `${isExpanded ? expandedToolbarPosition.x : position.x}px`,
          top: `${isExpanded ? expandedToolbarPosition.y : position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)', // Slight scale during animation for visual feedback
          willChange: isDragging ? 'transform' : 'auto', // Optimize for dragging performance
        }}
        onMouseDown={!isAnimating ? handleMouseDown : undefined}
      >
        <div className="bg-primary/10 rounded-full shadow-lg border border-primary/20 p-2 flex flex-col items-center gap-2 w-16 transition-all duration-300 ease-in-out">
          {/* 3x3 dots draggable handle at the top */}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 p-0 hover:bg-primary/20 rounded-full transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5 text-gray-600" />
          </Button>
  
          
  
          {/* Upload/Import button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 p-0 bg-white hover:bg-primary/10 border border-gray-300 hover:border-primary/40 rounded-lg transition-all duration-200 shadow-sm"
            onClick={handleFileUpload}
          >
            <Upload className="w-5 h-5 text-gray-700" />
          </Button>

          {/* Recording button - Mic when not recording, Stop when recording */}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 p-0 bg-white hover:bg-primary/10 border border-gray-300 hover:border-primary/40 rounded-lg transition-all duration-200 shadow-sm"
            onClick={handleRecordingToggle}
          >
            {isRecording ? (
              <Square className="w-5 h-5 text-red-500 fill-red-500" />
            ) : (
              <Mic className="w-5 h-5 text-gray-700" />
            )}
          </Button>

          {/* Pause/Resume button - only active when recording */}
          <Button
            variant="ghost"
            size="icon"
            className={`w-10 h-10 p-0 bg-white border border-gray-300 rounded-lg transition-all duration-200 shadow-sm ${
              !isRecording
                ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-gray-300'
                : 'hover:bg-primary/10 hover:border-primary/40'
            }`}
            onClick={handlePauseToggle}
            disabled={!isRecording}
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-green-600" />
            ) : (
              <Pause className="w-5 h-5 text-gray-700" />
            )}
          </Button>

          {/* Expand/Collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 p-0 bg-white hover:bg-primary/10 border border-gray-300 hover:border-primary/40 rounded-lg transition-all duration-200 shadow-sm"
            onClick={handleExpandToggle}
            disabled={isAnimating}
          >
            <div className={`transition-all duration-300 ease-in-out ${isAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}`}>
              {isExpanded ? (
                <Minimize2 className="w-5 h-5 text-gray-700" />
              ) : (
                <Expand className="w-5 h-5 text-gray-700" />
              )}
            </div>
          </Button>

          {/* Recording timer - shows only when recording */}
          {isRecording && (
            <div className={`text-xs font-mono mt-1 px-2 py-1 rounded-lg border transition-colors shadow-sm ${
              isPaused
                ? 'text-orange-700 bg-orange-50 border-orange-300'
                : 'text-red-700 bg-red-50 border-red-300'
            }`}>
              {formatTime(recordingTime)}
              {isPaused && (
                <div className="text-[10px] text-orange-600 mt-0.5 font-semibold">PAUSED</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}