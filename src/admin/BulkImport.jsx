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
              Image + PDF + CSV + JSON Import
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

          <pre>

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

          <pre>

{`[
  {
    "question":"What is 2+2?",
    "options":["2","3","4","5"],
    "correctAnswer":2,
    "difficulty":"easy",
    "language":"english",
    "explanation":"2+2 = 4"
  }
]`}

          </pre>

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

                </div>

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

                        {
                          q.options?.map(
                            (op, i) => (

                              <div
                                key={i}
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
