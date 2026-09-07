import React, { useEffect, useState } from "react";
import "./Caunter.css";

const countersData = [
  { target: 15, label: "نمو السكان", suffix: "%", variant: "default" },
  { target: 25847, label: "عقارات متاحه", suffix: "", variant: "default" }, 
  { target: 100, label: "الالتزام بمواعيد التسليم", suffix: "%", variant: "highlight" },
  { target: 1500, label: "المستخدمون النشطون", suffix: "k+", variant: "default" },
];

const CaunterBoxes = () => {
  const [counts, setCounts] = useState(countersData.map(() => 0));

  useEffect(() => {
    const intervals = countersData.map((counter, index) => {
      return setInterval(() => {
        setCounts(prev => {
          const newCounts = [...prev];
          if (newCounts[index] < counter.target) {
            const increment = Math.ceil(counter.target / 200);
            newCounts[index] = Math.min(newCounts[index] + increment, counter.target);
          }
          const done = newCounts.every(
            (count, i) => count >= countersData[i].target
          );
          if (done) {
            intervals.forEach(clearInterval);
          }
          return newCounts;
        });
      }, 20);
    });

    return () => intervals.forEach(clearInterval);
  }, []);

  const formatNumber = (num) => num.toLocaleString();

  return (
    <div className="counter-container">
      {counts.map((count, index) => (
        <div key={index} className={`counter-box ${countersData[index].variant}`}>
          <div className="counter-number">
            {formatNumber(count)}{countersData[index].suffix}
          </div>
          <div className="counter-label">{countersData[index].label}</div>
        </div>
      ))}
    </div>
  );
};

export default CaunterBoxes;
