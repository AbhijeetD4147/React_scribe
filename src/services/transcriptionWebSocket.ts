// WebSocket service for real-time transcription
let socket: WebSocket | null = null;
let audioContext: AudioContext | null = null;
let processor: ScriptProcessorNode | null = null;
let input: MediaStreamAudioSourceNode | null = null;
let stream: MediaStream | null = null;

type TranscriptionCallback = (text: string) => void;
let transcriptionCallback: TranscriptionCallback | null = null;

export const startTranscription = async (onTranscriptionUpdate: TranscriptionCallback): Promise<boolean> => {
  try {
    // Close any existing connection
    if (socket && socket.readyState === WebSocket.OPEN) {
      stopTranscription();
    }

    // Set callback
    transcriptionCallback = onTranscriptionUpdate;

    // Connect to WebSocket using the proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    socket = new WebSocket(`${protocol}//${host}/transcription-ws/ws`);
    socket.binaryType = 'arraybuffer';

    // Handle incoming messages
    socket.onmessage = (event) => {
      if (transcriptionCallback) {
        transcriptionCallback(event.data);
      }
    };

    // Set up audio processing when WebSocket is open
    return new Promise((resolve, reject) => {
      socket!.onopen = async () => {
        try {
          // Get microphone access
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Create audio context with 16kHz sample rate
          audioContext = new AudioContext({ sampleRate: 16000 });
          
          // Create audio source from microphone
          input = audioContext.createMediaStreamSource(stream);
          
          // Create script processor for audio processing
          processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          // Connect audio nodes
          input.connect(processor);
          processor.connect(audioContext.destination);
          
          // Process audio data
          processor.onaudioprocess = (e) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const buffer = new ArrayBuffer(inputData.length * 2);
              const output = new DataView(buffer);
              
              // Convert float audio data to 16-bit PCM
              for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                output.setInt16(i * 2, s * 0x7fff, true);
              }
              
              // Send audio data to WebSocket
              socket.send(buffer);
            }
          };
          
          resolve(true);
        } catch (error) {
          console.error('Error setting up audio:', error);
          reject(error);
        }
      };
      
      socket!.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Error starting transcription:', error);
    return false;
  }
};

export const stopTranscription = () => {
  // Disconnect and clean up audio processing
  if (processor) {
    processor.disconnect();
    processor = null;
  }
  
  if (input) {
    input.disconnect();
    input = null;
  }
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  // Close WebSocket
  if (socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    socket = null;
  }
  
  // Clear callback
  transcriptionCallback = null;
  
  return true;
};

export const isTranscribing = () => {
  return socket !== null && socket.readyState === WebSocket.OPEN;
};