"use client";

import React, { useRef, useEffect, useCallback, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Memoize the component to prevent unnecessary re-renders
const ThreeScene = memo(function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();

  const setupScene = useCallback(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333); // Dark Gray

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooths camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.enableZoom = true; // Allow zooming

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Create Boombox ---
    const boomboxGroup = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.BoxGeometry(2.5, 1, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.2 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    boomboxGroup.add(body);

    // Speakers (simple cylinders)
    const speakerGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
    const speakerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
    const leftSpeaker = new THREE.Mesh(speakerGeometry, speakerMaterial);
    leftSpeaker.rotation.z = Math.PI / 2;
    leftSpeaker.position.set(-0.8, 0, 0.45);
    boomboxGroup.add(leftSpeaker);

    const rightSpeaker = leftSpeaker.clone();
    rightSpeaker.position.set(0.8, 0, 0.45);
    boomboxGroup.add(rightSpeaker);

    // Handle
    const handleGeometry = new THREE.TorusGeometry(0.6, 0.08, 16, 100, Math.PI);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.3, metalness: 0.5 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.x = Math.PI;
    handle.position.y = 0.6;
    boomboxGroup.add(handle);

    // Antenna (simple cylinder)
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(1.1, 0.5, -0.3);
    antenna.rotation.z = -Math.PI / 6; // Angle it slightly
    boomboxGroup.add(antenna);


    // --- Create Microphones ---
    const microphoneGroup = new THREE.Group();

    const createMicrophone = (position: THREE.Vector3) => {
      const micGroup = new THREE.Group();

      // Handle
      const handleGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.3, roughness: 0.7 });
      const handleMesh = new THREE.Mesh(handleGeom, handleMat);
      handleMesh.position.y = -0.25; // Position relative to the mic head
      micGroup.add(handleMesh);

      // Head (Sphere)
      const headGeom = new THREE.SphereGeometry(0.1, 32, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.4 });
      const headMesh = new THREE.Mesh(headGeom, headMat);
      micGroup.add(headMesh);

      // Optional: Small ring connector
      const ringGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6, roughness: 0.5 });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.y = -0.015; // Adjust position between head and handle
      micGroup.add(ringMesh);

      micGroup.position.copy(position);
      micGroup.rotation.x = Math.PI / 12; // Slight tilt forward
      return micGroup;
    };

    const mic1 = createMicrophone(new THREE.Vector3(-0.5, -0.8, 0.8));
    const mic2 = createMicrophone(new THREE.Vector3(0.5, -0.8, 0.8));
    mic2.rotation.y = Math.PI / 8; // Angle slightly outwards
    mic1.rotation.y = -Math.PI / 8;

    microphoneGroup.add(mic1);
    microphoneGroup.add(mic2);


    // Add groups to the scene
    scene.add(boomboxGroup);
    scene.add(microphoneGroup);


    // --- Animation Loop ---
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      // Subtle rotation animation (optional)
      boomboxGroup.rotation.y += 0.002;
      microphoneGroup.rotation.y -= 0.001;

      controls.update(); // Required if controls.enableDamping or controls.autoRotate are set to true
      renderer.render(scene, camera);
    };
    animate();


    // --- Handle Resize ---
    const handleResize = () => {
      if (!currentMount) return;
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Ensure renderer.domElement exists before trying to remove
      if (renderer.domElement.parentNode === currentMount) {
          currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometries and materials if needed for complex scenes
       bodyGeometry.dispose();
       bodyMaterial.dispose();
       speakerGeometry.dispose();
       speakerMaterial.dispose();
       handleGeometry.dispose();
       handleMaterial.dispose();
       antennaGeometry.dispose();
       antennaMaterial.dispose();
       // Dispose microphone geometries/materials similarly
    };
  }, []); // Empty dependency array ensures setupScene runs once

  useEffect(() => {
    const cleanup = setupScene();
    return cleanup;
  }, [setupScene]); // useEffect depends on setupScene

  return <div ref={mountRef} className="h-full w-full" />;
});

export default ThreeScene;

