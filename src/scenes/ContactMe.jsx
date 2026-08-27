import { useEffect, useRef, useState } from 'react';
import { FileDown, Mail } from 'lucide-react';
import useInView from '../hooks/useInView';
import PortraitParticles from '../components/PortraitParticles';
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons';
import styles from './ContactMe.module.css';

const EMAIL = 'behfar.behzad@gmail.com';

export default function ContactMe() {
  const [sectionRef, isVisible] = useInView(0.1);
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
    } catch {}
  };

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={portraitClass}>{isVisible && <PortraitParticles />}</div>
      <div className={styles.content}>
        <h2 className={styles.heading}>Get In Touch</h2>
        <p className={styles.text}>Have a project in mind or just want to say hi?</p>

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
