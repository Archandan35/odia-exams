import {
  useState,
  useEffect,
} from "react";

import {
  collection,
  onSnapshot,
  addDoc,
} from "firebase/firestore";

import Papa from "papaparse";

import toast from "react-hot-toast";

import {
  db,
} from "../firebase/config";

import Tesseract from "tesseract.js";

import * as pdfjsLib from "pdfjs-dist";

import { saveAs } from "file-saver";

import { parseMCQ } from "../utils/ocrParser";

import AdminLayout from "./AdminLayout";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function BulkImport() {

  const [subjects, setSubjects] =
    useState([]);

  const [topics, setTopics] =
    useState([]);

  const [subTopics, setSubTopics] =
    useState([]);

  const [selectedSubject,
    setSelectedSubject] =
    useState("");

  const [selectedTopic,
    setSelectedTopic] =
    useState("");

  const [selectedSubTopic,
    setSelectedSubTopic] =
    useState("");

  const [ocrLanguage,
    setOcrLanguage] =
    useState("eng");

  const [previewQuestions,
    setPreviewQuestions] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  useEffect(() => {

    const unsubSubjects =
      onSnapshot(
        collection(db, "subjects"),
        (snapshot) => {

          setSubjects(
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubTopics =
      onSnapshot(
        collection(db, "topics"),
        (snapshot) => {

          setTopics(
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubSubTopics =
      onSnapshot(
        collection(db, "subtopics"),
        (snapshot) => {

          setSubTopics(
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    return () => {

      unsubSubjects();
      unsubTopics();
      unsubSubTopics();

    };

  }, []);

  const filteredTopics =
    topics.filter(
      (t) =>
        t.subjectId ===
        selectedSubject
    );

  const filteredSubTopics =
    subTopics.filter(
      (s) =>
        s.subjectId === selectedSubject &&
        s.topicId === selectedTopic
    );

  async function handleImageOCR(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    try {

      setLoading(true);

      toast.loading(
        "Running OCR..."
      );

      const result =
        await Tesseract.recognize(
          file,
          ocrLanguage,
          {
            logger: (m) =>
              console.log(m),
          }
        );

      const parsed =
        parseMCQ(
          result.data.text
        );

      setPreviewQuestions(parsed);

      toast.dismiss();

      if (parsed.length === 0) {

        toast.error(
          "No Questions Parsed"
        );

      } else {

        toast.success(
          `${parsed.length} Questions Parsed`
        );

      }

    } catch (error) {

      console.log(error);

      toast.dismiss();

      toast.error(
        "OCR Failed"
      );

    }

    setLoading(false);

  }

  async function handlePDFOCR(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    try {

      setLoading(true);

      toast.loading(
        "Reading PDF..."
      );

      const arrayBuffer =
        await file.arrayBuffer();

      const pdf =
        await pdfjsLib
          .getDocument({
            data: arrayBuffer,
          }).promise;

      let fullText = "";

      for (
        let pageNum = 1;
        pageNum <= pdf.numPages;
        pageNum++
      ) {

        const page =
          await pdf.getPage(pageNum);

        const content =
          await page.getTextContent();

        const strings =
          content.items.map(
            (item) => item.str
          );

        fullText +=
          "\n" +
          strings.join(" ");

      }

      const parsed =
        parseMCQ(fullText);

      setPreviewQuestions(parsed);

      toast.dismiss();

      if (parsed.length === 0) {

        toast.error(
          "No Questions Parsed"
        );

      } else {

        toast.success(
          `${parsed.length} Questions Parsed`
        );

      }

    } catch (error) {

      console.log(error);

      toast.dismiss();

      toast.error(
        "PDF Import Failed"
      );

    }

    setLoading(false);

  }

  function handleCSVUpload(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    Papa.parse(file, {

      header: true,

      skipEmptyLines: true,

      complete: (results) => {

        const parsed =
          results.data.map(
            (q) => ({

              question:
                q.question || "",

              options: [

                q.optionA || "",
                q.optionB || "",
                q.optionC || "",
                q.optionD || "",

              ],

              correctAnswer:
                Number(
                  q.correctAnswer || 0
                ),

              difficulty:
                q.difficulty || "easy",

              language:
                q.language || "english",

              explanation:
                q.explanation || "",

            })
          );

        setPreviewQuestions(parsed);

        toast.success(
          "CSV Imported"
        );

      },

    });

  }

  function handleJSONUpload(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload =
      (event) => {

        try {

          const json =
            JSON.parse(
              event.target.result
            );

          setPreviewQuestions(json);

          toast.success(
            "JSON Imported"
          );

        } catch (error) {

          console.log(error);

          toast.error(
            "Invalid JSON"
          );

        }

      };

    reader.readAsText(file);

  }

  function exportJSON() {

    const blob =
      new Blob(
        [
          JSON.stringify(
            previewQuestions,
            null,
            2
          ),
        ],
        {
          type:
            "application/json",
        }
      );

    saveAs(
      blob,
      "questions.json"
    );

  }

  function exportCSV() {

    const rows = [[

      "question",
      "optionA",
      "optionB",
      "optionC",
      "optionD",
      "correctAnswer",
      "difficulty",
      "language",
      "explanation",

    ]];

    previewQuestions.forEach((q) => {

      rows.push([

        q.question,

        q.options?.[0] || "",

        q.options?.[1] || "",

        q.options?.[2] || "",

        q.options?.[3] || "",

        q.correctAnswer,

        q.difficulty || "",

        q.language || "",

        q.explanation || "",

      ]);

    });

    const csv =
      rows.map(
        (r) => r.join(",")
      ).join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type: "text/csv",
        }
      );

    saveAs(
      blob,
      "questions.csv"
    );

  }

  async function handleSaveQuestions() {

    if (
      previewQuestions.length === 0
    ) {

      toast.error(
        "No Questions"
      );

      return;

    }

    if (
      !selectedSubject ||
      !selectedTopic ||
      !selectedSubTopic
    ) {

      toast.error(
        "Select Subject Hierarchy"
      );

      return;

    }

    try {

      setLoading(true);

      for (const q of previewQuestions) {

        await addDoc(
          collection(
            db,
            "questions"
          ),
          {

            subjectId:
              selectedSubject,

            topicId:
              selectedTopic,

            subTopicId:
              selectedSubTopic,

            question:
              q.question,

            options:
              q.options,

            correctAnswer:
              Number(
                q.correctAnswer || 0
              ),

            difficulty:
              q.difficulty || "easy",

            language:
              q.language || "english",

            explanation:
              q.explanation || "",

            createdAt:
              Date.now(),

          }
        );

      }

      toast.success(
        `${previewQuestions.length} Questions Imported`
      );

      setPreviewQuestions([]);

    } catch (error) {

      console.log(error);

      toast.error(
        "Import Failed"
      );

    }

    setLoading(false);

  }

  return (

    <AdminLayout>

      <div className="page">

        <div className="page-header">

          <div>

            <h2>
              Multilingual OCR Import
            </h2>

            <p>
              OCR + CSV + JSON Bulk Question System
            </p>

          </div>

        </div>

        <div className="glass-card">

          <h3>
            OCR Language
          </h3>

          <select
            value={ocrLanguage}
            onChange={(e) =>
              setOcrLanguage(
                e.target.value
              )
            }
          >

            <option value="eng">
              English
            </option>

            <option value="hin">
              Hindi
            </option>

            <option value="eng+hin">
              English + Hindi
            </option>

          </select>

        </div>

        <div
          className="glass-card"
          style={{
            marginTop: "25px",
            padding: "25px",
          }}
        >

          <h3>
            CSV Upload Format
          </h3>

          <pre
            style={{
              marginTop: "15px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >

{`question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,language,explanation

What is 2+2?,2,3,4,5,2,easy,english,2+2=4`}

          </pre>

          <h3
            style={{
              marginTop: "30px",
            }}
          >
            JSON Upload Format
          </h3>

          <pre
            style={{
              marginTop: "15px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >

{`[
  {
    "question":"What is 2+2?",
    "options":[
      "2",
      "3",
      "4",
      "5"
    ],
    "correctAnswer":2,
    "difficulty":"easy",
    "language":"english",
    "explanation":"2+2 = 4"
  }
]`}

          </pre>

        </div>

        <div className="import-grid">

          <div className="import-card">

            <h3>
              Image OCR
            </h3>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleImageOCR
              }
            />

          </div>

          <div className="import-card">

            <h3>
              PDF OCR
            </h3>

            <input
              type="file"
              accept=".pdf"
              onChange={
                handlePDFOCR
              }
            />

          </div>

          <div className="import-card">

            <h3>
              CSV Upload
            </h3>

            <input
              type="file"
              accept=".csv"
              onChange={
                handleCSVUpload
              }
            />

          </div>

          <div className="import-card">

            <h3>
              JSON Upload
            </h3>

            <input
              type="file"
              accept=".json"
              onChange={
                handleJSONUpload
              }
            />

          </div>

        </div>

        <div
          className="glass-card"
          style={{
            marginTop: "25px",
            padding: "25px",
          }}
        >

          <h3>
            Select Subject Hierarchy
          </h3>

          <div className="filter-bar">

            <select
              value={selectedSubject}
              onChange={(e) =>
                setSelectedSubject(
                  e.target.value
                )
              }
            >

              <option value="">
                Subject
              </option>

              {
                subjects.map((s) => (

                  <option
                    key={s.id}
                    value={s.id}
                  >
                    {s.name}
                  </option>

                ))
              }

            </select>

            <select
              value={selectedTopic}
              onChange={(e) =>
                setSelectedTopic(
                  e.target.value
                )
              }
            >

              <option value="">
                Topic
              </option>

              {
                filteredTopics.map((t) => (

                  <option
                    key={t.id}
                    value={t.id}
                  >
                    {t.name}
                  </option>

                ))
              }

            </select>

            <select
              value={selectedSubTopic}
              onChange={(e) =>
                setSelectedSubTopic(
                  e.target.value
                )
              }
            >

              <option value="">
                SubTopic
              </option>

              {
                filteredSubTopics.map((s) => (

                  <option
                    key={s.id}
                    value={s.id}
                  >
                    {s.name}
                  </option>

                ))
              }

            </select>

          </div>

        </div>

        {
          previewQuestions.length > 0 && (

            <div
              className="table-card"
              style={{
                marginTop: "25px",
              }}
            >

              <div className="page-header">

                <div>

                  <h2>
                    Parsed Questions
                  </h2>

                  <p>
                    Verify Before Import
                  </p>

                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                  }}
                >

                  <button
                    onClick={
                      exportJSON
                    }
                  >
                    Export JSON
                  </button>

                  <button
                    onClick={
                      exportCSV
                    }
                  >
                    Export CSV
                  </button>

                  <button
                    className="submit-btn"
                    onClick={
                      handleSaveQuestions
                    }
                    disabled={loading}
                  >

                    {
                      loading
                        ? "Importing..."
                        : "Confirm Import"
                    }

                  </button>

                </div>

              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >

                {
                  previewQuestions.map(
                    (q, index) => (

                      <div
                        key={index}
                        className="question-review-card"
                      >

                        <h3>

                          Q{index + 1}.
                          {" "}
                          {q.question}

                        </h3>

                        <div className="review-options">

                          {
                            q.options?.map(
                              (op, i) => (

                                <div
                                  key={i}
                                  className="review-option"
                                >

                                  <b>
                                    {
                                      String.fromCharCode(
                                        65 + i
                                      )
                                    }
                                    )
                                  </b>

                                  {" "}
                                  {op}

                                </div>

                              )
                            )
                          }

                        </div>

                        <p>

                          <b>
                            Correct:
                          </b>

                          {" "}

                          {
                            String.fromCharCode(
                              65 +
                              (
                                q.correctAnswer || 0
                              )
                            )
                          }

                        </p>

                        <p>

                          <b>
                            Language:
                          </b>

                          {" "}

                          {q.language}

                        </p>

                      </div>

                    )
                  )
                }

              </div>

            </div>

          )
        }

      </div>

    </AdminLayout>

  );

}
