'use client'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function CryptoGlobe() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current
    const w = el.clientWidth
    const h = el.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    el.appendChild(renderer.domElement)

    // Scene + Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
    camera.position.z = 5

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3))
    const goldLight = new THREE.PointLight(0xf0b429, 4, 20)
    goldLight.position.set(3, 3, 3)
    scene.add(goldLight)
    const blueLight = new THREE.PointLight(0x4444ff, 3, 20)
    blueLight.position.set(-3, -2, 2)
    scene.add(blueLight)
    const redLight = new THREE.PointLight(0xff3300, 2, 20)
    redLight.position.set(2, -3, -1)
    scene.add(redLight)

    // Diamond (octahedron)
    const geo = new THREE.OctahedronGeometry(1.5, 0)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf0b429,
      metalness: 1,
      roughness: 0.05,
      emissive: 0xf0b429,
      emissiveIntensity: 0.15,
    })
    const diamond = new THREE.Mesh(geo, mat)
    scene.add(diamond)

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.08 })
    const wire = new THREE.Mesh(geo, wireMat)
    scene.add(wire)

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starVerts = []
    for (let i = 0; i < 2000; i++) {
      starVerts.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 }))
    scene.add(stars)

    // Animation
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      diamond.rotation.y += 0.008
      diamond.rotation.x += 0.003
      wire.rotation.y += 0.008
      wire.rotation.x += 0.003
      stars.rotation.y += 0.0003
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w2 = el.clientWidth
      const h2 = el.clientHeight
      camera.aspect = w2 / h2
      camera.updateProjectionMatrix()
      renderer.setSize(w2, h2)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
}
