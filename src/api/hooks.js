import { useEffect, useState } from "react";
import { fetchPokemon, fetchPokemonCount, fetchTop10, fetchGenAverages, fetchTypeFrequencies } from "./client";

export function usePokemon(params) {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const [rows, total] = await Promise.all([
          fetchPokemon(params),
          fetchPokemonCount(params),
        ]);
        if (!cancel) {
          setData(rows);
          setCount(total.count);
        }
      } catch (e) {
        if (!cancel) setErr(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [JSON.stringify(params)]);

  return { data, count, loading, err };
}

export function useTop10(category) {
  const [data, setData] = useState([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const rows = await fetchTop10(category);
      if (!cancel) setData(rows);
    })();
    return () => { cancel = true; };
  }, [category]);
  return data;
}

export function useGenAverages(gen) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const rows = await fetchGenAverages(gen);
      if (!cancel) setData(rows);
    })();
    return () => { cancel = true; };
  }, [gen]);
  return data;
}

export function useTypeFrequencies(slot, format) {
  const [data, setData] = useState([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const rows = await fetchTypeFrequencies(slot, format);
      if (!cancel) setData(rows);
    })();
    return () => { cancel = true; };
  }, [slot, format]);
  return data;
}