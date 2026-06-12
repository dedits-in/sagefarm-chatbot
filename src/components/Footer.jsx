'use client';

import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        {/* Brand col */}
        <div className={styles.footerBrand}>
          <img
            className={styles.footerLogo}
            src="https://sagefarm.in/wp-content/uploads/2025/02/cropped-Sagefarm-FINAL-TM-Garet-Bold-Garet-light-300dpi.png"
            alt="Sagefarm"
          />
          <p>CIN: U63999RJ2023PTC086462 ARN 318120</p>
          <p>
            Sagefarm is your trusted, AMFI-registered Mutual Fund Distributor.
            We bring wisdom, research, and a long-term approach to growing your
            wealth — sustainably and responsibly.
          </p>
          <div className={styles.footerSocial}>
            <a href="https://www.x.com/divyarthatpl" target="_blank" rel="noopener" title="Twitter / X">
              <svg viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/sagefarm/" target="_blank" rel="noopener" title="LinkedIn">
              <svg viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
              </svg>
            </a>
            <a href="https://www.instagram.com/sagefarm.in" target="_blank" rel="noopener" title="Instagram">
              <svg viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path>
              </svg>
            </a>
            <a href="https://www.facebook.com/sagefarm.in" target="_blank" rel="noopener" title="Facebook">
              <svg viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.footerCol}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="https://sagefarm.in/">Home</a></li>
            <li><a href="https://sagefarm.in/about/">About Us</a></li>
            <li><a href="https://sagefarm.in/our-values/">Our Values</a></li>
            <li><a href="https://sagefarm.in/our-offerings/">Our Offerings</a></li>
            <li><a href="https://sagefarm.in/contact/">Contact Us</a></li>
            <li><a href="https://sagefarm.in/book-consultation/">Book Consultation</a></li>
          </ul>
        </div>

        {/* Tools */}
        <div className={styles.footerCol}>
          <h4>Tools</h4>
          <ul>
            <li><a href="https://sagefarm.in/wealthhealth-check/">WealthHealth Check</a></li>
            <li><a href="https://sagefarm.in/risk-profile/">Risk Profile</a></li>
            <li><a href="https://sagefarm.in/calculators/">MF Calculators</a></li>
            <li><a href="https://sagefarm.in/sip-calculator/">SIP Calculator</a></li>
            <li><a href="https://sagefarm.in/sipdelaycalculator/">SIP Delay Calculator</a></li>
            <li><a href="https://sagefarm.in/stpcalculator/">STP Calculator</a></li>
            <li><a href="https://sagefarm.in/niftyaccelerator/">Nifty Accelerator</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className={styles.footerCol}>
          <h4>Contact</h4>
          <div className={styles.footerContactItem}>
            <svg viewBox="0 0 24 24">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"></path>
            </svg>
            <a href="tel:8433726774">+91 84337 26774</a>
          </div>
          <div className={styles.footerContactItem}>
            <svg viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path>
            </svg>
            <a href="mailto:invest@sagefarm.in">invest@sagefarm.in</a>
          </div>
          <div className={styles.footerContactItem}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
            </svg>
            <span>Pan India – across all pin codes</span>
          </div>
          <div className={styles.footerAmfi}>
            <strong>AMFI Registered</strong>
            Mutual Fund Distributor<br />
            ARN – 318120
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.footerBottomBar}>
        <div className={styles.footerBottom}>
          <p>© 2026. All rights reserved. SagefarmTM. Top Mutual Fund Distributor India</p>
          <div className={styles.footerBottomLinks}>
            <a href="https://sagefarm.in/">Privacy Policy</a>
            <a href="https://sagefarm.in/">Terms of Use</a>
            <a href="https://sagefarm.in/register">Register</a>
            <a href="https://sagefarm.investwell.app/app/#/login" target="_blank">Sign In</a>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className={styles.footerDisclaimer}>
        Mutual fund investments are subject to market risks. Please read all
        scheme-related documents carefully before investing. Past performance is
        not indicative of future results. Sagefarm is an AMFI Registered Mutual
        Fund Distributor.
      </div>
    </footer>
  );
}