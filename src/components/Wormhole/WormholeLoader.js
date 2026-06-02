import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import LineGenerator from "../../utils/wormhole/LineGenerator";
import "./WormholeLoader.css";

export default function WormholeLoader({ visible, manager }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (manager) {
      manager.onProgress = (_, loaded, total) => {
        setProgress(Math.round((loaded / total) * 100));
      };
    }
  }, [manager]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.z = 6;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const lineGenerator = new LineGenerator(camera.position.z);
    scene.add(lineGenerator);
    lineGenerator.start();

    const stopTimer = setTimeout(() => lineGenerator.stop(), 5000);

    let animFrame;
    const tick = () => {
      lineGenerator.update();
      renderer.render(scene, camera);
      animFrame = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(stopTimer);
      cancelAnimationFrame(animFrame);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={`wormhole-loader${visible ? "" : " wormhole-loader--hidden"}`}
    >
      <canvas ref={canvasRef} />
      <div className="wormhole-loader__progress">
        <span className="wormhole-loader__percent">{progress}</span>
        <span className="wormhole-loader__symbol">%</span>
      </div>
    </div>
  );
}
