export const getAuthToken = async (): Promise<string | null> => {
  const url = "/api/v2/account/authenticate";
  const body = {
    vendorid: "df0d4caf-1048-41cc-99c5-0613ed2019c0",
    vendorpassword: "password@123",
    accountid: "DemoScribe",
    accountpassword: "DSPQ109@901",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.Token || null;
  } catch (error) {
    console.error("Error fetching auth token:", error);
    return null;
  }
};

export const getPatientList = async (startDate: string, endDate: string): Promise<{ Table: any[] } | null> => {
  const token = await getAuthToken();
  if (!token) {
    console.error("Authentication failed.");
    return null;
  }

  const url = "/api/common/ExecStoredProcedure";
  const body = {
    ProcedureName: "AIS_GET_AIS_RECORDINGS",
    Parameters: [
      {
        name: "START_DATE",
        value: startDate,
        dbType: "datetime",
      },
      {
        name: "END_DATE",
        value: endDate,
        dbType: "datetime",
      },
      {
        name: "OrderByPatientId",
        value: "23",
        dbType: "varchar",
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
    return data || null;
  } catch (error) {
    console.error("Error fetching patient list:", error);
    return null;
  }
};

export const getDictation = async (recordingId: number): Promise<any | null> => {
  const token = await getAuthToken();
  if (!token) {
    console.error("Authentication failed.");
    return null;
  }

  const url = "/api/common/ExecStoredProcedure";
  const body = {
    ProcedureName: "AIS_GET_AIS_DICTATION",
    Parameters: [
      {
        name: "RECORDING_ID",
        value: recordingId,
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
    return data || null;
  } catch (error) {
    console.error("Error fetching dictation:", error);
    return null;
  }
};

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

export const updateFinalizeStatus = async (recordingId: number, isFinalized: boolean): Promise<any | null> => {
  const url = `/e1/DemoScribe/SAuLpR/Patient/UpsertRecording?RECORDING_ID=${recordingId}&IsFinalize=${isFinalized}`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error("Error updating finalize status:", error);
    return null;
  }
};
export const sendSoapNoteToMaximeyes = async (encounterId: number, note: { elementName: string, note: string }): Promise<any | null> => {
  const url = `/e1/DemoScribe/SAuLpR/Patient/SendSoapNoteToMaximeyes?encounterId=${encounterId}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error("Error sending SOAP note to Maximeyes:", error);
    return null;
  }
};
