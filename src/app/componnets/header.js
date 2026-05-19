"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import logo from "../../../public/TdTechLogo.svg";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";

function Header() {
  const pathname = usePathname();
  const [userdata, setUserdata] = useState();
  const { user } = useSelector((state) => state.exam);

  useEffect(() => {
    const data = localStorage.getItem("userdata");
    if (data) {
      setUserdata(JSON.parse(data));
    }
  }, []);
  console.log("userdata", user);
  const logout = () => {
    localStorage.removeItem("userdata");
    localStorage.removeItem("exam_session");
    window.location.href = "/login";
  };
  return (
    <header className=" top-0 max-w-6xl mx-auto rounded-bl-xl p-4 rounded-br-xl bg-[#f5f5f599] backdrop-blur z-50 supports-[backdrop-filter]:bg-white/60">
      {pathname === "/login" || pathname === "/" ? (
        <div className="p-3 flex justify-center">
          <Image src={logo} alt="logoo" height={200} width={200}  priority />
        </div>
      ) : (
        <div className="flex justify-between align-items-center">
          <Image src={logo} alt="logoo" height={200} width={200} priority />
          <div>
            <div
              className="w-50 p-2 bg-[#f5f5f599] border border-gray-300 rounded-xl"
              style={{
                boxShadow:
                  "rgb(204, 219, 232) 3px 3px 6px 0px inset, rgba(255, 255, 255, 0.5) -3px -3px 6px 1px inset",
              }}
            >
              <div className="flex justify-between border-b border-gray-200 text-sm">
                <span className="text-gray-700">Student name :</span>
                <span className="font-bold">
                  {user?.student[0]?.student_name
                    ? user?.student[0]?.student_name
                    : userdata?.student[0]?.student_name}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 text-sm">
                <span className="text-gray-700">Course Name :</span>
                <span className="font-bold">
                  {user?.student[0]?.course_code
                    ? user?.student[0]?.course_code
                    : userdata?.student[0]?.course_code}
                </span>
              </div>

              <div className="flex justify-between border-gray-200 text-sm">
                <span className="text-gray-700">Reg.ID :</span>
                <span className="font-bold">
                  {user?.username || userdata?.username}
                </span>
              </div>
              {pathname === "/welcomepage" ? (
                <button
                  onClick={logout}
                  className="cursor-pointer mt-5 w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1 rounded-lg transition"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
