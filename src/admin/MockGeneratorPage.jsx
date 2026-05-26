import {
  useEffect,
  useState,
} from "react";

import AdminLayout from "./AdminLayout";

import {
  listenSubjects,
} from "../services/subjectService";

import {
  generateMocks,
  getFilteredQuestions,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage() {

  // =========================================
  // STATES
  // =========================================

  const [subjects,
    setSubjects] =
      useState([]);

  const [mockType,
    setMockType] =
      useState("full");

  const [subjectId,
    setSubjectId] =
      useState("");

  const [topicId,
    setTopicId] =
      useState("");

  const [subTopicId,
    setSubTopicId] =
      useState("");

  const [quantity,
    setQuantity] =
      useState(100);

  const [duration,
    setDuration] =
      useState(60);

  const [totalQuestions,
    setTotalQuestions] =
      useState(0);

  const [totalMocks,
    setTotalMocks] =
      useState(0);

  const [loading,
    setLoading] =
      useState(false);

  // =========================================
  // LOAD SUBJECTS
  // =========================================

  useEffect(() => {

    const unsubscribe =
      listenSubjects(setSubjects);

    return () => unsubscribe();

  }, []);

  // =========================================
  // LOAD QUESTION STATS
  // =========================================

  useEffect(() => {

    async function loadData() {

      const questions =
        await getFilteredQuestions({

          subjectId,
          topicId,
          subTopicId,

        });

      setTotalQuestions(
        questions.length
      );

      setTotalMocks(

        Math.floor(
          questions.length /
          quantity
        )

      );
    }

    loadData();

  }, [

    subjectId,
    topicId,
    subTopicId,
    quantity,

  ]);

  // =========================================
  // GENERATE
  // =========================================

  async function handleGenerate() {

    if (!subjectId) {

      alert(
        "Please select subject"
      );

      return;
    }

    if (totalMocks <= 0) {

      alert(
        "Not enough questions available"
      );

      return;
    }

    try {

      setLoading(true);

      await generateMocks({

        mockType,

        subjectId,

        topicId,

        subTopicId,

        quantity:
          Number(quantity),

        duration:
          Number(duration),

      });

      alert(
        "Mocks Generated Successfully"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Failed to generate mocks"
      );

    } finally {

      setLoading(false);
    }
  }

  // =========================================
  // UI
  // =========================================

  return (

    <AdminLayout>

      <div className="page">

        {/* HEADER */}

        <div className="page-header">

          <div>

            <h2>
              Mock Generator
            </h2>

            <p>
              Automatically generate
              unique full and sectional
              mocks
            </p>

          </div>

        </div>

        {/* MAIN BOX */}

        <div className="mock-generator-box">

          {/* MOCK TYPE */}

          <div className="form-group">

            <label>
              Mock Type
            </label>

            <select
              value={mockType}
              onChange={(e) =>
                setMockType(
                  e.target.value
                )
              }
            >

              <option value="full">
                Full Mock
              </option>

              <option value="sectional">
                Sectional Mock
              </option>

            </select>

          </div>

          {/* SUBJECT */}

          <div className="form-group">

            <label>
              Subject
            </label>

            <select
              value={subjectId}
              onChange={(e) =>
                setSubjectId(
                  e.target.value
                )
              }
            >

              <option value="">
                Select Subject
              </option>

              {subjects.map((subject) => (

                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>

              ))}

            </select>

          </div>

          {/* TOPIC */}

          <div className="form-group">

            <label>
              Topic
            </label>

            <input
              type="text"
              placeholder="Enter Topic"
              value={topicId}
              onChange={(e) =>
                setTopicId(
                  e.target.value
                )
              }
            />

          </div>

          {/* SUB TOPIC */}

          <div className="form-group">

            <label>
              Sub Topic
            </label>

            <input
              type="text"
              placeholder="Enter Sub Topic"
              value={subTopicId}
              onChange={(e) =>
                setSubTopicId(
                  e.target.value
                )
              }
            />

          </div>

          {/* QUANTITY */}

          <div className="form-group">

            <label>
              Quantity
            </label>

            <div className="custom-input-group">

              <select
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                <option value={100}>
                  100 Questions
                </option>

                <option value={50}>
                  50 Questions
                </option>

                <option value={25}>
                  25 Questions
                </option>

              </select>

              <input
                type="number"
                placeholder="Custom Questions"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </div>

          </div>

          {/* DURATION */}

          <div className="form-group">

            <label>
              Duration
            </label>

            <div className="custom-input-group">

              <select
                value={duration}
                onChange={(e) =>
                  setDuration(
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                <option value={60}>
                  60 mins
                </option>

                <option value={45}>
                  45 mins
                </option>

                <option value={30}>
                  30 mins
                </option>

                <option value={15}>
                  15 mins
                </option>

                <option value={10}>
                  10 mins
                </option>

              </select>

              <input
                type="number"
                placeholder="Custom Duration"
                value={duration}
                onChange={(e) =>
                  setDuration(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </div>

          </div>

          {/* STATS */}

          <div className="stats-box">

            <h3>

              Total Questions Available:
              {" "}
              {totalQuestions}

            </h3>

            <h3>

              Total Mocks To Be Created:
              {" "}
              {totalMocks}

            </h3>

          </div>

          {/* BUTTON */}

          <button
            className="submit-btn"
            onClick={handleGenerate}
            disabled={loading}
          >

            {loading
              ? "Generating..."
              : "Generate Mocks"}

          </button>

        </div>

      </div>

    </AdminLayout>

  );
}
