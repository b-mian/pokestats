import React from 'react';
import styled from 'styled-components';


const Container = styled.div`
    display: flex;
    margin: 0;
    padding: 0;
`;

const LeftPane = styled.div`
    min-width: 25vw;
    justify-content: center;
    text-align: center;
    margin: 0;
    padding: 0;
    background-color: rgb(238, 22, 22, 1);
    opacity: 1;
    z-index: 10;
    height: auto;
`;

const RightPane = styled.div`
    min-width: 75vw;
    background-color: white;
    margin: 0;
    padding: 0;
`;

const Splitscreen = ({left: Left, right: Right}) => {

    return (
        <Container className="pane-container">
            <LeftPane className='left-pane'>
                <Left />
            </LeftPane>
            <RightPane className='right-pane'>
                <Right />
            </RightPane>
        </Container>
    );
}

export default Splitscreen;