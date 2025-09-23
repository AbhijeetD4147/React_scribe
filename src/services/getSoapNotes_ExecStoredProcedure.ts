import { getAuthToken } from "./authenticate_api";

export const getSoapNotes = async (recordingId: number): Promise<any | null> => {
  const token = await getAuthToken();
  if (!token) {
    console.error("Authentication failed.");
    return null;
  }

  const url = "/api/common/ExecStoredProcedure";
  const body = {
    ProcedureName: "AIS_GET_SOAP_NOTES",
    Parameters: [
      {
        name: "RECORDING_ID",
        value: recordingId,
        dbType: "Int32",
      },
      {
        name: "SOAP_ID",
        value: 0,
        dbType: "Int32",
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiKey: `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Fetching SOAP notes from:", data);
    
    return data || null;
  } catch (error) {
    console.error("Error fetching SOAP notes:", error);
    return null;
  }
};
