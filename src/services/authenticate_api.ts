import axios from "axios";
import { Auth_Api } from "../Comman/Constants";

export const getAuthToken = async (): Promise<string | null> => {
  const url = `${Auth_Api}/api/v2/account/authenticate`;
//   const url = `/api/v2/account/authenticate`;
  const body = {
    vendorid: "df0d4caf-1048-41cc-99c5-0613ed2019c0",
    vendorpassword: "password@123",
    accountid: "DemoScribe",
    accountpassword: "DSPQ109@901",
  };

  try {
    const response = await axios.post(url,body ,{
        // const response = await fetch(url, {
            // method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            // body: JSON.stringify(body),
        })
    if (response.status === 200) {
        // const data = await response.json();
        const data = await response.data;
        return data.Token || null;
    }else if(response.status === 401){
        await getAuthToken();
    }
  } catch (error) {
    console.error("Error fetching auth token:", error);
    return null;
  }
};