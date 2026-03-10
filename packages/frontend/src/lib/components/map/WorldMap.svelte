<script lang="ts">
  import type { MapLandmark, MapConnection, MapCamp } from "$lib/api"
  import { onMount } from "svelte"
  import * as THREE from "three"
  import { OrbitControls } from "three/addons/controls/OrbitControls.js"

  interface Props {
    landmarks: MapLandmark[]
    connections: MapConnection[]
    camp: MapCamp | null
    onLandmarkClick?: (landmark: MapLandmark) => void
    onCampClick?: () => void
  }

  let { landmarks, connections, camp, onLandmarkClick, onCampClick }: Props = $props()

  let container: HTMLDivElement
  let renderer: THREE.WebGLRenderer
  let animationFrameId: number

  /** Maps landmark nodeKey to its 3D position on the ground plane. */
  const SCALE = 0.06
  const GROUND_Y = 0

  function landmarkPosition(landmark: MapLandmark): THREE.Vector3 {
    return new THREE.Vector3(
      (landmark.position.x - 175) * SCALE,
      GROUND_Y,
      (landmark.position.y - 150) * SCALE,
    )
  }

  /** Computes camp position offset from its nearest landmark. */
  function campPosition(campData: MapCamp, landmarkList: MapLandmark[]): THREE.Vector3 {
    const nearest = landmarkList.find(landmark => landmark.nodeKey === campData.nearestLandmarkKey)
    if (!nearest) return new THREE.Vector3(0, GROUND_Y, 0)

    const base = landmarkPosition(nearest)
    let hash = 0
    for (let index = 0; index < campData.name.length; index++) {
      hash = (hash * 31 + campData.name.charCodeAt(index)) | 0
    }
    const angle = ((hash % 360) * Math.PI) / 180
    const offset = campData.distanceToLandmark * SCALE * 8
    return new THREE.Vector3(base.x + Math.cos(angle) * offset, GROUND_Y, base.z + Math.sin(angle) * offset)
  }

  /** Creates a text sprite for labeling landmarks and connections. */
  function createTextSprite(text: string, fontSize = 48, color = "#e8d5b8"): THREE.Sprite {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")!
    canvas.width = 512
    canvas.height = 128
    context.font = `${fontSize}px serif`
    context.fillStyle = color
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(text, 256, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(2, 0.5, 1)
    return sprite
  }

  /** Creates a dashed line between two points. */
  function createDashedLine(start: THREE.Vector3, end: THREE.Vector3, color: number): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    const material = new THREE.LineDashedMaterial({ color, dashSize: 0.15, gapSize: 0.1, linewidth: 1 })
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    return line
  }

  onMount(() => {
    const width = container.clientWidth
    const height = 400

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1208)
    scene.fog = new THREE.Fog(0x1a1208, 12, 20)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 8, 10)
    camera.lookAt(0, 0, 0)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.target.set(0, 0, 0)
    controls.maxPolarAngle = Math.PI / 2.2
    controls.minDistance = 3
    controls.maxDistance = 18

    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xfff5e0, 0.8)
    directionalLight.position.set(5, 8, 3)
    scene.add(directionalLight)

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a1f0e })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    scene.add(ground)

    // Clickable objects for raycasting
    const clickTargets: THREE.Object3D[] = []
    const targetData = new Map<THREE.Object3D, { type: "landmark" | "camp"; landmark?: MapLandmark }>()

    // Build landmark meshes
    for (const landmark of landmarks) {
      const position = landmarkPosition(landmark)
      let mesh: THREE.Mesh

      if (landmark.type === "town") {
        const geometry = new THREE.CylinderGeometry(0.25, 0.3, 0.5, 8)
        const material = new THREE.MeshLambertMaterial({ color: 0xc8a050 })
        mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(position)
        mesh.position.y = 0.25
      } else if (landmark.type === "outpost") {
        const geometry = new THREE.BoxGeometry(0.3, 0.35, 0.3)
        const material = new THREE.MeshLambertMaterial({ color: 0x8a7050 })
        mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(position)
        mesh.position.y = 0.175
      } else {
        const geometry = new THREE.OctahedronGeometry(0.2)
        const material = new THREE.MeshLambertMaterial({ color: 0x6a8a50 })
        mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(position)
        mesh.position.y = 0.3
      }

      scene.add(mesh)
      clickTargets.push(mesh)
      targetData.set(mesh, { type: "landmark", landmark })

      const label = createTextSprite(landmark.name)
      label.position.copy(position)
      label.position.y = 0.9
      scene.add(label)
    }

    // Build connections
    for (const connection of connections) {
      const fromLandmark = landmarks.find(landmark => landmark.nodeKey === connection.from)
      const toLandmark = landmarks.find(landmark => landmark.nodeKey === connection.to)
      if (!fromLandmark || !toLandmark) continue

      const start = landmarkPosition(fromLandmark)
      const end = landmarkPosition(toLandmark)
      start.y = 0.02
      end.y = 0.02

      if (connection.classification === "trail") {
        const line = createDashedLine(start, end, 0x5a4020)
        scene.add(line)
      } else {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
        const material = new THREE.LineBasicMaterial({ color: 0x8a7040 })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
      }

      const midpoint = new THREE.Vector3().lerpVectors(start, end, 0.5)
      midpoint.y = 0.5
      const distanceLabel = createTextSprite(`${connection.distance}mi`, 36, "#8a7060")
      distanceLabel.position.copy(midpoint)
      distanceLabel.scale.set(1.2, 0.3, 1)
      scene.add(distanceLabel)
    }

    // Build camp
    if (camp) {
      const position = campPosition(camp, landmarks)

      const tentGeometry = new THREE.ConeGeometry(0.2, 0.4, 4)
      const tentMaterial = new THREE.MeshLambertMaterial({ color: 0xb08050 })
      const tent = new THREE.Mesh(tentGeometry, tentMaterial)
      tent.position.copy(position)
      tent.position.y = 0.2
      scene.add(tent)
      clickTargets.push(tent)
      targetData.set(tent, { type: "camp" })

      const campLabel = createTextSprite(camp.name, 40, "#d4b896")
      campLabel.position.copy(position)
      campLabel.position.y = 0.75
      scene.add(campLabel)

      const nearestLandmark = landmarks.find(landmark => landmark.nodeKey === camp.nearestLandmarkKey)
      if (nearestLandmark) {
        const nearestPosition = landmarkPosition(nearestLandmark)
        nearestPosition.y = 0.02
        const trailStart = position.clone()
        trailStart.y = 0.02
        const trailLine = createDashedLine(trailStart, nearestPosition, 0x5a4020)
        scene.add(trailLine)

        const trailMid = new THREE.Vector3().lerpVectors(trailStart, nearestPosition, 0.5)
        trailMid.y = 0.4
        const trailLabel = createTextSprite(`${camp.distanceToLandmark}mi`, 32, "#6a5a40")
        trailLabel.position.copy(trailMid)
        trailLabel.scale.set(1, 0.25, 1)
        scene.add(trailLabel)
      }
    }

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function handleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(clickTargets)

      if (intersects.length > 0) {
        const target = intersects[0].object
        const data = targetData.get(target)
        if (data?.type === "landmark" && data.landmark && onLandmarkClick) {
          onLandmarkClick(data.landmark)
        } else if (data?.type === "camp" && onCampClick) {
          onCampClick()
        }
      }
    }

    renderer.domElement.addEventListener("click", handleClick)
    renderer.domElement.style.cursor = "pointer"

    function animate() {
      animationFrameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    function handleResize() {
      const newWidth = container.clientWidth
      camera.aspect = newWidth / height
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, height)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("click", handleClick)
      cancelAnimationFrame(animationFrameId)
      controls.dispose()
      renderer.dispose()
    }
  })
</script>

<div class="world-map" bind:this={container}></div>

<style>
  .world-map {
    width: 100%;
    height: 400px;
    border: 1px solid #5a4020;
    margin-bottom: 2rem;
  }

  .world-map :global(canvas) {
    display: block;
  }
</style>
