
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
