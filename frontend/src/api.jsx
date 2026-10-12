export const analyzeFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8000/analyze", {
    method: "POST",
    body: formData,
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
};
