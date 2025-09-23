import axios from "axios";
import { Auth_Api } from "../Comman/Constants";
import { getAuthToken } from "./authenticate_api";

export const getDictation = async (recordingId: number): Promise<any | null> => {
  const token = await getAuthToken();
  if (!token) {
    console.error("Authentication failed.");
    return null;
  }
//   const url = `${Auth_Api}/api/common/ExecStoredProcedure`;
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
    //  const response = await axios.post(url,body {
    //   headers: {
    //     "Content-Type": "application/json",
    //     apiKey: `Bearer ${token}`
    //   },
    // });

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

    // if(response.status==200){
    //     return response.data;
    // }else if(response.status==401){
    //     await getAuthToken();
    //     return await getDictation(recordingId);
    // }
  } catch (error) {
    console.error("Error fetching dictation:", error);
    return null;
  }
};