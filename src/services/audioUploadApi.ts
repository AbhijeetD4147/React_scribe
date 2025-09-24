import { create } from 'zustand';

// Define the structure of SOAP note sections
export interface ApiSoapNote {
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

// Define the structure of formatted SOAP notes for display
export interface FormattedSoapNote {
  Table: Array<{
    ELEMENT_NAME: string;
    NOTE: string;
    _id?: string;
  }>;
}

// Define the structure of the API response
export interface AudioUploadResponse {
  latency?: number;
  message?: string;
  transcript?: string;
  text?: string;
  soap_note?: ApiSoapNote;
  soapNotes?: ApiSoapNote | string;
  error?: string;
}

// Define the store state
interface AudioResponseStore {
  response: AudioUploadResponse | null;
  formattedSoapNotes: FormattedSoapNote | null;
  isLoading: boolean;
  error: string | null;
  setResponse: (response: AudioUploadResponse) => void;
  setFormattedSoapNotes: (notes: FormattedSoapNote) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create a store to manage the API response data
export const useAudioResponseStore = create<AudioResponseStore>((set) => ({
  response: null,
  formattedSoapNotes: null,
  isLoading: false,
  error: null,
  setResponse: (response) => set({ response }),
  setFormattedSoapNotes: (notes) => set({ formattedSoapNotes: notes }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ response: null, formattedSoapNotes: null, error: null }),
}));

// Helper function to format complex objects into readable text
export const formatComplexObject = (obj: any, depth = 0): string => {
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
export const convertSoapNotesFormat = (apiSoapNotes: ApiSoapNote): FormattedSoapNote => {
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
      NOTE: subjectiveNotes.trim(),
      _id: generateId()
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
      NOTE: objectiveNotes.trim(),
      _id: generateId()
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
      NOTE: assessmentText.trim(),
      _id: generateId()
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
      NOTE: planText.trim(),
      _id: generateId()
    });
  }

  return formattedNotes;
};

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Function to upload audio file and process the response
export const uploadAudioFile = async (file: File) => {
  const store = useAudioResponseStore.getState();
  store.setIsLoading(true);
  store.setError(null);
  localStorage.setItem("fileUploading", "true");
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Using the proxied endpoint to avoid CORS issues
    const response = await fetch('/audio-api/process_audio_upload', {
      method: 'POST',
      body: formData,
    });
    
    const data: AudioUploadResponse = await response.json();
    
    // Store the response in our model
    store.setResponse(data);
    
    // Process SOAP notes if they exist
    if (data.soap_note) {
      const formattedNotes = convertSoapNotesFormat(data.soap_note);
      store.setFormattedSoapNotes(formattedNotes);
    } else if (data.soapNotes) {
      // Parse the SOAP notes if they're a string
      const soapData = typeof data.soapNotes === 'string' 
        ? JSON.parse(data.soapNotes) 
        : data.soapNotes;
      
      const formattedNotes = convertSoapNotesFormat(soapData);
      store.setFormattedSoapNotes(formattedNotes);
    }
    
    store.setIsLoading(false);
    return data;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    store.setError(error instanceof Error ? error.message : 'Unknown error');
    store.setIsLoading(false);
    throw error;
  }
};