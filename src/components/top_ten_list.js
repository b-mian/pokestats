import React from "react";
import { useTop10 } from "../api/hooks";

const TopTenList = ({ category, title }) => {
  const items = useTop10(category);
  return (
    <div className="list">
      <h4 className="title">Top 10 {title}</h4>
      <ol className="top-10-list">
        {items.map((row, idx) => <li key={idx}>{row.name}</li>)}
      </ol>
    </div>
  );
};

export default TopTenList;
