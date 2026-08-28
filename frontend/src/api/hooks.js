import { useEffect, useState } from "react";
import {
  fetchPokemon, fetchPokemonCount, fetchPokemonDetail, fetchTop10,
  fetchGenAverages, fetchTypeFrequencies, fetchTypeChart,
} from "./client";

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
        const { sort, order, limit, offset, ...countParams } = params || {};
        const [rows, total] = await Promise.all([
          fetchPokemon(params),
          fetchPokemonCount(countParams),
        ]);
        if (!cancel) {
          setData(rows);
          setCount(total.count);
          setErr(null);
        }
      } catch (e) {
        if (!cancel) setErr(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, count, loading, err };
}

export function usePokemonDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setData(null);
    (async () => {
      try {
        const d = await fetchPokemonDetail(id);
        if (!cancel) { setData(d); setErr(null); }
      } catch (e) {
        if (!cancel) setErr(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);
  return { data, loading, err };
}

// The 18x18 chart never changes — fetch once per session, share everywhere.
let typeChartCache = null;
let typeChartPromise = null;

export function useTypeChart() {
  const [chart, setChart] = useState(typeChartCache);
  useEffect(() => {
    if (typeChartCache) return;
    let cancel = false;
    if (!typeChartPromise) typeChartPromise = fetchTypeChart();
    typeChartPromise.then(c => {
      typeChartCache = c;
      if (!cancel) setChart(c);
    }).catch(() => { typeChartPromise = null; });
    return () => { cancel = true; };
  }, []);
  return chart; // null until loaded
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

export function useTypeFrequencies(slot) {
  const [data, setData] = useState([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const rows = await fetchTypeFrequencies(slot);
      if (!cancel) setData(rows);
    })();
    return () => { cancel = true; };
  }, [slot]);
  return data;
}
