import { useState, useEffect } from "react";
import { PatientListSidebar } from "./PatientListSidebar";
import { PanelRightClose } from "lucide-react";
import { MedicalRecordView } from "./MedicalRecordView";
import { AudioTranscriptPanel } from "./AudioTranscriptPanel";
import { getDictation } from "../services/getDictation_ExecStoredProcedure";
import { getSoapNotes } from "../services/getSoapNotes_ExecStoredProcedure";
import { useAudioResponseStore } from "../services/audioUploadApi";

interface MedicalInterfaceProps {
  liveTranscription?: string;
}

export function MedicalInterface({ liveTranscription = "" }: MedicalInterfaceProps) {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [dictation, setDictation] = useState<any>(null);
  const [soapNotes, setSoapNotes] = useState<any>(null);
  const [refreshList, setRefreshList] = useState(false);

  // Get store data
  const { response, reset } = useAudioResponseStore();

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPatient) {
        // Clear store data when selecting a different patient
        reset();
        
        setDictation(null);
        setSoapNotes(null);

        const dictationData = await getDictation(selectedPatient.RECORDING_ID);
        if (dictationData) {
          setDictation(dictationData);
        }

        const soapNotesData = await getSoapNotes(selectedPatient.RECORDING_ID);
        if (soapNotesData) {
          setSoapNotes(soapNotesData);
        }
      }
    };

    fetchData();
  }, [selectedPatient, reset]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  return (
    <div className="h-screen w-fit flex flex-col overflow-hidden rounded-2xl">
      <div className="h-14 px-2 flex items-center justify-between rounded-t-xl bg-[#63003C] flex-shrink-0">
        <div className="flex items-center rounded-t-xl">
          <img src="/eva-scribe-logo.png" alt="logo" className="w-30 h-10 rounded-t-xl" />
        </div>
      </div>
      <div className="flex col-3 bg-[#63003C] gap-1.5 px-3 py-2 flex-grow overflow-hidden">
        <PatientListSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onSelectPatient={setSelectedPatient}
          selectedPatient={selectedPatient}
          refreshList={refreshList}
          setRefreshList={setRefreshList}
        />

        <MedicalRecordView
          selectedPatient={selectedPatient}
          soapNotes={soapNotes}
          setSoapNotes={setSoapNotes}
          setRefreshList={setRefreshList}
        />

        <AudioTranscriptPanel
          dictation={dictation}
          selectedPatient={selectedPatient}
          isCollapsed={isRightPanelCollapsed}
          onToggleCollapse={toggleRightPanel}
          liveTranscription={liveTranscription}
        />
      </div>
    </div>
  );
}