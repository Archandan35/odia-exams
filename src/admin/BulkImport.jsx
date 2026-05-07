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

import * as pdfjsLib from "pdfjs-dist";

import { saveAs } from "file-saver";

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

    const files = Array.from(
      e.target.files
    );

    if (!files.length) return;

    try {

      setLoading(true);

      toast.loading(
        `Uploading ${files.length} image(s)...`
      );

      let allQuestions = [];

      for (const file of files) {

        const base64Image =
          await new Promise(
            (resolve, reject) => {

              const reader =
                new FileReader();

              reader.readAsDataURL(file);

              reader.onload = () =>
                resolve(reader.result);

              reader.onerror = (
                error
              ) =>
                reject(error);

            }
          );

        const response =
          await fetch(
            "https://odia-exam.up.railway.app/api/gemini-ocr",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                image: base64Image,
              }),
            }
          );

        const data =
          await response.json();

        console.log(data);

        const questions =
          data.questions || [];

        allQuestions = [
          ...allQuestions,
          ...questions,
        ];

      }

      setPreviewQuestions(
        allQuestions
      );

      toast.dismiss();

      if (
        allQuestions.length === 0
      ) {

        toast.error(
          "No Questions Parsed"
        );

      } else {

        toast.success(
          `${allQuestions.length} Questions Parsed`
        );

      }

    } catch (error) {

      console.log(error);

      toast.dismiss();

      toast.error(
        "Gemini OCR Failed"
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

      toast.dismiss();

      toast.success(
        "PDF Text Extracted"
      );

      console.log(fullText);

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
              Gemini OCR Bulk Import
            </h2>

            <p>
              Image + PDF + CSV + JSON Question Import
            </p>

          </div>

        </div>

        <div className="import-grid">

          <div className="import-card">

            <h3>
              Bulk Image OCR
            </h3>

            <input
              type="file"
              accept="image/*"
              multiple
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

      </div>

    </AdminLayout>

  );

}
