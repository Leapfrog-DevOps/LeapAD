import axios from "axios";
import { emitLog as emit } from "./util";

const axiosInstance = axios.create();

const SetupInterceptors = (http) => {
  http.interceptors.request.use(
    (config) => {
      emit(`Request: ${config.method.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      emit(`Request Error: ${error.message}`, "red");
      return Promise.reject(error);
    }
  );

  // Response interceptor
  http.interceptors.response.use(
    (response) => {
      emit(
        `200 SUCCESS: ${response.config.method.toUpperCase()} ${
          response.config.url
        }`,
        "green"
      );
      return response;
    },
    (error) => {
      if (error.response) {
        const statusCode = error.response ? error.response.status : "Unknown";
        emit(
          `${statusCode} FAIL: ${error.response.config.method.toUpperCase()} ${
            error.response.config.url
          }`,
          "red"
        );
      } else {
        emit(`Request Error: ${error.message}`, "red");
      }
      return Promise.reject(error);
    }
  );
};

SetupInterceptors(axiosInstance);

export default axiosInstance;
