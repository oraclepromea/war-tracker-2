import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface WeaponSpinnerProps {
  weaponType: 'missile' | 'tank' | 'aircraft' | 'ship';
  className?: string;
}

export function WeaponSpinner({ weaponType, className }: WeaponSpinnerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x0a0a0a, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create weapon geometry based on type
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (weaponType) {
      case 'missile':
        geometry = new THREE.CylinderGeometry(0.1, 0.2, 2, 8);
        material = new THREE.MeshBasicMaterial({ 
          color: 0x4ade80,
          wireframe: true 
        });
        break;
      case 'tank':
        geometry = new THREE.BoxGeometry(1.5, 0.8, 2);
        material = new THREE.MeshBasicMaterial({ 
          color: 0x4ade80,
          wireframe: true 
        });
        break;
      case 'aircraft':
        geometry = new THREE.ConeGeometry(0.3, 2, 6);
        material = new THREE.MeshBasicMaterial({ 
          color: 0x4ade80,
          wireframe: true 
        });
        break;
      case 'ship':
        geometry = new THREE.BoxGeometry(2, 0.5, 1);
        material = new THREE.MeshBasicMaterial({ 
          color: 0x4ade80,
          wireframe: true 
        });
        break;
    }

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add glow effect
    const glowGeometry = geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.scale.multiplyScalar(1.1);
    scene.add(glowMesh);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.02;
      glowMesh.rotation.x += 0.01;
      glowMesh.rotation.y += 0.02;
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [weaponType]);

  return (
    <div 
      ref={mountRef} 
      className={`w-full h-32 border border-neon-400/30 rounded bg-tactical-panel ${className}`}
    />
  );
}