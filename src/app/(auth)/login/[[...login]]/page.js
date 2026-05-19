"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createData } from "@/helper/axios";
import { setExamResult, setUserId } from "@/store/examSlice";
import { useFormik } from "formik";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import * as yup from "yup";
function LoginPage() {
  const navigate = useRouter();
  const dispatch = useDispatch();
  const [loader, setLoader] = useState(false);
  const [initialValues] = useState({
    Username: "",
    psd: "",
  });

  const validation = yup.object().shape({
    Username: yup.string().required("Username is required"),
    psd: yup.string().required("Password is required"),
  });

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validation,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoader(true);
      const data = {
        username: values.Username,
        password: values.psd,
      };
      const res = await createData("", "auth/studentLogin", data, {
        withCredentials: true,
        header: {
          "Content-Type": "application/json",
        },
      });
      console.log("res", res);
      if (res.status === 200) {
        const token = res.data.data;
        console.log("AAAA", typeof token, token);
        const user = jwtDecode(token);
        console.log("user", user);
        dispatch(setUserId({ user }));
        setLoader(false);
        const sesiionidexist = localStorage.getItem("exam_session");
        if (sesiionidexist) {
          navigate.push("/exampage");
        } else {
          navigate.push("/welcomepage");
        }
      } else if (res.status === 400) {
        toast.error(res.data.message);
        setLoader(false);
      } else {
        setLoader(false);
      }
    },
  });

  return (
    <>
      <div className="w-full flex justify-center mt-10">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
          {/* TITLE */}
          <h1 className="text-xl font-bold text-center mb-6 text-gray-800">
            ONLINE EXAM PORTAL
          </h1>

          {/* FORM */}
          <div className="space-y-4">
            {/* USERNAME */}
            <div className="flex flex-col">
              <Label className="text-sm font-medium text-gray-700 mb-1">
                Username
              </Label>
              <Input
                placeholder="Enter Username"
                name="Username"
                value={formik.values.Username}
                onChange={formik.handleChange}
                className="h-10"
              />
              {formik.errors.Username && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.Username}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col">
              <Label className="text-sm font-medium text-gray-700 mb-1">
                Password
              </Label>
              <Input
                placeholder="Enter Password"
                type="password"
                name="psd"
                value={formik.values.psd}
                onChange={formik.handleChange}
                className="h-10"
              />
              {formik.errors.psd && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.psd}</p>
              )}
            </div>

            {/* BUTTON */}
            <Button
              onClick={formik.handleSubmit}
              className="w-full h-10 mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {loader ? "Loading..." : "Login"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
