"use client";

import Loader from "@/app/componnets/loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createData, readData } from "@/helper/axios";
import { setExamResult } from "@/store/examSlice";
import { useFormik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as yup from "yup";
import { v4 as uuidv4 } from "uuid";

function ExamPageContent() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.exam);
  console.log("user", user);
  // const userdata = JSON.parse(localStorage.getItem("userdata"));
  const searchparam = useSearchParams();
  const language = searchparam.get("lan");

  const navigate = useRouter();
  const [userdata, setUserdata] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skiped, setSkiped] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(50);
  const [startTime, setStartTime] = useState(null);
  const [que, setque] = useState([]);
  const [examStartTime, setExamStartTime] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const hasSubmitted = useRef(false); // ✅ prevent double submit

  const [initialValues] = useState({
    answer: {},
  });

  const validation = yup.object().shape({
    answer: yup
      .object()
      .test("all-answered", "Please answer the question", (value) => {
        return value && Object.values(value).every((ans) => ans !== "");
      }),
  });

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validation,
    enableReinitialize: true,
    onSubmit: (values) => {
      Addans(values.answer);
    },
  });

  useEffect(() => {
    const data = localStorage.getItem("userdata");
    if (data) {
      setUserdata(JSON.parse(data));
    }
  }, []);

  const Addans = async (ans) => {
    console.log("ans123131", ans);
    const existingSession = localStorage.getItem("exam_session");
    // ✅ Guard: prevent running more than once
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    const anslength = Object.entries(ans).filter(([_, val]) => val !== "");
    if (!isFinished) {
      const confirmed = window.confirm(
        "Are you sure, you want to finish your exam?",
      );
      if (!confirmed) {
        hasSubmitted.current = false; // allow retry if user cancels
        return;
      }
    }

    const quelen = que.length;
    let anslen = anslength.length;
    dispatch(setExamResult({ quelen, anslen }));

    try {
      const customArray = Array.from(
        Object.entries(ans),
        ([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }),
      );
      console.log("customArray", customArray);
      // (session_id, student_id, userexamId);
      const data = {
        session_id: existingSession ? existingSession : sessionId,
        student_id: userdata.student_id
          ? userdata.student_id
          : user?.student_id,
        examId: userdata.id ? userdata.id : user.id,
      };

      const res = await createData("", "exam/saveanswer", data, {
        withCredentials: true,
        header: {
          "Content-Type": "application/json",
        },
      });

      navigate.push("/finishpage");
      localStorage.removeItem("exam_session");
      localStorage.removeItem("userdata");
    } catch (error) {
      console.log("error", error);
      hasSubmitted.current = false; // allow retry on error
    }
  };

  const handleAnswer = (selectans) => {
    const questionId = que[currentIndex]?.question_id;
    formik.setFieldValue("answer", {
      ...formik.values.answer,
      [questionId]: selectans,
    });
  };

  const StoreQuestions = async ({
    userId,
    student_id,
    questions,
    exam_duration_in_hours,
    sessionId,
  }) => {
    try {
      const data = {
        userId,
        questions,
        student_id,
        exam_duration_in_hours,
        sessionId,
      };
      const response = await createData(
        "",
        `storequestion/AddQuestions`,
        data,
        {
          withCredentials: true,
          header: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("response", response);
      if (response.status === 200) {
        setLoading(false);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const Getquestation = async () => {
    try {
      setLoading(true);
      const res = await readData(
        `exam/getAllQuestion/${user.student_id}/${language}`,
        {
          header: {
            "Content-Type": "application/json",
          },
        },
      );
      console.log("Res for question", sessionId);
      if (res.status === 200) {
        const NewsessionId = uuidv4();
        localStorage.setItem("exam_session", NewsessionId);
        console.log("NewsessionId", NewsessionId);
        setSessionId(NewsessionId);
        StoreQuestions({
          userId: user.id,
          student_id: user.student_id,
          questions: res.data.questions,
          exam_duration_in_hours: Number(res.data.exam_duration_in_hours),
          sessionId: NewsessionId,
        });
        const apiSeconds = parseTimeInput(res.data.exam_duration_in_hours);
        if (apiSeconds > 0) {
          setTimeLeft(apiSeconds);
        }
        setque(res.data.questions);
        setLoading(false);
      } else if (res.status === 404) {
        toast.error(res.data.message);
        setLoading(false);
        navigate.push("/");
      }
    } catch (err) {
      console.log("err-->>", err);
      setLoading(false);
    }
  };

  const ResumeExam = async (existingSession) => {
    try {
      const res = await readData(
        `exam/resumeExam/${existingSession ? existingSession : sessionId}`,
        {
          header: {
            "Content-Type": "application/json",
          },
        },
      );
      console.log("resforresume", res);
      if (res.status === 200) {
        setque(res.data.questions);
        const apiSeconds = parseresumeTimeInput(res.data.remaining_time);
        if (apiSeconds > 0) {
          setTimeLeft(apiSeconds);
        }
        // convert mongo answers to formik format
        const formattedAnswers = {};

        if (res.data.answers) {
          Object.keys(res.data.answers).forEach((qid) => {
            formattedAnswers[qid] = res.data.answers[qid].answer;
          });
        }
        console.log("formattedAnswers", formattedAnswers);
        formik.setValues({
          answer: formattedAnswers,
        });

        setCurrentIndex(res.data.current_question);
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  const parseTimeInput = (input) => {
    if (!input) return 0;
    const num = Number(input);
    if (num <= 12) {
      return num * 3600;
    }
    return num * 60;
  };

  const parseresumeTimeInput = (input) => {
    if (!input) return 0;
    return Number(input);
  };
  console.log("formikk", formik.values);
  // ✅ FIX 1: Timer runs only once on mount, no isFinished dependency
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // ← empty dependency array

  // ✅ FIX 2: Auto-submit when timer ends, inside useEffect (not in render body)

  const formatTimehr = (seconds) => {
    return `${Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0")}`;
  };
  const formatTimeMin = (seconds) => {
    return `${Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0")}`;
  };
  const formatTimeSec = (seconds) => {
    return `${(seconds % 60).toString().padStart(2, "0")}`;
  };

  const SaveAnswer = async ({
    userexamId,
    questionId,
    answerId,
    timeTaken,
    totalTimeTaken,
  }) => {
    const existingSession = localStorage.getItem("exam_session");
    try {
      const data = {
        session_id: existingSession ? existingSession : sessionId,
        userexamId,
        questionId,
        answerId,
        timeTaken,
        totalTimeTaken,
        student_id: user?.student_id,
        examdate: user?.examdate,
      };

      await createData("", `storequestion/saveAnswer`, data, {
        withCredentials: true,
        header: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return `${hrs}:${mins}:${secs}`;
  };

  const handleNext = () => {
    console.log("handleNext", 1111111);
    const currentQuesId = que[currentIndex].question_id;
    console.log("currentQuesId", currentQuesId);
    const currentAns = formik.values.answer?.[currentQuesId];
    console.log("currentAns", currentAns);
    if (!currentAns) {
      formik.setFieldError(
        `answer.${currentQuesId}`,
        "Please  answer the question",
      );
      return;
    }
    formik.setFieldError(`answer.${currentQuesId}`, undefined);
    const endTime = Date.now();

    const timeTaken = Math.floor((endTime - startTime) / 1000);

    const totaltimeSecond = Math.floor((endTime - examStartTime) / 1000);
    const totalTime = formatTime(totaltimeSecond);
    SaveAnswer({
      userexamId: userdata.id ? userdata.id : user.id,
      questionId: currentQuesId,
      answerId: currentAns,
      timeTaken: timeTaken,
      totalTimeTaken: totalTime,
    });

    if (currentIndex < que.length - 1) {
      setStartTime(Date.now());
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlequejump = (val) => {
    setCurrentIndex(val);
  };

  const handleSkip = () => {
    setSkiped((prev) => [...prev, que[currentIndex].question_id]);
    if (currentIndex < que.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    formik.setFieldValue("answer", {
      ...formik.values.answer,
      [que[currentIndex].question_id]: "",
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const validOptions =
    que[currentIndex]?.options
      ?.filter((opt) => opt && opt.trim() !== "")
      ?.map((opt, index) => ({
        value: `option${index + 1}`,
        label: opt,
      })) || [];

  // For Prevent to access any keys and refresh

  // useEffect(() => {
  //   // Block keyboard shortcuts
  //   const handleKeyDown = (e) => {
  //     // Block F1-F12
  //     if (e.key >= "F1" && e.key <= "F12") {
  //       e.preventDefault();
  //     }
  //     // Block Ctrl+R, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
  //     if (
  //       e.ctrlKey &&
  //       ["r", "R", "u", "U", "i", "I", "j", "J", "c", "C", "s", "S"].includes(
  //         e.key,
  //       )
  //     ) {
  //       e.preventDefault();
  //     }
  //     // Block Ctrl+Shift+Delete
  //     if (e.ctrlKey && e.shiftKey && e.key === "Delete") {
  //       e.preventDefault();
  //     }
  //     // Block Alt+F4
  //     if (e.altKey && e.key === "F4") {
  //       e.preventDefault();
  //     }
  //   };

  //   // Block right click
  //   const handleContextMenu = (e) => {
  //     e.preventDefault();
  //   };

  //   // Block page refresh / tab close warning
  //   const handleBeforeUnload = (e) => {
  //     e.preventDefault();
  //     e.returnValue = "Exam is in progress. Are you sure you want to leave?";
  //     return e.returnValue;
  //   };

  //   // Block back/forward navigation
  //   const handlePopState = () => {
  //     window.history.pushState(null, "", window.location.href);
  //   };
  //   window.history.pushState(null, "", window.location.href);

  //   document.addEventListener("keydown", handleKeyDown);
  //   document.addEventListener("contextmenu", handleContextMenu);
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   window.addEventListener("popstate", handlePopState);

  //   return () => {
  //     document.removeEventListener("keydown", handleKeyDown);
  //     document.removeEventListener("contextmenu", handleContextMenu);
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //     window.removeEventListener("popstate", handlePopState);
  //   };
  // }, []);

  // For tab change waring
  // useEffect(() => {
  //   let warningCount = 0;

  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === "hidden") {
  //       warningCount += 1;
  //       if (warningCount >= 3) {
  //         // Auto submit after 3 tab switches
  //         setIsFinished(true);
  //       }
  //     }
  //     if (document.visibilityState === "visible") {
  //       if (warningCount < 3) {
  //         alert(`Warning ${warningCount}/3: Do not switch tabs during exam!`);
  //       }
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   return () => {
  //     document.removeEventListener(
  //       "visibilitychange",
  //       handleVisibilityChange,
  //     );
  //   };
  // }, []);

  useEffect(() => {
    const now = Date.now();
    setExamStartTime(now);
    setStartTime(Date.now());
  }, [currentIndex]);

  useEffect(() => {
    if (isFinished) {
      Addans(formik.values.answer);
    }
  }, [isFinished]);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    hasFetched.current = true;

    const existingSession = localStorage.getItem("exam_session");
    console.log("existingSession", existingSession);
    if (existingSession) {
      // Resume exam if session exists
      ResumeExam(existingSession);
    } else {
      // Start new exam
      Getquestation();
    }
  }, []);
  const questionId = que[currentIndex]?.question_id;
  console.log(
    "formik.values.answer?.[questionId]",
    formik.values.answer?.[questionId],
  );

  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = formik.values.answer?.[questionId] || "";
    }
  }, [questionId]);

  const skippedSet = useMemo(() => new Set(skiped), [skiped]);
  const totalQuestions = que.length;
  const answeredCount = useMemo(
    () =>
      que.filter((q) => Boolean(formik.values.answer?.[q.question_id])).length,
    [que, formik.values.answer],
  );

  return (
    <>
      {loading ? (
        <>
          <Loader />
        </>
      ) : que.length === 0 ? (
        <p className="p-8 text-center text-muted-foreground">
          No questions loaded.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="surface h-fit p-4 lg:sticky lg:top-24">
            <div className="mb-4 border-b border-border pb-4">
              <p className="text-sm text-muted-foreground">Exam Progress</p>
              <p className="text-lg font-semibold">
                {answeredCount}/{totalQuestions} Attempted
              </p>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-border bg-secondary p-2">
                <p className="text-xs text-muted-foreground">Answered</p>
                <p className="font-semibold">{answeredCount}</p>
              </div>
              <div className="rounded-md border border-border bg-secondary p-2">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="font-semibold">{skiped.length}</p>
              </div>
              <div className="rounded-md border border-border bg-secondary p-2">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold">
                  {Math.max(totalQuestions - answeredCount, 0)}
                </p>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-primary/15 px-2 py-1 text-primary">
                Current
              </span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-700">
                Answered
              </span>
              <span className="rounded-md bg-rose-500/15 px-2 py-1 text-rose-700">
                Skipped
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {que.map((data, index) => {
                const qid = data.question_id;
                const isCurrent = currentIndex === index;
                const isAnswered = Boolean(formik.values.answer?.[qid]);
                const isSkipped = skippedSet.has(qid) && !isAnswered;

                return (
                  <button
                    id={`numbox_${index}`}
                    className={`h-9 rounded-md border text-sm font-semibold transition ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isAnswered
                          ? "border-emerald-600 bg-emerald-600/15 text-emerald-700"
                          : isSkipped
                            ? "border-rose-600 bg-rose-600/15 text-rose-700"
                            : "border-border bg-secondary text-secondary-foreground hover:border-primary/60"
                    }`}
                    onClick={() => handlequejump(index)}
                    key={index}
                    type="button"
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="surface">
            <div className="grid w-full grid-cols-1 overflow-hidden rounded-t-2xl border-b border-border md:grid-cols-3">
              <div className="bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-semibold">
                  {new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}
                </p>
              </div>
              <div className="border-x border-border bg-background p-4">
                <p className="text-center text-xs text-muted-foreground">
                  Time Remaining
                </p>
                <div className="mt-1 flex justify-center gap-3 text-center">
                  <p className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold">
                    {formatTimehr(timeLeft)}h
                  </p>
                  <p className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold">
                    {formatTimeMin(timeLeft)}m
                  </p>
                  <p className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold">
                    {formatTimeSec(timeLeft)}s
                  </p>
                </div>
              </div>
              <div className="bg-secondary p-4 text-right">
                <p className="text-xs text-muted-foreground">Total Marks</p>
                <p className="text-sm font-semibold">0</p>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-primary md:text-lg">
                  Question {currentIndex + 1} of {totalQuestions || 0}
                </h2>
                {language ? (
                  <p className="rounded-md bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Language: {language}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div
                  className="max-w-none text-sm leading-relaxed text-foreground [&_img]:max-h-48 [&_img]:rounded-md [&_p]:mb-2 [&_p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: que[currentIndex]?.question,
                  }}
                />
              </div>
              {console.log(
                "que[currentIndex]",
                currentIndex,
                que[currentIndex],
              )}

              <RadioGroup
                key={questionId}
                onValueChange={(val) => handleAnswer(val)}
                value={formik.values.answer?.[questionId] || ""}
                className="mt-5 space-y-3"
              >
                {validOptions.length > 0 ? (
                  validOptions.map((opt, i) => (
                    <Label
                      htmlFor={`option-${questionId}-${i}`}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 transition hover:border-primary/50 hover:bg-secondary"
                      key={opt.value}
                    >
                      <RadioGroupItem
                        value={opt.value}
                        id={`option-${questionId}-${i}`}
                        className="mt-1"
                      />
                      <span className="text-sm leading-6">{opt.label}</span>
                    </Label>
                  ))
                ) : (
                  <div
                    ref={editorRef}
                    key={questionId}
                    contentEditable
                    suppressContentEditableWarning
                    className="mt-2 min-h-[140px] w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    onBlur={(e) =>
                      formik.setFieldValue("answer", {
                        ...formik.values.answer,
                        [questionId]: e.currentTarget.innerText,
                      })
                    }
                  />
                )}
              </RadioGroup>

              {formik.errors.answer && (
                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {typeof formik.errors.answer === "string"
                    ? formik.errors.answer
                    : formik.errors.answer[que[currentIndex]?.id] ||
                      "Please answer the question"}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handlePrevious()}
                  className="primary-action px-4"
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handleNext()}
                  className="primary-action px-4 cursor-pointer"
                >
                  Next
                </Button>
                <Button
                  onClick={() => handleSkip()}
                  className="bg-secondary px-4 text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                  disabled={currentIndex + 1 === que.length}
                >
                  Skip
                </Button>
              </div>
              <Button
                type="submit"
                onClick={formik.handleSubmit}
                className="bg-destructive px-6 text-white hover:bg-destructive/90 cursor-pointer"
              >
                Finish Exam
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function LoadingExam() {
  return (
    <div className="p-6 text-center">
      <Loader />
    </div>
  );
}

// export default function ExamPage() {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.exam);
//   console.log("user", user);
//   // const userdata = JSON.parse(localStorage.getItem("userdata"));
//   const searchparam = useSearchParams();
//   const language = searchparam.get("lan");

//   const navigate = useRouter();
//   const [userdata, setUserdata] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [skiped, setSkiped] = useState([]);
//   const [isFinished, setIsFinished] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(50);
//   const [startTime, setStartTime] = useState(null);
//   const [que, setque] = useState([]);
//   const [examStartTime, setExamStartTime] = useState(null);
//   const [sessionId, setSessionId] = useState("");
//   const hasSubmitted = useRef(false); // ✅ prevent double submit

//   const [initialValues] = useState({
//     answer: {},
//   });

//   const validation = yup.object().shape({
//     answer: yup
//       .object()
//       .test("all-answered", "Please answer the question", (value) => {
//         return value && Object.values(value).every((ans) => ans !== "");
//       }),
//   });

//   const formik = useFormik({
//     initialValues: initialValues,
//     validationSchema: validation,
//     enableReinitialize: true,
//     onSubmit: (values) => {
//       Addans(values.answer);
//     },
//   });

//   useEffect(() => {
//     const data = localStorage.getItem("userdata");
//     if (data) {
//       setUserdata(JSON.parse(data));
//     }
//   }, []);

//   const Addans = async (ans) => {
//     console.log("ans123131", ans);
//     const existingSession = localStorage.getItem("exam_session");
//     // ✅ Guard: prevent running more than once
//     if (hasSubmitted.current) return;
//     hasSubmitted.current = true;

//     const anslength = Object.entries(ans).filter(([_, val]) => val !== "");
//     if (!isFinished) {
//       const confirmed = window.confirm(
//         "Are you sure, you want to finish your exam?",
//       );
//       if (!confirmed) {
//         hasSubmitted.current = false; // allow retry if user cancels
//         return;
//       }
//     }

//     const quelen = que.length;
//     let anslen = anslength.length;
//     dispatch(setExamResult({ quelen, anslen }));

//     try {
//       const customArray = Array.from(
//         Object.entries(ans),
//         ([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }),
//       );
//       console.log("customArray", customArray);
//       // (session_id, student_id, userexamId);
//       const data = {
//         session_id: existingSession ? existingSession : sessionId,
//         student_id: userdata.student_id
//           ? userdata.student_id
//           : user?.student_id,
//         examId: userdata.id ? userdata.id : user.id,
//       };

//       const res = await createData("", "exam/saveanswer", data, {
//         withCredentials: true,
//         header: {
//           "Content-Type": "application/json",
//         },
//       });

//       navigate.push("/finishpage");
//       localStorage.removeItem("exam_session");
//       localStorage.removeItem("userdata");
//     } catch (error) {
//       console.log("error", error);
//       hasSubmitted.current = false; // allow retry on error
//     }
//   };

//   const handleAnswer = (selectans) => {
//     const questionId = que[currentIndex]?.question_id;
//     formik.setFieldValue("answer", {
//       ...formik.values.answer,
//       [questionId]: selectans,
//     });
//   };

//   const StoreQuestions = async ({
//     userId,
//     student_id,
//     questions,
//     exam_duration_in_hours,
//     sessionId,
//   }) => {
//     try {
//       const data = {
//         userId,
//         questions,
//         student_id,
//         exam_duration_in_hours,
//         sessionId,
//       };
//       const response = await createData(
//         "",
//         `storequestion/AddQuestions`,
//         data,
//         {
//           withCredentials: true,
//           header: {
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       console.log("response", response);
//       if (response.status === 200) {
//         setLoading(false);
//       }
//     } catch (error) {
//       console.log("error", error);
//     }
//   };

//   const Getquestation = async () => {
//     try {
//       setLoading(true);
//       const res = await readData(
//         `exam/getAllQuestion/${user.student_id}/${language}`,
//         {
//           header: {
//             "Content-Type": "application/json",
//           },
//         },
//       );
//       console.log("Res for question", sessionId);
//       if (res.status === 200) {
//         const NewsessionId = uuidv4();
//         localStorage.setItem("exam_session", NewsessionId);
//         console.log("NewsessionId", NewsessionId);
//         setSessionId(NewsessionId);
//         StoreQuestions({
//           userId: user.id,
//           student_id: user.student_id,
//           questions: res.data.questions,
//           exam_duration_in_hours: Number(res.data.exam_duration_in_hours),
//           sessionId: NewsessionId,
//         });
//         const apiSeconds = parseTimeInput(res.data.exam_duration_in_hours);
//         if (apiSeconds > 0) {
//           setTimeLeft(apiSeconds);
//         }
//         setque(res.data.questions);
//         setLoading(false);
//       } else if (res.status === 404) {
//         toast.error(res.data.message);
//         setLoading(false);
//         navigate.push("/");
//       }
//     } catch (err) {
//       console.log("err-->>", err);
//       setLoading(false);
//     }
//   };

//   const ResumeExam = async (existingSession) => {
//     try {
//       const res = await readData(
//         `exam/resumeExam/${existingSession ? existingSession : sessionId}`,
//         {
//           header: {
//             "Content-Type": "application/json",
//           },
//         },
//       );
//       console.log("resforresume", res);
//       if (res.status === 200) {
//         setque(res.data.questions);
//         const apiSeconds = parseresumeTimeInput(res.data.remaining_time);
//         if (apiSeconds > 0) {
//           setTimeLeft(apiSeconds);
//         }
//         // convert mongo answers to formik format
//         const formattedAnswers = {};

//         if (res.data.answers) {
//           Object.keys(res.data.answers).forEach((qid) => {
//             formattedAnswers[qid] = res.data.answers[qid].answer;
//           });
//         }
//         console.log("formattedAnswers", formattedAnswers);
//         formik.setValues({
//           answer: formattedAnswers,
//         });

//         setCurrentIndex(res.data.current_question);
//       }
//     } catch (error) {
//       console.log("error", error);
//     }
//   };
//   const parseTimeInput = (input) => {
//     if (!input) return 0;
//     const num = Number(input);
//     if (num <= 12) {
//       return num * 3600;
//     }
//     return num * 60;
//   };

//   const parseresumeTimeInput = (input) => {
//     if (!input) return 0;
//     return Number(input);
//   };
//   console.log("formikk", formik.values);
//   // ✅ FIX 1: Timer runs only once on mount, no isFinished dependency
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           setIsFinished(true);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []); // ← empty dependency array

//   // ✅ FIX 2: Auto-submit when timer ends, inside useEffect (not in render body)

//   const formatTimehr = (seconds) => {
//     return `${Math.floor(seconds / 3600)
//       .toString()
//       .padStart(2, "0")}`;
//   };
//   const formatTimeMin = (seconds) => {
//     return `${Math.floor((seconds % 3600) / 60)
//       .toString()
//       .padStart(2, "0")}`;
//   };
//   const formatTimeSec = (seconds) => {
//     return `${(seconds % 60).toString().padStart(2, "0")}`;
//   };

//   const SaveAnswer = async ({
//     userexamId,
//     questionId,
//     answerId,
//     timeTaken,
//     totalTimeTaken,
//   }) => {
//     const existingSession = localStorage.getItem("exam_session");
//     try {
//       const data = {
//         session_id: existingSession ? existingSession : sessionId,
//         userexamId,
//         questionId,
//         answerId,
//         timeTaken,
//         totalTimeTaken,
//         student_id: user?.student_id,
//         examdate: user?.examdate,
//       };

//       await createData("", `storequestion/saveAnswer`, data, {
//         withCredentials: true,
//         header: {
//           "Content-Type": "application/json",
//         },
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const formatTime = (seconds) => {
//     const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
//     const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
//     const secs = String(seconds % 60).padStart(2, "0");

//     return `${hrs}:${mins}:${secs}`;
//   };

//   const handleNext = () => {
//     console.log("handleNext", 1111111);
//     const currentQuesId = que[currentIndex].question_id;
//     console.log("currentQuesId", currentQuesId);
//     const currentAns = formik.values.answer?.[currentQuesId];
//     console.log("currentAns", currentAns);
//     if (!currentAns) {
//       formik.setFieldError(
//         `answer.${currentQuesId}`,
//         "Please  answer the question",
//       );
//       return;
//     }
//     formik.setFieldError(`answer.${currentQuesId}`, undefined);
//     const endTime = Date.now();

//     const timeTaken = Math.floor((endTime - startTime) / 1000);

//     const totaltimeSecond = Math.floor((endTime - examStartTime) / 1000);
//     const totalTime = formatTime(totaltimeSecond);
//     SaveAnswer({
//       userexamId: userdata.id ? userdata.id : user.id,
//       questionId: currentQuesId,
//       answerId: currentAns,
//       timeTaken: timeTaken,
//       totalTimeTaken: totalTime,
//     });

//     if (currentIndex < que.length - 1) {
//       setStartTime(Date.now());
//       setCurrentIndex((prev) => prev + 1);
//     }
//   };

//   const handlequejump = (val) => {
//     setCurrentIndex(val);
//   };

//   const handleSkip = () => {
//     setSkiped((prev) => [...prev, que[currentIndex].question_id]);
//     if (currentIndex < que.length - 1) {
//       setCurrentIndex((prev) => prev + 1);
//     }
//     formik.setFieldValue("answer", {
//       ...formik.values.answer,
//       [que[currentIndex].question_id]: "",
//     });
//   };

//   const handlePrevious = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex((prev) => prev - 1);
//     }
//   };

//   const validOptions =
//     que[currentIndex]?.options
//       ?.filter((opt) => opt && opt.trim() !== "")
//       ?.map((opt, index) => ({
//         value: `option${index + 1}`,
//         label: opt,
//       })) || [];

//   // For Prevent to access any keys and refresh

//   // useEffect(() => {
//   //   // Block keyboard shortcuts
//   //   const handleKeyDown = (e) => {
//   //     // Block F1-F12
//   //     if (e.key >= "F1" && e.key <= "F12") {
//   //       e.preventDefault();
//   //     }
//   //     // Block Ctrl+R, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
//   //     if (
//   //       e.ctrlKey &&
//   //       ["r", "R", "u", "U", "i", "I", "j", "J", "c", "C", "s", "S"].includes(
//   //         e.key,
//   //       )
//   //     ) {
//   //       e.preventDefault();
//   //     }
//   //     // Block Ctrl+Shift+Delete
//   //     if (e.ctrlKey && e.shiftKey && e.key === "Delete") {
//   //       e.preventDefault();
//   //     }
//   //     // Block Alt+F4
//   //     if (e.altKey && e.key === "F4") {
//   //       e.preventDefault();
//   //     }
//   //   };

//   //   // Block right click
//   //   const handleContextMenu = (e) => {
//   //     e.preventDefault();
//   //   };

//   //   // Block page refresh / tab close warning
//   //   const handleBeforeUnload = (e) => {
//   //     e.preventDefault();
//   //     e.returnValue = "Exam is in progress. Are you sure you want to leave?";
//   //     return e.returnValue;
//   //   };

//   //   // Block back/forward navigation
//   //   const handlePopState = () => {
//   //     window.history.pushState(null, "", window.location.href);
//   //   };
//   //   window.history.pushState(null, "", window.location.href);

//   //   document.addEventListener("keydown", handleKeyDown);
//   //   document.addEventListener("contextmenu", handleContextMenu);
//   //   window.addEventListener("beforeunload", handleBeforeUnload);
//   //   window.addEventListener("popstate", handlePopState);

//   //   return () => {
//   //     document.removeEventListener("keydown", handleKeyDown);
//   //     document.removeEventListener("contextmenu", handleContextMenu);
//   //     window.removeEventListener("beforeunload", handleBeforeUnload);
//   //     window.removeEventListener("popstate", handlePopState);
//   //   };
//   // }, []);

//   // For tab change waring
//   // useEffect(() => {
//   //   let warningCount = 0;

//   //   const handleVisibilityChange = () => {
//   //     if (document.visibilityState === "hidden") {
//   //       warningCount += 1;
//   //       if (warningCount >= 3) {
//   //         // Auto submit after 3 tab switches
//   //         setIsFinished(true);
//   //       }
//   //     }
//   //     if (document.visibilityState === "visible") {
//   //       if (warningCount < 3) {
//   //         alert(`Warning ${warningCount}/3: Do not switch tabs during exam!`);
//   //       }
//   //     }
//   //   };

//   //   document.addEventListener("visibilitychange", handleVisibilityChange);
//   //   return () => {
//   //     document.removeEventListener(
//   //       "visibilitychange",
//   //       handleVisibilityChange,
//   //     );
//   //   };
//   // }, []);

//   useEffect(() => {
//     const now = Date.now();
//     setExamStartTime(now);
//     setStartTime(Date.now());
//   }, [currentIndex]);

//   useEffect(() => {
//     if (isFinished) {
//       Addans(formik.values.answer);
//     }
//   }, [isFinished]);

//   const hasFetched = useRef(false);

//   useEffect(() => {
//     if (hasFetched.current) return;

//     hasFetched.current = true;

//     const existingSession = localStorage.getItem("exam_session");
//     console.log("existingSession", existingSession);
//     if (existingSession) {
//       // Resume exam if session exists
//       ResumeExam(existingSession);
//     } else {
//       // Start new exam
//       Getquestation();
//     }
//   }, []);
//   const questionId = que[currentIndex]?.question_id;
//   console.log(
//     "formik.values.answer?.[questionId]",
//     formik.values.answer?.[questionId],
//   );

//   const editorRef = useRef(null);

//   useEffect(() => {
//     if (editorRef.current) {
//       editorRef.current.innerText = formik.values.answer?.[questionId] || "";
//     }
//   }, [questionId]);

//   const skippedSet = useMemo(() => new Set(skiped), [skiped]);
//   const totalQuestions = que.length;
//   const answeredCount = useMemo(
//     () =>
//       que.filter((q) => Boolean(formik.values.answer?.[q.question_id])).length,
//     [que, formik.values.answer],
//   );

//   return (
//     <>
//       {loading ? (
//         <>
//           <Loader />
//         </>
//       ) : que.length === 0 ? (
//         <p className="p-8 text-center text-muted-foreground">
//           No questions loaded.
//         </p>
//       ) : (
//         <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
//           <aside className="surface h-fit p-4 lg:sticky lg:top-24">
//             <div className="mb-4 border-b border-border pb-4">
//               <p className="text-sm text-muted-foreground">Exam Progress</p>
//               <p className="text-lg font-semibold">
//                 {answeredCount}/{totalQuestions} Attempted
//               </p>
//             </div>
//             <div className="mb-4 grid grid-cols-3 gap-2 text-center">
//               <div className="rounded-md border border-border bg-secondary p-2">
//                 <p className="text-xs text-muted-foreground">Answered</p>
//                 <p className="font-semibold">{answeredCount}</p>
//               </div>
//               <div className="rounded-md border border-border bg-secondary p-2">
//                 <p className="text-xs text-muted-foreground">Skipped</p>
//                 <p className="font-semibold">{skiped.length}</p>
//               </div>
//               <div className="rounded-md border border-border bg-secondary p-2">
//                 <p className="text-xs text-muted-foreground">Remaining</p>
//                 <p className="font-semibold">
//                   {Math.max(totalQuestions - answeredCount, 0)}
//                 </p>
//               </div>
//             </div>

//             <div className="mb-3 flex flex-wrap gap-2 text-xs">
//               <span className="rounded-md bg-primary/15 px-2 py-1 text-primary">
//                 Current
//               </span>
//               <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-700">
//                 Answered
//               </span>
//               <span className="rounded-md bg-rose-500/15 px-2 py-1 text-rose-700">
//                 Skipped
//               </span>
//             </div>

//             <div className="grid grid-cols-5 gap-2">
//               {que.map((data, index) => {
//                 const qid = data.question_id;
//                 const isCurrent = currentIndex === index;
//                 const isAnswered = Boolean(formik.values.answer?.[qid]);
//                 const isSkipped = skippedSet.has(qid) && !isAnswered;

//                 return (
//                   <button
//                     id={`numbox_${index}`}
//                     className={`h-9 rounded-md border text-sm font-semibold transition ${
//                       isCurrent
//                         ? "border-primary bg-primary text-primary-foreground"
//                         : isAnswered
//                           ? "border-emerald-600 bg-emerald-600/15 text-emerald-700"
//                           : isSkipped
//                             ? "border-rose-600 bg-rose-600/15 text-rose-700"
//                             : "border-border bg-secondary text-secondary-foreground hover:border-primary/60"
//                     }`}
//                     onClick={() => handlequejump(index)}
//                     key={index}
//                     type="button"
//                   >
//                     {index + 1}
//                   </button>
//                 );
//               })}
//             </div>
//           </aside>

//           <section className="surface">
//             <div className="grid w-full grid-cols-1 overflow-hidden rounded-t-2xl border-b border-border md:grid-cols-3">
//               <div className="bg-secondary p-4">
//                 <p className="text-xs text-muted-foreground">Date</p>
//                 <p className="text-sm font-semibold">
//                   {new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}
//                 </p>
//               </div>
//               <div className="border-x border-border bg-background p-4">
//                 <p className="text-center text-xs text-muted-foreground">
//                   Time Remaining
//                 </p>
//                 <div className="mt-1 flex justify-center gap-3 text-center">
//                   <p className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold">
//                     {formatTimehr(timeLeft)}h
//                   </p>
//                   <p className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold">
//                     {formatTimeMin(timeLeft)}m
//                   </p>
//                   <p className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold">
//                     {formatTimeSec(timeLeft)}s
//                   </p>
//                 </div>
//               </div>
//               <div className="bg-secondary p-4 text-right">
//                 <p className="text-xs text-muted-foreground">Total Marks</p>
//                 <p className="text-sm font-semibold">0</p>
//               </div>
//             </div>

//             <div className="p-5 md:p-6">
//               <div className="mb-4 flex items-center justify-between">
//                 <h2 className="text-base font-semibold text-primary md:text-lg">
//                   Question {currentIndex + 1} of {totalQuestions || 0}
//                 </h2>
//                 {language ? (
//                   <p className="rounded-md bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                     Language: {language}
//                   </p>
//                 ) : null}
//               </div>

//               <div className="rounded-xl border border-border bg-background p-4">
//                 <div
//                   className="max-w-none text-sm leading-relaxed text-foreground [&_img]:max-h-48 [&_img]:rounded-md [&_p]:mb-2 [&_p:last-child]:mb-0"
//                   dangerouslySetInnerHTML={{
//                     __html: que[currentIndex]?.question,
//                   }}
//                 />
//               </div>
//               {console.log(
//                 "que[currentIndex]",
//                 currentIndex,
//                 que[currentIndex],
//               )}

//               <RadioGroup
//                 key={questionId}
//                 onValueChange={(val) => handleAnswer(val)}
//                 value={formik.values.answer?.[questionId] || ""}
//                 className="mt-5 space-y-3"
//               >
//                 {validOptions.length > 0 ? (
//                   validOptions.map((opt, i) => (
//                     <Label
//                       htmlFor={`option-${questionId}-${i}`}
//                       className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 transition hover:border-primary/50 hover:bg-secondary"
//                       key={opt.value}
//                     >
//                       <RadioGroupItem
//                         value={opt.value}
//                         id={`option-${questionId}-${i}`}
//                         className="mt-1"
//                       />
//                       <span className="text-sm leading-6">{opt.label}</span>
//                     </Label>
//                   ))
//                 ) : (
//                   <div
//                     ref={editorRef}
//                     key={questionId}
//                     contentEditable
//                     suppressContentEditableWarning
//                     className="mt-2 min-h-[140px] w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
//                     onBlur={(e) =>
//                       formik.setFieldValue("answer", {
//                         ...formik.values.answer,
//                         [questionId]: e.currentTarget.innerText,
//                       })
//                     }
//                   />
//                 )}
//               </RadioGroup>

//               {formik.errors.answer && (
//                 <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
//                   {typeof formik.errors.answer === "string"
//                     ? formik.errors.answer
//                     : formik.errors.answer[que[currentIndex]?.id] ||
//                       "Please answer the question"}
//                 </div>
//               )}
//             </div>

//             <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
//               <div className="flex flex-wrap gap-2">
//                 <Button
//                   onClick={() => handlePrevious()}
//                   className="primary-action px-4"
//                   disabled={currentIndex === 0}
//                 >
//                   Previous
//                 </Button>
//                 <Button
//                   onClick={() => handleNext()}
//                   className="primary-action px-4 cursor-pointer"
//                 >
//                   Next
//                 </Button>
//                 <Button
//                   onClick={() => handleSkip()}
//                   className="bg-secondary px-4 text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
//                   disabled={currentIndex + 1 === que.length}
//                 >
//                   Skip
//                 </Button>
//               </div>
//               <Button
//                 type="submit"
//                 onClick={formik.handleSubmit}
//                 className="bg-destructive px-6 text-white hover:bg-destructive/90 cursor-pointer"
//               >
//                 Finish Exam
//               </Button>
//             </div>
//           </section>
//         </div>
//       )}
//     </>
//   );
// }
export default function ExamPage() {
  return (
    <Suspense fallback={<LoadingExam />}>
      <ExamPageContent />
    </Suspense>
  );
}
