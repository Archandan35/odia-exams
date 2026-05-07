import React, {
  useEffect,
  useMemo,
  useState,
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

  const [questions,
    setQuestions] =
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

  const [showGuide,
    setShowGuide] =
    useState(false);

  const [failedImports,
    setFailedImports] =
    useState([]);

  const [validation,
    setValidation] =
    useState({

      total: 0,
      valid: 0,
      duplicates: 0,
      invalid: 0,

    });

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

  function normalizeAnswer(
    answer
  ) {

    if (
      answer === undefined ||
      answer === null ||
      answer === ""
    ) {

      return null;

    }

    const ans =
      String(answer)
        .trim()
        .toUpperCase();

    if (ans === "A")
      return 0;

    if (ans === "B")
      return 1;

    if (ans === "C")
      return 2;

    if (ans === "D")
      return 3;

    if (ans === "0")
      return 0;

    if (ans === "1")
      return 1;

    if (ans === "2")
      return 2;

    if (ans === "3")
      return 3;

    return null;

  }

  function processQuestions(
    data
  ) {

    const seen =
      new Set();

    let duplicates =
      0;

    const cleaned =
      data.filter(
        (q) => {

          if (
            !q.question
          ) {

            return false;

          }

          const key =
            q.question
              .trim()
              .toLowerCase();

          if (
            seen.has(key)
          ) {

            duplicates++;

            return false;

          }

          seen.add(key);

          return true;

        }
      );

    setValidation({

      total:
        data.length,

      valid:
        cleaned.length,

      duplicates,

      invalid:
        data.length -
        cleaned.length -
        duplicates,

    });

    setQuestions(
      cleaned
    );

    toast.success(
      `${cleaned.length} Questions Loaded`
    );

  }

  function handleCSVUpload(
    e
  ) {

    const file =
      e.target.files[0];

    if (!file)
      return;

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
                q.difficulty || "",

              language:
                q.language || "",

              explanation:
                q.explanation || "",

            })
          );

        processQuestions(
          parsed
        );

      },

    });

  }

  function handleJSONUpload(
    e
  ) {

    const file =
      e.target.files[0];

    if (!file)
      return;

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

                question:
                  q.question || "",

                options:
                  q.options || [
                    "",
                    "",
                    "",
                    "",
                  ],

                correctAnswer:
                  normalizeAnswer(
                    q.correctAnswer
                  ),

                difficulty:
                  q.difficulty || "",

                language:
                  q.language || "",

                explanation:
                  q.explanation || "",

              })
            );

          processQuestions(
            parsed
          );

        } catch (error) {

          console.log(
            error
          );

          toast.error(
            "Invalid JSON"
          );

        }

      };

    reader.readAsText(
      file
    );

  }

  function handleExcelUpload(
    e
  ) {

    const file =
      e.target.files[0];

    if (!file)
      return;

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
                q.difficulty || "",

              language:
                q.language || "",

              explanation:
                q.explanation || "",

            })
          );

        processQuestions(
          parsed
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

    const updated =
      [...questions];

    updated[index][field] =
      value;

    setQuestions(
      updated
    );

  }

  function updateOption(
    qIndex,
    opIndex,
    value
  ) {

    const updated =
      [...questions];

    updated[qIndex]
      .options[
        opIndex
      ] = value;

    setQuestions(
      updated
    );

  }

  async function importQuestions() {

    if (
      questions.length === 0
    ) {

      toast.error(
        "No Questions"
      );

      return;

    }

    try {

      setLoading(true);

      setProgress(0);

      const chunkSize =
        400;

      for (
        let i = 0;
        i <
        questions.length;
        i += chunkSize
      ) {

        const batch =
          writeBatch(
            db
          );

        const chunk =
          questions.slice(
            i,
            i +
              chunkSize
          );

        chunk.forEach(
          (q) => {

            const ref =
              doc(
                collection(
                  db,
                  "questions"
                )
              );

            batch.set(
              ref,
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
                  q.correctAnswer,

                difficulty:
                  q.difficulty,

                language:
                  q.language,

                explanation:
                  q.explanation,

                createdAt:
                  Date.now(),

              }
            );

          }
        );

        await batch.commit();

        setProgress(

          Math.round(

            ((i +
              chunk.length) /
              questions.length) *
              100

          )

        );

      }

      toast.success(
        "Questions Imported"
      );

    } catch (error) {

      console.log(
        error
      );

      toast.error(
        "Import Failed"
      );

    }

    setLoading(false);

  }

  function exportCSV() {

    const rows =
      questions.map(
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
            ["A",
              "B",
              "C",
              "D"][
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
      Papa.unparse(
        rows
      );

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
      questions.map(
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
            ["A",
              "B",
              "C",
              "D"][
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
          bookType:
            "xlsx",
          type:
            "array",
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
    useMemo(() => {

      return questions.filter(
        (q) =>
          q.question
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

    }, [
      questions,
      search,
    ]);

  return (

    <AdminLayout>

      <div className="bulk-page">

        <div className="bulk-topbar">

          <div>

            <h1>
              Bulk Import
            </h1>

            <p>
              Import questions from CSV, Excel, JSON, PDF or Image
            </p>

          </div>

          <button
            className="help-btn"
            onClick={() =>
              setShowGuide(
                true
              )
            }
          >

            ? Help & Format Guide

          </button>

        </div>

      </div>

    </AdminLayout>

  );

}
