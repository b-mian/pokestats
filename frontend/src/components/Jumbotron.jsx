// src/components/jumbotron.js
import React from "react";
import "./styles/jumbotron.css";

export default function Jumbotron() {
  return (
    <section className="jumbo">
      <div className="jumbo__bg" aria-hidden="true" />
      <div className="jumbo__inner">
        
        <h1 className="jumbo__title">Pokéstats</h1>
        <p className="jumbo__subtitle">Pokémon by the Numbers</p>

        
        <div className="jumbo__actions">
          
        </div>
      </div>
    </section>
  );
}