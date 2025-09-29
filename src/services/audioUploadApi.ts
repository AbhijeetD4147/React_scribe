import { create } from 'zustand';

// Define the structure of the API response based on your format
export interface AudioUploadResponse {
  latency?: number;
  message?: string;
  transcript?: string;
  text?: string;
  soap_note?: any;
  error?: string;
}

// Define the store state
interface AudioResponseStore {
  response: AudioUploadResponse | null;
  formattedSoapNotes: any | null;
  audioFile: File | null;
  audioUrl: string | null;
  isLoading: boolean;
  error: string | null;
  setResponse: (response: AudioUploadResponse) => void;
  setFormattedSoapNotes: (notes: any) => void;
  setAudioFile: (file: File | null) => void;
  setAudioUrl: (url: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create a store to manage the API response data
export const useAudioResponseStore = create<AudioResponseStore>((set) => ({
  response: null,
  formattedSoapNotes: null,
  audioFile: null,
  audioUrl: null,
  isLoading: false,
  error: null,
  setResponse: (response) => set({ response }),
  setFormattedSoapNotes: (notes) => set({ formattedSoapNotes: notes }),
  setAudioFile: (file) => set({ audioFile: file }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    response: null, 
    formattedSoapNotes: null, 
    audioFile: null,
    audioUrl: null,
    error: null 
  }),
}));

// Function to convert complex nested objects to simple strings
const convertComplexNoteToString = (note: any): string => {
  if (typeof note === 'string') {
    return note;
  }
  
  if (typeof note === 'object' && note !== null) {
    // Handle specific cases based on the structure
    if (note.Complaint) {
      return note.Complaint;
    }
    if (note.History) {
      return note.History;
    }
    
    // Handle complex nested structures like Current Eye Symptoms
    if (note.Physiologic || note['Visual Symptoms']) {
      let result = '';
      
      if (note.Physiologic) {
        const physio = note.Physiologic;
        Object.keys(physio).forEach(key => {
          if (key.endsWith('Notes') && physio[key]) {
            result += physio[key] + ' ';
          }
        });
      }
      
      if (note['Visual Symptoms']) {
        const visual = note['Visual Symptoms'];
        Object.keys(visual).forEach(key => {
          if (key.endsWith('Notes') && visual[key]) {
            result += visual[key] + ' ';
          }
        });
      }
      
      return result.trim();
    }
    
    // Handle other object structures by extracting Notes fields
    let result = '';
    Object.keys(note).forEach(key => {
      if (key.endsWith('Notes') && note[key]) {
        result += note[key] + ' ';
      } else if (typeof note[key] === 'string' && !key.includes('Laterality') && !key.includes('Code')) {
        result += note[key] + ' ';
      }
    });
    
    return result.trim() || JSON.stringify(note);
  }
  
  return String(note);
};

// Function to convert uploaded SOAP format to patient API format
const convertToPatientApiFormat = (uploadedSoap: any) => {
  const converted = { ...uploadedSoap };
  
  // Convert Subjective section
  if (converted.Subjective) {
    converted.Subjective = converted.Subjective.map((item: any) => ({
      ...item,
      note: convertComplexNoteToString(item.note)
    }));
  }
  
  // Convert Objective section
  if (converted.Objective) {
    converted.Objective = converted.Objective.map((item: any) => {
      // Keep certain elements as objects (like Visual Acuity, Anterior Segment, Posterior Segment)
      if (item.elementName === 'Visual Acuity (VA)' || 
          item.elementName === 'Anterior Segment' || 
          item.elementName === 'Posterior Segment' ||
          item.elementName === 'Pachymetry') {
        return item; // Keep as is
      }
      
      return {
        ...item,
        note: convertComplexNoteToString(item.note)
      };
    });
  }
  
  // Assessment and Plan sections usually stay the same structure
  return converted;
};

// Function to upload audio file and process the response
export const uploadAudioFile = async (file: File) => {
  const store = useAudioResponseStore.getState();
  store.setIsLoading(true);
  store.setError(null);
  localStorage.setItem("fileUploading", "true");
  
  // Store the audio file and create URL for playback
  store.setAudioFile(file);
  const audioUrl = URL.createObjectURL(file);
  store.setAudioUrl(audioUrl);
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Using the proxied endpoint to avoid CORS issues
    const response = await fetch('/audio-api/process_audio_upload', {
      method: 'POST',
      body: formData,
    });
    
    const data: AudioUploadResponse = await response.json();
    
    // Store the response in our store
    store.setResponse(data);
    
    // Convert and format SOAP notes if they exist
    if (data.soap_note) {
      const convertedSoap = convertToPatientApiFormat(data.soap_note);
      store.setFormattedSoapNotes(convertedSoap);
    }
    
    store.setIsLoading(false);
    localStorage.removeItem("fileUploading");
    return data;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    store.setError(error instanceof Error ? error.message : 'Unknown error');
    store.setIsLoading(false);
    localStorage.removeItem("fileUploading");
    throw error;
  }
};