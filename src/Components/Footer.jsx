import React from 'react'
import './Footer.css'

var date = new Date();
var year = date.getFullYear();

class Footer extends React.Component {
    render() {
        return (
            <div className="footerContent">
                Oakland Schools {year}
            </div>
        );
    }
}
export default Footer