import React, {
  useState,
  useEffect,
} from "react";

import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import Papa from "papaparse";

import * as XLSX from "xlsx/xlsx.mjs";

import toast from "react-hot-toast";

import { saveAs } from "file-saver";

import * as pdfjsLib from "pdfjs-dist";

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

  const [previewQuestions,
    setPreviewQuestions] =
    useState([]);

  const [failedQuestions,
    setFailedQuestions] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  const [progress,
    setProgress] =
    useState(0);

  const [search,
    setSearch] =
    useState("");

  const [validationReport,
    setValidationReport] =
    useState(null);

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

  function normalizeAnswer(ans) {

    const value =
      String(ans || "")
        .trim()
        .toUpperCase();

    if (value === "A")
      return 0;

    if (value === "B")
      return 1;

    if (value === "C")
      return 2;

    if (value === "D")
      return 3;

    if (
      value === "0" ||
      value === "1" ||
      value === "2" ||
      value === "3"
    ) {

      return Number(value);

    }

    return 0;

  }

  function validateQuestions(data) {

    let valid = 0;

    let invalid = 0;

    const duplicateMap = {};

    const cleaned =
      data.filter((q) => {

        const key =
          q.question
            ?.trim()
            ?.toLowerCase();

        if (!key)
          return false;

        if (
          duplicateMap[key]
        ) {

          invalid++;

          return false;

        }

        duplicateMap[key] =
          true;

        valid++;

        return true;

      });

    setValidationReport({
      total:
        data.length,

      valid,

      invalid,

      duplicates:
        data.length -
        cleaned.length,
    });

    return cleaned;

  }

  function handleCSVUpload(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    Papa.parse(file, {

      header: true,

      skipEmptyLines: true,

      complete: (
        results
      ) => {

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
                normalizeAnswer(
                  q.correctAnswer
                ),

              difficulty:
                q.difficulty ||
                "easy",

              language:
                q.language ||
                "english",

              explanation:
                q.explanation ||
                "",

            })
          );

        const cleaned =
          validateQuestions(
            parsed
          );

        setPreviewQuestions(
          cleaned
        );

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

          const parsed =
            json.map(
              (q) => ({

                ...q,

                correctAnswer:
                  normalizeAnswer(
                    q.correctAnswer
                  ),

              })
            );

          const cleaned =
            validateQuestions(
              parsed
            );

          setPreviewQuestions(
            cleaned
          );

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

  function handleExcelUpload(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload =
      (evt) => {

        const data =
          new Uint8Array(
            evt.target.result
          );

        const workbook =
          XLSX.read(data, {
            type: "array",
          });

        const sheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];

        const json =
          XLSX.utils.sheet_to_json(
            sheet
          );

        const parsed =
          json.map(
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
                normalizeAnswer(
                  q.correctAnswer
                ),

              difficulty:
                q.difficulty ||
                "easy",

              language:
                q.language ||
                "english",

              explanation:
                q.explanation ||
                "",

            })
          );

        const cleaned =
          validateQuestions(
            parsed
          );

        setPreviewQuestions(
          cleaned
        );

        toast.success(
          "Excel Imported"
        );

      };

    reader.readAsArrayBuffer(
      file
    );

  }

  function updateQuestion(
    index,
    field,
    value
  ) {

    const updated = [
      ...previewQuestions,
    ];

    updated[index][field] =
      value;

    setPreviewQuestions(
      updated
    );

  }

  function updateOption(
    qIndex,
    opIndex,
    value
  ) {

    const updated = [
      ...previewQuestions,
    ];

    updated[qIndex]
      .options[opIndex] =
      value;

    setPreviewQuestions(
      updated
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

      setProgress(0);

      const failed = [];

      const chunkSize = 400;

      for (
        let i = 0;
        i <
        previewQuestions.length;
        i += chunkSize
      ) {

        const chunk =
          previewQuestions.slice(
            i,
            i + chunkSize
          );

        const batch =
          writeBatch(db);

        chunk.forEach(
          (q) => {

            try {

              const ref =
                doc(
                  collection(
                    db,
                    "questions"
                  )
                );

              batch.set(ref, {

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
                    q.correctAnswer
                  ),

                difficulty:
                  q.difficulty,

                language:
                  q.language,

                explanation:
                  q.explanation,

                createdAt:
                  Date.now(),

              });

            } catch (error) {

              failed.push(q);

            }

          }
        );

        await batch.commit();

        const percent =
          Math.round(

            ((i +
              chunk.length) /
              previewQuestions.length) *
            100

          );

        setProgress(
          percent
        );

      }

      setFailedQuestions(
        failed
      );

      toast.success(
        `${previewQuestions.length} Questions Imported`
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Import Failed"
      );

    }

    setLoading(false);

  }

  function retryFailedImports() {

    setPreviewQuestions(
      failedQuestions
    );

    toast.success(
      "Retry Queue Loaded"
    );

  }

  function exportCSV() {

    const rows =
      previewQuestions.map(
        (q) => ({

          question:
            q.question,

          optionA:
            q.options[0],

          optionB:
            q.options[1],

          optionC:
            q.options[2],

          optionD:
            q.options[3],

          correctAnswer:
            ["A", "B", "C", "D"][
              q.correctAnswer
            ],

          difficulty:
            q.difficulty,

          language:
            q.language,

          explanation:
            q.explanation,

        })
      );

    const csv =
      Papa.unparse(rows);

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    saveAs(
      blob,
      "questions.csv"
    );

  }

  function exportExcel() {

    const rows =
      previewQuestions.map(
        (q) => ({

          question:
            q.question,

          optionA:
            q.options[0],

          optionB:
            q.options[1],

          optionC:
            q.options[2],

          optionD:
            q.options[3],

          correctAnswer:
            ["A", "B", "C", "D"][
              q.correctAnswer
            ],

          difficulty:
            q.difficulty,

          language:
            q.language,

          explanation:
            q.explanation,

        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Questions"
    );

    const excelBuffer =
      XLSX.write(
        workbook,
        {
          bookType: "xlsx",
          type: "array",
        }
      );

    const blob =
      new Blob(
        [excelBuffer],
        {
          type:
            "application/octet-stream",
        }
      );

    saveAs(
      blob,
      "questions.xlsx"
    );

  }

  const filteredQuestions =
    previewQuestions.filter(
      (q) =>
        q.question
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (

    <AdminLayout>

      <div className="page">

        <div className="page-header">

          <div>

            <h2>
              Advanced Bulk Import
            </h2>

            <p>
              CSV + JSON + Excel + OCR
            </p>

          </div>

        </div>

        <div className="import-grid">

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

          <div className="import-card">

            <h3>
              Excel Upload
            </h3>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={
                handleExcelUpload
              }
            />

          </div>

        </div>

        <div
          className="glass-card"
          style={{
            marginTop: 20,
            padding: 20,
          }}
        >

          <h3>
            Subject Hierarchy
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
                subjects.map(
                  (s) => (

                    <option
                      key={s.id}
                      value={s.id}
                    >
                      {s.name}
                    </option>

                  )
                )
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
                filteredTopics.map(
                  (t) => (

                    <option
                      key={t.id}
                      value={t.id}
                    >
                      {t.name}
                    </option>

                  )
                )
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
                filteredSubTopics.map(
                  (s) => (

                    <option
                      key={s.id}
                      value={s.id}
                    >
                      {s.name}
                    </option>

                  )
                )
              }

            </select>

          </div>

        </div>

        {
          validationReport && (

            <div
              className="glass-card"
              style={{
                marginTop: 20,
                padding: 20,
              }}
            >

              <h3>
                Validation Report
              </h3>

              <p>
                Total:
                {" "}
                {validationReport.total}
              </p>

              <p>
                Valid:
                {" "}
                {validationReport.valid}
              </p>

              <p>
                Invalid:
                {" "}
                {validationReport.invalid}
              </p>

              <p>
                Duplicates Removed:
                {" "}
                {validationReport.duplicates}
              </p>

            </div>

          )
        }

        {
          loading && (

            <div
              style={{
                marginTop: 20,
              }}
            >

              <div
                style={{
                  width: "100%",
                  height: 20,
                  background: "#ddd",
                  borderRadius: 10,
                }}
              >

                <div
                  style={{
                    width:
                      `${progress}%`,
                    height: "100%",
                    background:
                      "#22c55e",
                    borderRadius: 10,
                    transition:
                      "0.3s",
                  }}
                />

              </div>

              <p>
                {progress}%
              </p>

            </div>

          )
        }

        {
          previewQuestions.length > 0 && (

            <div
              className="table-card"
              style={{
                marginTop: 20,
              }}
            >

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 20,
                }}
              >

                <input
                  type="text"
                  placeholder="Search Questions"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

                <button
                  className="submit-btn"
                  onClick={
                    exportCSV
                  }
                >
                  Export CSV
                </button>

                <button
                  className="submit-btn"
                  onClick={
                    exportExcel
                  }
                >
                  Export Excel
                </button>

                <button
                  className="submit-btn"
                  onClick={() =>
                    setPreviewQuestions(
                      []
                    )
                  }
                >
                  Clear
                </button>

                <button
                  className="submit-btn"
                  onClick={
                    handleSaveQuestions
                  }
                >
                  Import
                </button>

                {
                  failedQuestions.length >
                    0 && (

                    <button
                      className="submit-btn"
                      onClick={
                        retryFailedImports
                      }
                    >
                      Retry Failed
                    </button>

                  )
                }

              </div>

              {
                filteredQuestions.map(
                  (
                    q,
                    index
                  ) => (

                    <div
                      key={index}
                      className="question-review-card"
                      style={{
                        marginBottom: 20,
                        padding: 20,
                        border:
                          "1px solid #ddd",
                        borderRadius: 10,
                      }}
                    >

                      <textarea
                        value={
                          q.question
                        }
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            "question",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          minHeight: 80,
                        }}
                      />

                      {
                        q.options.map(
                          (
                            op,
                            opIndex
                          ) => (

                            <div
                              key={
                                opIndex
                              }
                              style={{
                                marginTop: 10,
                              }}
                            >

                              <input
                                type="text"
                                value={op}
                                onChange={(e) =>
                                  updateOption(
                                    index,
                                    opIndex,
                                    e.target.value
                                  )
                                }
                                style={{
                                  width:
                                    "80%",
                                }}
                              />

                              <input
                                type="radio"
                                checked={
                                  q.correctAnswer ===
                                  opIndex
                                }
                                onChange={() =>
                                  updateQuestion(
                                    index,
                                    "correctAnswer",
                                    opIndex
                                  )
                                }
                              />

                            </div>

                          )
                        )
                      }

                      <textarea
                        value={
                          q.explanation
                        }
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            "explanation",
                            e.target.value
                          )
                        }
                        placeholder="Explanation"
                        style={{
                          width: "100%",
                          marginTop: 10,
                        }}
                      />

                    </div>

                  )
                )
              }

            </div>

          )
        }

      </div>

    </AdminLayout>

  );

}
