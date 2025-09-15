import "./Footer.css";

export default function Footer() {
    return (
        <div className="footer-container">
            <section className="footer-contact-heading">
                <h2>How to contact me</h2>
            </section>

            <div className="footer-links">
                <div className="footer-link-wrapper">
                    <div className="footer-link-items">
                        <a
                            href="https://reactdevamna.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <p>About me</p>
                        </a>
                    </div>
                    <div className="footer-link-items">
                        <a
                            href="mailto:amna.saad.dev@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <p>Email</p>
                        </a>
                    </div>
                    <div className="footer-link-items">
                        <a
                            href="https://www.linkedin.com/in/amnasaad"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <p>LinkedIn</p>
                        </a>
                    </div>
                </div>
            </div>

            <section className="social-media">
                <div className="social-media-wrap">
                    <small className="website-rights">StatBot © 2025</small>
                </div>
            </section>
        </div>
    );
}
