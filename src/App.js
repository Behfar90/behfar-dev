import "./App.css";
import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
/* Icons */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";

function App() {
  useEffect(() => {
    // Canvas
    const canvas = document.querySelector("canvas.webgl");

    // Scene
    const scene = new THREE.Scene();

    /**
     * Fonts
     */
    const fontLoader = new FontLoader();
    fontLoader.load("fonts/helvetiker_regular.typeface.json", (font) => {
      const textGeometry1 = new TextGeometry("COMING", {
        font,
        size: 0.5,
        height: 0.2,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 4,
      });
      textGeometry1.center();

      const textMaterial1 = new THREE.MeshMatcapMaterial();
      textMaterial1.wireframe = true;
      const text = new THREE.Mesh(textGeometry1, textMaterial1);
      text.lookAt(4, 4, 2);
      scene.add(text);
    });
    fontLoader.load("fonts/helvetiker_regular.typeface.json", (font) => {
      const textGeometry2 = new TextGeometry("SOON !", {
        font,
        size: 0.3,
        height: 0.1,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 4,
      });

      textGeometry2.computeBoundingBox();
      textGeometry2.translate(
        -textGeometry2.boundingBox?.max.x * 0.5,
        -textGeometry2.boundingBox?.max.y * 2,
        -textGeometry2.boundingBox?.max.z * 0.5
      );

      const textMaterial2 = new THREE.MeshMatcapMaterial();
      textMaterial2.wireframe = true;
      const text2 = new THREE.Mesh(textGeometry2, textMaterial2);
      text2.lookAt(4, 4, 2);
      scene.add(text2);
    });

    /**
     * Sphere tabs
     */
    var sphereTab = [];
    var lumiereS;
    for (var counter = 0; counter < 1000; counter++) {
      // randRadius = Math.random()*30+10;
      lumiereS = new THREE.MeshStandardMaterial({
        emissive: "#fff",
      });

      lumiereS.metalness = 0.5;
      lumiereS.roughness = 0;

      sphereTab.push(
        new THREE.Mesh(
          new THREE.SphereGeometry(Math.random() * 1, 20, 20),
          lumiereS
        )
      );
    }

    for (var sphereIdx = 0; sphereIdx < sphereTab.length; sphereIdx++) {
      sphereTab[sphereIdx].position.set(
        Math.random() * 600 - 300,
        Math.random() * 600 - 300,
        Math.random() * 600 - 300
      );
      scene.add(sphereTab[sphereIdx]);
    }

    /**
     * Galaxies
     */

    const randomIntInterval = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1) + min);
    };

    let galaxyGeometry = null;
    let galaxyMaterial = null;
    let galaxyPoints = null;

    const generateGalaxy = ({ galaxyX, galaxyY, galaxyZ }) => {
      const parameters = {
        count: randomIntInterval(5000, 20000),
        size: 0.01,
        radius: 5,
        branches: randomIntInterval(2, 9),
        spin: 1,
        randomness: 0.2,
        randomnessPower: 3,
        insideColor: "#ff6030",
        outsideColor: "#1b3984",
      };

      galaxyGeometry = new THREE.BufferGeometry();
      const galaxyPositions = new Float32Array(parameters.count * 3);
      const colors = new Float32Array(parameters.count * 3);

      const colorInside = new THREE.Color(parameters.insideColor);
      const colorOutside = new THREE.Color(parameters.outsideColor);

      for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;
        // position
        const radius = Math.random() * parameters.radius;
        const spinAngle = radius * parameters.spin;
        const branchAngle =
          ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

        const randomX =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1);
        const randomY =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1);
        const randomZ =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1);

        galaxyPositions[i3 + 0] =
          Math.cos(branchAngle + spinAngle) * radius + randomX;
        galaxyPositions[i3 + 1] = 0 + randomY;
        galaxyPositions[i3 + 2] =
          Math.sin(branchAngle + spinAngle) * radius + randomZ;

        //color
        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / parameters.radius);

        colors[i3 + 0] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
      }

      galaxyGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(galaxyPositions, 3)
      );

      galaxyGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3)
      );

      galaxyMaterial = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      });
      galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);

      galaxyPoints.position.x = galaxyX;
      galaxyPoints.position.y = galaxyY;
      galaxyPoints.position.z = galaxyZ;

      scene.add(galaxyPoints);
    };

    const galaxyParams = {
      number: 50,
    };

    const generateAllGalaxies = () => {
      for (let index = 0; index < galaxyParams.number; index++) {
        let galaxyIndex;
        if (index < 5) {
          galaxyIndex = index + 5;
        } else if (index < 15) {
          galaxyIndex = index + 10;
        } else {
          galaxyIndex = index + 15;
        }
        const positions = {
          galaxyX: randomIntInterval(galaxyIndex * -2, galaxyIndex * 2),
          galaxyY: randomIntInterval(galaxyIndex * -3, galaxyIndex * 3),
          galaxyZ: randomIntInterval(galaxyIndex * -4, galaxyIndex * 4),
        };
        generateGalaxy(positions);
      }
    };

    generateAllGalaxies();

    /**
     * Sizes
     */
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    window.addEventListener("resize", () => {
      // Update sizes
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      // Update camera
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    /**
     * Click Handler
     */

    const icon = document.querySelector(".instruction__icon");
    const iconText = document.querySelector(".instruction__text");

    // MOUSEDOWN | POINTERDOWN
    window.addEventListener("mousedown", function () {
      icon.classList.add("hold__icon");
      iconText.classList.add("hold__text");
      iconText.innerHTML = "Explore";
    });
    window.addEventListener("pointerdown", function () {
      icon.classList.add("hold__icon");
      iconText.classList.add("hold__text");
      iconText.innerHTML = "Explore";
    });

    // MOUSEUP | POINTERUP
    window.addEventListener("mouseup", function () {
      icon.classList.remove("hold__icon");
      iconText.classList.remove("hold__text");
      iconText.innerHTML = "Click & Hold";
    });
    window.addEventListener("pointerup", function () {
      icon.classList.remove("hold__icon");
      iconText.classList.remove("hold__text");
      iconText.innerHTML = "Click & Hold";
    });

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      10000
    );
    camera.position.x = 4;
    camera.position.y = 4;
    camera.position.z = 2;
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /**
     * Animate
     */
    const clock = new THREE.Clock();

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      var timer = 0.00001 * Date.now();
      for (
        var positionIdx = 0, il = sphereTab.length;
        positionIdx < il;
        positionIdx++
      ) {
        var sfere = sphereTab[positionIdx];
        sfere.position.x = 400 * Math.sin(timer + positionIdx);
        // sfere.position.z= 500 * Math.sin( timer + i * 1.1 );
        sfere.position.z = 400 * Math.sin(timer + positionIdx * 1.1);
      }

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);

      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    };

    tick();
  });

  return (
    <div>
      <canvas className="webgl"></canvas>
      <span className="instruction">
        <FontAwesomeIcon
          className="instruction__icon"
          icon={faHandPointer}
          size={"4x"}
        />
        <span className="instruction__text">Click & Hold</span>
      </span>
    </div>
  );
}

export default App;
