import React from "react";
import { useEffect, useCallback } from 'react';


let pageNum = 1;
const pokedexList = document.getElementsByClassName("pkmn-div");
const Paginate = () => {

    const paginatePokemon = useCallback(() => {
        let maxShowing = 24;
        let identifier = 1;
        for (let i=0;i<pokedexList.length;i++) {
            if (maxShowing === i) {
                maxShowing += 24;
                identifier += 1;
            }
            pokedexList[i].className += " " + String(identifier);
        } 
    },[]) 
        
    const showOrHide = useCallback(() => {
        for (let i=0;i<pokedexList.length;i++) {
            if (pokedexList[i].className !== ("pkmn-div " + String(pageNum))) {
                pokedexList[i].style.display = "none";
            }
            else {
                pokedexList[i].style.display = "inline-block";
            }
            
        }
    },[])

    useEffect(() => {
        paginatePokemon();
        showOrHide();
    }, [paginatePokemon, showOrHide])

    const handleNext = (e) => {
        e.preventDefault();
        const numPages = 31;
        if (pageNum >= numPages) {
            return;
        }
        else {
            pageNum += 1;
        }
        showOrHide();
    }

    const handlePrevious = (e) => {
        e.preventDefault();
        
        if (pageNum === 1) {
            return;
        }
        else {
            pageNum -= 1;
        }
        showOrHide();
    }
    

    return (
        <div className="table-pagination col-xs-12">
            <div className="input-group md-form form-sm form-2 pl-0 goToPage">
                <ul className="pagination input-group-append">
                    <li>
                        <button className="page-link previous-page" aria-label="Previous" onClick={handlePrevious}>
                                <span aria-hidden="true">&laquo;</span>
                                <span className="sr-only">Previous</span>
                                <span class="nav-direction">  BACK  </span>
                        </button>
                    </li>
                    <li>
                        <button className="page-link next-page" href="#" aria-label="Next" onClick={handleNext}>
                            <span class="nav-direction">  NEXT  </span>
                            <span aria-hidden="true">&raquo;</span>
                            <span className="sr-only">Next</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default Paginate;