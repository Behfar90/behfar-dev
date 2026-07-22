import useInView from '../hooks/useInView';
import PortraitParticles from '../components/PortraitParticles';
import styles from './ContactMe.module.css';

export default function ContactMe() {
  const [sectionRef, isVisible] = useInView(0.1);

  const portraitClass = `${styles.portrait}${isVisible ? ` ${styles['portrait--visible']}` : ''}`;

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={portraitClass}>{isVisible && <PortraitParticles />}</div>
      <div className={styles.content}>
        <h2 className={styles.heading}>Get In Touch</h2>
        <p className={styles.text}>
          Have a project in mind or just want to say hi? Reach out at{' '}
          <a className={styles.link} href="mailto:behfar.behzad@gmail.com">
            behfar.behzad@gmail.com
          </a>
          .
        </p>
      </div>
    </section>
  );
}
