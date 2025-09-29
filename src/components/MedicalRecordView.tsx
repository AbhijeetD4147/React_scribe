import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, ChevronLeftIcon, FileTextIcon, Send, SearchIcon, CheckCircle2, Files, FileDown, AlertCircle, Mic } from "lucide-react";
import { sendSoapNoteToMaximeyes } from "../services/sendSoapNotesToMaximeyes";
import { Input } from "@/components/ui/input";
import { useMemo, useState, useRef, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "@/components/ui/sonner";
import { updateFinalizeStatus } from "../services/updateFinalizeStatus";
import { useAudioResponseStore } from "../services/audioUploadApi";

interface MedicalRecordViewProps {
  soapNotes: any;
  selectedPatient: any;
  onStatusChange?: () => void;
  setSoapNotes?: React.Dispatch<any>;
  setRefreshList?: React.Dispatch<React.SetStateAction<boolean>>;
}

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const NoteRenderer = ({ data, searchTerm }: { data: any, searchTerm: string }) => {
  if (data === null || data === undefined || data === "None" || data === "") {
    return <span className="text-gray-500 italic">N/A</span>;
  }

  if (typeof data === 'string') {
    return <span className="text-base text-black">{highlightText(data, searchTerm)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <ol className="list-decimal list-outside ml-4 space-y-1">
        {data.map((item, index) => (
          <li key={index} className="text-base text-black">
            <NoteRenderer data={item} searchTerm={searchTerm} />
          </li>
        ))}
      </ol>
    );
  }

  if (typeof data === 'object') {
    // Check if this object has direct OD and OS properties (Anterior Segment style)
    const hasDirectODOS = data.hasOwnProperty('OD') && data.hasOwnProperty('OS');
    
    // Check if this object has properties ending with "OD" or "OS" (Posterior Segment style)
    const odosKeys = Object.keys(data).filter(key => 
      key.endsWith(' OD') || key.endsWith(' OS') || key === 'OD' || key === 'OS'
    );
    
    const hasIndirectODOS = odosKeys.length > 0;
    
    if (hasDirectODOS) {
      // Handle Anterior Segment style (direct OD/OS structure)
      const sections: any = {};
      
      // Process OD data
      if (data.OD && typeof data.OD === 'object') {
        Object.entries(data.OD).forEach(([key, value]) => {
          if (!sections[key]) {
            sections[key] = { OD: '', OS: '' };
          }
          sections[key].OD = value;
        });
      }
      
      // Process OS data
      if (data.OS && typeof data.OS === 'object') {
        Object.entries(data.OS).forEach(([key, value]) => {
          if (!sections[key]) {
            sections[key] = { OD: '', OS: '' };
          }
          sections[key].OS = value;
        });
      }
      
      // Handle other properties that aren't OD/OS
      const otherProps = Object.entries(data).filter(([key]) => key !== 'OD' && key !== 'OS');
      
      return (
        <div className="space-y-4">
          {/* Render OD/OS table */}
          {Object.keys(sections).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Section</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">OD</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">OS</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(sections).map(([sectionName, sectionData]: [string, any]) => (
                    <tr key={sectionName} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 font-medium">
                        {highlightText(sectionName, searchTerm)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {sectionData?.OD ? (
                          <NoteRenderer data={sectionData.OD} searchTerm={searchTerm} />
                        ) : (
                          <span className="text-gray-500 italic">N/A</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {sectionData?.OS ? (
                          <NoteRenderer data={sectionData.OS} searchTerm={searchTerm} />
                        ) : (
                          <span className="text-gray-500 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Render other properties normally */}
          {otherProps.length > 0 && (
            <div className="space-y-1">
              {otherProps.map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                return (
                  <div key={key} className="text-base text-black">
                    <span className="font-semibold">{highlightText(formattedKey, searchTerm)}: </span>
                    <NoteRenderer data={value} searchTerm={searchTerm} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } else if (hasIndirectODOS) {
      // Handle Posterior Segment style (properties ending with OD/OS)
      const sections: any = {};
      const otherProps: any = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (key.endsWith(' OD')) {
          const sectionName = key.replace(' OD', '');
          if (!sections[sectionName]) {
            sections[sectionName] = { OD: '', OS: '' };
          }
          sections[sectionName].OD = value;
        } else if (key.endsWith(' OS')) {
          const sectionName = key.replace(' OS', '');
          if (!sections[sectionName]) {
            sections[sectionName] = { OD: '', OS: '' };
          }
          sections[sectionName].OS = value;
        } else if (key === 'OD') {
          // Handle single OD property
          if (!sections['']) {
            sections[''] = { OD: '', OS: '' };
          }
          sections[''].OD = value;
        } else if (key === 'OS') {
          // Handle single OS property
          if (!sections['']) {
            sections[''] = { OD: '', OS: '' };
          }
          sections[''].OS = value;
        } else {
          otherProps[key] = value;
        }
      });
      
      return (
        <div className="space-y-4">
          {/* Render other properties first */}
          {Object.keys(otherProps).length > 0 && (
            <div className="space-y-1">
              {Object.entries(otherProps).map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                return (
                  <div key={key} className="text-base text-black">
                    <span className="font-semibold">{highlightText(formattedKey, searchTerm)}: </span>
                    <NoteRenderer data={value} searchTerm={searchTerm} />
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Render OD/OS table */}
          {Object.keys(sections).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Section</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">OD</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">OS</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(sections).map(([sectionName, sectionData]: [string, any]) => (
                    <tr key={sectionName || 'default'} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 font-medium">
                        {sectionName ? highlightText(sectionName, searchTerm) : 'General'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {sectionData?.OD ? (
                          <NoteRenderer data={sectionData.OD} searchTerm={searchTerm} />
                        ) : (
                          <span className="text-gray-500 italic">N/A</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {sectionData?.OS ? (
                          <NoteRenderer data={sectionData.OS} searchTerm={searchTerm} />
                        ) : (
                          <span className="text-gray-500 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // Regular object rendering for non-segment data
    return (
      <div className="space-y-1">
        {Object.entries(data).map(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

          return (
            <div key={key} className="text-base text-black">
              <span className="font-semibold">{highlightText(formattedKey, searchTerm)}: </span>
              <NoteRenderer data={value} searchTerm={searchTerm} />
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-base text-black">{String(data)}</span>;
};

export function MedicalRecordView({ soapNotes, selectedPatient, onStatusChange }: MedicalRecordViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get uploaded SOAP notes from store
  const { formattedSoapNotes, isLoading } = useAudioResponseStore();

  // Create a compatible format for uploaded notes
  const uploadedSoapForDisplay = useMemo(() => {
    if (!formattedSoapNotes) return null;

    // Convert the uploaded format to match the expected Table structure
    const tableData = JSON.stringify(formattedSoapNotes);

    return {
      Table: [{
        NOTES: tableData
      }]
    };
  }, [formattedSoapNotes]);

  // Prioritize uploaded notes over patient-selected notes
  const displaySoapNotes = uploadedSoapForDisplay || soapNotes;

  const notes = useMemo(() => {
    if (!displaySoapNotes?.Table?.[0]?.NOTES) {
      return null;
    }
    try {
      return JSON.parse(displaySoapNotes.Table[0].NOTES);
    } catch (error) {
      console.error("Failed to parse SOAP notes:", error);
      return displaySoapNotes.Table[0].NOTES; // Fallback to raw string
    }
  }, [displaySoapNotes]);

  useEffect(() => {
    if (selectedPatient) {
      setIsFinalized(selectedPatient.IS_FINALIZED);
    }
  }, [selectedPatient]);

  const handleCopy = () => {
    if (contentRef.current) {
      const textToCopy = contentRef.current.innerText;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          toast.success("Copied successfully!");
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          toast.error("Failed to copy.");
        });
    }
  };

  const convertNoteToString = (data: any): string => {
    if (data === null || data === undefined || data === "None") {
      return "";
    }
    if (typeof data === 'string') {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map(item => convertNoteToString(item)).join('\n');
    }
    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `${key.replace(/\s/g, '').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: ${convertNoteToString(value)}`)
        .join('\n');
    }
    return '';
  };

  const handleSectionCopy = (sectionTitle: string, noteData: any) => {
    const noteString = convertNoteToString(noteData);
    const textToCopy = `${sectionTitle}\n${noteString}`;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy.trim())
        .then(() => {
          toast.success("Note section copied successfully!");
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          toast.error("Failed to copy section.");
        });
    }
  };

  const handleDownload = () => {
    if (contentRef.current) {
      html2canvas(contentRef.current).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('soap-notes.pdf');
      });
    }
  };

  const convertNoteForAPI = (data: any): any => {
    if (data === null || data === undefined || data === "None" || data === "") {
      return "";
    }

    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'object' && item !== null) {
          // Convert object to formatted string
          return Object.entries(item)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' ');
        }
        return String(item);
      });
    }

    if (typeof data === 'object') {
      // Convert object to formatted string
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${convertNoteForAPI(value)}`)
        .join(' ');
    }

    return String(data);
  };

  const handleSendToMaximeyes = async (note: any) => {
    if (!selectedPatient?.EXAM_NUMBER) {
      toast.error("Encounter ID is missing.");
      return;
    }

    const noteData = {
      elementName: note.elementName,
      note: convertNoteForAPI(note.note)
    };

    try {
      const response = await sendSoapNoteToMaximeyes(selectedPatient.ENCOUNTER_ID, noteData);
      if (response.status === true) {
        toast.success("SOAP note sent to Maximeyes successfully!");
      } else {
        toast.error("Failed to send SOAP note to Maximeyes.");
      }
    } catch (error) {
      toast.error("An error occurred while sending the SOAP note.");
      console.error(error);
    }
  };

  return (
    <div className="flex-1 bg-[#F2F1ED] flex flex-col h-full relative rounded-sm">
      {/* Header */}
      <div className="h-[88px] px-4 flex flex-col justify-center border-b border-plum-600">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-md font-bold text-gray-800">{selectedPatient?.PATIENT_NAME}</h2>
              <span className="text-sm text-gray-600">{selectedPatient ? new Date(selectedPatient.DOB).toLocaleDateString() : ''}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              <span>Pt ID: {selectedPatient?.PATIENT_ID}</span> | <span>Enc ID: {selectedPatient?.ENCOUNTER_ID}</span> | <span>Prov: {selectedPatient?.PROVIDER_NAME}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isFinalized ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={handleCopy}>
                        <Files className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy All Notes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={handleDownload}>
                        <FileDown className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download as PDF</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes}>
                        <Send className="w-6 h-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send to MaximEyes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="relative w-[80px]">
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 bg-[#F2F1ED]" />
                  <Input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 pr-1 py-1 h-8 text-sm border border-plum-600 rounded-sm bg-[#F2F1ED]"
                  />

                </div>
                <Button
                  size="sm"
                  className="h-8 bg-green-600 hover:bg-green-700 rounded-sm text-md"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  Finalized
                </Button>
              </>
            ) : (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={handleCopy}>
                        <Files className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy All Notes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={handleDownload}>
                        <FileDown className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download as PDF</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="relative w-[80px]">
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 bg-[#F2F1ED]" />
                  <Input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 pr-1 py-1 h-8 text-sm border border-plum-600 rounded-sm bg-[#F2F1ED]"
                  />

                </div>
                <Button
                  size="sm"
                  className="h-8 bg-blue-700 hover:bg-blue-800 rounded-sm text-md"
                  onClick={async () => {
                    if (selectedPatient) {
                      const success = await updateFinalizeStatus(selectedPatient.RECORDING_ID, true);
                      if (success) {
                        setIsFinalized(true);
                        onStatusChange?.();
                        toast.success("Status updated to Finalized!");
                      } else {
                        toast.error("Failed to update status.");
                      }
                    }
                  }}
                >
                  <AlertCircle className="w-5 h-5 " />
                  Finalize?
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Content */}
      <ScrollArea className="flex-1 h-0">
        <button
          onClick={(e) => {
            const panel = document.querySelector('.audio-transcript-panel');
            if (panel) {
              const isCollapsed = panel.classList.contains('w-0');
              panel.classList.toggle('w-0', !isCollapsed);
              panel.classList.toggle('w-[350px]', isCollapsed);
              e.currentTarget.innerHTML = isCollapsed ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>';
            }
          }}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-12 bg-plum-500 text-white rounded-r-full flex items-center justify-center z-10"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <div className="p-6 space-y-3" ref={contentRef}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <h2 className="text-xl font-bold text-center">Generating SOAP Notes</h2>
                    <p className="text-center mt-2">
                      It will take couple of seconds to generate SOAP Notes.<br />
                      Either you can wait or jump straight into new recording.
                    </p>
                  </div>
          ) : !displaySoapNotes ? (
            <div className="p-4 text-center">
              Loading...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Roles Section */}
              {notes?.roles && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-black">Roles</h2>
                  </div>
                  <div className="p-2">
                    <NoteRenderer data={notes.roles} searchTerm={searchTerm} />
                  </div>
                </div>
              )}

              {/* Subjective Section */}
              {notes?.Subjective && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-black">Subjective</h2>
                  </div>
                  {notes.Subjective.map((item: any, index: number) => (
                    <div key={index} className="mb-2 p-2">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-base text-black">{item.elementName}</h3>
                        <div className="flex items-center gap-1">
                          {!isFinalized ? (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSectionCopy(item.elementName, item.note)}>
                                      <Files className="w-5 h-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy Note</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                      <Mic className="w-5 h-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Record Audio</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes(item)}>
                                    <Send className="w-6 h-6" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send to MaximEyes</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <NoteRenderer data={item.note} searchTerm={searchTerm} />
                    </div>
                  ))}
                </div>
              )}

              {/* Objective Section */}
              {notes?.Objective && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-black">Objective</h2>
                  </div>
                  {notes.Objective.map((item: any, index: number) => (
                    <div key={index} className="mb-2 p-2">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-base text-black">{item.elementName}</h3>
                        <div className="flex items-center gap-1">
                          {!isFinalized ? (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSectionCopy(item.elementName, item.note)}>
                                      <Files className="w-5 h-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy Note</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                      <Mic className="w-5 h-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Record Audio</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes(item)}>
                                    <Send className="w-6 h-6" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send to MaximEyes</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <NoteRenderer data={item.note} searchTerm={searchTerm} />
                    </div>
                  ))}
                </div>
              )}

              {/* Assessment Section */}
              {notes?.Assessment && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-black">Assessment</h2>
                    <div className="flex items-center gap-1">
                      {!isFinalized ? (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSectionCopy("Assessment", notes.Assessment.map((i: any) => i.note))}>
                                  <Files className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Assessment</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                  <Mic className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Record Audio</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes({ elementName: 'Assessment', note: notes.Assessment.map((i: any) => i.note) })}>
                                <Send className="w-6 h-6" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send to MaximEyes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="p-2">
                    {notes.Assessment.map((item: any, index: number) => (
                      <div key={index} className="mb-2">
                        <NoteRenderer data={item.note} searchTerm={searchTerm} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan Section */}
              {notes?.Plan && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-black">Plan</h2>
                    <div className="flex items-center gap-1">
                      {!isFinalized ? (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSectionCopy("Plan", notes.Plan.map((i: any) => i.note))}>
                                  <Files className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Plan</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                  <Mic className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Record Audio</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes({ elementName: 'Plan', note: notes.Plan.map((i: any) => i.note) })}>
                                <Send className="w-6 h-6" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send to MaximEyes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="p-2">
                    {notes.Plan.map((item: any, index: number) => (
                      <div key={index} className="mb-2">
                        <NoteRenderer data={item.note} searchTerm={searchTerm} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescribed Medicines Section */}
              {notes?.Prescribed_Medicines && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-black">Prescribed Medicines</h2>
                    <div className="flex items-center gap-1">
                      {!isFinalized ? (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSectionCopy("Prescribed Medicines", notes.Prescribed_Medicines.map((i: any) => i.note))}>
                                  <Files className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Prescribed Medicines</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                  <Mic className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Record Audio</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes({ elementName: 'Prescribed_Medicines', note: notes.Prescribed_Medicines.map((i: any) => i.note) })}>
                                <Send className="w-6 h-6" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send to MaximEyes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  {notes.Prescribed_Medicines.map((item: any, index: number) => (
                    <div key={index} className="mb-2 p-2">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg text-black">{item.elementName}</h3>
                        <div className="flex items-center gap-1">
                          {isFinalized && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes(item)}>
                                    <Send className="w-6 h-6 text-white fill-plum-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send to MaximEyes</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <NoteRenderer data={item.note} searchTerm={searchTerm} />
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested Tests Section */}
              {notes?.Suggested_Tests && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-black">Suggested Tests</h2>
                    <div className="flex items-center gap-1">
                      {!isFinalized ? (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSectionCopy("Suggested Tests", notes.Suggested_Tests.map((i: any) => i.note))}>
                                  <Files className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Suggested Tests</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                  <Mic className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Record Audio</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes({ elementName: 'Suggested_Tests', note: notes.Suggested_Tests.map((i: any) => i.note) })}>
                                <Send className="w-6 h-6" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send to MaximEyes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  {notes.Suggested_Tests.map((item: any, index: number) => (
                    <div key={index} className="mb-2 p-2">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg text-black">{item.elementName}</h3>
                        <div className="flex items-center gap-1">
                          {isFinalized && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => handleSendToMaximeyes(item)}>
                                    <Send className="w-6 h-6" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send to MaximEyes</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <NoteRenderer data={item.note} searchTerm={searchTerm} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea >
    </div >
  );
}