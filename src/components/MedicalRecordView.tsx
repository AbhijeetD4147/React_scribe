import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, ChevronLeftIcon, FileTextIcon, SendHorizonal, SearchIcon, CheckCircle2, Files, FileDown, AlertCircle, Mic } from "lucide-react";
import { updateFinalizeStatus, sendSoapNoteToMaximeyes } from "@/services/api";
import { Input } from "@/components/ui/input";
import { useMemo, useState, useRef, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "@/components/ui/sonner";

interface MedicalRecordViewProps {
  soapNotes: any;
  selectedPatient: any;
  onStatusChange?: () => void;
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
  const notes = useMemo(() => {
    if (!soapNotes?.Table?.[0]?.NOTES) {
      return null;
    }
    try {
      return JSON.parse(soapNotes.Table[0].NOTES);
    } catch (error) {
      console.error("Failed to parse SOAP notes:", error);
      return soapNotes.Table[0].NOTES; // Fallback to raw string
    }
  }, [soapNotes]);

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
    <div className="flex-1 bg-white flex flex-col h-full relative rounded-lg" style={{ height: 'calc(100vh - 88px)' }}>
      {/* Header */}
      <div className="h-[88px] p-4 flex flex-col justify-center">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-gray-800">{selectedPatient?.PATIENT_NAME}</h2>
              <span className="text-sm text-gray-500">{selectedPatient ? new Date(selectedPatient.DOB).toLocaleDateString() : ''}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <span>Pt ID: {selectedPatient?.PATIENT_ID}</span> | <span>Enc ID: {selectedPatient?.ENCOUNTER_ID}</span> | <span>Prov: {selectedPatient?.PROVIDER_NAME}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search in notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2 py-1 h-8 text-sm"
              />
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
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
            {isFinalized ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-400">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">FINALIZED</span>
              </div>
            ) : (
              <Button
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700"
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
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalize
              </Button>
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
          {!soapNotes ? (
            <div className="p-4 text-center">Loading...</div>
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
                                    <SendHorizonal className="w-6 h-6" />
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
                                    <SendHorizonal className="w-6 h-6" />
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
                                <SendHorizonal className="w-6 h-6" />
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
                                <SendHorizonal className="w-6 h-6" />
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
                                <SendHorizonal className="w-6 h-6" />
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
                                    <SendHorizonal className="w-6 h-6" />
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
                                <SendHorizonal className="w-6 h-6" />
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
                                    <SendHorizonal className="w-6 h-6" />
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
      </ScrollArea>
    </div>
  );
}