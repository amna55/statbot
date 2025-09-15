import React from "react";
import "./Header.css";

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-container">
                {/* Logo Placeholder */}
                <div className="logo">
                    {/* Replace with your SVG later */}
                    <span className="logo-text">STATBOT</span>
                </div>

                {/* Navigation */}
                <nav className="nav">
                    <ul>
                        <li><a href="#">Home</a></li>
                        <li><a href="#">Chat</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
