import { useEffect, useState }
from "react";

import ExamPageDesktop
from "./ExamPageDesktop";

import ExamPagePhone
from "./ExamPagePhone";

export default function ExamPage() {

  const [isMobile,setIsMobile] =
    useState(window.innerWidth <= 768);

  useEffect(() => {

    const resize = () => {

      setIsMobile(
        window.innerWidth <= 768
      );

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

  return isMobile
    ? <ExamPagePhone />
    : <ExamPageDesktop />;

}
