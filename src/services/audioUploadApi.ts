import axios from 'axios';


export const uploadAudioFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Using the proxied endpoint to avoid CORS issues
    const response = await fetch('/audio-api/process_audio_upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
    // const response = await axios.post(
    //   'https://aiscribeqa.maximeyes.com:5002/audio-api/process_audio_upload',
    //   formData,
    //   {
    //     headers: {
    //       'Content-Type': 'multipart/form-data'
    //     }
    //   }
    // );
    
    // return response.data;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
};