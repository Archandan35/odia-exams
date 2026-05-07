import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import TopNavbar
from "../components/TopNavbar";

export default function Leaderboard(){

  const [results,
    setResults] =
    useState([]);

  const [subjects,
    setSubjects] =
    useState([]);

  useEffect(()=>{

    const unsubResults =
      onSnapshot(
        collection(db,"results"),
        (snapshot)=>{

          const data =
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            );

          data.sort(
            (a,b)=>
              b.score - a.score
          );

          setResults(data);

        }
      );

    const unsubSubjects =
      onSnapshot(
        collection(db,"subjects"),
        (snapshot)=>{

          setSubjects(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    return ()=>{

      unsubResults();
      unsubSubjects();

    };

  },[]);

  function getMedal(index){

    if(index === 0)
      return "🥇";

    if(index === 1)
      return "🥈";

    if(index === 2)
      return "🥉";

    return "🏅";

  }

  function getSubjectName(id){

    const subject =
      subjects.find(
        (s)=>s.id === id
      );

    return subject
      ? subject.name
      : id;

  }

  return(

    <div className="page">

      <TopNavbar/>

      <div className="page-header">

        <div>

          <h2>
            Leaderboard
          </h2>

          <p>
            Realtime Student Ranking
          </p>

        </div>

      </div>

      <div className="table-card">

        <table>

          <thead>

            <tr>

              <th>
                Rank
              </th>

              <th>
                Medal
              </th>

              <th>
                Subject
              </th>

              <th>
                Score
              </th>

              <th>
                Accuracy
              </th>

              <th>
                Cheat Warnings
              </th>

            </tr>

          </thead>

          <tbody>

            {
              results.map(
                (r,index)=>(

                  <tr key={r.id}>

                    <td>
                      #{index + 1}
                    </td>

                    <td>
                      {getMedal(index)}
                    </td>

                    <td>
                      {
                        getSubjectName(
                          r.subjectId
                        )
                      }
                    </td>

                    <td>
                      {r.score}
                    </td>

                    <td>
                      {r.accuracy}%
                    </td>

                    <td>
                      {r.cheatCount || 0}
                    </td>

                  </tr>

                ))
            }

          </tbody>

        </table>

      </div>

    </div>

  );

}
