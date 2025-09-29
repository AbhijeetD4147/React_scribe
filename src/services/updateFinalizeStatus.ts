import axios from "axios";
import { Apipath } from "../Comman/Constants";

export const updateFinalizeStatus = async (recordingId: number, isFinalized: boolean): Promise<any | null> => {
  // const url =`${Apipath.Auth_Api}/e1/DemoScribe/SAuLpR/Patient/UpsertRecording?RECORDING_ID=${recordingId}&IsFinalize=${isFinalized}`;

  const url = `/e1/DemoScribe/SAuLpR/Patient/UpsertRecording?RECORDING_ID=${recordingId}&IsFinalize=${isFinalized}`;

  try {
    // const response = await axios.get(url, {
    // });
    // if (response.status == 200) {
    //   return response.data;
    // }else{
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }



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