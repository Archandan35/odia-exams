import { useState } from "react";

import ExamPageDesktop from "./ExamPageDesktop";
import ExamPagePhone from "./ExamPagePhone";

export default function ExamPage() {

  const [isMobile] = useState(
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    )
  );

  return isMobile
    ? <ExamPagePhone />
    : <ExamPageDesktop />;
}
