import {
  useEffect,
  useState,
} from "react";

import {
  generateMocks,
  getFilteredQuestions,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage() {

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

  // =====================================
  // Load question count
  // =====================================

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

  // =====================================
  // Generate
  // =====================================

  async function handleGenerate() {

    await generateMocks({

      mockType,

      subjectId,

      topicId,

      subTopicId,

      quantity,

      duration,

    });

    alert(
      "Mocks Generated Successfully"
    );
  }

  return (

    <div>

      <h2>
        Mock Generator
      </h2>

      {/* Mock Type */}

      <select
        value={mockType}
        onChange={(e)=>
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

      {/* Subject */}

      <input
        placeholder="Subject ID"
        value={subjectId}
        onChange={(e)=>
          setSubjectId(
            e.target.value
          )
        }
      />

      {/* Topic */}

      <input
        placeholder="Topic ID"
        value={topicId}
        onChange={(e)=>
          setTopicId(
            e.target.value
          )
        }
      />

      {/* Sub Topic */}

      <input
        placeholder="Sub Topic ID"
        value={subTopicId}
        onChange={(e)=>
          setSubTopicId(
            e.target.value
          )
        }
      />

      {/* Quantity */}

      <select
        value={quantity}
        onChange={(e)=>
          setQuantity(
            Number(
              e.target.value
            )
          )
        }
      >

        <option value={100}>
          100
        </option>

        <option value={50}>
          50
        </option>

        <option value={25}>
          25
        </option>

      </select>

      {/* Duration */}

      <select
        value={duration}
        onChange={(e)=>
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

      {/* Info */}

      <h3>
        Total Questions Available:
        {totalQuestions}
      </h3>

      <h3>
        Total Mocks To Be Created:
        {totalMocks}
      </h3>

      {/* Button */}

      <button
        onClick={handleGenerate}
      >
        Generate Mocks
      </button>

    </div>
  );
}
