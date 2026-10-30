"""Prepare the licensed cloth-simulated source meshes for the studio rail.

Run with Blender 5.1: blender --background --python scripts/prepare-garments.py
Source provenance is recorded in ASSET_LICENSES.md. No generated garment shapes.
"""

from pathlib import Path
import json

import bpy
import bmesh
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "models"
OUTPUT.mkdir(parents=True, exist_ok=True)

SPECS = {
    "tee": ("Shirt", "Wood"),
    "long-sleeve": ("Pants", "Wood"),
    "trousers": ("Pants", "Velvet"),
}


def world_bounds(obj):
    vertices = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    return (
        Vector([min(p[i] for p in vertices) for i in range(3)]),
        Vector([max(p[i] for p in vertices) for i in range(3)]),
    )


def material(name, color, roughness, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


manifest = {}
for name, (cloth_material, hanger_material) in SPECS.items():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / "assets" / "source" / f"{name}-source.glb"))

    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    cloth = next(obj for obj in meshes if any(mat.name.startswith(cloth_material) for mat in obj.data.materials))
    hanger = next(obj for obj in meshes if any(mat.name.startswith(hanger_material) for mat in obj.data.materials))

    # The source includes several hangers offset in depth to demonstrate options.
    # Retain one shoulder support, centered INSIDE the simulated garment.
    hanger_lo, hanger_hi = world_bounds(hanger)
    hanger_depth = (hanger_lo.y + hanger_hi.y) / 2
    scale = 1.60 / (hanger_hi.x - hanger_lo.x)
    top = hanger_hi.z
    selected = [cloth, hanger]
    for obj in selected:
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = Matrix.Identity(4)
        for vertex in obj.data.vertices:
            p = world @ vertex.co
            if obj == hanger:
                p.y -= hanger_depth
            vertex.co = (p.x * scale, p.y * scale, (p.z - top) * scale - 0.30)
        obj.data.update()
        # glTF duplicates vertices at UV/normal seams. Weld positions while
        # preserving per-corner UVs before subdivision, so panels stay sewn.
        mesh = bmesh.new()
        mesh.from_mesh(obj.data)
        bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.00005)
        bmesh.ops.recalc_face_normals(mesh, faces=list(mesh.faces))
        mesh.to_mesh(obj.data)
        mesh.free()
        for polygon in obj.data.polygons:
            polygon.use_smooth = True

    cloth.name = "GarmentFabric"
    cloth.data.materials.clear()
    cloth.data.materials.append(material("GarmentFabric", (0.75, 0.75, 0.75), 0.88))
    # Smooth the existing simulated folds, preserving their authored drape.
    subdiv = cloth.modifiers.new("Smooth original cloth simulation", "SUBSURF")
    subdiv.levels = 2
    subdiv.render_levels = 2
    subdiv.boundary_smooth = "PRESERVE_CORNERS"
    solidify = cloth.modifiers.new("Fabric hem thickness", "SOLIDIFY")
    solidify.thickness = 0.003
    solidify.offset = 0

    hanger.name = "HangerShoulders"
    hanger.data.materials.clear()
    hanger.data.materials.append(material("HangerShoulders", (0.22, 0.145, 0.085), 0.63))
    bevel = hanger.modifiers.new("Soft hanger edges", "BEVEL")
    bevel.width = 0.007
    bevel.segments = 3

    bpy.ops.object.select_all(action="DESELECT")
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = cloth
    bpy.context.view_layer.update()
    lo, hi = world_bounds(cloth)
    manifest[name] = {
        "path": f"/models/{name}.glb",
        "width": round(hi.x - lo.x, 4),
        "length": round(-lo.z, 4),
        "hangerTop": -0.30,
    }
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT / f"{name}.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )

(OUTPUT / "garments.json").write_text(json.dumps(manifest, indent=2))
print("Prepared garments:", json.dumps(manifest))
