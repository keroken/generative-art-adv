// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");

const settings = {
  // Make the loop animated unless ?static is passed to URL
  animate: !/static/i.test(window.location.search),
  // Get a WebGL canvas rather than 2D
  context: "webgl"
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor("#fff", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);
  controls.enableZoom = false;

  // Setup your scene
  const scene = new THREE.Scene();

  // We start with a buffer geometry and then add additional attributes
  const geometry = new THREE.IcosahedronBufferGeometry(1, 2);

  const positions = geometry.getAttribute("position");
  const vertexCount = positions.count;
  const triangleCount = vertexCount / 3;

  const randomDirections = [];
  const randomStrengths = [];
  for (let i = 0; i < triangleCount; i++) {
    // Get a random unit vector
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    )
      .normalize()
      .toArray();

    // Triplicate it and turn into a flat list of x, y, z, x, y, z...
    const directions = [dir, dir, dir].flat();

    // Concat into array
    randomDirections.push(...directions);

    // Do the same but with the 1 random strength float
    const str = Math.random();
    randomStrengths.push(str, str, str);
  }

  // Define the attributes
  const randomDirectionsAttribute = new THREE.BufferAttribute(
    new Float32Array(randomDirections),
    3
  );
  geometry.addAttribute("randomDirection", randomDirectionsAttribute);

  const randomStrengthsAttribute = new THREE.BufferAttribute(
    new Float32Array(randomStrengths),
    1
  );
  geometry.addAttribute("randomStrength", randomStrengthsAttribute);

  // Here's how we define a shader material
  const material = new THREE.ShaderMaterial({
    // We need to pass some information down from the vertex to the fragment shader
    vertexShader: /* glsl */`
      uniform float explosion;
      attribute vec3 randomDirection;
      attribute float randomStrength;
      varying vec3 vOriginalPosition;
      void main () {
        vOriginalPosition = position.xyz;

        vec3 pos = position.xyz;

        pos += randomDirection * randomStrength * explosion;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
      }
    `,
    // The vertex shader is defined as a GLSL source string
    fragmentShader: /* glsl */`
      // An incoming value from the vertex shader
      varying vec3 vOriginalPosition;

      void main () {
        vec3 color = normalize(vOriginalPosition) * 0.5 + 0.5;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    // The uniforms allow us to send values down into the shader
    uniforms: {
      // The amount to push particles outward
      explosion: { value: 1 }
    },
    side: THREE.DoubleSide
  });

  // Create a mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(1);

  // Add it to the scene
  scene.add(mesh);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      material.uniforms.explosion.value =
        Math.sin(time - Math.PI / 4) * 0.5 + 0.5;

      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
