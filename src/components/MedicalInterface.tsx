import { useState, useEffect } from "react";
import { PatientListSidebar } from "./PatientListSidebar";
import { PanelRightClose } from "lucide-react";
import { MedicalRecordView } from "./MedicalRecordView";
import { AudioTranscriptPanel } from "./AudioTranscriptPanel";
import { getDictation } from "../services/getDictation_ExecStoredProcedure";
import { getSoapNotes } from "../services/getSoapNotes_ExecStoredProcedure";

export function MedicalInterface() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [dictation, setDictation] = useState<any>(null);
  const [soapNotes, setSoapNotes] = useState<any>(null);
  const [refreshList, setRefreshList] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPatient) {
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
  }, [selectedPatient]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden border-x-[12px] border-b-[12px] border-t-[24px] border-plum-900 rounded-2xl">
      <div className="h-12 px-6 flex items-center justify-between bg-plum-900">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base text-white">evaa</span>
          <span className="font-semibold text-base text-white">SCRIBE</span>
        </div>
      </div>
      <div className="flex flex-1 bg-plum-900 gap-2 p-2 rounded-b-lg">
        <PatientListSidebar
          selectedPatient={selectedPatient}
          onPatientSelect={setSelectedPatient}
          onToggleCollapse={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
          refreshList={refreshList}
        />
        <MedicalRecordView
          soapNotes={soapNotes}
          selectedPatient={selectedPatient}
          onStatusChange={() => setRefreshList(prev => !prev)}
        />
        <AudioTranscriptPanel
          dictation={dictation}
          selectedPatient={selectedPatient}
          isCollapsed={isRightPanelCollapsed}
          onToggleCollapse={toggleRightPanel}
        />
      </div>
    </div>
  );
}