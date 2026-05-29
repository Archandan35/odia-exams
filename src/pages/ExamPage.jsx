import { useEffect, useState }
from "react";

import ExamPageDesktop
from "./ExamPageDesktop";

import ExamPagePhone
from "./ExamPagePhone";

export default function ExamPage() {

  const [isMobile] =
 useState(
   /Android|iPhone|iPad|iPod/i.test(
     navigator.userAgent
   )
 );

  useEffect(() => {

    const resize = () => {

      setIsMobile(
        window.innerWidth <= 768
      );

    };

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
