import React from 'react'
import './Navbar.css'

class Navbar extends React.Component {
    render() {
        return (
            <nav className="navbar navbar-default navbar-dark bg-dark navbar-fixed-top">
                <div className="container-header">
                    <div className="navbar-header">
                        <a href="index.html">
                            <img id="os-navbar-logo" src="./os-logo.png" alt="Oakland Schools" title="Oakland Schools"></img>
                        </a>
                        <a className="navbar-brand" href="./index.html" alt="NAS Dashboard">NAS Dashboard</a>
                    </div>
                </div>
            </nav>

        );
    }
}
export default Navbar