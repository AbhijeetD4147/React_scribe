import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Calendar, Menu, CheckCircle, AlertCircle, Search, Folder, Paperclip, Send, Check, Play, Pause, Volume2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPatientList} from '../services/getPatientList_ExecStoredProcedure';
import { getDictation } from '../services/getDictation_ExecStoredProcedure';
import { getSoapNotes } from '../services/getSoapNotes_ExecStoredProcedure';

// Define the component props and ref interface
interface VirtualAssistantProps {
  updateWithApiResponse?: (response: any) => void;
}

// Define the ref interface
export interface VirtualAssistantRef {
  updateWithApiResponse: (response: any) => void;
}

// Define interfaces for SOAP note formats
interface ApiSoapNote {
  Subjective: Array<{
    elementName: string;
    note: any;
  }>;
  Objective: Array<{
    elementName: string;
    note: any;
  }>;
  Assessment: Array<{
    note: any;
  }>;
  Plan: Array<{
    note: any;
  }>;
}

interface FormattedSoapNote {
  Table: Array<{
    ELEMENT_NAME: string;
    NOTE: string;
  }>;
}

// Change the component to properly use forwardRef with correct types
const VirtualAssistant = forwardRef<VirtualAssistantRef, VirtualAssistantProps>((props, ref) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<any>(null);
  const [dictation, setDictation] = useState<any>(null);
  const [soapNotes, setSoapNotes] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSoapLoading, setIsSoapLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [consent, setConsent] = useState(true);
  const [isRightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  // Add a key to force re-rendering
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      const data = await getPatientList("2023-01-01", "2023-12-31");
      if (data && data.Table) {
        setPatients(data.Table);
        if (data.Table.length > 0) {
          setActivePatient(data.Table[0]);
        }
      }
      setIsLoading(false);
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (activePatient) {
      const fetchPatientDetails = async () => {
        setIsLoading(true);
        const dictationData = await getDictation(activePatient.RECORDING_ID);
        const soapNotesData = await getSoapNotes(activePatient.RECORDING_ID);
        setDictation(dictationData);
        setSoapNotes(soapNotesData);
        setIsLoading(false);
      };
      fetchPatientDetails();
    }
  }, [activePatient]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to format complex objects into readable text
  const formatComplexObject = (obj: any, depth = 0): string => {
    if (!obj || typeof obj !== 'object') {
      return String(obj || '');
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => formatComplexObject(item, depth + 1)).join(', ');
    }
    
    // Handle objects
    const entries = Object.entries(obj);
    if (entries.length === 0) return '';
    
    // For top-level objects, format more comprehensively
    if (depth === 0) {
      return entries
        .map(([key, value]) => {
          // Skip keys that are typically metadata or redundant
          if (['Code', 'Diagnosis'].includes(key) && depth > 0) return '';
          
          const formattedValue = formatComplexObject(value, depth + 1);
          if (!formattedValue) return '';
          
          // For nested objects, include the key
          return `${key}: ${formattedValue}`;
        })
        .filter(Boolean)
        .join('\n');
    }
    
    // For nested objects, format more concisely
    return entries
      .map(([key, value]) => {
        const formattedValue = formatComplexObject(value, depth + 1);
        if (!formattedValue) return '';
        
        // Special case for diagnosis entries
        if (key === 'Diagnosis' || key === 'Description') return formattedValue;
        if (key === 'Code') return `(${formattedValue})`;
        
        // For laterality fields, format differently
        if (key.includes('Laterality')) return `[${formattedValue}]`;
        
        // For notes fields, format with quotes
        if (key.includes('Notes')) return `"${formattedValue}"`;
        
        // For boolean values represented as strings
        if (formattedValue === 'True') return key;
        if (formattedValue === 'False') return '';
        
        // Default formatting
        return `${key}: ${formattedValue}`;
      })
      .filter(Boolean)
      .join(', ');
  };

  // Function to convert API SOAP notes format to the display format
  const convertSoapNotesFormat = (apiSoapNotes: ApiSoapNote): FormattedSoapNote => {
    const formattedNotes: FormattedSoapNote = {
      Table: []
    };

    // Process Subjective section
    if (apiSoapNotes.Subjective && apiSoapNotes.Subjective.length > 0) {
      let subjectiveNotes = '';
      
      // Process each element in the Subjective section
      apiSoapNotes.Subjective.forEach(item => {
        if (item.elementName === 'ChiefComplaint') {
          if (typeof item.note === 'string') {
            subjectiveNotes += `Chief Complaint: ${item.note}\n\n`;
          } else if (item.note?.Complaint) {
            subjectiveNotes += `Chief Complaint: ${item.note.Complaint}\n\n`;
          }
        } 
        else if (item.elementName === 'HPI') {
          if (typeof item.note === 'string') {
            subjectiveNotes += `History of Present Illness: ${item.note}\n\n`;
          } else if (item.note?.History) {
            subjectiveNotes += `History of Present Illness: ${item.note.History}\n\n`;
          }
        }
        else if (item.elementName === 'Current Eye Symptoms') {
          subjectiveNotes += `Current Eye Symptoms:\n`;
          
          if (item.note?.Physiologic) {
            subjectiveNotes += `- Physiologic: ${formatComplexObject(item.note.Physiologic)}\n`;
          }
          
          if (item.note?.['Visual Symptoms']) {
            subjectiveNotes += `- Visual Symptoms: ${formatComplexObject(item.note['Visual Symptoms'])}\n`;
          }
          
          subjectiveNotes += '\n';
        }
        else if (item.elementName === 'Eye Diseases') {
          subjectiveNotes += `Eye Diseases:\n${formatComplexObject(item.note)}\n\n`;
        }
        else if (item.elementName === 'Review Of Systems Brief' || item.elementName === 'Review Of Systems - Brief') {
          subjectiveNotes += `Review Of Systems: ${formatComplexObject(item.note)}\n\n`;
        }
        else if (item.elementName === 'Problems') {
          subjectiveNotes += `Problems:\n`;
          if (Array.isArray(item.note)) {
            item.note.forEach((problem, index) => {
              subjectiveNotes += `${index + 1}. ${problem.Description || ''} (${problem.Code || ''}) - ${problem.Status || ''}\n`;
            });
          } else {
            subjectiveNotes += formatComplexObject(item.note);
          }
          subjectiveNotes += '\n';
        }
        else {
          // Generic handling for other elements
          let noteText = '';
          if (typeof item.note === 'string') {
            noteText = item.note;
          } else if (typeof item.note === 'object') {
            noteText = formatComplexObject(item.note);
          }
          
          if (noteText) {
            subjectiveNotes += `${item.elementName}: ${noteText}\n\n`;
          }
        }
      });
      
      formattedNotes.Table.push({
        ELEMENT_NAME: "Subjective",
        NOTE: subjectiveNotes.trim()
      });
    }

    // Process Objective section
    if (apiSoapNotes.Objective && apiSoapNotes.Objective.length > 0) {
      let objectiveNotes = '';
      
      // Process each element in the Objective section
      apiSoapNotes.Objective.forEach(item => {
        if (item.elementName === 'Visual Acuity (VA)') {
          objectiveNotes += `Visual Acuity:\n`;
          if (item.note?.['With Correction']) {
            const va = item.note['With Correction'];
            objectiveNotes += `With Correction: `;
            if (va.OD) objectiveNotes += `OD ${va.OD} `;
            if (va.OS) objectiveNotes += `OS ${va.OS} `;
            if (va.OU) objectiveNotes += `OU ${va.OU}`;
            objectiveNotes += '\n\n';
          }
        }
        else if (item.elementName === 'Refraction') {
          objectiveNotes += `Refraction: ${typeof item.note === 'string' ? item.note : formatComplexObject(item.note)}\n\n`;
        }
        else if (item.elementName === 'Anterior Segment') {
          objectiveNotes += `Anterior Segment:\n`;
          
          if (item.note?.OD) {
            objectiveNotes += `OD (Right Eye):\n`;
            Object.entries(item.note.OD).forEach(([key, value]) => {
              objectiveNotes += `- ${key}: ${value}\n`;
            });
            objectiveNotes += '\n';
          }
          
          if (item.note?.OS) {
            objectiveNotes += `OS (Left Eye):\n`;
            Object.entries(item.note.OS).forEach(([key, value]) => {
              objectiveNotes += `- ${key}: ${value}\n`;
            });
            objectiveNotes += '\n';
          }
        }
        else if (item.elementName === 'Posterior Segment') {
          objectiveNotes += `Posterior Segment:\n`;
          
          if (item.note?.Methods) {
            objectiveNotes += `Methods: ${Array.isArray(item.note.Methods) ? item.note.Methods.join(', ') : item.note.Methods}\n\n`;
          }
          
          if (item.note?.Vitreous) {
            objectiveNotes += `Vitreous:\n`;
            if (item.note.Vitreous.OD) objectiveNotes += `- OD: ${item.note.Vitreous.OD}\n`;
            if (item.note.Vitreous.OS) objectiveNotes += `- OS: ${item.note.Vitreous.OS}\n`;
            objectiveNotes += '\n';
          }
          
          if (item.note?.['Optic Nerve OD']) {
            objectiveNotes += `Optic Nerve OD: ${formatComplexObject(item.note['Optic Nerve OD'])}\n`;
          }
          
          if (item.note?.['Optic Nerve OS']) {
            objectiveNotes += `Optic Nerve OS: ${formatComplexObject(item.note['Optic Nerve OS'])}\n`;
          }
          
          if (item.note?.['Retina OD']) {
            objectiveNotes += `Retina OD:\n`;
            Object.entries(item.note['Retina OD']).forEach(([key, value]) => {
              objectiveNotes += `- ${key}: ${value}\n`;
            });
          }
          
          if (item.note?.['Retina OS']) {
            objectiveNotes += `Retina OS:\n`;
            Object.entries(item.note['Retina OS']).forEach(([key, value]) => {
              objectiveNotes += `- ${key}: ${value}\n`;
            });
          }
          
          objectiveNotes += '\n';
        }
        else {
          // Generic handling for other elements
          let noteText = '';
          if (typeof item.note === 'string') {
            noteText = item.note;
          } else if (typeof item.note === 'object') {
            noteText = formatComplexObject(item.note);
          }
          
          if (noteText) {
            objectiveNotes += `${item.elementName}: ${noteText}\n\n`;
          }
        }
      });
      
      formattedNotes.Table.push({
        ELEMENT_NAME: "Objective",
        NOTE: objectiveNotes.trim()
      });
    }

    // Process Assessment section
    if (apiSoapNotes.Assessment && apiSoapNotes.Assessment.length > 0) {
      const assessmentNote = apiSoapNotes.Assessment[0];
      let assessmentText = '';
      
      // Add the assessment narrative if available
      if (assessmentNote.note?.Assessment) {
        assessmentText += `${assessmentNote.note.Assessment}\n\n`;
      }
      
      // Add differential diagnoses if available
      if (assessmentNote.note?.['Differential Diagnosis'] && Array.isArray(assessmentNote.note['Differential Diagnosis'])) {
        assessmentText += 'Differential Diagnosis:\n';
        assessmentNote.note['Differential Diagnosis'].forEach((diagnosis, index) => {
          assessmentText += `${index + 1}. ${diagnosis.Diagnosis} (${diagnosis.Code})\n`;
        });
      }
      
      formattedNotes.Table.push({
        ELEMENT_NAME: "Assessment",
        NOTE: assessmentText.trim()
      });
    }

    // Process Plan section
    if (apiSoapNotes.Plan && apiSoapNotes.Plan.length > 0) {
      const planNote = apiSoapNotes.Plan[0];
      let planText = '';
      
      if (planNote.note?.Plan && Array.isArray(planNote.note.Plan)) {
        planNote.note.Plan.forEach((item, index) => {
          planText += `${index + 1}. ${item}\n`;
        });
      } else if (typeof planNote.note === 'object') {
        planText = formatComplexObject(planNote.note);
      }
      
      // Add recall information if available
      if (planNote.note?.['Recall In']) {
        planText += `\nRecall in: ${planNote.note['Recall In']}`;
      }
      
      formattedNotes.Table.push({
        ELEMENT_NAME: "Plan",
        NOTE: planText.trim()
      });
    }

    return formattedNotes;
  };

  // Expose the updateWithApiResponse method to parent components
  useImperativeHandle(ref, () => ({
    updateWithApiResponse: (response: any) => {
      console.log("updateWithApiResponse called with:", response);
      
      // Update the transcript if available
      if (response && (response.transcript || response.text)) {
        const newTranscript = response.transcript || response.text;
        console.log("Setting transcript:", newTranscript);
        setTranscript(newTranscript);
      }
      
      // Set SOAP notes loading state
      setIsSoapLoading(true);
      
      // Process SOAP notes if they exist in the response
      if (response && response.soap_note) {
        try {
          console.log("Processing soap_note from API response:", response.soap_note);
          // Convert the API format to the display format
          const formattedSoapNotes = convertSoapNotesFormat(response.soap_note);
          console.log("Formatted SOAP notes:", formattedSoapNotes);
          
          // Create a completely new object to force React to detect the change
          const newSoapNotes = {
            Table: formattedSoapNotes.Table.map(note => ({
              ELEMENT_NAME: note.ELEMENT_NAME,
              NOTE: note.NOTE
            }))
          };
          
          console.log("Setting new SOAP notes:", newSoapNotes);
          setSoapNotes(newSoapNotes);
          
          // Force a re-render by incrementing the key
          setUpdateKey(prev => prev + 1);
        } catch (error) {
          console.error("Error processing SOAP notes:", error);
        } finally {
          setIsSoapLoading(false);
        }
      } else if (response && response.soapNotes) {
        try {
          // Parse the SOAP notes if they're a string
          const soapData = typeof response.soapNotes === 'string' 
            ? JSON.parse(response.soapNotes) 
            : response.soapNotes;
          
          // Convert the API format to the display format
          const formattedSoapNotes = convertSoapNotesFormat(soapData);
          
          // Create a completely new object to force React to detect the change
          const newSoapNotes = {
            Table: formattedSoapNotes.Table.map(note => ({
              ELEMENT_NAME: note.ELEMENT_NAME,
              NOTE: note.NOTE
            }))
          };
          
          console.log("Setting new SOAP notes:", newSoapNotes);
          setSoapNotes(newSoapNotes);
          
          // Force a re-render by incrementing the key
          setUpdateKey(prev => prev + 1);
        } catch (error) {
          console.error("Error processing SOAP notes:", error);
        } finally {
          setIsSoapLoading(false);
        }
      } else {
        setIsSoapLoading(false);
      }
    }
  }));

  const togglePlay = () => setIsPlaying(!isPlaying);
  const progressPercentage = (currentTime / (dictation?.durationSec || 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center" key={updateKey}>
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl border-x-[12px] border-b-[12px] border-t-[24px] border-plum-900 shadow-lg">
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="h-12 px-6 flex items-center justify-between bg-plum-900">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-base text-white">evaa</span>
              <span className="font-semibold text-base text-white">SCRIBE</span>
            </div>
          </div>
          <div className="flex bg-plum-900 gap-2 p-2 rounded-b-lg">
            {/* Left Pane */}
            <div className="w-[280px] bg-gray-50 p-4 rounded-lg border-r border-plum-600">
              <div className="flex items-center justify-between p-2 mb-4 rounded-lg border border-plum-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium">10/12/1998 – 10/24</span>
                </div>
                <Menu className="w-4 h-4 text-gray-500" />
              </div>
              <div className="space-y-2">
                {patients.map((patient, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${activePatient?.RECORDING_ID === patient.RECORDING_ID ? 'bg-white shadow-md' : 'hover:bg-white/60'}`}
                    style={{ borderLeft: activePatient?.RECORDING_ID === patient.RECORDING_ID ? '4px solid #9D4EDD' : '4px solid transparent' }}
                    onClick={() => setActivePatient(patient)}
                  >
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{patient.PATIENT_NAME}</div>
                      <div className="text-xs text-gray-500">{new Date(patient.PATIENT_DOB).toLocaleDateString()}</div>
                    </div>
                    {patient.IS_FINALIZE ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-orange-400" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Pane */}
            <div className="flex-1 bg-white p-4 relative rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base font-bold text-gray-800">{activePatient?.PATIENT_NAME}</h2>
                    <span className="text-sm text-gray-500">{activePatient ? new Date(activePatient.PATIENT_DOB).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Pt ID: {activePatient?.PATIENT_ID}</span> | <span>Enc ID: {activePatient?.ENCOUNTER_ID}</span> | <span>Prov: {activePatient?.PROVIDER_NAME}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-500" />
                  <Folder className="w-5 h-5 text-gray-500" />
                  <Paperclip className="w-5 h-5 text-gray-500" />
                  <Send className="w-5 h-5 text-gray-500" />
                  {activePatient?.IS_FINALIZE && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500">
                      <Check className="w-4 h-4 text-white" />
                      <span className="text-xs font-medium text-white">FINALIZED</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4 h-[calc(100vh-238px)] overflow-y-auto pr-2" style={{ height: 'calc(100vh - 88px)' }}>
                {isLoading || isSoapLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <h2 className="text-xl font-bold text-center">Generating SOAP Notes</h2>
                    <p className="text-center mt-2">
                      It will take couple of seconds to generate SOAP Notes.<br />
                      Either you can wait or jump straight into new recording.
                    </p>
                  </div>
                ) : (
                  soapNotes && soapNotes.Table && soapNotes.Table.length > 0 ? (
                    soapNotes.Table.map((note: any, index: number) => (
                      <div key={`note-${index}-${updateKey}`} className="flex items-start gap-3">
                        <Send className="w-4 h-4 mt-1 flex-shrink-0 text-plum-500 -rotate-45" />
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-800">{note.ELEMENT_NAME}:</span>
                          <div className="whitespace-pre-wrap mt-1">{note.NOTE}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">No SOAP notes available</div>
                  )
                )}
              </div>
              <button
                onClick={() => setRightSidebarCollapsed(!isRightSidebarCollapsed)}
                className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-12 bg-plum-500 text-white rounded-r-full flex items-center justify-center z-10"
              >
                {isRightSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>

            {/* Right Pane */}
            <div className={`transition-all duration-300 ease-in-out ${isRightSidebarCollapsed ? 'w-0' : 'w-[350px]'} bg-gray-50 flex flex-col rounded-lg overflow-hidden border-l border-plum-600`}>
              <div className="p-4 bg-plum-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-white">{dictation?.Table?.[0]?.DICTATION_NAME || 'Transcript'}</h3>
                  <span className="text-xs text-white">{dictation?.Table?.[0] ? new Date(dictation.Table[0].CREATED_DATE).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4 rounded" />
                  <label className="text-xs text-white">Patient Consent Received?</label>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    {isPlaying ? <Pause className="w-4 h-4 text-plum-500" /> : <Play className="w-4 h-4 ml-0.5 text-plum-500" />}
                  </button>
                  <span className="text-xs text-white">{formatTime(currentTime)} / {formatTime(dictation?.durationSec || 0)}</span>
                  <div className="flex-1 bg-white/30 rounded-full h-1.5">
                    <div className="bg-white h-full rounded-full" style={{ width: `${progressPercentage}%` }} />
                  </div>
                  <Volume2 className="w-4 h-4 text-white" />
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {isLoading ? (
                  <p>Loading...</p>
                ) : transcript ? (
                  <p key={`transcript-${updateKey}`} className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
                ) : (
                  dictation &&
                  dictation.Table1 &&
                  dictation.Table1.map((paragraph: any, index: number) => (
                    <p key={`dictation-${index}-${updateKey}`} className="text-sm text-gray-700">
                      {paragraph.TRANSCRIPTION}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VirtualAssistant;