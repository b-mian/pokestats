import React from "react";
import { useEffect } from 'react';



const Paginate = () => {
    let pageNum = 1;
    let tracker = 0;
    let pokedexList = document.getElementsByClassName("pkmn-div");
    function paginatePokemon() {
        let identifier = 1;
        for (let i=0;i<pokedexList.length;i++) {
            switch(tracker) {
                case 24:
                    identifier+=1;
                    break;
                case 48:
                    identifier+=1;
                    break;
                case 72:
                    identifier+=1;
                    break;
                case 96:
                    identifier+=1;
                    break;
                case 120:
                    identifier+=1;
                    break;
                case 144:
                    identifier+=1;
                    break;
                case 168:
                    identifier+=1;
                    break;
                default:
                    break;
            }
            tracker += 1;
            pokedexList[i].className += " " + String(identifier);
            
            
        }
        
       
    }

    function showOrHide() {
        for (let i=0;i<pokedexList.length;i++) {
            if ((pokedexList[i].className.includes(String(pageNum)) === false)) {
                pokedexList[i].style.display = "none";
            }
            else {
                pokedexList[i].style.display = "inline-block";
            }
            
        }
    }

    useEffect(() => {
        paginatePokemon();
        showOrHide();
        
    })

    const handleNext = (e) => {
        e.preventDefault();
        
        if (pageNum >= 7) {
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
                        <a className="page-link previous-page" href="#" aria-label="Previous" onClick={handlePrevious}>
                                <span aria-hidden="true">&laquo;</span>
                                <span className="sr-only">Previous</span>
                                <span class="nav-direction">  BACK  </span>
                        </a>
                    </li>
                    <li>
                        <a className="page-link next-page" href="#" aria-label="Next" onClick={handleNext}>
                            <span class="nav-direction">  NEXT  </span>
                            <span aria-hidden="true">&raquo;</span>
                            <span className="sr-only">Next</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default Paginate;