import type { Mesh, SphereGeometry, Group, Object3DEventMap } from "three"

export type Shapes = {
  core:Mesh<SphereGeometry>| null,
  earth:Group<Object3DEventMap> | null
  earthOrbit:Group<Object3DEventMap> | null
  jupiter:Group<Object3DEventMap> | null
  jupiterOrbit:Group<Object3DEventMap> | null,
}