import React, { useEffect, useState } from 'react';
import { fetchTop10 } from '../api/client';

const TopTenList = ({ category, title }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      const rows = await fetchTop10(category);
      setItems(rows);
    }
    load();
  }, [category]);

  return (
    <div className="list">
      <h4 className="title">Top 10 {title}</h4>
      <ol className="top-10-list">
        {items.map((row, index) => (
          <li key={index}>{row.name}</li>
        ))}
      </ol>
    </div>
  );
};

export default TopTenList;
