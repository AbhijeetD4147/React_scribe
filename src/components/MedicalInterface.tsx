import { useState } from "react";
import { PatientListSidebar } from "./PatientListSidebar";
import { MedicalRecordView } from "./MedicalRecordView";
import { AudioTranscriptPanel } from "./AudioTranscriptPanel";

export function MedicalInterface() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("1");

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <PatientListSidebar 
        selectedPatientId={selectedPatientId}
        onPatientSelect={setSelectedPatientId}
      />
      <MedicalRecordView />
      <AudioTranscriptPanel />
    </div>
  );
}