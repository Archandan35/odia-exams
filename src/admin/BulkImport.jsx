async function handleImageOCR(e) {

  const files = Array.from(e.target.files);

  if (!files.length) return;

  try {

    setLoading(true);

    toast.loading(
      `Uploading ${files.length} image(s)...`
    );

    let allQuestions = [];

    for (const file of files) {

      // Convert image to base64
      const base64Image =
        await new Promise((resolve, reject) => {

          const reader = new FileReader();

          reader.readAsDataURL(file);

          reader.onload = () =>
            resolve(reader.result);

          reader.onerror = (error) =>
            reject(error);

        });

      // Send to Railway Gemini OCR API
      const response = await fetch(
        "https://odia-exam.up.railway.app/api/gemini-ocr",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            image: base64Image,
          }),
        }
      );

      const data =
        await response.json();

      console.log(data);

      // Extract parsed questions
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

    if (allQuestions.length === 0) {

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
