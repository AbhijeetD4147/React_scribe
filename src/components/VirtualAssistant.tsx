import React, { useState, useEffect } from 'react';
import { Calendar, Menu, CheckCircle, AlertCircle, Search, Folder, Paperclip, Send, Check, Play, Pause, Volume2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPatientList} from '../services/getPatientList_ExecStoredProcedure';
import { getDictation } from '../services/getDictation_ExecStoredProcedure';
import { getSoapNotes } from '../services/getSoapNotes_ExecStoredProcedure';
const VirtualAssistant: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<any>(null);
  const [dictation, setDictation] = useState<any>(null);
  const [soapNotes, setSoapNotes] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [consent, setConsent] = useState(true);
  const [isRightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

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

  const togglePlay = () => setIsPlaying(!isPlaying);
  const progressPercentage = (currentTime / (dictation?.durationSec || 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
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
                {isLoading ? (
                  <p>Loading...</p>
                ) : (
                  soapNotes &&
                  soapNotes.Table.map((note: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <Send className="w-4 h-4 mt-1 flex-shrink-0 text-plum-500 -rotate-45" />
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-800">{note.ELEMENT_NAME}:</span> {note.NOTE}
                      </p>
                    </div>
                  ))
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
                ) : (
                  dictation &&
                  dictation.Table1.map((paragraph: any, index: number) => (
                    <p key={index} className="text-sm text-gray-700">
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
};

export default VirtualAssistant;