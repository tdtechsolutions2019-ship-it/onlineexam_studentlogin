import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
// process.env.NEXT_PUBLIC_LOCALHOST_URL || "http://localhost:5000/api";
// const BASE_URL = import.meta.env.VITE_API_BASE_URL ;

const service = axios.create({
  baseURL: BASE_URL,
});

// Common error handler
const handleError = (error) => {
  console.error("API Error:", error);
  if (error.message === "Network Error") {
    alert("Server is not responding. Please try again later.");
  }
  return error.response || { data: { message: "Unknown error occurred" } };
};

// Create (POST)
export const createData = async (method, path, payload, header) => {
  try {
    const response = await service.post(path, payload, header ? header : " ");
    return response;
  } catch (error) {
    console.log("axiosApiCall-----==", error);
    if (error.message === "Network Error") {
      console.log(
        `${error}, Server is not responding, please try again after some time`,
      );
    }
    if (
      error.response?.data?.statusCode === 401 &&
      header &&
      !header["access-token"]
    ) {
      if (error.response.data.refresh_expire) {
        return error.response;
      }
    } else {
      return error.response;
    }
  }
};

// Read (GET)
export const readData = async (path, options = {}) => {
  try {
    const response = await service.get(path, { ...options });
    return response.data;
  } catch (error) {
    console.log("errrr", error);
    return handleError(error);
  }
};

// Update (PUT or PATCH)
export const updateData = async (path, data, header) => {
  try {
    const response = await service.put(path, data, header ? header : " ");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Delete (DELETE)
export const deleteData = async (path, headers) => {
  try {
    const response = await service.delete(path, headers ? headers : "");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};
