import { useEffect, useState } from "react";

import ExamPageDesktop from "./ExamPageDesktop";
import ExamPagePhone from "./ExamPagePhone";

export default function ExamPage() {

  const [mobile, setMobile] =
    useState(window.innerWidth <= 768);

  useEffect(() => {

    const resize = () => {
      setMobile(window.innerWidth <= 768);
    };

    window.addEventListener(
      "resize",
      resize
    );

    return () =>
      window.removeEventListener(
        "resize",
        resize
      );

  }, []);

  return mobile
    ? <ExamPagePhone />
    : <ExamPageDesktop />;
}
