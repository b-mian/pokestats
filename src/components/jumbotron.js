import React from 'react';


const Jumbotron = () => {
    return (
        <div className="jumbotron jumbotron-fluid">
            <div className="container-fluid">
                <div className="row justify-content-center">
                    <span className="col-xs-2"><img className="pokeball" src={`/images/pokeball-img.png`} alt="pokeball"></img></span>
                    <h1 className="col-xs-6">Pokéstats</h1>
                    <span className="col-xs-2"><img className="pokeball pokeball-2" src={`/images/pokeball-img.png`} alt="pokeball"></img></span>
                </div>
                <hr className="col-xs-12"></hr>
                <div className="row justify-content-center">
                    <h3 className="col-xs-12">Pokémon by numbers</h3>
                </div>
            </div>
        </div>
    );
}

export default Jumbotron;