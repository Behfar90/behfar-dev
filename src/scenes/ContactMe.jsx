import { useEffect, useRef, useState } from 'react';
import { FileDown, Mail } from 'lucide-react';
import useInView from '../hooks/useInView';
import PortraitParticles from '../components/PortraitParticles';
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons';
import styles from './ContactMe.module.css';

const EMAIL = 'behfar.behzad@gmail.com';

export default function ContactMe() {
  const [sectionRef, isVisible] = useInView(0.1);
  // Click-to-copy feedback on the email button - reset via a timeout rather
  // than left permanent, so a second click after the first still re-copies
  // and re-confirms instead of looking like a no-op.
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(copyTimeoutRef.current), []);

  const portraitClass = `${styles.portrait}${isVisible ? ` ${styles['portrait--visible']}` : ''}`;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context, unsupported
      // browser) - the address is still visible via the button's title, so
      // there's nothing else to fall back to here.
    }
  };

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={portraitClass}>{isVisible && <PortraitParticles />}</div>
      <div className={styles.content}>
        <h2 className={styles.heading}>Get In Touch</h2>
        <p className={styles.text}>Have a project in mind or just want to say hi?</p>

        {/* Moved in from the old .socialRail - these are the actual "get in
            touch" actions, so they belong directly under the heading/text
            that invites them, not the résumé download (see .resumeRail
            below). Icon-only (labels would crowd this narrow a row),
            title/aria-label carry the same info a visible label would. */}
        <div className={styles.contactRow}>
          <div className={styles.railItem}>
            <button
              type="button"
              className={`${styles.railLink}${copied ? ` ${styles.copied}` : ''}`}
              onClick={handleCopyEmail}
              title={EMAIL}
              aria-label={copied ? 'Email address copied' : `Copy email address ${EMAIL}`}
            >
              <Mail size={20} strokeWidth={1.5} />
            </button>
            <span
              className={`${styles.copiedLabel}${copied ? ` ${styles['copiedLabel--visible']}` : ''}`}
              aria-hidden="true"
            >
              Copied!
            </span>
          </div>
          <a
            className={styles.railLink}
            href="https://github.com/behfar90"
            target="_blank"
            rel="noreferrer"
            title="GitHub"
            aria-label="GitHub"
          >
            <GithubIcon size={20} />
          </a>
          <a
            className={styles.railLink}
            href="https://www.linkedin.com/in/behfarbehzad"
            target="_blank"
            rel="noreferrer"
            title="LinkedIn"
            aria-label="LinkedIn"
          >
            <LinkedinIcon size={20} />
          </a>
          {/* Mobile-only stand-in for .resumeRail below (hidden at this
              breakpoint - see its media query) - that rail's own mobile
              fallback used to drop to a horizontal pill pinned near the
              bottom of the scene, which collided with ScrollIdleHint's
              fixed position there. Folding it into this row instead keeps
              it in normal flow, nowhere near that fixed-position hint. */}
          <a
            className={`${styles.railLink} ${styles.resumeRowIcon}`}
            href="/resume.pdf"
            download
            title="Download Résumé"
            aria-label="Download Résumé"
          >
            <FileDown size={20} strokeWidth={1.5} />
          </a>
        </div>
      </div>

      {/* A separate, secondary action from "get in touch" above - kept off
          to the side in the old social rail's slot (icon-only, same as the
          rail items it replaced there) rather than competing with the
          actual contact CTAs for the centered column's attention. Hidden
          on mobile (see media query) in favor of .resumeRowIcon above. */}
      <div className={styles.resumeRail}>
        <a className={styles.resumeLink} href="/resume.pdf" download>
          <FileDown size={18} strokeWidth={1.5} />
          Download Résumé
        </a>
      </div>

      <p className={styles.dateline}>Oslo, 2026</p>
    </section>
  );
}
