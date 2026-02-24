import Lottie from 'lottie-react';
import loadingAnimation from '@/public/animations/loading-bar.json';
import styles from '@/styles/dashboard.module.css';

export default function LottieLoadingBar() {
  return (
    <div className={styles.lottieContainer}>
      <Lottie 
        animationData={loadingAnimation}
        loop={true}
        autoplay={true}
        style={{ width: 200, height: 50 }}
      />
      <p>데이터를 불러오는 중입니다...</p>
    </div>
  );
}
