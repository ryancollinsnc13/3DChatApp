import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "public", "models", "game");

globalThis.FileReader = class FileReader {
  result = null;
  onloadend = null;

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const materials = {
  skin: new MeshPhysicalMaterial({ color: "#f1b891", roughness: 0.72, clearcoat: 0.06, envMapIntensity: 0.95, name: "MAT_SKIN" }),
  hair: new MeshPhysicalMaterial({ color: "#47352c", roughness: 0.58, clearcoat: 0.12, envMapIntensity: 1, name: "MAT_HAIR" }),
  outfit: new MeshPhysicalMaterial({ color: "#48a96b", roughness: 0.54, clearcoat: 0.28, sheen: 0.35, name: "MAT_OUTFIT" }),
  eye: new MeshPhysicalMaterial({ color: "#284a6e", roughness: 0.12, clearcoat: 1, envMapIntensity: 1.7, name: "MAT_EYE" }),
  blush: new MeshPhysicalMaterial({ color: "#f09a9d", roughness: 0.36, transparent: true, opacity: 0.62, name: "MAT_BLUSH" }),
  ink: new MeshStandardMaterial({ color: "#1f2933", roughness: 0.35, name: "MAT_INK" }),
  white: new MeshPhysicalMaterial({ color: "#fffdf8", roughness: 0.18, clearcoat: 0.5, envMapIntensity: 1.5, name: "MAT_WHITE" }),
  glass: new MeshPhysicalMaterial({ color: "#dff5ff", roughness: 0.04, transmission: 0.45, thickness: 0.08, clearcoat: 1, name: "MAT_GLASS" }),
  wall: new MeshPhysicalMaterial({ color: "#f7e7c8", roughness: 0.48, clearcoat: 0.38, name: "MAT_WALL" }),
  roof: new MeshPhysicalMaterial({ color: "#ec6f66", roughness: 0.32, clearcoat: 0.82, name: "MAT_ROOF" }),
  trim: new MeshPhysicalMaterial({ color: "#2f5d50", roughness: 0.44, clearcoat: 0.56, name: "MAT_TRIM" }),
  wood: new MeshPhysicalMaterial({ color: "#9b6a4c", roughness: 0.46, clearcoat: 0.35, name: "MAT_WOOD" }),
  fabric: new MeshPhysicalMaterial({ color: "#ef756c", roughness: 0.58, sheen: 0.75, clearcoat: 0.2, name: "MAT_FABRIC" }),
  floor: new MeshPhysicalMaterial({ color: "#ffe1aa", roughness: 0.52, clearcoat: 0.42, name: "MAT_FLOOR" }),
  leaf: new MeshPhysicalMaterial({ color: "#48a96b", roughness: 0.66, clearcoat: 0.15, name: "MAT_LEAF" }),
  light: new MeshPhysicalMaterial({ color: "#fff6cf", emissive: "#f2b84b", emissiveIntensity: 0.45, roughness: 0.22, clearcoat: 0.35, name: "MAT_LIGHT" }),
};

function mesh(name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const item = new Mesh(geometry, material);
  item.name = name;
  item.position.set(...position);
  item.rotation.set(...rotation);
  item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function addMirrored(group, baseName, geometry, material, x, y, z, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  group.add(mesh(`${baseName}_L`, geometry.clone(), material, [-x, y, z], rotation, scale));
  group.add(mesh(`${baseName}_R`, geometry.clone(), material, [x, y, z], [-rotation[0], -rotation[1], -rotation[2]], scale));
}

function makeSmileGeometry() {
  return new TubeGeometry(
    new CatmullRomCurve3([
      new Vector3(-0.13, 0, 0),
      new Vector3(-0.06, -0.045, 0),
      new Vector3(0.06, -0.045, 0),
      new Vector3(0.13, 0, 0),
    ]),
    18,
    0.012,
    8,
    false,
  );
}

function createCharacterAsset() {
  const group = new Group();
  group.name = "GameCharacterRig";

  const faceZ = -0.39;
  const body = mesh("BODY_OUTFIT", new CapsuleGeometry(0.16, 0.34, 16, 36), materials.outfit, [0, 0.38, 0], [0, 0, 0], [1, 1, 0.72]);
  const torsoSeam = mesh("BODY_COLLAR", new TorusGeometry(0.13, 0.01, 10, 40), materials.trim, [0, 0.63, -0.005], [Math.PI / 2, 0, 0], [1, 0.55, 1]);
  const neck = mesh("NECK_SKIN", new CylinderGeometry(0.07, 0.08, 0.13, 32), materials.skin, [0, 0.68, 0]);
  const head = mesh("HEAD_SKIN", new SphereGeometry(0.43, 72, 48), materials.skin, [0, 1.08, 0], [0, 0, 0], [0.98, 1.05, 0.86]);
  const nose = mesh("FACE_NOSE", new SphereGeometry(0.03, 24, 12), materials.skin, [0, 1.06, faceZ], [0, 0, 0], [0.78, 1, 0.62]);
  const hairCap = mesh("HAIR_CAP", new SphereGeometry(0.43, 72, 32, 0, Math.PI * 2, 0, Math.PI * 0.5), materials.hair, [0, 1.2, -0.005], [0, 0, 0], [1.02, 0.98, 0.92]);
  const hairFrontBand = mesh("HAIR_FRONT_BAND", new SphereGeometry(0.15, 36, 16), materials.hair, [0, 1.19, -0.36], [0.12, 0, 0], [1.18, 0.13, 0.18]);
  const bang = mesh("HAIR_BANG_SWEEP", new SphereGeometry(0.16, 36, 16), materials.hair, [-0.13, 1.25, -0.37], [0.12, 0, -0.54], [1.18, 0.3, 0.28]);
  const pony = mesh("HAIR_BACK_VOLUME", new SphereGeometry(0.19, 32, 16), materials.hair, [0.02, 1.04, 0.3], [0, 0, 0], [1.05, 1.2, 0.78]);
  const shortFringe = mesh("HAIR_SHORT_FRINGE", new SphereGeometry(0.15, 28, 14), materials.hair, [0.05, 1.23, -0.37], [0.08, 0, 0.05], [1.58, 0.26, 0.3]);
  const swoopLock = mesh("HAIR_SWOOP_LOCK", new SphereGeometry(0.17, 32, 14), materials.hair, [-0.18, 1.23, -0.36], [0.12, 0, -0.78], [1.7, 0.42, 0.42]);
  const mouth = mesh("FACE_MOUTH_SMILE", makeSmileGeometry(), materials.ink, [0, 0.96, faceZ - 0.01]);
  const grinFill = mesh("FACE_MOUTH_GRIN_FILL", new BoxGeometry(0.22, 0.04, 0.01), materials.white, [0, 0.95, faceZ - 0.02]);
  const glassesBridge = mesh("GLASSES_BRIDGE", new BoxGeometry(0.1, 0.012, 0.012), materials.ink, [0, 1.14, faceZ - 0.015]);

  addMirrored(group, "ARM_SKIN", new CapsuleGeometry(0.04, 0.27, 10, 20), materials.skin, 0.21, 0.4, -0.01, [0, 0, 0.24], [1, 1, 1]);
  addMirrored(group, "HAND_SKIN", new SphereGeometry(0.052, 24, 14), materials.skin, 0.29, 0.24, -0.02, [0, 0, 0], [0.98, 1, 0.92]);
  addMirrored(group, "LEG_DARK", new CapsuleGeometry(0.045, 0.21, 10, 20), materials.ink, 0.065, 0.09, 0, [0.03, 0, 0], [1, 1, 0.9]);
  addMirrored(group, "SHOE_DARK", new SphereGeometry(0.065, 24, 12), materials.ink, 0.074, -0.035, -0.04, [0, 0, 0], [1.25, 0.5, 1.55]);
  addMirrored(group, "EAR_SKIN", new SphereGeometry(0.052, 22, 12), materials.skin, 0.39, 1.07, -0.02, [0, 0, 0], [0.62, 1, 0.46]);
  addMirrored(group, "EYE", new CylinderGeometry(0.041, 0.041, 0.012, 32), materials.eye, 0.115, 1.13, faceZ - 0.012, [Math.PI / 2, 0, 0], [0.92, 1.35, 1]);
  addMirrored(group, "EYE_HIGHLIGHT", new CylinderGeometry(0.009, 0.009, 0.006, 18), materials.white, 0.102, 1.15, faceZ - 0.022, [Math.PI / 2, 0, 0]);
  addMirrored(group, "BROW", new BoxGeometry(0.082, 0.012, 0.012), materials.ink, 0.115, 1.235, faceZ - 0.012, [0, 0, 0.08]);
  addMirrored(group, "BLUSH", new CylinderGeometry(0.04, 0.04, 0.008, 24), materials.blush, 0.19, 1.035, faceZ - 0.014, [Math.PI / 2, 0, 0], [1.8, 0.72, 1]);
  addMirrored(group, "GLASSES_LENS", new TorusGeometry(0.066, 0.006, 8, 32), materials.ink, 0.108, 1.14, faceZ - 0.02, [Math.PI / 2, 0, 0]);
  addMirrored(group, "HAIR_BOB_SIDE", new SphereGeometry(0.13, 28, 14), materials.hair, 0.3, 1.05, -0.06, [0, 0, 0], [0.64, 1.38, 0.52]);

  const spikeGeometry = new ConeGeometry(0.06, 0.28, 5);
  for (let index = 0; index < 7; index += 1) {
    const offset = index - 3;
    const lean = offset * -0.13;
    group.add(mesh(
      `HAIR_SPIKE_${index}`,
      spikeGeometry.clone(),
      materials.hair,
      [offset * 0.075, 1.49 - Math.abs(offset) * 0.014, -0.1 - Math.abs(offset) * 0.018],
      [0.18, 0, lean],
      [0.92 + (index % 2) * 0.16, 0.86 + (3 - Math.abs(offset)) * 0.1, 0.92],
    ));
  }

  group.add(body, torsoSeam, neck, head, nose, hairCap, hairFrontBand, bang, pony, shortFringe, swoopLock, mouth, grinFill, glassesBridge);
  return group;
}

function createHouseAsset() {
  const group = new Group();
  group.name = "StylizedHouseKit";

  const footprint = new Shape();
  footprint.moveTo(-0.62, -0.48);
  footprint.lineTo(0.62, -0.48);
  footprint.lineTo(0.62, 0.44);
  footprint.quadraticCurveTo(0.62, 0.56, 0.5, 0.56);
  footprint.lineTo(-0.5, 0.56);
  footprint.quadraticCurveTo(-0.62, 0.56, -0.62, 0.44);
  footprint.lineTo(-0.62, -0.48);
  const bodyGeo = new ExtrudeGeometry(footprint, { depth: 0.82, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.035, bevelSegments: 5 });
  bodyGeo.center();

  group.add(mesh("HOUSE_BODY_WALL", bodyGeo, materials.wall, [0, 0.46, 0]));
  group.add(mesh("HOUSE_ROOF_MAIN", new ConeGeometry(0.95, 0.7, 4, 1, false), materials.roof, [0, 1.18, 0], [0, Math.PI / 4, 0], [1.1, 0.9, 1.1]));
  group.add(mesh("HOUSE_ROOF_CAP", new TorusGeometry(0.52, 0.035, 8, 4), materials.trim, [0, 0.86, 0], [0, Math.PI / 4, 0], [1.25, 1.25, 1.25]));
  group.add(mesh("HOUSE_DOOR", new BoxGeometry(0.3, 0.46, 0.055), materials.trim, [0, 0.25, -0.435]));
  group.add(mesh("HOUSE_DOOR_KNOB", new SphereGeometry(0.025, 16, 8), materials.light, [0.1, 0.26, -0.472]));
  addMirrored(group, "HOUSE_WINDOW", new BoxGeometry(0.22, 0.2, 0.055), materials.glass, 0.38, 0.55, -0.435);
  addMirrored(group, "HOUSE_PLANTER", new BoxGeometry(0.26, 0.08, 0.08), materials.wood, 0.38, 0.39, -0.47);
  addMirrored(group, "HOUSE_SHRUB", new SphereGeometry(0.13, 20, 12), materials.leaf, 0.72, 0.11, -0.38, [0, 0, 0], [1.2, 0.78, 1]);
  return group;
}

function createRoomShellAsset() {
  const group = new Group();
  group.name = "DollhouseRoomKit";
  group.add(mesh("ROOM_FLOOR_REFLECTIVE", new BoxGeometry(4.6, 0.08, 4), materials.floor, [0, -0.04, 0]));
  group.add(mesh("ROOM_BACK_WALL", new BoxGeometry(4.6, 2.1, 0.12), materials.wall, [0, 1.05, 1.95]));
  group.add(mesh("ROOM_LEFT_WALL", new BoxGeometry(4, 2.1, 0.12), materials.wall, [-2.24, 1.05, 0], [0, Math.PI / 2, 0]));
  group.add(mesh("ROOM_RIGHT_WALL", new BoxGeometry(4, 2.1, 0.12), materials.wall, [2.24, 1.05, 0], [0, Math.PI / 2, 0]));
  group.add(mesh("ROOM_WINDOW_FRAME", new BoxGeometry(0.98, 0.74, 0.08), materials.trim, [0, 0.83, 1.87]));
  group.add(mesh("ROOM_WINDOW_GLASS", new BoxGeometry(0.8, 0.58, 0.09), materials.glass, [0, 0.83, 1.82]));
  group.add(mesh("ROOM_RUG", new CylinderGeometry(0.8, 0.8, 0.025, 64), materials.fabric, [0, 0.025, 0], [Math.PI / 2, 0, 0], [1.25, 0.72, 1]));
  return group;
}

function createFurnitureAsset() {
  const group = new Group();
  group.name = "CozyFurnitureSet";
  group.add(mesh("SOFA_SEAT", new CapsuleGeometry(0.22, 0.68, 12, 24), materials.fabric, [-1.45, 0.28, -0.72], [Math.PI / 2, 0, Math.PI / 2], [1, 1, 1.3]));
  group.add(mesh("SOFA_BACK", new BoxGeometry(0.95, 0.62, 0.18), materials.fabric, [-1.45, 0.58, -1.02]));
  addMirrored(group, "SOFA_ARM", new CapsuleGeometry(0.12, 0.34, 10, 18), materials.fabric, 1.93, 0.36, -0.72, [0, 0, 0], [0.9, 1, 1]);
  group.add(mesh("TABLE_TOP", new CylinderGeometry(0.38, 0.38, 0.08, 48), materials.wood, [1.35, 0.24, -0.74]));
  group.add(mesh("TABLE_STEM", new CylinderGeometry(0.06, 0.08, 0.28, 24), materials.trim, [1.35, 0.09, -0.74]));
  group.add(mesh("SHELF", new BoxGeometry(1.1, 0.16, 0.48), materials.wood, [0.85, 0.16, 1.2]));
  group.add(mesh("LAMP_SHADE", new ConeGeometry(0.18, 0.25, 32, 1, true), materials.light, [-0.75, 1.28, 1.76], [Math.PI, 0, 0]));
  group.add(mesh("LAMP_STEM", new CylinderGeometry(0.02, 0.025, 0.5, 16), materials.trim, [-0.75, 1.02, 1.76]));
  return group;
}

function createPlantAsset() {
  const group = new Group();
  group.name = "DecorPlant";
  group.add(mesh("POT", new CylinderGeometry(0.16, 0.12, 0.2, 32), materials.roof, [0, 0.1, 0]));
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2;
    group.add(mesh(
      `LEAF_${index}`,
      new SphereGeometry(0.11, 16, 8),
      materials.leaf,
      [Math.cos(angle) * 0.11, 0.25 + (index % 3) * 0.04, Math.sin(angle) * 0.11],
      [0.2, angle, 0.4],
      [0.55, 1.1, 0.28],
    ));
  }
  return group;
}

async function exportGlb(name, object) {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(object, { binary: true, trs: false, onlyVisible: true });
  await writeFile(join(outDir, `${name}.glb`), Buffer.from(result));
}

await mkdir(outDir, { recursive: true });
await Promise.all([
  exportGlb("character-base", createCharacterAsset()),
  exportGlb("house-kit", createHouseAsset()),
  exportGlb("room-shell", createRoomShellAsset()),
  exportGlb("furniture-kit", createFurnitureAsset()),
  exportGlb("decor-plant", createPlantAsset()),
]);

console.log(`Built game asset library in ${outDir}`);
