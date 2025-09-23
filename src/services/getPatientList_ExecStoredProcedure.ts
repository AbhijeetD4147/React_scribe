import axios from "axios";
import { Auth_Api } from "../Comman/Constants";
import { getAuthToken } from "./authenticate_api";


export const getPatientList = async (startDate: string, endDate: string): Promise<{ Table: any[] } | null> => {
  const token = await getAuthToken();
  if (!token) {
    console.error("Authentication failed.");
    return null;
  }

//   const url =`${Auth_Api}/api/common/ExecStoredProcedure`;
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
    const response = await axios.post(url,body ,{
    // const response = await fetch(url, {
    //   method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiKey: `Bearer ${token}`
      },
    //   body: JSON.stringify(body),
    });

    if (response.status == 200) {
       const data = await response.data;
    return data ;
    }else if(response.status === 401){
        await getAuthToken();
        return await getPatientList(startDate, endDate);
    } 
  } catch (error) {
    console.error("Error fetching patient list:", error);
    return null;
  }
};
