import {
  useState,
  useEffect,
  useRef,
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

import {
  parseMCQ,
} from "../utils/ocrParser";

import AdminLayout from "./AdminLayout";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function BulkImport() {

  const [subjects,
    setSubjects] =
    useState([]);

  const [topics,
    setTopics] =
    useState([]);

  const [subTopics,
    setSubTopics] =
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

  const [showImportModal,
    setShowImportModal] =
    useState(false);

  const [importProgress,
    setImportProgress] =
    useState(0);

  const [totalImport,
    setTotalImport] =
    useState(0);

  const csvRef =
    useRef();

  const jsonRef =
    useRef();

  const imageRef =
    useRef();

  const pdfRef =
    useRef();

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
        s.subjectId ===
        selectedSubject &&
        s.topicId ===
        selectedTopic
    );

  /* IMAGE OCR */

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

  /* PDF OCR */

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
        await pdfjsLib.getDocument({
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
        "PDF OCR Failed"
      );

    }

    setLoading(false);

  }

  /* CSV */

  function handleCSVUpload(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    Papa.parse(file, {

      header: true,

      skipEmptyLines: true,

      complete: (results) => {

        const parsed =
          results.data.map((q) => ({

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

          }));

        setPreviewQuestions(parsed);

        toast.success(
          `${parsed.length} Questions Imported`
        );

      },

    });

  }

  /* JSON */

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
            `${json.length} Questions Imported`
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

  /* EXPORT JSON */

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

  /* EXPORT CSV */

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

  /* SAVE QUESTIONS */

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

      setShowImportModal(true);

      setImportProgress(0);

      setTotalImport(
        previewQuestions.length
      );

      for (
        let i = 0;
        i < previewQuestions.length;
        i++
      ) {

        const q =
          previewQuestions[i];

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

        setImportProgress(
          i + 1
        );

      }

      toast.success(
        `${previewQuestions.length} Questions Imported`
      );

      /* CLEAR PREVIEW */

      setPreviewQuestions([]);

      /* RESET FILES */

      if (csvRef.current)
        csvRef.current.value = "";

      if (jsonRef.current)
        jsonRef.current.value = "";

      if (imageRef.current)
        imageRef.current.value = "";

      if (pdfRef.current)
        pdfRef.current.value = "";

      setTimeout(() => {

        setShowImportModal(false);

      }, 1200);

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

      {
        showImportModal && (

          <div className="import-modal-overlay">

            <div className="import-modal-card">

              <h2>
                Importing Questions
              </h2>

              <p>
                Please wait...
              </p>

              <div className="import-progress-circle">

                <span>

                  {importProgress}
                  /
                  {totalImport}

                </span>

              </div>

              <div className="import-progress-bar">

                <div
                  className="import-progress-fill"
                  style={{
                    width:
                      `${(
                        importProgress /
                        totalImport
                      ) * 100}%`
                  }}
                />

              </div>

              <p className="import-progress-text">

                {
                  Math.floor(
                    (
                      importProgress /
                      totalImport
                    ) * 100
                  )
                }
                % Completed

              </p>

            </div>

          </div>

        )
      }

      <div className="page">

        <div className="page-header">

          <div>

            <h2>
              Advanced OCR Import
            </h2>

            <p>
              PDF / Image / CSV / JSON
              Bulk Question System
            </p>

          </div>

        </div>

        <div className="import-grid">

          <div className="import-card">

            <h3>
              Image OCR
            </h3>

            <p>
              Upload scanned images
            </p>

            <input
              ref={imageRef}
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

            <p>
              Upload PDF Question Papers
            </p>

            <input
              ref={pdfRef}
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

            <p>
              Bulk CSV Questions
            </p>

            <input
              ref={csvRef}
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

            <p>
              Bulk JSON Questions
            </p>

            <input
              ref={jsonRef}
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
            padding: "25px",
            marginTop: "25px",
          }}
        >

          <h3>
            Select Hierarchy
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
          previewQuestions.length > 0 ? (

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
                            Difficulty:
                          </b>

                          {" "}
                          {q.difficulty}

                        </p>

                      </div>

                    )
                  )
                }

              </div>

            </div>

          ) : (

            <div
              className="glass-card"
              style={{
                marginTop: "25px",
                padding: "60px",
                textAlign: "center",
              }}
            >

              <h2>
                Awaiting New Import
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  color: "#94a3b8",
                }}
              >

                Upload CSV / JSON /
                PDF / Image to begin

              </p>

            </div>

          )
        }

      </div>

    </AdminLayout>

  );

}
