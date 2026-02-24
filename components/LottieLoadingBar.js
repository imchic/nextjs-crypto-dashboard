import styles from '@/styles/dashboard.module.css';

export default function LottieLoadingBar() {
  return (
    <div className={styles.lottieContainer}>
      <div className={styles.loadingAnimation}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
      <p>데이터를 불러오는 중입니다...</p>
    </div>
  );
}
